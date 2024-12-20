import { json } from "@remix-run/node";
import { authenticate } from "~/shopify.server";
import { getSettings } from "~/models/settings.server";

export async function loader({ request }) {
  const { session } = await authenticate.public.appProxy(request);
  
  try {
    const settings = await getSettings(session.shop);
    return json({
      widgetTitle: settings.widgetTitle,
      widgetPlacement: settings.widgetPlacement,
      widgetTheme: settings.widgetTheme,
      widgetButtonText: settings.widgetButtonText,
      rememberVehicleEnabled: settings.rememberVehicleEnabled,
      rememberDays: settings.rememberDays,
    });
  } catch (error) {
    console.error("Error fetching settings:", error);
    return json({ error: "Failed to fetch settings" }, { status: 500 });
  }
} 