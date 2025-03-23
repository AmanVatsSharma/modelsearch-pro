import {
  createSearchLog,
  getSearchLogs,
  getSearchStats,
  createProductView,
  getProductViews,
  getTopViewedProducts
} from '~/models/analytics.server.js';

export const typeDefs = `#graphql
  extend type Query {
    searchLogs(startDate: String, endDate: String, page: Int, limit: Int): SearchLogsPayload!
    searchStats(startDate: String, endDate: String): SearchStats!
    productViews(startDate: String, endDate: String, page: Int, limit: Int): ProductViewsPayload!
    topViewedProducts(startDate: String, endDate: String, limit: Int): [ProductViewCount!]!
  }
  
  extend type Mutation {
    createSearchLog(input: SearchLogInput!): SearchLog!
    createProductView(input: ProductViewInput!): ProductView!
  }
  
  type SearchLog {
    id: ID!
    shop: String!
    makeId: ID
    modelId: ID
    yearId: ID
    submodelId: ID
    ipAddress: String
    userAgent: String
    searchResults: Int!
    successful: Boolean!
    sessionId: String
    createdAt: Date!
  }
  
  type SearchStats {
    totalSearches: Int!
    successfulSearches: Int!
    successRate: Float!
    topMakes: [MakeCount!]!
    topModels: [ModelCount!]!
  }
  
  type MakeCount {
    makeId: ID!
    count: Int!
  }
  
  type ModelCount {
    modelId: ID!
    count: Int!
  }
  
  type ProductView {
    id: ID!
    shop: String!
    productId: ID!
    makeId: ID
    modelId: ID
    yearId: ID
    submodelId: ID
    sessionId: String
    createdAt: Date!
  }
  
  type ProductViewCount {
    productId: ID!
    count: Int!
  }
  
  input SearchLogInput {
    makeId: ID
    modelId: ID
    yearId: ID
    submodelId: ID
    ipAddress: String
    userAgent: String
    searchResults: Int!
    successful: Boolean!
    sessionId: String
  }
  
  input ProductViewInput {
    productId: ID!
    makeId: ID
    modelId: ID
    yearId: ID
    submodelId: ID
    sessionId: String
  }
  
  type SearchLogsPayload {
    logs: [SearchLog!]!
    pagination: PaginationInfo!
  }
  
  type ProductViewsPayload {
    views: [ProductView!]!
    pagination: PaginationInfo!
  }
`;

export const resolvers = {
  Query: {
    searchLogs: async (_, { startDate, endDate, page, limit }, { session }) => {
      return getSearchLogs(session.shop, { startDate, endDate, page, limit });
    },
    searchStats: async (_, { startDate, endDate }, { session }) => {
      return getSearchStats(session.shop, { startDate, endDate });
    },
    productViews: async (_, { startDate, endDate, page, limit }, { session }) => {
      return getProductViews(session.shop, { startDate, endDate, page, limit });
    },
    topViewedProducts: async (_, { startDate, endDate, limit }, { session }) => {
      return getTopViewedProducts(session.shop, { startDate, endDate, limit });
    },
  },
  Mutation: {
    createSearchLog: async (_, { input }, { session }) => {
      return createSearchLog({
        ...input,
        shop: session.shop,
      });
    },
    createProductView: async (_, { input }, { session }) => {
      return createProductView({
        ...input,
        shop: session.shop,
      });
    },
  },
}; 