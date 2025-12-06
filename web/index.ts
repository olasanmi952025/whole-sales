import Koa from 'koa';
import bodyParser from 'koa-bodyparser';
import { initializeDatabase } from './database/database-sqljs.js';
import apiRoutes from './routes/api.routes.js';
import authRoutes from './routes/auth.routes.js';
import { verifyShopifySession } from './middleware/shopify-auth.js';
import dotenv from 'dotenv';
import serve from 'koa-static';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

dotenv.config();

const PORT = process.env.PORT || 8081;

const app = new Koa();

async function startServer() {
  console.log('🚀 Starting Wholesale Pricing App - Shopify OAuth Mode');
  console.log('📋 Configuration:');
  console.log('   - API Key:', process.env.SHOPIFY_API_KEY ? '✓ Set' : '✗ Missing');
  console.log('   - API Secret:', process.env.SHOPIFY_API_SECRET ? '✓ Set' : '✗ Missing');
  console.log('   - Host:', process.env.HOST || 'Not set');
  console.log('   - Scopes:', process.env.SCOPES || 'Using defaults');

  await initializeDatabase();

  app.use(bodyParser());

  app.use(async (ctx, next) => {
    ctx.set('Access-Control-Allow-Origin', '*');
    ctx.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    ctx.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    
    if (ctx.method === 'OPTIONS') {
      ctx.status = 204;
      return;
    }
    
    await next();
  });

  app.use(async (ctx, next) => {
    try {
      await next();
    } catch (err: any) {
      ctx.status = err.status || 500;
      ctx.body = {
        success: false,
        error: err.message || 'Internal server error'
      };
      console.error('Error:', err);
    }
  });

  // Rutas de autenticación (sin middleware de sesión)
  app.use(authRoutes.routes());
  app.use(authRoutes.allowedMethods());

  // Rutas de API (con middleware de sesión)
  app.use(async (ctx, next) => {
    // Solo aplicar verificación de sesión a rutas de API
    if (ctx.path.startsWith('/api/') && !ctx.path.startsWith('/api/auth')) {
      await verifyShopifySession(ctx, next);
    } else {
      await next();
    }
  });

  app.use(apiRoutes.routes());
  app.use(apiRoutes.allowedMethods());

  const frontendPath = join(__dirname, 'dist', 'frontend');
  app.use(serve(frontendPath));

  app.use(async ctx => {
    if (!ctx.body && ctx.method === 'GET' && !ctx.path.startsWith('/api/')) {
      try {
        const indexPath = join(frontendPath, 'index.html');
        ctx.type = 'html';
        const { readFileSync } = await import('fs');
        let html = readFileSync(indexPath, 'utf-8');
        
        // Inyectar el shop en el HTML si está disponible
        const shop = ctx.query.shop as string || ctx.state.shopify?.session?.shop;
        if (shop) {
          // Inyectar shop como variable global antes de cargar los scripts
          const shopScript = `<script>window.SHOPIFY_SHOP = "${shop}";</script>`;
          html = html.replace('</head>', `${shopScript}</head>`);
        }
        
        ctx.body = html;
      } catch {
        ctx.status = 404;
        ctx.body = { success: false, error: 'Not found' };
      }
    }
  });

  app.listen(PORT, () => {
    console.log('');
    console.log('✅ Backend running on: http://localhost:' + PORT);
    console.log('📊 API endpoints: http://localhost:' + PORT + '/api/rules');
    console.log('🔐 OAuth start: http://localhost:' + PORT + '/api/auth?shop=YOUR-SHOP.myshopify.com');
    console.log('');
    console.log('💡 To install the app, visit:');
    console.log('   http://localhost:' + PORT + '/api/auth?shop=mayoreo-9044.myshopify.com');
    console.log('');
  });
}

startServer().catch(console.error);

export default app;
