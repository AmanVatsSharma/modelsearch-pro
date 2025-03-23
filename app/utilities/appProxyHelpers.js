import crypto from 'crypto';

/**
 * Verify a Shopify App Proxy request manually
 * @param {URL} url The request URL
 * @param {string} secretKey The app secret key
 * @returns {boolean} Whether the signature is valid
 */
export function verifyAppProxySignature(url, secretKey) {
  // Get the signature from the query
  const signature = url.searchParams.get('signature');
  if (!signature) return false;

  // Remove the signature from the query for validation
  const params = new URLSearchParams(url.searchParams);
  params.delete('signature');

  // Sort parameters alphabetically
  const sortedParams = new URLSearchParams();
  Array.from(params.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .forEach(([key, value]) => sortedParams.append(key, value));

  // Create a string of query parameters in alphabetical order
  const queryString = sortedParams.toString();

  // Calculate HMAC
  const hmac = crypto.createHmac('sha256', secretKey)
    .update(queryString)
    .digest('hex');

  // Compare with provided signature
  return hmac === signature;
}

/**
 * Extract shop domain from a Shopify request
 * @param {URL} url The request URL
 * @returns {string|null} The shop domain or null if not found
 */
export function extractShopDomain(url) {
  // First try to get shop from query parameters
  const shopParam = url.searchParams.get('shop');
  if (shopParam) return shopParam;
  
  // Try to extract from the hostname for app proxy requests
  // App proxy URLs look like: myshop.myshopify.com/apps/app-name/...
  if (url.hostname.endsWith('myshopify.com')) {
    return url.hostname;
  }
  
  // Try to get shop from pathname for certain app proxy configurations
  // Some URLs might be formatted as: domain.com/apps/app-name/shop/myshop.myshopify.com/...
  const pathParts = url.pathname.split('/');
  const shopIndex = pathParts.indexOf('shop');
  if (shopIndex !== -1 && shopIndex < pathParts.length - 1) {
    const possibleShop = pathParts[shopIndex + 1];
    if (possibleShop.includes('myshopify.com')) {
      return possibleShop;
    }
  }

  // Try referrer header for embedded apps
  if (typeof document !== 'undefined') {
    const referrer = document.referrer;
    if (referrer && referrer.includes('myshopify.com')) {
      const referrerUrl = new URL(referrer);
      return referrerUrl.hostname;
    }
  }
  
  // Try to extract from headers (for server-side)
  if (url.headers && url.headers.get) {
    const shopifyShop = url.headers.get('X-Shopify-Shop-Domain');
    if (shopifyShop) return shopifyShop;
  }

  return null;
}

/**
 * Generate a fully qualified URL for app proxy requests
 * @param {string} path The API path
 * @param {string} shop The shop domain
 * @returns {string} The fully qualified URL
 */
export function getAppProxyUrl(path, shop) {
  if (!shop) {
    console.warn('No shop provided to getAppProxyUrl, using direct path:', path);
    return path;
  }
  
  // Make sure shop is a valid myshopify domain
  if (!shop.includes('myshopify.com')) {
    console.warn('Invalid shop domain provided to getAppProxyUrl:', shop);
    return path;
  }
  
  // Use the standard Shopify app proxy path structure
  // The subpath should match what's configured in the Shopify Partner Dashboard
  // for your app's App Proxy settings
  const appProxySubpath = 'vehicle-search-widget'; // This should match your App Proxy configuration
  
  // Generate the correct app proxy URL according to Shopify's guidelines
  // https://shopify.dev/docs/apps/distribution/app-proxies
  const baseUrl = `https://${shop}/apps/${appProxySubpath}`;
  const fullPath = path.startsWith('/') ? path : `/${path}`;
  
  // Add shop parameter to ensure it's available for authentication
  const separator = fullPath.includes('?') ? '&' : '?';
  const url = `${baseUrl}${fullPath}${separator}shop=${encodeURIComponent(shop)}`;
  
  console.log('[FRONTEND] Built app proxy URL:', url);
  return url;
} 