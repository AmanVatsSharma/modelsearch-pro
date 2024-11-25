import { json } from "@remix-run/node";
import { authenticate } from "~/shopify.server";
import { getModels } from "~/models/model.server";

export async function loader({ request }) {
  const { session } = await authenticate.public.appProxy(request);
  const url = new URL(request.url);
  const makeId = url.searchParams.get("makeId");
  
  if (!makeId) {
    return json({ error: "makeId parameter is required" }, { status: 400 });
  }
  
  try {
    const models = await getModels(makeId);
    return json({ models });
  } catch (error) {
    console.error("Error fetching models:", error);
    return json({ error: "Failed to fetch models" }, { status: 500 });
  }
} 