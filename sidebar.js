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

  // 1. Load instruments.json via fetch
  let instruments = [];
  try {
    const resp = await fetch("./instruments.json");
    instruments = await resp.json();
  } catch (err) {
    console.error("Failed to load instruments.json", err);
  }

  // 2. Group by asset_class, but for STOCKS by region, for ETFs by sector
  const staticData = {
    STOCKS: {},   // { regionName: [tickers...] }
    ETFs:   {},   // { sectorName:  [tickers...] }
    FUTURES: [],
    FX:      [],
    CRYPTO:  []
  };

  instruments.forEach(({ ticker, asset_class, region, sector }) => {
    const name = ticker;
    switch ((asset_class || "").toLowerCase()) {
      case "equity":
        const r = region || "Unknown";
        if (!staticData.STOCKS[r]) staticData.STOCKS[r] = [];
        staticData.STOCKS[r].push(name);
        break;

      case "etf":
        const s = sector || "Unknown";
        if (!staticData.ETFs[s]) staticData.ETFs[s] = [];
        staticData.ETFs[s].push(name);
        break;

      case "future":
      case "futures":
        staticData.FUTURES.push(name);
        break;

      case "fx":
        staticData.FX.push(name);
        break;

      case "crypto":
        staticData.CRYPTO.push(name);
        break;
    }
  });

  // 3. Render sidebar categories and sub‑categories
  //    CRYPTO you can skip if you like
  const skip = ["CRYPTO"];
  Object.entries(staticData).forEach(([category, items]) => {
    if (skip.includes(category)) return;
    const displayName = category;
    const li = document.createElement("li");
    li.textContent = displayName;
    sidebarList.appendChild(li);

    // if items is a flat array (FUTURES / FX) → render exactly as before
    if (Array.isArray(items)) {
      if (items.length) {
        li.classList.add('expandable');
        const toggle = document.createElement('div');
        toggle.classList.add('toggle-btn');
        toggle.innerHTML = `${displayName} <span>+</span>`;
        li.textContent = "";
        li.appendChild(toggle);

        const ul = document.createElement('ul');
        ul.classList.add('sub-list');
        items.forEach(inst => {
          const item = document.createElement('li');
          item.classList.add('instrument-item');
          item.textContent = inst;
          ul.appendChild(item);
        });
        li.appendChild(ul);

        toggle.addEventListener('click', () => {
          li.classList.toggle('expanded');
          toggle.querySelector("span").textContent =
            li.classList.contains("expanded") ? "-" : "+";
        });
      }

    } else {
      // items is an object ⇒ render each key as a sub‑category
      li.classList.add('expandable');
      const toggle = document.createElement('div');
      toggle.classList.add('toggle-btn');
      toggle.innerHTML = `${displayName} <span>+</span>`;
      li.textContent = "";
      li.appendChild(toggle);

      const subList = document.createElement('ul');
      subList.classList.add('sub-list');

      Object.entries(items).forEach(([subCategory, arr]) => {
        const subLi = document.createElement('li');
        subLi.classList.add('expandable');
        const subToggle = document.createElement('div');
        subToggle.classList.add('toggle-btn');
        subToggle.innerHTML = `${subCategory} <span>+</span>`;
        subLi.appendChild(subToggle);

        const instList = document.createElement('ul');
        instList.classList.add('sub-list');
        arr.forEach(inst => {
          const instItem = document.createElement('li');
          instItem.classList.add('instrument-item');
          instItem.textContent = inst;
          instList.appendChild(instItem);
        });
        subLi.appendChild(instList);
        subList.appendChild(subLi);

        subToggle.addEventListener('click', () => {
          subLi.classList.toggle('expanded');
          subToggle.querySelector("span").textContent =
            subLi.classList.contains("expanded") ? "-" : "+";
        });
      });

      li.appendChild(subList);

      toggle.addEventListener('click', () => {
        li.classList.toggle('expanded');
        toggle.querySelector("span").textContent =
          li.classList.contains("expanded") ? "-" : "+";
      });
    }
  });
}
