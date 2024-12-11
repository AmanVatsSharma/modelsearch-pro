import { useEffect, useState, useCallback } from 'react';

/**
 * Check if we're in the Shopify admin context
 * @returns {boolean} Whether we're in the admin context
 */
export function isInShopifyAdmin() {
  if (typeof window === 'undefined') return false;
  return window.location.href.includes('/admin/') || 
         document.referrer.includes('/admin/');
}

/**
 * Custom hook to initialize App Bridge and get a session token
 * This hook returns the session token and a function to refresh it
 * @returns {Object} { token, refreshToken }
 */
export function useAppBridgeToken() {
  const [token, setToken] = useState(null);
  const [isInitialized, setIsInitialized] = useState(false);

  // Initialize App Bridge
  useEffect(() => {
    if (!isInShopifyAdmin() || typeof window === 'undefined' || isInitialized) {
      return;
    }

    async function initializeAppBridge() {
      try {
        // Dynamically import App Bridge to avoid issues with server-side rendering
        const { createApp } = await import('@shopify/app-bridge');
        const { getSessionToken } = await import('@shopify/app-bridge-utils');

        // Get the API key from the DOM if available
        let apiKey = '';
        const appBridgeData = document.getElementById('shopify-app-init');
        if (appBridgeData) {
          apiKey = appBridgeData.dataset.apiKey;
        }

        if (!apiKey) {
          console.warn('No App Bridge API key found in DOM');
          return;
        }

        // Get the shop from the URL
        const url = new URL(window.location.href);
        const shop = url.searchParams.get('shop');

        if (!shop) {
          console.warn('No shop found in URL');
          return;
        }

        // Create the app
        const app = createApp({
          apiKey,
          host: shop,
        });

        // Get the session token
        const sessionToken = await getSessionToken(app);
        console.log('Successfully initialized App Bridge and got session token');
        
        // Store the token in session storage
        try {
          sessionStorage.setItem('shopify_admin_token', sessionToken);
        } catch (e) {
          console.error('Error saving token to sessionStorage:', e);
        }
        
        setToken(sessionToken);
        setIsInitialized(true);
      } catch (error) {
        console.error('Error initializing App Bridge:', error);
      }
    }

    initializeAppBridge();
  }, [isInitialized]);

  // Function to refresh the token
  const refreshToken = useCallback(async () => {
    if (!isInShopifyAdmin() || typeof window === 'undefined' || !isInitialized) {
      return null;
    }

    try {
      const { createApp } = await import('@shopify/app-bridge');
      const { getSessionToken } = await import('@shopify/app-bridge-utils');

      // Get the API key from the DOM if available
      let apiKey = '';
      const appBridgeData = document.getElementById('shopify-app-init');
      if (appBridgeData) {
        apiKey = appBridgeData.dataset.apiKey;
      }

      if (!apiKey) {
        console.warn('No App Bridge API key found in DOM');
        return null;
      }

      // Get the shop from the URL
      const url = new URL(window.location.href);
      const shop = url.searchParams.get('shop');

      if (!shop) {
        console.warn('No shop found in URL');
        return null;
      }

      // Create the app
      const app = createApp({
        apiKey,
        host: shop,
      });

      // Get the session token
      const sessionToken = await getSessionToken(app);
      
      // Store the token in session storage
      try {
        sessionStorage.setItem('shopify_admin_token', sessionToken);
      } catch (e) {
        console.error('Error saving token to sessionStorage:', e);
      }
      
      setToken(sessionToken);
      return sessionToken;
    } catch (error) {
      console.error('Error refreshing App Bridge token:', error);
      return null;
    }
  }, [isInitialized]);

  return { token, refreshToken };
}

/**
 * Get authentication headers for API requests
 * This uses the token from session storage if available
 * @returns {Object} Headers object with Authorization header if token is available
 */
export function getAuthHeaders() {
  const headers = {};

  // Only attempt to get session token if we're in the admin context
  if (isInShopifyAdmin() && typeof window !== 'undefined') {
    try {
      // Get token from session storage
      const sessionToken = sessionStorage.getItem('shopify_admin_token');
      if (sessionToken) {
        headers['Authorization'] = `Bearer ${sessionToken}`;
      }
    } catch (e) {
      console.error('Error accessing token storage:', e);
    }
  }

  return headers;
}

/**
 * Custom hook to make authenticated API requests using App Bridge token
 * This hook returns a function to make authenticated fetch requests
 * @returns {Function} authenticatedFetch
 */
export function useAuthenticatedFetch() {
  const { token, refreshToken } = useAppBridgeToken();

  const authenticatedFetch = useCallback(
    async (url, options = {}) => {
      // Start with headers from options or empty object
      const headers = { ...options.headers } || {};
      
      // Add Authorization header if we have a token
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      } else {
        // Try to get token from session storage
        const sessionToken = sessionStorage.getItem('shopify_admin_token');
        if (sessionToken) {
          headers['Authorization'] = `Bearer ${sessionToken}`;
        }
      }

      // Make the fetch request
      try {
        const response = await fetch(url, {
          ...options,
          headers,
        });

        // If we get a 401, try to refresh the token and retry
        if (response.status === 401) {
          console.log('Token expired, refreshing...');
          
          // Refresh token
          const newToken = await refreshToken();
          
          // If we got a new token, retry the request
          if (newToken) {
            headers['Authorization'] = `Bearer ${newToken}`;
            
            return fetch(url, {
              ...options,
              headers,
            });
          }
        }

        return response;
      } catch (error) {
        console.error('Error making authenticated fetch:', error);
        throw error;
      }
    },
    [token, refreshToken]
  );

  return authenticatedFetch;
} 