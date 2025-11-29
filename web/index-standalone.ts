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

const PORT = process.env.PORT || 3000;

const app = new Koa();

app.use(bodyParser());

app.use(async (ctx, next) => {
  ctx.state = {
    shopify: {
      session: {
        shop: 'dev-store.myshopify.com',
        accessToken: 'mock-token-for-dev'
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

if (process.env.NODE_ENV === 'production') {
  app.use(serve(join(__dirname, '../frontend/dist')));
}

app.use(async ctx => {
  ctx.status = 404;
  ctx.body = { success: false, error: 'Not found' };
});

async function startServer() {
  console.log('🚀 Starting Wholesale Pricing App - Standalone Mode');
  console.log('📝 No Shopify connection required for local development');

  await initializeDatabase();

  app.listen(PORT, () => {
    console.log('');
    console.log('✅ Backend running on: http://localhost:' + PORT);
    console.log('📊 API endpoints: http://localhost:' + PORT + '/api/rules');
    console.log('');
    console.log('💡 This is standalone mode - mock Shopify session');
    console.log('   Shop: dev-store.myshopify.com');
    console.log('');
    console.log('🎨 Start frontend: cd web/frontend && npm run dev');
    console.log('🌐 Open: http://localhost:3001');
    console.log('');
  });
}

startServer().catch(console.error);

export default app;
