import { loader } from './makes.js';
import { getMakes } from '~/models/make.server';
import { authenticate } from '~/shopify.server';

// Mock dependencies
jest.mock('~/models/make.server');
jest.mock('~/shopify.server');

describe('Makes API Endpoint', () => {
  const mockRequest = new Request('https://example.com/api/vehicle/makes');
  const mockSession = { shop: 'test-shop.myshopify.com' };
  const mockMakes = [
    { id: 'make1', name: 'Toyota' },
    { id: 'make2', name: 'Honda' },
  ];

  beforeEach(() => {
    jest.clearAllMocks();
    authenticate.public.appProxy.mockResolvedValue({ session: mockSession });
  });

  it('should return makes when successful', async () => {
    // Setup
    getMakes.mockResolvedValue(mockMakes);
    
    // Execute
    const response = await loader({ request: mockRequest });
    const data = await response.json();
    
    // Verify
    expect(authenticate.public.appProxy).toHaveBeenCalledWith(mockRequest);
    expect(getMakes).toHaveBeenCalledWith(mockSession.shop);
    expect(data).toEqual({ makes: mockMakes });
  });

  it('should return error when make fetching fails', async () => {
    // Setup
    const mockError = new Error('Database error');
    getMakes.mockRejectedValue(mockError);
    
    // Mock console.error to prevent test logs from being cluttered
    jest.spyOn(console, 'error').mockImplementation(() => {});
    
    // Execute
    const response = await loader({ request: mockRequest });
    const data = await response.json();
    
    // Verify
    expect(authenticate.public.appProxy).toHaveBeenCalledWith(mockRequest);
    expect(getMakes).toHaveBeenCalledWith(mockSession.shop);
    expect(response.status).toBe(500);
    expect(data).toEqual({ error: 'Failed to fetch makes' });
    expect(console.error).toHaveBeenCalledWith('Error fetching makes:', mockError);
  });

  it('should reject when authentication fails', async () => {
    // Setup
    const authError = new Error('Authentication failed');
    authenticate.public.appProxy.mockRejectedValue(authError);
    
    // Execute and Verify
    await expect(loader({ request: mockRequest })).rejects.toThrow(authError);
    expect(getMakes).not.toHaveBeenCalled();
  });
}); 