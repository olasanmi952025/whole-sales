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
      console.log('[Wholesale Cart] No wholesale pricing to apply');
      removeWholesaleNotifications();
      return;
    }

    console.log('[Wholesale Cart] Updating display with wholesale prices', wholesaleData);

    // Actualizar cada línea del carrito
    wholesaleData.items.forEach((item, index) => {
      if (item.wholesale_line_price && item.rule_applied) {
        const cartItem = cart.items[index];
        updateLineItemDisplay(item, cartItem, index);
      }
    });

    // Actualizar subtotal del carrito
    if (wholesaleData.total_discount > 0) {
      updateCartSubtotal(cart, wholesaleData);
      displayTotalDiscount(wholesaleData.total_discount);
    }
  }

  // Actualizar display de un item individual
  function updateLineItemDisplay(item, cartItem, itemIndex) {
    if (!cartItem) {
      console.log('[Wholesale Cart] Cart item not found');
      return;
    }

    console.log('[Wholesale Cart] Updating line item:', {
      variant_id: item.variant_id,
      wholesale_price: item.wholesale_line_price,
      original_price: item.original_line_price
    });

    // Buscar el elemento en el carrito drawer
    const drawerItems = document.querySelectorAll('.cart-item, [class*="cart"], [class*="Cart"]');
    let lineElement = null;

    // Método 1: Buscar por atributos de datos
    if (!lineElement) {
      lineElement = document.querySelector(`[data-variant-id="${item.variant_id}"]`);
    }

    // Método 2: Buscar por índice (para cart drawer)
    if (!lineElement && drawerItems.length > itemIndex) {
      lineElement = drawerItems[itemIndex];
    }

    // Método 3: Buscar por key
    if (!lineElement && cartItem.key) {
      lineElement = document.querySelector(`[data-key="${cartItem.key}"]`);
    }

    if (!lineElement) {
      console.log('[Wholesale Cart] Could not find line element, trying cart drawer');
      // Para el cart drawer de Shopify, intentar buscar de manera diferente
      const allCartItems = Array.from(document.querySelectorAll('[class*="cart-item"], [class*="CartItem"]'));
      lineElement = allCartItems[itemIndex];
    }

    if (!lineElement) {
      console.log('[Wholesale Cart] Could not find line element for variant:', item.variant_id);
      return;
    }

    console.log('[Wholesale Cart] Found line element:', lineElement);

    // Buscar todos los elementos de precio en el line item
    const priceElements = lineElement.querySelectorAll(
      '.cart-item__price, .price, [class*="price"], [class*="Price"], [class*="total"]'
    );

    console.log('[Wholesale Cart] Found price elements:', priceElements.length);

    let updated = false;

    priceElements.forEach(priceElement => {
      // Evitar elementos muy anidados o que no sean el precio total
      if (priceElement.querySelector('.price')) return;

      // Guardar precio original si no existe
      if (!priceElement.dataset.originalPrice) {
        priceElement.dataset.originalPrice = priceElement.textContent.trim();
      }

      // Actualizar precio
      const formattedPrice = formatMoney(item.wholesale_line_price);
      const formattedOriginal = formatMoney(item.original_line_price);
      
      priceElement.innerHTML = `
        <span style="color: #008060; font-weight: bold; font-size: 1.1em;">
          ${formattedPrice}
        </span>
        <br>
        <span style="text-decoration: line-through; opacity: 0.6; font-size: 0.85em;">
          ${formattedOriginal}
        </span>
      `;
      
      updated = true;
      console.log('[Wholesale Cart] Updated price element');
    });

    if (updated) {
      // Agregar badge de mayorista
      addWholesaleBadge(lineElement, item.rule_applied.name);
    }
  }

  // Actualizar el subtotal del carrito
  function updateCartSubtotal(cart, wholesaleData) {
    // Calcular nuevo subtotal
    let newSubtotal = 0;
    wholesaleData.items.forEach(item => {
      newSubtotal += item.wholesale_line_price || item.original_line_price;
    });

    console.log('[Wholesale Cart] New subtotal:', newSubtotal);

    // Buscar elemento de subtotal
    const subtotalSelectors = [
      '.cart__subtotal',
      '[data-cart-subtotal]',
      '.totals__subtotal',
      '[class*="subtotal"]',
      '[class*="Subtotal"]'
    ];

    let subtotalElement = null;
    for (const selector of subtotalSelectors) {
      subtotalElement = document.querySelector(selector);
      if (subtotalElement) {
        console.log('[Wholesale Cart] Found subtotal element:', selector);
        break;
      }
    }

    if (subtotalElement) {
      if (!subtotalElement.dataset.originalSubtotal) {
        subtotalElement.dataset.originalSubtotal = subtotalElement.textContent;
      }

      subtotalElement.innerHTML = `
        <span style="color: #008060; font-weight: bold;">
          ${formatMoney(newSubtotal)}
        </span>
      `;
      console.log('[Wholesale Cart] Updated subtotal');
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

  // Recalcular y actualizar carrito
  async function refreshCartPricing() {
    console.log('[Wholesale Cart] Refreshing cart pricing...');
    const cart = await getCurrentCart();
    if (cart && cart.items.length > 0) {
      const wholesaleData = await calculateWholesaleCart(cart);
      if (wholesaleData) {
        updateCartDisplay(cart, wholesaleData);
      }
    }
  }

  // Observar apertura del cart drawer
  function watchCartDrawer() {
    // Observar cambios en el body para detectar cuando se abre el cart
    const observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        // Detectar si se agregó o modificó el cart drawer
        if (mutation.target.classList && 
            (mutation.target.classList.contains('cart') || 
             mutation.target.id === 'cart' ||
             mutation.target.getAttribute('role') === 'dialog')) {
          console.log('[Wholesale Cart] Cart drawer detected, refreshing prices');
          setTimeout(refreshCartPricing, 500);
        }
      });
    });

    observer.observe(document.body, {
      childList: true,
      subtree: true,
      attributes: true,
      attributeFilter: ['class', 'style']
    });

    console.log('[Wholesale Cart] Watching for cart drawer');
  }

  // Interceptar eventos de cart drawer
  function interceptCartEvents() {
    // Escuchar eventos de Shopify
    document.addEventListener('cart:updated', () => {
      console.log('[Wholesale Cart] Cart updated event');
      setTimeout(refreshCartPricing, 300);
    });

    document.addEventListener('cart:refresh', () => {
      console.log('[Wholesale Cart] Cart refresh event');
      setTimeout(refreshCartPricing, 300);
    });

    // Escuchar clicks en el cart icon para detectar apertura
    const cartLinks = document.querySelectorAll('[href="/cart"], [href*="cart"], .cart-link, #cart-icon-bubble');
    cartLinks.forEach(link => {
      link.addEventListener('click', () => {
        console.log('[Wholesale Cart] Cart opened via link');
        setTimeout(refreshCartPricing, 800);
      });
    });
  }

  // Inicializar
  async function init() {
    console.log('[Wholesale Cart] Initializing cart monitoring');
    
    // Esperar un poco para que el tema cargue
    setTimeout(async () => {
      // Obtener y calcular carrito inicial
      await refreshCartPricing();

      // Monitorear cambios
      watchCartChanges();
      watchCartDrawer();
      interceptCartUpdates();
      interceptCartEvents();

      console.log('[Wholesale Cart] Fully initialized');
    }, 1000);
  }

  // Iniciar cuando el DOM esté listo
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

  // También iniciar cuando la página esté completamente cargada
  window.addEventListener('load', () => {
    setTimeout(refreshCartPricing, 500);
  });

  console.log('[Wholesale Cart] Script loaded successfully');
})();

