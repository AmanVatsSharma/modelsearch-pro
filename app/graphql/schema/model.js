import {
  getModels,
  getModel,
  createModel,
  updateModel,
  deleteModel
} from '~/models/model.server.js';

export const typeDefs = `#graphql
  extend type Query {
    models(makeId: ID!): [Model!]!
    model(id: ID!): Model
  }
  
  extend type Mutation {
    createModel(input: ModelInput!): Model!
    updateModel(id: ID!, input: ModelInput!): Model!
    deleteModel(id: ID!): Boolean!
  }
  
  type Model {
    id: ID!
    name: String!
    makeId: ID!
    make: Make!
    years: [Year!]!
    createdAt: Date!
    updatedAt: Date!
  }
  
  input ModelInput {
    name: String!
    makeId: ID!
  }
  
  type ModelsPayload {
    models: [Model!]!
    pageInfo: PageInfo!
  }
`;

export const resolvers = {
  Query: {
    models: async (_, { makeId }, { session }) => {
      return getModels(makeId);
    },
    model: async (_, { id }, { session }) => {
      return getModel(id);
    },
  },
  Mutation: {
    createModel: async (_, { input }, { session }) => {
      return createModel(input);
    },
    updateModel: async (_, { id, input }, { session }) => {
      return updateModel(id, input);
    },
    deleteModel: async (_, { id }, { session }) => {
      await deleteModel(id);
      return true;
    },
  },
}; 