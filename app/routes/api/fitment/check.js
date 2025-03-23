import { json } from "@remix-run/node";
import { authenticate } from "~/shopify.server";
import { getProduct, getProductByHandle } from "~/models/product.server";
import { createProductView } from "~/models/analytics.server";

export async function loader({ request }) {
  const { session } = await authenticate.public.appProxy(request);
  const url = new URL(request.url);
  
  const productId = url.searchParams.get("productId");
  const productHandle = url.searchParams.get("handle");
  const yearId = url.searchParams.get("yearId");
  const submodelId = url.searchParams.get("submodelId");
  const makeId = url.searchParams.get("makeId");
  const modelId = url.searchParams.get("modelId");
  const sessionId = url.searchParams.get("sessionId");
  
  if (!yearId) {
    return json({ error: "yearId parameter is required" }, { status: 400 });
  }
  
  if (!productId && !productHandle) {
    return json({ error: "Either productId or handle parameter is required" }, { status: 400 });
  }
  
  try {
    let product;
    
    if (productId) {
      product = await getProduct(productId, session.shop);
    } else {
      product = await getProductByHandle(productHandle, session.shop);
    }
    
    if (!product) {
      return json({ error: "Product not found" }, { status: 404 });
    }
    
    // Log the product view
    await createProductView({
      shop: session.shop,
      productId: product.id,
      makeId,
      modelId,
      yearId,
      submodelId,
      sessionId,
    });
    
    // Check if this product fits the selected vehicle
    const isFitment = product.fitments.some(fitment => {
      // If the fitment has a yearId that matches the year
      if (fitment.yearId === yearId) {
        // If no submodel is specified or the submodel matches
        if (!submodelId || (fitment.submodelId && fitment.submodelId === submodelId)) {
          return true;
        }
      }
      return false;
    });
    
    return json({
      product,
      isFitment,
    });
  } catch (error) {
    console.error("Error checking product fitment:", error);
    return json({ error: "Failed to check product fitment" }, { status: 500 });
  }
} 