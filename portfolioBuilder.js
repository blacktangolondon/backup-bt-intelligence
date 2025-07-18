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

// Additional boolean filters: price versus key areas
const priceKeyAreaFilters = [
  "Price < Key Area 1",
  "Price < Key Area 2",
  "Price > Key Area 1",
  "Price > Key Area 2"
];

// Filter mappings for each asset class
const filterMappingStocks = {
  "Trend Score":            { source: "left",  index: 0 },
  "P/E Ratio":              { source: "right", index: 5 },
  "P/B Ratio":              { source: "right", index: 6 },
  "EPS":                    { source: "right", index: 7 },
  "Dividend Yield":         { source: "right", index: 8 },
  "Return on Equity":       { field: "return_on_equity" },
  "Debt to Equity":         { field: "debt_to_equity" },
  "Revenue Growth":         { field: "revenue_growth" },
  "Payout Ratio":           { field: "payout_ratio" },
  "Beta":                   { field: "beta" },
  "S&P500 Correlation":     { source: "right", index: 0 },
  "S&P500 Volatility Ratio":{ source: "right", index: 1 },
  "Alpha Strength":         { source: "right", index: 4 },
  "Bullish Alpha":          { source: "right", index: 2 },
  "Bearish Alpha":          { source: "right", index: 3 },
  "Gap to Peak":            { source: "left",  index: 3 }
};

const filterMappingETFs = {};
[
  "Trend Score","Alpha Strength","Bullish Alpha",
  "Bearish Alpha","S&P500 Correlation",
  "S&P500 Volatility Ratio","Gap to Peak"
].forEach(key => {
  filterMappingETFs[key] = filterMappingStocks[key];
});

const filterMappingFutures = { ...filterMappingETFs };
const filterMappingFX      = { ...filterMappingETFs };


// Extended filter mappings for each asset class
const filterMappingStocks = {
  "Trend Score":            { source: "left",  index: 0 },
  "P/E Ratio":              { source: "right", index: 5 },
  "P/B Ratio":              { source: "right", index: 6 },
  "EPS":                    { source: "right", index: 7 },
  "Dividend Yield":         { source: "right", index: 8 },
  "Return on Equity":       { field: "return_on_equity" },
  "Debt to Equity":         { field: "debt_to_equity" },
  "Revenue Growth":         { field: "revenue_growth" },
  "Payout Ratio":           { field: "payout_ratio" },
  "Beta":                   { field: "beta" },
  "S&P500 Correlation":     { source: "right", index: 0 },
  "S&P500 Volatility Ratio":{ source: "right", index: 1 },
  "Alpha Strength":         { source: "right", index: 4 },
  "Bullish Alpha":          { source: "right", index: 2 },
  "Bearish Alpha":          { source: "right", index: 3 },
  "Gap to Peak":            { source: "left",  index: 3 }
};

// Copy mappings for other classes
const filterMappingETFs = {};
["Trend Score","Alpha Strength","Bullish Alpha","Bearish Alpha","S&P500 Correlation","S&P500 Volatility Ratio","Gap to Peak"].forEach(key => {
  filterMappingETFs[key] = filterMappingStocks[key];
});
const filterMappingFutures = { ...filterMappingETFs };
const filterMappingFX      = { ...filterMappingETFs };

// Additional boolean filters: price versus key areas
const priceKeyAreaFilters = [
  "Price < Key Area 1",
  "Price < Key Area 2",
  "Price > Key Area 1",
  "Price > Key Area 2"
];

let portfolioFilters = [];

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
      portfolioFilters.splice(+e.target.dataset.index, 1);
      updatePortfolioSteps();
    }
  });
}

function openFilterSelector() {
  const available = [];
  const assetType = portfolioFilters[0]?.value;
  let metrics;
  // determine metrics list
  if (!assetType) metrics = ['Asset Class'];
  else if (assetType === 'ETFS') metrics = [...Object.keys(filterMappingETFs), ...priceKeyAreaFilters];
  else if (assetType === 'FUTURES') metrics = [...Object.keys(filterMappingFutures), ...priceKeyAreaFilters];
  else if (assetType === 'FX') metrics = [...Object.keys(filterMappingFX), ...priceKeyAreaFilters];
  else metrics = [...Object.keys(filterMappingStocks), ...priceKeyAreaFilters];

  metrics.forEach(m => {
    if (m === 'Asset Class' || !portfolioFilters.some(f => f.filterName === m)) available.push(m);
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
  const inp = div.querySelector('.input-container');
  function renderInputs() {
    inp.innerHTML = '';
    if (nameSel.value === 'Asset Class') {
      const sel = document.createElement('select');
      ['STOCKS','ETFS','FUTURES','FX'].forEach(v => {
        const o = document.createElement('option'); o.value=v; o.textContent=v;
        sel.appendChild(o);
      });
      inp.appendChild(sel);
    } else if (priceKeyAreaFilters.includes(nameSel.value)) {
      const chk = document.createElement('input'); chk.type='checkbox';
      inp.appendChild(chk);
      const lbl = document.createElement('label'); lbl.textContent='True';
      inp.appendChild(lbl);
    } else {
      const op = document.createElement('select');
      ['>=','<='].forEach(sym => { const o=document.createElement('option');o.value=sym;o.textContent=sym;op.appendChild(o);});
      const num = document.createElement('input'); num.type='number'; num.placeholder='Value';
      inp.appendChild(op); inp.appendChild(num);
    }
  }
  nameSel.addEventListener('change', renderInputs);
  renderInputs();
  div.querySelector('.apply-filter-btn').addEventListener('click', () => {
    const f = { filterName: nameSel.value };
    if (f.filterName === 'Asset Class') f.value = inp.querySelector('select').value;
    else if (priceKeyAreaFilters.includes(f.filterName)) f.value = inp.querySelector('input[type=checkbox]').checked;
    else { f.operator = inp.querySelector('select').value; f.value = inp.querySelector('input').value; }
    portfolioFilters.push(f);
    updatePortfolioSteps();
    div.remove();
  });
}

function updatePortfolioSteps() {
  const steps = document.getElementById('portfolio-builder-steps');
  steps.innerHTML = '';
  portfolioFilters.forEach((f,i) => {
    const d = document.createElement('div'); d.className='filter-step';
    let txt;
    if (f.filterName==='Asset Class') txt = `${f.filterName}: ${f.value}`;
    else if (priceKeyAreaFilters.includes(f.filterName)) txt = f.filterName;
    else txt = `${f.filterName} ${f.operator} ${f.value}`;
    d.innerHTML = `<span>${txt}</span> <button class="remove-filter-btn" data-index="${i}">✕</button>`;
    steps.appendChild(d);
  });
  const p = document.createElement('p'); p.className='portfolio-builder-instruction';
  p.innerHTML = `<button class="add-filter-btn">+</button> Add another filter`;
  steps.appendChild(p);
}

function generatePortfolioNew() {
  // Ensure first filter is asset class
  if (!portfolioFilters.length || portfolioFilters[0].filterName!=='Asset Class') {
    alert('Please add the Asset Class filter as your first filter.'); return;
  }
  const asset = portfolioFilters[0].value;
  let dataObj, mapping, priceKey;
  switch(asset) {
    case 'STOCKS':  dataObj = window.stocksFullData;  mapping = filterMappingStocks;  priceKey='stockPrices'; break;
    case 'ETFS':    dataObj = window.etfFullData;     mapping = filterMappingETFs;    priceKey='etfPrices'; break;
    case 'FUTURES': dataObj = window.futuresFullData; mapping = filterMappingFutures; priceKey='futuresPrices'; break;
    case 'FX':      dataObj = window.fxFullData;      mapping = filterMappingFX;      priceKey='fxPrices'; break;
    default:
      alert('Invalid asset class.'); return;
  }

  const results = [];
  for (const inst in dataObj) {
    const info = dataObj[inst]; let include=true;
    for (let i=1;i<portfolioFilters.length;i++) {
      const f = portfolioFilters[i];
      // Price vs key area logic
      if (priceKeyAreaFilters.includes(f.filterName)) {
        const arr = window.pricesData[priceKey][inst]||[];
        const price = arr[arr.length-1];
        const summaryStr = info.summaryLeft[4]||'';
        const [ka1,ka2] = summaryStr.split('/')
          .map(s=>parseFloat(s.trim()));
        let ok;
        switch(f.filterName) {
          case 'Price < Key Area 1': ok = price < ka1; break;
          case 'Price < Key Area 2': ok = price < ka2; break;
          case 'Price > Key Area 1': ok = price > ka1; break;
          case 'Price > Key Area 2': ok = price > ka2; break;
        }
        if (!ok) { include=false; break; }
        continue;
      }
      const map = mapping[f.filterName];
      if (!map) continue;
      let num;
      if (map.source) {
        const raw = map.source==='left' ? info.summaryLeft[map.index] : info.summaryRight[map.index];
        num = parseFloat(typeof raw==='string'?raw.replace('%',''):raw);
      } else num = parseFloat(info[map.field]);
      if (isNaN(num)
          || (f.operator==='>=' && num < +f.value)
          || (f.operator==='<=' && num > +f.value)) {
        include=false; break;
      }
    }
    if (include) results.push({inst,info});
  }

  const out = document.getElementById('portfolio-results');
  out.innerHTML = '';
  if (!results.length) { out.textContent='No instruments meet this criteria.'; return; }

  // Analysis summary
  const count = results.length;
  const avgs = portfolioFilters.slice(1).map(f=>{
    if (priceKeyAreaFilters.includes(f.filterName)) return null;
    const map = mapping[f.filterName];
    const vals = results.map(r=>{
      let v;
      if (map.source) {
        const raw = map.source==='left'?r.info.summaryLeft[map.index]:r.info.summaryRight[map.index];
        v = parseFloat(typeof raw==='string'?raw.replace('%',''):raw);
      } else v = parseFloat(r.info[map.field]);
      return isNaN(v)?0:v;
    });
    return vals.reduce((a,b)=>a+b,0)/count;
  });

  const summary = document.createElement('div'); summary.id='portfolio-summary';
  let html = `<h2 style="color:white">PORTFOLIO ANALYSIS</h2><table>`
            + `<tr><td>Count</td><td>${count}</td></tr>`;
  portfolioFilters.slice(1).forEach((f,i)=>{
    const avg = avgs[i];
    html+=`<tr><td>Avg ${f.filterName}</td><td>${avg!=null?avg.toFixed(2):'-'}</td></tr>`;
  });
  html+=`</table>`;
  summary.innerHTML = html;
  out.appendChild(summary);
}
