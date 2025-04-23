// sidebar.js
// Updated to group instruments into EQUITIES, ETF, FUTURES, FX with explicit submenus
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

  // 2. Prepare data structures
  const staticData = {
    EQUITIES: { 'NYSE': [], 'NASDAQ': [], 'FTSE MIB': [], 'DAX40': [] },
    ETF:      { 'EURONEXT': [] },
    FUTURES:  [],
    FX:       { 'MAJORS': [], 'MINORS': [] }
  };

  // 3. Group instruments
  instruments.forEach(({ ticker, asset_class, exchange }) => {
    const name = ticker;
    const cls = (asset_class || '').toLowerCase();
    switch (cls) {
      case 'equity': {
        const ex = (exchange || '').toUpperCase();
        if (staticData.EQUITIES[ex]) {
          staticData.EQUITIES[ex].push(name);
        }
        break;
      }
      case 'etf': {
        staticData.ETF['EURONEXT'].push(name);
        break;
      }
      case 'future':
      case 'futures': {
        staticData.FUTURES.push(name);
        break;
      }
      case 'fx': {
        const fxCat = (exchange || '').toUpperCase() === 'MAJORS' ? 'MAJORS' : 'MINORS';
        staticData.FX[fxCat].push(name);
        break;
      }
    }
  });

  // 4. Helper to create category header
  function createCategoryLi(title) {
    const li = document.createElement('li');
    li.textContent = title;
    sidebarList.appendChild(li);
    return li;
  }

  // 5. Render EQUITIES with submenus
  {
    const catLi = createCategoryLi('EQUITIES');
    catLi.classList.add('expandable');
    const toggle = document.createElement('div');
    toggle.classList.add('toggle-btn');
    toggle.innerHTML = 'EQUITIES <span>+</span>';
    catLi.textContent = '';
    catLi.appendChild(toggle);

    const subUl = document.createElement('ul');
    subUl.classList.add('sub-list');
    ['NYSE','NASDAQ','FTSE MIB','DAX40'].forEach(ex => {
      const arr = staticData.EQUITIES[ex];
      if (!arr.length) return;
      const subLi = document.createElement('li');
      subLi.classList.add('expandable');
      const subToggle = document.createElement('div');
      subToggle.classList.add('toggle-btn');
      subToggle.innerHTML = `${ex} <span>+</span>`;
      subLi.appendChild(subToggle);

      const instUl = document.createElement('ul');
      instUl.classList.add('sub-list');
      arr.sort().forEach(inst => {
        const instLi = document.createElement('li');
        instLi.classList.add('instrument-item');
        instLi.textContent = inst;
        instUl.appendChild(instLi);
      });
      subLi.appendChild(instUl);
      subUl.appendChild(subLi);

      subToggle.addEventListener('click', () => {
        subLi.classList.toggle('expanded');
        subToggle.querySelector('span').textContent = subLi.classList.contains('expanded') ? '-' : '+';
      });
    });

    catLi.appendChild(subUl);
    toggle.addEventListener('click', () => {
      catLi.classList.toggle('expanded');
      toggle.querySelector('span').textContent = catLi.classList.contains('expanded') ? '-' : '+';
    });
  }

  // 6. Render ETF
  {
    const catLi = createCategoryLi('ETF');
    catLi.classList.add('expandable');
    const toggle = document.createElement('div');
    toggle.classList.add('toggle-btn');
    toggle.innerHTML = 'ETF <span>+</span>';
    catLi.textContent = '';
    catLi.appendChild(toggle);

    const subUl = document.createElement('ul');
    subUl.classList.add('sub-list');
    const subLi = document.createElement('li');
    subLi.classList.add('expandable');
    const subToggle = document.createElement('div');
    subToggle.classList.add('toggle-btn');
    subToggle.innerHTML = `EURONEXT <span>+</span>`;
    subLi.appendChild(subToggle);

    const instUl = document.createElement('ul');
    instUl.classList.add('sub-list');
    staticData.ETF['EURONEXT'].sort().forEach(inst => {
      const instLi = document.createElement('li');
      instLi.classList.add('instrument-item');
      instLi.textContent = inst;
      instUl.appendChild(instLi);
    });
    subLi.appendChild(instUl);
    subUl.appendChild(subLi);

    catLi.appendChild(subUl);
    subToggle.addEventListener('click', () => {
      subLi.classList.toggle('expanded');
      subToggle.querySelector('span').textContent = subLi.classList.contains('expanded') ? '-' : '+';
    });
    toggle.addEventListener('click', () => {
      catLi.classList.toggle('expanded');
      toggle.querySelector('span').textContent = catLi.classList.contains('expanded') ? '-' : '+';
    });
  }

  // 7. Render FUTURES with submenu
  {
    const catLi = createCategoryLi('FUTURES');
    catLi.classList.add('expandable');
    const toggle = document.createElement('div');
    toggle.classList.add('toggle-btn');
    toggle.innerHTML = 'FUTURES <span>+</span>';
    catLi.textContent = '';
    catLi.appendChild(toggle);

    const subUl = document.createElement('ul');
    subUl.classList.add('sub-list');
    staticData.FUTURES.sort().forEach(inst => {
      const instLi = document.createElement('li');
      instLi.classList.add('instrument-item');
      instLi.textContent = inst;
      subUl.appendChild(instLi);
    });

    catLi.appendChild(subUl);
    toggle.addEventListener('click', () => {
      catLi.classList.toggle('expanded');
      toggle.querySelector('span').textContent = catLi.classList.contains('expanded') ? '-' : '+';
    });
  }

  // 8. Render FX
  {
    const catLi = createCategoryLi('FX');
    catLi.classList.add('expandable');
    const toggle = document.createElement('div');
    toggle.classList.add('toggle-btn');
    toggle.innerHTML = 'FX <span>+</span>';
    catLi.textContent = '';
    catLi.appendChild(toggle);

    const subUl = document.createElement('ul');
    subUl.classList.add('sub-list');
    ['MAJORS','MINORS'].forEach(key => {
      const arr = staticData.FX[key];
      if (!arr.length) return;
      const subLi = document.createElement('li');
      subLi.classList.add('expandable');
      const subToggle = document.createElement('div');
      subToggle.classList.add('toggle-btn');
      subToggle.innerHTML = `${key} <span>+</span>`;
      subLi.appendChild(subToggle);

      const instUl = document.createElement('ul');
      instUl.classList.add('sub-list');
      arr.sort().forEach(inst => {
        const instLi = document.createElement('li');
        instLi.classList.add('instrument-item');
        instLi.textContent = inst;
        instUl.appendChild(instLi);
      });
      subLi.appendChild(instUl);
      subUl.appendChild(subLi);

      subToggle.addEventListener('click', () => {
        subLi.classList.toggle('expanded');
        subToggle.querySelector('span').textContent = subLi.classList.contains('expanded') ? '-' : '+';
      });
    });

    catLi.appendChild(subUl);
    toggle.addEventListener('click', () => {
      catLi.classList.toggle('expanded');
      toggle.querySelector('span').textContent = catLi.classList.contains('expanded') ? '-' : '+';
    });
  }
}
