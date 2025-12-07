import '@shopify/shopify-api/adapters/node';
import { shopifyApi, LATEST_API_VERSION } from '@shopify/shopify-api';

export class ScriptTagService {
  private shopify: any;
  private hostName: string;

  constructor() {
    // Obtener y validar HOST
    const rawHost = process.env.HOST || '';
    this.hostName = rawHost.replace(/https?:\/\//, '') || 'whole-sales-production.up.railway.app';
    
    console.log('🏷️  ScriptTagService using host:', this.hostName);
    
    this.shopify = shopifyApi({
      apiKey: process.env.SHOPIFY_API_KEY!,
      apiSecretKey: process.env.SHOPIFY_API_SECRET!,
      scopes: process.env.SCOPES?.split(',') || [],
      hostName: this.hostName,
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

      const scripts = [
        {
          url: `https://${this.hostName}/wholesale-pricing.js`,
          name: 'Product Page Script'
        },
        {
          url: `https://${this.hostName}/wholesale-cart.js`,
          name: 'Cart Script'
        }
      ];

      let allInstalled = true;

      for (const script of scripts) {
        const alreadyInstalled = existingScripts.body.script_tags?.some(
          (tag: any) => tag.src === script.url
        );

        if (alreadyInstalled) {
          console.log(`✅ ${script.name} already installed`);
          continue;
        }

        try {
          await client.post({
            path: 'script_tags',
            data: {
              script_tag: {
                event: 'onload',
                src: script.url,
                display_scope: 'online_store',
              }
            }
          });
          console.log(`✅ ${script.name} installed successfully:`, script.url);
        } catch (error) {
          console.error(`Error installing ${script.name}:`, error);
          allInstalled = false;
        }
      }

      return allInstalled;
    } catch (error) {
      console.error('Error installing script tags:', error);
      return false;
    }
  }

  async uninstallScriptTag(session: any): Promise<boolean> {
    try {
      const client = new this.shopify.clients.Rest({ session });

      const existingScripts = await client.get({
        path: 'script_tags',
      });

      const scriptUrls = [
        `https://${this.hostName}/wholesale-pricing.js`,
        `https://${this.hostName}/wholesale-cart.js`
      ];

      for (const scriptUrl of scriptUrls) {
        const scriptTag = existingScripts.body.script_tags?.find(
          (tag: any) => tag.src === scriptUrl
        );

        if (scriptTag) {
          await client.delete({
            path: `script_tags/${scriptTag.id}`,
          });
          console.log('Script tag uninstalled:', scriptUrl);
        }
      }

      return true;
    } catch (error) {
      console.error('Error uninstalling script tags:', error);
      return false;
    }
  }
}

