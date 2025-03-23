import {
  getProducts,
  getProduct,
  createProduct,
  updateProduct,
  deleteProduct,
  getCompatibleProducts
} from '~/models/product.server.js';

export const typeDefs = `#graphql
  extend type Query {
    products(page: Int, limit: Int, search: String): ProductsPayload!
    product(id: ID!): Product
    compatibleProducts(yearId: ID!, submodelId: ID, page: Int, limit: Int): ProductsPayload!
  }
  
  extend type Mutation {
    createProduct(input: ProductInput!): Product!
    updateProduct(id: ID!, input: ProductUpdateInput!): Product!
    deleteProduct(id: ID!): Boolean!
  }
  
  type Product {
    id: ID!
    title: String!
    handle: String!
    shop: String!
    fitments: [Fitment!]!
    createdAt: Date!
    updatedAt: Date!
  }
  
  input ProductInput {
    id: ID!
    title: String!
    handle: String!
  }
  
  input ProductUpdateInput {
    title: String
    handle: String
  }
  
  type ProductsPayload {
    products: [Product!]!
    pagination: PaginationInfo!
  }
  
  type PaginationInfo {
    page: Int!
    pageSize: Int!
    totalItems: Int!
    totalPages: Int!
  }
`;

export const resolvers = {
  Query: {
    products: async (_, { page = 1, limit = 20, search = "" }, { session }) => {
      return getProducts(session.shop, { page, limit, search });
    },
    product: async (_, { id }, { session }) => {
      return getProduct(id, session.shop);
    },
    compatibleProducts: async (_, { yearId, submodelId, page = 1, limit = 20 }, { session }) => {
      return getCompatibleProducts(session.shop, null, null, yearId, submodelId, { page, limit });
    },
  },
  Mutation: {
    createProduct: async (_, { input }, { session }) => {
      return createProduct({ ...input, shop: session.shop });
    },
    updateProduct: async (_, { id, input }, { session }) => {
      return updateProduct(id, session.shop, input);
    },
    deleteProduct: async (_, { id }, { session }) => {
      await deleteProduct(id, session.shop);
      return true;
    },
  },
}; 