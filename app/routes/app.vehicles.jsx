import { useState, useCallback } from "react";
import { json } from "@remix-run/node";
import { useLoaderData, useOutletContext } from "@remix-run/react";
import { 
  Page, 
  Layout, 
  Card, 
  Text, 
  BlockStack, 
  InlineStack, 
  Box, 
  Button,
  Tabs,
  EmptyState,
  ResourceList,
  ResourceItem,
  Badge,
  Spinner,
  Banner,
} from "@shopify/polaris";
import { authenticate } from "~/shopify.server";
import { getAllMakes } from "~/models/make.server";

export const loader = async ({ request }) => {
  const { session } = await authenticate.admin(request);
  const shop = session.shop;

  try {
    // Fetch makes data (top level of vehicle hierarchy)
    const makes = await getAllMakes();
    
    return json({
      makes,
      shop
    });
  } catch (error) {
    console.error("Error loading vehicles data:", error);
    return json({ 
      error: "Failed to load vehicles data",
      makes: [],
      shop
    });
  }
};

export default function VehiclesManager() {
  const { makes = [], error, shop } = useLoaderData();
  const { appOrigin } = useOutletContext();
  
  const [selectedTab, setSelectedTab] = useState(0);
  const [loadingMakeId, setLoadingMakeId] = useState(null);
  
  const handleTabChange = useCallback((selectedTabIndex) => {
    setSelectedTab(selectedTabIndex);
  }, []);

  const tabs = [
    {
      id: 'makes',
      content: 'Makes',
      accessibilityLabel: 'Vehicle Makes',
      panelID: 'makes-content',
    },
    {
      id: 'models',
      content: 'Models',
      accessibilityLabel: 'Vehicle Models',
      panelID: 'models-content',
    },
    {
      id: 'years',
      content: 'Years',
      accessibilityLabel: 'Vehicle Years',
      panelID: 'years-content',
    },
    {
      id: 'submodels',
      content: 'Submodels',
      accessibilityLabel: 'Vehicle Submodels',
      panelID: 'submodels-content',
    },
  ];
  
  const handleViewModels = useCallback((makeId) => {
    setLoadingMakeId(makeId);
    // This would navigate to models view or expand the make to show models
    setLoadingMakeId(null);
    setSelectedTab(1); // Switch to Models tab
  }, []);

  if (error) {
    return (
      <Page title="Vehicle Database">
        <ui-title-bar title="Vehicle Database" />
        <Layout>
          <Layout.Section>
            <Banner status="critical">
              <p>{error}</p>
            </Banner>
          </Layout.Section>
        </Layout>
      </Page>
    );
  }

  return (
    <Page 
      title="Vehicle Database"
      primaryAction={{
        content: 'Add Make',
        onAction: () => {
          // This would open a modal or navigate to add make page
        },
      }}
    >
      <ui-title-bar title="Vehicle Database" />
      <Layout>
        <Layout.Section>
          <BlockStack gap="4">
            <Card>
              <Tabs tabs={tabs} selected={selectedTab} onSelect={handleTabChange}>
                {selectedTab === 0 && (
                  <Box padding="4">
                    <BlockStack gap="4">
                      <Text variant="headingMd" as="h2">Vehicle Makes</Text>
                      
                      {makes.length > 0 ? (
                        <ResourceList
                          resourceName={{ singular: 'make', plural: 'makes' }}
                          items={makes}
                          renderItem={(make) => (
                            <ResourceItem
                              id={make.id}
                              onClick={() => handleViewModels(make.id)}
                              loading={loadingMakeId === make.id}
                              accessibilityLabel={`View models for ${make.name}`}
                            >
                              <InlineStack align="space-between">
                                <Text variant="bodyMd" fontWeight="bold" as="h3">
                                  {make.name}
                                </Text>
                                <Badge>
                                  {/* This would show model count */}
                                  {make.models?.length || 0} models
                                </Badge>
                              </InlineStack>
                            </ResourceItem>
                          )}
                        />
                      ) : (
                        <EmptyState
                          heading="No vehicle makes"
                          image="https://cdn.shopify.com/s/files/1/0262/4071/2726/files/emptystate-files.png"
                          action={{
                            content: 'Add make',
                            onAction: () => {
                              // This would open a modal or navigate to add make page
                            },
                          }}
                        >
                          <p>Start building your vehicle database by adding makes.</p>
                        </EmptyState>
                      )}
                    </BlockStack>
                  </Box>
                )}
                
                {selectedTab === 1 && (
                  <Box padding="4">
                    <BlockStack gap="4">
                      <InlineStack align="space-between">
                        <Text variant="headingMd" as="h2">Vehicle Models</Text>
                        <Button>Add Model</Button>
                      </InlineStack>
                      
                      <EmptyState
                        heading="Select a make first"
                        image="https://cdn.shopify.com/s/files/1/0262/4071/2726/files/emptystate-files.png"
                      >
                        <p>Select a make from the Makes tab to view its models.</p>
                      </EmptyState>
                    </BlockStack>
                  </Box>
                )}
                
                {selectedTab === 2 && (
                  <Box padding="4">
                    <BlockStack gap="4">
                      <InlineStack align="space-between">
                        <Text variant="headingMd" as="h2">Vehicle Years</Text>
                        <Button>Add Year</Button>
                      </InlineStack>
                      
                      <EmptyState
                        heading="Select a model first"
                        image="https://cdn.shopify.com/s/files/1/0262/4071/2726/files/emptystate-files.png"
                      >
                        <p>Select a model from the Models tab to view its years.</p>
                      </EmptyState>
                    </BlockStack>
                  </Box>
                )}
                
                {selectedTab === 3 && (
                  <Box padding="4">
                    <BlockStack gap="4">
                      <InlineStack align="space-between">
                        <Text variant="headingMd" as="h2">Vehicle Submodels</Text>
                        <Button>Add Submodel</Button>
                      </InlineStack>
                      
                      <EmptyState
                        heading="Select a year first"
                        image="https://cdn.shopify.com/s/files/1/0262/4071/2726/files/emptystate-files.png"
                      >
                        <p>Select a year from the Years tab to view its submodels.</p>
                      </EmptyState>
                    </BlockStack>
                  </Box>
                )}
              </Tabs>
            </Card>
          </BlockStack>
        </Layout.Section>
        
        <Layout.Section secondary>
          <Card>
            <BlockStack gap="4">
              <Box padding="4">
                <Text variant="headingMd" as="h2">Vehicle Database Guide</Text>
              </Box>
              <Box padding="4" paddingBlockStart="0">
                <BlockStack gap="2">
                  <Text variant="bodyMd" as="p">
                    1. Add makes (e.g., Toyota, Honda)
                  </Text>
                  <Text variant="bodyMd" as="p">
                    2. Add models for each make (e.g., Camry, Civic)
                  </Text>
                  <Text variant="bodyMd" as="p">
                    3. Add years for each model (e.g., 2020, 2021)
                  </Text>
                  <Text variant="bodyMd" as="p">
                    4. Add submodels for each year (e.g., LX, EX, Sport)
                  </Text>
                </BlockStack>
                <Box paddingBlockStart="4">
                  <Button url="/app/vehicles/import">Import Vehicle Data</Button>
                </Box>
              </Box>
            </BlockStack>
          </Card>
        </Layout.Section>
      </Layout>
    </Page>
  );
} 