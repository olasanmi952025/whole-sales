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
          discount_percentage: applicableTier.discount_percentage,
          currency: applicableTier.currency || 'USD'
        },
        discount_percentage: applicableTier.discount_percentage,
        all_tiers: rule.tiers.map(t => ({
          min_quantity: t.min_quantity,
          discount_percentage: t.discount_percentage
        })).sort((a, b) => a.min_quantity - b.min_quantity)
      }
    };

  } catch (error: any) {
    console.error('Error calculating price:', error);
    ctx.status = 500;
    ctx.body = { success: false, error: 'Internal server error' };
  }
});

// Endpoint para validar y calcular precios de todo el carrito
router.post('/calculate-cart', async (ctx) => {
  try {
    const { shop, items } = ctx.request.body as any;

    console.log('[Calculate Cart] Request:', { shop, itemCount: items?.length });

    if (!shop || !items || !Array.isArray(items)) {
      ctx.status = 400;
      ctx.body = { success: false, error: 'Missing required parameters: shop, items' };
      return;
    }

    const { PricingRulesRepository } = await import('../repositories/pricing-rules.repository.js');
    const repository = new PricingRulesRepository();

    const calculatedItems = [];
    let totalDiscount = 0;
    let hasWholesalePricing = false;

    // Procesar cada item del carrito
    for (const item of items) {
      const { variant_id, product_id, quantity, line_price } = item;

      if (!quantity || quantity <= 0) continue;

      // Buscar regla aplicable
      let rule = null;

      if (variant_id) {
        const normalizedVariantId = normalizeToGid(variant_id, 'ProductVariant');
        rule = await repository.findByTarget(shop, 'variant', normalizedVariantId);
      }

      if (!rule && product_id) {
        const normalizedProductId = normalizeToGid(product_id, 'Product');
        rule = await repository.findByTarget(shop, 'product', normalizedProductId);
      }

      // Calcular precio con regla si existe
      let wholesalePrice = null;
      let itemDiscount = 0;

      if (rule && rule.tiers && rule.tiers.length > 0) {
        const sortedTiers = [...rule.tiers].sort((a, b) => b.min_quantity - a.min_quantity);
        const applicableTier = sortedTiers.find(t => quantity >= t.min_quantity);

        if (applicableTier) {
          const originalPrice = line_price / 100; // Convertir de centavos a dólares
          const discountAmount = (originalPrice * applicableTier.discount_percentage) / 100;
          wholesalePrice = originalPrice - discountAmount;
          itemDiscount = discountAmount;
          totalDiscount += itemDiscount;
          hasWholesalePricing = true;

          console.log('[Calculate Cart] Rule applied:', {
            variant_id,
            quantity,
            original: originalPrice,
            discount_percentage: applicableTier.discount_percentage,
            discount_amount: discountAmount,
            final_price: wholesalePrice
          });
        }
      }

      let tierDiscountPercentage = 0;
      if (rule && rule.tiers && rule.tiers.length > 0) {
        const sortedTiers = [...rule.tiers].sort((a, b) => b.min_quantity - a.min_quantity);
        const foundTier = sortedTiers.find(t => quantity >= t.min_quantity);
        if (foundTier) {
          tierDiscountPercentage = foundTier.discount_percentage;
        }
      }

      calculatedItems.push({
        variant_id,
        product_id,
        quantity,
        original_line_price: line_price,
        wholesale_line_price: wholesalePrice ? Math.round(wholesalePrice * 100) : null,
        discount: Math.round(itemDiscount * 100),
        discount_percentage: tierDiscountPercentage,
        rule_applied: rule ? {
          id: rule.id,
          name: rule.rule_name
        } : null
      });
    }

    ctx.body = {
      success: true,
      data: {
        items: calculatedItems,
        total_discount: Math.round(totalDiscount * 100),
        has_wholesale_pricing: hasWholesalePricing,
        currency: 'USD'
      }
    };

  } catch (error: any) {
    console.error('[Calculate Cart] Error:', error);
    ctx.status = 500;
    ctx.body = { success: false, error: 'Internal server error' };
  }
});

// Endpoint para crear un Draft Order con precios mayoristas
router.post('/create-wholesale-checkout', async (ctx) => {
  try {
    const { shop, items, customer_email } = ctx.request.body as any;

    console.log('[Create Checkout] Request:', { shop, itemCount: items?.length, customer_email });

    if (!shop || !items || !Array.isArray(items) || items.length === 0) {
      ctx.status = 400;
      ctx.body = { success: false, error: 'Missing required parameters: shop, items' };
      return;
    }

    // Primero, calcular los precios mayoristas
    const { PricingRulesRepository } = await import('../repositories/pricing-rules.repository.js');
    const repository = new PricingRulesRepository();

    const lineItems = [];
    let hasWholesalePricing = false;

    for (const item of items) {
      const { variant_id, product_id, quantity, price, title } = item;

      if (!quantity || quantity <= 0) continue;

      // Buscar regla aplicable
      let rule = null;
      let wholesalePrice = null;
      let originalPrice = price * quantity;

      if (variant_id) {
        const normalizedVariantId = normalizeToGid(variant_id, 'ProductVariant');
        rule = await repository.findByTarget(shop, 'variant', normalizedVariantId);
      }

      if (!rule && product_id) {
        const normalizedProductId = normalizeToGid(product_id, 'Product');
        rule = await repository.findByTarget(shop, 'product', normalizedProductId);
      }

      // Calcular precio con regla si existe
      if (rule && rule.tiers && rule.tiers.length > 0) {
        const sortedTiers = [...rule.tiers].sort((a, b) => b.min_quantity - a.min_quantity);
        const applicableTier = sortedTiers.find(t => quantity >= t.min_quantity);

        if (applicableTier) {
          const discountAmount = (originalPrice * applicableTier.discount_percentage) / 100;
          wholesalePrice = originalPrice - discountAmount;
          hasWholesalePricing = true;
        }
      }

      // Normalizar variant ID a GID
      let variantGid = variant_id?.toString() || '';
      if (variantGid && !variantGid.startsWith('gid://')) {
        variantGid = `gid://shopify/ProductVariant/${variantGid}`;
      }

      lineItems.push({
        variantId: variantGid,
        quantity,
        originalPrice: Math.round(originalPrice * 100), // en centavos
        wholesalePrice: wholesalePrice ? Math.round(wholesalePrice * quantity * 100) : Math.round(originalPrice * 100),
        title: title || 'Product'
      });
    }

    // Si no hay precios mayoristas, devolver URL normal del checkout
    if (!hasWholesalePricing) {
      ctx.body = {
        success: true,
        data: {
          checkout_url: `https://${shop}/cart`,
          has_wholesale_pricing: false
        }
      };
      return;
    }

    // Crear Draft Order con precios mayoristas
    // Nota: Esto requiere autenticación de la tienda
    // Por ahora, devolvemos los datos para que el usuario pueda proceder
    ctx.body = {
      success: true,
      data: {
        line_items: lineItems,
        has_wholesale_pricing: true,
        total_savings: lineItems.reduce((sum, item) => 
          sum + (item.originalPrice - item.wholesalePrice), 0
        ),
        message: 'Please contact us to complete your wholesale order',
        contact_url: `https://${shop}/pages/contact`
      }
    };

  } catch (error: any) {
    console.error('[Create Checkout] Error:', error);
    ctx.status = 500;
    ctx.body = { success: false, error: 'Internal server error' };
  }
});

export default router;

