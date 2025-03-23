import {
  Card,
  DataTable,
  Filters,
  Text,
  Pagination,
  Spinner,
  EmptyState,
  Banner,
  BlockStack,
  InlineStack,
  Box,
  Button,
  TextField,
  ButtonGroup,
} from '@shopify/polaris';
import styles from './FitmentTable.module.css';

/**
 * FitmentTable component to display vehicle compatibility for a product
 * @param {Object} props Component props
 * @param {Array} props.fitments Array of fitment data
 * @param {string} props.productId Product ID to fetch fitments for
 * @param {string} props.shop The shop domain for API calls
 * @param {function} props.onFitmentClick Optional callback when a fitment row is clicked
 * @param {boolean} props.loading Whether the component is in loading state
 * @param {string} props.error Error message to display
 * @param {function} props.onError Callback for error handling
 */
export default function FitmentTable({
  fitments = null,
  productId = null,
  shop = null,
  onFitmentClick = null,
  loading: externalLoading = false,
  error: externalError = null,
  onError = null,
}) {
  // Component state
  const [loading, setLoading] = useState(externalLoading || !fitments);
  const [error, setError] = useState(externalError);
  const [tableData, setTableData] = useState([]);
  const [filteredData, setFilteredData] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [sortedField, setSortedField] = useState('make');
  const [sortDirection, setSortDirection] = useState('asc');
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  
  // If fitments are passed directly, use those instead of fetching
  useEffect(() => {
    if (fitments) {
      processTableData(fitments);
      setLoading(false);
    } else if (productId && shop) {
      fetchFitments();
    }
  }, [fitments, productId, shop]);
  
  // Update loading state from props
  useEffect(() => {
    setLoading(externalLoading);
  }, [externalLoading]);
  
  // Update error state from props
  useEffect(() => {
    setError(externalError);
  }, [externalError]);
  
  // Handle errors with callback if provided
  useEffect(() => {
    if (error && onError) {
      onError(new Error(error));
    }
  }, [error, onError]);
  
  // Fetch fitments from API
  const fetchFitments = useCallback(async () => {
    setLoading(true);
    setError(null);
    
    try {
      const apiUrl = `/api/products/${productId}/fitments?shop=${encodeURIComponent(shop)}`;
      const response = await fetch(apiUrl);
      
      if (!response.ok) {
        throw new Error(`Failed to fetch fitments: ${response.statusText}`);
      }
      
      const data = await response.json();
      
      if (data.error) {
        throw new Error(data.error);
      }
      
      processTableData(data.fitments);
    } catch (err) {
      console.error('Error fetching fitments:', err);
      const errorMessage = err.message || 'Failed to load fitment data';
      setError(errorMessage);
      if (onError) {
        onError(new Error(errorMessage));
      }
    } finally {
      setLoading(false);
    }
  }, [productId, shop, onError]);
  
  // ... existing code ...
} 