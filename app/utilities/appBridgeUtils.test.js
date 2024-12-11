import { isInShopifyAdmin, getAuthHeaders } from './appBridgeUtils';

// Create a mock of the window object
let windowSpy;

describe('App Bridge Utilities', () => {
  beforeEach(() => {
    // Mock window object
    windowSpy = jest.spyOn(global, 'window', 'get');
    
    // Mock sessionStorage
    Object.defineProperty(window, 'sessionStorage', {
      value: {
        getItem: jest.fn(),
        setItem: jest.fn()
      }
    });
  });

  afterEach(() => {
    windowSpy.mockRestore();
  });

  describe('isInShopifyAdmin', () => {
    test('returns true when in admin context (URL contains /admin/)', () => {
      windowSpy.mockImplementation(() => ({
        location: {
          href: 'https://mystore.myshopify.com/admin/apps/my-app'
        }
      }));

      expect(isInShopifyAdmin()).toBe(true);
    });

    test('returns true when in admin context (referrer contains /admin/)', () => {
      windowSpy.mockImplementation(() => ({
        location: {
          href: 'https://mystore.myshopify.com/apps/my-app'
        },
        document: {
          referrer: 'https://mystore.myshopify.com/admin/'
        }
      }));

      expect(isInShopifyAdmin()).toBe(true);
    });

    test('returns false when not in admin context', () => {
      windowSpy.mockImplementation(() => ({
        location: {
          href: 'https://mystore.myshopify.com/products/my-product'
        },
        document: {
          referrer: 'https://mystore.myshopify.com/'
        }
      }));

      expect(isInShopifyAdmin()).toBe(false);
    });

    test('returns false when window is undefined', () => {
      windowSpy.mockImplementation(() => undefined);
      expect(isInShopifyAdmin()).toBe(false);
    });
  });

  describe('getAuthHeaders', () => {
    test('returns empty object when not in admin context', () => {
      windowSpy.mockImplementation(() => ({
        location: {
          href: 'https://mystore.myshopify.com/products/my-product'
        }
      }));

      expect(getAuthHeaders()).toEqual({});
    });

    test('returns authorization header when in admin context with token', () => {
      windowSpy.mockImplementation(() => ({
        location: {
          href: 'https://mystore.myshopify.com/admin/apps/my-app'
        },
        sessionStorage: {
          getItem: jest.fn().mockReturnValue('test-token'),
          setItem: jest.fn()
        }
      }));

      expect(getAuthHeaders()).toEqual({
        'Authorization': 'Bearer test-token'
      });
    });

    test('returns empty object when in admin context without token', () => {
      windowSpy.mockImplementation(() => ({
        location: {
          href: 'https://mystore.myshopify.com/admin/apps/my-app'
        },
        sessionStorage: {
          getItem: jest.fn().mockReturnValue(null),
          setItem: jest.fn()
        }
      }));

      expect(getAuthHeaders()).toEqual({});
    });

    test('handles errors gracefully', () => {
      windowSpy.mockImplementation(() => ({
        location: {
          href: 'https://mystore.myshopify.com/admin/apps/my-app'
        },
        sessionStorage: {
          getItem: jest.fn().mockImplementation(() => {
            throw new Error('Storage error');
          }),
          setItem: jest.fn()
        }
      }));

      console.error = jest.fn(); // Mock console.error to avoid test output noise
      expect(getAuthHeaders()).toEqual({});
      expect(console.error).toHaveBeenCalled();
    });
  });
}); 