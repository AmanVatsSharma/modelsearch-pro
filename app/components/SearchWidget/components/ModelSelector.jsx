import { useState, useCallback, useEffect } from 'react';
import { Select, Spinner, InlineStack } from '@shopify/polaris';

/**
 * Component for selecting a vehicle model
 */
export default function ModelSelector({ 
  models = [], 
  selectedModel = null, 
  onChange, 
  disabled = false, 
  loading = false 
}) {
  const [selected, setSelected] = useState('');

  // Update selected value when selectedModel changes
  useEffect(() => {
    if (selectedModel) {
      setSelected(selectedModel.id);
    } else {
      setSelected('');
    }
  }, [selectedModel]);

  const handleChange = useCallback((value) => {
    setSelected(value);
    onChange(value);
  }, [onChange]);

  const options = [
    { label: 'Select Model', value: '' },
    ...models.map(model => ({
      label: model.name,
      value: model.id
    }))
  ];

  return (
    <InlineStack gap="2" align="center" blockAlign="center">
      <div style={{ flexGrow: 1 }}>
        <Select
          label="Model"
          options={options}
          onChange={handleChange}
          value={selected}
          disabled={disabled || loading}
          placeholder={disabled ? 'Select Make first' : 'Select Model'}
        />
      </div>
      {loading && <Spinner size="small" />}
    </InlineStack>
  );
}
