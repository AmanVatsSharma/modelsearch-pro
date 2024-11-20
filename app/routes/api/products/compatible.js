import { json } from "@remix-run/node";
import { authenticate } from "~/shopify.server";
import { getCompatibleProducts } from "~/models/product.server";
import { createSearchLog } from "~/models/analytics.server";

export async function loader({ request }) {
  const { session } = await authenticate.public.appProxy(request);
  const url = new URL(request.url);
  
  const yearId = url.searchParams.get("yearId");
  const submodelId = url.searchParams.get("submodelId");
  const page = parseInt(url.searchParams.get("page") || "1", 10);
  const limit = parseInt(url.searchParams.get("limit") || "20", 10);
  const makeId = url.searchParams.get("makeId");
  const modelId = url.searchParams.get("modelId");
  const sessionId = url.searchParams.get("sessionId");
  const ipAddress = request.headers.get("x-forwarded-for") || request.headers.get("x-real-ip");
  const userAgent = request.headers.get("user-agent");
  
  if (!yearId) {
    return json({ error: "yearId parameter is required" }, { status: 400 });
  }
  
  try {
    const result = await getCompatibleProducts(
      session.shop,
      makeId,
      modelId,
      yearId,
      submodelId,
      { page, limit }
    );
    
    // Log the search
    await createSearchLog({
      shop: session.shop,
      makeId,
      modelId,
      yearId,
      submodelId,
      ipAddress,
      userAgent,
      searchResults: result.products.length,
      successful: result.products.length > 0,
      sessionId,
    });
    
    return json(result);
  } catch (error) {
    console.error("Error fetching compatible products:", error);
    return json({ error: "Failed to fetch compatible products" }, { status: 500 });
  }
} 