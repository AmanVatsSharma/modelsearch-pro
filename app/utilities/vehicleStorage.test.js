import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  loadVehicleFromStorage,
  saveVehicleToStorage,
  getVehicleQueryString,
  getVehicleDisplayString
} from './vehicleStorage';

describe('vehicleStorage', () => {
  const mockVehicle = {
    make: { id: 'make1', name: 'Toyota' },
    model: { id: 'model1', name: 'Camry' },
    year: { id: 'year1', value: 2023 },
    submodel: { id: 'submodel1', name: 'LE' },
  };

  // Mock document.cookie
  let originalDocumentCookie;

  beforeEach(() => {
    // Save the original document.cookie property
    originalDocumentCookie = Object.getOwnPropertyDescriptor(document, 'cookie');

    // Mock the document.cookie property
    let cookies = '';
    Object.defineProperty(document, 'cookie', {
      get: () => cookies,
      set: (val) => {
        cookies = val;
        return cookies;
      },
      configurable: true
    });
  });

  afterEach(() => {
    // Restore the original document.cookie property
    if (originalDocumentCookie) {
      Object.defineProperty(document, 'cookie', originalDocumentCookie);
    }
  });

  describe('saveVehicleToStorage', () => {
    it('should save vehicle to cookie', () => {
      saveVehicleToStorage(mockVehicle);
      
      // Check if the cookie was set
      expect(document.cookie).toContain('fitSearchSelectedVehicle');
      expect(document.cookie).toContain(encodeURIComponent(JSON.stringify(mockVehicle)));
    });

    it('should set cookie with correct expiration', () => {
      const days = 7; // Custom number of days
      saveVehicleToStorage(mockVehicle, days);
      
      // Check that the cookie includes 'expires='
      expect(document.cookie).toContain('expires=');
    });

    it('should clear cookie when vehicle is null', () => {
      // First set the cookie
      saveVehicleToStorage(mockVehicle);
      expect(document.cookie).toContain('fitSearchSelectedVehicle');
      
      // Then clear it
      saveVehicleToStorage(null);
      
      // Cookie should still exist but with empty value and past expiration
      expect(document.cookie).toContain('fitSearchSelectedVehicle=');
      expect(document.cookie).toContain('expires=');
    });
  });

  describe('loadVehicleFromStorage', () => {
    it('should return null if no cookie exists', () => {
      const vehicle = loadVehicleFromStorage();
      expect(vehicle).toBeNull();
    });

    it('should load vehicle from cookie', () => {
      // Save vehicle to cookie
      saveVehicleToStorage(mockVehicle);
      
      // Load vehicle from cookie
      const loadedVehicle = loadVehicleFromStorage();
      
      expect(loadedVehicle).toEqual(mockVehicle);
    });

    it('should return null if JSON parsing fails', () => {
      // Set an invalid JSON string as the cookie value
      document.cookie = `fitSearchSelectedVehicle=invalid-json; path=/; SameSite=Lax`;
      
      // Attempt to load vehicle from cookie
      const vehicle = loadVehicleFromStorage();
      
      expect(vehicle).toBeNull();
    });

    it('should handle server-side rendering (no document)', () => {
      // Temporarily remove document to simulate SSR
      const originalDocument = global.document;
      delete global.document;
      
      const vehicle = loadVehicleFromStorage();
      
      // Restore document
      global.document = originalDocument;
      
      expect(vehicle).toBeNull();
    });
  });

  describe('getVehicleQueryString', () => {
    it('should return empty string for null vehicle', () => {
      const queryString = getVehicleQueryString(null);
      expect(queryString).toBe('');
    });

    it('should return empty string for vehicle without make', () => {
      const queryString = getVehicleQueryString({});
      expect(queryString).toBe('');
    });

    it('should include all vehicle parts in query string', () => {
      const queryString = getVehicleQueryString(mockVehicle);
      
      expect(queryString).toContain('makeId=make1');
      expect(queryString).toContain('modelId=model1');
      expect(queryString).toContain('yearId=year1');
      expect(queryString).toContain('submodelId=submodel1');
    });

    it('should handle missing optional fields', () => {
      const partialVehicle = {
        make: { id: 'make1', name: 'Toyota' },
        model: { id: 'model1', name: 'Camry' },
        year: { id: 'year1', value: 2023 },
      };
      
      const queryString = getVehicleQueryString(partialVehicle);
      
      expect(queryString).toContain('makeId=make1');
      expect(queryString).toContain('modelId=model1');
      expect(queryString).toContain('yearId=year1');
      expect(queryString).not.toContain('submodelId');
    });
  });

  describe('getVehicleDisplayString', () => {
    it('should return empty string for null vehicle', () => {
      const displayString = getVehicleDisplayString(null);
      expect(displayString).toBe('');
    });

    it('should return empty string for vehicle without make', () => {
      const displayString = getVehicleDisplayString({});
      expect(displayString).toBe('');
    });

    it('should include all vehicle parts in display string', () => {
      const displayString = getVehicleDisplayString(mockVehicle);
      
      expect(displayString).toBe('2023 Toyota Camry LE');
    });

    it('should handle missing optional fields', () => {
      const partialVehicle = {
        make: { id: 'make1', name: 'Toyota' },
        model: { id: 'model1', name: 'Camry' },
      };
      
      const displayString = getVehicleDisplayString(partialVehicle);
      
      expect(displayString).toBe('Toyota Camry');
    });
  });
}); 