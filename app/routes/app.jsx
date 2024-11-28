import { useState, useEffect } from "react";
import { json } from "@remix-run/node";
import { Link, Outlet, useLoaderData, useRouteError } from "@remix-run/react";
import { boundary } from "@shopify/shopify-app-remix/server";
import { AppProvider } from "@shopify/shopify-app-remix/react";
import { NavMenu } from "@shopify/app-bridge-react";
import { Banner, Layout, Page } from "@shopify/polaris";
import polarisStyles from "@shopify/polaris/build/esm/styles.css?url";
import { authenticate } from "../shopify.server";
import { VehicleProvider } from "../components/SearchWidget";

export const links = () => [{ rel: "stylesheet", href: polarisStyles }];

export const loader = async ({ request }) => {
  const { admin, session } = await authenticate.admin(request);
  
  // Set app metafields for our theme app extensions
  try {
    // First, get the app ID which we need for the ownerId
    const appResponse = await admin.graphql(`
      query GetAppInstallation {
        currentAppInstallation {
          id
        }
      }
    `);
    
    const appData = await appResponse.json();
    const appId = appData.data.currentAppInstallation.id;
    
    if (!appId) {
      throw new Error("Could not get app installation ID");
    }
    
    console.log("Setting app metafields with ownerId:", appId);
    
    // Get the app origin for setting the API URL
    const appOrigin = new URL(request.url).origin;
    console.log("App origin for metafields:", appOrigin);
    
    // Set our app metafields using the updated schema for 2023-07+ API version
    const response = await admin.graphql(`
      mutation metafieldsSet($metafields: [MetafieldsSetInput!]!) {
        metafieldsSet(metafields: $metafields) {
          metafields {
            id
            namespace
            key
            value
          }
          userErrors {
            field
            message
          }
        }
      }
    `, {
      variables: {
        metafields: [
          {
            namespace: "vehicle-search-widget",
            key: "widget_script_url",
            value: `${appOrigin}/api/scripts/vehicle-search-widget`,
            type: "single_line_text_field",
            ownerId: appId
          },
          {
            namespace: "vehicle-search-widget",
            key: "api_base_url",
            value: appOrigin,
            type: "single_line_text_field",
            ownerId: appId
          }
        ]
      }
    });
    
    const responseData = await response.json();
    
    if (responseData.errors || (responseData.data?.metafieldsSet?.userErrors?.length > 0)) {
      console.error("GraphQL errors setting metafields:", 
        JSON.stringify(responseData.errors || responseData.data.metafieldsSet.userErrors, null, 2));
    } else {
      console.log("Successfully set app metafields:", 
        JSON.stringify(responseData.data.metafieldsSet.metafields, null, 2));
    }
  } catch (error) {
    console.error("Error setting app metafields:", error);
    if (error.response) {
      try {
        const errorData = await error.response.json();
        console.error("GraphQL error details:", JSON.stringify(errorData, null, 2));
      } catch (jsonError) {
        console.error("Error parsing GraphQL error response:", jsonError);
      }
    }
  }

  return json({ 
    apiKey: process.env.SHOPIFY_API_KEY || "",
    appOrigin: new URL(request.url).origin,
    shop: session.shop
  });
};

export default function App() {
  const { apiKey, shop, appOrigin } = useLoaderData();
  const [showBanner, setShowBanner] = useState(true);

  // Effect to capture and store the session token for API authentication
  useEffect(() => {
    // Store shop in localStorage for later use
    if (shop && typeof localStorage !== 'undefined') {
      try {
        localStorage.setItem('shopify_shop_domain', shop);
        console.log('Stored shop domain in localStorage:', shop);
      } catch (e) {
        console.error('Error storing shop in localStorage:', e);
      }
    }
    
    // Function to save session token when available
    const saveSessionToken = async () => {
      // First check if we have the new App Bridge in window.__SHOPIFY_APP_BRIDGE
      if (typeof window !== 'undefined' && window.__SHOPIFY_APP_BRIDGE?.getSessionToken) {
        try {
          const token = await window.__SHOPIFY_APP_BRIDGE.getSessionToken();
          
          // Store token in sessionStorage
          sessionStorage.setItem('shopify_admin_token', token);
          console.log('Successfully stored admin session token');
          
          // Refresh token every 50 minutes (tokens expire after 1 hour)
          setTimeout(saveSessionToken, 50 * 60 * 1000);
        } catch (e) {
          console.error('Error storing session token:', e);
          
          // Retry after a short delay
          setTimeout(saveSessionToken, 5000);
        }
      }
      // Check for legacy AppBridge
      else if (typeof window !== 'undefined' && window.shopify?.actions?.getSessionToken) {
        try {
          const token = await window.shopify.actions.getSessionToken();
          
          // Store token in sessionStorage
          sessionStorage.setItem('shopify_admin_token', token);
          console.log('Successfully stored admin session token (legacy)');
          
          // Refresh token every 50 minutes (tokens expire after 1 hour)
          setTimeout(saveSessionToken, 50 * 60 * 1000);
        } catch (e) {
          console.error('Error storing session token (legacy):', e);
          
          // Retry after a short delay
          setTimeout(saveSessionToken, 5000);
        }
      } else {
        // AppBridge not available yet, retry after a short delay
        setTimeout(saveSessionToken, 1000);
      }
    };
    
    // Start the token saving process
    saveSessionToken();
  }, [shop]);

  return (
    <AppProvider isEmbeddedApp apiKey={apiKey}>
      <VehicleProvider>
      <NavMenu>
        <Link to="/app" rel="home">
          Home
        </Link>
          <Link to="/app/dashboard">Dashboard</Link>
          <Link to="/app/vehicles">Vehicle Database</Link>
          <Link to="/app/fitments">Fitment Management</Link>
          <Link to="/app/settings">Settings</Link>
          <Link to="/app/search">Vehicle Search Widget</Link>
          <Link to="/app/fitment">Fitment Search Widget</Link>
      </NavMenu>
        
        {showBanner && (
          <Banner 
            title="Welcome to FitSearch Pro"
            onDismiss={() => setShowBanner(false)}
            status="info"
          >
            <p>
              This app provides Year/Make/Model search functionality for automotive and parts retailers.
              Use the navigation to explore the app features.
            </p>
          </Banner>
        )}
        
        <Outlet context={{ shop, appOrigin }} />
      </VehicleProvider>
    </AppProvider>
  );
}

// Shopify needs Remix to catch some thrown responses, so that their headers are included in the response.
export function ErrorBoundary() {
  const error = useRouteError();
  return (
    <AppProvider isEmbeddedApp>
      <Page>
        <Layout>
          <Layout.Section>
            <div className="Polaris-Banner Polaris-Banner--statusCritical">
              <div className="Polaris-Banner__Ribbon">
                <span className="Polaris-Icon Polaris-Icon--colorCritical Polaris-Icon--applyColor">
                  <span className="Polaris-Text--root Polaris-Text--bodySm Polaris-Text--regular Polaris-Text--visuallyHidden"></span>
                  <svg viewBox="0 0 20 20" className="Polaris-Icon__Svg" focusable="false" aria-hidden="true">
                    <path fillRule="evenodd" d="M10 0c5.514 0 10 4.486 10 10s-4.486 10-10 10-10-4.486-10-10 4.486-10 10-10zm-1 6a1 1 0 1 1 2 0v4a1 1 0 1 1-2 0v-4zm1 8a1 1 0 1 0 0-2 1 1 0 0 0 0 2z"></path>
                  </svg>
                </span>
              </div>
              <div className="Polaris-Banner__Content">
                <p>{error instanceof Error ? error.message : "Unknown Error"}</p>
              </div>
            </div>
          </Layout.Section>
        </Layout>
      </Page>
    </AppProvider>
  );
}

export const headers = (headersArgs) => {
  return boundary.headers(headersArgs);
};
