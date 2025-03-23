import { useState, useCallback, useEffect } from "react";
import { json } from "@remix-run/node";
import { useLoaderData, useOutletContext } from "@remix-run/react";
import { 
  Page, 
  Layout, 
  Card, 
  Text, 
  BlockStack, 
  Box,
  InlineStack, 
  Button,
  Banner,
  DataTable,
  Tabs,
  Icon,
  LegacyCard,
  EmptyState
} from "@shopify/polaris";
import {
  AnalyticsIcon,
  DiamondIcon,
  SearchIcon,
  ProductsIcon,
  SettingsIcon
} from "@shopify/polaris-icons";
import { authenticate } from "~/shopify.server";
import { getSearchStats, getRecentSearches } from "~/models/analytics.server";
import { getTotalProducts } from "~/models/product.server";
import { getTotalFitments } from "~/models/fitment.server";
import { getAllMakes } from "~/models/make.server";

export const loader = async ({ request }) => {
  const { session } = await authenticate.admin(request);
  const shop = session.shop;

  try {
    // Fetch dashboard data
    const [
      searchStats,
      recentSearches,
      totalProducts,
      totalFitments,
      makes
    ] = await Promise.all([
      getSearchStats(shop, 7), // Get search stats for last 7 days
      getRecentSearches(shop, 10), // Get 10 most recent searches
      getTotalProducts(shop),
      getTotalFitments(shop),
      getAllMakes()
    ]);

    return json({
      searchStats,
      recentSearches,
      totalProducts,
      totalFitments,
      makes: makes.length,
      shop
    });
  } catch (error) {
    console.error("Error loading dashboard data:", error);
    return json({ 
      error: "Failed to load dashboard data",
      shop
    });
  }
};

export default function Dashboard() {
  const { 
    searchStats = [], 
    recentSearches = [], 
    totalProducts = 0, 
    totalFitments = 0, 
    makes = 0,
    error,
    shop
  } = useLoaderData();
  const { appOrigin } = useOutletContext();
  
  const [selectedTab, setSelectedTab] = useState(0);
  
  const handleTabChange = useCallback((selectedTabIndex) => {
    setSelectedTab(selectedTabIndex);
  }, []);

  // Format recent searches for display
  const recentSearchesRows = recentSearches.map(search => [
    search.createdAt ? new Date(search.createdAt).toLocaleString() : 'Unknown',
    search.makeId ? (search.make?.name || 'Unknown Make') : 'All Makes',
    search.modelId ? (search.model?.name || 'Unknown Model') : 'All Models',
    search.yearId ? (search.year?.value?.toString() || 'Unknown Year') : 'All Years',
    search.successful ? 'Yes' : 'No',
    search.searchResults.toString() || '0'
  ]);

  const tabs = [
    {
      id: 'recent-activity',
      content: 'Recent Activity',
      accessibilityLabel: 'Recent Activity',
      panelID: 'recent-activity-content',
    },
    {
      id: 'search-analytics',
      content: 'Search Analytics',
      accessibilityLabel: 'Search Analytics',
      panelID: 'search-analytics-content',
    },
  ];

  // Prepare data for metrics cards
  const metrics = [
    {
      title: "Products",
      value: totalProducts,
      icon: ProductsIcon,
      linkTo: "/app/vehicles"
    },
    {
      title: "Fitments",
      value: totalFitments,
      icon: DiamondIcon,
      linkTo: "/app/fitments"
    },
    {
      title: "Vehicle Makes",
      value: makes,
      icon: SearchIcon,
      linkTo: "/app/vehicles"
    },
    {
      title: "Searches",
      value: searchStats.reduce((total, day) => total + day.count, 0),
      icon: AnalyticsIcon,
      linkTo: "/app/analytics"
    }
  ];

  if (error) {
    return (
      <Page title="Dashboard">
        <ui-title-bar title="Dashboard" />
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
    <Page title="Dashboard">
      <ui-title-bar title="Dashboard" />
      <Layout>
        {/* Metrics Section */}
        <Layout.Section>
          <BlockStack gap="4">
            <InlineStack gap="4" wrap={false}>
              {metrics.map((metric, index) => (
                <div style={{ flex: 1 }} key={index}>
                  <Card>
                    <BlockStack gap="2">
                      <Box padding="4">
                        <InlineStack align="space-between">
                          <Text variant="headingMd" as="h2">{metric.title}</Text>
                          <Icon source={metric.icon} color="base" />
                        </InlineStack>
                      </Box>
                      <Box padding="4" paddingBlockStart="0">
                        <BlockStack gap="4">
                          <Text variant="heading2xl" as="p">{metric.value}</Text>
                          <Button variant="plain" url={metric.linkTo}>
                            View details
                          </Button>
                        </BlockStack>
                      </Box>
                    </BlockStack>
                  </Card>
                </div>
              ))}
            </InlineStack>
          </BlockStack>
        </Layout.Section>

        {/* Quick Actions Section */}
        <Layout.Section>
          <Card>
            <BlockStack gap="4">
              <Box padding="4">
                <Text variant="headingMd" as="h2">Quick Actions</Text>
              </Box>
              <Box padding="4" paddingBlockStart="0">
                <InlineStack gap="3" wrap={true}>
                  <Button url="/app/vehicles/add">Add Vehicle</Button>
                  <Button url="/app/fitments/add">Add Fitment</Button>
                  <Button url="/app/settings">Configure Widget</Button>
                  <Button url="/app/search">Preview Widget</Button>
                </InlineStack>
              </Box>
            </BlockStack>
          </Card>
        </Layout.Section>

        {/* Activity & Analytics Tabs */}
        <Layout.Section>
          <Card>
            <Tabs tabs={tabs} selected={selectedTab} onSelect={handleTabChange}>
              {selectedTab === 0 && (
                <Box padding="4">
                  <BlockStack gap="4">
                    <Text variant="headingMd" as="h2">Recent Vehicle Searches</Text>
                    
                    {recentSearchesRows.length > 0 ? (
                      <DataTable
                        columnContentTypes={['text', 'text', 'text', 'text', 'text', 'numeric']}
                        headings={['Date', 'Make', 'Model', 'Year', 'Successful', 'Results']}
                        rows={recentSearchesRows}
                      />
                    ) : (
                      <EmptyState
                        heading="No recent searches"
                        image="https://cdn.shopify.com/s/files/1/0262/4071/2726/files/emptystate-files.png"
                      >
                        <p>Once customers start searching for vehicles, you'll see their activity here.</p>
                      </EmptyState>
                    )}
                  </BlockStack>
                </Box>
              )}
              
              {selectedTab === 1 && (
                <Box padding="4">
                  <BlockStack gap="4">
                    <Text variant="headingMd" as="h2">Search Analytics</Text>
                    
                    {searchStats.length > 0 ? (
                      <DataTable
                        columnContentTypes={['text', 'numeric', 'numeric', 'numeric']}
                        headings={['Date', 'Total Searches', 'Successful', 'Failed']}
                        rows={searchStats.map(stat => [
                          new Date(stat.date).toLocaleDateString(),
                          stat.count,
                          stat.successful,
                          stat.count - stat.successful
                        ])}
                      />
                    ) : (
                      <EmptyState
                        heading="No analytics data yet"
                        image="https://cdn.shopify.com/s/files/1/0262/4071/2726/files/emptystate-files.png"
                      >
                        <p>Analytics data will appear here once customers start using your vehicle search widget.</p>
                      </EmptyState>
                    )}
                  </BlockStack>
                </Box>
              )}
            </Tabs>
          </Card>
        </Layout.Section>

        {/* Implementation Guide */}
        <Layout.Section>
          <Card>
            <BlockStack gap="4">
              <Box padding="4">
                <Text variant="headingMd" as="h2">Implementation Guide</Text>
              </Box>
              <Box padding="4" paddingBlockStart="0">
                <BlockStack gap="4">
                  <Text variant="bodyMd" as="p">
                    To implement the vehicle search widget on your storefront, follow these steps:
                  </Text>
                  <BlockStack gap="2">
                    <Text variant="bodyMd" as="p">
                      1. Configure your vehicle database under Vehicle Database
                    </Text>
                    <Text variant="bodyMd" as="p">
                      2. Set up product fitments under Fitment Management
                    </Text>
                    <Text variant="bodyMd" as="p">
                      3. Customize the widget appearance under Settings
                    </Text>
                    <Text variant="bodyMd" as="p">
                      4. Preview the widget using the Vehicle Search Widget page
                    </Text>
                    <Text variant="bodyMd" as="p">
                      5. Install the widget on your store by following the Theme Integration guide
                    </Text>
                  </BlockStack>
                  <Box paddingBlockStart="3">
                    <Button url="/app/settings">Go to Settings</Button>
                  </Box>
                </BlockStack>
              </Box>
            </BlockStack>
          </Card>
        </Layout.Section>
      </Layout>
    </Page>
  );
} 