import '@shopify/shopify-api/adapters/node';
import { shopifyApi, LATEST_API_VERSION } from '@shopify/shopify-api';

interface DraftOrderLineItem {
  variantId: string;
  quantity: number;
  originalPrice: number;
  wholesalePrice: number;
  title: string;
}

export class DraftOrderService {
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

  /**
   * Crear un Draft Order con precios mayoristas
   */
  async createWholesaleDraftOrder(
    session: any,
    lineItems: DraftOrderLineItem[],
    customerEmail?: string,
    customerNote?: string
  ): Promise<{ success: boolean; invoiceUrl?: string; draftOrderId?: string; error?: string }> {
    try {
      const client = new this.shopify.clients.Graphql({ session });

      // Preparar line items con precios personalizados
      const lineItemsInput = lineItems.map(item => ({
        variantId: item.variantId,
        quantity: item.quantity,
        // IMPORTANTE: appliedDiscount aplica descuento sobre el precio original
        appliedDiscount: {
          value: ((item.originalPrice - item.wholesalePrice) / item.quantity).toFixed(2),
          valueType: 'FIXED_AMOUNT',
          title: 'Precio Mayorista'
        }
      }));

      const mutation = `
        mutation draftOrderCreate($input: DraftOrderInput!) {
          draftOrderCreate(input: $input) {
            draftOrder {
              id
              name
              invoiceUrl
              totalPrice
              subtotalPrice
              lineItems(first: 50) {
                edges {
                  node {
                    title
                    quantity
                    originalUnitPrice
                    discountedUnitPrice
                  }
                }
              }
            }
            userErrors {
              field
              message
            }
          }
        }
      `;

      const variables = {
        input: {
          lineItems: lineItemsInput,
          email: customerEmail,
          note: customerNote || 'Orden con precios mayoristas aplicados por Wholesale Pricing App',
          tags: ['wholesale', 'wholesale-pricing-app'],
          useCustomerDefaultAddress: false
        }
      };

      console.log('[Draft Order] Creating with:', JSON.stringify(variables, null, 2));

      const response = await client.query({
        data: {
          query: mutation,
          variables
        }
      });

      const result = response.body.data?.draftOrderCreate;

      if (!result) {
        console.error('[Draft Order] No result from API');
        return {
          success: false,
          error: 'No response from Shopify API'
        };
      }

      if (result.userErrors && result.userErrors.length > 0) {
        console.error('[Draft Order] Errors:', result.userErrors);
        return {
          success: false,
          error: result.userErrors.map((e: any) => `${e.field}: ${e.message}`).join(', ')
        };
      }

      const draftOrder = result.draftOrder;
      console.log('[Draft Order] Created successfully:', {
        id: draftOrder.id,
        name: draftOrder.name,
        total: draftOrder.totalPrice
      });

      return {
        success: true,
        invoiceUrl: draftOrder.invoiceUrl,
        draftOrderId: draftOrder.id
      };

    } catch (error: any) {
      console.error('[Draft Order] Error creating:', error);
      return {
        success: false,
        error: error.message || 'Unknown error'
      };
    }
  }

  /**
   * Convertir un carrito actual en un Draft Order con precios mayoristas
   */
  async convertCartToDraftOrder(
    session: any,
    cart: any,
    wholesalePricing: any
  ): Promise<{ success: boolean; invoiceUrl?: string; error?: string }> {
    try {
      const lineItems: DraftOrderLineItem[] = [];

      for (let i = 0; i < cart.items.length; i++) {
        const cartItem = cart.items[i];
        const pricingItem = wholesalePricing.items[i];

        // Normalizar variant ID a GID si es necesario
        let variantGid = cartItem.variant_id.toString();
        if (!variantGid.startsWith('gid://')) {
          variantGid = `gid://shopify/ProductVariant/${variantGid}`;
        }

        lineItems.push({
          variantId: variantGid,
          quantity: cartItem.quantity,
          originalPrice: pricingItem?.original_line_price || cartItem.line_price,
          wholesalePrice: pricingItem?.wholesale_line_price || cartItem.line_price,
          title: cartItem.title
        });
      }

      return await this.createWholesaleDraftOrder(
        session,
        lineItems,
        cart.customer?.email
      );

    } catch (error: any) {
      console.error('[Draft Order] Error converting cart:', error);
      return {
        success: false,
        error: error.message || 'Unknown error'
      };
    }
  }

  /**
   * Obtener un Draft Order por ID
   */
  async getDraftOrder(session: any, draftOrderId: string): Promise<any> {
    try {
      const client = new this.shopify.clients.Graphql({ session });

      const query = `
        query getDraftOrder($id: ID!) {
          draftOrder(id: $id) {
            id
            name
            invoiceUrl
            status
            totalPrice
            lineItems(first: 50) {
              edges {
                node {
                  id
                  title
                  quantity
                  originalUnitPrice
                  customAttributes {
                    key
                    value
                  }
                }
              }
            }
          }
        }
      `;

      const response = await client.query({
        data: {
          query,
          variables: { id: draftOrderId }
        }
      });

      return response.body.data.draftOrder;

    } catch (error) {
      console.error('[Draft Order] Error fetching:', error);
      return null;
    }
  }

  /**
   * Completar un Draft Order (convertirlo en orden real)
   */
  async completeDraftOrder(session: any, draftOrderId: string): Promise<boolean> {
    try {
      const client = new this.shopify.clients.Graphql({ session });

      const mutation = `
        mutation draftOrderComplete($id: ID!) {
          draftOrderComplete(id: $id) {
            draftOrder {
              id
              status
            }
            userErrors {
              field
              message
            }
          }
        }
      `;

      const response = await client.query({
        data: {
          query: mutation,
          variables: { id: draftOrderId }
        }
      });

      const result = response.body.data.draftOrderComplete;

      if (result.userErrors && result.userErrors.length > 0) {
        console.error('[Draft Order] Errors completing:', result.userErrors);
        return false;
      }

      console.log('[Draft Order] Completed successfully');
      return true;

    } catch (error) {
      console.error('[Draft Order] Error completing:', error);
      return false;
    }
  }
}

