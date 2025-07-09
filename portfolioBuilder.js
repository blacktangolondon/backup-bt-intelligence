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
      num.type = 'number'; num.placeholder = 'Value';
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

function updatePortfolioSteps() {
  const steps = document.getElementById('portfolio-builder-steps');
  steps.innerHTML = '';
  portfolioFilters.forEach((f, i) => {
    const d = document.createElement('div');
    d.className = 'filter-step';
    const text = f.filterName +
      (f.filterName === 'Asset Class' ? `: ${f.value}` : ` ${f.operator} ${f.value}`);
    d.innerHTML = `<span>${text}</span> <button class="remove-filter-btn" data-index="${i}">✕</button>`;
    steps.appendChild(d);
  });
  const p = document.createElement('p');
  p.className = 'portfolio-builder-instruction';
  p.innerHTML = `<button class="add-filter-btn">+</button> Add another filter`;
  steps.appendChild(p);
}

function generatePortfolioNew() {
  if (portfolioFilters.length === 0 || portfolioFilters[0].filterName !== 'Asset Class') {
    alert('Please add the Asset Class filter as your first filter.');
    return;
  }
  const asset = portfolioFilters[0].value;
  let dataObj, mapping;
  if (asset === 'STOCKS') {
    dataObj = window.stocksFullData;
    mapping = filterMappingStocks;
  } else if (asset === 'ETFS') {
    dataObj = window.etfFullData;
    mapping = filterMappingETFs;
  } else if (asset === 'FUTURES') {
    dataObj = window.futuresFullData;
    mapping = filterMappingFutures;
  } else if (asset === 'FX') {
    dataObj = window.fxFullData;
    mapping = filterMappingFX;
  } else {
    alert('Invalid asset class.');
    return;
  }

  const results = [];
  for (const instrument in dataObj) {
    const info = dataObj[instrument];
    let include = true;
    for (let i = 1; i < portfolioFilters.length; i++) {
      const filt = portfolioFilters[i];
      const map  = mapping[filt.filterName];
      if (!map) continue;
      let num;
      if (map.source) {
        const raw = map.source === 'left'
          ? info.summaryLeft[map.index]
          : info.summaryRight[map.index];
        num = parseFloat(typeof raw === 'string' ? raw.replace('%','') : raw);
      } else {
        num = parseFloat(info[map.field]);
      }
      if (
        isNaN(num) ||
        (filt.operator === '>=' && num < +filt.value) ||
        (filt.operator === '<=' && num > +filt.value)
      ) {
        include = false;
        break;
      }
    }
    if (include) results.push({ instrument, info });
  }

  const resDiv = document.getElementById('portfolio-results');
  resDiv.innerHTML = '';
  if (!results.length) {
    resDiv.textContent = 'No instruments meet this criteria.';
    return;
  }

  // ——— PORTFOLIO ANALYSIS ———
  const count = results.length;
  const averages = portfolioFilters.slice(1).map(filt => {
    const map = mapping[filt.filterName];
    const vals = results.map(r => {
      let v;
      if (map.source) {
        const raw = map.source === 'left'
          ? r.info.summaryLeft[map.index]
          : r.info.summaryRight[map.index];
        v = parseFloat(typeof raw === 'string' ? raw.replace('%','') : raw);
      } else {
        v = parseFloat(r.info[map.field]);
      }
      return isNaN(v) ? 0 : v;
    });
    return vals.reduce((a, b) => a + b, 0) / count;
  });

  const summaryDiv = document.createElement('div');
  summaryDiv.id = 'portfolio-summary';

  // match detailed table styling: use no extra class & <td> cells
  let summaryHtml = `
    <h2 style="color:white">PORTFOLIO ANALYSIS</h2>
    <table>`
    + `<tr><td>Count</td><td>${count}</td></tr>`;

  portfolioFilters.slice(1).forEach((filt, i) => {
    summaryHtml += `
      <tr>
        <td>Avg ${filt.filterName}</td>
        <td>${averages[i].toFixed(2)}</td>
      </tr>`;
  });

  summaryHtml += `
    </table>`;
  summaryDiv.innerHTML = summaryHtml;
  resDiv.appendChild(summaryDiv);

  // ——— INSTRUMENT LIST ———
  const listTitle = document.createElement('h2');
  listTitle.style.color = 'white';
  listTitle.textContent = 'INSTRUMENT LIST';
  resDiv.appendChild(listTitle);

  // ——— DETAILED RESULTS TABLE ———
  const table = document.createElement('table');
  const thead = table.createTHead();
  const headerRow = thead.insertRow();
  headerRow.insertCell().textContent = 'Instrument';
  portfolioFilters.slice(1).forEach(f =>
    headerRow.insertCell().textContent = f.filterName
  );
  headerRow.insertCell().textContent = 'FULL ANALYSIS';

  const tbody = table.createTBody();
  results.forEach(r => {
    const tr = tbody.insertRow();
    tr.insertCell().textContent = r.instrument;
    portfolioFilters.slice(1).forEach(f => {
      const map = mapping[f.filterName];
      let val;
      if (map.source) {
        val = map.source === 'left'
          ? r.info.summaryLeft[map.index]
          : r.info.summaryRight[map.index];
      } else {
        val = r.info[map.field];
      }
      tr.insertCell().textContent = val != null ? val.toString() : '';
    });
    const cell = tr.insertCell();
    const link = document.createElement('a');
    link.href = `${window.location.origin + window.location.pathname}?instrument=${encodeURIComponent(r.instrument)}`;
    link.target = '_blank';
    link.textContent = '🔗';
    cell.appendChild(link);
  });

  resDiv.appendChild(table);
}
