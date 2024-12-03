import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, act } from '@testing-library/react';
import { renderHook } from '@testing-library/react';
import { VehicleProvider, useVehicle } from './VehicleContext';
import * as vehicleStorage from '~/utilities/vehicleStorage';

// Mock the vehicleStorage utilities
vi.mock('~/utilities/vehicleStorage', () => ({
  loadVehicleFromStorage: vi.fn(),
  saveVehicleToStorage: vi.fn(),
}));

describe('VehicleContext', () => {
  const mockVehicle = {
    make: { id: 'make1', name: 'Toyota' },
    model: { id: 'model1', name: 'Camry', makeId: 'make1' },
    year: { id: 'year1', value: 2023, modelId: 'model1' },
    submodel: { id: 'submodel1', name: 'LE', yearId: 'year1' },
  };

  beforeEach(() => {
    vi.clearAllMocks();
    vehicleStorage.loadVehicleFromStorage.mockReturnValue(null);
  });

  describe('VehicleProvider', () => {
    it('should render its children', () => {
      const { getByText } = render(
        <VehicleProvider>
          <div>Test Child</div>
        </VehicleProvider>
      );
      expect(getByText('Test Child')).toBeInTheDocument();
    });

    it('should load saved vehicle on initial render', () => {
      vehicleStorage.loadVehicleFromStorage.mockReturnValue(mockVehicle);
      
      const wrapper = ({ children }) => <VehicleProvider>{children}</VehicleProvider>;
      const { result } = renderHook(() => useVehicle(), { wrapper });
      
      expect(result.current.selectedMake).toEqual(mockVehicle.make);
      expect(result.current.selectedModel).toEqual(mockVehicle.model);
      expect(result.current.selectedYear).toEqual(mockVehicle.year);
      expect(result.current.selectedSubmodel).toEqual(mockVehicle.submodel);
    });
  });

  describe('useVehicle', () => {
    it('should throw error if used outside of VehicleProvider', () => {
      const consoleError = console.error;
      console.error = vi.fn(); // Suppress console.error for this test
      
      expect(() => renderHook(() => useVehicle())).toThrow('useVehicle must be used within a VehicleProvider');
      
      console.error = consoleError; // Restore console.error
    });
    
    it('should provide vehicle selection functions', () => {
      const wrapper = ({ children }) => <VehicleProvider>{children}</VehicleProvider>;
      const { result } = renderHook(() => useVehicle(), { wrapper });
      
      expect(result.current).toHaveProperty('setSelectedMake');
      expect(result.current).toHaveProperty('setSelectedModel');
      expect(result.current).toHaveProperty('setSelectedYear');
      expect(result.current).toHaveProperty('setSelectedSubmodel');
      expect(result.current).toHaveProperty('clearVehicle');
    });
    
    it('should reset dependent fields when make is changed', () => {
      const wrapper = ({ children }) => <VehicleProvider initialVehicle={mockVehicle}>{children}</VehicleProvider>;
      const { result } = renderHook(() => useVehicle(), { wrapper });
      
      expect(result.current.selectedMake).toEqual(mockVehicle.make);
      expect(result.current.selectedModel).toEqual(mockVehicle.model);
      
      act(() => {
        result.current.setSelectedMake({ id: 'make2', name: 'Honda' });
      });
      
      expect(result.current.selectedMake).toEqual({ id: 'make2', name: 'Honda' });
      expect(result.current.selectedModel).toBeNull();
      expect(result.current.selectedYear).toBeNull();
      expect(result.current.selectedSubmodel).toBeNull();
    });
    
    it('should reset dependent fields when model is changed', () => {
      const wrapper = ({ children }) => <VehicleProvider initialVehicle={mockVehicle}>{children}</VehicleProvider>;
      const { result } = renderHook(() => useVehicle(), { wrapper });
      
      expect(result.current.selectedModel).toEqual(mockVehicle.model);
      expect(result.current.selectedYear).toEqual(mockVehicle.year);
      
      act(() => {
        result.current.setSelectedModel({ id: 'model2', name: 'Accord', makeId: 'make1' });
      });
      
      expect(result.current.selectedModel).toEqual({ id: 'model2', name: 'Accord', makeId: 'make1' });
      expect(result.current.selectedYear).toBeNull();
      expect(result.current.selectedSubmodel).toBeNull();
    });
    
    it('should reset submodel when year is changed', () => {
      const wrapper = ({ children }) => <VehicleProvider initialVehicle={mockVehicle}>{children}</VehicleProvider>;
      const { result } = renderHook(() => useVehicle(), { wrapper });
      
      expect(result.current.selectedYear).toEqual(mockVehicle.year);
      expect(result.current.selectedSubmodel).toEqual(mockVehicle.submodel);
      
      act(() => {
        result.current.setSelectedYear({ id: 'year2', value: 2022, modelId: 'model1' });
      });
      
      expect(result.current.selectedYear).toEqual({ id: 'year2', value: 2022, modelId: 'model1' });
      expect(result.current.selectedSubmodel).toBeNull();
    });
    
    it('should clear all selections', () => {
      const wrapper = ({ children }) => <VehicleProvider initialVehicle={mockVehicle}>{children}</VehicleProvider>;
      const { result } = renderHook(() => useVehicle(), { wrapper });
      
      expect(result.current.selectedMake).toEqual(mockVehicle.make);
      
      act(() => {
        result.current.clearVehicle();
      });
      
      expect(result.current.selectedMake).toBeNull();
      expect(result.current.selectedModel).toBeNull();
      expect(result.current.selectedYear).toBeNull();
      expect(result.current.selectedSubmodel).toBeNull();
      expect(vehicleStorage.saveVehicleToStorage).toHaveBeenCalledWith(null);
    });
    
    it('should determine if selection is complete', () => {
      const wrapper = ({ children }) => <VehicleProvider>{children}</VehicleProvider>;
      const { result } = renderHook(() => useVehicle(), { wrapper });
      
      expect(result.current.hasCompleteSelection).toBe(false);
      
      act(() => {
        result.current.setSelectedMake(mockVehicle.make);
        result.current.setSelectedModel(mockVehicle.model);
        result.current.setSelectedYear(mockVehicle.year);
      });
      
      expect(result.current.hasCompleteSelection).toBe(true);
      
      act(() => {
        result.current.setSelectedYear(null);
      });
      
      expect(result.current.hasCompleteSelection).toBe(false);
    });
  });
}); 