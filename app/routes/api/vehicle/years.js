import { json } from "@remix-run/node";
import { authenticate } from "~/shopify.server";
import { getYears } from "~/models/year.server";

export async function loader({ request }) {
  const { session } = await authenticate.public.appProxy(request);
  const url = new URL(request.url);
  const modelId = url.searchParams.get("modelId");
  
  if (!modelId) {
    return json({ error: "modelId parameter is required" }, { status: 400 });
  }
  
  try {
    const years = await getYears(modelId);
    return json({ years });
  } catch (error) {
    console.error("Error fetching years:", error);
    return json({ error: "Failed to fetch years" }, { status: 500 });
  }
} 