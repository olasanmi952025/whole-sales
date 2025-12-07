import '@shopify/shopify-api/adapters/node';
import { shopify } from '../middleware/shopify-auth.js';

export class ProductInfoService {
  async getProductName(session: any, productId: string): Promise<string> {
    try {
      const client = new shopify.clients.Rest({ session });
      
      // Extraer el ID numérico del GID de Shopify
      const numericId = productId.includes('gid://') 
        ? productId.split('/').pop()
        : productId;

      const response = await client.get({
        path: `products/${numericId}`,
        query: { fields: 'id,title' }
      });

      return response.body.product?.title || productId;
    } catch (error) {
      console.error('Error fetching product name:', error);
      return productId;
    }
  }

  async getVariantName(session: any, variantId: string): Promise<string> {
    try {
      const client = new shopify.clients.Rest({ session });
      
      const numericId = variantId.includes('gid://') 
        ? variantId.split('/').pop()
        : variantId;

      const response = await client.get({
        path: `variants/${numericId}`,
        query: { fields: 'id,title,product_id' }
      });

      const variant = response.body.variant;
      if (!variant) return variantId;

      // También obtener el nombre del producto
      const productResponse = await client.get({
        path: `products/${variant.product_id}`,
        query: { fields: 'id,title' }
      });

      const productTitle = productResponse.body.product?.title || '';
      return `${productTitle} - ${variant.title}`;
    } catch (error) {
      console.error('Error fetching variant name:', error);
      return variantId;
    }
  }

  async getCollectionName(session: any, collectionId: string): Promise<string> {
    try {
      const client = new shopify.clients.Rest({ session });
      
      const numericId = collectionId.includes('gid://') 
        ? collectionId.split('/').pop()
        : collectionId;

      // Intentar primero con custom_collections
      try {
        const response = await client.get({
          path: `custom_collections/${numericId}`,
          query: { fields: 'id,title' }
        });
        return response.body.custom_collection?.title || collectionId;
      } catch {
        // Si falla, intentar con smart_collections
        const response = await client.get({
          path: `smart_collections/${numericId}`,
          query: { fields: 'id,title' }
        });
        return response.body.smart_collection?.title || collectionId;
      }
    } catch (error) {
      console.error('Error fetching collection name:', error);
      return collectionId;
    }
  }

  async getTargetName(session: any, targetType: string, targetId: string): Promise<string> {
    switch (targetType) {
      case 'product':
        return await this.getProductName(session, targetId);
      case 'variant':
        return await this.getVariantName(session, targetId);
      case 'collection':
        return await this.getCollectionName(session, targetId);
      default:
        return targetId;
    }
  }
}

