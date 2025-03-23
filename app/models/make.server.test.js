import { prisma } from '~/db.server.js';
import {
  getMakes,
  getMake,
  createMake,
  updateMake,
  deleteMake,
  getMakeByName,
  bulkCreateMakes,
} from './make.server.js';

// Mock data
const mockMake = { id: 'make1', name: 'Toyota' };
const mockMakes = [
  { id: 'make1', name: 'Toyota' },
  { id: 'make2', name: 'Honda' },
];

// Reset mocks before each test
beforeEach(() => {
  jest.clearAllMocks();
});

describe('Make Model Tests', () => {
  describe('getMakes', () => {
    it('should return all makes ordered by name', async () => {
      // Setup
      prisma.make.findMany.mockResolvedValue(mockMakes);
      
      // Execute
      const result = await getMakes();
      
      // Verify
      expect(prisma.make.findMany).toHaveBeenCalledWith({
        orderBy: { name: 'asc' },
      });
      expect(result).toEqual(mockMakes);
    });
  });

  describe('getMake', () => {
    it('should return a make by id with included models', async () => {
      // Setup
      const makeWithModels = { ...mockMake, models: [] };
      prisma.make.findUnique.mockResolvedValue(makeWithModels);
      
      // Execute
      const result = await getMake('make1');
      
      // Verify
      expect(prisma.make.findUnique).toHaveBeenCalledWith({
        where: { id: 'make1' },
        include: { models: true },
      });
      expect(result).toEqual(makeWithModels);
    });
  });

  describe('createMake', () => {
    it('should create a new make', async () => {
      // Setup
      const newMake = { name: 'Ford' };
      const createdMake = { id: 'make3', ...newMake };
      prisma.make.create.mockResolvedValue(createdMake);
      
      // Execute
      const result = await createMake(newMake);
      
      // Verify
      expect(prisma.make.create).toHaveBeenCalledWith({
        data: newMake,
      });
      expect(result).toEqual(createdMake);
    });
  });

  describe('updateMake', () => {
    it('should update a make', async () => {
      // Setup
      const updateData = { name: 'Toyota Motors' };
      const updatedMake = { ...mockMake, ...updateData };
      prisma.make.update.mockResolvedValue(updatedMake);
      
      // Execute
      const result = await updateMake('make1', updateData);
      
      // Verify
      expect(prisma.make.update).toHaveBeenCalledWith({
        where: { id: 'make1' },
        data: updateData,
      });
      expect(result).toEqual(updatedMake);
    });
  });

  describe('deleteMake', () => {
    it('should delete a make', async () => {
      // Setup
      prisma.make.delete.mockResolvedValue(mockMake);
      
      // Execute
      const result = await deleteMake('make1');
      
      // Verify
      expect(prisma.make.delete).toHaveBeenCalledWith({
        where: { id: 'make1' },
      });
      expect(result).toEqual(mockMake);
    });
  });

  describe('getMakeByName', () => {
    it('should find a make by name case insensitive', async () => {
      // Setup
      prisma.make.findFirst.mockResolvedValue(mockMake);
      
      // Execute
      const result = await getMakeByName('toyota');
      
      // Verify
      expect(prisma.make.findFirst).toHaveBeenCalledWith({
        where: { name: { equals: 'toyota', mode: 'insensitive' } },
      });
      expect(result).toEqual(mockMake);
    });
  });

  describe('bulkCreateMakes', () => {
    it('should create multiple makes', async () => {
      // Setup
      const newMakes = [{ name: 'Ford' }, { name: 'Chevrolet' }];
      const creationResult = { count: 2 };
      prisma.make.createMany.mockResolvedValue(creationResult);
      
      // Execute
      const result = await bulkCreateMakes(newMakes);
      
      // Verify
      expect(prisma.make.createMany).toHaveBeenCalledWith({
        data: newMakes,
        skipDuplicates: true,
      });
      expect(result).toEqual(creationResult);
    });
  });
}); 