import Router from 'koa-router';
import { PricingRulesController } from '../controllers/pricing-rules.controller.js';

// Rutas públicas (sin autenticación) para el storefront
const router = new Router({ prefix: '/api/public' });

const pricingRulesController = new PricingRulesController();

// Función helper para normalizar IDs a formato GID
function normalizeToGid(id: string | number, type: 'Product' | 'ProductVariant'): string {
  const idStr = id.toString();
  
  // Si ya es un GID, devolverlo tal cual
  if (idStr.startsWith('gid://shopify/')) {
    return idStr;
  }
  
  // Si es solo un número, construir el GID
  return `gid://shopify/${type}/${idStr}`;
}

// Endpoint público para calcular precios desde el storefront
router.post('/calculate-price', async (ctx) => {
  try {
    const { shop, product_id, variant_id, quantity } = ctx.request.body as any;

    console.log('[Calculate Price] Request:', { shop, product_id, variant_id, quantity });

    if (!shop || !quantity) {
      ctx.status = 400;
      ctx.body = { success: false, error: 'Missing required parameters: shop, quantity' };
      return;
    }

    // Intentar buscar regla por variant primero, luego por producto
    let rule = null;
    const { PricingRulesRepository } = await import('../repositories/pricing-rules.repository.js');
    const repository = new PricingRulesRepository();

    if (variant_id) {
      const normalizedVariantId = normalizeToGid(variant_id, 'ProductVariant');
      console.log('[Calculate Price] Looking for variant rule:', normalizedVariantId);
      rule = await repository.findByTarget(shop, 'variant', normalizedVariantId);
      if (rule) console.log('[Calculate Price] Variant rule found:', rule.rule_name);
    }
    
    if (!rule && product_id) {
      const normalizedProductId = normalizeToGid(product_id, 'Product');
      console.log('[Calculate Price] Looking for product rule:', normalizedProductId);
      rule = await repository.findByTarget(shop, 'product', normalizedProductId);
      if (rule) console.log('[Calculate Price] Product rule found:', rule.rule_name);
    }

    if (!rule || !rule.tiers || rule.tiers.length === 0) {
      ctx.body = { 
        success: true, 
        data: null,
        message: 'No pricing rule found'
      };
      return;
    }

    // Encontrar el tier aplicable
    const sortedTiers = [...rule.tiers].sort((a, b) => b.min_quantity - a.min_quantity);
    const applicableTier = sortedTiers.find(t => quantity >= t.min_quantity);

    if (!applicableTier) {
      ctx.body = { 
        success: true, 
        data: null,
        message: 'No applicable tier for this quantity'
      };
      return;
    }

    ctx.body = {
      success: true,
      data: {
        rule_id: rule.id,
        rule_name: rule.rule_name,
        tier: {
          min_quantity: applicableTier.min_quantity,
          price: applicableTier.price,
          currency: applicableTier.currency || 'USD'
        },
        unit_price: applicableTier.price,
        total_price: quantity * applicableTier.price,
        all_tiers: rule.tiers.map(t => ({
          min_quantity: t.min_quantity,
          price: t.price
        })).sort((a, b) => a.min_quantity - b.min_quantity)
      }
    };

  } catch (error: any) {
    console.error('Error calculating price:', error);
    ctx.status = 500;
    ctx.body = { success: false, error: 'Internal server error' };
  }
});

export default router;

