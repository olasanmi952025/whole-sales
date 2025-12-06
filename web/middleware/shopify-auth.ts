import '@shopify/shopify-api/adapters/node';
import { shopifyApi, LATEST_API_VERSION, Session } from '@shopify/shopify-api';
import type { Context, Next } from 'koa';
import { SQLiteSessionStorage } from '../services/session-storage.service.js';

const sessionStorage = new SQLiteSessionStorage();

export const shopify = shopifyApi({
  apiKey: process.env.SHOPIFY_API_KEY!,
  apiSecretKey: process.env.SHOPIFY_API_SECRET!,
  scopes: process.env.SCOPES?.split(',') || ['read_products', 'write_products', 'read_orders', 'write_orders'],
  hostName: process.env.HOST?.replace(/https?:\/\//, '') || 'localhost',
  apiVersion: LATEST_API_VERSION,
  isEmbeddedApp: true,
  isCustomStoreApp: false,
});

// Middleware para verificar y cargar sesión
export async function verifyShopifySession(ctx: Context, next: Next) {
  try {
    const shop = ctx.query.shop as string || ctx.state.shop;
    
    if (!shop) {
      ctx.status = 401;
      ctx.body = { success: false, error: 'Missing shop parameter' };
      return;
    }

    // Buscar sesión offline para la tienda
    const sessionId = shopify.session.getOfflineId(shop);
    const session = await sessionStorage.loadSession(sessionId);

    if (!session || !session.accessToken) {
      // No hay sesión, redirigir a OAuth
      const authRoute = `/api/auth?shop=${shop}`;
      
      if (ctx.accepts('html')) {
        ctx.redirect(authRoute);
      } else {
        ctx.status = 401;
        ctx.body = { 
          success: false, 
          error: 'No active session. Please install the app.',
          authUrl: authRoute
        };
      }
      return;
    }

    // Validar que la sesión no haya expirado
    if (session.expires && session.expires < new Date()) {
      ctx.status = 401;
      ctx.body = { success: false, error: 'Session expired. Please reinstall the app.' };
      return;
    }

    // Agregar sesión al contexto
    ctx.state.shopify = {
      session,
      shop: session.shop
    };

    await next();
  } catch (error: any) {
    console.error('Error in verifyShopifySession:', error);
    ctx.status = 500;
    ctx.body = { success: false, error: 'Authentication error', details: error.message };
  }
}

// Helper para obtener la sesión actual
export async function getCurrentSession(shop: string): Promise<Session | undefined> {
  const sessionId = shopify.session.getOfflineId(shop);
  return await sessionStorage.loadSession(sessionId);
}

// Helper para guardar sesión
export async function saveSession(session: Session): Promise<boolean> {
  return await sessionStorage.storeSession(session);
}

export { sessionStorage };

