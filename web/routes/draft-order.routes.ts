import Router from 'koa-router';
import type { Context } from 'koa';
import { DraftOrderService } from '../services/draft-order.service.js';
import { shopifyApi } from '@shopify/shopify-api';

const router = new Router({ prefix: '/api/draft-orders' });

// Endpoint autenticado para crear draft order con precios mayoristas
router.post('/create', async (ctx: Context) => {
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

// Endpoint público para iniciar proceso de draft order
router.post('/initiate', async (ctx: Context) => {
  try {
    const { shop, cart_token } = ctx.request.body as any;

    if (!shop || !cart_token) {
      ctx.status = 400;
      ctx.body = { success: false, error: 'Missing shop or cart_token' };
      return;
    }

    // Generar URL para que el staff cree el draft order
    const adminUrl = `https://${shop}/admin/draft_orders/new`;
    
    ctx.body = {
      success: true,
      message: 'Draft order must be created by store admin',
      admin_url: adminUrl,
      instructions: 'Store admin will receive notification to create your wholesale order'
    };

  } catch (error: any) {
    console.error('[Draft Order Initiate] Error:', error);
    ctx.status = 500;
    ctx.body = { success: false, error: error.message };
  }
});

export default router;

