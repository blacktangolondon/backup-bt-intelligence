// sidebar.js
// Group instruments into EQUITIES, ETF, FUTURES, FX with expandable submenus
// + NON-DIRECTIONAL (Relative Value / Equity Neutral / Fixed Income / Calendar) from spreads.json

export async function generateSidebarContent() {
  const sidebarList = document.getElementById('sidebar-list');
  if (!sidebarList) {
    console.error('Sidebar (#sidebar-list) not found');
    return;
  }

  // Clear existing content
  sidebarList.innerHTML = '';

  // ───────────────────────────────────────
  // Display aliases (visual only)
  // ───────────────────────────────────────
  const DISPLAY_ALIAS = {
    RUSSELL2000: 'RUSSELL'
  };
  function prettyName(name) {
    return DISPLAY_ALIAS[name] || name;
  }
  function prettyPair(pair) {
    // simple replace for any alias keys
    let out = pair;
    for (const [orig, alias] of Object.entries(DISPLAY_ALIAS)) {
      out = out.replace(orig, alias);
    }
    return out;
  }

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

    // If _groups exists, build buckets, else fallback to flat list
    if (spreadsObj && spreadsObj._groups) {
      const prettyMap = {
        relative_value:   'RELATIVE VALUE ARBITRAGE',
        equity_neutral:   'EQUITY NEUTRAL ARBITRAGE',
        fixed_income:     'FIXED INCOME ARBITRAGE',
        calendar:         'CALENDAR SPREAD'
      };

      // init empty arrays
      nonDirectionalGroups = {};
      Object.values(prettyMap).forEach(k => nonDirectionalGroups[k] = []);

      for (const [pairName, grpKey] of Object.entries(spreadsObj._groups)) {
        const prettyGroup = prettyMap[grpKey] || grpKey.toUpperCase();
        if (!nonDirectionalGroups[prettyGroup]) nonDirectionalGroups[prettyGroup] = [];
        nonDirectionalGroups[prettyGroup].push(pairName);
      }

      // sort each bucket
      for (const k in nonDirectionalGroups) {
        nonDirectionalGroups[k].sort();
      }
    } else {
      // fallback: one flat list
      const spreadsList = Object.keys(spreadsObj || {}).filter(k => k !== '_groups');
      nonDirectionalGroups = { 'RELATIVE VALUE ARBITRAGE': spreadsList.sort() };
    }
  } catch (err) {
    console.error('Failed to load spreads.json', err);
    // continue without NON-DIRECTIONAL section
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

  // Helper: classify a future code if no JSON category
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
        instLi.dataset.key = item;                     // real key
        instLi.textContent = prettyName(item);         // what user sees
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
          instLi.dataset.key = it;                     // real key
          instLi.textContent = prettyName(it);         // display alias
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
    // convert pair names to pretty display but keep real in data attribute
    const prettyND = {};
    for (const [bucket, pairs] of Object.entries(nonDirectionalGroups)) {
      prettyND[bucket] = pairs.map(p => p); // keep original list
    }

    // We need a custom add because inner arrays, not objects
    const liND = document.createElement('li');
    liND.classList.add('expandable');
    const toggleND = document.createElement('div');
    toggleND.classList.add('toggle-btn');
    toggleND.innerHTML = `NON-DIRECTIONAL <span>+</span>`;
    liND.appendChild(toggleND);

    const subUlND = document.createElement('ul');
    subUlND.classList.add('sub-list');

    for (const [catName, arr] of Object.entries(prettyND)) {
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
        const instLi = document.createElement('li');
        instLi.classList.add('instrument-item');
        instLi.dataset.pair = pair;                      // real pair key
        instLi.textContent = prettyPair(pair);           // displayed
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
