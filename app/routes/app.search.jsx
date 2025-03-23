import { useState, useCallback } from "react";
import { json } from "@remix-run/node";
import { useLoaderData, useOutletContext } from "@remix-run/react";
import { 
  Page, 
  Layout, 
  Text,
  BlockStack,
  Box,
  Banner,
  Card,
  Divider,
} from "@shopify/polaris";
import { authenticate } from "../shopify.server";
import { SearchWidget, VehicleProvider } from "../components/SearchWidget";
import { getVehicleDisplayString, getVehicleQueryString } from "../utilities/vehicleStorage";

export async function loader({ request }) {
  const { admin, session } = await authenticate.admin(request);
  
  // Get current shop to pass to the widget
  const shop = session.shop;
  console.log("Authenticated shop in loader:", shop);
  
  // Fetch widget settings from app settings
  let widgetSettings = {};
  try {
    // Use the correct GraphQL query structure for metafields in 2023-07+ API version
    const response = await admin.graphql(`
      query {
        currentAppInstallation {
          metafields(namespace: "vehicle-search-widget", first: 10) {
            nodes {
              id
              namespace
              key
              value
            }
          }
        }
      }
    `);
    
    const data = await response.json();
    
    // Correctly access the metafields from the nodes structure
    if (data.data?.currentAppInstallation?.metafields?.nodes) {
      widgetSettings = data.data.currentAppInstallation.metafields.nodes.reduce((acc, node) => {
        acc[node.key] = node.value;
        return acc;
      }, {});
    }
    
    console.log("Successfully fetched metafields:", widgetSettings);
  } catch (error) {
    console.error("Error fetching widget settings:", error);
    console.error("GraphQL Error:", JSON.stringify(error, null, 2));
  }
  
  // Return shop and settings
  return json({
    shop,
    widgetSettings
  });
}

export default function AppSearchPage() {
  const { shop: loaderShop, widgetSettings } = useLoaderData();
  const { shop: contextShop, appOrigin } = useOutletContext();
  const [selectedVehicle, setSelectedVehicle] = useState(null);
  const [searchPerformed, setSearchPerformed] = useState(false);
  
  // Use shop from context if available, otherwise from loader
  const shop = contextShop || loaderShop;
  
  console.log("[AppSearchPage] Shop from context/loader:", {
    contextShop,
    loaderShop,
    using: shop
  });

  const handleSearch = useCallback((vehicle) => {
    console.log("[AppSearchPage] Search performed with vehicle:", vehicle);
    setSelectedVehicle(vehicle);
    setSearchPerformed(true);
    
    // In a real implementation, we would redirect to a product listing with the vehicle filter
    // const queryString = getVehicleQueryString(vehicle);
    // navigate(`/collections/all?${queryString}`);
  }, []);

  return (
    <Page title="Vehicle Search">
      <ui-title-bar title="Vehicle Search" />
      <Layout>
        <Layout.Section>
          <BlockStack gap="4">
            <Banner
              title="Debugging Information"
              status="info"
            >
              <p>Shop Domain: {shop || "Not available"}</p>
              <p>App Origin: {appOrigin || "Not available"}</p>
              <p>Context: {typeof window !== 'undefined' && window.location.href.includes('/admin/') ? 'Admin' : 'Storefront'}</p>
            </Banner>
            
            <Card>
              <Text variant="headingMd" as="h2">
                Vehicle Search Admin Preview
              </Text>
              <BlockStack gap="4">
                <Text variant="bodyMd" as="p">
                  This is a preview of how the vehicle search widget will appear to your customers.
                </Text>
                <Divider />
                <VehicleProvider>
                  <SearchWidget 
                    title="Find parts for your vehicle"
                    buttonText="Find Parts"
                    theme="light"
                    showResetButton
                    shop={shop}
                    onSearch={handleSearch}
                  />
                </VehicleProvider>
              </BlockStack>
            </Card>
            
            {searchPerformed && selectedVehicle && (
              <Card>
                <BlockStack gap="4">
                  <Text variant="headingMd" as="h3">Search Results</Text>
                  <Banner title="Selected Vehicle" status="success">
                    <p>
                      {getVehicleDisplayString(selectedVehicle)}
                    </p>
                    <p>
                      Query String: {getVehicleQueryString(selectedVehicle)}
                    </p>
                  </Banner>
                </BlockStack>
              </Card>
            )}
          </BlockStack>
        </Layout.Section>
      </Layout>
    </Page>
  );
} 