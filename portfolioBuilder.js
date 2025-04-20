// portfolioBuilder.js

import {
  leftLabels,
  rightLabels,
  etfLeftLabels,
  etfRightLabels,
  futuresLeftLabels,
  futuresRightLabels,
  fxLeftLabels,
  fxRightLabels
} from "./dashboard.js";

// State for selected filters
let portfolioFilters = [];

// Initialize Portfolio Builder
export function initPortfolioBuilder() {
  const sidebarList = document.getElementById('sidebar-list');
  if (!sidebarList) return;

  sidebarList.addEventListener('click', e => {
    const li = e.target.closest('li');
    if (!li) return;
    if (li.textContent.trim().toUpperCase() === 'PORTFOLIO BUILDER') {
      // Hide other views
      document.getElementById('main-content').style.display = 'none';
      document.getElementById('thematic-portfolio-template').style.display = 'none';
      // Show builder template
      const tpl = document.getElementById('portfolio-builder-template');
      tpl.style.display = 'block';
      loadPortfolioBuilder();
    }
  });
}

// Load the initial builder UI
function loadPortfolioBuilder() {
  portfolioFilters = [];
  const container = document.getElementById('portfolio-builder-template');
  container.innerHTML = `
    <div id="portfolio-builder-page">
      <div id="portfolio-builder-container">
        <div id="portfolio_builder1">
          <div id="portfolio-builder-steps">
            <p class="portfolio-builder-instruction">
              <button class="add-filter-btn">+</button> Add your filters and build your portfolio
            </p>
          </div>
          <div id="portfolio-builder-actions">
            <button id="generate-portfolio-btn">GENERATE PORTFOLIO</button>
          </div>
        </div>
        <div id="portfolio_builder2">
          <div id="portfolio-results"></div>
        </div>
      </div>
    </div>
  `;

  // Delegate filter-builder clicks
  container.addEventListener('click', e => {
    if (e.target.matches('.add-filter-btn')) {
      openFilterSelector();
    }
    if (e.target.matches('#generate-portfolio-btn')) {
      generatePortfolioNew();
    }
    if (e.target.matches('.remove-filter-btn')) {
      const idx = parseInt(e.target.dataset.index, 10);
      if (!isNaN(idx)) {
        portfolioFilters.splice(idx, 1);
        updatePortfolioSteps();
      }
    }
  });
}

// Show filter selection dropdowns
function openFilterSelector() {
  const availableFilters = [];
  const assetType = portfolioFilters.length > 0 ? portfolioFilters[0].value : null;
  let allFilters;

  if (assetType === 'FUTURES') {
    allFilters = ['Score','Gap to Peak','S&P500 Correlation','S&P500 Volatility Ratio','Alpha Strength'];
  } else if (assetType === 'FX') {
    allFilters = ['Score','Gap to Peak','AVERAGE DAILY VOLATILITY','FX Volatility Ratio','30 DAYS PROJECTION','LONG TERM - MACRO','MEDIUM TERM - MATH','MEDIUM TERM - STATS','SHORT TERM - TECH'];
  } else {
    allFilters = ['Score','Gap to Peak','S&P500 Correlation','S&P500 Volatility Ratio','Bullish Alpha','Bearish Alpha','Alpha Strength'];
  }

  if (portfolioFilters.length === 0) {
    availableFilters.push('Asset Class');
  } else {
    allFilters.forEach(f => {
      if (!portfolioFilters.some(item => item.filterName === f)) availableFilters.push(f);
    });
  }

  const selectorDiv = document.createElement('div');
  selectorDiv.className = 'filter-selector';
  selectorDiv.innerHTML = `
    <select class="filter-name">
      ${availableFilters.map(f => `<option value="${f}">${f}</option>`).join('')}
    </select>
    <span class="input-container"></span>
    <button class="add-filter-btn">Add Filter</button>
  `;
  document.getElementById('portfolio_builder1').appendChild(selectorDiv);

  const nameSelect = selectorDiv.querySelector('.filter-name');
  const inputContainer = selectorDiv.querySelector('.input-container');

  function updateInput() {
    inputContainer.innerHTML = '';
    const sel = nameSelect.value;
    if (sel === 'Asset Class') {
      const assetSelect = document.createElement('select');
      ['STOCKS','ETFS','FUTURES','FX'].forEach(a => {
        const o = document.createElement('option'); o.value = a; o.textContent = a;
        assetSelect.appendChild(o);
      });
      inputContainer.appendChild(assetSelect);
    } else {
      const opSelect = document.createElement('select');
      ['≥','≤'].forEach(o => { const opt = document.createElement('option'); opt.value=o; opt.textContent=o; opSelect.appendChild(opt); });
      const numInput = document.createElement('input'); numInput.type='number'; numInput.placeholder='Value';
      inputContainer.appendChild(opSelect);
      inputContainer.appendChild(numInput);
    }
  }

  nameSelect.addEventListener('change', updateInput);
  updateInput();

  selectorDiv.querySelector('.add-filter-btn').addEventListener('click', () => {
    const filter = { filterName: nameSelect.value };
    if (filter.filterName === 'Asset Class') {
      filter.value = inputContainer.querySelector('select').value;
    } else {
      filter.operator = inputContainer.querySelector('select').value;
      filter.value = inputContainer.querySelector('input').value;
    }
    portfolioFilters.push(filter);
    updatePortfolioSteps();
    selectorDiv.remove();
  });
}

// Update the list of chosen filters
function updatePortfolioSteps() {
  const steps = document.getElementById('portfolio-builder-steps');
  steps.innerHTML = '';
  portfolioFilters.forEach((step, i) => {
    const div = document.createElement('div'); div.className = 'filter-step';
    let desc = step.filterName;
    if (desc === 'Asset Class') desc += `: ${step.value}`;
    else desc += ` ${step.operator} ${step.value}`;
    div.innerHTML = `<span>${desc}</span><button class="remove-filter-btn" data-index="${i}">✕</button>`;
    steps.appendChild(div);
  });
  // Add the "Add another filter" button
  const instr = document.createElement('p'); instr.className = 'portfolio-builder-instruction';
  instr.innerHTML = `<button class="add-filter-btn">+</button> Add another filter`;
  steps.appendChild(instr);
}

// Apply filters and render results table
function generatePortfolioNew() {
  if (portfolioFilters.length===0 || portfolioFilters[0].filterName !== 'Asset Class') {
    alert('Please add Asset Class filter first.'); return;
  }
  const asset = portfolioFilters[0].value;
  let dataObj, labelsLeft, labelsRight;
  switch(asset) {
    case 'STOCKS': dataObj = window.stocksFullData; labelsLeft=leftLabels; labelsRight=rightLabels; break;
    case 'ETFS':   dataObj = window.etfFullData;   labelsLeft=etfLeftLabels; labelsRight=etfRightLabels; break;
    case 'FUTURES':dataObj = window.futuresFullData;labelsLeft=futuresLeftLabels;labelsRight=futuresRightLabels;break;
    default:       dataObj = window.fxFullData;     labelsLeft=fxLeftLabels;   labelsRight=fxRightLabels;
  }
  const results = document.getElementById('portfolio-results');
  results.innerHTML = '';
  const tbl = document.createElement('table');
  // Header
  const thead = document.createElement('thead');
  const headerRow = document.createElement('tr');
  headerRow.innerHTML = '<th>Instrument</th>' + portfolioFilters.slice(1).map(f => `<th>${f.filterName}</th>`).join('');
  thead.appendChild(headerRow);
  tbl.appendChild(thead);
  // Body
  const tbody = document.createElement('tbody');
  Object.entries(dataObj).forEach(([name,info]) => {
    let include = true;
    // Apply each filter (omitted detailed logic for brevity)
    if (!include) return;
    const tr = document.createElement('tr');
    tr.innerHTML = `<td>${name}</td>` + portfolioFilters.slice(1).map(f => `<td>…</td>`).join('');
    tbody.appendChild(tr);
  });
  tbl.appendChild(tbody);
  results.appendChild(tbl);
}
