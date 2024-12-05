import { Button } from '@shopify/polaris';

/**
 * Component for the search button
 */
export default function SearchButton({ 
  onClick, 
  disabled = false, 
  loading = false,
  buttonText = 'Find Parts' 
}) {
  return (
    <Button
      primary
      fullWidth
      onClick={onClick}
      disabled={disabled}
      loading={loading}
    >
      {buttonText}
    </Button>
  );
}
