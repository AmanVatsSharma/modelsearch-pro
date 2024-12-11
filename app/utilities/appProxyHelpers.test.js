import { describe, it, expect, vi, beforeEach } from 'vitest';
import { verifyAppProxySignature, extractShopDomain, getAppProxyUrl } from './appProxyHelpers';
import crypto from 'crypto';

// Mock the crypto module
vi.mock('crypto', () => {
  return {
    createHmac: vi.fn(() => ({
      update: vi.fn(() => ({
        digest: vi.fn(() => 'test-signature-hash')
      }))
    }))
  };
});

describe('appProxyHelpers', () => {
  describe('verifyAppProxySignature', () => {
    beforeEach(() => {
      crypto.createHmac.mockClear();
    });

    it('should return false if signature is missing', () => {
      const url = new URL('https://test-shop.myshopify.com/apps/vehicle-search-widget/api/vehicle/makes');
      
      const result = verifyAppProxySignature(url, 'test-secret');
      
      expect(result).toBe(false);
      expect(crypto.createHmac).not.toHaveBeenCalled();
    });

    it('should verify a valid signature', () => {
      const url = new URL('https://test-shop.myshopify.com/apps/vehicle-search-widget/api/vehicle/makes?shop=test-shop.myshopify.com&timestamp=1234567890&signature=test-signature-hash');
      
      const result = verifyAppProxySignature(url, 'test-secret');
      
      expect(result).toBe(true);
      expect(crypto.createHmac).toHaveBeenCalledWith('sha256', 'test-secret');
    });

    it('should sort parameters alphabetically before hashing', () => {
      const url = new URL('https://test-shop.myshopify.com/apps/vehicle-search-widget/api/vehicle/makes?timestamp=1234567890&shop=test-shop.myshopify.com&signature=test-signature-hash');
      
      verifyAppProxySignature(url, 'test-secret');
      
      // Get the string passed to update()
      const updateFn = crypto.createHmac().update;
      const paramString = updateFn.mock.calls[0][0];

      // Verify parameters are in alphabetical order
      expect(paramString.indexOf('shop')).toBeLessThan(paramString.indexOf('timestamp'));
    });
  });

  describe('extractShopDomain', () => {
    it('should extract shop from query parameters', () => {
      const url = new URL('https://app.com/api?shop=test-shop.myshopify.com');
      
      const result = extractShopDomain(url);
      
      expect(result).toBe('test-shop.myshopify.com');
    });

    it('should return null if no shop found', () => {
      const url = new URL('https://app.com/api');
      
      // Mock document to be undefined for this test
      const originalDocument = global.document;
      global.document = undefined;
      
      const result = extractShopDomain(url);
      
      expect(result).toBeNull();
      
      // Restore global.document
      global.document = originalDocument;
    });
  });

  describe('getAppProxyUrl', () => {
    it('should return the original path if shop is not provided', () => {
      const result = getAppProxyUrl('/api/vehicle/makes', null);
      
      expect(result).toBe('/api/vehicle/makes');
    });

    it('should generate a valid app proxy URL', () => {
      const result = getAppProxyUrl('/api/vehicle/makes', 'test-shop.myshopify.com');
      
      expect(result).toBe('https://test-shop.myshopify.com/apps/vehicle-search-widget/api/vehicle/makes');
    });

    it('should handle paths with and without leading slash', () => {
      const withSlash = getAppProxyUrl('/api/vehicle/makes', 'test-shop.myshopify.com');
      const withoutSlash = getAppProxyUrl('api/vehicle/makes', 'test-shop.myshopify.com');
      
      expect(withSlash).toBe('https://test-shop.myshopify.com/apps/vehicle-search-widget/api/vehicle/makes');
      expect(withoutSlash).toBe('https://test-shop.myshopify.com/apps/vehicle-search-widget/api/vehicle/makes');
    });
  });
}); 