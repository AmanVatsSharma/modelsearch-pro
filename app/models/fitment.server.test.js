import { prisma } from '~/db.server.js';
import {
  getFitments,
  getFitment,
  createFitment,
  updateFitment,
  deleteFitment,
  bulkCreateFitments,
  deleteProductFitments,
  checkFitmentExists,
} from './fitment.server.js';

// Mock data
const mockFitment = {
  id: 'fitment1',
  productId: 'product1',
  yearId: 'year1',
  submodelId: 'submodel1',
  notes: 'Fits perfectly',
};

const mockFitmentWithRelations = {
  ...mockFitment,
  year: {
    id: 'year1',
    value: 2022,
    model: {
      id: 'model1',
      name: 'Camry',
      make: {
        id: 'make1',
        name: 'Toyota',
      },
    },
  },
  submodel: {
    id: 'submodel1',
    name: 'LE',
  },
};

// Reset mocks before each test
beforeEach(() => {
  jest.clearAllMocks();
});

describe('Fitment Model Tests', () => {
  describe('getFitments', () => {
    it('should return all fitments for a product with nested relations', async () => {
      // Setup
      const mockFitments = [mockFitmentWithRelations];
      prisma.fitment.findMany.mockResolvedValue(mockFitments);
      
      // Execute
      const result = await getFitments('product1');
      
      // Verify
      expect(prisma.fitment.findMany).toHaveBeenCalledWith({
        where: { productId: 'product1' },
        include: {
          year: {
            include: {
              model: {
                include: {
                  make: true,
                },
              },
            },
          },
          submodel: true,
        },
        orderBy: [
          { year: { model: { make: { name: "asc" } } } },
          { year: { model: { name: "asc" } } },
          { year: { value: "desc" } },
          { submodel: { name: "asc" } },
        ],
      });
      expect(result).toEqual(mockFitments);
    });
  });

  describe('getFitment', () => {
    it('should return a fitment by id with included relations', async () => {
      // Setup
      const fitmentWithProduct = {
        ...mockFitmentWithRelations,
        product: { id: 'product1', title: 'Oil Filter', handle: 'oil-filter' },
      };
      prisma.fitment.findUnique.mockResolvedValue(fitmentWithProduct);
      
      // Execute
      const result = await getFitment('fitment1');
      
      // Verify
      expect(prisma.fitment.findUnique).toHaveBeenCalledWith({
        where: { id: 'fitment1' },
        include: {
          year: {
            include: {
              model: {
                include: {
                  make: true,
                },
              },
            },
          },
          submodel: true,
          product: true,
        },
      });
      expect(result).toEqual(fitmentWithProduct);
    });
  });

  describe('createFitment', () => {
    it('should create a new fitment with included relations', async () => {
      // Setup
      const newFitment = {
        productId: 'product1',
        yearId: 'year1',
        submodelId: 'submodel1',
      };
      prisma.fitment.create.mockResolvedValue(mockFitmentWithRelations);
      
      // Execute
      const result = await createFitment(newFitment);
      
      // Verify
      expect(prisma.fitment.create).toHaveBeenCalledWith({
        data: newFitment,
        include: {
          year: {
            include: {
              model: {
                include: {
                  make: true,
                },
              },
            },
          },
          submodel: true,
        },
      });
      expect(result).toEqual(mockFitmentWithRelations);
    });
  });

  describe('updateFitment', () => {
    it('should update a fitment', async () => {
      // Setup
      const updateData = { notes: 'Updated notes' };
      const updatedFitment = { ...mockFitmentWithRelations, ...updateData };
      prisma.fitment.update.mockResolvedValue(updatedFitment);
      
      // Execute
      const result = await updateFitment('fitment1', updateData);
      
      // Verify
      expect(prisma.fitment.update).toHaveBeenCalledWith({
        where: { id: 'fitment1' },
        data: updateData,
        include: {
          year: {
            include: {
              model: {
                include: {
                  make: true,
                },
              },
            },
          },
          submodel: true,
        },
      });
      expect(result).toEqual(updatedFitment);
    });
  });

  describe('deleteFitment', () => {
    it('should delete a fitment', async () => {
      // Setup
      prisma.fitment.delete.mockResolvedValue(mockFitment);
      
      // Execute
      const result = await deleteFitment('fitment1');
      
      // Verify
      expect(prisma.fitment.delete).toHaveBeenCalledWith({
        where: { id: 'fitment1' },
      });
      expect(result).toEqual(mockFitment);
    });
  });

  describe('bulkCreateFitments', () => {
    it('should create multiple fitments', async () => {
      // Setup
      const newFitments = [
        { productId: 'product1', yearId: 'year1', submodelId: 'submodel1' },
        { productId: 'product1', yearId: 'year2', submodelId: 'submodel2' },
      ];
      const creationResult = { count: 2 };
      prisma.fitment.createMany.mockResolvedValue(creationResult);
      
      // Execute
      const result = await bulkCreateFitments(newFitments);
      
      // Verify
      expect(prisma.fitment.createMany).toHaveBeenCalledWith({
        data: newFitments,
        skipDuplicates: true,
      });
      expect(result).toEqual(creationResult);
    });
  });

  describe('deleteProductFitments', () => {
    it('should delete all fitments for a product', async () => {
      // Setup
      const deletionResult = { count: 5 };
      prisma.fitment.deleteMany.mockResolvedValue(deletionResult);
      
      // Execute
      const result = await deleteProductFitments('product1');
      
      // Verify
      expect(prisma.fitment.deleteMany).toHaveBeenCalledWith({
        where: { productId: 'product1' },
      });
      expect(result).toEqual(deletionResult);
    });
  });

  describe('checkFitmentExists', () => {
    it('should check if a fitment exists with submodel', async () => {
      // Setup
      prisma.fitment.findFirst.mockResolvedValue(mockFitment);
      
      // Execute
      const result = await checkFitmentExists('product1', 'year1', 'submodel1');
      
      // Verify
      expect(prisma.fitment.findFirst).toHaveBeenCalledWith({
        where: {
          productId: 'product1',
          yearId: 'year1',
          submodelId: 'submodel1',
        },
      });
      expect(result).toEqual(mockFitment);
    });

    it('should check if a fitment exists without submodel', async () => {
      // Setup
      const fitmentWithoutSubmodel = { ...mockFitment, submodelId: null };
      prisma.fitment.findFirst.mockResolvedValue(fitmentWithoutSubmodel);
      
      // Execute
      const result = await checkFitmentExists('product1', 'year1', null);
      
      // Verify
      expect(prisma.fitment.findFirst).toHaveBeenCalledWith({
        where: {
          productId: 'product1',
          yearId: 'year1',
          submodelId: null,
        },
      });
      expect(result).toEqual(fitmentWithoutSubmodel);
    });
  });
}); 