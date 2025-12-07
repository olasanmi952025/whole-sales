import { useState, useCallback } from 'react';
import { useShop } from '../context/ShopContext';

interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
}

export function useApi<T>() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { shop } = useShop();

  const request = useCallback(async (
    url: string,
    options?: RequestInit
  ): Promise<T | null> => {
    setLoading(true);
    setError(null);

    try {
      // Agregar parámetro shop a la URL si no está presente
      let fullUrl = url;
      if (shop) {
        const separator = url.includes('?') ? '&' : '?';
        if (!url.includes('shop=')) {
          fullUrl = `${url}${separator}shop=${encodeURIComponent(shop)}`;
        }
      }

      const response = await fetch(fullUrl, {
        ...options,
        headers: {
          'Content-Type': 'application/json',
          ...options?.headers,
        },
        redirect: 'manual', // No seguir redirecciones automáticamente
      });

      // Si es un redirect (301, 302, etc), redirigir el navegador
      if (response.type === 'opaqueredirect' || response.status === 302 || response.status === 301) {
        const location = response.headers.get('Location');
        if (location) {
          window.location.href = location;
          return null;
        }
      }

      // Si es 401, redirigir a auth
      if (response.status === 401) {
        const data = await response.json() as ApiResponse<T>;
        if (data.authUrl) {
          window.location.href = data.authUrl;
        }
        return null;
      }

      const data = await response.json() as ApiResponse<T>;

      if (!data.success) {
        throw new Error(data.error || 'Request failed');
      }

      return data.data || null;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unknown error';
      setError(message);
      return null;
    } finally {
      setLoading(false);
    }
  }, [shop]);

  return { loading, error, request };
}

