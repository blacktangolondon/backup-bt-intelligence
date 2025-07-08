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

// ───────────────────────────────────────────────────────────────────────────────
// Filter mappings for each asset class
// ───────────────────────────────────────────────────────────────────────────────
const filterMappingStocks = {
  "Trend Score":             { source: "left",  index: 0 },
  "P/E Ratio":               { source: "right", index: 5 },
  "P/B Ratio":               { source: "right", index: 6 },
  "EPS":                     { source: "right", index: 7 },
  "Dividend Yield":          { source: "right", index: 8 },
  "Return on Equity":        { field: "return_on_equity" },
  "Debt to Equity":          { field: "debt_to_equity" },
  "Revenue Growth":          { field: "revenue_growth" },
  "Payout Ratio":            { field: "payout_ratio" },
  "Beta":                    { field: "beta" },
  "S&P500 Correlation":      { source: "right", index: 0 },
  "S&P500 Volatility Ratio": { source: "right", index: 1 },
  "Alpha Strength":          { source: "right", index: 4 },
  "Bullish Alpha":           { source: "right", index: 2 },
  "Bearish Alpha":           { source: "right", index: 3 },
  "Gap to Peak":             { source: "left",  index: 3 }
};

const filterMappingETFs    = {};
[ "Trend Score","Alpha Strength","Bullish Alpha","Bearish Alpha",
  "S&P500 Correlation","S&P500 Volatility Ratio","Gap to Peak"
].forEach(k => filterMappingETFs[k] = filterMappingStocks[k]);

const filterMappingFutures = { ...filterMappingETFs };
const filterMappingFX      = { ...filterMappingETFs };

// ───────────────────────────────────────────────────────────────────────────────
// State
// ───────────────────────────────────────────────────────────────────────────────
let portfolioFilters = [];

// ───────────────────────────────────────────────────────────────────────────────
// Entry point: wire up sidebar
// ───────────────────────────────────────────────────────────────────────────────
export function initPortfolioBuilder() {
  const sidebarList = document.getElementById('sidebar-list');
  if (!sidebarList) return;
  sidebarList.addEventListener('click', e => {
    const li = e.target.closest('li');
    if (!li) return;
    if (li.textContent.trim().toUpperCase() === 'PORTFOLIO BUILDER') {
      document.getElementById('main-content').style.display = 'none';
      document.getElementById('thematic-portfolio-template').style.display = 'none';
      const tpl = document.getElementById('portfolio-builder-template');
      tpl.style.display = 'block';
      loadPortfolioBuilder();
    }
  });
}

// ───────────────────────────────────────────────────────────────────────────────
// Build the filter UI + results + analysis container
// ───────────────────────────────────────────────────────────────────────────────
function loadPortfolioBuilder() {
  portfolioFilters = [];
  const c = document.getElementById('portfolio-builder-template');
  c.innerHTML = `
    <div id="portfolio-builder-page">
      <div id="portfolio-builder-container" style="display:flex; gap:20px;">
        <!-- left column: filters + button + analysis -->
        <div id="portfolio_builder1" style="flex:1; max-width:300px;">
          <div id="portfolio-builder-steps">
            <p class="portfolio-builder-instruction">
              <button class="add-filter-btn">+</button> Add filters
            </p>
          </div>
          <div id="portfolio-builder-actions" style="margin-top:10px;">
            <button id="generate-portfolio-btn">GENERATE PORTFOLIO</button>
          </div>

          <!-- PORTFOLIO ANALYSIS PANEL -->
          <div id="portfolio-analysis-container" style="margin-top:30px;">
            <h3>PORTFOLIO ANALYSIS</h3>
            <div id="portfolio-analysis"></div>
          </div>
        </div>

        <!-- right column: just the results table -->
        <div id="portfolio_builder2" style="flex:2;">
          <div id="portfolio-results"></div>
        </div>
      </div>
    </div>
  `;

  c.addEventListener('click', e => {
    if (e.target.matches('.add-filter-btn')) {
      openFilterSelector();
    }
    if (e.target.matches('#generate-portfolio-btn')) {
      generatePortfolioNew();
    }
    if (e.target.matches('.remove-filter-btn')) {
      const i = +e.target.dataset.index;
      portfolioFilters.splice(i, 1);
      updatePortfolioSteps();
    }
  });
}

// ───────────────────────────────────────────────────────────────────────────────
// “Add filter” popup
// ───────────────────────────────────────────────────────────────────────────────
function openFilterSelector() {
  const available = [];
  const assetType = portfolioFilters[0]?.value;
  let metrics;

  if (!assetType) {
    metrics = ['Asset Class'];
  } else if (assetType === 'ETFS') {
    metrics = Object.keys(filterMappingETFs);
  } else if (assetType === 'FUTURES') {
    metrics = Object.keys(filterMappingFutures);
  } else if (assetType === 'FX') {
    metrics = Object.keys(filterMappingFX);
  } else {
    metrics = Object.keys(filterMappingStocks);
  }

  metrics.forEach(m => {
    if (m === 'Asset Class' || !portfolioFilters.some(f => f.filterName === m)) {
      available.push(m);
    }
  });

  const div = document.createElement('div');
  div.className = 'filter-selector';
  div.innerHTML = `
    <select class="filter-name">
      ${available.map(m => `<option>${m}</option>`).join('')}
    </select>
    <span class="input-container"></span>
    <button class="apply-filter-btn">Add</button>
  `;
  document.getElementById('portfolio_builder1').appendChild(div);

  const nameSel = div.querySelector('.filter-name');
  const inpDiv  = div.querySelector('.input-container');

  function renderInputs() {
    inpDiv.innerHTML = '';
    if (nameSel.value === 'Asset Class') {
      const sel = document.createElement('select');
      ['STOCKS','ETFS','FUTURES','FX'].forEach(v => {
        const o = document.createElement('option');
        o.value = v; o.textContent = v;
        sel.appendChild(o);
      });
      inpDiv.appendChild(sel);
    } else {
      const op = document.createElement('select');
      ['>=','<='].forEach(sym => {
        const x = document.createElement('option');
        x.value = sym; x.textContent = sym;
        op.appendChild(x);
      });
      const num = document.createElement('input');
      num.type = 'number';
      num.placeholder = 'Value';
      inpDiv.appendChild(op);
      inpDiv.appendChild(num);
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

// ───────────────────────────────────────────────────────────────────────────────
// Redraw “pill” list of filters
// ───────────────────────────────────────────────────────────────────────────────
function updatePortfolioSteps() {
  const steps = document.getElementById('portfolio-builder-steps');
  steps.innerHTML = '';
  portfolioFilters.forEach((f, i) => {
    const d = document.createElement('div');
    d.className = 'filter-step';
    const text = (f.filterName === 'Asset Class')
      ? `${f.filterName}: ${f.value}`
      : `${f.filterName} ${f.operator} ${f.value}`;
    d.innerHTML = `
      <span>${text}</span>
      <button class="remove-filter-btn" data-index="${i}">✕</button>
    `;
    steps.appendChild(d);
  });
  const p = document.createElement('p');
  p.className = 'portfolio-builder-instruction';
  p.innerHTML = `<button class="add-filter-btn">+</button> Add another filter`;
  steps.appendChild(p);
}

// ───────────────────────────────────────────────────────────────────────────────
// Apply filters, build table & run analysis
// ───────────────────────────────────────────────────────────────────────────────
function generatePortfolioNew() {
  // Ensure first filter is Asset Class
  if (portfolioFilters.length === 0 || portfolioFilters[0].filterName !== 'Asset Class') {
    alert('Please add the Asset Class filter as your first filter.');
    return;
  }

  const asset = portfolioFilters[0].value;
  let dataObj, mapping, priceBucket;

  if (asset === 'STOCKS') {
    dataObj      = window.stocksFullData;
    mapping      = filterMappingStocks;
    priceBucket  = window.pricesData.stockPrices;
  } else if (asset === 'ETFS') {
    dataObj      = window.etfFullData;
    mapping      = filterMappingETFs;
    priceBucket  = window.pricesData.etfPrices;
  } else if (asset === 'FUTURES') {
    dataObj      = window.futuresFullData;
    mapping      = filterMappingFutures;
    priceBucket  = window.pricesData.futuresPrices;
  } else if (asset === 'FX') {
    dataObj      = window.fxFullData;
    mapping      = filterMappingFX;
    priceBucket  = window.pricesData.fxPrices;
  } else {
    alert('Invalid asset class.');
    return;
  }

  // Filter instruments
  const results = [];
  for (const inst in dataObj) {
    const info = dataObj[inst];
    let ok = true;
    for (let i = 1; i < portfolioFilters.length; i++) {
      const filt = portfolioFilters[i];
      const map  = mapping[filt.filterName];
      if (!map) continue;
      let num;
      if (map.source) {
        const raw = map.source === 'left'
          ? info.summaryLeft[map.index]
          : info.summaryRight[map.index];
        num = parseFloat(typeof raw === 'string'
             ? raw.replace('%','')
             : raw);
      } else {
        num = parseFloat(info[map.field]);
      }
      if (isNaN(num)) { ok = false; break; }
      if (filt.operator === '>=' && num < +filt.value) { ok = false; break; }
      if (filt.operator === '<=' && num > +filt.value) { ok = false; break; }
    }
    if (ok) results.push({ instrument: inst, info });
  }

  // Render results table
  const resDiv = document.getElementById('portfolio-results');
  resDiv.innerHTML = '';
  if (!results.length) {
    resDiv.textContent = 'No instruments meet this criteria.';
    document.getElementById('portfolio-analysis').innerHTML = '';
    return;
  }
  const tbl = document.createElement('table');
  const hdr = tbl.createTHead().insertRow();
  hdr.insertCell().textContent = 'Instrument';
  portfolioFilters.slice(1).forEach(f =>
    hdr.insertCell().textContent = f.filterName
  );
  hdr.insertCell().textContent = 'FULL ANALYSIS';

  const body = tbl.createTBody();
  results.forEach(r => {
    const row = body.insertRow();
    row.insertCell().textContent = r.instrument;
    portfolioFilters.slice(1).forEach(f => {
      const map = mapping[f.filterName];
      let v;
      if (map.source) {
        v = map.source === 'left'
          ? r.info.summaryLeft[map.index]
          : r.info.summaryRight[map.index];
      } else {
        v = r.info[map.field];
      }
      row.insertCell().textContent = v != null ? v.toString() : '';
    });
    const cell = row.insertCell();
    const a = document.createElement('a');
    a.href   = `${window.location.pathname}?instrument=${encodeURIComponent(r.instrument)}`;
    a.target = '_blank';
    a.textContent = '🔗';
    cell.appendChild(a);
  });
  resDiv.appendChild(tbl);

  // Run analysis
  generatePortfolioAnalysis(results, mapping, priceBucket);
}

// ───────────────────────────────────────────────────────────────────────────────
// Compute portfolio‐level stats & render
// ───────────────────────────────────────────────────────────────────────────────
function generatePortfolioAnalysis(results, mapping, priceBucket) {
  const div = document.getElementById('portfolio-analysis');
  div.innerHTML = '';

  // 1) Helper: compute simple returns
  const calcReturns = prices => {
    const ret = [];
    for (let i = 1; i < prices.length; i++) {
      ret.push((prices[i] - prices[i-1]) / prices[i-1]);
    }
    return ret;
  };

  // 2) Helper: Pearson correlation
  const corrCoeff = (x, y) => {
    const n = Math.min(x.length, y.length);
    if (n < 2) return null;
    let sumX=0, sumY=0, sumXY=0, sumX2=0, sumY2=0;
    for (let i = 0; i < n; i++) {
      sumX  += x[i];
      sumY  += y[i];
      sumXY += x[i]*y[i];
      sumX2 += x[i]*x[i];
      sumY2 += y[i]*y[i];
    }
    const num = n*sumXY - sumX*sumY;
    const den = Math.sqrt(
      (n*sumX2 - sumX*sumX) *
      (n*sumY2 - sumY*sumY)
    );
    return den !== 0 ? num/den : null;
  };

  // 3) Portfolio Correlation
  const retsMap = {};
  results.forEach(r => {
    const pr = priceBucket[r.instrument];
    if (Array.isArray(pr) && pr.length > 1) {
      retsMap[r.instrument] = calcReturns(pr);
    }
  });
  const tickers = Object.keys(retsMap);
  const pairCorrs = [];
  for (let i = 0; i < tickers.length; i++) {
    for (let j = i+1; j < tickers.length; j++) {
      const c = corrCoeff(retsMap[tickers[i]], retsMap[tickers[j]]);
      if (c != null) pairCorrs.push(c);
    }
  }
  const avgPairCorr = pairCorrs.length
    ? pairCorrs.reduce((a,b)=>a+b,0)/pairCorrs.length
    : null;

  // 4) S&P 500 Correlation
  const spVals = results.map(r=>{
    const raw = r.info.summaryRight[0];
    return parseFloat(typeof raw==='string'?raw.replace('%',''):raw);
  }).filter(v=>!isNaN(v));
  const avgSP = spVals.length
    ? spVals.reduce((a,b)=>a+b,0)/spVals.length
    : null;

  // 5) Portfolio “value” per selected filter
  const filterMetrics = portfolioFilters.slice(1).map(f=>{
    const map = mapping[f.filterName];
    if (!map) return null;
    const vals = results.map(r=>{
      if (map.source) {
        const raw = map.source==='left'
          ? r.info.summaryLeft[map.index]
          : r.info.summaryRight[map.index];
        return parseFloat(typeof raw==='string'?raw.replace('%',''):raw);
      } else {
        return parseFloat(r.info[map.field]);
      }
    }).filter(v=>!isNaN(v));
    if (!vals.length) return null;
    const avg = vals.reduce((a,b)=>a+b,0)/vals.length;

    // detect “%”
    const sampleInfo = results.find(r=>{
      const v = map.source
        ? (map.source==='left'
           ? r.info.summaryLeft[map.index]
           : r.info.summaryRight[map.index])
        : r.info[map.field];
      return v != null;
    });
    const hasPct = sampleInfo && map.source &&
      String(
        map.source==='left'
          ? sampleInfo.info?.summaryLeft?.[map.index]
          : sampleInfo.info?.summaryRight?.[map.index]
      ).includes('%');

    return {
      name: f.filterName,
      value: hasPct ? avg.toFixed(2) + '%' : avg.toFixed(2)
    };
  }).filter(x=>x);

  // Render analysis table
  const tbl = document.createElement('table');
  const tb  = tbl.createTBody();

  if (avgPairCorr != null) {
    const row = tb.insertRow();
    row.insertCell().textContent = 'Portfolio Correlation';
    row.insertCell().textContent = avgPairCorr.toFixed(2);
  }
  if (avgSP != null) {
    const row = tb.insertRow();
    row.insertCell().textContent = 'S&P 500 Correlation';
    row.insertCell().textContent = avgSP.toFixed(2);
  }
  filterMetrics.forEach(m => {
    const row = tb.insertRow();
    row.insertCell().textContent = `${m.name} (Portfolio)`;
    row.insertCell().textContent = m.value;
  });

  div.appendChild(tbl);
}
