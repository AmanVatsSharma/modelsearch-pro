import { GraphQLScalarType, Kind } from 'graphql';
import * as makeModel from '../../models/make.server.js';
import * as modelModel from '../../models/model.server.js';
import * as yearModel from '../../models/year.server.js';
import * as submodelModel from '../../models/submodel.server.js';
import * as productModel from '../../models/product.server.js';
import * as fitmentModel from '../../models/fitment.server.js';
import * as settingsModel from '../../models/settings.server.js';
import * as analyticsModel from '../../models/analytics.server.js';
import * as importModel from '../../models/import.server.js';

// Date scalar for handling dates
const dateScalar = new GraphQLScalarType({
  name: 'Date',
  description: 'Date custom scalar type',
  serialize(value) {
    return value.toISOString(); // Convert outgoing Date to ISO string
  },
  parseValue(value) {
    return new Date(value); // Convert incoming string to Date
  },
  parseLiteral(ast) {
    if (ast.kind === Kind.STRING) {
      return new Date(ast.value); // Convert AST string to Date
    }
    return null;
  },
});

export const resolvers = {
  Date: dateScalar,
  
  Query: {
    // Make queries
    makes: async (_, __, { session }) => {
      return makeModel.getMakes(session.shop);
    },
    make: async (_, { id }, { session }) => {
      return makeModel.getMake(id);
    },
    
    // Model queries
    models: async (_, { makeId }, { session }) => {
      return modelModel.getModels(makeId);
    },
    model: async (_, { id }, { session }) => {
      return modelModel.getModel(id);
    },
    
    // Year queries
    years: async (_, { modelId }, { session }) => {
      return yearModel.getYears(modelId);
    },
    year: async (_, { id }, { session }) => {
      return yearModel.getYear(id);
    },
    
    // Submodel queries
    submodels: async (_, { yearId }, { session }) => {
      return submodelModel.getSubmodels(yearId);
    },
    submodel: async (_, { id }, { session }) => {
      return submodelModel.getSubmodel(id);
    },
    
    // Product queries
    products: async (_, { page, limit, search }, { session }) => {
      return productModel.getProducts(session.shop, { page, limit, search });
    },
    product: async (_, { id }, { session }) => {
      return productModel.getProduct(id, session.shop);
    },
    compatibleProducts: async (_, { yearId, submodelId, page, limit }, { session }) => {
      return productModel.getCompatibleProducts(session.shop, null, null, yearId, submodelId, { page, limit });
    },
    
    // Fitment queries
    fitments: async (_, { productId }, { session }) => {
      return fitmentModel.getFitments(productId);
    },
    fitment: async (_, { id }, { session }) => {
      return fitmentModel.getFitment(id);
    },
    
    // Settings queries
    settings: async (_, __, { session }) => {
      return settingsModel.getSettings(session.shop);
    },
    
    // Analytics queries
    searchLogs: async (_, { startDate, endDate, page, limit }, { session }) => {
      return analyticsModel.getSearchLogs(session.shop, { startDate, endDate, page, limit });
    },
    searchStats: async (_, { startDate, endDate }, { session }) => {
      return analyticsModel.getSearchStats(session.shop, { startDate, endDate });
    },
    productViews: async (_, { startDate, endDate, page, limit }, { session }) => {
      return analyticsModel.getProductViews(session.shop, { startDate, endDate, page, limit });
    },
    topViewedProducts: async (_, { startDate, endDate, limit }, { session }) => {
      return analyticsModel.getTopViewedProducts(session.shop, { startDate, endDate, limit });
    },
    
    // Import job queries
    importJobs: async (_, { page, limit }, { session }) => {
      return importModel.getImportJobs(session.shop, { page, limit });
    },
    importJob: async (_, { id }, { session }) => {
      return importModel.getImportJob(id);
    },
  },
  
  Mutation: {
    // Make mutations
    createMake: async (_, { input }, { session }) => {
      return makeModel.createMake(input);
    },
    updateMake: async (_, { id, input }, { session }) => {
      return makeModel.updateMake(id, input);
    },
    deleteMake: async (_, { id }, { session }) => {
      await makeModel.deleteMake(id);
      return true;
    },
    
    // Model mutations
    createModel: async (_, { input }, { session }) => {
      return modelModel.createModel(input);
    },
    updateModel: async (_, { id, input }, { session }) => {
      return modelModel.updateModel(id, input);
    },
    deleteModel: async (_, { id }, { session }) => {
      await modelModel.deleteModel(id);
      return true;
    },
    
    // Year mutations
    createYear: async (_, { input }, { session }) => {
      return yearModel.createYear(input);
    },
    updateYear: async (_, { id, input }, { session }) => {
      return yearModel.updateYear(id, input);
    },
    deleteYear: async (_, { id }, { session }) => {
      await yearModel.deleteYear(id);
      return true;
    },
    
    // Submodel mutations
    createSubmodel: async (_, { input }, { session }) => {
      return submodelModel.createSubmodel(input);
    },
    updateSubmodel: async (_, { id, input }, { session }) => {
      return submodelModel.updateSubmodel(id, input);
    },
    deleteSubmodel: async (_, { id }, { session }) => {
      await submodelModel.deleteSubmodel(id);
      return true;
    },
    
    // Product mutations
    createProduct: async (_, { input }, { session }) => {
      return productModel.createProduct({ ...input, shop: session.shop });
    },
    updateProduct: async (_, { id, input }, { session }) => {
      return productModel.updateProduct(id, session.shop, input);
    },
    deleteProduct: async (_, { id }, { session }) => {
      await productModel.deleteProduct(id, session.shop);
      return true;
    },
    
    // Fitment mutations
    createFitment: async (_, { input }, { session }) => {
      return fitmentModel.createFitment(input);
    },
    updateFitment: async (_, { id, input }, { session }) => {
      return fitmentModel.updateFitment(id, input);
    },
    deleteFitment: async (_, { id }, { session }) => {
      await fitmentModel.deleteFitment(id);
      return true;
    },
    deleteProductFitments: async (_, { productId }, { session }) => {
      await fitmentModel.deleteProductFitments(productId);
      return true;
    },
    
    // Settings mutations
    updateSettings: async (_, { input }, { session }) => {
      return settingsModel.updateSettings(session.shop, input);
    },
    
    // Analytics mutations
    createSearchLog: async (_, { input }, { session }) => {
      return analyticsModel.createSearchLog({
        ...input,
        shop: session.shop,
      });
    },
    createProductView: async (_, { input }, { session }) => {
      return analyticsModel.createProductView({
        ...input,
        shop: session.shop,
      });
    },
    
    // Import job mutations
    createImportJob: async (_, { input }, { session }) => {
      return importModel.createImportJob({
        ...input,
        shop: session.shop,
      });
    },
    updateImportJob: async (_, { id, input }, { session }) => {
      return importModel.updateImportJob(id, input);
    },
    markImportJobComplete: async (_, { id, processedRows, errorRows, errorLog }, { session }) => {
      return importModel.markImportJobComplete(id, { processedRows, errorRows, errorLog });
    },
    markImportJobFailed: async (_, { id, errorLog }, { session }) => {
      return importModel.markImportJobFailed(id, errorLog);
    },
    deleteImportJob: async (_, { id }, { session }) => {
      await importModel.deleteImportJob(id);
      return true;
    },
  },
  
  // Resolver for relationships
  Make: {
    models: async (parent) => {
      if (parent.models) return parent.models;
      return modelModel.getModels(parent.id);
    },
  },
  
  Model: {
    make: async (parent) => {
      if (parent.make) return parent.make;
      return makeModel.getMake(parent.makeId);
    },
    years: async (parent) => {
      if (parent.years) return parent.years;
      return yearModel.getYears(parent.id);
    },
  },
  
  Year: {
    model: async (parent) => {
      if (parent.model) return parent.model;
      return modelModel.getModel(parent.modelId);
    },
    submodels: async (parent) => {
      if (parent.submodels) return parent.submodels;
      return submodelModel.getSubmodels(parent.id);
    },
  },
  
  Submodel: {
    year: async (parent) => {
      if (parent.year) return parent.year;
      return yearModel.getYear(parent.yearId);
    },
  },
  
  Product: {
    fitments: async (parent) => {
      if (parent.fitments) return parent.fitments;
      return fitmentModel.getFitments(parent.id);
    },
  },
  
  Fitment: {
    product: async (parent) => {
      if (parent.product) return parent.product;
      return productModel.getProduct(parent.productId);
    },
    year: async (parent) => {
      if (parent.year) return parent.year;
      return yearModel.getYear(parent.yearId);
    },
    submodel: async (parent) => {
      if (!parent.submodelId) return null;
      if (parent.submodel) return parent.submodel;
      return submodelModel.getSubmodel(parent.submodelId);
    },
  },
}; 