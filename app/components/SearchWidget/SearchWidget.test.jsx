import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import SearchWidget from './SearchWidget';
import { useVehicleSelection } from '~/hooks/useVehicleSelection';
import { getVehicleDisplayString } from '~/utilities/vehicleStorage';

// Mock the hooks and utilities
vi.mock('~/hooks/useVehicleSelection');
vi.mock('~/utilities/vehicleStorage', () => ({
  getVehicleDisplayString: vi.fn().mockReturnValue(''),
}));

// Mock subcomponents
vi.mock('./components/MakeSelector', () => ({
  default: ({ makes, selectedMake, onChange, loading }) => (
    <div data-testid="make-selector">
      <select 
        data-testid="make-select" 
        value={selectedMake?.id || ''}
        onChange={(e) => onChange(e.target.value)}
        disabled={loading}
      >
        <option value="">Select Make</option>
        {makes.map(make => (
          <option key={make.id} value={make.id}>{make.name}</option>
        ))}
      </select>
    </div>
  ),
}));

vi.mock('./components/ModelSelector', () => ({
  default: ({ models, selectedModel, onChange, disabled, loading }) => (
    <div data-testid="model-selector">
      <select 
        data-testid="model-select" 
        value={selectedModel?.id || ''}
        onChange={(e) => onChange(e.target.value)}
        disabled={disabled || loading}
      >
        <option value="">Select Model</option>
        {models.map(model => (
          <option key={model.id} value={model.id}>{model.name}</option>
        ))}
      </select>
    </div>
  ),
}));

vi.mock('./components/YearSelector', () => ({
  default: ({ years, selectedYear, onChange, disabled, loading }) => (
    <div data-testid="year-selector">
      <select 
        data-testid="year-select" 
        value={selectedYear?.id || ''}
        onChange={(e) => onChange(e.target.value)}
        disabled={disabled || loading}
      >
        <option value="">Select Year</option>
        {years.map(year => (
          <option key={year.id} value={year.id}>{year.value}</option>
        ))}
      </select>
    </div>
  ),
}));

vi.mock('./components/SubmodelSelector', () => ({
  default: ({ submodels, selectedSubmodel, onChange, disabled, loading }) => (
    <div data-testid="submodel-selector">
      <select 
        data-testid="submodel-select" 
        value={selectedSubmodel?.id || ''}
        onChange={(e) => onChange(e.target.value)}
        disabled={disabled || loading}
      >
        <option value="">Select Submodel (Optional)</option>
        {submodels.map(submodel => (
          <option key={submodel.id} value={submodel.id}>{submodel.name}</option>
        ))}
      </select>
    </div>
  ),
}));

vi.mock('./components/SearchButton', () => ({
  default: ({ onClick, disabled, loading, buttonText }) => (
    <button 
      data-testid="search-button"
      onClick={onClick}
      disabled={disabled || loading}
    >
      {buttonText}
    </button>
  ),
}));

describe('SearchWidget', () => {
  const mockHookReturnValue = {
    selectedMake: null,
    selectedModel: null,
    selectedYear: null,
    selectedSubmodel: null,
    makes: [],
    models: [],
    years: [],
    submodels: [],
    handleMakeChange: vi.fn(),
    handleModelChange: vi.fn(),
    handleYearChange: vi.fn(),
    handleSubmodelChange: vi.fn(),
    clearVehicle: vi.fn(),
    loading: false,
    error: '',
    hasCompleteSelection: false,
    setShop: vi.fn(),
    fetchMakes: vi.fn().mockResolvedValue([]),
    fetchModels: vi.fn().mockResolvedValue([]),
    fetchYears: vi.fn().mockResolvedValue([]),
    fetchSubmodels: vi.fn().mockResolvedValue([]),
  };

  beforeEach(() => {
    vi.clearAllMocks();
    useVehicleSelection.mockReturnValue(mockHookReturnValue);
    getVehicleDisplayString.mockReturnValue('');
  });

  it('should render with default props', () => {
    render(<SearchWidget />);
    
    expect(screen.getByText('Find parts for your vehicle')).toBeInTheDocument();
    expect(screen.getByTestId('make-selector')).toBeInTheDocument();
    expect(screen.getByTestId('model-selector')).toBeInTheDocument();
    expect(screen.getByTestId('year-selector')).toBeInTheDocument();
    expect(screen.getByTestId('submodel-selector')).toBeInTheDocument();
    expect(screen.getByTestId('search-button')).toBeInTheDocument();
  });

  it('should render with custom title and button text', () => {
    render(
      <SearchWidget 
        title="Custom Title" 
        buttonText="Custom Button" 
      />
    );
    
    expect(screen.getByText('Custom Title')).toBeInTheDocument();
    expect(screen.getByTestId('search-button')).toHaveTextContent('Custom Button');
  });

  it('should show loading state', () => {
    useVehicleSelection.mockReturnValue({
      ...mockHookReturnValue,
      loading: true,
    });
    
    render(<SearchWidget />);
    
    expect(screen.getByTestId('search-button')).toBeDisabled();
  });

  it('should show error message', () => {
    useVehicleSelection.mockReturnValue({
      ...mockHookReturnValue,
      error: 'Error message',
    });
    
    render(<SearchWidget />);
    
    expect(screen.getByText('Error message')).toBeInTheDocument();
  });

  it('should show reset button when vehicle is selected', async () => {
    useVehicleSelection.mockReturnValue({
      ...mockHookReturnValue,
      hasCompleteSelection: true,
    });
    
    render(<SearchWidget showResetButton={true} />);
    
    const resetButton = screen.getByRole('button', { name: /reset/i });
    expect(resetButton).toBeInTheDocument();
    
    fireEvent.click(resetButton);
    
    expect(mockHookReturnValue.clearVehicle).toHaveBeenCalled();
  });

  it('should enable the search button when selection is complete', () => {
    useVehicleSelection.mockReturnValue({
      ...mockHookReturnValue,
      hasCompleteSelection: true,
    });
    
    render(<SearchWidget />);
    
    const searchButton = screen.getByTestId('search-button');
    expect(searchButton).not.toBeDisabled();
  });

  it('should show additional help text for authentication errors', () => {
    useVehicleSelection.mockReturnValue({
      ...mockHookReturnValue,
      error: 'Authentication failed. Please try again.',
    });
    
    render(<SearchWidget />);
    
    expect(screen.getByText('Authentication failed. Please try again.')).toBeInTheDocument();
    expect(screen.getByText("Please ensure you're accessing this page through your Shopify store.")).toBeInTheDocument();
  });
}); 