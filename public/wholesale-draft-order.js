(function() {
  'use strict';

  const API_URL = window.WHOLESALE_API_URL || 'https://whole-sales-production.up.railway.app';
  const SHOP = window.Shopify?.shop;
  
  if (!SHOP) {
    console.log('[Wholesale Draft Order] Shop not detected');
    return;
  }

  console.log('[Wholesale Draft Order] Initializing for shop:', SHOP);

  let wholesaleButton = null;

  // Obtener carrito actual
  async function getCurrentCart() {
    try {
      const response = await fetch('/cart.js');
      return await response.json();
    } catch (error) {
      console.error('[Draft Order] Error fetching cart:', error);
      return null;
    }
  }

  // Calcular si hay precios mayoristas aplicables
  async function checkWholesalePricing(cart) {
    try {
      const items = cart.items.map(item => ({
        variant_id: item.variant_id,
        product_id: item.product_id,
        quantity: item.quantity,
        line_price: item.line_price
      }));

      const response = await fetch(`${API_URL}/api/public/calculate-cart`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ shop: SHOP, items })
      });

      const data = await response.json();
      return data.success && data.data && data.data.has_wholesale_pricing ? data.data : null;
    } catch (error) {
      console.error('[Draft Order] Error calculating pricing:', error);
      return null;
    }
  }

  // Crear Draft Order
  async function createDraftOrder(cart) {
    try {
      showLoading('Creando orden con precios mayoristas...');

      const items = cart.items.map(item => ({
        variant_id: item.variant_id,
        product_id: item.product_id,
        quantity: item.quantity,
        price: item.price,
        title: item.title
      }));

      const response = await fetch(`${API_URL}/api/public/create-draft-order`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          shop: SHOP,
          items: items,
          customer_email: cart.attributes?.email || '',
          customer_note: 'Orden creada desde el storefront con precios mayoristas'
        })
      });

      const result = await response.json();

      hideLoading();

      if (result.success && result.invoice_url) {
        console.log('[Draft Order] Created successfully:', result);
        showSuccessModal(result);
        // Redirigir al invoice después de 2 segundos
        setTimeout(() => {
          window.location.href = result.invoice_url;
        }, 2000);
      } else {
        showErrorModal(result.error || 'No se pudo crear la orden');
      }

    } catch (error) {
      console.error('[Draft Order] Error:', error);
      hideLoading();
      showErrorModal('Error al procesar la orden. Por favor intenta de nuevo.');
    }
  }

  // UI: Inyectar botón de wholesale checkout
  function injectWholesaleButton(pricingData) {
    // Remover botón anterior si existe
    if (wholesaleButton) {
      wholesaleButton.remove();
    }

    const savings = pricingData.total_discount / 100;

    // Crear contenedor del botón
    const container = document.createElement('div');
    container.id = 'wholesale-checkout-container';
    
    // Detectar si estamos en cart drawer para ajustar estilos
    const isDrawer = isCartDrawerOpen();
    
    container.style.cssText = `
      margin: ${isDrawer ? '12px' : '20px'} 0;
      padding: ${isDrawer ? '16px' : '20px'};
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      border-radius: ${isDrawer ? '8px' : '12px'};
      color: white;
      box-shadow: 0 4px 20px rgba(102, 126, 234, 0.4);
      font-size: ${isDrawer ? '13px' : '14px'};
    `;

    container.innerHTML = `
      <div style="text-align: center;">
        <div style="font-size: 24px; margin-bottom: 8px;">🎉</div>
        <div style="font-size: 20px; font-weight: bold; margin-bottom: 8px;">
          ¡Precios Mayoristas Disponibles!
        </div>
        <div style="font-size: 32px; font-weight: bold; color: #fff; margin-bottom: 8px;">
          Ahorra $${savings.toFixed(2)}
        </div>
        <div style="font-size: 14px; opacity: 0.95; margin-bottom: 16px;">
          Tienes ${pricingData.items.filter(i => i.wholesale_line_price).length} producto(s) con precio mayorista
        </div>
        <button 
          id="wholesale-checkout-btn" 
          style="
            background: white;
            color: #667eea;
            border: none;
            padding: 16px 32px;
            border-radius: 8px;
            font-size: 18px;
            font-weight: bold;
            cursor: pointer;
            width: 100%;
            max-width: 400px;
            transition: all 0.3s;
            box-shadow: 0 4px 12px rgba(0,0,0,0.2);
          "
          onmouseover="this.style.transform='translateY(-2px)'; this.style.boxShadow='0 6px 16px rgba(0,0,0,0.3)'"
          onmouseout="this.style.transform='translateY(0)'; this.style.boxShadow='0 4px 12px rgba(0,0,0,0.2)'"
        >
          Continuar con Precio Mayorista →
        </button>
        <div style="font-size: 12px; margin-top: 12px; opacity: 0.9;">
          Se creará una orden especial con tus precios de mayorista
        </div>
      </div>
      <div style="margin-top: 20px; padding-top: 20px; border-top: 1px solid rgba(255,255,255,0.3);">
        <div style="font-size: 13px; font-weight: bold; margin-bottom: 12px;">Desglose de precios:</div>
        ${pricingData.items.map((item, index) => {
          if (!item.wholesale_line_price) return '';
          const originalPrice = item.original_line_price / 100;
          const wholesalePrice = item.wholesale_line_price / 100;
          const itemSavings = item.discount / 100;
          return `
            <div style="display: flex; justify-content: space-between; margin-bottom: 8px; padding: 8px; background: rgba(255,255,255,0.1); border-radius: 6px;">
              <span style="font-size: 12px;">Producto ${index + 1}</span>
              <span style="font-size: 12px; font-weight: bold;">$${wholesalePrice.toFixed(2)} <del style="opacity: 0.7;">$${originalPrice.toFixed(2)}</del></span>
            </div>
          `;
        }).join('')}
      </div>
    `;

    wholesaleButton = container;

    // Insertar en diferentes ubicaciones dependiendo del contexto
    let inserted = false;

    // Para cart drawer, buscar ubicaciones específicas
    if (isCartDrawerOpen()) {
      const drawerSelectors = [
        '.drawer__footer',
        '[class*="cart-drawer__footer"]',
        '[class*="CartDrawer__Footer"]',
        '.cart-drawer__checkout',
        '[data-cart-footer]'
      ];

      for (const selector of drawerSelectors) {
        const footer = document.querySelector(selector);
        if (footer) {
          footer.insertBefore(container, footer.firstChild);
          inserted = true;
          console.log('[Wholesale] Injected into cart drawer footer');
          break;
        }
      }

      // Si no encuentra el footer, buscar el checkout button
      if (!inserted) {
        const checkoutButton = document.querySelector('button[name="checkout"]') ||
                              document.querySelector('[class*="checkout"]');
        if (checkoutButton && checkoutButton.parentNode) {
          checkoutButton.parentNode.insertBefore(container, checkoutButton);
          inserted = true;
          console.log('[Wholesale] Injected before checkout button in drawer');
        }
      }
    }

    // Para página de carrito completa
    if (!inserted) {
      const checkoutButton = document.querySelector('button[name="checkout"]') ||
                            document.querySelector('[name="checkout"]') ||
                            document.querySelector('.cart__checkout');

      if (checkoutButton && checkoutButton.parentNode) {
        checkoutButton.parentNode.insertBefore(container, checkoutButton);
        inserted = true;
        console.log('[Wholesale] Injected before checkout button');
        
        // Ocultar botón estándar solo en página completa
        if (!isCartDrawerOpen() && (checkoutButton.tagName === 'BUTTON' || checkoutButton.tagName === 'INPUT')) {
          checkoutButton.style.display = 'none';
        }
      }
    }

    // Fallback: buscar cualquier contenedor de carrito
    if (!inserted) {
      const cartContainers = [
        '.drawer__inner',
        '.cart-drawer__content',
        '.cart',
        '[data-cart]',
        '#cart',
        'main'
      ];

      for (const selector of cartContainers) {
        const cartContainer = document.querySelector(selector);
        if (cartContainer) {
          cartContainer.appendChild(container);
          inserted = true;
          console.log('[Wholesale] Injected into cart container:', selector);
          break;
        }
      }
    }

    if (!inserted) {
      console.error('[Wholesale] Could not find a place to inject button');
    }

    // Agregar evento al botón
    const button = document.getElementById('wholesale-checkout-btn');
    if (button) {
      button.addEventListener('click', handleWholesaleCheckout);
    }
  }

  // Handler del botón de checkout mayorista
  async function handleWholesaleCheckout() {
    const cart = await getCurrentCart();
    if (!cart || !cart.items || cart.items.length === 0) {
      alert('El carrito está vacío');
      return;
    }

    await createDraftOrder(cart);
  }

  // UI: Loading modal
  function showLoading(message) {
    const loading = document.createElement('div');
    loading.id = 'wholesale-loading-modal';
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
      z-index: 999999;
    `;

    loading.innerHTML = `
      <div style="
        background: white;
        padding: 40px;
        border-radius: 16px;
        text-align: center;
        max-width: 400px;
        box-shadow: 0 20px 60px rgba(0,0,0,0.3);
      ">
        <div style="
          width: 60px;
          height: 60px;
          border: 4px solid #f3f3f3;
          border-top: 4px solid #667eea;
          border-radius: 50%;
          animation: spin 1s linear infinite;
          margin: 0 auto 20px;
        "></div>
        <div style="font-size: 20px; font-weight: bold; color: #333; margin-bottom: 8px;">
          ${message}
        </div>
        <div style="font-size: 14px; color: #666;">
          Por favor espera un momento...
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

  function hideLoading() {
    const loading = document.getElementById('wholesale-loading-modal');
    if (loading) loading.remove();
  }

  // UI: Success modal
  function showSuccessModal(result) {
    const modal = document.createElement('div');
    modal.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background: rgba(0,0,0,0.8);
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 999999;
    `;

    modal.innerHTML = `
      <div style="
        background: white;
        padding: 40px;
        border-radius: 16px;
        text-align: center;
        max-width: 500px;
        box-shadow: 0 20px 60px rgba(0,0,0,0.3);
      ">
        <div style="font-size: 64px; margin-bottom: 16px;">✓</div>
        <div style="font-size: 24px; font-weight: bold; color: #10b981; margin-bottom: 16px;">
          ¡Orden Creada!
        </div>
        <div style="font-size: 16px; color: #666; margin-bottom: 8px;">
          Tu orden con precios mayoristas ha sido creada exitosamente.
        </div>
        <div style="font-size: 20px; font-weight: bold; color: #667eea; margin-bottom: 20px;">
          Ahorro total: $${result.total_savings.toFixed(2)}
        </div>
        <div style="font-size: 14px; color: #999;">
          Serás redirigido a la página de pago en 2 segundos...
        </div>
      </div>
    `;

    document.body.appendChild(modal);
  }

  // UI: Error modal
  function showErrorModal(errorMessage) {
    const modal = document.createElement('div');
    modal.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background: rgba(0,0,0,0.8);
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 999999;
    `;

    modal.innerHTML = `
      <div style="
        background: white;
        padding: 40px;
        border-radius: 16px;
        text-align: center;
        max-width: 500px;
        box-shadow: 0 20px 60px rgba(0,0,0,0.3);
      ">
        <div style="font-size: 64px; margin-bottom: 16px;">⚠️</div>
        <div style="font-size: 24px; font-weight: bold; color: #ef4444; margin-bottom: 16px;">
          Error
        </div>
        <div style="font-size: 16px; color: #666; margin-bottom: 24px;">
          ${errorMessage}
        </div>
        <button 
          onclick="this.parentElement.parentElement.remove()"
          style="
            background: #667eea;
            color: white;
            border: none;
            padding: 12px 24px;
            border-radius: 8px;
            font-size: 16px;
            cursor: pointer;
          "
        >
          Cerrar
        </button>
      </div>
    `;

    document.body.appendChild(modal);
  }

  // Detectar cart drawer
  function isCartDrawerOpen() {
    const cartDrawerSelectors = [
      '.drawer.active',
      '[id*="cart-drawer"]',
      '[class*="CartDrawer"]',
      '[data-cart-drawer]',
      'cart-drawer'
    ];

    for (const selector of cartDrawerSelectors) {
      const element = document.querySelector(selector);
      if (element && element.offsetParent !== null) {
        return true;
      }
    }

    return false;
  }

  // Inicializar
  async function init() {
    console.log('[Wholesale Draft Order] Checking cart...');

    // Ejecutar en página de carrito O cuando el cart drawer esté abierto
    const isCartPage = window.location.pathname.includes('/cart');
    const isDrawerOpen = isCartDrawerOpen();

    if (!isCartPage && !isDrawerOpen) {
      console.log('[Wholesale Draft Order] Not on cart page or drawer not open');
      return;
    }

    console.log('[Wholesale Draft Order] Cart detected:', { isCartPage, isDrawerOpen });

    const cart = await getCurrentCart();
    if (!cart || !cart.items || cart.items.length === 0) {
      console.log('[Wholesale Draft Order] Cart is empty');
      return;
    }

    const pricingData = await checkWholesalePricing(cart);
    if (pricingData && pricingData.has_wholesale_pricing) {
      console.log('[Wholesale Draft Order] Wholesale pricing available:', pricingData);
      injectWholesaleButton(pricingData);
    } else {
      console.log('[Wholesale Draft Order] No wholesale pricing applicable');
    }
  }

  // Ejecutar cuando esté listo
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

  // También cuando la página termine de cargar
  window.addEventListener('load', () => {
    setTimeout(init, 500);
  });

  // Escuchar cambios en el carrito
  document.addEventListener('cart:updated', () => {
    setTimeout(init, 500);
  });

  // Observar cambios en el DOM para detectar cuando se abre el cart drawer
  const observer = new MutationObserver((mutations) => {
    // Verificar si se abrió el cart drawer
    if (isCartDrawerOpen()) {
      console.log('[Wholesale Draft Order] Cart drawer opened');
      setTimeout(init, 300);
    }
  });

  // Observar cambios en el body
  observer.observe(document.body, {
    childList: true,
    subtree: true,
    attributes: true,
    attributeFilter: ['class', 'style']
  });

  // Interceptar clicks en botones de "View cart" para ejecutar después
  document.addEventListener('click', (e) => {
    const target = e.target as HTMLElement;
    if (target && (
      target.textContent?.toLowerCase().includes('cart') ||
      target.getAttribute('href')?.includes('/cart') ||
      target.classList.toString().toLowerCase().includes('cart')
    )) {
      setTimeout(init, 800);
    }
  }, true);

  console.log('[Wholesale Draft Order] Script loaded successfully');
})();

