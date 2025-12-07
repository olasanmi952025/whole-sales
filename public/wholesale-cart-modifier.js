(function() {
  'use strict';

  const API_URL = window.WHOLESALE_API_URL || 'https://whole-sales-production.up.railway.app';
  const SHOP = window.Shopify?.shop;
  
  if (!SHOP) return;

  console.log('[Wholesale Cart Modifier] Starting...');

  // Modificar cart.js para incluir note con descuentos
  async function applyWholesaleToCart() {
    try {
      // Obtener carrito actual
      const cartResponse = await fetch('/cart.js');
      const cart = await cartResponse.json();

      if (!cart.items || cart.items.length === 0) return;

      console.log('[Cart Modifier] Current cart:', cart);

      // Calcular precios mayoristas
      const items = cart.items.map(item => ({
        variant_id: item.variant_id,
        product_id: item.product_id,
        quantity: item.quantity,
        line_price: item.line_price,
        key: item.key
      }));

      const pricingResponse = await fetch(`${API_URL}/api/public/calculate-cart`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ shop: SHOP, items })
      });

      const pricing = await pricingResponse.json();

      if (!pricing.success || !pricing.data || !pricing.data.has_wholesale_pricing) {
        console.log('[Cart Modifier] No wholesale pricing applicable');
        return;
      }

      console.log('[Cart Modifier] Wholesale pricing:', pricing.data);

      // Preparar note para el carrito con información de descuentos
      let noteLines = ['=== PRECIOS MAYORISTAS ==='];
      let totalSavings = 0;

      pricing.data.items.forEach((item, index) => {
        if (item.wholesale_line_price && item.rule_applied) {
          const cartItem = cart.items[index];
          const savings = item.discount / 100;
          totalSavings += savings;

          noteLines.push(
            `${cartItem.title}: $${(item.wholesale_line_price / 100).toFixed(2)} ` +
            `(ahorro: $${savings.toFixed(2)})`
          );
        }
      });

      noteLines.push(`Total Ahorro: $${totalSavings.toFixed(2)}`);
      noteLines.push('Los precios mayoristas se aplicarán en el checkout.');

      const note = noteLines.join('\n');

      // Actualizar note del carrito
      await fetch('/cart/update.js', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          note: note,
          attributes: {
            'wholesale_discount': totalSavings.toFixed(2),
            'wholesale_applied': 'true'
          }
        })
      });

      console.log('[Cart Modifier] Cart updated with wholesale info');

      // Disparar evento para que el tema refresque
      document.dispatchEvent(new CustomEvent('cart:updated'));

      // Inyectar UI
      injectWholesaleUI(pricing.data, totalSavings);

    } catch (error) {
      console.error('[Cart Modifier] Error:', error);
    }
  }

  function injectWholesaleUI(pricingData, totalSavings) {
    // Remover UI anterior
    const existing = document.getElementById('wholesale-applied-banner');
    if (existing) existing.remove();

    // Crear banner
    const banner = document.createElement('div');
    banner.id = 'wholesale-applied-banner';
    banner.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      background: linear-gradient(135deg, #10b981 0%, #059669 100%);
      color: white;
      padding: 16px;
      text-align: center;
      z-index: 9999;
      box-shadow: 0 4px 12px rgba(0,0,0,0.15);
      animation: slideDown 0.3s ease-out;
    `;

    banner.innerHTML = `
      <div style="max-width: 1200px; margin: 0 auto;">
        <div style="font-size: 20px; font-weight: bold; margin-bottom: 4px;">
          ✓ Precios Mayoristas Aplicados
        </div>
        <div style="font-size: 14px;">
          Ahorrarás $${totalSavings.toFixed(2)} en esta compra
        </div>
      </div>
      <style>
        @keyframes slideDown {
          from {
            transform: translateY(-100%);
            opacity: 0;
          }
          to {
            transform: translateY(0);
            opacity: 1;
          }
        }
      </style>
    `;

    document.body.appendChild(banner);

    // Ajustar padding del body para el banner
    document.body.style.paddingTop = '70px';

    // Remover después de 10 segundos
    setTimeout(() => {
      banner.style.animation = 'slideDown 0.3s ease-out reverse';
      setTimeout(() => {
        banner.remove();
        document.body.style.paddingTop = '';
      }, 300);
    }, 10000);

    // Modificar botón de checkout
    modifyCheckoutButton(totalSavings);
  }

  function modifyCheckoutButton(savings) {
    const checkoutButtons = document.querySelectorAll(
      'button[name="checkout"], [name="checkout"], .cart__checkout, [href*="/checkout"]'
    );

    checkoutButtons.forEach(button => {
      if (button.dataset.wholesaleModified) return;
      button.dataset.wholesaleModified = 'true';

      // Guardar contenido original
      const originalContent = button.innerHTML || button.textContent;

      // Actualizar contenido
      if (button.tagName === 'BUTTON') {
        button.innerHTML = `
          <div style="display: flex; flex-direction: column; align-items: center; gap: 4px;">
            <span>${originalContent}</span>
            <span style="font-size: 0.85em; opacity: 0.9;">
              💰 Ahorrarás $${savings.toFixed(2)}
            </span>
          </div>
        `;
      }

      // Agregar estilo destacado
      button.style.background = 'linear-gradient(135deg, #10b981 0%, #059669 100%)';
      button.style.animation = 'pulse 2s infinite';

      const style = document.createElement('style');
      style.textContent = `
        @keyframes pulse {
          0%, 100% { transform: scale(1); }
          50% { transform: scale(1.02); }
        }
      `;
      document.head.appendChild(style);
    });
  }

  // Ejecutar cuando el DOM esté listo
  function init() {
    // Solo en página de carrito o cart drawer
    const isCartPage = window.location.pathname.includes('/cart') ||
                      document.querySelector('.cart, [data-cart]');

    if (isCartPage) {
      setTimeout(applyWholesaleToCart, 1000);

      // Reejecutar cuando el carrito cambie
      document.addEventListener('cart:updated', () => {
        setTimeout(applyWholesaleToCart, 500);
      });
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

  window.addEventListener('load', init);

  console.log('[Wholesale Cart Modifier] Loaded');
})();

