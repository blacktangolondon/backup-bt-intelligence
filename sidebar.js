// sidebar.js
// Group instruments into EQUITIES, ETF, FUTURES, FX with expandable submenus
// + NON-DIRECTIONAL spreads, plus new PORTFOLIO section

import { showSpread } from './spreadView.js';
import { renderPortfolioPage } from './portfolio.js';

export async function generateSidebarContent() {
  const sidebarList = document.getElementById('sidebar-list');
  if (!sidebarList) {
    console.error('Sidebar (#sidebar-list) not found');
    return;
  }

  // Clear existing content
  sidebarList.innerHTML = '';

  // ───────────────────────────────────────
  // Pairs to hide (won't appear/click)
  // ───────────────────────────────────────
  const HIDDEN_PAIRS = new Set([
    "SHEL.A/SHEL.B",
    "ESU25/ESZ25","GCN25/GCQ25","HGN25/HGQ25","HON25/HOQ25",
    "NGQ25/NGU25","NQU25/NQZ25","RBQ25/RBU25","RTYU25/RTYZ25",
    "SIN25/SIQ25","YMU25/YMZ25","ZBU25/ZBZ25","ZFU25/ZFZ25",
    "ZNU25/ZNZ25","ZSN25/ZSQ25","ZTU25/ZTZ25","ZWN25/ZWU25"
  ]);

  const prettyName = name => name;
  const prettyPair = pair => pair;

  // ───────────────────────────────────────
  // Load instruments.json
  // ───────────────────────────────────────
  let instruments = [];
  try {
    const resp = await fetch('./instruments.json');
    instruments = await resp.json();
  } catch (err) {
    console.error('Failed to load instruments.json', err);
    return;
  }

  // ───────────────────────────────────────
  // Prepare grouping structures for instruments
  // ───────────────────────────────────────
  const data = {
    EQUITIES: { 
      'NYSE': [], 'NASDAQ': [], 'FTSE MIB': [], 'DAX40': [], 'BOLSA DE MADRID': [],
      'SIX': [], 'WIENER BOERSE': [], 'CANADIAN SECURITIES EXCHANGE': [],
      'NASDAQ COPENHAGEN': [], 'NASDAQ HELSINKI': [], 'NASDAQ STOCKHOLM': []
    },
    ETF:      { 'EURONEXT': [] },
    FUTURES:  {
      'EQUITY INDICES': [],
      'ENERGY':           [],
      'METALS':           [],
      'INTEREST RATES': [],
      'AGRICULTURE':    []
    },
    FX:       { 'MAJORS': [], 'MINORS': [] }
  };

  function classifyFutureByCode(code) {
    const sym = code.split(/=|:/)[0].toUpperCase();
    if (['ES','NQ','YM','RTY','NKY','HSI','ASX','SX5E','FTMIB','CAC'].includes(sym)) {
      return 'EQUITY INDICES';
    } else if (['CL','BZ','RB','HO','NG'].includes(sym)) {
      return 'ENERGY';
    } else if (['GC','SI','HG','PL','PA'].includes(sym)) {
      return 'METALS';
    } else if (['ZB','ZN','ZF','ZT','GE','FV','TU','TY','FF'].includes(sym)) {
      return 'INTEREST RATES';
    } else if (['ZC','ZW','ZS','CC','SB','CT','LE','LH','ZM','ZO','ZR'].includes(sym)) {
      return 'AGRICULTURE';
    } else {
      return 'EQUITY INDICES';
    }
  }

  instruments.forEach(inst => {
    const name     = inst.ticker;
    const cls      = (inst.asset_class||'').toLowerCase();
    const exch     = inst.exchange;
    const rawCat   = inst.category;
    const corrCode = inst.correlation_ticker;

    switch (cls) {
      case 'equity': {
        let ex = (exch||'').toUpperCase();
        if (ex === 'BME') ex = 'BOLSA DE MADRID';
        if (data.EQUITIES[ex]) data.EQUITIES[ex].push(name);
        break;
      }
      case 'etf': {
        data.ETF['EURONEXT'].push(name);
        break;
      }
      case 'future':
      case 'futures': {
        const cat = (typeof rawCat==='string' && data.FUTURES[rawCat.toUpperCase()])
          ? rawCat.toUpperCase()
          : null;
        const bucket = cat || classifyFutureByCode(corrCode||'');
        data.FUTURES[bucket].push(name);
        break;
      }
      case 'fx': {
        const fxCat = (exch||'').toUpperCase()==='MAJORS' ? 'MAJORS' : 'MINORS';
        data.FX[fxCat].push(name);
        break;
      }
    }
  });

  // ───────────────────────────────────────
  // Utility: create expandable category
  // ───────────────────────────────────────
  function addCategory(title, content) {
    const li      = document.createElement('li');
    li.classList.add('expandable');
    const toggle = document.createElement('div');
    toggle.classList.add('toggle-btn');
    toggle.innerHTML = `${title} <span>+</span>`;
    li.appendChild(toggle);

    const subUl = document.createElement('ul');
    subUl.classList.add('sub-list');

    if (Array.isArray(content)) {
      content.sort().forEach(item => {
        const instLi = document.createElement('li');
        instLi.classList.add('instrument-item');
        instLi.dataset.key = item;
        instLi.textContent = prettyName(item);
        subUl.appendChild(instLi);
      });
    } else {
      for (const [subName, arr] of Object.entries(content)) {
        if (!arr.length) continue;
        const subLi     = document.createElement('li');
        subLi.classList.add('expandable');
        const subToggle = document.createElement('div');
        subToggle.classList.add('toggle-btn');
        subToggle.innerHTML = `${subName} <span>+</span>`;
        subLi.appendChild(subToggle);

        const instUl = document.createElement('ul');
        instUl.classList.add('sub-list');
        arr.sort().forEach(it => {
          const instLi = document.createElement('li');
          instLi.classList.add('instrument-item');
          instLi.dataset.key = it;
          instLi.textContent = prettyName(it);
          instUl.appendChild(instLi);
        });
        subLi.appendChild(instUl);
        subUl.appendChild(subLi);

        subToggle.addEventListener('click', () => {
          subLi.classList.toggle('expanded');
          subToggle.querySelector('span').textContent = subLi.classList.contains('expanded') ? '-' : '+';
        });
      }
    }

    li.appendChild(subUl);
    toggle.addEventListener('click', () => {
      li.classList.toggle('expanded');
      toggle.querySelector('span').textContent = li.classList.contains('expanded') ? '-' : '+';
    });
    sidebarList.appendChild(li);
  }

  // ───────────────────────────────────────
  // Render instrument categories
  // ───────────────────────────────────────
  addCategory('EQUITIES', data.EQUITIES);
  addCategory('ETF',      data.ETF);
  addCategory('FUTURES',  data.FUTURES);
  addCategory('FX',       data.FX);

  // ───────────────────────────────────────
  // Create NON-DIRECTIONAL section
  // ───────────────────────────────────────
  const liND = document.createElement('li');
  liND.classList.add('sidebar-item');

  const toggleND = document.createElement('div');
  toggleND.classList.add('parent-toggle');
  toggleND.textContent = 'NON-DIRECTIONAL ';
  const spanND = document.createElement('span');
  spanND.textContent = '+';
  toggleND.appendChild(spanND);
  liND.appendChild(toggleND);

  const subUlND = document.createElement('ul');
  subUlND.classList.add('sub-list');

  // Load spreads.json to get spreads
  const resp = await fetch('./spreads.json');
  if (!resp.ok) {
    console.error(`Failed to load spreads.json: HTTP ${resp.status}`);
    return;
  }
  const spreadsData = await resp.json();
  const allSpreads = Object.keys(spreadsData);

  // Filter out the hidden pairs
  const spreadPairs = allSpreads.filter(pair => !HIDDEN_PAIRS.has(pair));

  // Dynamically add all filtered spread pairs
  spreadPairs.forEach(pair => {
    const subLi = document.createElement('li');
    subLi.classList.add('sub-item');
    subLi.textContent = pair;
    subLi.dataset.pair = pair; // Store the spread pair in a data attribute
    subUlND.appendChild(subLi);

    subLi.addEventListener('click', () => {
      showSpread(pair);
    });
  });

  liND.appendChild(subUlND);
  toggleND.addEventListener('click', () => {
    liND.classList.toggle('expanded');
    spanND.textContent = liND.classList.contains('expanded') ? '-' : '+';
  });
  sidebarList.appendChild(liND);

  // ───────────────────────────────────────
  // Add Portfolio link
  // ───────────────────────────────────────
  const portfolioLi = document.createElement('li');
  portfolioLi.textContent = 'PORTFOLIO';
  portfolioLi.classList.add('sidebar-item');
  portfolioLi.addEventListener('click', () => {
    // Hide all content blocks and other main-sections
    document.querySelectorAll('.content-block, .main-section').forEach(el => el.style.display = 'none');
    // Show portfolio container and render
    const pst = document.getElementById('portfolios-template');
    pst.style.display = 'block';
    renderPortfolioPage();
  });
  sidebarList.appendChild(portfolioLi);

  // ───────────────────────────────────────
  // Add Portfolio Builder and Portfolio Ideas at bottom
  // ───────────────────────────────────────
  ['PORTFOLIO BUILDER','PORTFOLIO IDEAS'].forEach(txt => {
    const li = document.createElement('li');
    li.textContent = txt;
    sidebarList.appendChild(li);
  });
}
