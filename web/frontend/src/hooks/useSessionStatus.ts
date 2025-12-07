import { useState, useEffect } from 'react';
import { useShop } from '../context/ShopContext';

export function useSessionStatus() {
  const [needsAuth, setNeedsAuth] = useState(false);
  const [checking, setChecking] = useState(true);
  const { shop } = useShop();

  useEffect(() => {
    async function checkSession() {
      if (!shop) {
        setChecking(false);
        return;
      }

      try {
        const response = await fetch(`/api/auth/verify?shop=${encodeURIComponent(shop)}`);
        const data = await response.json();
        
        if (data.success && data.authenticated) {
          setNeedsAuth(false);
        } else {
          setNeedsAuth(true);
        }
      } catch (error) {
        console.error('Error checking session:', error);
        setNeedsAuth(true);
      } finally {
        setChecking(false);
      }
    }

    checkSession();
  }, [shop]);

  const reinstallApp = () => {
    if (shop) {
      window.location.href = `/api/auth?shop=${encodeURIComponent(shop)}`;
    }
  };

  return {
    needsAuth,
    checking,
    reinstallApp
  };
}

