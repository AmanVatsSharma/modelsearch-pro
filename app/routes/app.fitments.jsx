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
  DataTable,
  Filters,
  Pagination,
  EmptyState,
  Banner,
  ResourceList,
  ResourceItem,
  Badge,
  TextField,
} from "@shopify/polaris";
import { authenticate } from "~/shopify.server";
import { getProducts } from "~/models/product.server";
import { getFitments } from "~/models/fitment.server";

export const loader = async ({ request }) => {
  const { session } = await authenticate.admin(request);
  const shop = session.shop;

  try {
    // Parse URL params for pagination and filters
    const url = new URL(request.url);
    const page = parseInt(url.searchParams.get('page') || '1', 10);
    const limit = parseInt(url.searchParams.get('limit') || '20', 10);
    const search = url.searchParams.get('search') || '';
    
    // Get products with pagination
    const { products, pagination } = await getProducts(shop, { page, limit, search });
    
    // Get fitments for the first product to show as an example
    const sampleProduct = products[0];
    let sampleFitments = [];
    
    if (sampleProduct) {
      sampleFitments = await getFitments(sampleProduct.id);
    }
    
    return json({
      products,
      pagination,
      sampleProduct,
      sampleFitments,
      shop
    });
  } catch (error) {
    console.error("Error loading fitments data:", error);
    return json({ 
      error: "Failed to load fitments data",
      products: [],
      pagination: { page: 1, pageSize: 20, totalItems: 0, totalPages: 0 },
      sampleProduct: null,
      sampleFitments: [],
      shop
    });
  }
};

export default function FitmentsManager() {
  const { 
    products = [], 
    pagination = {}, 
    sampleProduct, 
    sampleFitments = [],
    error, 
    shop 
  } = useLoaderData();
  const { appOrigin } = useOutletContext();
  
  const [searchValue, setSearchValue] = useState('');
  const [selectedProductId, setSelectedProductId] = useState(sampleProduct?.id || '');
  
  const handleSearchChange = useCallback((value) => {
    setSearchValue(value);
  }, []);
  
  const handleSearchSubmit = useCallback(() => {
    // This would trigger a search with the current value
    console.log("Searching for:", searchValue);
  }, [searchValue]);
  
  const handleProductSelect = useCallback((productId) => {
    setSelectedProductId(productId);
    // This would load fitments for the selected product
  }, []);
  
  // Format fitments for display in DataTable
  const fitmentRows = sampleFitments.map(fitment => [
    fitment.year?.value?.toString() || 'Unknown Year',
    fitment.year?.model?.name || 'Unknown Model',
    fitment.year?.model?.make?.name || 'Unknown Make',
    fitment.submodel?.name || 'All Submodels',
    <Button 
      size="slim" 
      variant="plain" 
      destructive 
      key={`delete-${fitment.id}`}
      onClick={() => console.log(`Delete fitment ${fitment.id}`)}
    >
      Remove
    </Button>
  ]);
  
  if (error) {
    return (
      <Page title="Fitment Management">
        <ui-title-bar title="Fitment Management" />
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
      title="Fitment Management"
      primaryAction={{
        content: 'Add Fitment',
        onAction: () => {
          // This would navigate to add fitment page
        },
      }}
    >
      <ui-title-bar title="Fitment Management" />
      <Layout>
        <Layout.Section secondary>
          <Card>
            <BlockStack gap="4">
              <Box padding="4">
                <Text variant="headingMd" as="h2">Products</Text>
                <Box paddingBlockStart="4">
                  <TextField
                    label="Search products"
                    value={searchValue}
                    onChange={handleSearchChange}
                    autoComplete="off"
                    placeholder="Enter product name"
                    onClearButtonClick={() => setSearchValue('')}
                    onBlur={handleSearchSubmit}
                  />
                </Box>
              </Box>
              <Box padding="4" paddingBlockStart="0">
                {products.length > 0 ? (
                  <BlockStack gap="4">
                    <ResourceList
                      resourceName={{ singular: 'product', plural: 'products' }}
                      items={products}
                      renderItem={(product) => (
                        <ResourceItem
                          id={product.id}
                          onClick={() => handleProductSelect(product.id)}
                          selected={selectedProductId === product.id}
                          accessibilityLabel={`View fitments for ${product.title}`}
                        >
                          <InlineStack align="space-between">
                            <Text variant="bodyMd" fontWeight="bold" as="h3">
                              {product.title}
                            </Text>
                            <Badge>
                              {product._count?.fitments || 0} fitments
                            </Badge>
                          </InlineStack>
                        </ResourceItem>
                      )}
                    />
                    <Box padding="4">
                      <Pagination
                        hasPrevious={pagination.page > 1}
                        onPrevious={() => {
                          // Navigate to previous page
                        }}
                        hasNext={pagination.page < pagination.totalPages}
                        onNext={() => {
                          // Navigate to next page
                        }}
                      />
                    </Box>
                  </BlockStack>
                ) : (
                  <EmptyState
                    heading="No products found"
                    image="https://cdn.shopify.com/s/files/1/0262/4071/2726/files/emptystate-files.png"
                  >
                    <p>Start by adding products or importing them from your store.</p>
                  </EmptyState>
                )}
              </Box>
            </BlockStack>
          </Card>
        </Layout.Section>
        
        <Layout.Section>
          <Card>
            <BlockStack gap="4">
              <Box padding="4">
                <InlineStack align="space-between">
                  <Text variant="headingMd" as="h2">
                    {selectedProductId 
                      ? `Fitments for ${products.find(p => p.id === selectedProductId)?.title || 'Selected Product'}`
                      : 'Product Fitments'
                    }
                  </Text>
                  {selectedProductId && (
                    <Button>Add Fitment</Button>
                  )}
                </InlineStack>
              </Box>
              
              <Box padding="4" paddingBlockStart="0">
                {selectedProductId ? (
                  fitmentRows.length > 0 ? (
                    <DataTable
                      columnContentTypes={['text', 'text', 'text', 'text', 'text']}
                      headings={['Year', 'Model', 'Make', 'Submodel', 'Actions']}
                      rows={fitmentRows}
                    />
                  ) : (
                    <EmptyState
                      heading="No fitments for this product"
                      image="https://cdn.shopify.com/s/files/1/0262/4071/2726/files/emptystate-files.png"
                      action={{
                        content: 'Add Fitment',
                        onAction: () => {
                          // This would open a modal or navigate to add fitment page
                        },
                      }}
                    >
                      <p>This product doesn't have any vehicle fitments yet.</p>
                    </EmptyState>
                  )
                ) : (
                  <EmptyState
                    heading="Select a product"
                    image="https://cdn.shopify.com/s/files/1/0262/4071/2726/files/emptystate-files.png"
                  >
                    <p>Select a product from the list to view and manage its fitments.</p>
                  </EmptyState>
                )}
              </Box>
            </BlockStack>
          </Card>
        </Layout.Section>
      </Layout>
    </Page>
  );
} 