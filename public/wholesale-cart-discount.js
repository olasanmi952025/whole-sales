(function() {
  'use strict';

  const SHOP = window.Shopify?.shop;
  
  if (!SHOP) return;

  console.log('[Wholesale Discount] Initializing...');

  // Obtener carrito
  async function getCurrentCart() {
    try {
      const response = await fetch('/cart.js');
      return await response.json();
    } catch (error) {
      console.error('[Wholesale Discount] Error fetching cart:', error);
      return null;
    }
  }

  // Actualizar visualización del carrito
  function updateCartDisplay(cart) {
    if (!cart || !cart.items || cart.items.length === 0) return;

    let totalWholesaleDiscount = 0;
    let itemsWithDiscount = 0;

    // Procesar cada item
    cart.items.forEach((item, index) => {
      if (item.properties && item.properties._wholesale_discount) {
        const saved = parseFloat((item.properties._wholesale_saved || '').replace('$', '')) || 0;
        totalWholesaleDiscount += saved * item.quantity;
        itemsWithDiscount++;

        // Actualizar visualización del item
        updateLineItemDisplay(item, index, saved);
      }
    });

    // Si hay descuentos, mostrar banner
    if (totalWholesaleDiscount > 0) {
      showDiscountBanner(totalWholesaleDiscount, itemsWithDiscount);
    }
  }

  // Actualizar visualización de un item
  function updateLineItemDisplay(item, index, savedPerUnit) {
    // Buscar el elemento del line item
    const selectors = [
      `.cart-item[data-index="${index}"]`,
      `.cart__row:nth-child(${index + 1})`,
      `[data-cart-item-index="${index}"]`,
      `[data-line-item-key="${item.key}"]`
    ];

    let lineElement = null;
    for (const selector of selectors) {
      lineElement = document.querySelector(selector);
      if (lineElement) break;
    }

    if (!lineElement) {
      // Fallback: buscar por variante ID o título
      const allItems = document.querySelectorAll('.cart-item, .cart__row, [class*="cart-item"]');
      lineElement = Array.from(allItems)[index];
    }

    if (!lineElement) {
      console.log('[Wholesale Discount] Could not find line element for index:', index);
      return;
    }

    // Agregar badge de descuento
    if (!lineElement.querySelector('.wholesale-discount-badge')) {
      const badge = document.createElement('div');
      badge.className = 'wholesale-discount-badge';
      badge.style.cssText = `
        display: inline-block;
        background: linear-gradient(135deg, #10b981 0%, #059669 100%);
        color: white;
        padding: 4px 12px;
        border-radius: 4px;
        font-size: 12px;
        font-weight: bold;
        margin: 8px 0;
      `;
      badge.textContent = `💰 Descuento: ${item.properties._wholesale_discount} (Ahorro: ${item.properties._wholesale_saved})`;
      
      // Insertar el badge
      const priceElement = lineElement.querySelector('.cart-item__price, .price, [class*="price"]');
      if (priceElement && priceElement.parentNode) {
        priceElement.parentNode.insertBefore(badge, priceElement.nextSibling);
      } else {
        lineElement.appendChild(badge);
      }
    }
  }

  // Mostrar banner de descuento total
  function showDiscountBanner(totalDiscount, itemCount) {
    // Remover banner anterior
    const existing = document.getElementById('wholesale-discount-banner');
    if (existing) existing.remove();

    const banner = document.createElement('div');
    banner.id = 'wholesale-discount-banner';
    banner.style.cssText = `
      background: linear-gradient(135deg, #10b981 0%, #059669 100%);
      color: white;
      padding: 16px;
      border-radius: 8px;
      margin: 16px 0;
      text-align: center;
      box-shadow: 0 4px 12px rgba(16, 185, 129, 0.3);
      animation: slideIn 0.3s ease-out;
    `;

    banner.innerHTML = `
      <div style="font-size: 18px; font-weight: bold; margin-bottom: 4px;">
        ✓ ¡Descuentos Mayoristas Aplicados!
      </div>
      <div style="font-size: 24px; font-weight: bold; margin-bottom: 4px;">
        Ahorras $${totalDiscount.toFixed(2)}
      </div>
      <div style="font-size: 13px; opacity: 0.95;">
        ${itemCount} producto${itemCount > 1 ? 's' : ''} con precio mayorista
      </div>
    `;

    // Agregar animación
    const style = document.createElement('style');
    style.textContent = `
      @keyframes slideIn {
        from { transform: translateY(-20px); opacity: 0; }
        to { transform: translateY(0); opacity: 1; }
      }
    `;
    document.head.appendChild(style);

    // Insertar banner
    const cartForm = document.querySelector('form[action="/cart"]') ||
                     document.querySelector('.cart') ||
                     document.querySelector('[data-cart]');
    
    if (cartForm) {
      cartForm.insertBefore(banner, cartForm.firstChild);
    }
  }

  // Inicializar
  async function init() {
    // Solo en página de carrito
    if (!window.location.pathname.includes('/cart')) {
      console.log('[Wholesale Discount] Not on cart page');
      return;
    }

    const cart = await getCurrentCart();
    if (cart) {
      updateCartDisplay(cart);
    }
  }

  // Ejecutar
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

  window.addEventListener('load', () => {
    setTimeout(init, 500);
  });

  // Escuchar cambios en el carrito
  document.addEventListener('cart:updated', () => {
    setTimeout(init, 300);
  });

  console.log('[Wholesale Discount] Script loaded');
})();

