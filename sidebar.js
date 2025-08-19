// sidebar.js
// Left sidebar: instruments sections + NON-DIRECTIONAL (flat spreads list) + Portfolio link

import { renderPortfolioPage } from './portfolio.js';
import { showSpread, showSpreadPage } from './spreadView.js';

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

  // ───────────────────────────────────────
  // Load instruments.json (optional groups)
  // ───────────────────────────────────────
  let instruments = [];
  try {
    const resp = await fetch('./instruments.json');
    if (resp.ok) instruments = await resp.json();
  } catch (err) {
    // Non-blocking for the NON-DIRECTIONAL requirement
    console.warn('Could not load instruments.json (non-blocking)', err);
  }

  // ───────────────────────────────────────
  // Load spreads.json (we only need flat keys)
  // ───────────────────────────────────────
  let spreadKeys = [];
  try {
    const resp = await fetch('./spreads.json');
    if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
    const spreadsObj = await resp.json();

    // Flat list: exactly the keys in spreads.json (exclude only meta-keys)
    spreadKeys = Object.keys(spreadsObj || {})
      .filter(k => k !== '_groups' && !String(k).startsWith('_'))
      .sort((a, b) => a.localeCompare(b));
  } catch (err) {
    console.error('Failed to load spreads.json', err);
  }

  // ───────────────────────────────────────
  // Prepare grouping structures for instruments (unchanged)
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
      'ENERGY':         [],
      'METALS':         [],
      'INTEREST RATES': [],
      'AGRICULTURE':    []
    },
    FX: {
      'MAJORS': [],
      'MINORS': []
    }
  };

  // Build groups from instruments.json (unchanged)
  instruments?.forEach(inst => {
    const { name, asset_class, exchange, category, correlation_code } = inst || {};
    const cls = (asset_class || '').toLowerCase();
    const exch = exchange || '';
    const rawCat = category;
    const corrCode = correlation_code || '';

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
    const li = document.createElement('li');
    li.classList.add('expandable');

    const toggle = document.createElement('div');
    toggle.classList.add('toggle-btn');
    toggle.innerHTML = `${title} <span>+</span>`;
    li.appendChild(toggle);

    const subUl = document.createElement('ul');
    subUl.classList.add('sub-list');

    if (Array.isArray(content)) {
      content.sort().forEach(it => {
        const instLi = document.createElement('li');
        instLi.classList.add('instrument-item');
        instLi.dataset.key = it;
        instLi.textContent = prettyName(it);
        subUl.appendChild(instLi);
      });
    } else if (content && typeof content === 'object') {
      for (const [sub, arr] of Object.entries(content)) {
        const subLi = document.createElement('li');
        const subToggle = document.createElement('div');
        subToggle.classList.add('toggle-btn');
        subToggle.innerHTML = `${sub} <span>+</span>`;
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
  // Render NON-DIRECTIONAL (flat)
  // ───────────────────────────────────────
  {
    const liND = document.createElement('li');
    liND.classList.add('expandable');
    const toggleND = document.createElement('div');
    toggleND.classList.add('toggle-btn');
    toggleND.innerHTML = `NON-DIRECTIONAL <span>+</span>`;
    liND.appendChild(toggleND);

    const subUlND = document.createElement('ul');
    subUlND.classList.add('sub-list');

    spreadKeys.forEach(pair => {
      const item = document.createElement('li');
      item.classList.add('nd-spread', 'instrument-item');
      item.dataset.pair = pair;
      item.dataset.key = pair;
      item.textContent = pair;            // or use a friendly map if desired
      subUlND.appendChild(item);
    });

    liND.appendChild(subUlND);
    toggleND.addEventListener('click', () => {
      liND.classList.toggle('expanded');
      toggleND.querySelector('span').textContent = liND.classList.contains('expanded') ? '-' : '+';
    });

    sidebarList.appendChild(liND);
  }

  // ───────────────────────────────────────
  // Add Portfolio link
  // ───────────────────────────────────────
  const portfolioLi = document.createElement('li');
  portfolioLi.textContent = 'PORTFOLIO';
  portfolioLi.classList.add('sidebar-item');
  portfolioLi.addEventListener('click', () => {
    document.querySelectorAll('.content-block, .main-section').forEach(el => el.style.display = 'none');
    const pst = document.getElementById('portfolios-template');
    if (pst) {
      pst.style.display = 'block';
      renderPortfolioPage?.();
    }
  });
  sidebarList.appendChild(portfolioLi);

  // Optional: other static links
  ['PORTFOLIO BUILDER','PORTFOLIO IDEAS'].forEach(txt => {
    const li = document.createElement('li');
    li.textContent = txt;
    li.classList.add('sidebar-item');
    sidebarList.appendChild(li);
  });
}

// Helper to bucket futures when category is missing
function classifyFutureByCode(code='') {
  const c = code.toUpperCase();
  if (/(ES|NQ|YM|RTY)/.test(c)) return 'EQUITY INDICES';
  if (/(CL|NG|RB|HO)/.test(c))   return 'ENERGY';
  if (/(GC|SI|HG)/.test(c))      return 'METALS';
  if (/(ZN|ZF|ZB|ZT|UB|GE)/.test(c)) return 'INTEREST RATES';
  if (/(ZS|ZC|ZW|KE|ZR|ZM|ZL)/.test(c)) return 'AGRICULTURE';
  return 'EQUITY INDICES';
}
