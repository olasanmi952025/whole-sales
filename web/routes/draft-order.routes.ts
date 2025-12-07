import Router from 'koa-router';
import type { Context } from 'koa';
import { DraftOrderService } from '../services/draft-order.service.js';

const router = new Router();

// Endpoint autenticado para crear draft order desde el admin
router.post('/api/draft-orders/create', async (ctx: Context) => {
  try {
    const session = ctx.state.shopify?.session;
    
    if (!session) {
      ctx.status = 401;
      ctx.body = { success: false, error: 'Not authenticated' };
      return;
    }

    const { cart, wholesalePricing } = ctx.request.body as any;

    if (!cart || !wholesalePricing) {
      ctx.status = 400;
      ctx.body = { success: false, error: 'Missing cart or pricing data' };
      return;
    }

    const draftOrderService = new DraftOrderService();
    const result = await draftOrderService.convertCartToDraftOrder(
      session,
      cart,
      wholesalePricing
    );

    if (result.success) {
      ctx.body = {
        success: true,
        invoice_url: result.invoiceUrl
      };
    } else {
      ctx.status = 500;
      ctx.body = {
        success: false,
        error: result.error || 'Failed to create draft order'
      };
    }

  } catch (error: any) {
    console.error('[Draft Order] Error:', error);
    ctx.status = 500;
    ctx.body = { success: false, error: error.message };
  }
});

// Endpoint PÚBLICO para crear draft order desde el storefront
router.post('/api/public/create-draft-order', async (ctx: Context) => {
  try {
    const { shop, items, customer_email, customer_note } = ctx.request.body as any;

    console.log('[Public Draft Order] Request:', { shop, itemCount: items?.length });

    if (!shop || !items || !Array.isArray(items) || items.length === 0) {
      ctx.status = 400;
      ctx.body = { success: false, error: 'Missing required parameters: shop, items' };
      return;
    }

    // Calcular precios mayoristas
    const { PricingRulesRepository } = await import('../repositories/pricing-rules.repository.js');
    const repository = new PricingRulesRepository();

    function normalizeToGid(id: string | number, type: 'Product' | 'ProductVariant'): string {
      const idStr = id.toString();
      if (idStr.startsWith('gid://shopify/')) return idStr;
      return `gid://shopify/${type}/${idStr}`;
    }

    const lineItems = [];
    let hasWholesalePricing = false;
    let totalSavings = 0;

    for (const item of items) {
      const { variant_id, product_id, quantity, price, title } = item;

      if (!quantity || quantity <= 0) continue;

      // Normalizar IDs
      let variantGid = variant_id?.toString() || '';
      if (variantGid && !variantGid.startsWith('gid://')) {
        variantGid = `gid://shopify/ProductVariant/${variantGid}`;
      }

      // Buscar regla
      let rule = null;
      if (variant_id) {
        const normalizedVariantId = normalizeToGid(variant_id, 'ProductVariant');
        rule = await repository.findByTarget(shop, 'variant', normalizedVariantId);
      }
      if (!rule && product_id) {
        const normalizedProductId = normalizeToGid(product_id, 'Product');
        rule = await repository.findByTarget(shop, 'product', normalizedProductId);
      }

      // Calcular precio
      let wholesalePrice = price * quantity; // en centavos
      const originalPrice = price * quantity;

      if (rule && rule.tiers && rule.tiers.length > 0) {
        const sortedTiers = [...rule.tiers].sort((a, b) => b.min_quantity - a.min_quantity);
        const applicableTier = sortedTiers.find(t => quantity >= t.min_quantity);

        if (applicableTier) {
          wholesalePrice = Math.round(applicableTier.price * quantity * 100);
          hasWholesalePricing = true;
          totalSavings += (originalPrice - wholesalePrice);
          console.log('[Draft Order] Tier applied:', {
            product: title,
            quantity,
            original: originalPrice / 100,
            wholesale: wholesalePrice / 100,
            savings: (originalPrice - wholesalePrice) / 100
          });
        }
      }

      lineItems.push({
        variantId: variantGid,
        quantity,
        originalPrice,
        wholesalePrice,
        title: title || 'Product'
      });
    }

    if (!hasWholesalePricing) {
      ctx.body = {
        success: false,
        error: 'No wholesale pricing applicable',
        regular_checkout_url: `https://${shop}/checkout`
      };
      return;
    }

    // Obtener sesión de la tienda
    const { SQLiteSessionStorage } = await import('../services/session-storage.service.js');
    const sessionStorage = new SQLiteSessionStorage();
    const sessions = await sessionStorage.findSessionsByShop(shop);
    const session = sessions.find(s => !s.isOnline && s.accessToken); // Buscar sesión offline con token

    if (!session) {
      console.error('[Draft Order] No session found for shop:', shop);
      ctx.status = 401;
      ctx.body = { 
        success: false, 
        error: 'Store not authenticated. Please reinstall the app.',
        contact_admin: true
      };
      return;
    }

    // Crear Draft Order
    const draftOrderService = new DraftOrderService();
    const result = await draftOrderService.createWholesaleDraftOrder(
      session,
      lineItems,
      customer_email,
      customer_note
    );

    if (result.success) {
      console.log('[Draft Order] Created successfully, invoice URL:', result.invoiceUrl);
      ctx.body = {
        success: true,
        invoice_url: result.invoiceUrl,
        draft_order_id: result.draftOrderId,
        total_savings: totalSavings / 100,
        message: 'Draft order created with wholesale pricing'
      };
    } else {
      console.error('[Draft Order] Failed:', result.error);
      ctx.status = 500;
      ctx.body = {
        success: false,
        error: result.error || 'Failed to create draft order'
      };
    }

  } catch (error: any) {
    console.error('[Public Draft Order] Error:', error);
    ctx.status = 500;
    ctx.body = { success: false, error: error.message };
  }
});

export default router;

