import { useState, useCallback, useEffect } from "react";
import { json, redirect } from "@remix-run/node";
import { useLoaderData, useOutletContext, useActionData, Form } from "@remix-run/react";
import { 
  Page, 
  Layout, 
  Text,
  BlockStack,
  Card,
  Tabs,
  Box,
  Banner,
  InlineStack,
  Button,
  Tag,
  Link,
  EmptyState,
} from "@shopify/polaris";
import { authenticate } from "~/shopify.server";
import { VehicleProvider } from "~/components/SearchWidget";
import { FitmentTable } from "~/components/FitmentTable";
import { CompatibilityWidget } from "~/components/CompatibilityWidget";
import { getProducts, upsertProduct } from "~/models/product.server";
import { getFitments, createFitment } from "~/models/fitment.server";
import { prisma } from "~/db.server";

// Helper to create sample data
async function createSampleData(shop) {
  // Check if we already have sample data for this shop
  const existingProducts = await getProducts(shop, { limit: 1 });
  if (existingProducts.products.length > 0) {
    return { success: false, message: "Sample data already exists" };
  }

  try {
    // Create sample products
    const products = [
      {
        id: "sample-product-1",
        title: "Performance Brake Pads",
        handle: "performance-brake-pads",
        shop,
        price: "79.99",
        image: "https://cdn.shopify.com/s/files/1/0533/2089/files/placeholder-images-product-1_large.png"
      },
      {
        id: "sample-product-2",
        title: "Oil Filter",
        handle: "oil-filter",
        shop,
        price: "12.99",
        image: "https://cdn.shopify.com/s/files/1/0533/2089/files/placeholder-images-product-2_large.png"
      },
      {
        id: "sample-product-3",
        title: "Headlight Assembly",
        handle: "headlight-assembly",
        shop,
        price: "149.99",
        image: "https://cdn.shopify.com/s/files/1/0533/2089/files/placeholder-images-product-3_large.png"
      }
    ];

    // Create sample vehicle data (simplified for demo)
    const make = await prisma.make.create({
      data: {
        name: "Toyota",
        models: {
          create: {
            name: "Camry",
            years: {
              create: [
                { value: "2020", submodels: { create: { name: "LE" } } },
                { value: "2021", submodels: { create: { name: "SE" } } },
                { value: "2022", submodels: { create: { name: "XLE" } } }
              ]
            }
          }
        }
      },
      include: {
        models: {
          include: {
            years: {
              include: {
                submodels: true
              }
            }
          }
        }
      }
    });

    const honda = await prisma.make.create({
      data: {
        name: "Honda",
        models: {
          create: {
            name: "Accord",
            years: {
              create: [
                { value: "2019", submodels: { create: { name: "Sport" } } },
                { value: "2020", submodels: { create: { name: "Touring" } } }
              ]
            }
          }
        }
      },
      include: {
        models: {
          include: {
            years: {
              include: {
                submodels: true
              }
            }
          }
        }
      }
    });

    // Save the products
    for (const product of products) {
      await upsertProduct(product);
    }

    // Extract year and submodel IDs for fitment creation
    const toyotaYears = make.models[0].years;
    const hondaYears = honda.models[0].years;
    
    // Create fitments for product 1 (brake pads)
    for (const year of toyotaYears) {
      await createFitment({
        productId: "sample-product-1",
        yearId: year.id,
        submodelId: year.submodels[0].id
      });
    }
    
    // Create fitments for product 2 (oil filter)
    for (const year of [...toyotaYears, ...hondaYears]) {
      await createFitment({
        productId: "sample-product-2",
        yearId: year.id,
        submodelId: year.submodels[0].id
      });
    }
    
    // Create fitments for product 3 (headlight)
    for (const year of hondaYears) {
      await createFitment({
        productId: "sample-product-3",
        yearId: year.id,
        submodelId: year.submodels[0].id
      });
    }

    return { success: true };
  } catch (error) {
    console.error("Error creating sample data:", error);
    return { success: false, message: error.message };
  }
}

export async function action({ request }) {
  const { admin, session } = await authenticate.admin(request);
  const formData = await request.formData();
  const action = formData.get("action");
  
  if (action === "create_sample_data") {
    const result = await createSampleData(session.shop);
    return json({ sampleDataResult: result });
  }
  
  return null;
}

export async function loader({ request }) {
  const { admin, session } = await authenticate.admin(request);
  
  // Get current shop to pass to the components
  const shop = session.shop;
  console.log("Authenticated shop in loader:", shop);
  
  // For demonstration, load a sample product with fitments
  let sampleProduct = null;
  let sampleFitments = [];
  let alternativeProducts = [];
  let error = null;
  
  try {
    // Get products with fitments
    const productsResult = await getProducts(shop, { limit: 10 });
    
    if (productsResult.products.length > 0) {
      // Find a product with fitments
      const productWithFitments = productsResult.products.find(p => p._count.fitments > 0);
      
      if (productWithFitments) {
        sampleProduct = productWithFitments;
        sampleFitments = await getFitments(productWithFitments.id);
        
        // Get alternative products (just using other products for demo)
        alternativeProducts = productsResult.products
          .filter(p => p.id !== sampleProduct.id)
          .slice(0, 3) // Take only first 3 for alternatives
          .map(p => ({
            id: p.id,
            title: p.title,
            handle: p.handle,
            price: p.price || '19.99', // Example price if not available
            image: p.image ? { url: p.image } : null
          }));
      } else {
        error = "No products with fitment data found. Please add fitment data to at least one product.";
      }
    } else {
      error = "No products found in the database. Please create sample data or add products manually.";
    }
  } catch (err) {
    console.error("Error fetching sample data:", err);
    error = `Error fetching sample data: ${err.message}`;
  }
  
  return json({
    shop,
    sampleProduct,
    sampleFitments,
    alternativeProducts,
    error,
    totalProducts: sampleFitments.length || 0
  });
}

export default function AppFitmentPage() {
  const { shop, sampleProduct, sampleFitments, alternativeProducts, error, totalProducts } = useLoaderData();
  const { shop: contextShop, appOrigin } = useOutletContext();
  const actionData = useActionData();
  
  // Use shop from context if available, otherwise from loader
  const effectiveShop = contextShop || shop;
  
  // State for selected tab
  const [selectedTab, setSelectedTab] = useState(0);
  
  const handleTabChange = useCallback((selectedTabIndex) => {
    setSelectedTab(selectedTabIndex);
  }, []);
  
  // State for error tracking in components
  const [componentError, setComponentError] = useState(null);
  
  // Tabs for the two components
  const tabs = [
    {
      id: 'fitment-table',
      content: 'Fitment Table',
      accessibilityLabel: 'Fitment Table',
      panelID: 'fitment-table-panel',
    },
    {
      id: 'compatibility-widget',
      content: 'Compatibility Widget',
      accessibilityLabel: 'Compatibility Widget',
      panelID: 'compatibility-widget-panel',
    },
  ];
  
  // Error handling for components
  const handleComponentError = useCallback((err) => {
    setComponentError(err.message || "An error occurred in the component");
  }, []);
  
  if (error) {
    return (
      <Page title="Fitment Components">
        <ui-title-bar title="Fitment Components" />
        <Layout>
          <Layout.Section>
            <Card>
              <EmptyState
                heading="No data available for demonstration"
                image="https://cdn.shopify.com/s/files/1/0262/4071/2726/files/emptystate-files.png"
                action={{content: 'Go to Dashboard', url: '/app'}}
              >
                <p>{error}</p>
                <Text variant="bodyMd" as="p" color="subdued">
                  You need to create products and add fitment data to see this demonstration.
                </Text>
                
                {actionData?.sampleDataResult?.message && (
                  <Banner status={actionData.sampleDataResult.success ? "success" : "warning"}>
                    {actionData.sampleDataResult.message}
                  </Banner>
                )}
                
                <Box paddingBlockStart="4">
                  <Form method="post">
                    <input type="hidden" name="action" value="create_sample_data" />
                    <Button submit>Create Sample Data</Button>
                  </Form>
                </Box>
              </EmptyState>
            </Card>
          </Layout.Section>
        </Layout>
      </Page>
    );
  }
  
  return (
    <Page title="Fitment Components">
      <ui-title-bar title="Fitment Components" />
      <Layout>
        <Layout.Section>
          <BlockStack gap="4">
            <Banner
              title="Debugging Information"
              status="info"
            >
              <BlockStack gap="2">
                <Text as="p">Shop Domain: {effectiveShop || "Not available"}</Text>
                <Text as="p">App Origin: {appOrigin || "Not available"}</Text>
                <Text as="p">Context: {typeof window !== 'undefined' && window.location.href.includes('/admin/') ? 'Admin' : 'Storefront'}</Text>
                <Text as="p">Sample Product: {sampleProduct ? sampleProduct.title : 'None available'}</Text>
                <Text as="p">Fitments Count: <Tag>{totalProducts}</Tag></Text>
              </BlockStack>
            </Banner>
            
            {componentError && (
              <Banner status="critical" onDismiss={() => setComponentError(null)}>
                <Text as="p">Component Error: {componentError}</Text>
              </Banner>
            )}
            
            <Card>
              <Tabs tabs={tabs} selected={selectedTab} onSelect={handleTabChange}>
                {selectedTab === 0 ? (
                  <Box padding="4">
                    <BlockStack gap="4">
                      <Text variant="headingMd" as="h2">
                        Fitment Table Demonstration
                      </Text>
                      <Text variant="bodyMd" as="p">
                        This table displays all vehicles compatible with a product. It includes sorting, filtering, and pagination functionality.
                      </Text>
                      
                      {sampleProduct ? (
                        <Box paddingBlockStart="4">
                          <BlockStack gap="4">
                            <InlineStack align="space-between">
                              <Text variant="headingMd" fontWeight="semibold">{sampleProduct.title}</Text>
                              <Text variant="bodyMd">Product ID: {sampleProduct.id}</Text>
                            </InlineStack>
                            
                            <FitmentTable 
                              productId={sampleProduct.id}
                              fitments={sampleFitments}
                              shop={effectiveShop}
                              onError={handleComponentError}
                            />
                          </BlockStack>
                        </Box>
                      ) : (
                        <Banner status="warning">
                          <Text>No products with fitment data available for demonstration.</Text>
                        </Banner>
                      )}
                    </BlockStack>
                  </Box>
                ) : (
                  <Box padding="4">
                    <BlockStack gap="4">
                      <Text variant="headingMd" as="h2">
                        Compatibility Widget Demonstration
                      </Text>
                      <Text variant="bodyMd" as="p">
                        This widget allows customers to check if a product is compatible with their vehicle. It provides clear visual indicators and alternative product suggestions.
                      </Text>
                      
                      {sampleProduct ? (
                        <Box paddingBlockStart="4">
                          <BlockStack gap="4">
                            <InlineStack align="space-between">
                              <Text variant="headingMd" fontWeight="semibold">{sampleProduct.title}</Text>
                              <Text variant="bodyMd">Product ID: {sampleProduct.id}</Text>
                            </InlineStack>
                            
                            <VehicleProvider>
                              <CompatibilityWidget 
                                productId={sampleProduct.id}
                                shop={effectiveShop}
                                alternativeProducts={alternativeProducts}
                                showVehicleSelector={true}
                                onError={handleComponentError}
                              />
                            </VehicleProvider>
                          </BlockStack>
                        </Box>
                      ) : (
                        <Banner status="warning">
                          <Text>No products with fitment data available for demonstration.</Text>
                        </Banner>
                      )}
                    </BlockStack>
                  </Box>
                )}
              </Tabs>
            </Card>
            
            <Card>
              <BlockStack gap="4">
                <Box padding="4">
                  <Text variant="headingMd" as="h2">Theme Integration</Text>
                  <BlockStack gap="2">
                    <Text variant="bodyMd" as="p">
                      These components can be added to your Shopify store using theme app blocks. 
                      To add them to your store, go to the theme editor and add the appropriate block:
                    </Text>
                    <InlineStack gap="2">
                      <Button url="https://admin.shopify.com/store/quickstart-e64ff943/themes" target="_blank">
                        Go to Theme Editor
                      </Button>
                    </InlineStack>
                  </BlockStack>
                </Box>
              </BlockStack>
            </Card>
          </BlockStack>
        </Layout.Section>
      </Layout>
    </Page>
  );
} 