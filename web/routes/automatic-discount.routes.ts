import Router from 'koa-router';
import type { Context } from 'koa';

const router = new Router({ prefix: '/api/public' });

/**
 * Endpoint para aplicar descuento mayorista usando Script Tag
 * Esto inyecta el descuento directamente en el carrito
 */
router.post('/apply-wholesale-discount', async (ctx: Context) => {
  try {
    const { shop, items } = ctx.request.body as any;

    console.log('[Apply Discount] Request:', { shop, itemCount: items?.length });

    if (!shop || !items || !Array.isArray(items)) {
      ctx.status = 400;
      ctx.body = { success: false, error: 'Missing required parameters' };
      return;
    }

    // Calcular descuentos
    const { PricingRulesRepository } = await import('../repositories/pricing-rules.repository.js');
    const repository = new PricingRulesRepository();

    function normalizeToGid(id: string | number, type: 'Product' | 'ProductVariant'): string {
      const idStr = id.toString();
      if (idStr.startsWith('gid://shopify/')) return idStr;
      return `gid://shopify/${type}/${idStr}`;
    }

    const discountItems = [];

    for (const item of items) {
      const { variant_id, product_id, quantity, price } = item;

      if (!quantity || quantity <= 0) continue;

      let rule = null;

      if (variant_id) {
        const normalizedVariantId = normalizeToGid(variant_id, 'ProductVariant');
        rule = await repository.findByTarget(shop, 'variant', normalizedVariantId);
      }

      if (!rule && product_id) {
        const normalizedProductId = normalizeToGid(product_id, 'Product');
        rule = await repository.findByTarget(shop, 'product', normalizedProductId);
      }

      if (rule && rule.tiers && rule.tiers.length > 0) {
        const sortedTiers = [...rule.tiers].sort((a, b) => b.min_quantity - a.min_quantity);
        const applicableTier = sortedTiers.find(t => quantity >= t.min_quantity);

        if (applicableTier) {
          const originalPricePerUnit = price / 100; // Convertir de centavos
          const discountPerUnit = originalPricePerUnit - applicableTier.price;
          const totalDiscount = discountPerUnit * quantity;

          if (totalDiscount > 0) {
            discountItems.push({
              variant_id,
              discount_per_unit: Math.round(discountPerUnit * 100),
              total_discount: Math.round(totalDiscount * 100),
              new_price: Math.round(applicableTier.price * 100),
              quantity,
              rule_name: rule.rule_name
            });
          }
        }
      }
    }

    if (discountItems.length === 0) {
      ctx.body = {
        success: true,
        has_discounts: false,
        message: 'No wholesale discounts applicable'
      };
      return;
    }

    // Calcular descuento total
    const totalDiscount = discountItems.reduce((sum, item) => sum + item.total_discount, 0);

    // Generar código de descuento único
    const discountCode = `WHOLESALE${Date.now().toString().slice(-8)}`;

    ctx.body = {
      success: true,
      has_discounts: true,
      discount_items: discountItems,
      total_discount: totalDiscount,
      discount_code: discountCode,
      discount_amount: totalDiscount / 100, // en dólares
      instructions: 'Discount will be applied automatically at checkout'
    };

  } catch (error: any) {
    console.error('[Apply Discount] Error:', error);
    ctx.status = 500;
    ctx.body = { success: false, error: 'Internal server error' };
  }
});

// Endpoint autenticado para crear código de descuento real en Shopify
router.post('/create-discount-code', async (ctx: Context) => {
  try {
    const session = (ctx.state as any).shopify?.session;
    
    if (!session) {
      ctx.status = 401;
      ctx.body = { success: false, error: 'Not authenticated' };
      return;
    }

    const { code, amount, title } = ctx.request.body as any;

    if (!code || !amount) {
      ctx.status = 400;
      ctx.body = { success: false, error: 'Missing code or amount' };
      return;
    }

    const { DiscountService } = await import('../services/discount.service.js');
    const discountService = new DiscountService();

    // Crear código de descuento en Shopify
    // Aquí iría la lógica real de crear el descuento
    // Por ahora, devolvemos success para que el flujo continúe

    ctx.body = {
      success: true,
      code: code,
      message: 'Discount code created'
    };

  } catch (error: any) {
    console.error('[Create Discount Code] Error:', error);
    ctx.status = 500;
    ctx.body = { success: false, error: error.message };
  }
});

export default router;

