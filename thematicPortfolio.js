// thematicPortfolio.js
// -----------------------------------------------------------------------------
// Pagina “Portfolio Ideas” – Thematic Portfolio (Layer 1: Risk-Profile Selection)
// -----------------------------------------------------------------------------

import { parseGap } from "./dashboard.js";
import { loadCSVData } from "./csvLoader.js";  // for future layers

/* -------------------------------------------------------------------------- */
/* 1. Header ⇄ key mapping                                                    */
/* (Retained for layer 2/3 when rendering tables)                              */
/* -------------------------------------------------------------------------- */
const headerKeyMap = {
  "Instrument":     "instrument",
  "Score":          "score",
  "Trend":          "trend",
  "Approach":       "approach",
  "Gap to Peak":    "gap",
  "Key Area":       "keyArea",
  "Correlation":    "corr",
  "Volatility":     "vol",
  "Bullish Alpha":  "bullish",
  "Bearish Alpha":  "bearish",
  "Alpha Strength": "alpha",
  "P/E":            "pe",
  "P/B":            "pb",
  "Div Yield":      "divYield",
  "ROE":            "returnOnEquity",
  "D/E":            "debtToEquity",
  "Payout Ratio":   "payout_ratio",
  "β":              "beta",
  "3-Month Return": "return3m"
};

/* -------------------------------------------------------------------------- */
/* 2. Entry point                                                             */
/* -------------------------------------------------------------------------- */
export function initThematicPortfolio() {
  const sidebar = document.getElementById("sidebar-list");
  if (!sidebar) return;

  sidebar.addEventListener("click", (e) => {
    const li = e.target.closest("li");
    if (!li) return;
    if (li.textContent.trim().toUpperCase() === "PORTFOLIO IDEAS") {
      // hide other main views
      document.getElementById("main-content").style.display = "none";
      document.getElementById("portfolio-builder-template").style.display = "none";
      // show this template
      const tpl = document.getElementById("thematic-portfolio-template");
      tpl.style.display = "block";
      // render Layer 1
      loadThematicPortfolio();
    }
  });
}

/* -------------------------------------------------------------------------- */
/* 3. Risk profiles definition (Layer 1 data)                                 */
/* -------------------------------------------------------------------------- */
const riskProfiles = [
  { id: 'very-cautious',         label: 'Very Cautious',         description: 'Capital preservation with minimal volatility.' },
  { id: 'cautious',              label: 'Cautious',               description: 'Lower-risk strategies aimed at steady returns.' },
  { id: 'cautious-balanced',     label: 'Cautious – Balanced',    description: 'A blend of defensive income and modest growth.' },
  { id: 'balanced',              label: 'Balanced',               description: 'Equal mix of growth and income.' },
  { id: 'balanced-adventurous',  label: 'Balanced – Adventurous', description: 'Tilt toward growth with some defensive cushions.' },
  { id: 'adventurous',           label: 'Adventurous',            description: 'Higher-risk, high-reward strategies.' }
];

/* -------------------------------------------------------------------------- */
/* 4. Build Layer 1                                                             */
/* -------------------------------------------------------------------------- */
function loadThematicPortfolio() {
  const tpl = document.getElementById("thematic-portfolio-template");
  if (!tpl) return;
  tpl.innerHTML = '';

  const grid = document.createElement('div');
  grid.className = 'risk-profile-grid';

  riskProfiles.forEach(profile => {
    const card = document.createElement('div');
    card.className = 'risk-profile-card';
    card.dataset.profileId = profile.id;

    const title = document.createElement('h3');
    title.textContent = profile.label;
    card.appendChild(title);

    const desc = document.createElement('p');
    desc.textContent = profile.description;
    card.appendChild(desc);

    card.addEventListener('click', () => handleProfileSelect(profile.id));
    grid.appendChild(card);
  });

  tpl.appendChild(grid);
}

/* -------------------------------------------------------------------------- */
/* 5. Handler for profile selection (stub for Layer 2)                        */
/* -------------------------------------------------------------------------- */
function handleProfileSelect(profileId) {
  console.log('Selected risk profile:', profileId);
  const tpl = document.getElementById("thematic-portfolio-template");
  if (!tpl) return;
  tpl.innerHTML = ''; // clear layer 1
  // TODO: call renderStrategyList(profileId)
}

/* -------------------------------------------------------------------------- */
/* 6. Retain loadCSVData import for future layers                             */
/* -------------------------------------------------------------------------- */

// (No other logic here; layers 2+ will re-use headerKeyMap and loadCSVData)
