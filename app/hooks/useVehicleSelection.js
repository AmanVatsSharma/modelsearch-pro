import { useEffect, useCallback, useState } from 'react';
import { useVehicle } from '~/components/SearchWidget/VehicleContext';
import { extractShopDomain, getAppProxyUrl } from '~/utilities/appProxyHelpers';
import { 
  isInShopifyAdmin, 
  getAuthHeaders, 
  useAuthenticatedFetch 
} from '~/utilities/appBridgeUtils';

// Simple debounce function to limit API calls
const debounce = (func, delay) => {
  let timer;
  return (...args) => {
    clearTimeout(timer);
    timer = setTimeout(() => func(...args), delay);
  };
};

// Simple in-memory cache for API responses
const apiCache = {
  cache: new Map(),
  
  // Get cached data with TTL check
  get(key) {
    if (!this.cache.has(key)) return null;
    
    const { data, timestamp } = this.cache.get(key);
    const now = Date.now();
    
    // Cache expires after 5 minutes
    if (now - timestamp > 5 * 60 * 1000) {
      this.cache.delete(key);
      return null;
    }
    
    return data;
  },
  
  // Store data in cache
  set(key, data) {
    this.cache.set(key, {
      data,
      timestamp: Date.now()
    });
  },
  
  // Clear all cache
  clear() {
    this.cache.clear();
  }
};

/**
 * Get current shop from URL if available
 * For use with app proxy authentication
 */
function getShopFromUrl() {
  if (typeof window === 'undefined') return null;
  
  // First try to get shop from the URL query parameters
  const url = new URL(window.location.href);
  const shopParam = url.searchParams.get('shop');
  if (shopParam) {
    console.log('[FRONTEND] Shop found in URL parameters:', shopParam);
    return shopParam;
  }
  
  // Check if we're in Shopify Admin
  if (url.hostname.includes('admin.shopify.com')) {
    // Admin URLs look like: https://admin.shopify.com/store/shop-name/...
    const pathParts = url.pathname.split('/');
    const storeIndex = pathParts.indexOf('store');
    if (storeIndex !== -1 && storeIndex < pathParts.length - 1) {
      const shopName = pathParts[storeIndex + 1];
      console.log('[FRONTEND] Shop found in admin URL path:', shopName);
      return `${shopName}.myshopify.com`;
    }
  }
  
  // Try to extract shop from the hostname for app proxy requests
  if (url.hostname.endsWith('myshopify.com')) {
    console.log('[FRONTEND] Shop found in hostname:', url.hostname);
    return url.hostname;
  }
  
  // Check for Shopify embedded apps with shop in referrer
  if (document.referrer && document.referrer.includes('myshopify.com')) {
    try {
      const referrerUrl = new URL(document.referrer);
      if (referrerUrl.hostname.endsWith('myshopify.com')) {
        console.log('[FRONTEND] Shop found in referrer:', referrerUrl.hostname);
        return referrerUrl.hostname;
      }
      
      // Check if referrer is admin.shopify.com
      if (referrerUrl.hostname.includes('admin.shopify.com')) {
        const pathParts = referrerUrl.pathname.split('/');
        const storeIndex = pathParts.indexOf('store');
        if (storeIndex !== -1 && storeIndex < pathParts.length - 1) {
          const shopName = pathParts[storeIndex + 1];
          console.log('[FRONTEND] Shop found in admin referrer path:', shopName);
          return `${shopName}.myshopify.com`;
        }
      }
    } catch (e) {
      console.error('[FRONTEND] Error parsing referrer URL:', e);
    }
  }
  
  // Check for shop in localStorage (may have been saved from previous session)
  try {
    const savedShop = localStorage.getItem('shopify_shop_domain');
    if (savedShop) {
      console.log('[FRONTEND] Shop found in localStorage:', savedShop);
      return savedShop;
    }
  } catch (e) {
    console.error('[FRONTEND] Error accessing localStorage:', e);
  }
  
  console.warn('[FRONTEND] Could not determine shop from URL or context');
  return null;
}

/**
 * Create API URL based on context (admin vs storefront)
 * @param {string} path The API path
 * @param {string} explicitShop Explicit shop domain
 * @returns {string} The appropriate URL for the current context
 */
function createApiUrl(path, explicitShop = null) {
  console.log('[FRONTEND] createApiUrl called with:', {
    path,
    explicitShop,
    isAdmin: isInShopifyAdmin(),
    location: typeof window !== 'undefined' ? window.location.href : 'N/A'
  });

  // Use explicitly passed shop first, or try to get it from URL
  const shop = explicitShop || getShopFromUrl();
  
  // Save the shop to localStorage for future use if available
  if (shop && typeof localStorage !== 'undefined') {
    try {
      localStorage.setItem('shopify_shop_domain', shop);
    } catch (e) {
      console.error('[FRONTEND] Error saving shop to localStorage:', e);
    }
  }
  
  // 1. Check if we're in Shopify Admin
  const isInAdmin = isInShopifyAdmin() || 
                    (typeof window !== 'undefined' && 
                    (window.location.href.includes('admin.shopify.com') || 
                     document.referrer.includes('admin.shopify.com')));
  
  // In admin, use relative paths that will resolve to the app's domain
  if (isInAdmin) {
    // Ensure path has leading slash
    const relativePath = path.startsWith('/') ? path : `/${path}`;
    
    // Add shop parameter if available
    const url = shop ? 
      `${relativePath}${relativePath.includes('?') ? '&' : '?'}shop=${encodeURIComponent(shop)}` : 
      relativePath;
      
    console.log('[FRONTEND] Using admin relative API URL:', url);
    return url;
  }
  
  // 2. Check if we're in development (localhost)
  if (typeof window !== 'undefined' && window.location.hostname === 'localhost') {
    // Ensure path has leading slash
    const relativePath = path.startsWith('/') ? path : `/${path}`;
    // Add shop parameter if available
    const url = shop ? 
      `${relativePath}${relativePath.includes('?') ? '&' : '?'}shop=${encodeURIComponent(shop)}` : 
      relativePath;
    console.log('[FRONTEND] Using development relative API URL:', url);
    return url;
  }
  
  // 3. In production storefront, use app proxy
  if (shop) {
    const url = getAppProxyUrl(path, shop);
    console.log('[FRONTEND] Using app proxy URL:', url);
    return url;
  }
  
  // 4. Fallback to relative path if shop is unknown
  console.warn('[FRONTEND] No shop available for API URL, using relative path:', path);
  return path.startsWith('/') ? path : `/${path}`;
}

/**
 * Fetch with retry and exponential backoff
 * @param {string} url The URL to fetch
 * @param {Object} options Fetch options
 * @param {number} maxRetries Maximum number of retries
 * @param {number} initialDelay Initial delay in ms
 * @returns {Promise<Response>} The fetch response
 */
async function fetchWithRetry(url, options = {}, maxRetries = 3, initialDelay = 500) {
  let lastError;
  let delay = initialDelay;
  
  // Make sure we have a headers object
  options.headers = options.headers || {};
  
  // Add authentication headers for the current context
  const authHeaders = getAuthHeaders();
  options.headers = { ...options.headers, ...authHeaders };
  
  // Add standard headers
  options.headers['Accept'] = 'application/json';
  if (!options.headers['Content-Type'] && !options.formData) {
  options.headers['Content-Type'] = 'application/json';
  }
  
  // Set up credentials if we're making requests relative to our domain
  // or to Shopify domains (admin or storefront)
  const isRelativeUrl = !url.startsWith('http');
  const targetUrl = isRelativeUrl && typeof window !== 'undefined' 
    ? new URL(url, window.location.origin)
    : new URL(url);
  
  const isSameOrigin = typeof window !== 'undefined' && targetUrl.origin === window.location.origin;
  const isShopifyUrl = targetUrl.hostname.includes('myshopify.com') || 
                       targetUrl.hostname.includes('shopify.com');
  
  if (isSameOrigin || isShopifyUrl) {
    options.credentials = 'include';
  }
  
  console.log(`[FRONTEND] fetchWithRetry starting for URL: ${url}`);
  console.log(`[FRONTEND] Request context:`, {
    isRelativeUrl,
    isSameOrigin,
    isShopifyUrl,
    targetUrl: targetUrl.toString(),
  });
  
  for (let i = 0; i < maxRetries; i++) {
    try {
      console.log(`[FRONTEND] Fetch attempt ${i+1}/${maxRetries} for: ${url}`);
      
      // Set up timeout
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 second timeout
      
      // Perform the fetch with signal for timeout
        const fetchOptions = {
          ...options,
          signal: controller.signal
        };
        
        const response = await fetch(url, fetchOptions);
        clearTimeout(timeoutId);
        
      if (!response.ok) {
        const errorText = await response.text();
        console.error(`[FRONTEND] HTTP error ${response.status}: ${errorText}`);
        throw new Error(`HTTP error ${response.status}: ${errorText}`);
      }
      
      return response;
    } catch (error) {
      lastError = error;
      console.error(`[FRONTEND] Fetch error (attempt ${i+1}/${maxRetries}):`, error);
      
      // Don't retry if it's an abort error (timeout) or if we've hit the max retries
      if (error.name === 'AbortError' || i === maxRetries - 1) {
        break;
    }
    
      // Exponential backoff
      console.log(`[FRONTEND] Retrying in ${delay}ms...`);
    await new Promise(resolve => setTimeout(resolve, delay));
      delay *= 2;
    }
  }
  
  throw lastError || new Error('Failed to fetch after retries');
}

// Function to get data with caching
const fetchWithCache = async (url, options = {}) => {
  const cacheKey = `${url}-${JSON.stringify(options)}`;
  
  // Check cache first
  const cachedData = apiCache.get(cacheKey);
  if (cachedData) {
    console.log('Using cached data for:', url);
    return cachedData;
  }
  
  // If not in cache, fetch from API
  console.log('Fetching from API:', url);
  const response = await fetchWithRetry(url, options);
  
  if (response.ok) {
    const data = await response.json();
    // Store in cache
    apiCache.set(cacheKey, data);
    return data;
  }
  
  throw new Error(`API request failed with status ${response.status}`);
};

// Create debounced version of fetch
const debouncedFetch = debounce(fetchWithCache, 300);

/**
 * Custom hook for managing vehicle selection
 * @param {Object} options Hook options
 * @param {string} options.initialShop Initial shop domain
 * @returns {Object} Vehicle selection state and handlers
 */
export function useVehicleSelection({ initialShop } = {}) {
  const vehicleContext = useVehicle();
  const authenticatedFetch = useAuthenticatedFetch();
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [shop, setShop] = useState(initialShop || '');
  
  // Vehicle data states
  const [makes, setMakes] = useState([]);
  const [models, setModels] = useState([]);
  const [years, setYears] = useState([]);
  const [submodels, setSubmodels] = useState([]);
  
  // Selection states from context
  const {
    selectedMake,
    selectedModel,
    selectedYear,
    selectedSubmodel,
    setSelectedMake,
    setSelectedModel,
    setSelectedYear,
    setSelectedSubmodel,
    clearVehicle
  } = vehicleContext;
  
  /**
   * Make API requests with proper error handling
   * @param {string} endpoint The API endpoint
   * @param {Object} options Fetch options
   * @returns {Promise<Object>} The API response
   */
  const apiRequest = useCallback(async (endpoint, options = {}) => {
    setError('');
    
    try {
      // Create the API URL with proper shop info
      // Use relative paths for API endpoints
      const apiPath = endpoint.startsWith('/') ? endpoint : `/api/${endpoint}`;
      const url = createApiUrl(apiPath, shop);
      
      const cacheKey = `${url}-${JSON.stringify(options)}`;
      const cachedData = apiCache.get(cacheKey);
      
      if (cachedData) {
        console.log(`[FRONTEND] Using cached data for: ${url}`);
        return cachedData;
      }
      
      const fetchFn = authenticatedFetch || fetchWithRetry;
      console.log(`[FRONTEND] Fetching from: ${url}`);
      
      try {
        const response = await fetchFn(url, options);
        
        // Check if response is ok
        if (!response.ok) {
          const errorText = await response.text();
          console.error(`[FRONTEND] API error (${response.status}): ${errorText}`);
          throw new Error(`API error: ${response.status} - ${errorText}`);
        }
        
        // Parse response
        const data = await response.json();
        
        // Cache successful responses
        apiCache.set(cacheKey, data);
        
        return data;
      } catch (fetchError) {
        console.error(`[FRONTEND] Fetch error for ${url}:`, fetchError);
        throw new Error(`Fetch error: ${fetchError.message} (URL: ${url})`);
      }
    } catch (err) {
      console.error(`[FRONTEND] API request error:`, err);
      setError(err.message || 'An error occurred while fetching data');
      throw err;
    }
  }, [shop, authenticatedFetch]);
  
  // Fetch makes from the API
  const fetchMakes = useCallback(async () => {
    console.log('[FRONTEND] Fetching makes...');
    setLoading(true);
    
    try {
      const data = await apiRequest('vehicle/makes');
      console.log('[FRONTEND] Makes data:', data);
      
      if (data.makes && Array.isArray(data.makes)) {
        setMakes(data.makes);
      } else {
        console.error('[FRONTEND] Unexpected makes data format:', data);
        setError('Invalid data format received from server');
      }
      } catch (err) {
        console.error('[FRONTEND] Error fetching makes:', err);
      setError(err.message || 'Failed to load makes');
      } finally {
        setLoading(false);
      }
  }, [apiRequest]);
  
  // Fetch models for a specific make
  const fetchModels = useCallback(async (makeId) => {
    console.log(`[FRONTEND] Fetching models for make ID: ${makeId}`);
      setLoading(true);
    
    try {
      const data = await apiRequest(`vehicle/models?makeId=${makeId}`);
      console.log('[FRONTEND] Models data:', data);
      
      if (data.models && Array.isArray(data.models)) {
        setModels(data.models);
      } else {
        console.error('[FRONTEND] Unexpected models data format:', data);
        setError('Invalid data format received from server');
      }
      } catch (err) {
      console.error('[FRONTEND] Error fetching models:', err);
      setError(err.message || 'Failed to load models');
      } finally {
        setLoading(false);
      }
  }, [apiRequest]);
  
  // Fetch years for a specific model
  const fetchYears = useCallback(async (modelId) => {
    console.log(`[FRONTEND] Fetching years for model ID: ${modelId}`);
      setLoading(true);
    
    try {
      const data = await apiRequest(`vehicle/years?modelId=${modelId}`);
      console.log('[FRONTEND] Years data:', data);
      
      if (data.years && Array.isArray(data.years)) {
        setYears(data.years);
      } else {
        console.error('[FRONTEND] Unexpected years data format:', data);
        setError('Invalid data format received from server');
      }
      } catch (err) {
      console.error('[FRONTEND] Error fetching years:', err);
      setError(err.message || 'Failed to load years');
      } finally {
        setLoading(false);
      }
  }, [apiRequest]);
  
  // Fetch submodels for a specific year
  const fetchSubmodels = useCallback(async (yearId) => {
    console.log(`[FRONTEND] Fetching submodels for year ID: ${yearId}`);
      setLoading(true);
    
    try {
      const data = await apiRequest(`vehicle/submodels?yearId=${yearId}`);
      console.log('[FRONTEND] Submodels data:', data);
      
      if (data.submodels && Array.isArray(data.submodels)) {
        setSubmodels(data.submodels);
      } else {
        console.error('[FRONTEND] Unexpected submodels data format:', data);
        setError('Invalid data format received from server');
      }
      } catch (err) {
      console.error('[FRONTEND] Error fetching submodels:', err);
      setError(err.message || 'Failed to load submodels');
      } finally {
        setLoading(false);
      }
  }, [apiRequest]);

  // Handle make selection
  const handleMakeChange = (makeId) => {
    const make = makes.find(m => m.id === makeId);
    setSelectedMake(make || null);
  };

  // Handle model selection
  const handleModelChange = (modelId) => {
    const model = models.find(m => m.id === modelId);
    setSelectedModel(model || null);
  };

  // Handle year selection
  const handleYearChange = (yearId) => {
    const year = years.find(y => y.id === yearId);
    setSelectedYear(year || null);
  };

  // Handle submodel selection
  const handleSubmodelChange = (submodelId) => {
    const submodel = submodels.find(s => s.id === submodelId);
    setSelectedSubmodel(submodel || null);
  };

  // Get App Bridge token if in admin
  useEffect(() => {
    if (isInShopifyAdmin() && typeof window !== 'undefined') {
      // Use the modern App Bridge API if available
      if (window['@shopify/app-bridge']) {
        const AppBridge = window['@shopify/app-bridge'];
        const createApp = AppBridge.createApp;
        const getSessionToken = AppBridge.actions.SessionToken.request;

        // Get the API key from the DOM if available
        let apiKey = '';
        const appBridgeData = document.getElementById('shopify-app-init');
        if (appBridgeData) {
          apiKey = appBridgeData.dataset.apiKey;
        }

        if (apiKey) {
          // Create the app
          const app = createApp({
            apiKey: apiKey,
            host: window.location.host,
          });

          // Get the session token
          getSessionToken(app)
            .then(token => {
              console.log('Successfully got session token from App Bridge');
              try {
                sessionStorage.setItem('shopify_admin_token', token);
              } catch (e) {
                console.error('Error saving token to sessionStorage:', e);
              }
            })
            .catch(e => {
              console.error('Error getting session token from App Bridge:', e);
            });
        }
      }
    }
  }, []);

  return {
    // Selected values
    selectedMake,
    selectedModel,
    selectedYear,
    selectedSubmodel,
    
    // Available options
    makes,
    models,
    years,
    submodels,
    
    // Event handlers
    handleMakeChange,
    handleModelChange,
    handleYearChange,
    handleSubmodelChange,
    clearSelection: clearVehicle,
    
    // Fetch functions
    fetchMakes,
    fetchModels,
    fetchYears,
    fetchSubmodels,
    
    // State
    loading,
    error,
    
    // Helper functions
    hasCompleteSelection: vehicleContext.hasCompleteSelection,
    
    // Set shop domain explicitly
    setShop,
  };
}
