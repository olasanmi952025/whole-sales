import Koa from 'koa';
import bodyParser from 'koa-bodyparser';
import { initializeDatabase } from './database/database-sqljs.js';
import apiRoutes from './routes/api.routes.js';
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
  console.log('🚀 Starting Wholesale Pricing App - Shopify Mode');

  await initializeDatabase();

  app.use(bodyParser());

  app.use(async (ctx, next) => {
    const shop = ctx.query.shop as string || process.env.SHOPIFY_SHOP || 'mayoreo-9044.myshopify.com';
    const accessToken = process.env.SHOPIFY_ACCESS_TOKEN || 'dev-token';
    
    ctx.state = {
      shopify: {
        session: {
          shop,
          accessToken,
          isOnline: false,
          id: `offline_${shop}`,
          state: 'active',
          scope: process.env.SCOPES || ''
        }
      }
    };
    await next();
  });

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

  app.use(apiRoutes.routes());
  app.use(apiRoutes.allowedMethods());

  const frontendPath = join(__dirname, 'dist', 'frontend');
  app.use(serve(frontendPath));

  app.use(async ctx => {
    if (!ctx.body && ctx.method === 'GET') {
      try {
        const indexPath = join(frontendPath, 'index.html');
        ctx.type = 'html';
        const { readFileSync } = await import('fs');
        ctx.body = readFileSync(indexPath, 'utf-8');
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
    console.log('');
  });
}

startServer().catch(console.error);

export default app;
