import {
  getFitments,
  getFitment,
  createFitment,
  updateFitment,
  deleteFitment,
  deleteProductFitments
} from '~/models/fitment.server.js';

export const typeDefs = `#graphql
  extend type Query {
    fitments(productId: ID!): [Fitment!]!
    fitment(id: ID!): Fitment
  }
  
  extend type Mutation {
    createFitment(input: FitmentInput!): Fitment!
    updateFitment(id: ID!, input: FitmentUpdateInput!): Fitment!
    deleteFitment(id: ID!): Boolean!
    deleteProductFitments(productId: ID!): Boolean!
  }
  
  type Fitment {
    id: ID!
    productId: ID!
    product: Product!
    yearId: ID!
    year: Year!
    submodelId: ID
    submodel: Submodel
    notes: String
    createdAt: Date!
    updatedAt: Date!
  }
  
  input FitmentInput {
    productId: ID!
    yearId: ID!
    submodelId: ID
    notes: String
  }
  
  input FitmentUpdateInput {
    notes: String
    submodelId: ID
  }
`;

export const resolvers = {
  Query: {
    fitments: async (_, { productId }, { session }) => {
      return getFitments(productId);
    },
    fitment: async (_, { id }, { session }) => {
      return getFitment(id);
    },
  },
  Mutation: {
    createFitment: async (_, { input }, { session }) => {
      return createFitment(input);
    },
    updateFitment: async (_, { id, input }, { session }) => {
      return updateFitment(id, input);
    },
    deleteFitment: async (_, { id }, { session }) => {
      await deleteFitment(id);
      return true;
    },
    deleteProductFitments: async (_, { productId }, { session }) => {
      await deleteProductFitments(productId);
      return true;
    },
  },
}; 