// Vehicle Search Widget Initialization Script

(function() {
  // Helper function to safely get data attributes
  function getDataAttribute(element, name, defaultValue = '') {
    const value = element.getAttribute(`data-${name}`);
    return value !== null ? value : defaultValue;
  }

  // Helper function to check if a data attribute exists
  function hasDataAttribute(element, name) {
    return element.hasAttribute(`data-${name}`);
  }

  // Create widget container and structure
  function createWidgetDOM(element) {
    // Get settings from data attributes
    const title = getDataAttribute(element, 'title', 'Find parts for your vehicle');
    const buttonText = getDataAttribute(element, 'button-text', 'Find Parts');
    const theme = getDataAttribute(element, 'theme', 'light');
    const showReset = hasDataAttribute(element, 'show-reset');
    const rememberVehicle = hasDataAttribute(element, 'remember');
    const rememberDays = parseInt(getDataAttribute(element, 'remember-days', '30'), 10);

    // Create container with appropriate theme
    const container = document.createElement('div');
    container.className = `vehicle-search-widget-container vehicle-search-widget-theme-${theme}`;
    
    // Create header
    const header = document.createElement('div');
    header.className = 'vehicle-search-widget-header';
    
    const titleElement = document.createElement('h3');
    titleElement.className = 'vehicle-search-widget-title';
    titleElement.textContent = title;
    
    header.appendChild(titleElement);
    
    // Create form placeholder for the API script to populate
    const formPlaceholder = document.createElement('div');
    formPlaceholder.className = 'vehicle-search-widget-form';
    formPlaceholder.innerHTML = '<p>Loading vehicle search widget...</p>';
    
    // Add to DOM
    container.appendChild(header);
    container.appendChild(formPlaceholder);
    element.appendChild(container);
    
    // Store settings as data attributes for the API script
    container.dataset.title = title;
    container.dataset.buttonText = buttonText;
    container.dataset.theme = theme;
    container.dataset.showReset = showReset ? 'true' : 'false';
    container.dataset.rememberVehicle = rememberVehicle ? 'true' : 'false';
    container.dataset.rememberDays = rememberDays.toString();
    
    return container;
  }

  // Initialize widget when DOM is ready
  function initWidget() {
    // Find all widget elements
    const widgets = document.querySelectorAll('.vehicle-search-widget');
    
    if (widgets.length === 0) {
      console.warn('[Vehicle Search Widget] No widget elements found on page');
    } else {
      console.log('[Vehicle Search Widget] Found ' + widgets.length + ' widget elements');
    }
    
    widgets.forEach(element => {
      // Check if we need to create the container or if it already exists
      if (!element.classList.contains('vehicle-search-widget-container')) {
        const container = createWidgetDOM(element);
        
        // Get script element to extract API base URL
        const scriptElement = element.querySelector('script[data-api-base-url]');
        const apiBaseUrl = scriptElement ? scriptElement.getAttribute('data-api-base-url') : '';
        
        if (apiBaseUrl) {
          container.dataset.apiBaseUrl = apiBaseUrl;
          console.log('[Vehicle Search Widget] Setting API base URL:', apiBaseUrl);
        } else {
          console.warn('[Vehicle Search Widget] No API base URL found');
        }
      } else {
        console.log('[Vehicle Search Widget] Container already exists, skipping creation');
      }
    });
  }

  // Run initialization when DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initWidget);
  } else {
    initWidget();
  }
})(); 