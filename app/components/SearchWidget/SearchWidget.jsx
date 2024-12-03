import { useState, useCallback, useEffect } from 'react';
import {
  Card,
  FormLayout,
  Banner,
  Text,
  Button,
  InlineStack,
  BlockStack,
  Box,
  Divider,
} from '@shopify/polaris';
import { useVehicleSelection } from '~/hooks/useVehicleSelection';
import MakeSelector from './components/MakeSelector';
import ModelSelector from './components/ModelSelector';
import YearSelector from './components/YearSelector';
import SubmodelSelector from './components/SubmodelSelector';
import SearchButton from './components/SearchButton';
import { getVehicleDisplayString } from '~/utilities/vehicleStorage';
import styles from './SearchWidget.module.css';

/**
 * SearchWidget component that allows users to search for products by vehicle
 * @param {Object} props Component props
 * @param {string} props.title Widget title
 * @param {string} props.buttonText Search button text
 * @param {string} props.theme Widget theme ("light" or "dark")
 * @param {function} props.onSearch Callback when search is performed
 * @param {boolean} props.showResetButton Whether to show reset button
 * @param {string} props.shop The shop domain for API calls
 */
export default function SearchWidget({
  title = 'Find parts for your vehicle',
  buttonText = 'Find Parts',
  theme = 'light',
  onSearch,
  showResetButton = true,
  shop = null,
}) {
  console.log('[SearchWidget] Rendering with props:', { title, buttonText, theme, showResetButton, shop });
  
  const {
    selectedMake,
    selectedModel,
    selectedYear,
    selectedSubmodel,
    makes,
    models,
    years,
    submodels,
    handleMakeChange,
    handleModelChange,
    handleYearChange,
    handleSubmodelChange,
    clearVehicle,
    loading,
    error,
    hasCompleteSelection,
    setShop,
    fetchMakes,
    fetchModels,
    fetchYears,
    fetchSubmodels,
  } = useVehicleSelection();

  console.log('[SearchWidget] Vehicle selection state:', {
    selectedMake,
    selectedModel,
    selectedYear,
    selectedSubmodel,
    makes: makes.length,
    models: models.length,
    years: years.length,
    submodels: submodels.length,
    loading,
    error
  });

  const [expanded, setExpanded] = useState(true);

  // Set shop when it changes
  useEffect(() => {
    console.log('[SearchWidget] Shop prop changed:', shop);
    if (shop) {
      console.log('[SearchWidget] Setting shop in vehicle selection:', shop);
      setShop(shop);
    }
  }, [shop, setShop]);

  // Load initial data
  useEffect(() => {
    console.log('[SearchWidget] Calling fetchMakes...');
    if (typeof fetchMakes === 'function') {
      fetchMakes().catch(error => {
        console.error('[SearchWidget] Error fetching makes:', error);
      });
    } else {
      console.error('[SearchWidget] fetchMakes is not a function!', { fetchMakes });
    }
  }, [fetchMakes]);

  // Load models when make is selected
  useEffect(() => {
    console.log('[SearchWidget] Selected make changed:', selectedMake);
    if (selectedMake?.id && typeof fetchModels === 'function') {
      console.log('[SearchWidget] Fetching models for make:', selectedMake);
      fetchModels(selectedMake.id).catch(error => {
        console.error('[SearchWidget] Error fetching models:', error);
      });
    }
  }, [selectedMake, fetchModels]);

  // Load years when model is selected
  useEffect(() => {
    console.log('[SearchWidget] Selected model changed:', selectedModel);
    if (selectedModel?.id && typeof fetchYears === 'function') {
      console.log('[SearchWidget] Fetching years for model:', selectedModel);
      fetchYears(selectedModel.id).catch(error => {
        console.error('[SearchWidget] Error fetching years:', error);
      });
    }
  }, [selectedModel, fetchYears]);

  // Load submodels when year is selected
  useEffect(() => {
    console.log('[SearchWidget] Selected year changed:', selectedYear);
    if (selectedYear?.id && typeof fetchSubmodels === 'function') {
      console.log('[SearchWidget] Fetching submodels for year:', selectedYear);
      fetchSubmodels(selectedYear.id).catch(error => {
        console.error('[SearchWidget] Error fetching submodels:', error);
      });
    }
  }, [selectedYear, fetchSubmodels]);

  // Callback for when search button is clicked
  const handleSearch = useCallback(() => {
    console.log('[SearchWidget] Search button clicked');
    if (onSearch && hasCompleteSelection()) {
      const vehicle = {
        make: selectedMake,
        model: selectedModel,
        year: selectedYear,
        submodel: selectedSubmodel,
      };
      console.log('[SearchWidget] Calling onSearch with vehicle:', vehicle);
      onSearch(vehicle);
    }
  }, [onSearch, hasCompleteSelection, selectedMake, selectedModel, selectedYear, selectedSubmodel]);

  // Toggle the expanded state (for mobile)
  const toggleExpanded = useCallback(() => {
    console.log('[SearchWidget] Toggling expanded state');
    setExpanded((prev) => !prev);
  }, []);

  // Get the currently selected vehicle as a string
  const selectedVehicleString = getVehicleDisplayString({
    make: selectedMake,
    model: selectedModel,
    year: selectedYear,
    submodel: selectedSubmodel,
  });

  console.log('[SearchWidget] Selected vehicle string:', selectedVehicleString);

  return (
    <Card>
      <BlockStack gap="4">
        {/* Widget header */}
        <Box paddingBlockStart="4" paddingInlineStart="4" paddingInlineEnd="4">
          <InlineStack align="space-between">
            <Text variant="headingMd" as="h2">
              {title}
            </Text>
            {hasCompleteSelection() && showResetButton && (
              <Button
                variant="plain"
                onClick={clearVehicle}
                disabled={loading}
                accessibilityLabel="Reset vehicle selection"
              >
                Reset
              </Button>
            )}
          </InlineStack>
        </Box>

        <Divider />

        {/* Debug info (only in development) */}
        {process.env.NODE_ENV !== 'production' && (
          <Box paddingInlineStart="4" paddingInlineEnd="4">
            <Banner status="info" title="Debug Info">
              <BlockStack gap="2">
                <Text variant="bodyMd">Shop: {shop || 'Not set'}</Text>
                <Text variant="bodyMd">API Endpoint: {`/api/vehicle/makes${shop ? `?shop=${shop}` : ''}`}</Text>
                <Text variant="bodyMd">Makes loaded: {makes.length}</Text>
                <Text variant="bodyMd">Context: {typeof window !== 'undefined' && window.location.href.includes('/admin/') ? 'Admin' : 'Storefront'}</Text>
                {error && <Text variant="bodyMd" color="critical">Error: {error}</Text>}
              </BlockStack>
            </Banner>
          </Box>
        )}

        {/* Mobile selected vehicle display */}
        {selectedVehicleString && !expanded && (
          <Box paddingInlineStart="4" paddingInlineEnd="4">
            <Button 
              onClick={toggleExpanded} 
              fullWidth
              accessibilityLabel={`Selected vehicle: ${selectedVehicleString}. Click to expand`}
            >
              {selectedVehicleString}
            </Button>
          </Box>
        )}

        {/* Error display */}
        {error && (
          <Box paddingInlineStart="4" paddingInlineEnd="4">
            <Banner status="critical">
              <BlockStack gap="2">
                <Text>{error}</Text>
                {error.includes('Authentication') && (
                  <Text variant="bodyMd">
                    Please ensure you're accessing this page through your Shopify store.
                  </Text>
                )}
              </BlockStack>
            </Banner>
          </Box>
        )}

        {/* Selectors form */}
        {expanded && (
          <Box paddingInlineStart="4" paddingInlineEnd="4" paddingBlockEnd="4">
            <FormLayout>
              <MakeSelector
                makes={makes}
                selectedMake={selectedMake}
                onChange={handleMakeChange}
                loading={loading}
              />

              <ModelSelector
                models={models}
                selectedModel={selectedModel}
                onChange={handleModelChange}
                disabled={!selectedMake}
                loading={loading}
              />

              <YearSelector
                years={years}
                selectedYear={selectedYear}
                onChange={handleYearChange}
                disabled={!selectedModel}
                loading={loading}
              />

              <SubmodelSelector
                submodels={submodels}
                selectedSubmodel={selectedSubmodel}
                onChange={handleSubmodelChange}
                disabled={!selectedYear}
                loading={loading}
                optional
              />

              <SearchButton
                onClick={handleSearch}
                disabled={!hasCompleteSelection() || loading}
                loading={loading}
                buttonText={buttonText}
              />
            </FormLayout>
          </Box>
        )}
      </BlockStack>
    </Card>
  );
}
