import { loader } from './models.js';
import { getModels } from '~/models/model.server';
import { authenticate } from '~/shopify.server';

// Mock dependencies
jest.mock('~/models/model.server');
jest.mock('~/shopify.server');

describe('Models API Endpoint', () => {
  const mockRequest = new Request('https://example.com/api/vehicle/models?makeId=make1');
  const mockSession = { shop: 'test-shop.myshopify.com' };
  const mockModels = [
    { id: 'model1', name: 'Camry', makeId: 'make1' },
    { id: 'model2', name: 'Corolla', makeId: 'make1' },
  ];

  beforeEach(() => {
    jest.clearAllMocks();
    authenticate.public.appProxy.mockResolvedValue({ session: mockSession });
  });

  it('should return models when successful', async () => {
    // Setup
    getModels.mockResolvedValue(mockModels);
    
    // Execute
    const response = await loader({ request: mockRequest });
    const data = await response.json();
    
    // Verify
    expect(authenticate.public.appProxy).toHaveBeenCalledWith(mockRequest);
    expect(getModels).toHaveBeenCalledWith('make1');
    expect(data).toEqual({ models: mockModels });
  });

  it('should return 400 when makeId is missing', async () => {
    // Setup
    const requestWithoutMakeId = new Request('https://example.com/api/vehicle/models');
    
    // Execute
    const response = await loader({ request: requestWithoutMakeId });
    const data = await response.json();
    
    // Verify
    expect(authenticate.public.appProxy).toHaveBeenCalledWith(requestWithoutMakeId);
    expect(getModels).not.toHaveBeenCalled();
    expect(response.status).toBe(400);
    expect(data).toEqual({ error: 'makeId parameter is required' });
  });

  it('should return error when model fetching fails', async () => {
    // Setup
    const mockError = new Error('Database error');
    getModels.mockRejectedValue(mockError);
    
    // Mock console.error to prevent test logs from being cluttered
    jest.spyOn(console, 'error').mockImplementation(() => {});
    
    // Execute
    const response = await loader({ request: mockRequest });
    const data = await response.json();
    
    // Verify
    expect(authenticate.public.appProxy).toHaveBeenCalledWith(mockRequest);
    expect(getModels).toHaveBeenCalledWith('make1');
    expect(response.status).toBe(500);
    expect(data).toEqual({ error: 'Failed to fetch models' });
    expect(console.error).toHaveBeenCalledWith('Error fetching models:', mockError);
  });
}); 