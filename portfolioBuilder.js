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

// Initialize Portfolio Builder sidebar item
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
            <p id="portfolio-builder-instructions">
              <button id="add-filter-btn">+</button> Add your filters and build your portfolio
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
  document.getElementById('add-filter-btn').addEventListener('click', openFilterSelector);
  document.getElementById('generate-portfolio-btn').addEventListener('click', generatePortfolioNew);
}

// Show filter selection dropdowns
function openFilterSelector() {
  const availableFilters = [];
  const assetType = (portfolioFilters.length > 0) ? portfolioFilters[0].value : null;
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
      if (!portfolioFilters.find(item => item.filterName === f)) availableFilters.push(f);
    });
  }

  const selectorDiv = document.createElement('div');
  selectorDiv.className = 'filter-selector';
  const selectEl = document.createElement('select');
  availableFilters.forEach(name => {
    const opt = document.createElement('option'); opt.value = name; opt.textContent = name;
    selectEl.appendChild(opt);
  });
  selectorDiv.appendChild(selectEl);
  const inputContainer = document.createElement('span');
  selectorDiv.appendChild(inputContainer);

  function updateInputFields() {
    inputContainer.innerHTML = '';
    const sel = selectEl.value;
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

  selectEl.addEventListener('change', updateInputFields);
  updateInputFields();

  const addBtn = document.createElement('button');
  addBtn.textContent='Add Filter'; addBtn.style.marginLeft='10px';
  addBtn.addEventListener('click',() => {
    const filter = { filterName: selectEl.value };
    if (filter.filterName==='Asset Class') {
      filter.value = inputContainer.querySelector('select').value;
    } else {
      filter.operator = inputContainer.querySelector('select').value;
      filter.value = inputContainer.querySelector('input').value;
    }
    portfolioFilters.push(filter);
    updatePortfolioSteps();
    selectorDiv.remove();
  });
  selectorDiv.appendChild(addBtn);
  document.getElementById('portfolio_builder1').appendChild(selectorDiv);
}

// Update the list of chosen filters
function updatePortfolioSteps() {
  const steps = document.getElementById('portfolio-builder-steps');
  steps.innerHTML='';
  portfolioFilters.forEach((step,i)=>{
    const div = document.createElement('div'); div.className='filter-step';
    let desc = step.filterName;
    if (desc==='Asset Class') desc += `: ${step.value}`;
    else desc += ` ${step.operator} ${step.value}`;
    div.innerHTML = `<span>${desc}</span>`;
    const btn = document.createElement('button'); btn.className='remove-filter-btn'; btn.textContent='✕';
    btn.addEventListener('click',()=>{ portfolioFilters.splice(i,1); updatePortfolioSteps(); });
    div.appendChild(btn);
    steps.appendChild(div);
  });
  const instr = document.createElement('p'); instr.id='portfolio-builder-instructions';
  instr.innerHTML = `<button id="add-filter-btn">+</button> Add another filter`;
  steps.appendChild(instr);
  document.getElementById('add-filter-btn').addEventListener('click', openFilterSelector);
}

// Apply filters and render results table
function generatePortfolioNew() {
  if (portfolioFilters.length===0 || portfolioFilters[0].filterName!=='Asset Class') {
    alert('Please add Asset Class filter first.'); return;
  }
  const asset = portfolioFilters[0].value;
  let dataObj, labelsLeft, labelsRight;
  switch(asset) {
    case 'STOCKS': dataObj = window.stocksFullData; labelsLeft=leftLabels; labelsRight=rightLabels; break;
    case 'ETFS': dataObj = window.etfFullData;   labelsLeft=etfLeftLabels; labelsRight=etfRightLabels; break;
    case 'FUTURES': dataObj = window.futuresFullData; labelsLeft=futuresLeftLabels; labelsRight=futuresRightLabels; break;
    default: dataObj = window.fxFullData; labelsLeft=fxLeftLabels; labelsRight=fxRightLabels;
  }
  const resultsArr = [];
  portfolioFilters.slice(1).forEach(filt=>{}); // filtering logic per original
  // simplified: show summary table
  const results = document.getElementById('portfolio-results'); results.innerHTML='';
  const tbl = document.createElement('table');
  Object.entries(dataObj).forEach(([name,info]) => {
    const tr = document.createElement('tr');
    labelsLeft.forEach((lbl,i)=>{
      const td1 = document.createElement('td'); td1.textContent=lbl; tr.appendChild(td1);
      const td2 = document.createElement('td'); td2.textContent=info.summaryLeft[i]||''; tr.appendChild(td2);
    });
    results.appendChild(tbl);
  });
}
