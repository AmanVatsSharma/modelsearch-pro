(function() {
  class CompatibilityWidget {
    constructor(options) {
      this.container = options.container;
      this.productId = options.productId;
      this.productHandle = options.productHandle;
      this.title = options.title || 'Check Vehicle Compatibility';
      this.buttonText = options.buttonText || 'Check Compatibility';
      this.apiBaseUrl = options.apiBaseUrl || '';
      this.contentEl = this.container.querySelector('.compatibility-widget-content');
      this.selectedVehicle = null;
      this.messages = {
        compatible: options.compatibleMessage || 'This product is compatible with your vehicle.',
        incompatible: options.incompatibleMessage || 'This product is not compatible with your vehicle.'
      };
      
      this.init();
    }
    
    init() {
      try {
        const savedVehicle = localStorage.getItem('selectedVehicle');
        if (savedVehicle) this.selectedVehicle = JSON.parse(savedVehicle);
      } catch (e) {}
      
      this.render();
    }
    
    render() {
      if (this.selectedVehicle) {
        this.renderSelectedVehicle();
        this.checkCompatibility();
      } else {
        this.renderVehicleSelector();
      }
    }
    
    renderVehicleSelector() {
      let html = `
        <div>
          <h3>${this.title}</h3>
          <div>
            <div>
              <label for="comp-year">Year</label>
              <select id="comp-year"><option value="">Select Year</option></select>
            </div>
            <div>
              <label for="comp-make">Make</label>
              <select id="comp-make" disabled><option value="">Select Make</option></select>
            </div>
            <div>
              <label for="comp-model">Model</label>
              <select id="comp-model" disabled><option value="">Select Model</option></select>
            </div>
          </div>
          <button id="comp-check-btn" disabled>${this.buttonText}</button>
        </div>
      `;
      
      this.contentEl.innerHTML = html;
      this.setupEvents();
      this.loadYears();
    }
    
    renderSelectedVehicle() {
      if (!this.selectedVehicle) return;
      
      const vehicle = this.selectedVehicle;
      const vehicleText = `${vehicle.year} ${vehicle.make} ${vehicle.model}`;
      
      let html = `
        <div>
          <h3>${this.title}</h3>
          <div>
            <span>Your Vehicle:</span>
            <strong>${vehicleText}</strong>
            <button id="comp-change-btn">Change</button>
          </div>
          <div id="comp-results">
            <div>Loading...</div>
          </div>
        </div>
      `;
      
      this.contentEl.innerHTML = html;
      
      document.getElementById('comp-change-btn').addEventListener('click', () => {
        this.selectedVehicle = null;
        localStorage.removeItem('selectedVehicle');
        this.render();
      });
    }
    
    setupEvents() {
      const yearSelect = document.getElementById('comp-year');
      const makeSelect = document.getElementById('comp-make');
      const modelSelect = document.getElementById('comp-model');
      const checkBtn = document.getElementById('comp-check-btn');
      
      if (yearSelect) {
        yearSelect.addEventListener('change', () => {
          if (yearSelect.value) {
            this.loadMakes(yearSelect.value);
            makeSelect.disabled = false;
          } else {
            makeSelect.disabled = true;
            modelSelect.disabled = true;
            checkBtn.disabled = true;
          }
        });
      }
      
      if (makeSelect) {
        makeSelect.addEventListener('change', () => {
          if (makeSelect.value) {
            this.loadModels(yearSelect.value, makeSelect.value);
            modelSelect.disabled = false;
          } else {
            modelSelect.disabled = true;
            checkBtn.disabled = true;
          }
        });
      }
      
      if (modelSelect) {
        modelSelect.addEventListener('change', () => {
          checkBtn.disabled = !modelSelect.value;
        });
      }
      
      if (checkBtn) {
        checkBtn.addEventListener('click', () => {
          const vehicle = {
            year: yearSelect.options[yearSelect.selectedIndex].text,
            make: makeSelect.options[makeSelect.selectedIndex].text,
            model: modelSelect.options[modelSelect.selectedIndex].text,
            yearId: yearSelect.value,
            makeId: makeSelect.value,
            modelId: modelSelect.value
          };
          
          this.selectedVehicle = vehicle;
          localStorage.setItem('selectedVehicle', JSON.stringify(vehicle));
          this.renderSelectedVehicle();
          this.checkCompatibility();
        });
      }
    }
    
    async loadYears() {
      try {
        const yearSelect = document.getElementById('comp-year');
        if (!yearSelect) return;
        
        const response = await fetch(`${this.apiBaseUrl}/api/years`);
        if (!response.ok) throw new Error('Failed to load years');
        
        const data = await response.json();
        const years = data.years || [];
        
        years.forEach(year => {
          const option = document.createElement('option');
          option.value = year.id;
          option.textContent = year.value;
          yearSelect.appendChild(option);
        });
      } catch (error) {
        console.error('Error loading years:', error);
      }
    }
    
    async loadMakes(yearId) {
      try {
        const makeSelect = document.getElementById('comp-make');
        if (!makeSelect) return;
        
        makeSelect.innerHTML = '<option value="">Select Make</option>';
        document.getElementById('comp-model').innerHTML = '<option value="">Select Model</option>';
        document.getElementById('comp-model').disabled = true;
        
        const response = await fetch(`${this.apiBaseUrl}/api/years/${yearId}/makes`);
        if (!response.ok) throw new Error('Failed to load makes');
        
        const data = await response.json();
        const makes = data.makes || [];
        
        makes.forEach(make => {
          const option = document.createElement('option');
          option.value = make.id;
          option.textContent = make.name;
          makeSelect.appendChild(option);
        });
      } catch (error) {
        console.error('Error loading makes:', error);
      }
    }
    
    async loadModels(yearId, makeId) {
      try {
        const modelSelect = document.getElementById('comp-model');
        if (!modelSelect) return;
        
        modelSelect.innerHTML = '<option value="">Select Model</option>';
        
        const response = await fetch(`${this.apiBaseUrl}/api/years/${yearId}/makes/${makeId}/models`);
        if (!response.ok) throw new Error('Failed to load models');
        
        const data = await response.json();
        const models = data.models || [];
        
        models.forEach(model => {
          const option = document.createElement('option');
          option.value = model.id;
          option.textContent = model.name;
          modelSelect.appendChild(option);
        });
      } catch (error) {
        console.error('Error loading models:', error);
      }
    }
    
    async checkCompatibility() {
      try {
        if (!this.selectedVehicle) return;
        
        const resultsEl = document.getElementById('comp-results');
        if (!resultsEl) return;
        
        resultsEl.innerHTML = '<div>Checking compatibility...</div>';
        
        const params = new URLSearchParams();
        if (this.productId) {
          params.append('productId', this.productId);
        } else {
          params.append('handle', this.productHandle);
        }
        
        params.append('yearId', this.selectedVehicle.yearId);
        params.append('makeId', this.selectedVehicle.makeId);
        params.append('modelId', this.selectedVehicle.modelId);
        
        const url = `${this.apiBaseUrl}/api/compatibility?${params.toString()}`;
        const response = await fetch(url);
        if (!response.ok) throw new Error('Failed to check compatibility');
        
        const data = await response.json();
        this.renderResults(data);
      } catch (error) {
        console.error('Error checking compatibility:', error);
        document.getElementById('comp-results').innerHTML = 
          '<div>Error checking compatibility. <button id="comp-retry">Try Again</button></div>';
        
        document.getElementById('comp-retry').addEventListener('click', () => this.checkCompatibility());
      }
    }
    
    renderResults(data) {
      const isCompatible = data.compatible;
      const alternatives = data.alternatives || [];
      const resultsEl = document.getElementById('comp-results');
      if (!resultsEl) return;
      
      let html = `
        <div>
          <p>${isCompatible ? this.messages.compatible : this.messages.incompatible}</p>
        </div>
      `;
      
      if (!isCompatible && alternatives.length > 0) {
        html += `<div><h4>Compatible Alternatives:</h4><ul>`;
        alternatives.slice(0, 3).forEach(alt => {
          html += `<li><a href="/products/${alt.handle}">${alt.title}</a></li>`;
        });
        html += `</ul></div>`;
      }
      
      resultsEl.innerHTML = html;
    }
  }
  
  window.CompatibilityWidget = CompatibilityWidget;
})(); 