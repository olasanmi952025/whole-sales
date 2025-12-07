import Router from 'koa-router';
import type { Context } from 'koa';

// Rutas para webhooks del carrito
const router = new Router({ prefix: '/webhooks' });

/**
 * Webhook que se ejecuta cuando se agrega un item al carrito
 * Shopify lo llama automáticamente si está configurado
 */
router.post('/cart-update', async (ctx: Context) => {
  try {
    const cart = ctx.request.body as any;
    
    console.log('[Cart Webhook] Cart updated:', {
      itemCount: cart.items?.length,
      totalPrice: cart.total_price
    });

    // Analizar items del carrito y preparar información de descuentos
    const discountInfo: any = {
      hasWholesale: false,
      discounts: [],
      totalSavings: 0
    };

    for (const item of cart.items || []) {
      const props = item.properties || {};
      
      if (props._wholesale_price) {
        const wholesalePrice = parseFloat(props._wholesale_price);
        const originalPrice = item.price / 100; // Shopify envía en centavos
        const savings = (originalPrice - wholesalePrice) * item.quantity;
        
        if (savings > 0) {
          discountInfo.hasWholesale = true;
          discountInfo.totalSavings += savings;
          discountInfo.discounts.push({
            variantId: item.variant_id,
            savings: savings,
            wholesalePrice: wholesalePrice,
            quantity: item.quantity
          });
        }
      }
    }

    // Devolver información de descuentos que el frontend puede usar
    ctx.body = {
      success: true,
      discount_info: discountInfo
    };

  } catch (error: any) {
    console.error('[Cart Webhook] Error:', error);
    ctx.status = 500;
    ctx.body = { success: false, error: error.message };
  }
});

export default router;

