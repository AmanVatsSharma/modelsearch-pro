import { json } from "@remix-run/node";
import { authenticate } from "~/shopify.server";
import { getProduct } from "~/models/product.server";
import { getFitments } from "~/models/fitment.server";

export async function loader({ request, params }) {
  const { session } = await authenticate.public.appProxy(request);
  const url = new URL(request.url);
  const shop = url.searchParams.get("shop") || session.shop;
  
  const { productId } = params;
  
  if (!productId) {
    return json({ error: "Product ID is required" }, { status: 400 });
  }
  
  try {
    // Verify the product exists and belongs to this shop
    const product = await getProduct(productId, shop);
    
    if (!product) {
      return json({ error: "Product not found" }, { status: 404 });
    }
    
    // Get all fitments for this product
    const fitments = await getFitments(productId);
    
    return json({
      product: {
        id: product.id,
        title: product.title,
        handle: product.handle,
      },
      fitments,
    });
  } catch (error) {
    console.error("Error fetching product fitments:", error);
    return json({ error: "Failed to fetch product fitments" }, { status: 500 });
  }
} 