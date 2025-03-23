import {
  createImportJob,
  getImportJob,
  updateImportJob,
  getImportJobs,
  getPendingImportJobs,
  getProcessingImportJobs,
  markImportJobComplete,
  markImportJobFailed,
  deleteImportJob
} from '~/models/import.server.js';

export const typeDefs = `#graphql
  extend type Query {
    importJobs(page: Int, limit: Int): ImportJobsPayload!
    importJob(id: ID!): ImportJob
    pendingImportJobs: [ImportJob!]!
    processingImportJobs: [ImportJob!]!
  }
  
  extend type Mutation {
    createImportJob(input: ImportJobInput!): ImportJob!
    updateImportJob(id: ID!, input: ImportJobUpdateInput!): ImportJob!
    markImportJobComplete(id: ID!, processedRows: Int!, errorRows: Int, errorLog: String): ImportJob!
    markImportJobFailed(id: ID!, errorLog: String!): ImportJob!
    deleteImportJob(id: ID!): Boolean!
  }
  
  type ImportJob {
    id: ID!
    shop: String!
    filename: String!
    status: String!
    totalRows: Int!
    processedRows: Int!
    errorRows: Int!
    errorLog: String
    createdAt: Date!
    completedAt: Date
  }
  
  input ImportJobInput {
    filename: String!
    totalRows: Int!
  }
  
  input ImportJobUpdateInput {
    status: String
    processedRows: Int
    errorRows: Int
    errorLog: String
  }
  
  type ImportJobsPayload {
    jobs: [ImportJob!]!
    pagination: PaginationInfo!
  }
`;

export const resolvers = {
  Query: {
    importJobs: async (_, { page, limit }, { session }) => {
      return getImportJobs(session.shop, { page, limit });
    },
    importJob: async (_, { id }, { session }) => {
      return getImportJob(id);
    },
    pendingImportJobs: async (_, __, { session }) => {
      return getPendingImportJobs(session.shop);
    },
    processingImportJobs: async (_, __, { session }) => {
      return getProcessingImportJobs(session.shop);
    },
  },
  Mutation: {
    createImportJob: async (_, { input }, { session }) => {
      return createImportJob({
        ...input,
        shop: session.shop,
      });
    },
    updateImportJob: async (_, { id, input }, { session }) => {
      return updateImportJob(id, input);
    },
    markImportJobComplete: async (_, { id, processedRows, errorRows, errorLog }, { session }) => {
      return markImportJobComplete(id, { processedRows, errorRows, errorLog });
    },
    markImportJobFailed: async (_, { id, errorLog }, { session }) => {
      return markImportJobFailed(id, errorLog);
    },
    deleteImportJob: async (_, { id }, { session }) => {
      await deleteImportJob(id);
      return true;
    },
  },
}; 