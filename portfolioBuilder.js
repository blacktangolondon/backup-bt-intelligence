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
  const sidebarItems = document.querySelectorAll('#sidebar-list li');
  sidebarItems.forEach(item => {
    if (item.textContent.trim() === 'PORTFOLIO BUILDER') {
      item.addEventListener('click', () => {
        // Hide main dashboard and thematic portfolio
        document.getElementById('main-content').style.display = 'none';
        document.getElementById('thematic-portfolio-template').style.display = 'none';
        // Show portfolio builder template
        const tpl = document.getElementById('portfolio-builder-template');
        tpl.style.display = 'block';
        renderPortfolioBuilder();
      });
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
  // Category selector
  const categorySelect = document.createElement('select');
  ['STOCKS','ETFS','FUTURES','FX'].forEach(cat => {
    const opt = document.createElement('option');
    opt.value = cat;
    opt.textContent = cat;
    categorySelect.appendChild(opt);
  });
  leftPanel.appendChild(categorySelect);

  // Instrument selector
  const instrumentSelect = document.createElement('select');
  leftPanel.appendChild(instrumentSelect);

  function populateInstruments() {
    instrumentSelect.innerHTML = '';
    const dataObj = window[categorySelect.value.toLowerCase() + 'FullData'];
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
    const entry = dataObj[instr];
    const results = document.getElementById('portfolio-results');
    results.innerHTML = '';
    if (!entry) {
      results.textContent = 'No data found for ' + instr;
      return;
    }

    // choose labels
    let leftArr, rightArr;
    if (cat === 'STOCKS') {
      leftArr = leftLabels;
      rightArr = rightLabels;
    } else if (cat === 'ETFS') {
      leftArr = etfLeftLabels;
      rightArr = etfRightLabels;
    } else if (cat === 'FUTURES') {
      leftArr = futuresLeftLabels;
      rightArr = futuresRightLabels;
    } else {
      leftArr = fxLeftLabels;
      rightArr = fxRightLabels;
    }

    // build result table
    const tbl = document.createElement('table');
    for (let i = 0; i < leftArr.length; i++) {
      const tr = document.createElement('tr');
      const td1 = document.createElement('td'); td1.textContent = leftArr[i]; tr.appendChild(td1);
      const td2 = document.createElement('td'); td2.textContent = entry.summaryLeft[i] || ''; tr.appendChild(td2);
      const td3 = document.createElement('td'); td3.textContent = rightArr[i]; tr.appendChild(td3);
      const td4 = document.createElement('td'); td4.textContent = entry.summaryRight[i] || ''; tr.appendChild(td4);
      tbl.appendChild(tr);
    }
    results.appendChild(tbl);
  });
}
