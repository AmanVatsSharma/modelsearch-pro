const { authenticate } = require('./shopify.server');
import { describe, it, expect, beforeEach, jest } from '@jest/globals';

// Mock the response from Shopify's authenticate methods
jest.mock('./shopify.server', () => ({
  authenticate: {
    admin: jest.fn(),
    public: {
      appProxy: jest.fn()
    },
    webhook: jest.fn()
  }
}));

describe('Shopify Authentication Tests', () => {
  const mockRequest = new Request('https://test-app.myshopify.com/api/test');
  const mockSession = { shop: 'test-shop.myshopify.com', accessToken: 'test-token' };
  const mockAdmin = { graphql: jest.fn() };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Admin Authentication', () => {
    beforeEach(() => {
      authenticate.admin.mockResolvedValue({ session: mockSession, admin: mockAdmin });
    });

    it('should authenticate admin requests successfully', async () => {
      // Execute
      const result = await authenticate.admin(mockRequest);
      
      // Verify
      expect(authenticate.admin).toHaveBeenCalledWith(mockRequest);
      expect(result).toEqual({ session: mockSession, admin: mockAdmin });
    });

    it('should propagate authentication errors', async () => {
      // Setup
      const authError = new Error('Admin authentication failed');
      authenticate.admin.mockRejectedValueOnce(authError);
      
      // Execute and Verify
      await expect(authenticate.admin(mockRequest)).rejects.toThrow(authError);
    });
  });

  describe('Public App Proxy Authentication', () => {
    beforeEach(() => {
      authenticate.public.appProxy.mockResolvedValue({ session: mockSession });
    });

    it('should authenticate app proxy requests successfully', async () => {
      // Execute
      const result = await authenticate.public.appProxy(mockRequest);
      
      // Verify
      expect(authenticate.public.appProxy).toHaveBeenCalledWith(mockRequest);
      expect(result).toEqual({ session: mockSession });
    });

    it('should propagate authentication errors', async () => {
      // Setup
      const authError = new Error('App proxy authentication failed');
      authenticate.public.appProxy.mockRejectedValueOnce(authError);
      
      // Execute and Verify
      await expect(authenticate.public.appProxy(mockRequest)).rejects.toThrow(authError);
    });
  });

  describe('Webhook Authentication', () => {
    const mockWebhookPayload = { 
      topic: 'products/create',
      shop: 'test-shop.myshopify.com',
      payload: { id: 123, title: 'Test Product' }
    };

    beforeEach(() => {
      authenticate.webhook.mockResolvedValue(mockWebhookPayload);
    });

    it('should authenticate webhook requests successfully', async () => {
      // Execute
      const result = await authenticate.webhook(mockRequest);
      
      // Verify
      expect(authenticate.webhook).toHaveBeenCalledWith(mockRequest);
      expect(result).toEqual(mockWebhookPayload);
    });

    it('should propagate webhook authentication errors', async () => {
      // Setup
      const authError = new Error('Webhook authentication failed');
      authenticate.webhook.mockRejectedValueOnce(authError);
      
      // Execute and Verify
      await expect(authenticate.webhook(mockRequest)).rejects.toThrow(authError);
    });
  });
}); 