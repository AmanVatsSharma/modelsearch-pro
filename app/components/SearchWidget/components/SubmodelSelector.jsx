import { useState, useCallback, useEffect } from 'react';
import { Select, Spinner, InlineStack, Text } from '@shopify/polaris';

/**
 * Component for selecting a vehicle submodel
 */
export default function SubmodelSelector({ 
  submodels = [], 
  selectedSubmodel = null, 
  onChange, 
  disabled = false, 
  loading = false,
  optional = true 
}) {
  const [selected, setSelected] = useState('');

  // Update selected value when selectedSubmodel changes
  useEffect(() => {
    if (selectedSubmodel) {
      setSelected(selectedSubmodel.id);
    } else {
      setSelected('');
    }
  }, [selectedSubmodel]);

  const handleChange = useCallback((value) => {
    setSelected(value);
    onChange(value);
  }, [onChange]);

  // If there are no submodels and it's optional, show a message
  if (submodels.length === 0 && !loading && !disabled && optional) {
    return null;
  }

  const options = [
    { label: optional ? 'Select Submodel (Optional)' : 'Select Submodel', value: '' },
    ...submodels.map(submodel => ({
      label: submodel.name,
      value: submodel.id
    }))
  ];

  return (
    <InlineStack gap="2" align="center" blockAlign="center">
      <div style={{ flexGrow: 1 }}>
        <Select
          label={
            <InlineStack gap="1" align="center">
              <span>Submodel</span>
              {optional && <Text variant="bodyMd" color="subdued">(Optional)</Text>}
            </InlineStack>
          }
          options={options}
          onChange={handleChange}
          value={selected}
          disabled={disabled || loading}
          placeholder={disabled ? 'Select Year first' : 'Select Submodel'}
        />
      </div>
      {loading && <Spinner size="small" />}
    </InlineStack>
  );
}
