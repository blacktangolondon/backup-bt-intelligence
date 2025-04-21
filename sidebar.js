/**
 * sidebar.js
 * Generates the sidebar content from instruments.json
 */

import instruments from "./instruments.json" assert { type: "json" };

const staticData = {
  STOCKS: [],
  ETFs: [],
  FUTURES: [],
  FX: [],
  CRYPTO: [],
  "PORTFOLIO BUILDER": [],
  "THEMATIC PORTFOLIO": [],
  "LIVE TV": [],
  "MEMBERS CHAT": [],
  SUPPORT: []
};

// Populate each category from instruments.json
instruments.forEach(({ ticker, asset_class }) => {
  const name = ticker;
  switch (asset_class.toLowerCase()) {
    case "equity":
      staticData.STOCKS.push(name);
      break;
    case "etf":
      staticData.ETFs.push(name);
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

export function generateSidebarContent() {
  const sidebarList = document.getElementById('sidebar-list');
  if (!sidebarList) {
    console.error("Sidebar (#sidebar-list) not found");
    return;
  }
  sidebarList.innerHTML = "";

  const skipCategories = ["SPREAD", "CRYPTO", "MEMBERS CHAT", "SUPPORT"];
  Object.keys(staticData).forEach(category => {
    if (skipCategories.includes(category)) return;
    let displayName = (category === "THEMATIC PORTFOLIO") ? "PORTFOLIO IDEAS" : category;
    const items = staticData[category];
    const categoryItem = document.createElement('li');
    categoryItem.textContent = displayName;
    sidebarList.appendChild(categoryItem);

    if (Array.isArray(items) && items.length > 0) {
      categoryItem.classList.add('expandable');
      const toggleBtn = document.createElement('div');
      toggleBtn.classList.add('toggle-btn');
      toggleBtn.innerHTML = `${displayName} <span>+</span>`;
      categoryItem.textContent = '';
      categoryItem.appendChild(toggleBtn);

      const subList = document.createElement('ul');
      subList.classList.add('sub-list');
      items.forEach(instrument => {
        const listItem = document.createElement('li');
        listItem.classList.add("instrument-item");
        listItem.textContent = instrument;
        subList.appendChild(listItem);
      });
      categoryItem.appendChild(subList);

      toggleBtn.addEventListener('click', () => {
        categoryItem.classList.toggle('expanded');
        const span = toggleBtn.querySelector('span');
        span.textContent = categoryItem.classList.contains('expanded') ? '-' : '+';
      });
    }
  });

  // Full-screen platform item
  const fullscreenItem = document.createElement("li");
  fullscreenItem.id = "sidebar-fullscreen";
  fullscreenItem.textContent = "FULL SCREEN PLATFORM";
  fullscreenItem.style.cursor = "pointer";
  fullscreenItem.style.display = "none";
  sidebarList.appendChild(fullscreenItem);
  fullscreenItem.addEventListener("click", e => {
    e.stopPropagation();
    if (!document.fullscreenElement) document.documentElement.requestFullscreen();
    else document.exitFullscreen();
  });
}
