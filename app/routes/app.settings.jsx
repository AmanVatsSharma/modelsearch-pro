import { useState, useCallback } from "react";
import { json } from "@remix-run/node";
import { useActionData, useLoaderData, useOutletContext, Form } from "@remix-run/react";
import { 
  Page, 
  Layout, 
  Card, 
  Text, 
  BlockStack, 
  InlineStack, 
  Box, 
  Button,
  FormLayout,
  TextField,
  Select,
  Checkbox,
  Banner,
  RangeSlider,
  ColorPicker,
  CalloutCard,
  ToggleButton,
  Tabs,
  Divider,
} from "@shopify/polaris";
import { authenticate } from "~/shopify.server";
import { getSettings } from "~/models/settings.server";

export const loader = async ({ request }) => {
  const { session } = await authenticate.admin(request);
  const shop = session.shop;

  try {
    // Get current settings
    let settings = await getSettings(shop);
    
    // If no settings exist, use default values
    if (!settings) {
      settings = {
        widgetTitle: "Find parts for your vehicle",
        widgetPlacement: "both",
        widgetTheme: "light",
        widgetButtonText: "Find Parts",
        rememberVehicleEnabled: true,
        rememberDays: 30
      };
    }
    
    return json({
      settings,
      shop
    });
  } catch (error) {
    console.error("Error loading settings:", error);
    return json({ 
      error: "Failed to load settings",
      settings: null,
      shop
    });
  }
};

export const action = async ({ request }) => {
  const { session } = await authenticate.admin(request);
  const shop = session.shop;
  
  // In a real implementation, we would save the settings here
  return json({ success: true, message: "Settings saved successfully" });
};

export default function SettingsManager() {
  const { settings, error, shop } = useLoaderData();
  const actionData = useActionData();
  const { appOrigin } = useOutletContext();
  
  const [selectedTab, setSelectedTab] = useState(0);
  
  // Form state
  const [title, setTitle] = useState(settings?.widgetTitle || "");
  const [buttonText, setButtonText] = useState(settings?.widgetButtonText || "");
  const [placement, setPlacement] = useState(settings?.widgetPlacement || "both");
  const [theme, setTheme] = useState(settings?.widgetTheme || "light");
  const [rememberVehicle, setRememberVehicle] = useState(settings?.rememberVehicleEnabled || true);
  const [rememberDays, setRememberDays] = useState(settings?.rememberDays || 30);
  
  const handleTabChange = useCallback((selectedTabIndex) => {
    setSelectedTab(selectedTabIndex);
  }, []);
  
  const placementOptions = [
    { label: 'Home page only', value: 'home' },
    { label: 'Product pages only', value: 'product' },
    { label: 'Collection pages only', value: 'collection' },
    { label: 'Home and product pages', value: 'both' },
    { label: 'All pages', value: 'all' },
  ];
  
  const themeOptions = [
    { label: 'Light', value: 'light' },
    { label: 'Dark', value: 'dark' },
  ];
  
  const tabs = [
    {
      id: 'general',
      content: 'General',
      accessibilityLabel: 'General Settings',
      panelID: 'general-settings-content',
    },
    {
      id: 'appearance',
      content: 'Appearance',
      accessibilityLabel: 'Appearance Settings',
      panelID: 'appearance-settings-content',
    },
    {
      id: 'integration',
      content: 'Integration',
      accessibilityLabel: 'Integration Settings',
      panelID: 'integration-settings-content',
    },
  ];

  if (error) {
    return (
      <Page title="Settings">
        <ui-title-bar title="Settings" />
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
      title="Settings"
      primaryAction={{
        content: 'Save',
        onAction: () => {
          document.getElementById('settings-form').submit();
        },
      }}
    >
      <ui-title-bar title="Settings" />
      
      {actionData?.success && (
        <Layout>
          <Layout.Section>
            <Banner
              title="Settings updated"
              status="success"
              onDismiss={() => {}}
            >
              <p>{actionData.message}</p>
            </Banner>
          </Layout.Section>
        </Layout>
      )}
      
      <Form id="settings-form" method="post">
        <Layout>
          <Layout.Section>
            <Card>
              <Tabs tabs={tabs} selected={selectedTab} onSelect={handleTabChange}>
                {selectedTab === 0 && (
                  <Box padding="4">
                    <BlockStack gap="4">
                      <Text variant="headingMd" as="h2">General Settings</Text>
                      
                      <FormLayout>
                        <TextField
                          label="Widget Title"
                          value={title}
                          onChange={setTitle}
                          autoComplete="off"
                          helpText="The title displayed at the top of the search widget"
                          name="widgetTitle"
                        />
                        
                        <TextField
                          label="Button Text"
                          value={buttonText}
                          onChange={setButtonText}
                          autoComplete="off"
                          helpText="Text for the search button"
                          name="widgetButtonText"
                        />
                        
                        <Select
                          label="Widget Placement"
                          options={placementOptions}
                          value={placement}
                          onChange={setPlacement}
                          helpText="Where the search widget should appear on your store"
                          name="widgetPlacement"
                        />
                        
                        <Checkbox
                          label="Remember customer's vehicle"
                          checked={rememberVehicle}
                          onChange={setRememberVehicle}
                          helpText="Store the selected vehicle in a cookie for returning visitors"
                          name="rememberVehicleEnabled"
                        />
                        
                        {rememberVehicle && (
                          <RangeSlider
                            label="Remember for days"
                            value={rememberDays}
                            onChange={setRememberDays}
                            output
                            min={1}
                            max={90}
                            helpText="Number of days to remember vehicle selection"
                            name="rememberDays"
                          />
                        )}
                      </FormLayout>
                    </BlockStack>
                  </Box>
                )}
                
                {selectedTab === 1 && (
                  <Box padding="4">
                    <BlockStack gap="4">
                      <Text variant="headingMd" as="h2">Appearance Settings</Text>
                      
                      <FormLayout>
                        <Select
                          label="Widget Theme"
                          options={themeOptions}
                          value={theme}
                          onChange={setTheme}
                          helpText="Color scheme for the widget"
                          name="widgetTheme"
                        />
                        
                        <Box paddingBlockStart="4">
                          <BlockStack gap="4">
                            <Text variant="headingMd" as="h3">Preview</Text>
                            <Banner status="info">
                              Widget preview will appear here
                            </Banner>
                          </BlockStack>
                        </Box>
                      </FormLayout>
                    </BlockStack>
                  </Box>
                )}
                
                {selectedTab === 2 && (
                  <Box padding="4">
                    <BlockStack gap="4">
                      <Text variant="headingMd" as="h2">Integration Settings</Text>
                      
                      <CalloutCard
                        title="Theme Integration"
                        illustration="https://cdn.shopify.com/s/files/1/0262/4071/2726/files/emptystate-files.png"
                        primaryAction={{
                          content: 'Learn more',
                          url: '/app/settings/theme-integration',
                        }}
                      >
                        <p>
                          Add the vehicle search widget to your theme using one of the following methods:
                        </p>
                      </CalloutCard>
                      
                      <Card>
                        <BlockStack gap="4">
                          <Box padding="4">
                            <Text variant="headingMd" as="h3">Option 1: Theme App Extension</Text>
                            <Text variant="bodyMd" as="p">
                              Use the Shopify Theme Editor to add the widget to your theme. 
                              This is the easiest method and works with Online Store 2.0 themes.
                            </Text>
                          </Box>
                          <Divider />
                          <Box padding="4">
                            <Text variant="headingMd" as="h3">Option 2: Manual Integration</Text>
                            <Text variant="bodyMd" as="p">
                              Add the following code to your theme files:
                            </Text>
                            <Box paddingBlockStart="4">
                              <div style={{ background: '#f4f6f8', padding: '16px', borderRadius: '4px', overflow: 'auto' }}>
                                <pre><code>{`<div id="vehicle-search-widget"></div>
<script src="${appOrigin}/api/scripts/vehicle-search-widget"></script>`}</code></pre>
                              </div>
                            </Box>
                          </Box>
                        </BlockStack>
                      </Card>
                    </BlockStack>
                  </Box>
                )}
              </Tabs>
            </Card>
          </Layout.Section>
          
          <Layout.Section secondary>
            <Card>
              <BlockStack gap="4">
                <Box padding="4">
                  <Text variant="headingMd" as="h2">Settings Guide</Text>
                </Box>
                <Box padding="4" paddingBlockStart="0">
                  <BlockStack gap="2">
                    <Text variant="bodyMd" as="p">
                      1. Configure widget appearance and behavior on this page
                    </Text>
                    <Text variant="bodyMd" as="p">
                      2. Save your settings to apply changes
                    </Text>
                    <Text variant="bodyMd" as="p">
                      3. Follow the integration guide to add the widget to your theme
                    </Text>
                    <Text variant="bodyMd" as="p">
                      4. Test the widget on your store to ensure it works correctly
                    </Text>
                  </BlockStack>
                  <Box paddingBlockStart="4">
                    <Button url="/app/search">Preview Widget</Button>
                  </Box>
                </Box>
              </BlockStack>
            </Card>
          </Layout.Section>
        </Layout>
      </Form>
    </Page>
  );
} 