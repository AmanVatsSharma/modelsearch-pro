import { useState, useCallback, useEffect } from 'react';
import { Select, Spinner, InlineStack } from '@shopify/polaris';

/**
 * Component for selecting a vehicle year
 */
export default function YearSelector({ 
  years = [], 
  selectedYear = null, 
  onChange, 
  disabled = false, 
  loading = false 
}) {
  const [selected, setSelected] = useState('');

  // Update selected value when selectedYear changes
  useEffect(() => {
    if (selectedYear) {
      setSelected(selectedYear.id);
    } else {
      setSelected('');
    }
  }, [selectedYear]);

  const handleChange = useCallback((value) => {
    setSelected(value);
    onChange(value);
  }, [onChange]);

  const options = [
    { label: 'Select Year', value: '' },
    ...years
      .map(year => ({
        label: year.value.toString(),
        value: year.id
      }))
      .sort((a, b) => parseInt(b.label) - parseInt(a.label)) // Sort years in descending order
  ];

  return (
    <InlineStack gap="2" align="center" blockAlign="center">
      <div style={{ flexGrow: 1 }}>
        <Select
          label="Year"
          options={options}
          onChange={handleChange}
          value={selected}
          disabled={disabled || loading}
          placeholder={disabled ? 'Select Model first' : 'Select Year'}
        />
      </div>
      {loading && <Spinner size="small" />}
    </InlineStack>
  );
}
