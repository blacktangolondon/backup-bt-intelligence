/**
 * sidebar.js
 * Generates the sidebar content from static data.
 */
export const staticData = {
  STOCKS: {
    US: [
      "AMAZON", "AMD", "AMERICAN AIRLINES", "APPLE", "AT&T", "BANK OF AMERICA", "COCA COLA",
      "EXXON", "FORD", "GENERAL MOTORS", "GOOGLE", "INTEL", "META", "MICROSOFT",
      "NVIDIA", "PFIZER", "TESLA", "WARNER BROS"
    ],
    ITALY: [
      "FERRARI", "ENEL", "INTESA SAN PAOLO", "STELLANTIS", "ENI", "GENERALI", "ST MICRO",
      "TENARIS", "MONCLER", "POSTE ITALIANE", "TERNA", "PRYSMIAN", "SNAM", "LEONARDO",
      "MEDIOBANCA", "CAMPARI", "BPM", "FINECO BANK", "UNICREDIT"
    ],
    GERMANY: [
      "ADIDAS", "AIRBUS", "ALLIANZ", "BASF", "BAYER", "BMW", "COMMERZBANK", "CONTINENTAL",
      "DEUTSCHE BOERSE", "DEUTSCHE BANK", "DEUTSCHE POST", "HENKEL", "MERCEDES", "MERCK",
      "PORSCHE", "SAP", "VOLKSWAGEN", "ZALANDO"
    ]
  },
  ETFs: {
    "ARTIFICIAL INTELLIGENCE": [
      "L&G ARTIFICIAL INTELLIGENCE",
      "GLOBAL X ROBO & ARTIFICIAL",
      "WISDOMTREE ARTIFICIAL INTELLIGENCE USD"
    ],
    BATTERIES: [
      "GLOBAL X LITHIUM & BATTERY",
      "L&G BATTERY VALUE-CHAIN",
      "WISDOMTREE BATTERY SOLUTIONS"
    ],
    BIOTECH: [
      "GLOBAL X GENOMICS & BIOTECHNOL",
      "INVESCO NASDAQ BIOTECH",
      "iShares NASDAQ US BIOTECH",
      "WISDOMTREE BIOREVOLUTION"
    ],
    BONDS: [
      "ISHARES CORE EU GOVT BOND",
      "ISHARES $ TREASURY 3-7YR",
      "VANGUARD USD CORPORATE BOND"
    ],
    COMMODITIES: [
      "INVESCO BLOOMBERG COMMODITY",
      "WISDOMTREE WHEAT",
      "WISDOMTREE COFFEE",
      "WISDOMTREE CORN",
      "WISDOMTREE NATURAL GAS",
      "WISDOMTREE SUGAR",
      "WISDOMTREE COTTON",
      "WISDOMTREE WTI CRUDE OIL",
      "WISDOMTREE COPPER",
      "WISDOMTREE NICKEL",
      "WISDOMTREE ALUMINIUN"
    ],
    "ENERGY TRANSITION": [
      "AMUNDI MSCI EUR ESG BRD CTB DR",
      "L BNPP EASY LOW CARB EUROPE",
      "L&G MSCI EUROPE CLIMATE PATHWAY",
      "JPM CARBON TRAN GLB EQUITY USD"
    ],
    METAVERSE: [
      "ISHARES METAVERSE"
    ],
    "MONEY MARKET": [
      "AMNDI FED FNDS US DOLLAR CASH",
      "PIMCO US DOLLAR SHORT MATURITY",
      "XTRACKERS MSCI EU SMALLCAP"
    ],
    ROBOTICS: [
      "ISHARES AUTOMAT & ROBOTICS",
      "L&G GLOBAL ROBO AND AUTO",
      "iShares AUTOMATION & ROBOTICS"
    ],
    SEMICONDUCTORS: [
      "VANECK SEMICONDUCTOR",
      "ISHARES MSCI GLB SEMICONDUCTOR",
      "AMUNDI MSCI SEMICONDUCTORS ESG SCREENED",
      "HSBC NASDAQ GLOB SEMICONDUCTOR"
    ],
    STOCK_MARKET: [
      "ISHARES MSCI WORLD EUR HDG",
      "ISHARES S&P 500 EUR HEDGED",
      "AMUNDI NASDAQ-100 EUR",
      "AMUNDI MSCI EMERGING MARKETS III",
      "XTRACKERS MSCI EU SMALLCAP",
      "ISHARES CORE MSCI EUROPE"
    ]
  },
  SPREAD: [
    "FTSE100 / EU50", "FTSE100 / CAC40", "CAC40 / EU50", "DAX40 / EU50", "DOW30 / S&P500",
    "DOW30 / NASDAQ100", "DOW30 / RUSSELL2000", "NASDAQ100 / S&P500", "NASDAQ100 / RUSSELL2000",
    "S&P500 / RUSSELL2000", "GOLD / SILVER", "GOLD / PLATINUM", "PLATINUM / SILVER",
    "WTI / BRENT", "CORN / WHEAT", "SOYBEANS / CORN", "BITCOIN / ETHEREUM"
  ],
  FUTURES: [
    "FTSE 100", "CAC 40", "DAX40", "FTSE MIB", "EUROSTOXX50", "S&P500", "DOW JONES",
    "NASDAQ100", "RUSSELL2000", "GOLD", "SILVER", "COPPER", "WTI", "NATURAL GAS", "CORN", "SOYBEANS"
  ],
  FX: [
    "AUDCAD", "AUDJPY", "AUDNZD", "AUDUSD", "EURAUD", "EURCAD", "EURJPY", "EURUSD",
    "GBPAUD", "GBPCAD", "GBPJPY", "GBPUSD", "NZDCAD", "NZDCHF", "NZDJPY", "NZDUSD",
    "USDCAD", "USDCHF", "USDJPY"
  ],
  CRYPTO: [
    "XRP", "SOLANA", "BNB", "DOGE", "ADA", "TRX",
    "CHAINLINK", "SUI", "AVALANCHE", "STELLAR LUMENS", "SHIBA INU", "LITECOIN",
    "POLKADOT", "MANTRA", "UNISWAP", "DAI", "PEPE"
  ],
  "PORTFOLIO BUILDER": [],
  "THEMATIC PORTFOLIO": [],
  "LIVE TV": [],
  "MEMBERS CHAT": [],
  SUPPORT: []
};

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
    if (Array.isArray(items)) {
      const categoryItem = document.createElement('li');
      categoryItem.textContent = displayName;
      sidebarList.appendChild(categoryItem);
      if (items.length > 0) {
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
    } else {
      const categoryItem = document.createElement('li');
      categoryItem.classList.add('expandable');
      const toggleBtn = document.createElement('div');
      toggleBtn.classList.add('toggle-btn');
      toggleBtn.innerHTML = `${displayName} <span>+</span>`;
      categoryItem.appendChild(toggleBtn);
      const subList = document.createElement('ul');
      subList.classList.add('sub-list');
      Object.keys(items).forEach(subCategory => {
        const subCategoryItem = document.createElement('li');
        subCategoryItem.classList.add('expandable');
        const subToggleBtn = document.createElement('div');
        subToggleBtn.classList.add('toggle-btn');
        subToggleBtn.innerHTML = `${subCategory} <span>+</span>`;
        subCategoryItem.appendChild(subToggleBtn);
        const instrumentList = document.createElement('ul');
        instrumentList.classList.add('sub-list');
        items[subCategory].forEach(instrument => {
          const instrumentItem = document.createElement('li');
          instrumentItem.classList.add("instrument-item");
          instrumentItem.textContent = instrument;
          instrumentList.appendChild(instrumentItem);
        });
        subCategoryItem.appendChild(instrumentList);
        subList.appendChild(subCategoryItem);
        subToggleBtn.addEventListener('click', () => {
          subCategoryItem.classList.toggle('expanded');
          const span = subToggleBtn.querySelector('span');
          span.textContent = subCategoryItem.classList.contains('expanded') ? '-' : '+';
        });
      });
      categoryItem.appendChild(subList);
      sidebarList.appendChild(categoryItem);
      toggleBtn.addEventListener('click', () => {
        categoryItem.classList.toggle('expanded');
        const span = toggleBtn.querySelector('span');
        span.textContent = categoryItem.classList.contains('expanded') ? '-' : '+';
      });
    }
  });

  const sidebarListEl = document.getElementById("sidebar-list");
  const fullscreenPlatformItem = document.createElement("li");
  fullscreenPlatformItem.id = "sidebar-fullscreen";
  fullscreenPlatformItem.textContent = "FULL SCREEN PLATFORM";
  fullscreenPlatformItem.style.cursor = "pointer";
  fullscreenPlatformItem.style.display = "none";
  sidebarListEl.appendChild(fullscreenPlatformItem);
  fullscreenPlatformItem.addEventListener("click", (e) => {
    e.stopPropagation();
    if (!document.fullscreenElement) { document.documentElement.requestFullscreen(); }
    else { document.exitFullscreen(); }
  });
}
