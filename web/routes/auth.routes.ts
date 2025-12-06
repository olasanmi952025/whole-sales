import Router from 'koa-router';
import type { Context } from 'koa';
import { shopify, saveSession } from '../middleware/shopify-auth.js';
import crypto from 'crypto';

const router = new Router({ prefix: '/api/auth' });

// Ruta de inicio de OAuth
router.get('/', async (ctx: Context) => {
  try {
    const shop = ctx.query.shop as string;

    if (!shop) {
      ctx.status = 400;
      ctx.body = { success: false, error: 'Missing shop parameter' };
      return;
    }

    // Validar formato de shop
    if (!shop.match(/^[a-zA-Z0-9][a-zA-Z0-9\-]*\.myshopify\.com$/)) {
      ctx.status = 400;
      ctx.body = { success: false, error: 'Invalid shop format' };
      return;
    }

    // Generar state para CSRF protection
    const state = crypto.randomBytes(16).toString('hex');
    
    // Guardar state en sesión temporal (en producción usar Redis o similar)
    ctx.cookies.set('shopify_oauth_state', state, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      maxAge: 10 * 60 * 1000 // 10 minutos
    });

    // Construir URL de autorización
    const authRoute = await shopify.auth.begin({
      shop: shopify.utils.sanitizeShop(shop, true)!,
      callbackPath: '/api/auth/callback',
      isOnline: false, // Usar token offline para acceso permanente
      rawRequest: ctx.req,
      rawResponse: ctx.res,
    });

    console.log('🔐 Starting OAuth for shop:', shop);
    console.log('📍 Redirecting to:', authRoute);

    ctx.redirect(authRoute);
  } catch (error: any) {
    console.error('Error starting OAuth:', error);
    ctx.status = 500;
    ctx.body = { 
      success: false, 
      error: 'Failed to start authentication',
      details: error.message 
    };
  }
});

// Ruta de callback de OAuth
router.get('/callback', async (ctx: Context) => {
  try {
    const { shop, code, state, hmac, host } = ctx.query;

    if (!shop || !code) {
      ctx.status = 400;
      ctx.body = { success: false, error: 'Missing required parameters' };
      return;
    }

    // Validar shop
    const sanitizedShop = shopify.utils.sanitizeShop(shop as string, true);
    if (!sanitizedShop) {
      ctx.status = 400;
      ctx.body = { success: false, error: 'Invalid shop' };
      return;
    }

    // Validar HMAC
    const queryParams = { ...ctx.query };
    delete queryParams.hmac;
    
    const message = Object.keys(queryParams)
      .sort()
      .map(key => `${key}=${queryParams[key]}`)
      .join('&');
    
    const generatedHmac = crypto
      .createHmac('sha256', process.env.SHOPIFY_API_SECRET!)
      .update(message)
      .digest('hex');

    if (generatedHmac !== hmac) {
      ctx.status = 403;
      ctx.body = { success: false, error: 'Invalid HMAC signature' };
      return;
    }

    console.log('✅ HMAC validated for shop:', sanitizedShop);

    // Intercambiar código por access token
    const callback = await shopify.auth.callback({
      rawRequest: ctx.req,
      rawResponse: ctx.res,
    });

    const { session } = callback;

    if (!session) {
      ctx.status = 500;
      ctx.body = { success: false, error: 'Failed to create session' };
      return;
    }

    // Guardar sesión en la base de datos
    await saveSession(session);

    console.log('✅ Session saved for shop:', session.shop);
    console.log('🔑 Access Token obtained:', session.accessToken?.substring(0, 20) + '...');

    // Redirigir a la app
    const appUrl = `/?shop=${session.shop}&host=${host || ''}`;
    
    ctx.redirect(appUrl);
  } catch (error: any) {
    console.error('Error in OAuth callback:', error);
    ctx.status = 500;
    ctx.body = { 
      success: false, 
      error: 'Authentication failed',
      details: error.message 
    };
  }
});

// Ruta para verificar estado de autenticación
router.get('/verify', async (ctx: Context) => {
  try {
    const shop = ctx.query.shop as string;

    if (!shop) {
      ctx.status = 400;
      ctx.body = { success: false, error: 'Missing shop parameter' };
      return;
    }

    const session = ctx.state.shopify?.session;

    if (session && session.accessToken) {
      ctx.body = {
        success: true,
        authenticated: true,
        shop: session.shop,
        scope: session.scope
      };
    } else {
      ctx.body = {
        success: true,
        authenticated: false,
        message: 'No active session'
      };
    }
  } catch (error: any) {
    console.error('Error verifying auth:', error);
    ctx.status = 500;
    ctx.body = { success: false, error: 'Verification failed', details: error.message };
  }
});

export default router;

