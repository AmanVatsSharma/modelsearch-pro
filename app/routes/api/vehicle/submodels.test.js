import { loader } from './submodels.js';
import { getSubmodels } from '~/models/submodel.server';
import { authenticate } from '~/shopify.server';

// Mock dependencies
jest.mock('~/models/submodel.server');
jest.mock('~/shopify.server');

describe('Submodels API Endpoint', () => {
  const mockRequest = new Request('https://example.com/api/vehicle/submodels?yearId=year1');
  const mockSession = { shop: 'test-shop.myshopify.com' };
  const mockSubmodels = [
    { id: 'submodel1', name: 'SE', yearId: 'year1' },
    { id: 'submodel2', name: 'XLE', yearId: 'year1' },
  ];

  beforeEach(() => {
    jest.clearAllMocks();
    authenticate.public.appProxy.mockResolvedValue({ session: mockSession });
  });

  it('should return submodels when authentication and request are successful', async () => {
    // Setup
    getSubmodels.mockResolvedValue(mockSubmodels);
    
    // Execute
    const response = await loader({ request: mockRequest });
    const data = await response.json();
    
    // Verify
    expect(authenticate.public.appProxy).toHaveBeenCalledWith(mockRequest);
    expect(getSubmodels).toHaveBeenCalledWith('year1');
    expect(data).toEqual({ submodels: mockSubmodels });
  });

  it('should return 400 when yearId is missing', async () => {
    // Setup
    const requestWithoutYearId = new Request('https://example.com/api/vehicle/submodels');
    
    // Execute
    const response = await loader({ request: requestWithoutYearId });
    const data = await response.json();
    
    // Verify
    expect(authenticate.public.appProxy).toHaveBeenCalledWith(requestWithoutYearId);
    expect(getSubmodels).not.toHaveBeenCalled();
    expect(response.status).toBe(400);
    expect(data).toEqual({ error: 'yearId parameter is required' });
  });

  it('should return error when submodel fetching fails', async () => {
    // Setup
    const mockError = new Error('Database error');
    getSubmodels.mockRejectedValue(mockError);
    
    // Mock console.error to prevent test logs from being cluttered
    jest.spyOn(console, 'error').mockImplementation(() => {});
    
    // Execute
    const response = await loader({ request: mockRequest });
    const data = await response.json();
    
    // Verify
    expect(authenticate.public.appProxy).toHaveBeenCalledWith(mockRequest);
    expect(getSubmodels).toHaveBeenCalledWith('year1');
    expect(response.status).toBe(500);
    expect(data).toEqual({ error: 'Failed to fetch submodels' });
    expect(console.error).toHaveBeenCalledWith('Error fetching submodels:', mockError);
  });

  it('should reject when authentication fails', async () => {
    // Setup
    const authError = new Error('Authentication failed');
    authenticate.public.appProxy.mockRejectedValue(authError);
    
    // Execute and Verify
    await expect(loader({ request: mockRequest })).rejects.toThrow(authError);
    expect(getSubmodels).not.toHaveBeenCalled();
  });
}); 