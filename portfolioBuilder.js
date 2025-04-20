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

export function initPortfolioBuilder() {
  const sidebarList = document.getElementById('sidebar-list');
  if (!sidebarList) return;

  sidebarList.addEventListener('click', e => {
    const li = e.target.closest('li');
    if (!li) return;
    if (li.textContent.trim() === 'PORTFOLIO BUILDER') {
      // Hide main dashboard and thematic portfolio
      document.getElementById('main-content').style.display = 'none';
      document.getElementById('thematic-portfolio-template').style.display = 'none';
      // Show portfolio builder template
      const tpl = document.getElementById('portfolio-builder-template');
      tpl.style.display = 'block';
      renderPortfolioBuilder();
    }
  });
}

function renderPortfolioBuilder() {
  const tpl = document.getElementById('portfolio-builder-template');
  tpl.innerHTML = `
    <div id="portfolio-builder-page">
      <div id="portfolio-builder-steps"></div>
      <div id="portfolio-builder-container">
        <div id="portfolio_builder1"></div>
        <div id="portfolio_builder2"></div>
      </div>
      <div id="portfolio-builder-actions">
        <button id="generate-portfolio-btn">Generate Portfolio</button>
      </div>
      <div id="portfolio-results"></div>
    </div>
  `;

  // 1. Create filter controls
  const leftPanel = document.getElementById('portfolio_builder1');
  const categorySelect = document.createElement('select');
  ['STOCKS','ETFS','FUTURES','FX'].forEach(cat => {
    const opt = document.createElement('option');
    opt.value = cat;
    opt.textContent = cat;
    categorySelect.appendChild(opt);
  });
  leftPanel.appendChild(categorySelect);

  const instrumentSelect = document.createElement('select');
  leftPanel.appendChild(instrumentSelect);

  function populateInstruments() {
    instrumentSelect.innerHTML = '';
    const key = categorySelect.value.toLowerCase() + 'FullData';
    const dataObj = window[key];
    if (!dataObj) return;
    Object.keys(dataObj).forEach(name => {
      const opt = document.createElement('option');
      opt.value = name;
      opt.textContent = name;
      instrumentSelect.appendChild(opt);
    });
  }
  categorySelect.addEventListener('change', populateInstruments);
  populateInstruments();

  // 2. Generate button logic
  document.getElementById('generate-portfolio-btn').addEventListener('click', () => {
    const cat = categorySelect.value;
    const instr = instrumentSelect.value;
    const dataObj = window[cat.toLowerCase() + 'FullData'];
    const entry = dataObj && dataObj[instr];
    const results = document.getElementById('portfolio-results');
    results.innerHTML = '';
    if (!entry) {
      results.textContent = 'No data found for ' + instr;
      return;
    }

    // choose labels
    let leftArr, rightArr;
    switch(cat) {
      case 'STOCKS': leftArr = leftLabels; rightArr = rightLabels; break;
      case 'ETFS':   leftArr = etfLeftLabels; rightArr = etfRightLabels; break;
      case 'FUTURES':leftArr = futuresLeftLabels; rightArr = futuresRightLabels; break;
      default:       leftArr = fxLeftLabels; rightArr = fxRightLabels; break;
    }

    // build result table
    const tbl = document.createElement('table');
    for (let i = 0; i < leftArr.length; i++) {
      const tr = document.createElement('tr');
      [leftArr[i], entry.summaryLeft[i]||'', rightArr[i], entry.summaryRight[i]||""].forEach(text => {
        const td = document.createElement('td'); td.textContent = text; tr.appendChild(td);
      });
      tbl.appendChild(tr);
    }
    results.appendChild(tbl);
  });
}
