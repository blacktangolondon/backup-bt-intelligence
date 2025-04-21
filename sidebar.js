import instruments from "./instruments.json" assert { type: "json" };

// Group instruments by asset class
function groupInstruments() {
  return instruments.reduce((acc, { ticker, asset_class }) => {
    const key = asset_class.toUpperCase();
    if (!acc[key]) acc[key] = [];
    acc[key].push(ticker);
    return acc;
  }, {});
}

// Map JSON asset classes to sidebar display names
const displayNames = {
  EQUITY: "STOCKS",
  ETF: "ETFS",
  FUTURES: "FUTURES",
  FX: "FX",
  CRYPTO: "CRYPTO"
};

export function generateSidebarContent() {
  const sidebarList = document.getElementById('sidebar-list');
  if (!sidebarList) {
    console.error("Sidebar (#sidebar-list) not found");
    return;
  }
  sidebarList.innerHTML = "";

  const grouped = groupInstruments();
  const skip = ["SPREAD", "MEMBERS CHAT", "SUPPORT"];

  Object.keys(grouped).forEach(assetClass => {
    if (skip.includes(assetClass)) return;
    const instrumentsList = grouped[assetClass];
    if (!instrumentsList.length) return;

    const displayName = displayNames[assetClass] || assetClass;
    const categoryItem = document.createElement('li');
    categoryItem.classList.add('expandable');

    const toggleBtn = document.createElement('div');
    toggleBtn.classList.add('toggle-btn');
    toggleBtn.innerHTML = `${displayName} <span>+</span>`;
    categoryItem.appendChild(toggleBtn);

    const subList = document.createElement('ul');
    subList.classList.add('sub-list');
    instrumentsList.forEach(name => {
      const listItem = document.createElement('li');
      listItem.classList.add('instrument-item');
      listItem.textContent = name;
      subList.appendChild(listItem);
    });
    categoryItem.appendChild(subList);
    sidebarList.appendChild(categoryItem);

    toggleBtn.addEventListener('click', () => {
      categoryItem.classList.toggle('expanded');
      const span = toggleBtn.querySelector('span');
      span.textContent = categoryItem.classList.contains('expanded') ? '-' : '+';
    });
  });

  // Full Screen Platform button
  const fullscreenItem = document.createElement('li');
  fullscreenItem.id = 'sidebar-fullscreen';
  fullscreenItem.textContent = 'FULL SCREEN PLATFORM';
  fullscreenItem.classList.add('expandable');
  fullscreenItem.style.cursor = 'pointer';
  fullscreenItem.style.display = 'none';
  fullscreenItem.addEventListener('click', e => {
    e.stopPropagation();
    if (!document.fullscreenElement) document.documentElement.requestFullscreen();
    else document.exitFullscreen();
  });
  sidebarList.appendChild(fullscreenItem);
}
