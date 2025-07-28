// sidebar.js
// Group instruments into EQUITIES, ETF, FUTURES, FX with expandable submenus
// + NON-DIRECTIONAL (Relative Value / Equity Neutral / Fixed Income) from spreads.json

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
  // Load spreads.json
  // ───────────────────────────────────────
  let nonDirectionalGroups = null;
  try {
    const resp = await fetch('./spreads.json');
    const spreadsObj = await resp.json();

    if (spreadsObj && spreadsObj._groups) {
      const prettyMap = {
        relative_value: 'RELATIVE VALUE ARBITRAGE',
        equity_neutral: 'EQUITY NEUTRAL ARBITRAGE',
        fixed_income:   'FIXED INCOME ARBITRAGE'
      };

      nonDirectionalGroups = {};
      Object.values(prettyMap).forEach(k => nonDirectionalGroups[k] = []);

      for (const [pairName, grpKey] of Object.entries(spreadsObj._groups)) {
        if (HIDDEN_PAIRS.has(pairName)) continue;
        const prettyGroup = prettyMap[grpKey];
        if (!prettyGroup) continue;
        nonDirectionalGroups[prettyGroup].push(pairName);
      }

      // sort each bucket
      for (const k in nonDirectionalGroups) {
        nonDirectionalGroups[k].sort();
      }
    } else {
      const spreadsList = Object.keys(spreadsObj || {})
        .filter(k => k !== '_groups' && !HIDDEN_PAIRS.has(k));
      nonDirectionalGroups = { 'RELATIVE VALUE ARBITRAGE': spreadsList.sort() };
    }
  } catch (err) {
    console.error('Failed to load spreads.json', err);
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
      'ENERGY':         [],
      'METALS':         [],
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
    } else if (['GC','SI','HG','PL','PA','ALI'].includes(sym)) {
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
    const li     = document.createElement('li');
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
  // Render NON-DIRECTIONAL section (if available)
  // ───────────────────────────────────────
  if (nonDirectionalGroups) {
    const liND = document.createElement('li');
    liND.classList.add('expandable');
    const toggleND = document.createElement('div');
    toggleND.classList.add('toggle-btn');
    toggleND.innerHTML = `NON-DIRECTIONAL <span>+</span>`;
    liND.appendChild(toggleND);

    const subUlND = document.createElement('ul');
    subUlND.classList.add('sub-list');

    for (const [catName, arr] of Object.entries(nonDirectionalGroups)) {
      if (!arr.length) continue;
      const subLi = document.createElement('li');
      subLi.classList.add('expandable');
      const subToggle = document.createElement('div');
      subToggle.classList.add('toggle-btn');
      subToggle.innerHTML = `${catName} <span>+</span>`;
      subLi.appendChild(subToggle);

      const instUl = document.createElement('ul');
      instUl.classList.add('sub-list');
      arr.sort().forEach(pair => {
        if (HIDDEN_PAIRS.has(pair)) return;
        const instLi = document.createElement('li');
        instLi.classList.add('instrument-item');
        instLi.dataset.pair = pair;
        instLi.textContent = prettyPair(pair);
        instUl.appendChild(instLi);
      });
      subLi.appendChild(instUl);
      subUlND.appendChild(subLi);

      subToggle.addEventListener('click', () => {
        subLi.classList.toggle('expanded');
        subToggle.querySelector('span').textContent = subLi.classList.contains('expanded') ? '-' : '+';
      });
    }

    liND.appendChild(subUlND);
    toggleND.addEventListener('click', () => {
      liND.classList.toggle('expanded');
      toggleND.querySelector('span').textContent = liND.classList.contains('expanded') ? '-' : '+';
    });
    sidebarList.appendChild(liND);
  }

  // ───────────────────────────────────────
  // Add Portfolio Builder and Portfolio Ideas at bottom
  // ───────────────────────────────────────
  ['PORTFOLIO BUILDER','PORTFOLIO IDEAS'].forEach(txt => {
    const li = document.createElement('li');
    li.textContent = txt;
    sidebarList.appendChild(li);
  });
}
