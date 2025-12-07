(function() {
  'use strict';

  // Configuración
  const API_URL = window.WHOLESALE_API_URL || 'https://whole-sales-production.up.railway.app';
  const SHOP = window.Shopify?.shop;
  
  if (!SHOP) {
    console.log('[Wholesale Cart] Shop not detected');
    return;
  }

  console.log('[Wholesale Cart] Initializing for shop:', SHOP);

  let updateTimeout = null;
  let currentCart = null;

  // Obtener carrito actual
  async function getCurrentCart() {
    try {
      const response = await fetch('/cart.js');
      const cart = await response.json();
      console.log('[Wholesale Cart] Current cart:', cart);
      return cart;
    } catch (error) {
      console.error('[Wholesale Cart] Error fetching cart:', error);
      return null;
    }
  }

  // Calcular precios mayoristas para el carrito
  async function calculateWholesaleCart(cart) {
    try {
      const items = cart.items.map(item => ({
        variant_id: item.variant_id,
        product_id: item.product_id,
        quantity: item.quantity,
        line_price: item.line_price,
        key: item.key
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
        console.log('[Wholesale Cart] Prices calculated:', data.data);
        return data.data;
      }

      return null;
    } catch (error) {
      console.error('[Wholesale Cart] Error calculating prices:', error);
      return null;
    }
  }

  // Actualizar display de precios en el carrito
  function updateCartDisplay(cart, wholesaleData) {
    if (!wholesaleData || !wholesaleData.has_wholesale_pricing) {
      removeWholesaleNotifications();
      return;
    }

    console.log('[Wholesale Cart] Updating display with wholesale prices');

    // Actualizar cada línea del carrito
    wholesaleData.items.forEach(item => {
      if (item.wholesale_line_price && item.rule_applied) {
        updateLineItemDisplay(item, cart);
      }
    });

    // Mostrar resumen de descuento total
    if (wholesaleData.total_discount > 0) {
      displayTotalDiscount(wholesaleData.total_discount);
    }
  }

  // Actualizar display de un item individual
  function updateLineItemDisplay(item, cart) {
    // Buscar el item en el DOM
    const cartItem = cart.items.find(i => i.variant_id === item.variant_id);
    if (!cartItem) return;

    const lineItemSelectors = [
      `[data-cart-item-key="${cartItem.key}"]`,
      `[data-variant-id="${item.variant_id}"]`,
      `.cart-item[data-index="${cart.items.indexOf(cartItem)}"]`
    ];

    let lineElement = null;
    for (const selector of lineItemSelectors) {
      lineElement = document.querySelector(selector);
      if (lineElement) break;
    }

    if (!lineElement) {
      console.log('[Wholesale Cart] Could not find line element for variant:', item.variant_id);
      return;
    }

    // Buscar el elemento de precio
    const priceSelectors = [
      '.cart-item__price',
      '.cart__item-price',
      '[data-cart-item-price]',
      '.line-item__price'
    ];

    let priceElement = null;
    for (const selector of priceSelectors) {
      priceElement = lineElement.querySelector(selector);
      if (priceElement) break;
    }

    if (priceElement) {
      const wholesalePrice = item.wholesale_line_price / 100;
      const originalPrice = item.original_line_price / 100;
      const discount = item.discount / 100;

      // Guardar precio original si no existe
      if (!priceElement.dataset.originalPrice) {
        priceElement.dataset.originalPrice = priceElement.textContent;
      }

      // Actualizar precio
      const formattedPrice = formatMoney(item.wholesale_line_price);
      priceElement.innerHTML = `
        <span class="wholesale-price" style="color: #008060; font-weight: bold;">
          ${formattedPrice}
        </span>
        <span class="original-price" style="text-decoration: line-through; opacity: 0.6; font-size: 0.9em; margin-left: 8px;">
          ${formatMoney(item.original_line_price)}
        </span>
      `;

      // Agregar badge de mayorista
      addWholesaleBadge(lineElement, item.rule_applied.name);
    }
  }

  // Agregar badge de precio mayorista
  function addWholesaleBadge(lineElement, ruleName) {
    // Evitar duplicados
    if (lineElement.querySelector('.wholesale-badge')) return;

    const badge = document.createElement('div');
    badge.className = 'wholesale-badge';
    badge.style.cssText = `
      display: inline-block;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
      padding: 4px 8px;
      border-radius: 4px;
      font-size: 11px;
      font-weight: bold;
      margin-top: 4px;
    `;
    badge.textContent = '💼 Precio Mayorista';
    badge.title = ruleName;

    // Insertar el badge
    const titleElement = lineElement.querySelector('.cart-item__name, .cart__item-title, [data-cart-item-title]');
    if (titleElement) {
      titleElement.parentNode.insertBefore(badge, titleElement.nextSibling);
    }
  }

  // Mostrar resumen de descuento total
  function displayTotalDiscount(discountAmount) {
    removeDiscountNotification();

    const discountDiv = document.createElement('div');
    discountDiv.id = 'wholesale-total-discount';
    discountDiv.style.cssText = `
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
      padding: 16px;
      border-radius: 8px;
      margin: 16px 0;
      text-align: center;
      box-shadow: 0 4px 12px rgba(0,0,0,0.15);
    `;

    discountDiv.innerHTML = `
      <div style="font-size: 18px; font-weight: bold; margin-bottom: 4px;">
        🎉 ¡Ahorro Mayorista!
      </div>
      <div style="font-size: 24px; font-weight: bold;">
        ${formatMoney(discountAmount)}
      </div>
      <div style="font-size: 12px; opacity: 0.9; margin-top: 4px;">
        Estás ahorrando con precios mayoristas
      </div>
    `;

    // Insertar antes del total del carrito
    const cartTotals = document.querySelector('.cart__footer, .cart-footer, [data-cart-totals]');
    if (cartTotals) {
      cartTotals.parentNode.insertBefore(discountDiv, cartTotals);
    }
  }

  // Remover notificaciones
  function removeWholesaleNotifications() {
    document.querySelectorAll('.wholesale-badge').forEach(el => el.remove());
    removeDiscountNotification();
    
    // Restaurar precios originales
    document.querySelectorAll('[data-original-price]').forEach(el => {
      if (el.dataset.originalPrice) {
        el.textContent = el.dataset.originalPrice;
        delete el.dataset.originalPrice;
      }
    });
  }

  function removeDiscountNotification() {
    const existing = document.getElementById('wholesale-total-discount');
    if (existing) existing.remove();
  }

  // Formatear dinero
  function formatMoney(cents) {
    if (window.Shopify && window.Shopify.formatMoney) {
      return window.Shopify.formatMoney(cents);
    }
    return `$${(cents / 100).toFixed(2)}`;
  }

  // Monitorear cambios en el carrito
  function watchCartChanges() {
    // Observar cambios en el DOM del carrito
    const cartContainer = document.querySelector('.cart, [data-cart], #cart');
    if (!cartContainer) {
      console.log('[Wholesale Cart] Cart container not found');
      return;
    }

    // Debounced update
    const debouncedUpdate = debounce(async () => {
      console.log('[Wholesale Cart] Cart changed, recalculating...');
      const cart = await getCurrentCart();
      if (cart) {
        const wholesaleData = await calculateWholesaleCart(cart);
        updateCartDisplay(cart, wholesaleData);
      }
    }, 500);

    // Observar cambios en inputs de cantidad
    const quantityInputs = cartContainer.querySelectorAll('input[type="number"], input[name*="quantity"]');
    quantityInputs.forEach(input => {
      input.addEventListener('change', debouncedUpdate);
      input.addEventListener('input', debounce(debouncedUpdate, 1000));
    });

    // Observar cambios en el DOM (para temas que actualizan vía AJAX)
    const observer = new MutationObserver(debouncedUpdate);
    observer.observe(cartContainer, {
      childList: true,
      subtree: true,
      attributes: false
    });

    console.log('[Wholesale Cart] Watching cart changes');
  }

  // Debounce helper
  function debounce(func, wait) {
    let timeout;
    return function(...args) {
      clearTimeout(timeout);
      timeout = setTimeout(() => func.apply(this, args), wait);
    };
  }

  // Interceptar actualizaciones del carrito
  function interceptCartUpdates() {
    // Interceptar fetch de cart/change.js
    const originalFetch = window.fetch;
    window.fetch = async function(...args) {
      const response = await originalFetch.apply(this, args);
      
      const url = args[0];
      if (typeof url === 'string' && (url.includes('/cart/change') || url.includes('/cart/update'))) {
        console.log('[Wholesale Cart] Cart update detected');
        setTimeout(async () => {
          const cart = await getCurrentCart();
          if (cart) {
            const wholesaleData = await calculateWholesaleCart(cart);
            updateCartDisplay(cart, wholesaleData);
          }
        }, 300);
      }
      
      return response;
    };
  }

  // Inicializar
  async function init() {
    console.log('[Wholesale Cart] Initializing cart monitoring');
    
    // Obtener y calcular carrito inicial
    const cart = await getCurrentCart();
    if (cart && cart.items.length > 0) {
      const wholesaleData = await calculateWholesaleCart(cart);
      updateCartDisplay(cart, wholesaleData);
    }

    // Monitorear cambios
    watchCartChanges();
    interceptCartUpdates();
  }

  // Iniciar cuando el DOM esté listo
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

  console.log('[Wholesale Cart] Script loaded successfully');
})();

