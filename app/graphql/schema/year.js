import {
  getYears,
  getYear,
  createYear,
  updateYear,
  deleteYear
} from '~/models/year.server.js';

export const typeDefs = `#graphql
  extend type Query {
    years(modelId: ID!): [Year!]!
    year(id: ID!): Year
  }
  
  extend type Mutation {
    createYear(input: YearInput!): Year!
    updateYear(id: ID!, input: YearInput!): Year!
    deleteYear(id: ID!): Boolean!
  }
  
  type Year {
    id: ID!
    value: Int!
    modelId: ID!
    model: Model!
    submodels: [Submodel!]!
    createdAt: Date!
    updatedAt: Date!
  }
  
  input YearInput {
    value: Int!
    modelId: ID!
  }
  
  type YearsPayload {
    years: [Year!]!
    pageInfo: PageInfo!
  }
`;

export const resolvers = {
  Query: {
    years: async (_, { modelId }, { session }) => {
      return getYears(modelId);
    },
    year: async (_, { id }, { session }) => {
      return getYear(id);
    },
  },
  Mutation: {
    createYear: async (_, { input }, { session }) => {
      return createYear(input);
    },
    updateYear: async (_, { id, input }, { session }) => {
      return updateYear(id, input);
    },
    deleteYear: async (_, { id }, { session }) => {
      await deleteYear(id);
      return true;
    },
  },
}; 