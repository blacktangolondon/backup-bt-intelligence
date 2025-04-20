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

// Filter mappings for each asset class
const filterMappingStocks = {
  "Score": { source: "left", index: 0 },
  "Gap to Peak": { source: "left", index: 3 },
  "S&P500 Correlation": { source: "right", index: 0 },
  "S&P500 Volatility Ratio": { source: "right", index: 1 },
  "Bullish Alpha": { source: "right", index: 2 },
  "Bearish Alpha": { source: "right", index: 3 },
  "Alpha Strength": { source: "right", index: 4 }
};
const filterMappingETFs = { ...filterMappingStocks };
const filterMappingFutures = {
  "Score": { source: "left", index: 0 },
  "Gap to Peak": { source: "left", index: 3 },
  "S&P500 Correlation": { source: "right", index: 0 },
  "S&P500 Volatility Ratio": { source: "right", index: 1 },
  "Alpha Strength": { source: "right", index: 2 }
};
const filterMappingFX = {
  "Score": { source: "left", index: 0 },
  "Gap to Peak": { source: "left", index: 2 },
  "AVERAGE DAILY VOLATILITY": { source: "right", index: 0 },
  "FX Volatility Ratio": { source: "right", index: 1 },
  "30 DAYS PROJECTION": { source: "right", index: 2 },
  "LONG TERM - MACRO": { source: "right", index: 3 },
  "MEDIUM TERM - MATH": { source: "right", index: 4 },
  "MEDIUM TERM - STATS": { source: "right", index: 5 },
  "SHORT TERM - TECH": { source: "right", index: 6 }
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
      const i = +e.target.dataset.index; portfolioFilters.splice(i,1); updatePortfolioSteps();
    }
  });
}

// Add a filter
function openFilterSelector() {
  const available = [];
  const assetType = portfolioFilters[0]?.value;
  let metrics;
  if (!assetType) metrics = ['Asset Class'];
  else if (assetType==='FUTURES') metrics = Object.keys(filterMappingFutures);
  else if (assetType==='FX') metrics = Object.keys(filterMappingFX);
  else metrics = Object.keys(filterMappingStocks);

  // Exclude already selected
  metrics.forEach(m => {
    if (m==='Asset Class'|| !portfolioFilters.some(f=>f.filterName===m)) available.push(m);
  });

  const div = document.createElement('div'); div.className='filter-selector';
  div.innerHTML = `
    <select class="filter-name">${available.map(m=>`<option>${m}</option>`).join('')}</select>
    <span class="input-container"></span>
    <button class="apply-filter-btn">Add</button>
  `;
  document.getElementById('portfolio_builder1').appendChild(div);

  const nameSel=div.querySelector('.filter-name'), inpDiv=div.querySelector('.input-container');
  function renderInputs() {
    inpDiv.innerHTML='';
    if (nameSel.value==='Asset Class') {
      const sel = document.createElement('select'); ['STOCKS','ETFS','FUTURES','FX'].forEach(v=>{
        const o=document.createElement('option');o.value=v;o.textContent=v;sel.appendChild(o);
      }); inpDiv.appendChild(sel);
    } else {
      const op=document.createElement('select');['≥','≤'].forEach(o=>{const x=document.createElement('option');x.value=o;x.textContent=o;op.appendChild(x);});
      const num=document.createElement('input');num.type='number';num.placeholder='Value';
      inpDiv.appendChild(op);inpDiv.appendChild(num);
    }
  }
  nameSel.addEventListener('change', renderInputs); renderInputs();

  div.querySelector('.apply-filter-btn').addEventListener('click',()=>{
    const f={filterName:nameSel.value};
    if (f.filterName==='Asset Class') f.value=inpDiv.querySelector('select').value;
    else {f.operator=inpDiv.querySelector('select').value;f.value=inpDiv.querySelector('input').value;}
    portfolioFilters.push(f); updatePortfolioSteps(); div.remove();
  });
}

// Show selected filters
function updatePortfolioSteps() {
  const steps=document.getElementById('portfolio-builder-steps'); steps.innerHTML='';
  portfolioFilters.forEach((f,i)=>{
    const d=document.createElement('div');d.className='filter-step';
    let text=f.filterName+(f.filterName==='Asset Class'?`: ${f.value}`:` ${f.operator} ${f.value}`);
    d.innerHTML=`<span>${text}</span><button class="remove-filter-btn" data-index="${i}">✕</button>`;
    steps.appendChild(d);
  });
  const p=document.createElement('p');p.className='portfolio-builder-instruction';
  p.innerHTML=`<button class="add-filter-btn">+</button> Add another filter`;
  steps.appendChild(p);
}

// Apply filters and render
function generatePortfolioNew() {
  if (!portfolioFilters[0]||portfolioFilters[0].filterName!=='Asset Class'){
    return alert('Add Asset Class first');
  }
  const asset=portfolioFilters[0].value;
  const dataObj = {
    STOCKS: window.stocksFullData,
    ETFS: window.etfFullData,
    FUTURES: window.futuresFullData,
    FX: window.fxFullData
  }[asset];
  const mapping={
    STOCKS:filterMappingStocks,ETFS:filterMappingETFs,
    FUTURES:filterMappingFutures,FX:filterMappingFX
  }[asset];
  const resultsArr=[];
  Object.entries(dataObj).forEach(([name,info])=>{
    let ok=true;
    portfolioFilters.slice(1).forEach(f=>{
      const m=mapping[f.filterName]; if(!m)return;
      const raw = m.source==='left'?info.summaryLeft[m.index]:info.summaryRight[m.index];
      const val=parseFloat(raw);
      if (isNaN(val)) { ok=false; return; }
      if (f.operator==='≥'&&val<parseFloat(f.value)) ok=false;
      if (f.operator==='≤'&&val>parseFloat(f.value)) ok=false;
    });
    if(ok) resultsArr.push({name,info});
  });

  const resDiv=document.getElementById('portfolio-results');resDiv.innerHTML='';
  const tbl=document.createElement('table');
  // header
  const thead=tbl.createTHead(); const hr=thead.insertRow();
  hr.insertCell().textContent='Instrument';
  portfolioFilters.slice(1).forEach(f=>hr.insertCell().textContent=f.filterName);
  // body
  const tbody=tbl.createTBody();
  resultsArr.forEach(r=>{
    const row=tbody.insertRow(); row.insertCell().textContent=r.name;
    portfolioFilters.slice(1).forEach(f=>{
      const m=mapping[f.filterName];
      const raw=m.source==='left'?r.info.summaryLeft[m.index]:r.info.summaryRight[m.index];
      row.insertCell().textContent= raw;
    });
  });
  resDiv.appendChild(tbl);
}
