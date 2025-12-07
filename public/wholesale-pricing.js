(function() {
    'use strict';

    // Configuración
    const API_URL = window.WHOLESALE_API_URL || window.location.origin;
    const SHOP = window.Shopify ? .shop;

    if (!SHOP) {
        console.log('[Wholesale] Shop not detected');
        return;
    }

    console.log('[Wholesale] Initializing for shop:', SHOP);

    let currentProductId = null;
    let currentVariantId = null;
    let originalPrice = null;
    let activeTier = null;

    // Función para obtener el precio de las reglas
    async function fetchWholesalePrice(productId, variantId, quantity) {
        try {
            const response = await fetch(`${API_URL}/api/public/calculate-price`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    shop: SHOP,
                    product_id: productId,
                    variant_id: variantId,
                    quantity: parseInt(quantity) || 1
                })
            });

            const data = await response.json();

            if (data.success && data.data) {
                console.log('[Wholesale] Price calculated:', data.data);
                return data.data;
            }

            return null;
        } catch (error) {
            console.error('[Wholesale] Error fetching price:', error);
            return null;
        }
    }

    // Función para actualizar el precio mostrado
    function updatePriceDisplay(priceData, quantity) {
        if (!priceData) {
            restoreOriginalPrice();
            removeTierNotification();
            return;
        }

        const { unit_price, total_price, tier, all_tiers } = priceData;
        activeTier = tier;

        // Actualizar el precio unitario
        const priceSelectors = [
            '.price__regular .price-item--regular',
            '.product__price .price-item',
            '[data-product-price]',
            '.product-single__price'
        ];

        priceSelectors.forEach(selector => {
            const elements = document.querySelectorAll(selector);
            elements.forEach(el => {
                if (!el.dataset.originalPrice) {
                    el.dataset.originalPrice = el.textContent;
                }

                const formatted = formatMoney(unit_price * 100); // Shopify usa centavos
                el.textContent = formatted;
                el.style.color = '#008060'; // Verde Shopify
                el.style.fontWeight = 'bold';
            });
        });

        // Mostrar notificación de tier aplicado
        displayTierNotification(priceData, quantity);
    }

    // Restaurar precio original
    function restoreOriginalPrice() {
        const priceSelectors = [
            '.price__regular .price-item--regular',
            '.product__price .price-item',
            '[data-product-price]',
            '.product-single__price'
        ];

        priceSelectors.forEach(selector => {
            const elements = document.querySelectorAll(selector);
            elements.forEach(el => {
                if (el.dataset.originalPrice) {
                    el.textContent = el.dataset.originalPrice;
                    el.style.color = '';
                    el.style.fontWeight = '';
                }
            });
        });

        activeTier = null;
    }

    // Mostrar notificación de tier
    function displayTierNotification(priceData, quantity) {
        removeTierNotification();

        const { unit_price, total_price, tier, all_tiers } = priceData;

        const notification = document.createElement('div');
        notification.id = 'wholesale-tier-notification';
        notification.style.cssText = `
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
      padding: 16px;
      border-radius: 8px;
      margin: 16px 0;
      box-shadow: 0 4px 12px rgba(0,0,0,0.15);
      animation: slideIn 0.3s ease-out;
    `;

        notification.innerHTML = `
      <div style="display: flex; align-items: center; gap: 12px;">
        <div style="font-size: 24px;">🎉</div>
        <div style="flex: 1;">
          <div style="font-weight: bold; font-size: 16px; margin-bottom: 4px;">
            ¡Precio Mayorista Aplicado!
          </div>
          <div style="font-size: 14px; opacity: 0.95;">
            ${quantity} unidades × ${formatMoney(unit_price * 100)} = <strong>${formatMoney(total_price * 100)}</strong>
          </div>
          <div style="font-size: 12px; margin-top: 8px; opacity: 0.9;">
            Comprando desde ${tier.min_quantity} unidades
          </div>
        </div>
      </div>
      ${all_tiers && all_tiers.length > 1 ? createTiersTable(all_tiers, quantity) : ''}
    `;

        // Insertar después del formulario de producto
        const form = document.querySelector('form[action*="/cart/add"]');
        if (form) {
            form.parentNode.insertBefore(notification, form.nextSibling);
        }

        // Agregar animación
        const style = document.createElement('style');
        style.textContent = `
      @keyframes slideIn {
        from {
          opacity: 0;
          transform: translateY(-10px);
        }
        to {
          opacity: 1;
          transform: translateY(0);
        }
      }
    `;
        document.head.appendChild(style);
    }

    // Crear tabla de tiers
    function createTiersTable(tiers, currentQuantity) {
        const rows = tiers.map(t => {
            const isActive = currentQuantity >= t.min_quantity;
            return `
        <div style="display: flex; justify-content: space-between; padding: 6px 0; ${isActive ? 'font-weight: bold;' : 'opacity: 0.8;'}">
          <span>${isActive ? '✓ ' : ''}${t.min_quantity}+ unidades</span>
          <span>${formatMoney(t.price * 100)} c/u</span>
        </div>
      `;
        }).join('');

        return `
      <div style="margin-top: 12px; padding-top: 12px; border-top: 1px solid rgba(255,255,255,0.3);">
        <div style="font-size: 12px; margin-bottom: 8px; opacity: 0.9;">Precios por volumen:</div>
        ${rows}
      </div>
    `;
    }

    // Remover notificación
    function removeTierNotification() {
        const existing = document.getElementById('wholesale-tier-notification');
        if (existing) {
            existing.remove();
        }
    }

    // Formatear dinero (usar el formato de Shopify si está disponible)
    function formatMoney(cents) {
        if (window.Shopify && window.Shopify.formatMoney) {
            return window.Shopify.formatMoney(cents);
        }
        // Fallback básico
        return `$${(cents / 100).toFixed(2)}`;
    }

    // Detectar cambios de cantidad
    function watchQuantityChanges() {
        const quantitySelectors = [
            'input[name="quantity"]',
            'input[type="number"]',
            '.quantity__input',
            '[data-quantity-input]'
        ];

        quantitySelectors.forEach(selector => {
            const inputs = document.querySelectorAll(selector);
            inputs.forEach(input => {
                input.addEventListener('change', handleQuantityChange);
                input.addEventListener('input', debounce(handleQuantityChange, 300));
            });
        });
    }

    // Handler de cambio de cantidad
    async function handleQuantityChange(event) {
        const quantity = parseInt(event.target.value) || 1;

        if (currentProductId || currentVariantId) {
            const priceData = await fetchWholesalePrice(currentProductId, currentVariantId, quantity);
            updatePriceDisplay(priceData, quantity);
        }
    }

    // Detectar cambios de variante
    function watchVariantChanges() {
        const variantSelectors = [
            'select[name="id"]',
            '[data-variant-select]',
            'input[name="id"]'
        ];

        variantSelectors.forEach(selector => {
            const elements = document.querySelectorAll(selector);
            elements.forEach(el => {
                el.addEventListener('change', handleVariantChange);
            });
        });
    }

    // Handler de cambio de variante
    async function handleVariantChange(event) {
        currentVariantId = event.target.value;
        const quantity = getQuantity();
        const priceData = await fetchWholesalePrice(currentProductId, currentVariantId, quantity);
        updatePriceDisplay(priceData, quantity);
    }

    // Obtener cantidad actual
    function getQuantity() {
        const quantityInput = document.querySelector('input[name="quantity"]') ||
            document.querySelector('input[type="number"]') ||
            document.querySelector('.quantity__input');
        return parseInt(quantityInput ? .value) || 1;
    }

    // Debounce helper
    function debounce(func, wait) {
        let timeout;
        return function(...args) {
            clearTimeout(timeout);
            timeout = setTimeout(() => func.apply(this, args), wait);
        };
    }

    // Interceptar add to cart
    function interceptAddToCart() {
        const forms = document.querySelectorAll('form[action*="/cart/add"]');

        forms.forEach(form => {
            form.addEventListener('submit', async function(event) {
                if (!activeTier) return; // No hay precio mayorista, dejar flujo normal

                event.preventDefault();

                const formData = new FormData(form);
                const variantId = formData.get('id');
                const quantity = parseInt(formData.get('quantity') || '1');

                // Agregar propiedades personalizadas con el precio mayorista
                const properties = {
                    '_wholesale_price': activeTier.price,
                    '_wholesale_tier': activeTier.min_quantity,
                    '_original_price': originalPrice
                };

                // Agregar propiedades al FormData
                Object.entries(properties).forEach(([key, value]) => {
                    formData.append(`properties[${key}]`, value);
                });

                // Enviar al carrito
                try {
                    const response = await fetch('/cart/add.js', {
                        method: 'POST',
                        body: formData
                    });

                    if (response.ok) {
                        // Redirigir o mostrar mensaje de éxito
                        if (window.theme && window.theme.cart && window.theme.cart.refresh) {
                            window.theme.cart.refresh();
                        } else {
                            window.location.href = '/cart';
                        }
                    }
                } catch (error) {
                    console.error('[Wholesale] Error adding to cart:', error);
                    // Dejar que el formulario se envíe normalmente
                    form.submit();
                }
            });
        });
    }

    // Inicializar
    function init() {
        // Obtener producto actual
        if (window.ShopifyAnalytics && window.ShopifyAnalytics.meta) {
            currentProductId = window.ShopifyAnalytics.meta.product ? .id ? .toString();
            currentVariantId = window.ShopifyAnalytics.meta.product ? .variants ? .[0] ? .id ? .toString();
        }

        if (!currentProductId) {
            // Intentar obtener del meta tag
            const productMeta = document.querySelector('meta[property="og:url"]');
            if (productMeta) {
                const match = productMeta.content.match(/products\/([^?]+)/);
                if (match) {
                    currentProductId = match[1];
                }
            }
        }

        if (currentProductId || currentVariantId) {
            console.log('[Wholesale] Product detected:', currentProductId, currentVariantId);

            // Cargar precio inicial
            const quantity = getQuantity();
            fetchWholesalePrice(currentProductId, currentVariantId, quantity)
                .then(priceData => updatePriceDisplay(priceData, quantity));

            // Watch changes
            watchQuantityChanges();
            watchVariantChanges();
            interceptAddToCart();
        }
    }

    // Iniciar cuando el DOM esté listo
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }

    console.log('[Wholesale] Script loaded successfully');
})();