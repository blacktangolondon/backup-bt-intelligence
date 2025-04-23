// sidebar.js
// Updated to group instruments into EQUITIES, ETF, FUTURES, FX with specified submenus
export async function generateSidebarContent() {
  const sidebarList = document.getElementById('sidebar-list');
  if (!sidebarList) {
    console.error('Sidebar (#sidebar-list) not found');
    return;
  }
  sidebarList.innerHTML = '';

  // 1. Load instruments.json
  let instruments = [];
  try {
    const resp = await fetch('./instruments.json');
    instruments = await resp.json();
  } catch (err) {
    console.error('Failed to load instruments.json', err);
    return;
  }

  // 2. Group instruments into main categories and subcategories
  const staticData = {
    EQUITIES: {},    // { exchange: [tickers...] }
    ETF:    {},      // { 'EURONEXT': [tickers...] }
    FUTURES: [],     // [tickers]
    FX:     {}       // { 'MAJORS' | 'MINORS': [tickers...] }
  };

  instruments.forEach(({ ticker, asset_class, exchange }) => {
    const name = ticker;
    switch ((asset_class || '').toLowerCase()) {
      case 'equity': {
        const ex = exchange || 'UNKNOWN';
        if (!staticData.EQUITIES[ex]) staticData.EQUITIES[ex] = [];
        staticData.EQUITIES[ex].push(name);
        break;
      }
      case 'etf': {
        const key = 'EURONEXT';
        if (!staticData.ETF[key]) staticData.ETF[key] = [];
        staticData.ETF[key].push(name);
        break;
      }
      case 'future':
      case 'futures': {
        staticData.FUTURES.push(name);
        break;
      }
      case 'fx': {
        const cat = (exchange || '').toUpperCase();
        if (!staticData.FX[cat]) staticData.FX[cat] = [];
        staticData.FX[cat].push(name);
        break;
      }
    }
  });

  // 3. Define rendering logic
  const renderCategory = (catName, items) => {
    const li = document.createElement('li');
    li.textContent = catName;
    sidebarList.appendChild(li);

    // If items is an array, render directly under this category
    if (Array.isArray(items)) {
      items.sort().forEach(inst => {
        const itemLi = document.createElement('li');
        itemLi.classList.add('instrument-item');
        itemLi.textContent = inst;
        sidebarList.appendChild(itemLi);
      });
      return;
    }

    // Otherwise items is an object of subcategories
    li.classList.add('expandable');
    const toggle = document.createElement('div');
    toggle.classList.add('toggle-btn');
    toggle.innerHTML = `${catName} <span>+</span>`;
    li.textContent = '';
    li.appendChild(toggle);

    const subUl = document.createElement('ul');
    subUl.classList.add('sub-list');

    Object.entries(items).forEach(([subName, arr]) => {
      const subLi = document.createElement('li');
      subLi.classList.add('expandable');
      const subToggle = document.createElement('div');
      subToggle.classList.add('toggle-btn');
      subToggle.innerHTML = `${subName} <span>+</span>`;
      subLi.appendChild(subToggle);

      const instList = document.createElement('ul');
      instList.classList.add('sub-list');
      arr.sort().forEach(inst => {
        const instItem = document.createElement('li');
        instItem.classList.add('instrument-item');
        instItem.textContent = inst;
        instList.appendChild(instItem);
      });
      subLi.appendChild(instList);
      subUl.appendChild(subLi);

      subToggle.addEventListener('click', () => {
        subLi.classList.toggle('expanded');
        subToggle.querySelector('span').textContent = subLi.classList.contains('expanded') ? '-' : '+';
      });
    });

    li.appendChild(subUl);

    toggle.addEventListener('click', () => {
      li.classList.toggle('expanded');
      toggle.querySelector('span').textContent = li.classList.contains('expanded') ? '-' : '+';
    });
  };

  // 4. Render all main categories in desired order
  renderCategory('EQUITIES', staticData.EQUITIES);
  renderCategory('ETF',     staticData.ETF);
  renderCategory('FUTURES', staticData.FUTURES);
  renderCategory('FX',      staticData.FX);
}
