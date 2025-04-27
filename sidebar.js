// sidebar.js
// Group instruments into EQUITIES, ETF, FUTURES, FX with expandable submenus
export async function generateSidebarContent() {
  const sidebarList = document.getElementById('sidebar-list');
  if (!sidebarList) {
    console.error('Sidebar (#sidebar-list) not found');
    return;
  }

  // Add static entries for Portfolio Builder and Portfolio Ideas
  sidebarList.innerHTML = `
    <li class="menu-item">Portfolio Builder</li>
    <li class="menu-item">Portfolio Ideas</li>
  `;

  // Load instruments.json
  let instruments = [];
  try {
    const resp = await fetch('./instruments.json');
    instruments = await resp.json();
  } catch (err) {
    console.error('Failed to load instruments.json', err);
    return;
  }

  // Prepare grouping structures
  const data = {
    EQUITIES: { 'NYSE': [], 'NASDAQ': [], 'FTSE MIB': [], 'DAX40': [] },
    ETF:      { 'EURONEXT': [] },
    FUTURES:  [],
    FX:       { 'MAJORS': [], 'MINORS': [] }
  };

  instruments.forEach(({ ticker, asset_class, exchange }) => {
    const name = ticker;
    switch ((asset_class || '').toLowerCase()) {
      case 'equity': {
        const ex = (exchange || '').toUpperCase();
        if (data.EQUITIES[ex]) data.EQUITIES[ex].push(name);
        break;
      }
      case 'etf': {
        data.ETF['EURONEXT'].push(name);
        break;
      }
      case 'future':
      case 'futures': {
        data.FUTURES.push(name);
        break;
      }
      case 'fx': {
        const fxCat = (exchange || '').toUpperCase() === 'MAJORS' ? 'MAJORS' : 'MINORS';
        data.FX[fxCat].push(name);
        break;
      }
    }
  });

  // Utility: create expandable category with nested subcategories or direct list
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
      content.sort().forEach(item => {
        const instLi = document.createElement('li');
        instLi.classList.add('instrument-item');
        instLi.textContent = item;
        subUl.appendChild(instLi);
      });
    } else {
      for (const [subName, arr] of Object.entries(content)) {
        if (!arr.length) continue;
        const subLi = document.createElement('li');
        subLi.classList.add('expandable');
        const subToggle = document.createElement('div');
        subToggle.classList.add('toggle-btn');
        subToggle.innerHTML = `${subName} <span>+</span>`;
        subLi.appendChild(subToggle);

        const instUl = document.createElement('ul');
        instUl.classList.add('sub-list');
        arr.sort().forEach(item => {
          const instLi = document.createElement('li');
          instLi.classList.add('instrument-item');
          instLi.textContent = item;
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

  // Render instrument categories
  addCategory('EQUITIES', data.EQUITIES);
  addCategory('ETF',      data.ETF);
  addCategory('FUTURES',  data.FUTURES);
  addCategory('FX',       data.FX);
}
