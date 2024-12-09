import { useState, useCallback, useEffect } from 'react';
import {
  Card,
  Banner,
  Button,
  Text,
  Spinner,
  InlineStack,
  BlockStack,
  Box,
  Icon,
  Link,
  Modal,
  Divider,
} from '@shopify/polaris';
import { CheckCircleIcon, XCircleIcon, SearchIcon } from '@shopify/polaris-icons';
import { useVehicleSelection } from '~/hooks/useVehicleSelection';
import { SearchWidget } from '~/components/SearchWidget';
import styles from './CompatibilityWidget.module.css';

/**
 * CompatibilityWidget component for checking product compatibility with a selected vehicle
 * @param {Object} props Component props
 * @param {string} props.productId Product ID to check compatibility for
 * @param {string} props.shop The shop domain for API calls
 * @param {Array} props.alternativeProducts Optional array of alternative products to suggest
 * @param {string} props.title Widget title
 * @param {boolean} props.showVehicleSelector Whether to show the vehicle selector inline
 * @param {function} props.onError Callback for error handling
 */
export default function CompatibilityWidget({
  productId = null,
  shop = null,
  alternativeProducts = [],
  title = 'Vehicle Compatibility',
  showVehicleSelector = true,
  onError = null,
}) {
  // Component state
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [compatibilityResult, setCompatibilityResult] = useState(null);
  const [selectedVehicle, setSelectedVehicle] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  
  const { 
    selectedMake, 
    selectedModel, 
    selectedYear, 
    selectedSubmodel,
    clearVehicle,
    hasCompleteSelection 
  } = useVehicleSelection();
  
  // Create selected vehicle object from context
  useEffect(() => {
    if (hasCompleteSelection()) {
      setSelectedVehicle({
        make: selectedMake,
        model: selectedModel,
        year: selectedYear,
        submodel: selectedSubmodel,
      });
    } else {
      setSelectedVehicle(null);
    }
  }, [selectedMake, selectedModel, selectedYear, selectedSubmodel, hasCompleteSelection]);
  
  // Check compatibility when vehicle or product changes
  useEffect(() => {
    if (selectedVehicle && productId) {
      checkCompatibility();
    } else {
      setCompatibilityResult(null);
    }
  }, [selectedVehicle, productId]);
  
  // Handle errors with callback if provided
  useEffect(() => {
    if (error && onError) {
      onError(new Error(error));
    }
  }, [error, onError]);
  
  // Check compatibility API
  const checkCompatibility = useCallback(async () => {
    if (!selectedVehicle || !productId || !shop) {
      return;
    }
    
    setLoading(true);
    setError(null);
    
    try {
      const params = new URLSearchParams({
        productId,
        yearId: selectedVehicle.year.id,
        shop,
      });
      
      if (selectedVehicle.make?.id) {
        params.append('makeId', selectedVehicle.make.id);
      }
      
      if (selectedVehicle.model?.id) {
        params.append('modelId', selectedVehicle.model.id);
      }
      
      if (selectedVehicle.submodel?.id) {
        params.append('submodelId', selectedVehicle.submodel.id);
      }
      
      const apiUrl = `/api/fitment/check?${params.toString()}`;
      const response = await fetch(apiUrl);
      
      if (!response.ok) {
        throw new Error(`Failed to check compatibility: ${response.statusText}`);
      }
      
      const data = await response.json();
      
      if (data.error) {
        throw new Error(data.error);
      }
      
      setCompatibilityResult(data);
    } catch (err) {
      console.error('Error checking compatibility:', err);
      const errorMessage = err.message || 'Failed to check compatibility';
      setError(errorMessage);
      if (onError) {
        onError(new Error(errorMessage));
      }
    } finally {
      setLoading(false);
    }
  }, [selectedVehicle, productId, shop, onError]);
  
  // Handle vehicle selection
  const handleVehicleSelect = useCallback((vehicle) => {
    setSelectedVehicle(vehicle);
    setIsModalOpen(false);
  }, []);
  
  // Format vehicle name for display
  const getVehicleDisplayName = useCallback((vehicle) => {
    if (!vehicle) return '';
    
    const parts = [
      vehicle.year?.value,
      vehicle.make?.name,
      vehicle.model?.name,
    ].filter(Boolean);
    
    if (vehicle.submodel?.name && vehicle.submodel.name !== 'All Submodels') {
      parts.push(vehicle.submodel.name);
    }
    
    return parts.join(' ');
  }, []);
  
  // Render loading state
  if (loading) {
    return (
      <Card>
        <BlockStack gap="4">
          <Box padding="4">
            <Text variant="headingMd" as="h2">{title}</Text>
          </Box>
          <Box padding="4" textAlign="center">
            <BlockStack gap="2" alignment="center">
              <Spinner size="small" />
              <Text>Checking compatibility...</Text>
            </BlockStack>
          </Box>
        </BlockStack>
      </Card>
    );
  }
  
  // Render error state
  if (error) {
    return (
      <Card>
        <BlockStack gap="4">
          <Box padding="4">
            <Text variant="headingMd" as="h2">{title}</Text>
          </Box>
          <Box padding="4">
            <Banner status="critical">
              <Text>Error checking compatibility: {error}</Text>
            </Banner>
          </Box>
        </BlockStack>
      </Card>
    );
  }
  
  // Render widget with no vehicle selected
  if (!selectedVehicle) {
    return (
      <Card>
        <BlockStack gap="4">
          <Box padding="4">
            <Text variant="headingMd" as="h2">{title}</Text>
          </Box>
          {showVehicleSelector ? (
            <Box padding="4">
              <SearchWidget 
                title="Select your vehicle" 
                buttonText="Check Compatibility"
                onSearch={handleVehicleSelect}
                shop={shop}
              />
            </Box>
          ) : (
            <Box padding="4">
              <Banner
                title="Select your vehicle to check compatibility"
                action={{
                  content: 'Select Vehicle',
                  onAction: () => setIsModalOpen(true),
                }}
              >
                <Text>Please select your vehicle to see if this product is compatible.</Text>
              </Banner>
              <Modal
                open={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                title="Select Your Vehicle"
                primaryAction={{
                  content: 'Close',
                  onAction: () => setIsModalOpen(false),
                }}
              >
                <Modal.Section>
                  <SearchWidget 
                    title="" 
                    buttonText="Check Compatibility"
                    onSearch={handleVehicleSelect}
                    shop={shop}
                  />
                </Modal.Section>
              </Modal>
            </Box>
          )}
        </BlockStack>
      </Card>
    );
  }
  
  // Render results
  const isCompatible = compatibilityResult?.isFitment === true;
  
  return (
    <Card>
      <BlockStack gap="4">
        <Box padding="4">
          <InlineStack align="space-between">
            <Text variant="headingMd" as="h2">{title}</Text>
            <Button
              variant="plain"
              onClick={clearVehicle}
              accessibilityLabel="Select a different vehicle"
            >
              Change Vehicle
            </Button>
          </InlineStack>
        </Box>
        
        <Divider />
        
        <Box padding="4">
          <BlockStack gap="4">
            <Banner
              title={`Your selected vehicle: ${getVehicleDisplayName(selectedVehicle)}`}
              tone="info"
              icon={SearchIcon}
            />
            
            {compatibilityResult && (
              <Banner
                title={isCompatible ? 'Compatible with your vehicle' : 'Not compatible with your vehicle'}
                tone={isCompatible ? 'success' : 'critical'}
                icon={isCompatible ? CheckCircleIcon : XCircleIcon}
              >
                <Text>
                  {isCompatible
                    ? 'This product is compatible with your selected vehicle.'
                    : 'This product is not compatible with your selected vehicle.'}
                </Text>
              </Banner>
            )}
            
            {!isCompatible && alternativeProducts.length > 0 && (
              <BlockStack gap="3">
                <Text variant="headingMd" as="h3">Alternative Products</Text>
                <BlockStack gap="2">
                  {alternativeProducts.map((product) => (
                    <Box key={product.id} padding="3" background="bg-surface-secondary" borderRadius="2">
                      <InlineStack gap="3">
                        {product.image && (
                          <img 
                            src={product.image.url} 
                            alt={product.title} 
                            width="50" 
                            height="50" 
                            style={{ objectFit: 'contain' }}
                          />
                        )}
                        <BlockStack gap="1">
                          <Link url={`/products/${product.handle}`} external>
                            <Text variant="headingSm" fontWeight="semibold">
                              {product.title}
                            </Text>
                          </Link>
                          {product.price && (
                            <Text>${product.price}</Text>
                          )}
                        </BlockStack>
                      </InlineStack>
                    </Box>
                  ))}
                </BlockStack>
              </BlockStack>
            )}
          </BlockStack>
        </Box>
      </BlockStack>
    </Card>
  );
} 