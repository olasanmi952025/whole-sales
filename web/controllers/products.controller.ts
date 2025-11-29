import type { Context } from 'koa';
import '@shopify/shopify-api/adapters/node';
import { shopifyApi, ApiVersion } from '@shopify/shopify-api';

export class ProductsController {
  private shopify: any;

  constructor() {
    this.shopify = shopifyApi({
      apiKey: process.env.SHOPIFY_API_KEY!,
      apiSecretKey: process.env.SHOPIFY_API_SECRET!,
      scopes: process.env.SCOPES?.split(',') || [],
      hostName: process.env.HOST?.replace(/https?:\/\//, '') || 'localhost',
      apiVersion: ApiVersion.January24,
      isEmbeddedApp: true,
    });
  }

  async getProducts(ctx: Context): Promise<void> {
    try {
      const session = ctx.state.shopify?.session;
      
      if (!session) {
        ctx.status = 401;
        ctx.body = { success: false, error: 'No session found', debug: { hasState: !!ctx.state, hasShopify: !!ctx.state?.shopify } };
        return;
      }

      console.log('session', session);

      if (!session.accessToken) {
        ctx.status = 401;
        ctx.body = { 
          success: false, 
          error: 'Invalid or mock access token. Please configure real Shopify credentials.',
          debug: { 
            shop: session.shop,
            hasAccessToken: !!session.accessToken,
            tokenType: session.accessToken === 'dev-token' ? 'mock' : 'unknown'
          }
        };
        return;
      }

      const client = new this.shopify.clients.Graphql({ session });

      const query = `
        query {
          products(first: 50) {
            edges {
              node {
                id
                title
                variants(first: 10) {
                  edges {
                    node {
                      id
                      title
                      price
                    }
                  }
                }
              }
            }
          }
        }
      `;

      const response = await client.query({ data: query });
      
      const products = response.body.data.products.edges.map((edge: any) => ({
        id: edge.node.id,
        title: edge.node.title,
        variants: edge.node.variants.edges.map((variantEdge: any) => ({
          id: variantEdge.node.id,
          title: variantEdge.node.title,
          price: variantEdge.node.price
        }))
      }));

      ctx.body = { success: true, data: products };
    } catch (error: any) {
      console.error('Error fetching products:', error);
      ctx.body = { 
        success: false, 
        error: 'Failed to fetch products',
        details: error.message,
        response: error.response?.errors
      };
    }
  }

  async getCollections(ctx: Context): Promise<void> {
    try {
      const session = ctx.state.shopify?.session;
      
      if (!session?.accessToken) {
        ctx.status = 401;
        ctx.body = { success: false, error: 'No valid session' };
        return;
      }

      const client = new this.shopify.clients.Graphql({ session });

      const query = `
        query {
          collections(first: 50) {
            edges {
              node {
                id
                title
              }
            }
          }
        }
      `;

      const response = await client.query({ data: query });
      
      const collections = response.body.data.collections.edges.map((edge: any) => ({
        id: edge.node.id,
        title: edge.node.title
      }));

      ctx.body = { success: true, data: collections };
    } catch (error) {
      console.error('Error fetching collections:', error);
      ctx.body = { success: false, error: 'Failed to fetch collections' };
    }
  }
}
