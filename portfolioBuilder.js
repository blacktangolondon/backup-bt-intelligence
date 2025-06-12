import {
  leftLabels,
  rightLabels,
  etfLeftLabels,
  etfRightLabels,
  futuresLeftLabels,
  futuresRightLabels,
  fxLeftLabels,
  fxRightLabels,
  parseGap
} from "./dashboard.js";

// Filter mappings for each asset class
const filterMappingStocks = {
  "Trend Score":     { source: "left",  index: 0 },      // final_score
  "P/E Ratio":       { source: "right", index: 5 },      // pe_ratio
  "P/B Ratio":       { source: "data",  key:   "pb_ratio" },
  "EPS":             { source: "right", index: 6 },      // eps
  "Div Yield":       { source: "data",  key:   "div_yield" },
  "Return on Equity":{ source: "data",  key:   "return_on_equity" },
  "Debt to Equity":  { source: "data",  key:   "debt_to_equity" },
  "Revenue Growth":  { source: "data",  key:   "revenue_growth" },
  "Payout Ratio":    { source: "data",  key:   "payout_ratio" },
  "Beta":            { source: "data",  key:   "beta" },
  "S&P500 Correlation":    { source: "right", index: 0 }, // sp500_correlation
  "S&P500 Volatility Ratio":{ source: "right", index: 1 }, // sp500_volatility_ratio
  "Bullish Alpha":   { source: "right", index: 2 },      // bullish_alpha
  "Bearish Alpha":   { source: "right", index: 3 },      // bearish_alpha
  "Alpha Strength":  { source: "right", index: 4 },      // alpha_strength
  "Projection 30":   { source: "data",  key:   "projection_30" },
  "Gap to Peak":     { source: "left",  index: 3 }       // gap_to_peak
};

// ETF filters (subset of Stocks)
const filterMappingETFs = {
  "Trend Score":     filterMappingStocks["Final Score"],
  "P/E Ratio":       filterMappingStocks["P/E Ratio"],
  "P/B Ratio":       filterMappingStocks["P/B Ratio"],
  "EPS":             filterMappingStocks["EPS"],
  "Div Yield":       filterMappingStocks["Div Yield"],
  "S&P500 Correlation":    filterMappingStocks["S&P500 Correlation"],
  "S&P500 Volatility Ratio":filterMappingStocks["S&P500 Volatility Ratio"],
  "Bullish Alpha":   filterMappingStocks["Bullish Alpha"],
  "Bearish Alpha":   filterMappingStocks["Bearish Alpha"],
  "Alpha Strength":  filterMappingStocks["Alpha Strength"],
  "Gap to Peak":     filterMappingStocks["Gap to Peak"]
};

// Futures filters
const filterMappingFutures = {
  "Trend Score":           { source: "left",  index: 0 }, // final_score
  "P/E Ratio":             { source: "data",  key:   "pe_ratio" },
  "P/B Ratio":             { source: "data",  key:   "pb_ratio" },
  "EPS":                   { source: "data",  key:   "eps" },
  "Div Yield":             { source: "data",  key:   "div_yield" },
  "S&P500 Correlation":    { source: "right", index: 0 }, // sp500_correlation
  "S&P500 Volatility Ratio":{ source: "right", index: 1 }, // sp500_volatility_ratio
  "Alpha Strength":        { source: "right", index: 2 }, // alpha_strength
  "Bullish Alpha":         { source: "data",  key:   "bullish_alpha" },
  "Bearish Alpha":         { source: "data",  key:   "bearish_alpha" },
  "Projection 30":         { source: "right", index: 3 }, // projection_30
  "Gap to Peak":           { source: "left",  index: 3 }
};

// FX filters (similar to Futures)
const filterMappingFX = {
  "Trend Score":           { source: "left",  index: 0 },
  "P/E Ratio":             { source: "data",  key:   "pe_ratio" },
  "P/B Ratio":             { source: "data",  key:   "pb_ratio" },
  "EPS":                   { source: "data",  key:   "eps" },
  "Div Yield":             { source: "data",  key:   "div_yield" },
  "S&P500 Correlation":    { source: "right", index: 0 },
  "S&P500 Volatility Ratio":{ source: "right", index: 1 },
  "Bullish Alpha":         { source: "data",  key:   "bullish_alpha" },
  "Bearish Alpha":         { source: "data",  key:   "bearish_alpha" },
  "Alpha Strength":        { source: "right", index: 2 },
  "Projection 30":         { source: "right", index: 3 },
  "Gap to Peak":           { source: "left",  index: 3 }
};

// State
let portfolioFilters = [];

// Initialize builder
export function initPortfolioBuilder() {
  const sidebarList = document.getElementById('sidebar-list');
  if (!sidebarList) return;
  sidebarList.addEventListener('click', e => {
    const li = e.target.closest('li'); if (!li) return;
    if (li.textContent.trim().toUpperCase() === 'PORTFOLIO BUILDER') {
      document.getElementById('main-content').style.display = 'none';
      document.getElementById('thematic-portfolio-template').style.display = 'none';
      const tpl = document.getElementById('portfolio-builder-template'); tpl.style.display = 'block';
      loadPortfolioBuilder();
    }
  });
}

// Build UI
function loadPortfolioBuilder() {
  portfolioFilters = [];
  const c = document.getElementById('portfolio-builder-template');
  c.innerHTML = `
    <div id="portfolio-builder-page">
      <div id="portfolio-builder-container">
        <div id="portfolio_builder1">
          <div id="portfolio-builder-steps">
            <p class="portfolio-builder-instruction">
              <button class="add-filter-btn">+</button> Add filters
            </p>
          </div>
          <div id="portfolio-builder-actions">
            <button id="generate-portfolio-btn">GENERATE PORTFOLIO</button>
          </div>
        </div>
        <div id="portfolio_builder2"><div id="portfolio-results"></div></div>
      </div>
    </div>
  `;
  c.addEventListener('click', e => {
    if (e.target.matches('.add-filter-btn')) openFilterSelector();
    if (e.target.matches('#generate-portfolio-btn')) generatePortfolioNew();
    if (e.target.matches('.remove-filter-btn')) {
      const i = +e.target.dataset.index;
      portfolioFilters.splice(i,1);
      updatePortfolioSteps();
    }
  });
}

// Add a filter (allow stacking multiple of same metric)
function openFilterSelector() {
  const available = [];
  const assetType = portfolioFilters[0]?.value;
  let metrics;
  if (!assetType) metrics = ['Asset Class'];
  else if (assetType === 'FUTURES') metrics = Object.keys(filterMappingFutures);
  else if (assetType === 'FX')      metrics = Object.keys(filterMappingFX);
  else if (assetType === 'ETFS')    metrics = Object.keys(filterMappingETFs);
  else metrics = Object.keys(filterMappingStocks);

  metrics.forEach(m => {
    if (m === 'Asset Class') {
      if (!portfolioFilters.some(f => f.filterName === 'Asset Class')) available.push(m);
    } else {
      available.push(m);
    }
  });

  const div = document.createElement('div'); div.className = 'filter-selector';
  div.innerHTML = `
    <select class="filter-name">${available.map(m=>`<option>${m}</option>`).join('')}</select>
    <span class="input-container"></span>
    <button class="apply-filter-btn">Add</button>
  `;
  document.getElementById('portfolio_builder1').appendChild(div);

  const nameSel = div.querySelector('.filter-name');
  const inpDiv = div.querySelector('.input-container');

  function renderInputs() {
    inpDiv.innerHTML = '';
    if (nameSel.value === 'Asset Class') {
      const sel = document.createElement('select');
      ['STOCKS','ETFS','FUTURES','FX'].forEach(v => {
        const o = document.createElement('option'); o.value = v; o.textContent = v; sel.appendChild(o);
      });
      inpDiv.appendChild(sel);
    } else {
      const op = document.createElement('select');
      ['≥','≤'].forEach(sym => { const o = document.createElement('option'); o.value = sym; o.textContent = sym; op.appendChild(o); });
      const num = document.createElement('input'); num.type = 'number'; num.placeholder = 'Value';
      inpDiv.appendChild(op); inpDiv.appendChild(num);
    }
  }
  nameSel.addEventListener('change', renderInputs);
  renderInputs();

  div.querySelector('.apply-filter-btn').addEventListener('click', () => {
    const f = { filterName: nameSel.value };
    if (f.filterName === 'Asset Class') {
      f.value = inpDiv.querySelector('select').value;
    } else {
      f.operator = inpDiv.querySelector('select').value;
      f.value    = inpDiv.querySelector('input').value;
    }
    portfolioFilters.push(f);
    updatePortfolioSteps();
    div.remove();
  });
}

// Show selected filters
function updatePortfolioSteps() {
  const steps = document.getElementById('portfolio-builder-steps');
  steps.innerHTML = '';
  portfolioFilters.forEach((f,i) => {
    const d = document.createElement('div'); d.className = 'filter-step';
    const text = f.filterName + (f.filterName === 'Asset Class' ? `: ${f.value}` : ` ${f.operator} ${f.value}`);
    d.innerHTML = `<span>${text}</span><button class="remove-filter-btn" data-index="${i}">✕</button>`;
    steps.appendChild(d);
  });
  const p = document.createElement('p'); p.className = 'portfolio-builder-instruction';
  p.innerHTML = `<button class="add-filter-btn">+</button> Add another filter`;
  steps.appendChild(p);
}

// Apply filters and render
function generatePortfolioNew() {
  if (!portfolioFilters.length || portfolioFilters[0].filterName !== 'Asset Class') {
    alert('Please add the Asset Class filter as your first filter.');
    return;
  }
  const asset = portfolioFilters[0].value;
  let dataObj, mapping;
  if (asset === 'STOCKS')  { dataObj = window.stocksFullData;  mapping = filterMappingStocks; }
  else if (asset === 'ETFS')    { dataObj = window.etfFullData;     mapping = filterMappingETFs; }
  else if (asset === 'FUTURES') { dataObj = window.futuresFullData; mapping = filterMappingFutures; }
  else if (asset === 'FX')      { dataObj = window.fxFullData;      mapping = filterMappingFX; }
  else { alert('Invalid asset class.'); return; }

  const results = [];
  for (const instrument in dataObj) {
    const info = dataObj[instrument];
    let include = true;
    for (let i = 1; i < portfolioFilters.length; i++) {
      const filt = portfolioFilters[i];
      const map  = mapping[filt.filterName];
      if (!map) continue;
      let rawVal;
      if (map.source === 'left')     rawVal = info.summaryLeft[map.index];
      else if (map.source === 'right')rawVal = info.summaryRight[map.index];
      else if (map.source === 'data') rawVal = info[map.key];
      const num = parseFloat(String(rawVal).replace('%',''));
      if (isNaN(num)) { include = false; break; }
      const cmp = parseFloat(filt.value);
      if (filt.operator === '≥' && num < cmp) { include = false; break; }
      if (filt.operator === '≤' && num > cmp) { include = false; break; }
    }
    if (include) results.push({ instrument, info });
  }

  const resDiv = document.getElementById('portfolio-results');
  resDiv.innerHTML = '';
  if (!results.length) { resDiv.textContent = 'No instruments meet this criteria.'; return; }

  // Build results table
  const base = window.location.origin + window.location.pathname;
  const table = document.createElement('table');
  const thead = table.createTHead();
  const headerRow = thead.insertRow();
  headerRow.insertCell().textContent = 'Instrument';
  portfolioFilters.slice(1).forEach(f => headerRow.insertCell().textContent = f.filterName);
  headerRow.insertCell().textContent = 'FULL ANALYSIS';
  const tbody = table.createTBody();

  results.forEach(r => {
    const tr = tbody.insertRow();
    tr.insertCell().textContent = r.instrument;
    portfolioFilters.slice(1).forEach(f => {
      const map  = mapping[f.filterName];
      let rawVal;
      if (map.source === 'left')     rawVal = r.info.summaryLeft[map.index];
      else if (map.source === 'right')rawVal = r.info.summaryRight[map.index];
      else if (map.source === 'data') rawVal = r.info[map.key];
      tr.insertCell().textContent = rawVal != null ? rawVal : '';
    });
    const fullCell = tr.insertCell();
    const link = document.createElement('a');
    link.href = `${base}?instrument=${encodeURIComponent(r.instrument)}`;
    link.target = '_blank';
    link.textContent = '🔗';
    fullCell.appendChild(link);
  });

  resDiv.appendChild(table);
}
