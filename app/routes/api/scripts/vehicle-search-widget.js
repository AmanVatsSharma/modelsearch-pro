import { json } from "@remix-run/node";
import { authenticate } from "~/shopify.server";

/**
 * API Route to serve the client-side JavaScript bundle for the Vehicle Search Widget
 * 
 * This will be used by the theme app extension to load our React widget
 */
export async function loader({ request }) {
  // Set appropriate headers for JavaScript
  const headers = {
    "Content-Type": "application/javascript",
    "Cache-Control": "public, max-age=3600", // Cache for 1 hour
    "Access-Control-Allow-Origin": "*", // Allow cross-origin requests
  };

  try {
    // Try multiple authentication methods - this allows the endpoint to be accessed
    // both from the app proxy and directly
    try {
      // First try app proxy authentication
      await authenticate.public.appProxy(request);
      console.log("Script loaded via app proxy authentication");
    } catch (appProxyError) {
      try {
        // If app proxy auth fails, try session auth
        await authenticate.public(request);
        console.log("Script loaded via public authentication");
      } catch (publicError) {
        // If both auth methods fail, just proceed anyway
        // This is necessary because the script might be loaded directly from the theme
        console.warn("Authentication failed, but continuing anyway:", publicError.message);
      }
    }

    // This is where we'd normally serve a bundled JS file
    // For now, we'll generate it on the fly
    const widgetScript = `
      // Vehicle Search Widget Runtime
      (function() {
        console.log('[Vehicle Search Widget] Initializing...');
        
        // Polyfills and helpers
        function ready(fn) {
          if (document.readyState !== 'loading') {
            fn();
          } else {
            document.addEventListener('DOMContentLoaded', fn);
          }
        }

        // Main widget initialization
        ready(function() {
          console.log('[Vehicle Search Widget] DOM ready, searching for containers...');
          console.log('[Vehicle Search Widget] Current page URL:', window.location.href);
          console.log('[Vehicle Search Widget] Document structure:', document.documentElement.innerHTML.substring(0, 500) + '...');
          
          const containers = document.querySelectorAll('.vehicle-search-widget-container');
          console.log('[Vehicle Search Widget] Found ' + containers.length + ' containers with class .vehicle-search-widget-container');
          
          // Also look for the parent container as fallback
          const parentContainers = document.querySelectorAll('.vehicle-search-widget');
          console.log('[Vehicle Search Widget] Found ' + parentContainers.length + ' containers with class .vehicle-search-widget');
          
          // Try to use containers, or fall back to creating them in parent containers
          if (containers.length > 0) {
            console.log('[Vehicle Search Widget] Using existing containers');
            containers.forEach(function(container) {
              initializeWidget(container);
            });
          } else if (parentContainers.length > 0) {
            console.log('[Vehicle Search Widget] No existing containers found, creating them in parent elements');
            parentContainers.forEach(function(parentContainer) {
              // Create the container if it doesn't exist
              let container = parentContainer.querySelector('.vehicle-search-widget-container');
              if (!container) {
                console.log('[Vehicle Search Widget] Creating container in parent');
                container = document.createElement('div');
                container.className = 'vehicle-search-widget-container';
                
                // Create form element
                const form = document.createElement('div');
                form.className = 'vehicle-search-widget-form';
                container.appendChild(form);
                
                // Copy data attributes from parent
                if (parentContainer.dataset) {
                  Object.keys(parentContainer.dataset).forEach(key => {
                    container.dataset[key] = parentContainer.dataset[key];
                  });
                }
                
                parentContainer.appendChild(container);
              }
              
              initializeWidget(container);
            });
          } else {
            console.error('[Vehicle Search Widget] No containers found on page, widget cannot be initialized');
          }
        });

        // Initialize widget in a container
        function initializeWidget(container) {
          // Get settings from data attributes
          const settings = {
            title: container.dataset.title || 'Find parts for your vehicle',
            buttonText: container.dataset.buttonText || 'Find Parts',
            theme: container.dataset.theme || 'light',
            showReset: container.dataset.showReset === 'true',
            rememberVehicle: container.dataset.rememberVehicle === 'true',
            rememberDays: parseInt(container.dataset.rememberDays || '30', 10),
            apiBaseUrl: container.dataset.apiBaseUrl || ''
          };
          
          console.log('[Vehicle Search Widget] Initializing with settings:', settings);

          // Clear loading placeholder
          container.querySelector('.vehicle-search-widget-form').innerHTML = '';
          
          // Create form content
          createWidgetForm(container, settings);
        }

        // Create the widget form with all dropdowns
        function createWidgetForm(container, settings) {
          const formContainer = container.querySelector('.vehicle-search-widget-form');
          
          // Create form element
          const form = document.createElement('form');
          form.className = 'vehicle-search-widget-form-inner';
          form.addEventListener('submit', function(e) {
            e.preventDefault();
            handleSearch(container, settings);
          });
          
          // Create make dropdown
          const makeGroup = createFormGroup('make', 'Make', 'Select Make');
          form.appendChild(makeGroup.group);
          
          // Create model dropdown (disabled initially)
          const modelGroup = createFormGroup('model', 'Model', 'Select Model', true);
          form.appendChild(modelGroup.group);
          
          // Create year dropdown (disabled initially)
          const yearGroup = createFormGroup('year', 'Year', 'Select Year', true);
          form.appendChild(yearGroup.group);
          
          // Create submodel dropdown (disabled initially)
          const submodelGroup = createFormGroup('submodel', 'Submodel (Optional)', 'Select Submodel (Optional)', true);
          form.appendChild(submodelGroup.group);
          
          // Create search button
          const buttonContainer = document.createElement('div');
          buttonContainer.className = 'vehicle-search-widget-form-group';
          
          const button = document.createElement('button');
          button.type = 'submit';
          button.className = 'vehicle-search-widget-button';
          button.textContent = settings.buttonText;
          button.disabled = true;
          
          buttonContainer.appendChild(button);
          form.appendChild(buttonContainer);
          
          // Add to DOM
          formContainer.appendChild(form);
          
          // Setup event listeners
          setupEventListeners(container, settings, {
            make: makeGroup.select,
            model: modelGroup.select,
            year: yearGroup.select,
            submodel: submodelGroup.select,
            button: button
          });
          
          // Load initial data
          loadMakes(container, settings);
        }

        // Create a form group with label and select
        function createFormGroup(id, label, placeholder, disabled = false) {
          const group = document.createElement('div');
          group.className = 'vehicle-search-widget-form-group';
          
          const labelElement = document.createElement('label');
          labelElement.className = 'vehicle-search-widget-label';
          labelElement.htmlFor = \`vehicle-search-\${id}\`;
          labelElement.textContent = label;
          
          const select = document.createElement('select');
          select.className = 'vehicle-search-widget-select';
          select.id = \`vehicle-search-\${id}\`;
          select.disabled = disabled;
          
          const defaultOption = document.createElement('option');
          defaultOption.value = '';
          defaultOption.textContent = placeholder;
          select.appendChild(defaultOption);
          
          group.appendChild(labelElement);
          group.appendChild(select);
          
          return { group, select };
        }

        // Setup event listeners for all selects
        function setupEventListeners(container, settings, elements) {
          elements.make.addEventListener('change', function() {
            const makeId = this.value;
            console.log('[Vehicle Search Widget] Make changed:', {makeId, text: this.options[this.selectedIndex].text});
            
            if (makeId) {
              loadModels(container, settings, makeId);
              
              // Reset dependent dropdowns
              resetSelect(elements.model);
              resetSelect(elements.year);
              resetSelect(elements.submodel);
              
              elements.model.disabled = false;
              elements.year.disabled = true;
              elements.submodel.disabled = true;
            } else {
              resetSelect(elements.model);
              resetSelect(elements.year);
              resetSelect(elements.submodel);
              
              elements.model.disabled = true;
              elements.year.disabled = true;
              elements.submodel.disabled = true;
            }
            updateButtonState(elements);
          });
          
          elements.model.addEventListener('change', function() {
            const modelId = this.value;
            console.log('[Vehicle Search Widget] Model changed:', {modelId, text: this.options[this.selectedIndex].text});
            
            if (modelId) {
              loadYears(container, settings, modelId);
              
              // Reset dependent dropdowns
              resetSelect(elements.year);
              resetSelect(elements.submodel);
              
              elements.year.disabled = false;
              elements.submodel.disabled = true;
            } else {
              resetSelect(elements.year);
              resetSelect(elements.submodel);
              
              elements.year.disabled = true;
              elements.submodel.disabled = true;
            }
            updateButtonState(elements);
          });
          
          elements.year.addEventListener('change', function() {
            const yearId = this.value;
            console.log('[Vehicle Search Widget] Year changed:', {yearId, text: this.options[this.selectedIndex].text});
            
            if (yearId) {
              loadSubmodels(container, settings, yearId);
              
              // Reset dependent dropdowns
              resetSelect(elements.submodel);
              
              elements.submodel.disabled = false;
            } else {
              resetSelect(elements.submodel);
              
              elements.submodel.disabled = true;
            }
            updateButtonState(elements);
          });
          
          elements.submodel.addEventListener('change', function() {
            console.log('[Vehicle Search Widget] Submodel changed:', {
              submodelId: this.value, 
              text: this.value ? this.options[this.selectedIndex].text : 'None'
            });
            updateButtonState(elements);
          });
        }

        // Reset a select element
        function resetSelect(select) {
          select.innerHTML = '';
          const defaultOption = document.createElement('option');
          defaultOption.value = '';
          defaultOption.textContent = select.disabled ? 'Select previous field first' : 'Select an option';
          select.appendChild(defaultOption);
        }

        // Update button disabled state
        function updateButtonState(elements) {
          const hasRequiredFields = elements.make.value && elements.model.value && elements.year.value;
          elements.button.disabled = !hasRequiredFields;
        }

        // Load makes from API
        function loadMakes(container, settings) {
          showLoading(container);
          
          // Add shop parameter and timestamp to avoid caching issues
          const timestamp = new Date().getTime();
          
          // Choose the API URL based on settings or defaults
          const apiBaseUrl = getApiBaseUrl(container, settings);
          
          // Create the full API URL with proper app proxy format if needed
          const url = createApiUrl(apiBaseUrl, '/api/vehicle/makes', {
            t: timestamp
          });
          
          console.log('[Vehicle Search Widget] Loading makes from:', url);
          
          fetch(url)
            .then(response => {
              if (!response.ok) {
                throw new Error('Failed to load makes');
              }
              return response.json();
            })
            .then(data => {
              console.log('[Vehicle Search Widget] Makes loaded:', data);
              
              const makeSelect = container.querySelector('#vehicle-search-make');
              
              // Add each make to the dropdown
              data.makes.forEach(make => {
                const option = document.createElement('option');
                option.value = make.id;
                option.textContent = make.name;
                makeSelect.appendChild(option);
              });
              
              hideLoading(container);
            })
            .catch(error => {
              console.error('[Vehicle Search Widget] Error loading makes:', error);
              showError(container, 'Failed to load vehicle makes. Please try again later.');
              hideLoading(container);
            });
        }

        // Load models for a make
        function loadModels(container, settings, makeId) {
          showLoading(container);
          
          // Add shop parameter and timestamp to avoid caching issues
          const timestamp = new Date().getTime();
          
          // Choose the API URL based on settings or defaults
          const apiBaseUrl = getApiBaseUrl(container, settings);
          
          // Create the full API URL with proper app proxy format if needed
          const url = createApiUrl(apiBaseUrl, \`/api/vehicle/models?make=\${makeId}\`, {
            t: timestamp
          });
          
          console.log('[Vehicle Search Widget] Loading models from:', url);
          
          fetch(url)
            .then(response => {
              if (!response.ok) {
                throw new Error('Failed to load models');
              }
              return response.json();
            })
            .then(data => {
              console.log('[Vehicle Search Widget] Models loaded:', data);
              
              const modelSelect = container.querySelector('#vehicle-search-model');
              
              // Add each model to the dropdown
              data.models.forEach(model => {
                const option = document.createElement('option');
                option.value = model.id;
                option.textContent = model.name;
                modelSelect.appendChild(option);
              });
              
              hideLoading(container);
            })
            .catch(error => {
              console.error('[Vehicle Search Widget] Error loading models:', error);
              showError(container, 'Failed to load vehicle models. Please try again later.');
              hideLoading(container);
            });
        }

        // Load years for a model
        function loadYears(container, settings, modelId) {
          showLoading(container);
          
          // Add shop parameter and timestamp to avoid caching issues
          const timestamp = new Date().getTime();
          
          // Choose the API URL based on settings or defaults
          const apiBaseUrl = getApiBaseUrl(container, settings);
          
          // Create the full API URL with proper app proxy format if needed
          const url = createApiUrl(apiBaseUrl, \`/api/vehicle/years?model=\${modelId}\`, {
            t: timestamp
          });
          
          console.log('[Vehicle Search Widget] Loading years from:', url);
          
          fetch(url)
            .then(response => {
              if (!response.ok) {
                throw new Error('Failed to load years');
              }
              return response.json();
            })
            .then(data => {
              console.log('[Vehicle Search Widget] Years loaded:', data);
              
              const yearSelect = container.querySelector('#vehicle-search-year');
              
              // Add each year to the dropdown
              data.years.forEach(year => {
                const option = document.createElement('option');
                option.value = year.id;
                option.textContent = year.name;
                yearSelect.appendChild(option);
              });
              
              hideLoading(container);
            })
            .catch(error => {
              console.error('[Vehicle Search Widget] Error loading years:', error);
              showError(container, 'Failed to load vehicle years. Please try again later.');
              hideLoading(container);
            });
        }

        // Load submodels for a year
        function loadSubmodels(container, settings, yearId) {
          showLoading(container);
          
          // Add shop parameter and timestamp to avoid caching issues
          const timestamp = new Date().getTime();
          
          // Choose the API URL based on settings or defaults
          const apiBaseUrl = getApiBaseUrl(container, settings);
          
          // Create the full API URL with proper app proxy format if needed
          const url = createApiUrl(apiBaseUrl, \`/api/vehicle/submodels?year=\${yearId}\`, {
            t: timestamp
          });
          
          console.log('[Vehicle Search Widget] Loading submodels from:', url);
          
          fetch(url)
            .then(response => {
              if (!response.ok) {
                throw new Error('Failed to load submodels');
              }
              return response.json();
            })
            .then(data => {
              console.log('[Vehicle Search Widget] Submodels loaded:', data);
              
              const submodelSelect = container.querySelector('#vehicle-search-submodel');
              
              // Add each submodel to the dropdown
              data.submodels.forEach(submodel => {
                const option = document.createElement('option');
                option.value = submodel.id;
                option.textContent = submodel.name;
                submodelSelect.appendChild(option);
              });
              
              hideLoading(container);
            })
            .catch(error => {
              console.error('[Vehicle Search Widget] Error loading submodels:', error);
              showError(container, 'Failed to load vehicle submodels. Please try again later.');
              hideLoading(container);
            });
        }

        // Handle search button click
        function handleSearch(container, settings) {
          const make = {
            id: container.querySelector('#vehicle-search-make').value,
            name: container.querySelector('#vehicle-search-make').options[container.querySelector('#vehicle-search-make').selectedIndex].text
          };
          
          const model = {
            id: container.querySelector('#vehicle-search-model').value,
            name: container.querySelector('#vehicle-search-model').options[container.querySelector('#vehicle-search-model').selectedIndex].text
          };
          
          const year = {
            id: container.querySelector('#vehicle-search-year').value,
            name: container.querySelector('#vehicle-search-year').options[container.querySelector('#vehicle-search-year').selectedIndex].text
          };
          
          const submodelElement = container.querySelector('#vehicle-search-submodel');
          const submodel = submodelElement.value ? {
            id: submodelElement.value,
            name: submodelElement.options[submodelElement.selectedIndex].text
          } : null;
          
          // Create the vehicle object
          const vehicle = {
            make: make,
            model: model,
            year: year,
            submodel: submodel,
          };
          
          console.log('[Vehicle Search Widget] Search with vehicle:', vehicle);
          
          // Store the selection in localStorage if enabled
          if (settings.rememberVehicle) {
            try {
              localStorage.setItem('vehicle_selection', JSON.stringify(vehicle));
              const expiryDate = new Date();
              expiryDate.setDate(expiryDate.getDate() + settings.rememberDays);
              localStorage.setItem('vehicle_selection_expiry', expiryDate.toISOString());
            } catch (e) {
              console.warn('[Vehicle Search Widget] Failed to save vehicle to localStorage:', e);
            }
          }
          
          // Build search URL
          let searchUrl = '/collections/all';
          
          // Include vehicle parameters in the URL
          const params = new URLSearchParams();
          params.append('make', make.name);
          params.append('model', model.name);
          params.append('year', year.name);
          if (submodel) {
            params.append('submodel', submodel.name);
          }
          
          // The final search URL
          searchUrl += '?' + params.toString();
          console.log('[Vehicle Search Widget] Navigating to:', searchUrl);
          
          // Navigate to the search URL
          window.location.href = searchUrl;
        }

        // Utility function to get API base URL
        function getApiBaseUrl(container, settings) {
          // First try the data attribute from the script tag
          const scriptTag = document.querySelector('script[data-api-base-url]');
          if (scriptTag && scriptTag.dataset.apiBaseUrl) {
            return scriptTag.dataset.apiBaseUrl;
          }
          
          // Then try the container setting
          if (settings.apiBaseUrl) {
            return settings.apiBaseUrl;
          }
          
          // Default to the current domain
          return window.location.origin;
        }

        // Utility function to create a proper URL based on context
        function createApiUrl(baseUrl, path, queryParams = {}) {
          // Get the shop domain from the URL if available
          const shop = getShopFromUrl();
          
          // Create the query string from the params
          const params = new URLSearchParams();
          
          // Add all passed query parameters
          Object.entries(queryParams).forEach(([key, value]) => {
            params.append(key, value);
          });
          
          // Add shop parameter if available
          if (shop) {
            params.append('shop', shop);
          }
          
          // If baseUrl ends with slash, remove it to avoid double slash when adding path
          if (baseUrl.endsWith('/')) {
            baseUrl = baseUrl.slice(0, -1);
          }
          
          // If path doesn't start with slash, add it
          if (!path.startsWith('/')) {
            path = '/' + path;
          }
          
          // Build the final URL
          const url = baseUrl + path + '?' + params.toString();
          return url;
        }

        // Extract shop domain from URL
        function getShopFromUrl() {
          // Check URL query parameters
          const urlParams = new URLSearchParams(window.location.search);
          const shopParam = urlParams.get('shop');
          if (shopParam) {
            return shopParam;
          }
          
          // Check if hostname ends with myshopify.com
          if (window.location.hostname.endsWith('myshopify.com')) {
            return window.location.hostname;
          }
          
          // Try to get from localStorage
          try {
            const savedShop = localStorage.getItem('shopify_shop_domain');
            if (savedShop) {
              return savedShop;
            }
          } catch (e) {
            console.warn('[Vehicle Search Widget] Error accessing localStorage:', e);
          }
          
          return null;
        }

        // Show loading indicator
        function showLoading(container) {
          const loadingElement = container.querySelector('.vehicle-search-widget-loading');
          if (loadingElement) {
            loadingElement.style.display = 'flex';
          } else {
            const loadingDiv = document.createElement('div');
            loadingDiv.className = 'vehicle-search-widget-loading';
            loadingDiv.style.display = 'flex';
            loadingDiv.style.justifyContent = 'center';
            loadingDiv.style.alignItems = 'center';
            loadingDiv.style.marginTop = '10px';
            loadingDiv.innerHTML = 'Loading...';
            container.querySelector('.vehicle-search-widget-form').appendChild(loadingDiv);
          }
        }

        // Hide loading indicator
        function hideLoading(container) {
          const loadingElement = container.querySelector('.vehicle-search-widget-loading');
          if (loadingElement) {
            loadingElement.style.display = 'none';
          }
        }

        // Show error message
        function showError(container, message) {
          const errorElement = container.querySelector('.vehicle-search-widget-error');
          if (errorElement) {
            errorElement.textContent = message;
            errorElement.style.display = 'block';
          } else {
            const errorDiv = document.createElement('div');
            errorDiv.className = 'vehicle-search-widget-error';
            errorDiv.style.color = 'red';
            errorDiv.style.marginTop = '10px';
            errorDiv.textContent = message;
            container.querySelector('.vehicle-search-widget-form').appendChild(errorDiv);
          }
        }

        // Hide error message
        function hideError(container) {
          const errorElement = container.querySelector('.vehicle-search-widget-error');
          if (errorElement) {
            errorElement.style.display = 'none';
          }
        }
      })();
    `;

    return new Response(widgetScript, { headers });
  } catch (error) {
    console.error("Error serving widget script:", error);
    return new Response("console.error('Error loading vehicle search widget script');", { headers });
  }
} 