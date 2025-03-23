import { createContext, useContext, useState, useEffect } from "react";
import { loadVehicleFromStorage, saveVehicleToStorage } from "~/utilities/vehicleStorage";

// Create the context
const VehicleContext = createContext(null);

/**
 * Provider component for vehicle selection state
 */
export function VehicleProvider({ children, initialVehicle = null }) {
  // State for vehicle selection
  const [selectedMake, setSelectedMake] = useState(initialVehicle?.make || null);
  const [selectedModel, setSelectedModel] = useState(initialVehicle?.model || null);
  const [selectedYear, setSelectedYear] = useState(initialVehicle?.year || null);
  const [selectedSubmodel, setSelectedSubmodel] = useState(initialVehicle?.submodel || null);
  
  // State for data loading
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  
  // State for available options
  const [makes, setMakes] = useState([]);
  const [models, setModels] = useState([]);
  const [years, setYears] = useState([]);
  const [submodels, setSubmodels] = useState([]);

  // Load saved vehicle on initial render
  useEffect(() => {
    const savedVehicle = loadVehicleFromStorage();
    if (savedVehicle) {
      setSelectedMake(savedVehicle.make);
      setSelectedModel(savedVehicle.model);
      setSelectedYear(savedVehicle.year);
      setSelectedSubmodel(savedVehicle.submodel);
    }
  }, []);

  // Save vehicle selection to storage when it changes
  useEffect(() => {
    if (selectedMake) {
      saveVehicleToStorage({
        make: selectedMake,
        model: selectedModel,
        year: selectedYear,
        submodel: selectedSubmodel,
      });
    }
  }, [selectedMake, selectedModel, selectedYear, selectedSubmodel]);

  // Reset dependent fields when a selection changes
  const handleMakeChange = (make) => {
    setSelectedMake(make);
    setSelectedModel(null);
    setSelectedYear(null);
    setSelectedSubmodel(null);
  };

  const handleModelChange = (model) => {
    setSelectedModel(model);
    setSelectedYear(null);
    setSelectedSubmodel(null);
  };

  const handleYearChange = (year) => {
    setSelectedYear(year);
    setSelectedSubmodel(null);
  };

  // Clear all selections
  const clearVehicle = () => {
    setSelectedMake(null);
    setSelectedModel(null);
    setSelectedYear(null);
    setSelectedSubmodel(null);
    saveVehicleToStorage(null);
  };

  // Helper to check if a complete vehicle selection is made
  const hasCompleteSelection = () => {
    return Boolean(selectedMake && selectedModel && selectedYear);
  };

  // Context value
  const value = {
    // Selected values
    selectedMake,
    selectedModel,
    selectedYear,
    selectedSubmodel,
    
    // Setter functions with cascade reset
    setSelectedMake: handleMakeChange,
    setSelectedModel: handleModelChange,
    setSelectedYear: handleYearChange,
    setSelectedSubmodel,
    clearVehicle,
    
    // Available options
    makes,
    models,
    years,
    submodels,
    setMakes,
    setModels,
    setYears,
    setSubmodels,
    
    // Loading state
    loading,
    setLoading,
    error,
    setError,
    
    // Helper functions
    hasCompleteSelection,
  };

  return <VehicleContext.Provider value={value}>{children}</VehicleContext.Provider>;
}

// Custom hook to use the vehicle context
export function useVehicle() {
  const context = useContext(VehicleContext);
  if (context === null) {
    throw new Error("useVehicle must be used within a VehicleProvider");
  }
  return context;
}

export default VehicleContext;
