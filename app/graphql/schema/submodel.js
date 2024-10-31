import {
  getSubmodels,
  getSubmodel,
  createSubmodel,
  updateSubmodel,
  deleteSubmodel
} from '~/models/submodel.server.js';

export const typeDefs = `#graphql
  extend type Query {
    submodels(yearId: ID!): [Submodel!]!
    submodel(id: ID!): Submodel
  }
  
  extend type Mutation {
    createSubmodel(input: SubmodelInput!): Submodel!
    updateSubmodel(id: ID!, input: SubmodelInput!): Submodel!
    deleteSubmodel(id: ID!): Boolean!
  }
  
  type Submodel {
    id: ID!
    name: String!
    yearId: ID!
    year: Year!
    createdAt: Date!
    updatedAt: Date!
  }
  
  input SubmodelInput {
    name: String!
    yearId: ID!
  }
  
  type SubmodelsPayload {
    submodels: [Submodel!]!
    pageInfo: PageInfo!
  }
`;

export const resolvers = {
  Query: {
    submodels: async (_, { yearId }, { session }) => {
      return getSubmodels(yearId);
    },
    submodel: async (_, { id }, { session }) => {
      return getSubmodel(id);
    },
  },
  Mutation: {
    createSubmodel: async (_, { input }, { session }) => {
      return createSubmodel(input);
    },
    updateSubmodel: async (_, { id, input }, { session }) => {
      return updateSubmodel(id, input);
    },
    deleteSubmodel: async (_, { id }, { session }) => {
      await deleteSubmodel(id);
      return true;
    },
  },
}; 