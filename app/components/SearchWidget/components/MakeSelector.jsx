import { useState, useCallback, useEffect } from 'react';
import { Select, Spinner, InlineStack } from '@shopify/polaris';

/**
 * Component for selecting a vehicle make
 */
export default function MakeSelector({ 
  makes = [], 
  selectedMake = null, 
  onChange, 
  loading = false 
}) {
  const [selected, setSelected] = useState('');

  // Update selected value when selectedMake changes
  useEffect(() => {
    if (selectedMake) {
      setSelected(selectedMake.id);
    } else {
      setSelected('');
    }
  }, [selectedMake]);

  const handleChange = useCallback((value) => {
    setSelected(value);
    onChange(value);
  }, [onChange]);

  const options = [
    { label: 'Select Make', value: '' },
    ...makes.map(make => ({
      label: make.name,
      value: make.id
    }))
  ];

  return (
    <InlineStack gap="2" align="center" blockAlign="center">
      <div style={{ flexGrow: 1 }}>
        <Select
          label="Make"
          options={options}
          onChange={handleChange}
          value={selected}
          disabled={loading}
        />
      </div>
      {loading && <Spinner size="small" />}
    </InlineStack>
  );
}
