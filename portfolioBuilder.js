// portfolioBuilder.js

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

// Boolean filters: price versus key areas
const priceKeyAreaFilters = [
  "Price < Key Area 1",
  "Price < Key Area 2",
  "Price > Key Area 1",
  "Price > Key Area 2"
];

// Dynamically find which index in summaryLeft holds your “Key Areas” string.
// Falls back to index 4 if no label matches.
const keyAreaLabelIndex = leftLabels.findIndex(lbl =>
  /key area/i.test(lbl)
);
const keyAreaIdx = keyAreaLabelIndex >= 0 ? keyAreaLabelIndex : 4;

// Numeric filter mappings
const filterMappingStocks = {
  "Trend Score":             { source: "left",  index: 0 },
  "Gap to Peak":             { source: "left",  index: 3 },
  "P/E Ratio":               { source: "right", index: 5 },
  "P/B Ratio":               { source: "right", index: 6 },
  "EPS":                     { source: "right", index: 7 },
  "Dividend Yield":          { source: "right", index: 8 },
  "S&P500 Correlation":      { source: "right", index: 0 },
  "S&P500 Volatility Ratio": { source: "right", index: 1 },
  "Bullish Alpha":           { source: "right", index: 2 },
  "Bearish Alpha":           { source: "right", index: 3 },
  "Alpha Strength":          { source: "right", index: 4 },
  "Return on Equity":        { field: "return_on_equity" },
  "Debt to Equity":          { field: "debt_to_equity" },
  "Revenue Growth":          { field: "revenue_growth" },
  "Payout Ratio":            { field: "payout_ratio" },
  "Beta":                    { field: "beta" }
};

const filterMappingETFs     = {};
["Trend Score","Gap to Peak","S&P500 Correlation","S&P500 Volatility Ratio","Bullish Alpha","Bearish Alpha","Alpha Strength"]
  .forEach(key => filterMappingETFs[key] = filterMappingStocks[key]);
const filterMappingFutures  = { ...filterMappingETFs };
const filterMappingFX       = { ...filterMappingETFs };

let portfolioFilters = [];

export function initPortfolioBuilder() {
  document.getElementById('sidebar-list')?.addEventListener('click', e => {
    const li = e.target.closest('li');
    if (li?.textContent.trim().toUpperCase() === 'PORTFOLIO BUILDER') {
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
  const container = document.getElementById('portfolio-builder-template');
  container.innerHTML = `
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
        <div id="portfolio_builder2">
          <div id="portfolio-results"></div>
        </div>
      </div>
    </div>
  `;

  container.addEventListener('click', e => {
    if (e.target.matches('.add-filter-btn'))        openFilterSelector();
    if (e.target.matches('#generate-portfolio-btn')) generatePortfolioNew();
    if (e.target.matches('.remove-filter-btn')) {
      const idx = +e.target.dataset.index;
      portfolioFilters.splice(idx, 1);
      updatePortfolioSteps();
    }
  });
}

function openFilterSelector() {
  const assetType = portfolioFilters[0]?.value;
  let metrics = !assetType
    ? ['Asset Class']
    : assetType === 'ETFS'   ? Object.keys(filterMappingETFs)
    : assetType === 'FUTURES'? Object.keys(filterMappingFutures)
    : assetType === 'FX'     ? Object.keys(filterMappingFX)
    : Object.keys(filterMappingStocks);

  if (assetType) {
    metrics = [...metrics, ...priceKeyAreaFilters];
  }

  const available = metrics.filter(m =>
    m === 'Asset Class'
      ? !portfolioFilters.some(f => f.filterName === 'Asset Class')
      : !portfolioFilters.some(f => f.filterName === m)
  );

  const selector = document.createElement('div');
  selector.className = 'filter-selector';
  selector.innerHTML = `
    <select class="filter-name">
      ${available.map(m => `<option>${m}</option>`).join('')}
    </select>
    <span class="input-container"></span>
    <button class="apply-filter-btn">Add</button>
  `;
  document.getElementById('portfolio_builder1').append(selector);

  const nameSel = selector.querySelector('.filter-name');
  const inpDiv  = selector.querySelector('.input-container');

  function renderInputs() {
    inpDiv.innerHTML = '';
    if (nameSel.value === 'Asset Class') {
      const sel = document.createElement('select');
      ['STOCKS','ETFS','FUTURES','FX'].forEach(v => {
        const o = document.createElement('option');
        o.value = v; o.textContent = v;
        sel.append(o);
      });
      inpDiv.append(sel);

    } else if (priceKeyAreaFilters.includes(nameSel.value)) {
      // No extra input needed
      inpDiv.textContent = nameSel.value;

    } else {
      const op = document.createElement('select');
      ['>=','<='].forEach(sym => {
        const o = document.createElement('option');
        o.value = sym; o.textContent = sym;
        op.append(o);
      });
      const num = document.createElement('input');
      num.type = 'number'; num.placeholder = 'Value';
      inpDiv.append(op, num);
    }
  }

  nameSel.addEventListener('change', renderInputs);
  renderInputs();

  selector.querySelector('.apply-filter-btn').addEventListener('click', () => {
    const filt = { filterName: nameSel.value };
    if (filt.filterName === 'Asset Class') {
      filt.value = inpDiv.querySelector('select').value;
    } else if (priceKeyAreaFilters.includes(filt.filterName)) {
      filt.value = true;  // selecting implies “true”
    } else {
      filt.operator = inpDiv.querySelector('select').value;
      filt.value    = inpDiv.querySelector('input').value;
    }
    portfolioFilters.push(filt);
    updatePortfolioSteps();
    selector.remove();
  });
}

function updatePortfolioSteps() {
  const steps = document.getElementById('portfolio-builder-steps');
  steps.innerHTML = '';
  portfolioFilters.forEach((f, i) => {
    const div = document.createElement('div');
    div.className = 'filter-step';
    let txt;
    if (f.filterName === 'Asset Class') {
      txt = `Asset Class: ${f.value}`;
    } else if (priceKeyAreaFilters.includes(f.filterName)) {
      txt = f.filterName;
    } else {
      txt = `${f.filterName} ${f.operator} ${f.value}`;
    }
    div.innerHTML = `
      <span>${txt}</span>
      <button class="remove-filter-btn" data-index="${i}">✕</button>
    `;
    steps.append(div);
  });
  const p = document.createElement('p');
  p.className = 'portfolio-builder-instruction';
  p.innerHTML = `<button class="add-filter-btn">+</button> Add another filter`;
  steps.append(p);
}

function generatePortfolioNew() {
  if (!portfolioFilters.length || portfolioFilters[0].filterName !== 'Asset Class') {
    alert('Please add the Asset Class filter first.');
    return;
  }

  const asset = portfolioFilters[0].value;
  let dataObj, mapping, priceKey;
  switch (asset) {
    case 'STOCKS':
      dataObj  = window.stocksFullData;
      mapping  = filterMappingStocks;
      priceKey = 'stockPrices';
      break;
    case 'ETFS':
      dataObj  = window.etfFullData;
      mapping  = filterMappingETFs;
      priceKey = 'etfPrices';
      break;
    case 'FUTURES':
      dataObj  = window.futuresFullData;
      mapping  = filterMappingFutures;
      priceKey = 'futuresPrices';
      break;
    case 'FX':
      dataObj  = window.fxFullData;
      mapping  = filterMappingFX;
      priceKey = 'fxPrices';
      break;
    default:
      alert('Invalid asset class.');
      return;
  }

  const results = [];

  for (const inst in dataObj) {
    const info = dataObj[inst];
    let include = true;

    for (let i = 1; i < portfolioFilters.length; i++) {
      const f = portfolioFilters[i];

      // Handle key-area boolean filters
      if (priceKeyAreaFilters.includes(f.filterName)) {
        const prices = window.pricesData[priceKey][inst] || [];
        const price  = prices[prices.length - 1] || 0;
        const rawKA  = info.summaryLeft[keyAreaIdx] || "";
        const [ka1, ka2] = rawKA.split("/").map(s => parseFloat(s.trim()) || 0);

        let ok;
        switch (f.filterName) {
          case 'Price < Key Area 1': ok = price < ka1; break;
          case 'Price < Key Area 2': ok = price < ka2; break;
          case 'Price > Key Area 1': ok = price > ka1; break;
          case 'Price > Key Area 2': ok = price > ka2; break;
        }

        console.debug(`Filter(${f.filterName}) ${inst}: price=${price}, KA1=${ka1}, KA2=${ka2} → ${ok}`);
        if (!ok) { include = false; break; }
        continue;
      }

      // Numeric filters
      const map = mapping[f.filterName];
      if (!map) continue;

      let raw, num;
      if (map.source === "left") {
        raw = info.summaryLeft[map.index];
      } else if (map.source === "right") {
        raw = info.summaryRight[map.index];
      } else {
        raw = info[map.field];
      }

      num = parseFloat(
        typeof raw === "string" ? raw.replace(/[%\,]/g, "") : raw
      );

      if (
        isNaN(num) ||
        (f.operator === '>=' && num < +f.value) ||
        (f.operator === '<=' && num > +f.value)
      ) {
        include = false;
        break;
      }
    }

    if (include) {
      results.push({ instrument: inst, info });
    }
  }

  // Render results
  const out = document.getElementById('portfolio-results');
  out.innerHTML = "";
  if (!results.length) {
    out.textContent = 'No instruments meet this criteria.';
    return;
  }

  // Portfolio Analysis Summary
  const count = results.length;
  const averages = portfolioFilters.slice(1).map((f, idx) => {
    if (priceKeyAreaFilters.includes(f.filterName)) return null;
    const map = mapping[f.filterName];
    const vals = results.map(r => {
      let raw, v;
      if (map.source === "left")      raw = r.info.summaryLeft[map.index];
      else if (map.source === "right") raw = r.info.summaryRight[map.index];
      else                             raw = r.info[map.field];

      v = parseFloat(
        typeof raw === "string" ? raw.replace(/[%\,]/g, "") : raw
      );
      return isNaN(v) ? 0 : v;
    });
    return vals.reduce((a, b) => a + b, 0) / count;
  });

  const summaryDiv = document.createElement('div');
  summaryDiv.id = 'portfolio-summary';
  let summaryHTML = `
    <h2 style="color:white">PORTFOLIO ANALYSIS</h2>
    <table>
      <tr><td>Count</td><td>${count}</td></tr>
      ${portfolioFilters.slice(1).map((f, i) => {
        const avg = averages[i];
        return `<tr>
                  <td>Avg ${f.filterName}</td>
                  <td>${avg != null ? avg.toFixed(2) : '-'}</td>
                </tr>`;
      }).join('')}
    </table>
  `;
  summaryDiv.innerHTML = summaryHTML;
  out.appendChild(summaryDiv);

  // Detailed Instrument Table
  const listTitle = document.createElement('h2');
  listTitle.style.color = 'white';
  listTitle.textContent = 'INSTRUMENT LIST';
  out.appendChild(listTitle);

  const table = document.createElement('table');
  const thead = table.createTHead();
  const headerRow = thead.insertRow();
  headerRow.insertCell().textContent = 'Instrument';
  portfolioFilters.slice(1).forEach(f =>
    headerRow.insertCell().textContent = f.filterName
  );
  headerRow.insertCell().textContent = 'Link';

  const tbody = table.createTBody();
  results.forEach(r => {
    const tr = tbody.insertRow();
    tr.insertCell().textContent = r.instrument;

    portfolioFilters.slice(1).forEach(f => {
      const cell = tr.insertCell();
      if (priceKeyAreaFilters.includes(f.filterName)) {
        // Display Yes/No for boolean filters
        const prices = window.pricesData[priceKey][r.instrument] || [];
        const price  = prices[prices.length - 1] || 0;
        const rawKA  = r.info.summaryLeft[keyAreaIdx] || "";
        const [ka1, ka2] = rawKA.split("/").map(s => parseFloat(s.trim()) || 0);

        let val;
        switch (f.filterName) {
          case 'Price < Key Area 1': val = price < ka1; break;
          case 'Price < Key Area 2': val = price < ka2; break;
          case 'Price > Key Area 1': val = price > ka1; break;
          case 'Price > Key Area 2': val = price > ka2; break;
        }
        cell.textContent = val ? 'Yes' : 'No';

      } else {
        const map = mapping[f.filterName];
        let raw, text;
        if (map.source === "left")      raw = r.info.summaryLeft[map.index];
        else if (map.source === "right") raw = r.info.summaryRight[map.index];
        else                             raw = r.info[map.field];
        text = raw != null ? raw.toString() : '';
        cell.textContent = text;
      }
    });

    const linkCell = tr.insertCell();
    const a = document.createElement('a');
    a.href   = `${window.location.origin + window.location.pathname}?instrument=${encodeURIComponent(r.instrument)}`;
    a.target = '_blank';
    a.textContent = '🔗';
    linkCell.appendChild(a);
  });

  out.appendChild(table);
}
