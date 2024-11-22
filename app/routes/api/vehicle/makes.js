import { json } from "@remix-run/node";
import { authenticate } from "~/shopify.server";
import { getMakes } from "~/models/make.server";

/**
 * API route to get all vehicle makes
 * This endpoint is used by the vehicle search widget
 */
export async function loader({ request }) {
  const { session } = await authenticate.public.appProxy(request);
  
  try {
    const makes = await getMakes(session.shop);
    return json({ makes });
  } catch (error) {
    console.error("Error fetching makes:", error);
    return json({ error: "Failed to fetch makes" }, { status: 500 });
  }
} 