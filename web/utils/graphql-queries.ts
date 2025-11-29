export const GET_PRODUCT_BY_ID = `
  query GetProduct($id: ID!) {
    product(id: $id) {
      id
      title
      handle
      variants(first: 10) {
        edges {
          node {
            id
            title
            price
            sku
          }
        }
      }
    }
  }
`;

export const GET_COLLECTION_BY_ID = `
  query GetCollection($id: ID!) {
    collection(id: $id) {
      id
      title
      handle
      productsCount
    }
  }
`;

export const GET_PRODUCTS_IN_COLLECTION = `
  query GetProductsInCollection($collectionId: ID!, $first: Int = 10) {
    collection(id: $collectionId) {
      products(first: $first) {
        edges {
          node {
            id
            title
            handle
          }
        }
      }
    }
  }
`;

export const CREATE_ORDER_METAFIELD = `
  mutation CreateOrderMetafield($orderId: ID!, $key: String!, $value: String!) {
    orderUpdate(input: {
      id: $orderId
      metafields: [{
        namespace: "wholesale_pricing"
        key: $key
        value: $value
        type: "json"
      }]
    }) {
      order {
        id
        metafields(first: 10) {
          edges {
            node {
              key
              value
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

export const SEARCH_PRODUCTS = `
  query SearchProducts($query: String!, $first: Int = 10) {
    products(first: $first, query: $query) {
      edges {
        node {
          id
          title
          handle
          featuredImage {
            url
            altText
          }
        }
      }
    }
  }
`;

export const SEARCH_COLLECTIONS = `
  query SearchCollections($query: String!, $first: Int = 10) {
    collections(first: $first, query: $query) {
      edges {
        node {
          id
          title
          handle
          productsCount
        }
      }
    }
  }
`;

