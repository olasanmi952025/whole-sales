import Router from 'koa-router';
import type { Context } from 'koa';
import { ScriptTagService } from '../services/script-tag.service.js';

const router = new Router({ prefix: '/api/settings' });

// Reinstalar script tag
router.post('/reinstall-script', async (ctx: Context) => {
  try {
    const session = ctx.state.shopify.session;
    
    if (!session) {
      ctx.status = 401;
      ctx.body = { success: false, error: 'No session found' };
      return;
    }

    const scriptService = new ScriptTagService();
    
    // Primero desinstalar
    await scriptService.uninstallScriptTag(session);
    
    // Luego instalar
    const installed = await scriptService.installScriptTag(session);
    
    if (installed) {
      ctx.body = { 
        success: true, 
        message: 'Script tag reinstalled successfully' 
      };
    } else {
      ctx.status = 500;
      ctx.body = { 
        success: false, 
        error: 'Failed to install script tag' 
      };
    }
  } catch (error: any) {
    console.error('Error reinstalling script tag:', error);
    ctx.status = 500;
    ctx.body = { 
      success: false, 
      error: error.message 
    };
  }
});

export default router;

