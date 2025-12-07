(function() {
  'use strict';

  const API_URL = window.WHOLESALE_API_URL || 'https://whole-sales-production.up.railway.app';
  const SHOP = window.Shopify?.shop;
  
  if (!SHOP) return;

  console.log('[Wholesale Checkout Redirect] Activado');

  // Interceptar clicks en botones de checkout
  function interceptCheckout() {
    // Buscar todos los botones/links de checkout
    const checkoutSelectors = [
      'button[name="checkout"]',
      '[name="checkout"]',
      'input[name="checkout"]',
      '.cart__checkout',
      '[href="/checkout"]',
      '[href*="/checkout"]',
      'button[type="submit"][form*="cart"]'
    ];

    checkoutSelectors.forEach(selector => {
      document.querySelectorAll(selector).forEach(element => {
        if (element.dataset.wholesaleIntercepted) return;
        element.dataset.wholesaleIntercepted = 'true';

        element.addEventListener('click', async function(e) {
          e.preventDefault();
          e.stopPropagation();

          console.log('[Checkout Redirect] Intercepted checkout click');
          
          await handleCheckoutRedirect();
        }, true);  // useCapture = true para interceptar primero
      });
    });
  }

  async function handleCheckoutRedirect() {
    try {
      // Mostrar loading
      showLoading();

      // Obtener carrito
      const cartResponse = await fetch('/cart.js');
      const cart = await cartResponse.json();

      if (!cart.items || cart.items.length === 0) {
        window.location.href = '/checkout';
        return;
      }

      // Calcular descuentos
      const items = cart.items.map(item => ({
        variant_id: item.variant_id,
        product_id: item.product_id,
        quantity: item.quantity,
        price: item.price
      }));

      const response = await fetch(`${API_URL}/api/public/apply-wholesale-discount`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ shop: SHOP, items })
      });

      const result = await response.json();

      if (!result.success || !result.has_discounts) {
        // No hay descuentos, ir al checkout normal
        window.location.href = '/checkout';
        return;
      }

      console.log('[Checkout Redirect] Discounts calculated:', result);

      // Aplicar código de descuento y redirigir
      const discountCode = result.discount_code;
      const checkoutUrl = `/checkout?discount=${discountCode}`;

      // Guardar info en sessionStorage para mostrar después
      sessionStorage.setItem('wholesale_discount_info', JSON.stringify({
        total_discount: result.total_discount,
        discount_items: result.discount_items,
        code: discountCode
      }));

      // Redirigir al checkout con el código
      window.location.href = checkoutUrl;

    } catch (error) {
      console.error('[Checkout Redirect] Error:', error);
      // En caso de error, ir al checkout normal
      window.location.href = '/checkout';
    }
  }

  function showLoading() {
    const loading = document.createElement('div');
    loading.id = 'wholesale-loading';
    loading.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background: rgba(0,0,0,0.8);
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 99999;
    `;

    loading.innerHTML = `
      <div style="
        background: white;
        padding: 32px;
        border-radius: 12px;
        text-align: center;
        max-width: 400px;
      ">
        <div style="
          width: 50px;
          height: 50px;
          border: 4px solid #f3f3f3;
          border-top: 4px solid #667eea;
          border-radius: 50%;
          animation: spin 1s linear infinite;
          margin: 0 auto 16px;
        "></div>
        <div style="font-size: 18px; font-weight: bold; color: #333; margin-bottom: 8px;">
          Aplicando Precios Mayoristas...
        </div>
        <div style="font-size: 14px; color: #666;">
          Preparando tu descuento especial
        </div>
      </div>
      <style>
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      </style>
    `;

    document.body.appendChild(loading);
  }

  // Inicializar
  function init() {
    // Ejecutar múltiples veces para capturar elementos que se agregan dinámicamente
    interceptCheckout();
    setTimeout(interceptCheckout, 1000);
    setTimeout(interceptCheckout, 2000);

    // Observar cambios en el DOM
    const observer = new MutationObserver(() => {
      interceptCheckout();
    });

    observer.observe(document.body, {
      childList: true,
      subtree: true
    });

    console.log('[Wholesale Checkout Redirect] Initialized');
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

  window.addEventListener('load', () => {
    setTimeout(init, 500);
  });

})();

