/** 
 * sidebar.js
 * Generates the sidebar content from static data.
 * Special items (“PORTFOLIO BUILDER”, “THEMATIC PORTFOLIO” displayed as “PORTFOLIO IDEAS”, and “LIVE TV”)
 * are always rendered as clickable items even if their arrays are empty.
 */
const staticData = {
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

const specialCategories = ["PORTFOLIO BUILDER", "THEMATIC PORTFOLIO", "LIVE TV"];

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
    // For THEMATIC PORTFOLIO, display as PORTFOLIO IDEAS.
    let displayName = category === "THEMATIC PORTFOLIO" ? "PORTFOLIO IDEAS" : category;
    const items = staticData[category];
    if (specialCategories.includes(category)) {
      // Render special categories as a single clickable item.
      const itemEl = document.createElement('li');
      itemEl.classList.add("instrument-item");
      itemEl.textContent = displayName;
      sidebarList.appendChild(itemEl);
    } else if (Array.isArray(items)) {
      // Render regular categories.
      const headerItem = document.createElement('li');
      headerItem.classList.add("expandable");
      const toggleBtn = document.createElement('div');
      toggleBtn.classList.add("toggle-btn");
      toggleBtn.innerHTML = `${displayName} <span>+</span>`;
      headerItem.appendChild(toggleBtn);
      const subList = document.createElement('ul');
      subList.classList.add("sub-list");
      items.forEach(instrument => {
        const listItem = document.createElement('li');
        listItem.classList.add("instrument-item");
        listItem.textContent = instrument;
        subList.appendChild(listItem);
      });
      headerItem.appendChild(subList);
      sidebarList.appendChild(headerItem);
      toggleBtn.addEventListener('click', () => {
        headerItem.classList.toggle('expanded');
        const span = toggleBtn.querySelector('span');
        span.textContent = headerItem.classList.contains('expanded') ? '-' : '+';
      });
    } else {
      // Render object categories (if any).
      const headerItem = document.createElement('li');
      headerItem.classList.add("expandable");
      const toggleBtn = document.createElement('div');
      toggleBtn.classList.add("toggle-btn");
      toggleBtn.innerHTML = `${displayName} <span>+</span>`;
      headerItem.appendChild(toggleBtn);
      const subList = document.createElement('ul');
      subList.classList.add("sub-list");
      Object.keys(items).forEach(subCategory => {
        const subItem = document.createElement('li');
        subItem.classList.add("expandable");
        const subToggle = document.createElement('div');
        subToggle.classList.add("toggle-btn");
        subToggle.innerHTML = `${subCategory} <span>+</span>`;
        subItem.appendChild(subToggle);
        const instList = document.createElement('ul');
        instList.classList.add("sub-list");
        items[subCategory].forEach(instrument => {
          const li = document.createElement('li');
          li.classList.add("instrument-item");
          li.textContent = instrument;
          instList.appendChild(li);
        });
        subItem.appendChild(instList);
        subToggle.addEventListener('click', () => {
          subItem.classList.toggle('expanded');
          const span = subToggle.querySelector('span');
          span.textContent = subItem.classList.contains('expanded') ? '-' : '+';
        });
        subList.appendChild(subItem);
      });
      headerItem.appendChild(subList);
      sidebarList.appendChild(headerItem);
      toggleBtn.addEventListener('click', () => {
        headerItem.classList.toggle('expanded');
        const span = toggleBtn.querySelector('span');
        span.textContent = headerItem.classList.contains('expanded') ? '-' : '+';
      });
    }
  });

  // Optionally add "FULL SCREEN PLATFORM" item.
  const sidebarListEl = document.getElementById("sidebar-list");
  const fullscreenPlatformItem = document.createElement("li");
  fullscreenPlatformItem.id = "sidebar-fullscreen";
  fullscreenPlatformItem.textContent = "FULL SCREEN PLATFORM";
  fullscreenPlatformItem.style.cursor = "pointer";
  fullscreenPlatformItem.style.display = "none";
  sidebarListEl.appendChild(fullscreenPlatformItem);
  fullscreenPlatformItem.addEventListener("click", (e) => {
    e.stopPropagation();
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen();
    } else {
      document.exitFullscreen();
    }
  });
}
