(function() {
    'use strict';

  // Configuración
  const API_URL = window.WHOLESALE_API_URL || 'https://whole-sales-production.up.railway.app';
  const SHOP = window.Shopify?.shop;
  
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

        const { discount_percentage, tier, all_tiers } = priceData;
        activeTier = tier;

        // Obtener precio original del elemento
        const priceSelectors = [
            '.price__regular .price-item--regular',
            '.product__price .price-item',
            '[data-product-price]',
            '.product-single__price'
        ];

        priceSelectors.forEach(selector => {
            const elements = document.querySelectorAll(selector);
            elements.forEach(el => {
                // Guardar precio original
                if (!el.dataset.originalPrice) {
                    el.dataset.originalPrice = el.textContent;
                }

                // Extraer precio numérico del texto original
                const originalText = el.dataset.originalPrice;
                const priceMatch = originalText.match(/[\d,]+\.?\d*/);
                if (!priceMatch) return;
                
                const originalPrice = parseFloat(priceMatch[0].replace(/,/g, ''));
                const discountedPrice = originalPrice * (1 - discount_percentage / 100);
                const formatted = formatMoney(Math.round(discountedPrice * 100));
                
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

        const { discount_percentage, tier, all_tiers } = priceData;

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
            <strong>${discount_percentage}% de descuento</strong> en compras de ${tier.min_quantity}+ unidades
          </div>
          <div style="font-size: 12px; margin-top: 8px; opacity: 0.9;">
            ${quantity} unidades con ${discount_percentage}% OFF
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
          <span>${t.discount_percentage}% OFF</span>
        </div>
      `;
        }).join('');

        return `
      <div style="margin-top: 12px; padding-top: 12px; border-top: 1px solid rgba(255,255,255,0.3);">
        <div style="font-size: 12px; margin-bottom: 8px; opacity: 0.9;">Descuentos por volumen:</div>
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
        return parseInt(quantityInput?.value || '1') || 1;
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
            // Remover listeners anteriores para evitar duplicados
            const newForm = form.cloneNode(true);
            form.parentNode.replaceChild(newForm, form);

            newForm.addEventListener('submit', async function(event) {
                // Siempre interceptar para agregar metadatos
                event.preventDefault();

                const formData = new FormData(newForm);
                const variantId = formData.get('id');
                const quantity = parseInt(formData.get('quantity') || '1');

                console.log('[Wholesale] Adding to cart:', { variantId, quantity, hasActiveTier: !!activeTier });

                // Si hay precio mayorista, agregar propiedades
                if (activeTier) {
                    const properties = {
                        '_wholesale_price': activeTier.price,
                        '_wholesale_tier': activeTier.min_quantity,
                        '_wholesale_rule': currentProductId
                    };

                    Object.entries(properties).forEach(([key, value]) => {
                        formData.append(`properties[${key}]`, value);
                    });
                }

                // Enviar al carrito
                try {
                    const response = await fetch('/cart/add.js', {
                        method: 'POST',
                        body: formData
                    });

                    if (response.ok) {
                        const result = await response.json();
                        console.log('[Wholesale] Added to cart:', result);

                        // Si hay precio mayorista, aplicar descuento
                        if (activeTier) {
                            await applyWholesaleDiscount(result, activeTier);
                        }

                        // Mostrar notificación de éxito
                        showAddToCartSuccess(quantity, activeTier);

                        // Refrescar carrito o redirigir
                        setTimeout(() => {
                            if (window.theme && window.theme.cart && window.theme.cart.refresh) {
                                window.theme.cart.refresh();
                            } else if (window.Shopify && window.Shopify.drawer) {
                                window.Shopify.drawer.open();
                            } else {
                                // Recargar la página para mostrar el carrito actualizado
                                window.location.reload();
                            }
                        }, 1000);
                    } else {
                        throw new Error('Failed to add to cart');
                    }
                } catch (error) {
                    console.error('[Wholesale] Error adding to cart:', error);
                    alert('Error al agregar al carrito. Por favor intenta de nuevo.');
                }
            });
        });
    }

    // Aplicar descuento mayorista al line item
    async function applyWholesaleDiscount(cartItem, tier) {
        try {
            // Obtener carrito actual
            const cartResponse = await fetch('/cart.js');
            const cart = await cartResponse.json();

            // Encontrar el item recién agregado
            const lineItem = cart.items.find(item => 
                item.variant_id === cartItem.variant_id || 
                item.id === cartItem.id
            );

            if (!lineItem) {
                console.log('[Wholesale] Could not find line item to apply discount');
                return;
            }

            // Calcular descuento basado en porcentaje
            const originalPrice = lineItem.original_price; // precio original en centavos
            const discountPercentage = tier.discount_percentage;
            const discountAmount = Math.round((originalPrice * discountPercentage) / 100);
            const finalPrice = originalPrice - discountAmount;

            console.log('[Wholesale] Discount calculation:', {
                original: originalPrice / 100,
                discount_percentage: discountPercentage,
                discount_amount: discountAmount / 100,
                final_price: finalPrice / 100
            });

            // Actualizar las propiedades del item para mostrar el descuento
            const updates = {
                line: lineItem.index + 1, // Shopify usa índice basado en 1
                quantity: lineItem.quantity,
                properties: {
                    '_wholesale_discount': `${discountPercentage.toFixed(2)}%`,
                    '_wholesale_saved': `$${(discountAmount / 100).toFixed(2)}`,
                    '_wholesale_tier': tier.min_quantity,
                    '_wholesale_final_price': `$${(finalPrice / 100).toFixed(2)}`
                }
            };

            // Actualizar el carrito
            await fetch('/cart/change.js', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    id: lineItem.key,
                    properties: updates.properties
                })
            });

            console.log('[Wholesale] Discount properties applied to line item');

            // Agregar nota al carrito con el descuento total
            await updateCartNote(discountAmount * lineItem.quantity);

        } catch (error) {
            console.error('[Wholesale] Error applying discount:', error);
        }
    }

    // Actualizar nota del carrito con descuentos mayoristas
    async function updateCartNote(totalDiscount) {
        try {
            const cartResponse = await fetch('/cart.js');
            const cart = await cartResponse.json();

            // Calcular descuento total de todos los items mayoristas
            let wholesaleDiscount = 0;
            cart.items.forEach(item => {
                if (item.properties && item.properties._wholesale_saved) {
                    const saved = parseFloat(item.properties._wholesale_saved.replace('$', ''));
                    wholesaleDiscount += saved * item.quantity;
                }
            });

            const note = `Descuento Mayorista: $${wholesaleDiscount.toFixed(2)}`;

            await fetch('/cart/update.js', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    note: note,
                    attributes: {
                        'wholesale_discount': wholesaleDiscount.toFixed(2)
                    }
                })
            });

            console.log('[Wholesale] Cart note updated with total discount');
        } catch (error) {
            console.error('[Wholesale] Error updating cart note:', error);
        }
    }

    // Mostrar notificación de éxito al agregar al carrito
    function showAddToCartSuccess(quantity, tier) {
        const notification = document.createElement('div');
        notification.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: linear-gradient(135deg, #28a745 0%, #20c997 100%);
            color: white;
            padding: 16px 24px;
            border-radius: 8px;
            box-shadow: 0 4px 12px rgba(0,0,0,0.2);
            z-index: 10000;
            animation: slideInRight 0.3s ease-out;
        `;

        const message = tier 
            ? `✓ ${quantity} ${quantity > 1 ? 'unidades agregadas' : 'unidad agregada'} con precio mayorista`
            : `✓ ${quantity} ${quantity > 1 ? 'unidades agregadas' : 'unidad agregada'} al carrito`;

        notification.textContent = message;
        document.body.appendChild(notification);

        // Agregar animación
        const style = document.createElement('style');
        style.textContent = `
            @keyframes slideInRight {
                from {
                    transform: translateX(400px);
                    opacity: 0;
                }
                to {
                    transform: translateX(0);
                    opacity: 1;
                }
            }
        `;
        document.head.appendChild(style);

        // Remover después de 3 segundos
        setTimeout(() => {
            notification.style.animation = 'slideInRight 0.3s ease-out reverse';
            setTimeout(() => notification.remove(), 300);
        }, 3000);
    }

    // Inicializar
    function init() {
    // Obtener producto actual
    if (window.ShopifyAnalytics && window.ShopifyAnalytics.meta && window.ShopifyAnalytics.meta.product) {
      const productGid = window.ShopifyAnalytics.meta.product.gid;
      const productId = window.ShopifyAnalytics.meta.product.id;
      
      // Priorizar el GID si está disponible, sino usar el ID
      if (productGid) {
        currentProductId = productGid;
        console.log('[Wholesale] Product GID from analytics:', productGid);
      } else if (productId) {
        currentProductId = productId.toString();
        console.log('[Wholesale] Product ID from analytics:', productId);
      }
      
      // Obtener variant ID también
      if (window.ShopifyAnalytics.meta.product.variants && window.ShopifyAnalytics.meta.product.variants[0]) {
        const variantGid = window.ShopifyAnalytics.meta.product.variants[0].gid;
        const variantId = window.ShopifyAnalytics.meta.product.variants[0].id;
        currentVariantId = variantGid || variantId?.toString();
        console.log('[Wholesale] Variant ID:', currentVariantId);
      }
    }

        if (!currentProductId) {
            // Intentar obtener del objeto window.meta si está disponible
            if (window.meta && window.meta.product && window.meta.product.id) {
                currentProductId = window.meta.product.id.toString();
                console.log('[Wholesale] Product ID from window.meta:', currentProductId);
            }
        }
        
        if (!currentProductId) {
            console.log('[Wholesale] Could not detect product ID');
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