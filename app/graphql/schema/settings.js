import {
  getSettings,
  updateSettings
} from '~/models/settings.server.js';

export const typeDefs = `#graphql
  extend type Query {
    settings: Settings!
  }
  
  extend type Mutation {
    updateSettings(input: SettingsInput!): Settings!
  }
  
  type Settings {
    id: ID!
    shop: String!
    widgetTitle: String!
    widgetPlacement: String!
    widgetTheme: String!
    widgetButtonText: String!
    rememberVehicleEnabled: Boolean!
    rememberDays: Int!
    createdAt: Date!
    updatedAt: Date!
  }
  
  input SettingsInput {
    widgetTitle: String
    widgetPlacement: String
    widgetTheme: String
    widgetButtonText: String
    rememberVehicleEnabled: Boolean
    rememberDays: Int
  }
`;

export const resolvers = {
  Query: {
    settings: async (_, __, { session }) => {
      return getSettings(session.shop);
    },
  },
  Mutation: {
    updateSettings: async (_, { input }, { session }) => {
      return updateSettings(session.shop, input);
    },
  },
}; 