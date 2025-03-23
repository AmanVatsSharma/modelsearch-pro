import { loader } from './years.js';
import { getYears } from '~/models/year.server';
import { authenticate } from '~/shopify.server';

// Mock dependencies
jest.mock('~/models/year.server');
jest.mock('~/shopify.server');

describe('Years API Endpoint', () => {
  const mockRequest = new Request('https://example.com/api/vehicle/years?modelId=model1');
  const mockSession = { shop: 'test-shop.myshopify.com' };
  const mockYears = [
    { id: 'year1', value: 2020, modelId: 'model1' },
    { id: 'year2', value: 2021, modelId: 'model1' },
  ];

  beforeEach(() => {
    jest.clearAllMocks();
    authenticate.public.appProxy.mockResolvedValue({ session: mockSession });
  });

  it('should return years when authentication and request are successful', async () => {
    // Setup
    getYears.mockResolvedValue(mockYears);
    
    // Execute
    const response = await loader({ request: mockRequest });
    const data = await response.json();
    
    // Verify
    expect(authenticate.public.appProxy).toHaveBeenCalledWith(mockRequest);
    expect(getYears).toHaveBeenCalledWith('model1');
    expect(data).toEqual({ years: mockYears });
  });

  it('should return 400 when modelId is missing', async () => {
    // Setup
    const requestWithoutModelId = new Request('https://example.com/api/vehicle/years');
    
    // Execute
    const response = await loader({ request: requestWithoutModelId });
    const data = await response.json();
    
    // Verify
    expect(authenticate.public.appProxy).toHaveBeenCalledWith(requestWithoutModelId);
    expect(getYears).not.toHaveBeenCalled();
    expect(response.status).toBe(400);
    expect(data).toEqual({ error: 'modelId parameter is required' });
  });

  it('should return error when year fetching fails', async () => {
    // Setup
    const mockError = new Error('Database error');
    getYears.mockRejectedValue(mockError);
    
    // Mock console.error to prevent test logs from being cluttered
    jest.spyOn(console, 'error').mockImplementation(() => {});
    
    // Execute
    const response = await loader({ request: mockRequest });
    const data = await response.json();
    
    // Verify
    expect(authenticate.public.appProxy).toHaveBeenCalledWith(mockRequest);
    expect(getYears).toHaveBeenCalledWith('model1');
    expect(response.status).toBe(500);
    expect(data).toEqual({ error: 'Failed to fetch years' });
    expect(console.error).toHaveBeenCalledWith('Error fetching years:', mockError);
  });

  it('should reject when authentication fails', async () => {
    // Setup
    const authError = new Error('Authentication failed');
    authenticate.public.appProxy.mockRejectedValue(authError);
    
    // Execute and Verify
    await expect(loader({ request: mockRequest })).rejects.toThrow(authError);
    expect(getYears).not.toHaveBeenCalled();
  });
}); 