import '@shopify/shopify-api/adapters/node';
import { shopifyApi, LATEST_API_VERSION } from '@shopify/shopify-api';

export class DiscountService {
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
   * Crear un código de descuento automático para precio mayorista
   */
  async createWholesaleDiscountCode(session: any, params: {
    variantId: string;
    quantity: number;
    discountAmount: number;
    ruleName: string;
  }): Promise<string | null> {
    try {
      const client = new this.shopify.clients.Graphql({ session });
      
      // Generar código único
      const code = `WHOLESALE_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`.toUpperCase();

      const mutation = `
        mutation discountCodeBasicCreate($basicCodeDiscount: DiscountCodeBasicInput!) {
          discountCodeBasicCreate(basicCodeDiscount: $basicCodeDiscount) {
            codeDiscountNode {
              id
              codeDiscount {
                ... on DiscountCodeBasic {
                  title
                  codes(first: 1) {
                    edges {
                      node {
                        code
                      }
                    }
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
        basicCodeDiscount: {
          title: `Wholesale: ${params.ruleName}`,
          code: code,
          startsAt: new Date().toISOString(),
          endsAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(), // 24 horas
          customerGets: {
            value: {
              fixedAmountValue: {
                amount: (params.discountAmount / 100).toFixed(2)
              }
            },
            items: {
              productVariants: {
                add: [params.variantId]
              }
            }
          },
          customerSelection: {
            all: true
          },
          usageLimit: 1, // Solo se puede usar una vez
          appliesOncePerCustomer: false
        }
      };

      const response = await client.query({
        data: {
          query: mutation,
          variables
        }
      });

      if (response.body.data.discountCodeBasicCreate.userErrors.length > 0) {
        console.error('Errors creating discount:', response.body.data.discountCodeBasicCreate.userErrors);
        return null;
      }

      console.log('[Discount Service] Created discount code:', code);
      return code;

    } catch (error) {
      console.error('[Discount Service] Error creating discount:', error);
      return null;
    }
  }

  /**
   * Crear un descuento automático (no requiere código)
   */
  async createAutomaticDiscount(session: any, params: {
    title: string;
    variantId: string;
    discountAmount: number;
  }): Promise<boolean> {
    try {
      const client = new this.shopify.clients.Graphql({ session });

      const mutation = `
        mutation discountAutomaticBasicCreate($automaticBasicDiscount: DiscountAutomaticBasicInput!) {
          discountAutomaticBasicCreate(automaticBasicDiscount: $automaticBasicDiscount) {
            automaticDiscountNode {
              id
              automaticDiscount {
                ... on DiscountAutomaticBasic {
                  title
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
        automaticBasicDiscount: {
          title: params.title,
          startsAt: new Date().toISOString(),
          customerGets: {
            value: {
              fixedAmountValue: {
                amount: (params.discountAmount / 100).toFixed(2)
              }
            },
            items: {
              productVariants: {
                add: [params.variantId]
              }
            }
          }
        }
      };

      const response = await client.query({
        data: {
          query: mutation,
          variables
        }
      });

      if (response.body.data.discountAutomaticBasicCreate.userErrors.length > 0) {
        console.error('Errors creating automatic discount:', response.body.data.discountAutomaticBasicCreate.userErrors);
        return false;
      }

      console.log('[Discount Service] Created automatic discount');
      return true;

    } catch (error) {
      console.error('[Discount Service] Error creating automatic discount:', error);
      return false;
    }
  }

  /**
   * Limpiar descuentos antiguos
   */
  async cleanupOldDiscounts(session: any): Promise<void> {
    try {
      const client = new this.shopify.clients.Graphql({ session });

      // Buscar descuentos que empiecen con WHOLESALE_
      const query = `
        query {
          codeDiscountNodes(first: 100) {
            edges {
              node {
                id
                codeDiscount {
                  ... on DiscountCodeBasic {
                    title
                    endsAt
                  }
                }
              }
            }
          }
        }
      `;

      const response = await client.query({ data: query });
      const discounts = response.body.data.codeDiscountNodes.edges;

      // Eliminar descuentos expirados
      for (const edge of discounts) {
        const discount = edge.node;
        if (discount.codeDiscount.title?.startsWith('Wholesale:')) {
          const endsAt = new Date(discount.codeDiscount.endsAt);
          if (endsAt < new Date()) {
            await this.deleteDiscount(session, discount.id);
          }
        }
      }

      console.log('[Discount Service] Cleaned up old discounts');

    } catch (error) {
      console.error('[Discount Service] Error cleaning discounts:', error);
    }
  }

  /**
   * Eliminar un descuento
   */
  async deleteDiscount(session: any, discountId: string): Promise<boolean> {
    try {
      const client = new this.shopify.clients.Graphql({ session });

      const mutation = `
        mutation discountCodeDelete($id: ID!) {
          discountCodeDelete(id: $id) {
            deletedCodeDiscountId
            userErrors {
              field
              message
            }
          }
        }
      `;

      await client.query({
        data: {
          query: mutation,
          variables: { id: discountId }
        }
      });

      return true;
    } catch (error) {
      console.error('[Discount Service] Error deleting discount:', error);
      return false;
    }
  }
}

