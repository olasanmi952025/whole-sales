import { createContext, useContext, ReactNode, useEffect, useState } from 'react';

interface ShopContextType {
  shop: string | null;
  isLoading: boolean;
}

const ShopContext = createContext<ShopContextType>({
  shop: null,
  isLoading: true,
});

export function useShop() {
  return useContext(ShopContext);
}

interface ShopProviderProps {
  children: ReactNode;
}

// Extender el tipo Window para incluir nuestra variable global
declare global {
  interface Window {
    SHOPIFY_SHOP?: string;
  }
}

export function ShopProvider({ children }: ShopProviderProps) {
  const [shop, setShop] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Intentar obtener shop de múltiples fuentes (en orden de prioridad)
    
    // 1. Variable global inyectada por el servidor
    if (window.SHOPIFY_SHOP) {
      setShop(window.SHOPIFY_SHOP);
      localStorage.setItem('shopify_shop', window.SHOPIFY_SHOP);
      setIsLoading(false);
      return;
    }

    // 2. Parámetro en la URL
    const urlParams = new URLSearchParams(window.location.search);
    const shopParam = urlParams.get('shop');
    if (shopParam) {
      setShop(shopParam);
      localStorage.setItem('shopify_shop', shopParam);
      setIsLoading(false);
      return;
    }

    // 3. localStorage (sesión previa)
    const savedShop = localStorage.getItem('shopify_shop');
    if (savedShop) {
      setShop(savedShop);
      setIsLoading(false);
      return;
    }

    // 4. Si estamos en un iframe de Shopify, intentar obtener del parent
    try {
      if (window.parent !== window) {
        const parentUrl = new URLSearchParams(window.parent.location.search);
        const parentShop = parentUrl.get('shop');
        if (parentShop) {
          setShop(parentShop);
          localStorage.setItem('shopify_shop', parentShop);
          setIsLoading(false);
          return;
        }
      }
    } catch (e) {
      // Ignorar errores de cross-origin
      console.log('Cannot access parent window (expected in embedded app)');
    }

    // No se pudo obtener el shop
    setIsLoading(false);
  }, []);

  return (
    <ShopContext.Provider value={{ shop, isLoading }}>
      {children}
    </ShopContext.Provider>
  );
}

