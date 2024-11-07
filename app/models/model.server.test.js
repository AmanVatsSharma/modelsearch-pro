import { prisma } from '~/db.server.js';
import {
  getModels,
  getModel,
  createModel,
  updateModel,
  deleteModel,
  getModelByName,
  bulkCreateModels,
} from './model.server.js';

// Mock data
const mockModel = { id: 'model1', name: 'Camry', makeId: 'make1' };
const mockModels = [
  { id: 'model1', name: 'Camry', makeId: 'make1' },
  { id: 'model2', name: 'Corolla', makeId: 'make1' },
];

// Reset mocks before each test
beforeEach(() => {
  jest.clearAllMocks();
});

describe('Model Model Tests', () => {
  describe('getModels', () => {
    it('should return all models for a make ordered by name', async () => {
      // Setup
      prisma.model.findMany.mockResolvedValue(mockModels);
      
      // Execute
      const result = await getModels('make1');
      
      // Verify
      expect(prisma.model.findMany).toHaveBeenCalledWith({
        where: { makeId: 'make1' },
        orderBy: { name: 'asc' },
      });
      expect(result).toEqual(mockModels);
    });
  });

  describe('getModel', () => {
    it('should return a model by id with included years and make', async () => {
      // Setup
      const modelWithRelations = { 
        ...mockModel, 
        years: [],
        make: { id: 'make1', name: 'Toyota' }
      };
      prisma.model.findUnique.mockResolvedValue(modelWithRelations);
      
      // Execute
      const result = await getModel('model1');
      
      // Verify
      expect(prisma.model.findUnique).toHaveBeenCalledWith({
        where: { id: 'model1' },
        include: { years: true, make: true },
      });
      expect(result).toEqual(modelWithRelations);
    });
  });

  describe('createModel', () => {
    it('should create a new model', async () => {
      // Setup
      const newModel = { name: 'Avalon', makeId: 'make1' };
      const createdModel = { id: 'model3', ...newModel };
      prisma.model.create.mockResolvedValue(createdModel);
      
      // Execute
      const result = await createModel(newModel);
      
      // Verify
      expect(prisma.model.create).toHaveBeenCalledWith({
        data: newModel,
      });
      expect(result).toEqual(createdModel);
    });
  });

  describe('updateModel', () => {
    it('should update a model', async () => {
      // Setup
      const updateData = { name: 'Camry SE' };
      const updatedModel = { ...mockModel, ...updateData };
      prisma.model.update.mockResolvedValue(updatedModel);
      
      // Execute
      const result = await updateModel('model1', updateData);
      
      // Verify
      expect(prisma.model.update).toHaveBeenCalledWith({
        where: { id: 'model1' },
        data: updateData,
      });
      expect(result).toEqual(updatedModel);
    });
  });

  describe('deleteModel', () => {
    it('should delete a model', async () => {
      // Setup
      prisma.model.delete.mockResolvedValue(mockModel);
      
      // Execute
      const result = await deleteModel('model1');
      
      // Verify
      expect(prisma.model.delete).toHaveBeenCalledWith({
        where: { id: 'model1' },
      });
      expect(result).toEqual(mockModel);
    });
  });

  describe('getModelByName', () => {
    it('should find a model by name case insensitive', async () => {
      // Setup
      prisma.model.findFirst.mockResolvedValue(mockModel);
      
      // Execute
      const result = await getModelByName('make1', 'camry');
      
      // Verify
      expect(prisma.model.findFirst).toHaveBeenCalledWith({
        where: {
          makeId: 'make1',
          name: { equals: 'camry', mode: 'insensitive' },
        },
      });
      expect(result).toEqual(mockModel);
    });
  });

  describe('bulkCreateModels', () => {
    it('should create multiple models', async () => {
      // Setup
      const newModels = [
        { name: 'Avalon', makeId: 'make1' }, 
        { name: 'Prius', makeId: 'make1' }
      ];
      const creationResult = { count: 2 };
      prisma.model.createMany.mockResolvedValue(creationResult);
      
      // Execute
      const result = await bulkCreateModels(newModels);
      
      // Verify
      expect(prisma.model.createMany).toHaveBeenCalledWith({
        data: newModels,
        skipDuplicates: true,
      });
      expect(result).toEqual(creationResult);
    });
  });
}); 