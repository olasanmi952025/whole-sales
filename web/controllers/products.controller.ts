import type { Context } from 'koa';

const MOCK_PRODUCTS = [
  {
    id: 'gid://shopify/Product/1',
    title: 'Classic T-Shirt',
    variants: [
      { id: 'gid://shopify/ProductVariant/101', title: 'Small', price: '19.99' },
      { id: 'gid://shopify/ProductVariant/102', title: 'Medium', price: '19.99' },
      { id: 'gid://shopify/ProductVariant/103', title: 'Large', price: '19.99' }
    ]
  },
  {
    id: 'gid://shopify/Product/2',
    title: 'Premium Hoodie',
    variants: [
      { id: 'gid://shopify/ProductVariant/201', title: 'Small', price: '49.99' },
      { id: 'gid://shopify/ProductVariant/202', title: 'Medium', price: '49.99' },
      { id: 'gid://shopify/ProductVariant/203', title: 'Large', price: '49.99' }
    ]
  },
  {
    id: 'gid://shopify/Product/3',
    title: 'Denim Jeans',
    variants: [
      { id: 'gid://shopify/ProductVariant/301', title: '28x30', price: '59.99' },
      { id: 'gid://shopify/ProductVariant/302', title: '30x32', price: '59.99' },
      { id: 'gid://shopify/ProductVariant/303', title: '32x34', price: '59.99' }
    ]
  },
  {
    id: 'gid://shopify/Product/4',
    title: 'Running Shoes',
    variants: [
      { id: 'gid://shopify/ProductVariant/401', title: 'Size 8', price: '89.99' },
      { id: 'gid://shopify/ProductVariant/402', title: 'Size 9', price: '89.99' },
      { id: 'gid://shopify/ProductVariant/403', title: 'Size 10', price: '89.99' }
    ]
  },
  {
    id: 'gid://shopify/Product/5',
    title: 'Baseball Cap',
    variants: [
      { id: 'gid://shopify/ProductVariant/501', title: 'One Size', price: '24.99' }
    ]
  }
];

const MOCK_COLLECTIONS = [
  { id: 'gid://shopify/Collection/1', title: 'Summer Collection' },
  { id: 'gid://shopify/Collection/2', title: 'Winter Collection' },
  { id: 'gid://shopify/Collection/3', title: 'Best Sellers' }
];

export class ProductsController {
  async getProducts(ctx: Context): Promise<void> {
    ctx.body = { success: true, data: MOCK_PRODUCTS };
  }

  async getCollections(ctx: Context): Promise<void> {
    ctx.body = { success: true, data: MOCK_COLLECTIONS };
  }
}

