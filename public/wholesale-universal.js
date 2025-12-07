(function() {
  'use strict';

  // Configuración
  const API_URL = window.WHOLESALE_API_URL || 'https://whole-sales-production.up.railway.app';
  const SHOP = window.Shopify?.shop;
  
  if (!SHOP) {
    console.log('[Wholesale Universal] Shop not detected');
    return;
  }

  console.log('[Wholesale Universal] Initializing for shop:', SHOP);

  // === FUNCIONES DE UTILIDAD ===

  function formatMoney(cents) {
    if (window.Shopify && window.Shopify.formatMoney) {
      return window.Shopify.formatMoney(cents);
    }
    return `$${(cents / 100).toFixed(2)}`;
  }

  function debounce(func, wait) {
    let timeout;
    return function(...args) {
      clearTimeout(timeout);
      timeout = setTimeout(() => func.apply(this, args), wait);
    };
  }

  // === API CALLS ===

  async function getCurrentCart() {
    try {
      const response = await fetch('/cart.js');
      const cart = await response.json();
      return cart;
    } catch (error) {
      console.error('[Wholesale Universal] Error fetching cart:', error);
      return null;
    }
  }

  async function calculateWholesaleCart(cart) {
    try {
      const items = cart.items.map(item => ({
        variant_id: item.variant_id,
        product_id: item.product_id,
        quantity: item.quantity,
        line_price: item.line_price
      }));

      const response = await fetch(`${API_URL}/api/public/calculate-cart`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          shop: SHOP,
          items: items
        })
      });

      const data = await response.json();
      
      if (data.success && data.data) {
        return data.data;
      }

      return null;
    } catch (error) {
      console.error('[Wholesale Universal] Error calculating prices:', error);
      return null;
    }
  }

  // === INYECCIÓN DE UI UNIVERSAL ===

  function injectWholesaleCheckoutButton(wholesaleData) {
    // Remover botón anterior si existe
    const existingButton = document.getElementById('wholesale-checkout-btn');
    if (existingButton) existingButton.remove();

    if (!wholesaleData || !wholesaleData.has_wholesale_pricing) {
      return;
    }

    const totalSavings = wholesaleData.total_discount;
    if (totalSavings <= 0) return;

    // Crear contenedor del botón
    const container = document.createElement('div');
    container.id = 'wholesale-checkout-container';
    container.style.cssText = `
      margin: 16px 0;
      padding: 16px;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      border-radius: 8px;
      color: white;
      text-align: center;
    `;

    container.innerHTML = `
      <div style="font-size: 14px; margin-bottom: 8px; opacity: 0.95;">
        🎉 ¡Precio Mayorista Disponible!
      </div>
      <div style="font-size: 20px; font-weight: bold; margin-bottom: 8px;">
        Ahorra ${formatMoney(totalSavings)}
      </div>
      <div style="font-size: 12px; margin-bottom: 12px; opacity: 0.9;">
        Tienes precios mayoristas aplicables en tu carrito
      </div>
      <button 
        id="wholesale-checkout-btn" 
        style="
          background: white;
          color: #667eea;
          border: none;
          padding: 12px 24px;
          border-radius: 6px;
          font-size: 16px;
          font-weight: bold;
          cursor: pointer;
          width: 100%;
          max-width: 300px;
          transition: transform 0.2s;
        "
        onmouseover="this.style.transform='scale(1.05)'"
        onmouseout="this.style.transform='scale(1)'"
      >
        Proceder con Precio Mayorista
      </button>
      <div style="font-size: 11px; margin-top: 8px; opacity: 0.8;">
        Los precios se ajustarán automáticamente
      </div>
    `;

    // Intentar insertar en diferentes ubicaciones según el tema
    const checkoutButton = document.querySelector('button[name="checkout"]') ||
                          document.querySelector('[name="checkout"]') ||
                          document.querySelector('.cart__checkout') ||
                          document.querySelector('[class*="checkout"]');

    if (checkoutButton) {
      // Insertar antes del botón de checkout original
      checkoutButton.parentNode.insertBefore(container, checkoutButton);
    } else {
      // Buscar el carrito
      const cartContainer = document.querySelector('.cart, [data-cart], #cart, main');
      if (cartContainer) {
        cartContainer.appendChild(container);
      }
    }

    // Agregar evento al botón
    const button = document.getElementById('wholesale-checkout-btn');
    if (button) {
      button.addEventListener('click', async () => {
        await handleWholesaleCheckout(wholesaleData);
      });
    }

    // Agregar tabla de precios
    addPricingBreakdown(container, wholesaleData);
  }

  function addPricingBreakdown(container, wholesaleData) {
    const breakdown = document.createElement('div');
    breakdown.style.cssText = `
      margin-top: 16px;
      padding-top: 16px;
      border-top: 1px solid rgba(255,255,255,0.3);
      font-size: 12px;
      text-align: left;
    `;

    let html = '<div style="font-weight: bold; margin-bottom: 8px;">Desglose de Precios:</div>';
    
    wholesaleData.items.forEach((item, index) => {
      if (item.wholesale_line_price && item.rule_applied) {
        const original = formatMoney(item.original_line_price);
        const wholesale = formatMoney(item.wholesale_line_price);
        const savings = formatMoney(item.discount);
        
        html += `
          <div style="margin-bottom: 6px; padding: 4px; background: rgba(255,255,255,0.1); border-radius: 4px;">
            <div style="display: flex; justify-content: space-between;">
              <span>Item ${index + 1}</span>
              <span>${wholesale} <del style="opacity: 0.6;">${original}</del></span>
            </div>
            <div style="font-size: 10px; opacity: 0.8; margin-top: 2px;">
              Ahorro: ${savings} con ${item.rule_applied.name}
            </div>
          </div>
        `;
      }
    });

    breakdown.innerHTML = html;
    container.appendChild(breakdown);
  }

  async function handleWholesaleCheckout(wholesaleData) {
    const button = document.getElementById('wholesale-checkout-btn');
    if (button) {
      button.disabled = true;
      button.textContent = 'Procesando...';
    }

    try {
      const cart = await getCurrentCart();
      if (!cart) {
        throw new Error('No se pudo obtener el carrito');
      }

      // Preparar items con precios mayoristas
      const items = cart.items.map((item, index) => {
        const wholesaleItem = wholesaleData.items[index];
        return {
          variant_id: item.variant_id,
          product_id: item.product_id,
          quantity: item.quantity,
          price: item.price / 100, // convertir de centavos a dólares
          title: item.title,
          wholesale_price: wholesaleItem?.wholesale_line_price ? 
            wholesaleItem.wholesale_line_price / (100 * item.quantity) : null
        };
      });

      // Por ahora, mostrar modal informativo
      // En producción, aquí se crearía un Draft Order
      showWholesaleModal(wholesaleData);

    } catch (error) {
      console.error('[Wholesale Universal] Error:', error);
      alert('Error al procesar. Por favor intenta de nuevo.');
      
      if (button) {
        button.disabled = false;
        button.textContent = 'Proceder con Precio Mayorista';
      }
    }
  }

  function showWholesaleModal(wholesaleData) {
    // Crear overlay
    const overlay = document.createElement('div');
    overlay.id = 'wholesale-modal-overlay';
    overlay.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background: rgba(0,0,0,0.7);
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 10000;
    `;

    const modal = document.createElement('div');
    modal.style.cssText = `
      background: white;
      padding: 32px;
      border-radius: 12px;
      max-width: 500px;
      width: 90%;
      max-height: 80vh;
      overflow-y: auto;
    `;

    modal.innerHTML = `
      <h2 style="margin: 0 0 16px 0; color: #333;">🎉 ¡Precios Mayoristas Aplicados!</h2>
      
      <div style="background: #f0f9ff; padding: 16px; border-radius: 8px; margin-bottom: 16px;">
        <div style="font-size: 14px; color: #666; margin-bottom: 8px;">
          Total de Ahorros:
        </div>
        <div style="font-size: 28px; font-weight: bold; color: #667eea;">
          ${formatMoney(wholesaleData.total_discount)}
        </div>
      </div>

      <div style="margin-bottom: 16px; color: #666; line-height: 1.6;">
        <p>
          <strong>Para completar tu orden con precios mayoristas:</strong>
        </p>
        <ol style="padding-left: 20px;">
          <li>Continúa con el proceso normal de checkout</li>
          <li>Los precios mayoristas se aplicarán automáticamente</li>
          <li>Verás el descuento reflejado antes de pagar</li>
        </ol>
      </div>

      <div style="display: flex; gap: 12px;">
        <button 
          id="continue-to-checkout" 
          style="
            flex: 1;
            background: #667eea;
            color: white;
            border: none;
            padding: 14px;
            border-radius: 6px;
            font-size: 16px;
            font-weight: bold;
            cursor: pointer;
          "
        >
          Continuar al Checkout
        </button>
        <button 
          id="close-modal" 
          style="
            background: #e5e7eb;
            color: #666;
            border: none;
            padding: 14px 24px;
            border-radius: 6px;
            font-size: 16px;
            cursor: pointer;
          "
        >
          Cerrar
        </button>
      </div>
    `;

    overlay.appendChild(modal);
    document.body.appendChild(overlay);

    // Eventos
    document.getElementById('continue-to-checkout').addEventListener('click', () => {
      window.location.href = '/checkout';
    });

    document.getElementById('close-modal').addEventListener('click', () => {
      overlay.remove();
    });

    overlay.addEventListener('click', (e) => {
      if (e.target === overlay) {
        overlay.remove();
      }
    });
  }

  // === INICIALIZACIÓN ===

  async function checkAndDisplayWholesalePricing() {
    const cart = await getCurrentCart();
    
    if (!cart || cart.items.length === 0) {
      console.log('[Wholesale Universal] Cart is empty');
      return;
    }

    const wholesaleData = await calculateWholesaleCart(cart);
    
    if (wholesaleData && wholesaleData.has_wholesale_pricing) {
      console.log('[Wholesale Universal] Wholesale pricing available:', wholesaleData);
      injectWholesaleCheckoutButton(wholesaleData);
    } else {
      console.log('[Wholesale Universal] No wholesale pricing available');
    }
  }

  function init() {
    console.log('[Wholesale Universal] Initializing...');

    // Verificar si estamos en la página del carrito
    const isCartPage = window.location.pathname.includes('/cart') || 
                      document.querySelector('.cart, [data-cart]');

    if (isCartPage) {
      // Ejecutar después de que el tema cargue
      setTimeout(checkAndDisplayWholesalePricing, 500);

      // Reejecutar si el carrito cambia
      document.addEventListener('cart:updated', () => {
        setTimeout(checkAndDisplayWholesalePricing, 300);
      });
    }
  }

  // Iniciar
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

  // También ejecutar cuando la página esté completamente cargada
  window.addEventListener('load', init);

  console.log('[Wholesale Universal] Script loaded');
})();

