(function() {
  class FitmentTable {
    constructor(options) {
      this.container = options.container;
      this.productId = options.productId;
      this.productHandle = options.productHandle;
      this.title = options.title || 'Compatible Vehicles';
      this.showSearch = options.showSearch !== false;
      this.pageSize = parseInt(options.pageSize || '10', 10);
      this.apiBaseUrl = options.apiBaseUrl || '';
      
      this.contentEl = this.container.querySelector('.fitment-table-content');
      this.currentPage = 1;
      this.fitmentData = [];
      
      this.init();
    }
    
    init() {
      if (!this.productId && !this.productHandle) {
        console.warn('FitmentTable: No product ID or handle found');
        this.renderError('No product found');
        return;
      }
      
      this.loadFitmentData();
    }
    
    async loadFitmentData() {
      try {
        this.renderLoading();
        
        const endpoint = this.productId 
          ? `${this.apiBaseUrl}/api/products/${this.productId}/fitments` 
          : `${this.apiBaseUrl}/api/products/handle/${this.productHandle}/fitments`;
          
        const response = await fetch(endpoint);
        if (!response.ok) throw new Error(`Failed to load fitment data`);
        
        const data = await response.json();
        if (data.error) throw new Error(data.error);
        
        if (!data.fitments || data.fitments.length === 0) {
          this.renderEmptyState();
          return;
        }
        
        this.fitmentData = this.processFitmentData(data.fitments);
        this.renderTable();
      } catch (error) {
        console.error('Error loading fitment data:', error);
        this.renderError(error.message);
      }
    }
    
    renderLoading() {
      this.contentEl.innerHTML = `<div>Loading compatibility data...</div>`;
    }
    
    renderError(message) {
      this.contentEl.innerHTML = `<div>Error: ${message || 'Failed to load compatibility data'}</div>`;
    }
    
    renderEmptyState() {
      this.contentEl.innerHTML = `<div>No compatibility data available for this product.</div>`;
    }
    
    processFitmentData(fitments) {
      return fitments.map(fitment => {
        const year = fitment.year || {};
        const model = year.model || {};
        const make = model.make || {};
        const submodel = fitment.submodel || {};
        
        return {
          year: year.value || 'Unknown',
          make: make.name || 'Unknown',
          model: model.name || 'Unknown',
          submodel: submodel.name || 'All Submodels'
        };
      });
    }
    
    renderTable() {
      let html = '<div class="fitment-table-wrapper">';
      
      if (this.showSearch) {
        html += `
          <div>
            <input type="text" placeholder="Search..." id="fit-search">
          </div>
        `;
      }
      
      html += `
        <table>
          <thead>
            <tr>
              <th data-sort="year">Year</th>
              <th data-sort="make">Make</th>
              <th data-sort="model">Model</th>
              <th data-sort="submodel">Submodel</th>
            </tr>
          </thead>
          <tbody>
      `;
      
      const startIndex = (this.currentPage - 1) * this.pageSize;
      const endIndex = startIndex + this.pageSize;
      const paginatedData = this.fitmentData.slice(startIndex, endIndex);
      
      if (paginatedData.length === 0) {
        html += `<tr><td colspan="4" style="text-align:center">No data available</td></tr>`;
      } else {
        paginatedData.forEach(item => {
          html += `
            <tr>
              <td>${item.year}</td>
              <td>${item.make}</td>
              <td>${item.model}</td>
              <td>${item.submodel}</td>
            </tr>
          `;
        });
      }
      
      html += `</tbody></table>`;
      
      const totalPages = Math.ceil(this.fitmentData.length / this.pageSize);
      
      if (totalPages > 1) {
        html += `
          <div>
            <button id="fit-prev" ${this.currentPage === 1 ? 'disabled' : ''}>Previous</button>
            <span>Page ${this.currentPage} of ${totalPages}</span>
            <button id="fit-next" ${this.currentPage === totalPages ? 'disabled' : ''}>Next</button>
          </div>
        `;
      }
      
      html += '</div>';
      this.contentEl.innerHTML = html;
      this.setupEventListeners();
    }
    
    setupEventListeners() {
      const searchInput = document.getElementById('fit-search');
      if (searchInput) {
        searchInput.addEventListener('input', () => this.handleSearch(searchInput.value));
      }
      
      const prevBtn = document.getElementById('fit-prev');
      if (prevBtn) {
        prevBtn.addEventListener('click', () => {
          if (this.currentPage > 1) {
            this.currentPage--;
            this.renderTable();
          }
        });
      }
      
      const nextBtn = document.getElementById('fit-next');
      if (nextBtn) {
        nextBtn.addEventListener('click', () => {
          const totalPages = Math.ceil(this.fitmentData.length / this.pageSize);
          if (this.currentPage < totalPages) {
            this.currentPage++;
            this.renderTable();
          }
        });
      }
      
      const headers = this.contentEl.querySelectorAll('th[data-sort]');
      headers.forEach(header => {
        header.addEventListener('click', () => this.sortTable(header.dataset.sort));
      });
    }
    
    handleSearch(query) {
      query = query.toLowerCase();
      
      const filteredData = !query
        ? this.fitmentData
        : this.fitmentData.filter(item => {
            return (
              item.year.toLowerCase().includes(query) ||
              item.make.toLowerCase().includes(query) ||
              item.model.toLowerCase().includes(query) ||
              item.submodel.toLowerCase().includes(query)
            );
          });
      
      this.currentPage = 1;
      
      const rows = this.contentEl.querySelectorAll('tbody tr');
      rows.forEach(row => {
        row.style.display = 'none';
      });
      
      const startIndex = 0;
      const endIndex = this.pageSize;
      const paginatedData = filteredData.slice(startIndex, endIndex);
      
      const tbody = this.contentEl.querySelector('tbody');
      if (tbody) {
        tbody.innerHTML = '';
        
        if (paginatedData.length === 0) {
          const tr = document.createElement('tr');
          const td = document.createElement('td');
          td.setAttribute('colspan', '4');
          td.textContent = 'No matching vehicles found';
          td.style.textAlign = 'center';
          tr.appendChild(td);
          tbody.appendChild(tr);
        } else {
          paginatedData.forEach(item => {
            const tr = document.createElement('tr');
            tr.innerHTML = `
              <td>${item.year}</td>
              <td>${item.make}</td>
              <td>${item.model}</td>
              <td>${item.submodel}</td>
            `;
            tbody.appendChild(tr);
          });
        }
      }
      
      const totalPages = Math.ceil(filteredData.length / this.pageSize);
      const pageInfo = this.contentEl.querySelector('span');
      if (pageInfo) pageInfo.textContent = `Page ${this.currentPage} of ${totalPages}`;
      
      const prevBtn = document.getElementById('fit-prev');
      if (prevBtn) prevBtn.disabled = this.currentPage === 1;
      
      const nextBtn = document.getElementById('fit-next');
      if (nextBtn) nextBtn.disabled = this.currentPage === totalPages || totalPages === 0;
    }
    
    sortTable(column) {
      this.fitmentData.sort((a, b) => {
        const aVal = a[column];
        const bVal = b[column];
        return aVal.localeCompare(bVal);
      });
      
      this.currentPage = 1;
      this.renderTable();
    }
  }
  
  window.FitmentTable = FitmentTable;
})(); 