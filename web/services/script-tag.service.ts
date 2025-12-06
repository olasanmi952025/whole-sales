import '@shopify/shopify-api/adapters/node';
import { shopifyApi, LATEST_API_VERSION } from '@shopify/shopify-api';

export class ScriptTagService {
  private shopify: any;

  constructor() {
    this.shopify = shopifyApi({
      apiKey: process.env.SHOPIFY_API_KEY!,
      apiSecretKey: process.env.SHOPIFY_API_SECRET!,
      scopes: process.env.SCOPES?.split(',') || [],
      hostName: process.env.HOST?.replace(/https?:\/\//, '') || 'localhost',
      apiVersion: LATEST_API_VERSION,
      isEmbeddedApp: true,
    });
  }

  async installScriptTag(session: any): Promise<boolean> {
    try {
      const client = new this.shopify.clients.Rest({ session });

      const existingScripts = await client.get({
        path: 'script_tags',
      });

      const scriptUrl = `https://${process.env.HOST}/storefront-script.js`;
      
      const alreadyInstalled = existingScripts.body.script_tags?.some(
        (tag: any) => tag.src === scriptUrl
      );

      if (alreadyInstalled) {
        console.log('Script tag already installed');
        return true;
      }

      await client.post({
        path: 'script_tags',
        data: {
          script_tag: {
            event: 'onload',
            src: scriptUrl,
            display_scope: 'online_store',
          }
        }
      });

      console.log('Script tag installed successfully');
      return true;
    } catch (error) {
      console.error('Error installing script tag:', error);
      return false;
    }
  }

  async uninstallScriptTag(session: any): Promise<boolean> {
    try {
      const client = new this.shopify.clients.Rest({ session });

      const existingScripts = await client.get({
        path: 'script_tags',
      });

      const scriptUrl = `https://${process.env.HOST}/storefront-script.js`;
      
      const scriptTag = existingScripts.body.script_tags?.find(
        (tag: any) => tag.src === scriptUrl
      );

      if (scriptTag) {
        await client.delete({
          path: `script_tags/${scriptTag.id}`,
        });
        console.log('Script tag uninstalled successfully');
      }

      return true;
    } catch (error) {
      console.error('Error uninstalling script tag:', error);
      return false;
    }
  }
}

