// sidebar.js
/**
 * sidebar.js
 * Generates the sidebar content from instruments.json
 */
export async function generateSidebarContent() {
  const sidebarList = document.getElementById('sidebar-list');
  if (!sidebarList) {
    console.error("Sidebar (#sidebar-list) not found");
    return;
  }
  sidebarList.innerHTML = "";

  // 1. Load instruments.json
  let instruments = [];
  try {
    const resp = await fetch("./instruments.json");
    instruments = await resp.json();
  } catch (err) {
    console.error("Failed to load instruments.json", err);
    return;
  }

  // 2. Prepare grouping buckets
  const staticData = {
    STOCKS: {},   // by Exchange
    ETFs:   {},   // by Exchange
    FUTURES: [],  // flat list
    FX:      {},  // Majors/Minors
    CRYPTO:  []
  };

  // 3. Friendly names for certain exchanges
  const stockNames = {
    NYSE:   'NYSE',
    NASDAQ: 'NASDAQ',
    MIL:    'FTSE MIB',
    XETR:   'DAX 40'
  };
  const etfNames = {
    MIL:    'EURONEXT'
  };

  // 4. List of major FX pairs (TradingView format)
  const fxMajors = [
    'EURUSD=X','GBPUSD=X','USDJPY=X','USDCHF=X','USDCAD=X','AUDUSD=X','NZDUSD=X'
  ];

  // 5. Group instruments
  instruments.forEach(inst => {
    const asset = (inst.asset_class || '').toLowerCase();
    const ticker = inst.ticker;
    const tv = inst.tvSymbol || '';

    switch (asset) {
      case 'equity': {
        const exch = tv.split(':')[0] || 'Unknown';
        const name = stockNames[exch] || exch;
        if (!staticData.STOCKS[name]) staticData.STOCKS[name] = [];
        staticData.STOCKS[name].push(ticker);
        break;
      }
      case 'etf': {
        const exch = tv.split(':')[0] || 'Unknown';
        const name = etfNames[exch] || exch;
        if (!staticData.ETFs[name]) staticData.ETFs[name] = [];
        staticData.ETFs[name].push(ticker);
        break;
      }
      case 'future':
      case 'futures':
        staticData.FUTURES.push(ticker);
        break;
      case 'fx': {
        const group = fxMajors.includes(tv) ? 'MAJORS' : 'MINORS';
        if (!staticData.FX[group]) staticData.FX[group] = [];
        staticData.FX[group].push(ticker);
        break;
      }
      case 'crypto':
        staticData.CRYPTO.push(ticker);
        break;
      default:
        break;
    }
  });

  // 6. Render sidebar
  const skip = ['CRYPTO'];
  Object.entries(staticData).forEach(([category, items]) => {
    if (skip.includes(category)) return;
    const li = document.createElement('li');
    li.textContent = category;
    sidebarList.appendChild(li);

    // flat arrays: FUTURES only
    if (Array.isArray(items)) {
      if (!items.length) return;
      li.classList.add('expandable');
      const toggle = document.createElement('div');
      toggle.classList.add('toggle-btn');
      toggle.innerHTML = `${category} <span>+</span>`;
      li.textContent = '';
      li.appendChild(toggle);

      const ul = document.createElement('ul');
      ul.classList.add('sub-list');
      items.forEach(name => {
        const item = document.createElement('li');
        item.classList.add('instrument-item');
        item.textContent = name;
        ul.appendChild(item);
      });
      li.appendChild(ul);

      toggle.addEventListener('click', () => {
        const expanded = li.classList.toggle('expanded');
        toggle.querySelector('span').textContent = expanded ? '-' : '+';
      });

    } else {
      // object with subcategories: STOCKS, ETFs, FX
      if (!Object.keys(items).length) return;
      li.classList.add('expandable');
      const toggle = document.createElement('div');
      toggle.classList.add('toggle-btn');
      toggle.innerHTML = `${category} <span>+</span>`;
      li.textContent = '';
      li.appendChild(toggle);

      const subList = document.createElement('ul');
      subList.classList.add('sub-list');
      Object.entries(items).forEach(([subCat, arr]) => {
        if (!arr.length) return;
        const subLi = document.createElement('li');
        subLi.classList.add('expandable');
        const subToggle = document.createElement('div');
        subToggle.classList.add('toggle-btn');
        subToggle.innerHTML = `${subCat} <span>+</span>`;
        subLi.appendChild(subToggle);

        const instList = document.createElement('ul');
        instList.classList.add('sub-list');
        arr.forEach(name => {
          const instItem = document.createElement('li');
          instItem.classList.add('instrument-item');
          instItem.textContent = name;
          instList.appendChild(instItem);
        });
        subLi.appendChild(instList);
        subList.appendChild(subLi);

        subToggle.addEventListener('click', () => {
          const exp = subLi.classList.toggle('expanded');
          subToggle.querySelector('span').textContent = exp ? '-' : '+';
        });
      });

      li.appendChild(subList);

      toggle.addEventListener('click', () => {
        const exp = li.classList.toggle('expanded');
        toggle.querySelector('span').textContent = exp ? '-' : '+';
      });
    }
  });
}
