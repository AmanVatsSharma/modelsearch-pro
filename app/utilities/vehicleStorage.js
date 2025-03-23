// Remove dependency on app-bridge-utils and use native cookie handling
const VEHICLE_STORAGE_KEY = 'fitSearchSelectedVehicle';
const DEFAULT_EXPIRY_DAYS = 30;

/**
 * Get a cookie value by name
 * @param {string} name The cookie name
 * @returns {string|null} The cookie value or null if not found
 */
function getCookie(name) {
  const cookies = document.cookie.split(';');
  for (let i = 0; i < cookies.length; i++) {
    const cookie = cookies[i].trim();
    // Does this cookie string begin with the name we want?
    if (cookie.indexOf(name + '=') === 0) {
      return decodeURIComponent(cookie.substring(name.length + 1));
    }
  }
  return null;
}

/**
 * Set a cookie with the given name, value and expiration
 * @param {string} name The cookie name
 * @param {string} value The cookie value
 * @param {Object} options Cookie options
 * @param {Date} options.expires Expiration date
 */
function setCookie(name, value, options = {}) {
  let cookie = `${encodeURIComponent(name)}=${encodeURIComponent(value)}`;
  
  if (options.expires) {
    cookie += `; expires=${options.expires.toUTCString()}`;
  }
  
  cookie += '; path=/; SameSite=Lax';
  
  document.cookie = cookie;
}

/**
 * Loads the saved vehicle from storage (cookies)
 * @returns {Object|null} The saved vehicle or null if not found
 */
export function loadVehicleFromStorage() {
  try {
    // Only run in browser environment
    if (typeof document === 'undefined') return null;
    
    const storedValue = getCookie(VEHICLE_STORAGE_KEY);
    if (!storedValue) return null;
    return JSON.parse(storedValue);
  } catch (error) {
    console.error('Error loading vehicle from storage:', error);
    return null;
  }
}

/**
 * Saves the vehicle to storage (cookies)
 * @param {Object|null} vehicle The vehicle to save or null to clear
 * @param {number} expiryDays Number of days until the cookie expires
 */
export function saveVehicleToStorage(vehicle, expiryDays = DEFAULT_EXPIRY_DAYS) {
  try {
    // Only run in browser environment
    if (typeof document === 'undefined') return;
    
    if (vehicle) {
      const expiryDate = new Date();
      expiryDate.setDate(expiryDate.getDate() + expiryDays);
      setCookie(VEHICLE_STORAGE_KEY, JSON.stringify(vehicle), { expires: expiryDate });
    } else {
      // Clear the cookie by setting an expired date
      const expiredDate = new Date();
      expiredDate.setDate(expiredDate.getDate() - 1);
      setCookie(VEHICLE_STORAGE_KEY, '', { expires: expiredDate });
    }
  } catch (error) {
    console.error('Error saving vehicle to storage:', error);
  }
}

/**
 * Gets vehicle selection as a querystring
 * @param {Object} vehicle The vehicle object
 * @returns {string} A querystring representation of the vehicle
 */
export function getVehicleQueryString(vehicle) {
  if (!vehicle || !vehicle.make) return '';
  
  const params = new URLSearchParams();
  if (vehicle.make?.id) params.append('makeId', vehicle.make.id);
  if (vehicle.model?.id) params.append('modelId', vehicle.model.id);
  if (vehicle.year?.id) params.append('yearId', vehicle.year.id);
  if (vehicle.submodel?.id) params.append('submodelId', vehicle.submodel.id);
  
  return params.toString();
}

/**
 * Gets a formatted string representation of the vehicle
 * @param {Object} vehicle The vehicle object
 * @returns {string} A formatted string (e.g., "2023 Toyota Camry SE")
 */
export function getVehicleDisplayString(vehicle) {
  if (!vehicle || !vehicle.make) return '';
  
  const parts = [];
  if (vehicle.year?.value) parts.push(vehicle.year.value);
  if (vehicle.make?.name) parts.push(vehicle.make.name);
  if (vehicle.model?.name) parts.push(vehicle.model.name);
  if (vehicle.submodel?.name) parts.push(vehicle.submodel.name);
  
  return parts.join(' ');
}
