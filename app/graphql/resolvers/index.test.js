import { resolvers } from './index.js';
import * as makeModel from '~/models/make.server.js';
import * as modelModel from '~/models/model.server.js';
import * as yearModel from '~/models/year.server.js';
import * as fitmentModel from '~/models/fitment.server.js';
import * as productModel from '~/models/product.server.js';
import * as settingsModel from '~/models/settings.server.js';

// Mock all model functions
jest.mock('~/models/make.server.js');
jest.mock('~/models/model.server.js');
jest.mock('~/models/year.server.js');
jest.mock('~/models/fitment.server.js');
jest.mock('~/models/product.server.js');
jest.mock('~/models/settings.server.js');

// Mock data
const mockSession = { shop: 'test-shop.myshopify.com' };
const mockMakes = [{ id: 'make1', name: 'Toyota' }];
const mockModels = [{ id: 'model1', name: 'Camry', makeId: 'make1' }];
const mockYears = [{ id: 'year1', value: 2023, modelId: 'model1' }];
const mockProducts = [{ id: 'product1', title: 'Oil Filter', handle: 'oil-filter' }];
const mockFitments = [{ id: 'fitment1', productId: 'product1', yearId: 'year1' }];
const mockSettings = { 
  id: 'settings1', 
  shop: 'test-shop.myshopify.com',
  widgetTitle: 'Find parts for your vehicle'
};

describe('GraphQL Resolvers', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Date scalar', () => {
    it('should serialize Date to ISO string', () => {
      const date = new Date('2023-01-01T00:00:00.000Z');
      const result = resolvers.Date.serialize(date);
      expect(result).toBe('2023-01-01T00:00:00.000Z');
    });

    it('should parse ISO string to Date', () => {
      const dateString = '2023-01-01T00:00:00.000Z';
      const result = resolvers.Date.parseValue(dateString);
      expect(result).toBeInstanceOf(Date);
      expect(result.toISOString()).toBe(dateString);
    });
  });

  describe('Query resolvers', () => {
    it('should resolve makes query', async () => {
      // Setup
      makeModel.getMakes.mockResolvedValue(mockMakes);
      
      // Execute
      const result = await resolvers.Query.makes(null, {}, { session: mockSession });
      
      // Verify
      expect(makeModel.getMakes).toHaveBeenCalledWith(mockSession.shop);
      expect(result).toEqual(mockMakes);
    });

    it('should resolve make query', async () => {
      // Setup
      makeModel.getMake.mockResolvedValue(mockMakes[0]);
      
      // Execute
      const result = await resolvers.Query.make(null, { id: 'make1' }, { session: mockSession });
      
      // Verify
      expect(makeModel.getMake).toHaveBeenCalledWith('make1');
      expect(result).toEqual(mockMakes[0]);
    });

    it('should resolve models query', async () => {
      // Setup
      modelModel.getModels.mockResolvedValue(mockModels);
      
      // Execute
      const result = await resolvers.Query.models(null, { makeId: 'make1' }, { session: mockSession });
      
      // Verify
      expect(modelModel.getModels).toHaveBeenCalledWith('make1');
      expect(result).toEqual(mockModels);
    });

    it('should resolve products query with search and pagination', async () => {
      // Setup
      const mockProductsResponse = {
        products: mockProducts,
        pagination: { page: 1, pageSize: 10, totalItems: 1, totalPages: 1 }
      };
      productModel.getProducts.mockResolvedValue(mockProductsResponse);
      
      // Execute
      const result = await resolvers.Query.products(
        null, 
        { page: 1, limit: 10, search: 'oil' }, 
        { session: mockSession }
      );
      
      // Verify
      expect(productModel.getProducts).toHaveBeenCalledWith(
        mockSession.shop, 
        { page: 1, limit: 10, search: 'oil' }
      );
      expect(result).toEqual(mockProductsResponse);
    });

    it('should resolve settings query', async () => {
      // Setup
      settingsModel.getSettings.mockResolvedValue(mockSettings);
      
      // Execute
      const result = await resolvers.Query.settings(null, {}, { session: mockSession });
      
      // Verify
      expect(settingsModel.getSettings).toHaveBeenCalledWith(mockSession.shop);
      expect(result).toEqual(mockSettings);
    });
  });

  describe('Mutation resolvers', () => {
    it('should resolve createMake mutation', async () => {
      // Setup
      const input = { name: 'Honda' };
      const newMake = { id: 'make2', name: 'Honda' };
      makeModel.createMake.mockResolvedValue(newMake);
      
      // Execute
      const result = await resolvers.Mutation.createMake(null, { input }, { session: mockSession });
      
      // Verify
      expect(makeModel.createMake).toHaveBeenCalledWith(input);
      expect(result).toEqual(newMake);
    });

    it('should resolve updateMake mutation', async () => {
      // Setup
      const input = { name: 'Toyota Motors' };
      const updatedMake = { id: 'make1', name: 'Toyota Motors' };
      makeModel.updateMake.mockResolvedValue(updatedMake);
      
      // Execute
      const result = await resolvers.Mutation.updateMake(null, { id: 'make1', input }, { session: mockSession });
      
      // Verify
      expect(makeModel.updateMake).toHaveBeenCalledWith('make1', input);
      expect(result).toEqual(updatedMake);
    });

    it('should resolve deleteMake mutation', async () => {
      // Setup
      makeModel.deleteMake.mockResolvedValue(true);
      
      // Execute
      const result = await resolvers.Mutation.deleteMake(null, { id: 'make1' }, { session: mockSession });
      
      // Verify
      expect(makeModel.deleteMake).toHaveBeenCalledWith('make1');
      expect(result).toBe(true);
    });

    it('should resolve createFitment mutation', async () => {
      // Setup
      const input = { productId: 'product1', yearId: 'year1' };
      const newFitment = { id: 'fitment1', ...input };
      fitmentModel.createFitment.mockResolvedValue(newFitment);
      
      // Execute
      const result = await resolvers.Mutation.createFitment(null, { input }, { session: mockSession });
      
      // Verify
      expect(fitmentModel.createFitment).toHaveBeenCalledWith(input);
      expect(result).toEqual(newFitment);
    });

    it('should resolve updateSettings mutation', async () => {
      // Setup
      const input = { widgetTitle: 'New Title' };
      const updatedSettings = { ...mockSettings, widgetTitle: 'New Title' };
      settingsModel.updateSettings.mockResolvedValue(updatedSettings);
      
      // Execute
      const result = await resolvers.Mutation.updateSettings(null, { input }, { session: mockSession });
      
      // Verify
      expect(settingsModel.updateSettings).toHaveBeenCalledWith(mockSession.shop, input);
      expect(result).toEqual(updatedSettings);
    });
  });
}); 