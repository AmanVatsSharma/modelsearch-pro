import { json } from "@remix-run/node";
import { authenticate } from "~/shopify.server";
import { getSubmodels } from "~/models/submodel.server";

export async function loader({ request }) {
  const { session } = await authenticate.public.appProxy(request);
  const url = new URL(request.url);
  const yearId = url.searchParams.get("yearId");
  
  if (!yearId) {
    return json({ error: "yearId parameter is required" }, { status: 400 });
  }
  
  try {
    const submodels = await getSubmodels(yearId);
    return json({ submodels });
  } catch (error) {
    console.error("Error fetching submodels:", error);
    return json({ error: "Failed to fetch submodels" }, { status: 500 });
  }
}