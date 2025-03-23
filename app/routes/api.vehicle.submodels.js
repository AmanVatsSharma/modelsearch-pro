import { json } from "@remix-run/node";
import { authenticate } from "~/shopify.server";
import { getSubmodels } from "~/models/submodel.server";
import { verifyAppProxySignature, extractShopDomain } from "~/utilities/appProxyHelpers";

/**
 * API route to get submodels for a specific year
 * This endpoint is used by the vehicle search widget
 */
export async function loader({ request }) {
  let shop = null;
  const url = new URL(request.url);
  const yearId = url.searchParams.get("yearId");
  
  // Log the incoming request for debugging
  console.log(`API request to ${url.pathname}`, {
    headers: Object.fromEntries([...request.headers.entries()]),
    query: Object.fromEntries([...url.searchParams.entries()])
  });
  
  if (!yearId) {
    return json({ error: "yearId is required" }, { status: 400 });
  }
  
  // First try admin authentication (for admin UI requests)
  try {
    const { admin, session, cors } = await authenticate.admin(request);
    shop = session.shop;
    console.log("Admin authentication succeeded for shop:", shop);
    
    // Fetch submodels for this shop and year
    const submodels = await getSubmodels(shop, yearId);
    console.log(`Found ${submodels.length} submodels for yearId ${yearId} in shop:`, shop);
    
    // Return response with CORS headers for admin extensions
    return cors(json({ submodels }));
  } catch (adminError) {
    console.warn("Admin authentication failed, trying app proxy:", adminError.message);
    
    // Next try app proxy authentication (for storefront requests)
    try {
      const { session } = await authenticate.public.appProxy(request);
      shop = session.shop;
      console.log("App proxy authentication succeeded for shop:", shop);
      
      // Fetch submodels for this shop and year
      const submodels = await getSubmodels(shop, yearId);
      console.log(`Found ${submodels.length} submodels for yearId ${yearId} in shop:`, shop);
      
    return json({ submodels });
    } catch (proxyError) {
      console.warn("App proxy authentication failed:", proxyError.message);
      
      // Final fallback: try to extract shop from various sources
      shop = url.searchParams.get("shop");
      console.log("Extracted shop from URL parameter:", shop);
      
      // Try to extract from authorization header as last resort
      if (!shop && request.headers.has("authorization")) {
        const authHeader = request.headers.get("authorization");
        if (authHeader && authHeader.startsWith("Bearer ")) {
          try {
            const token = authHeader.split("Bearer ")[1];
            // Parse JWT token to get shop info
            const payload = JSON.parse(atob(token.split(".")[1]));
            if (payload.dest) {
              const tokenUrl = new URL(payload.dest);
              shop = tokenUrl.hostname;
              console.log("Extracted shop from auth token:", shop);
            }
          } catch (e) {
            console.error("Error extracting shop from auth token:", e);
          }
        }
      }
      
      // If we still don't have a shop, return an error
      if (!shop) {
        console.error("All authentication methods failed - unable to determine shop");
        return json({ 
          error: "Authentication failed: Unable to determine shop",
          authenticated: false
        }, { 
          status: 401,
          // Add CORS headers to ensure the response can be processed by admin extensions
          headers: {
            "Access-Control-Allow-Origin": "*",
            "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
            "Access-Control-Allow-Headers": "Content-Type, Authorization"
          }
        });
      }
      
      // We have a shop but couldn't authenticate properly - continue with limited functionality
      console.log("Using unauthenticated request with shop:", shop);
      
      try {
        // Pass the shop parameter to getSubmodels
        const submodels = await getSubmodels(shop, yearId);
        console.log(`Found ${submodels.length} submodels for yearId ${yearId} in unauthenticated shop:`, shop);
        
        return json({ submodels }, {
          headers: {
            "Access-Control-Allow-Origin": "*",
            "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
            "Access-Control-Allow-Headers": "Content-Type, Authorization"
          }
        });
  } catch (error) {
        console.error(`Error fetching submodels for yearId ${yearId} in unauthenticated shop:`, error);
        return json({ 
          error: "Failed to fetch submodels",
          details: error.message
        }, { 
          status: 500,
          headers: {
            "Access-Control-Allow-Origin": "*",
            "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
            "Access-Control-Allow-Headers": "Content-Type, Authorization"
          }
        });
      }
    }
  }
}

// Handle OPTIONS requests for CORS preflight
export async function action({ request }) {
  // If this is an OPTIONS request, return a 200 with appropriate CORS headers
  if (request.method === "OPTIONS") {
    return new Response(null, {
      status: 200,
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type, Authorization"
      }
    });
  }
  
  // For other methods, return method not allowed
  return json({ error: "Method not allowed" }, { status: 405 });
}