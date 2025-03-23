import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useVehicleSelection } from './useVehicleSelection';
import { VehicleProvider } from '~/components/SearchWidget/VehicleContext';
import * as appProxyHelpers from '~/utilities/appProxyHelpers';

// Mock the window location
const mockWindowLocation = (url) => {
  delete window.location;
  window.location = new URL(url);
};

// Mock fetch
global.fetch = vi.fn();

// Mock app proxy helpers
vi.mock('~/utilities/appProxyHelpers', async () => {
  const actual = await vi.importActual('~/utilities/appProxyHelpers');
  return {
    ...actual,
    extractShopDomain: vi.fn().mockReturnValue('test-shop.myshopify.com'),
    getAppProxyUrl: vi.fn((path, shop) => {
      return shop ? `https://${shop}/apps/vehicle-search-widget${path}` : path;
    })
  };
});

// Mock the VehicleContext
vi.mock('~/components/SearchWidget/VehicleContext', () => {
  const mockVehicleContext = {
    selectedMake: null,
    selectedModel: null,
    selectedYear: null,
    selectedSubmodel: null,
    selectMake: vi.fn(),
    selectModel: vi.fn(),
    selectYear: vi.fn(),
    selectSubmodel: vi.fn(),
    makes: [],
    models: [],
    years: [],
    submodels: [],
    setMakes: vi.fn(),
    setModels: vi.fn(),
    setYears: vi.fn(),
    setSubmodels: vi.fn(),
    loading: false,
    setLoading: vi.fn(),
    error: null,
    setError: vi.fn(),
    clearSelection: vi.fn(),
    hasCompleteSelection: vi.fn().mockReturnValue(false),
  };

  return {
    useVehicle: vi.fn().mockReturnValue(mockVehicleContext),
    VehicleProvider: ({ children }) => children,
  };
});

describe('useVehicleSelection', () => {
  const mockMakes = [
    { id: 'make1', name: 'Toyota' },
    { id: 'make2', name: 'Honda' }
  ];
  
  const mockModels = [
    { id: 'model1', name: 'Camry', makeId: 'make1' },
    { id: 'model2', name: 'Corolla', makeId: 'make1' }
  ];
  
  const mockYears = [
    { id: 'year1', value: 2023, modelId: 'model1' },
    { id: 'year2', value: 2022, modelId: 'model1' }
  ];
  
  const mockSubmodels = [
    { id: 'submodel1', name: 'LE', yearId: 'year1' },
    { id: 'submodel2', name: 'XLE', yearId: 'year1' }
  ];

  beforeEach(() => {
    mockWindowLocation('https://test-shop.myshopify.com/apps/vehicle-search-widget');
    
    // Reset mocks
    vi.clearAllMocks();
    
    // Setup successful fetch mock
    global.fetch.mockImplementation(async (url) => {
      if (url.includes('/api/vehicle/makes')) {
        return {
          ok: true,
          json: () => Promise.resolve({ makes: mockMakes })
        };
      } else if (url.includes('/api/vehicle/models')) {
        return {
          ok: true,
          json: () => Promise.resolve({ models: mockModels })
        };
      } else if (url.includes('/api/vehicle/years')) {
        return {
          ok: true,
          json: () => Promise.resolve({ years: mockYears })
        };
      } else if (url.includes('/api/vehicle/submodels')) {
        return {
          ok: true,
          json: () => Promise.resolve({ submodels: mockSubmodels })
        };
      }
      return {
        ok: false,
        json: () => Promise.resolve({ error: 'Not found' })
      };
    });
  });

  afterEach(() => {
    delete window.location;
  });

  it('should fetch makes on initial load', async () => {
    const { result } = renderHook(() => useVehicleSelection(), {
      wrapper: VehicleProvider
    });

    // Wait for makes to be fetched
    await vi.waitFor(() => {
      expect(global.fetch).toHaveBeenCalledTimes(1);
    });

    // Verify correct URL is constructed
    expect(appProxyHelpers.getAppProxyUrl).toHaveBeenCalledWith('/api/vehicle/makes', 'test-shop.myshopify.com');
  });

  it('should fetch models when a make is selected', async () => {
    // Mock selected make
    vi.mocked(useVehicle().selectedMake).mockReturnValue({ id: 'make1', name: 'Toyota' });
    
    const { result } = renderHook(() => useVehicleSelection(), {
      wrapper: VehicleProvider
    });

    // Wait for both makes and models to be fetched
    await vi.waitFor(() => {
      expect(global.fetch).toHaveBeenCalledTimes(2);
    });

    // Verify the models URL is correct
    const calls = global.fetch.mock.calls.map(call => call[0]);
    expect(calls[1]).toContain('makeId=make1');
  });

  it('should handle API errors gracefully', async () => {
    // Mock fetch to return an error
    global.fetch.mockImplementationOnce(() => {
      return {
        ok: false,
        status: 500,
        statusText: 'Internal Server Error',
        json: () => Promise.resolve({ error: 'Server error' })
      };
    });

    const { result } = renderHook(() => useVehicleSelection(), {
      wrapper: VehicleProvider
    });

    // Wait for fetch to complete
    await vi.waitFor(() => {
      expect(global.fetch).toHaveBeenCalledTimes(1);
    });
    
    // Verify error is set
    expect(useVehicle().setError).toHaveBeenCalled();
  });

  it('should retry failed requests with exponential backoff', async () => {
    vi.useFakeTimers();
    
    // Make the first two requests fail, then succeed
    global.fetch
      .mockImplementationOnce(() => {
        return {
          ok: false,
          status: 500,
          statusText: 'Server Error',
          json: () => Promise.resolve({ error: 'Server error' })
        };
      })
      .mockImplementationOnce(() => {
        return {
          ok: false,
          status: 500,
          statusText: 'Server Error',
          json: () => Promise.resolve({ error: 'Server error' })
        };
      })
      .mockImplementationOnce(() => {
        return {
          ok: true,
          json: () => Promise.resolve({ makes: mockMakes })
        };
      });
    
    const { result } = renderHook(() => useVehicleSelection(), {
      wrapper: VehicleProvider
    });
    
    // First attempt
    await vi.advanceTimersByTimeAsync(100);
    
    // Wait for backoff delay (500ms)
    await vi.advanceTimersByTimeAsync(500);
    
    // Second attempt
    await vi.advanceTimersByTimeAsync(100);
    
    // Wait for backoff delay (1000ms - doubled from first attempt)
    await vi.advanceTimersByTimeAsync(1000);
    
    // Third attempt (successful)
    await vi.advanceTimersByTimeAsync(100);
    
    // Verify fetch was called 3 times
    expect(global.fetch).toHaveBeenCalledTimes(3);
    
    vi.useRealTimers();
  });

  it('should handle selection changes correctly', async () => {
    const mockUseVehicle = vi.mocked(useVehicle);
    
    // Mock the initial state
    mockUseVehicle.mockReturnValue({
      ...mockUseVehicle(),
      makes: mockMakes,
      models: mockModels,
      years: mockYears,
      submodels: mockSubmodels,
    });
    
    const { result } = renderHook(() => useVehicleSelection(), {
      wrapper: VehicleProvider
    });
    
    // Test make selection
    act(() => {
      result.current.handleMakeChange('make1');
    });
    
    expect(mockUseVehicle().selectMake).toHaveBeenCalledWith(mockMakes[0]);
    
    // Test model selection
    act(() => {
      result.current.handleModelChange('model1');
    });
    
    expect(mockUseVehicle().selectModel).toHaveBeenCalledWith(mockModels[0]);
    
    // Test year selection
    act(() => {
      result.current.handleYearChange('year1');
    });
    
    expect(mockUseVehicle().selectYear).toHaveBeenCalledWith(mockYears[0]);
    
    // Test submodel selection
    act(() => {
      result.current.handleSubmodelChange('submodel1');
    });
    
    expect(mockUseVehicle().selectSubmodel).toHaveBeenCalledWith(mockSubmodels[0]);
  });
}); 