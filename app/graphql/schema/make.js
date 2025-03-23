import { 
  getMakes, 
  getMake, 
  createMake, 
  updateMake, 
  deleteMake 
} from '~/models/make.server.js';

export const typeDefs = `#graphql
  extend type Query {
    makes: [Make!]!
    make(id: ID!): Make
  }
  
  extend type Mutation {
    createMake(input: MakeInput!): Make!
    updateMake(id: ID!, input: MakeInput!): Make!
    deleteMake(id: ID!): Boolean!
  }
  
  type Make {
    id: ID!
    name: String!
    models: [Model!]!
    createdAt: Date!
    updatedAt: Date!
  }
  
  input MakeInput {
    name: String!
  }
  
  type MakesPayload {
    makes: [Make!]!
    pageInfo: PageInfo!
  }
`;

export const resolvers = {
  Query: {
    makes: async (_, __, { session }) => {
      return getMakes(session.shop);
    },
    make: async (_, { id }, { session }) => {
      return getMake(id);
    },
  },
  Mutation: {
    createMake: async (_, { input }, { session }) => {
      return createMake(input);
    },
    updateMake: async (_, { id, input }, { session }) => {
      return updateMake(id, input);
    },
    deleteMake: async (_, { id }, { session }) => {
      await deleteMake(id);
      return true;
    },
  },
}; 