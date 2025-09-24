// sidebar.js
// Left sidebar: instruments sections + NON-DIRECTIONAL (flat spreads list) + Tactical Strategies + Portfolio link

import { renderPortfolioPage } from './portfolio.js';
import { showSpread, showSpreadPage } from './spreadView.js';

function normalizeInstruments(raw) {
  if (!raw) return [];
  if (Array.isArray(raw)) return raw;
  if (Array.isArray(raw.entries)) return raw.entries;
  if (Array.isArray(raw.items)) return raw.items;
  if (typeof raw === 'object') return Object.values(raw);
  return [];
}

export async function generateSidebarContent() {
  const sidebarList = document.getElementById('sidebar-list');
  if (!sidebarList) {
    console.error('Sidebar (#sidebar-list) not found');
    return;
  }

  sidebarList.innerHTML = '';

  const HIDDEN_PAIRS = new Set([
    "SHEL.A/SHEL.B",
    "ESU25/ESZ25","GCN25/GCQ25","HGN25/HGQ25","HON25/HOQ25",
    "NGQ25/NGU25","NQU25/NQZ25","RBQ25/RBU25","RTYU25/RTYZ25",
    "SIN25/SIQ25","YMU25/YMZ25","ZBU25/ZBZ25","ZFU25/ZFZ25",
    "ZNU25/ZNZ25","ZSN25/ZSQ25","ZTU25/ZTZ25","ZWN25/ZWU25"
  ]);

  const prettyName = name => name;

  // ── instruments.json (opzionale)
  let instrumentsList = [];
  try {
    const resp = await fetch('./instruments.json');
    if (resp.ok) {
      const raw = await resp.json();
      instrumentsList = normalizeInstruments(raw);
    }
  } catch (err) {
    console.warn('Could not load instruments.json (non-blocking)', err);
  }

  // ── spreads.json
  let spreadKeys = [];
  try {
    const resp = await fetch('./spreads.json');
    if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
    const spreadsObj = await resp.json();
    spreadKeys = Object.keys(spreadsObj || {})
      .filter(k => k !== '_groups' && !String(k).startsWith('_'))
      .sort((a, b) => a.localeCompare(b));
  } catch (err) {
    console.error('Failed to load spreads.json', err);
  }

  // ── struttura gruppi
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

  // ── popolamento gruppi
  instrumentsList.forEach(inst => {
    const { name, asset_class, exchange, category, correlation_code, ticker } = inst || {};
    const display = name || ticker || '';
    const cls  = (asset_class || '').toLowerCase();
    const exch = exchange || '';
    const rawCat = category;
    const corrCode = correlation_code || '';

    switch (cls) {
      case 'equity': {
        let ex = (exch||'').toUpperCase();
        if (ex === 'BME') ex = 'BOLSA DE MADRID';
        if (data.EQUITIES[ex]) data.EQUITIES[ex].push(display);
        break;
      }
      case 'etf': {
        data.ETF['EURONEXT'].push(display);
        break;
      }
      case 'future':
      case 'futures': {
        const cat = (typeof rawCat==='string' && data.FUTURES[rawCat.toUpperCase()])
          ? rawCat.toUpperCase()
          : null;
        const bucket = cat || classifyFutureByCode(corrCode||'');
        data.FUTURES[bucket].push(display);
        break;
      }
      case 'fx': {
        const fxCat = (exch||'').toUpperCase()==='MAJORS' ? 'MAJORS' : 'MINORS';
        data.FX[fxCat].push(display);
        break;
      }
    }
  });

  // ── helper UI
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

  // ── render categorie
  addCategory('EQUITIES', data.EQUITIES);
  addCategory('ETF',      data.ETF);
  addCategory('FUTURES',  data.FUTURES);
  addCategory('FX',       data.FX);

  // ── NON-DIRECTIONAL (flat)
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
      if (HIDDEN_PAIRS.has(pair)) return;
      const item = document.createElement('li');
      item.classList.add('nd-spread', 'instrument-item');
      item.dataset.pair = pair;
      item.dataset.key = pair;
      item.textContent = pair;
      subUlND.appendChild(item);
    });

    liND.appendChild(subUlND);
    toggleND.addEventListener('click', () => {
      liND.classList.toggle('expanded');
      toggleND.querySelector('span').textContent = liND.classList.contains('expanded') ? '-' : '+';
    });

    sidebarList.appendChild(liND);
  }

  // ── Tactical Strategies (embed in #block5)
  {
    function showTacticalPage(url) {
      document.querySelectorAll('.content-block, .main-section')
        .forEach(el => (el.style.display = 'none'));

      const block5 = document.getElementById('block5');
      if (!block5) return;

      block5.style.display = 'block';
      if (getComputedStyle(block5).position === 'static') {
        block5.style.position = 'relative';
      }

      const spreadPage = document.getElementById('spread-page');
      if (spreadPage) spreadPage.style.display = 'none';

      let host = document.getElementById('tactical-embed');
      if (!host) {
        host = document.createElement('div');
        host.id = 'tactical-embed';
        host.style.position = 'absolute';
        host.style.inset = '0';
        host.style.display = 'block';

        const iframe = document.createElement('iframe');
        iframe.id = 'tactical-iframe';
        iframe.style.position = 'absolute';
        iframe.style.inset = '0';
        iframe.style.width = '100%';
        iframe.style.height = '100%';
        iframe.style.border = '0';

        host.appendChild(iframe);
        block5.appendChild(host);
      }

      const iframe = document.getElementById('tactical-iframe') || host.querySelector('iframe');
      iframe.src = url;
      host.style.display = 'block';
    }

    const liTS = document.createElement('li');
    liTS.classList.add('expandable');
    const toggleTS = document.createElement('div');
    toggleTS.classList.add('toggle-btn');
    toggleTS.innerHTML = `MARKET TIMING <span>+</span>`;
    liTS.appendChild(toggleTS);

    const subUlTS = document.createElement('ul');
    subUlTS.classList.add('sub-list');

    const ITEMS = [
      { label: 'TACTICAL EQUITY LONG-ONLY', url: 'https://backup-bt-intelligence.netlify.app/equities_long_short.html' },
      { label: 'TACTICAL FX BALANCED',      url: 'https://backup-bt-intelligence.netlify.app/fx_long_short.html' },
      { label: 'COT REPORT TS',             url: 'https://backup-bt-intelligence.netlify.app/cot.html' },
      { label: 'COT INDEX FUTURES',         url: 'https://backup-bt-intelligence.netlify.app/cot.html' },
      { label: 'TACTICAL FUTURES',          url: 'https://backup-bt-intelligence.netlify.app/futures_long_short.html' },
      { label: 'ARBITRAGE',                  url: 'https://backup-bt-intelligence.netlify.app/nondirectional-2sd.html' },
    ];

    ITEMS.forEach(({label, url}) => {
      const it = document.createElement('li');
      it.classList.add('sidebar-item', 'tactical-link');
      it.textContent = label;
      it.addEventListener('click', () => showTacticalPage(url));
      subUlTS.appendChild(it);
    });

    liTS.appendChild(subUlTS);
    toggleTS.addEventListener('click', () => {
      liTS.classList.toggle('expanded');
      toggleTS.querySelector('span').textContent = liTS.classList.contains('expanded') ? '-' : '+';
    });

    sidebarList.appendChild(liTS);
  }

  // ── Portfolio
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

  // opzionali
  ['PORTFOLIO BUILDER','PORTFOLIO IDEAS'].forEach(txt => {
    const li = document.createElement('li');
    li.textContent = txt;
    li.classList.add('sidebar-item');
    sidebarList.appendChild(li);
  });

  // click sugli spread ND: torna alla vista spread
  document.addEventListener('click', (e) => {
    if (e.target.closest('.nd-spread')) {
      const host = document.getElementById('tactical-embed');
      if (host) host.style.display = 'none';
      const block5 = document.getElementById('block5');
      if (block5) block5.style.display = 'block';
      const spreadPage = document.getElementById('spread-page');
      if (spreadPage) spreadPage.style.display = 'block';
    }
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
