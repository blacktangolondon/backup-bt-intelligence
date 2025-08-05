// thematicPortfolio_C.js
// -----------------------------------------------------------------------------
// Combined Portfolio Ideas - Data Processing + UI Content
// -----------------------------------------------------------------------------

// Imports from original code A (assuming these are available in the project)
// import { parseGap } from "./dashboard.js";
// import { loadCSVData } from "./csvLoader.js";

/* -------------------------------------------------------------------------- */
/* 1. Header  ⇄  key mapping                                                  */
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
/* 2. Risk profiles                                                           */
/* -------------------------------------------------------------------------- */
const riskProfiles = [
  { id: 'very-cautious',        label: 'Very Cautious',         description: 'Capital preservation with minimal volatility.' },
  { id: 'cautious',             label: 'Cautious',               description: 'Lower-risk strategies aimed at steady returns.' },
  { id: 'cautious-balanced',    label: 'Cautious – Balanced',    description: 'A blend of defensive income and modest growth.' },
  { id: 'balanced',             label: 'Balanced',               description: 'Equal mix of growth and income.' },
  { id: 'balanced-adventurous', label: 'Balanced – Adventurous', description: 'Tilt toward growth with some defensive cushions.' },
  { id: 'adventurous',          label: 'Adventurous',            description: 'Higher-risk, high-reward strategies.' },
];

/* -------------------------------------------------------------------------- */
/* 3. Entry point                                                             */
/* -------------------------------------------------------------------------- */
export function initThematicPortfolio() {
  // This function now only focuses on rendering the risk profiles directly
  // without interacting with sidebar or other main content sections.
  const tpl = document.getElementById("thematic-portfolio-template");
  if (tpl) { // Ensure the template element exists
    tpl.style.display = "block"; // Show our container
    loadThematicPortfolioUI(); // Render the UI content
  } else {
    console.error("Element with ID 'thematic-portfolio-template' not found.");
  }
}

/* -------------------------------------------------------------------------- */
/* 4. Layer 1 UI renderer                                                     */
/* -------------------------------------------------------------------------- */
function loadThematicPortfolioUI() {
  const tpl = document.getElementById("thematic-portfolio-template");
  if (!tpl) return;

  tpl.innerHTML = ""; // Clear existing content
  const grid = document.createElement("div");
  grid.className = "risk-profile-grid";

  riskProfiles.forEach(p => {
    const card = document.createElement("div");
    card.className = "risk-profile-card";
    card.dataset.profileId = p.id;

    const h3 = document.createElement("h3");
    h3.textContent = p.label;
    card.appendChild(h3);

    const pDesc = document.createElement("p");
    pDesc.textContent = p.description;
    card.appendChild(pDesc);

    // Removed the event listener to detach functionality
    // card.addEventListener("click", () => handleProfileSelect(p.id));

    grid.appendChild(card);
  });
  tpl.appendChild(grid);
}

/* -------------------------------------------------------------------------- */
/* 5. Data Processing and Filtering Logic                                     */
/* -------------------------------------------------------------------------- */
async function processThematicPortfolioData() {
  // Simulate imports if they were available, otherwise these will be undefined
  const parseGap = (value) => parseFloat(value.replace('%', '')) || 0; // Simple mock for parseGap
  const loadCSVData = async () => ({ etfPrices: {} }); // Simple mock for loadCSVData

  // Mock window global data if not provided by the environment
  if (!window.stocksFullData) window.stocksFullData = {};
  if (!window.etfFullData) window.etfFullData = {};
  if (!window.futuresFullData) window.futuresFullData = {};
  if (!window.fxFullData) window.fxFullData = {};

  /* ------------------------------------------------------------------ */
  /* 5.1. Merge fundamentals (once)                                     */
  /* ------------------------------------------------------------------ */
  if (!window.__fundamentalsMerged__) {
    try {
      // This fetch call is kept as it's part of the data processing functionality
      // but its success depends on 'instruments.json' being available.
      const res = await fetch("./instruments.json");
      const instruments = await res.json();
      const byTicker = Object.fromEntries(instruments.map(o => [o.ticker.trim(), o]));
      for (const [tic, rec] of Object.entries(window.stocksFullData)) {
        const f = byTicker[tic.trim()];
        if (!f) continue;
        Object.assign(rec, {
          pe_ratio:         f.pe_ratio,
          pb_ratio:         f.pb_ratio,
          div_yield:        f.div_yield,
          return_on_equity: f.return_on_equity,
          debt_to_equity:   f.debt_to_equity,
          payout_ratio:     f.payout_ratio,
          beta:             f.beta
        });
      }
      window.__fundamentalsMerged__ = true;
      console.log("Fundamentals merged successfully.");
    } catch (err) {
      console.error("Merge fundamentals failed:", err);
    }
  }

  /* ------------------------------------------------------------------ */
  /* 5.2. STOCKS dataset                                                */
  /* ------------------------------------------------------------------ */
  const stocksData = Object.entries(window.stocksFullData).map(([inst, info]) => ({
    instrument:       inst,
    score:            parseFloat(info.summaryLeft ? info.summaryLeft[0] : 0),
    trend:            info.summaryLeft ? info.summaryLeft[1] : '',
    approach:         info.summaryLeft ? info.summaryLeft[2] : '',
    gap:              parseGap(info.summaryLeft ? info.summaryLeft[3] : '0%'),
    keyArea:          info.summaryLeft ? info.summaryLeft[4] : '',
    corr:             parseFloat(info.summaryRight ? info.summaryRight[0] : 0),
    vol:              parseFloat(info.summaryRight ? info.summaryRight[1] : 0),
    bullish:          parseFloat(info.summaryRight ? info.summaryRight[2] : 0),
    bearish:          parseFloat(info.summaryRight ? info.summaryRight[3] : 0),
    alpha:            parseFloat(info.summaryRight ? info.summaryRight[4] : 0),
    pe:               info.pe_ratio         != null ? parseFloat(info.pe_ratio)        : null,
    pb:               info.pb_ratio         != null ? parseFloat(info.pb_ratio)        : null,
    divYield:         info.div_yield        != null ? parseFloat(info.div_yield)       : null,
    returnOnEquity:   info.return_on_equity != null ? parseFloat(info.return_on_equity): null,
    debtToEquity:     info.debt_to_equity   != null ? parseFloat(info.debt_to_equity)  : null,
    payout_ratio:     info.payout_ratio     != null ? parseFloat(info.payout_ratio)    : null,
    beta:             info.beta             != null ? parseFloat(info.beta)            : null
  }));

  /* ------------------------------------------------------------------ */
  /* 5.3. STOCKS thematic filters                                       */
  /* ------------------------------------------------------------------ */
  const valueStocks = stocksData.filter(d =>
    d.pe !== null && d.pe < 15 &&
    d.pb !== null && d.pb < 2 &&
    d.divYield >= 2 &&
    d.debtToEquity < 50 &&
    d.returnOnEquity > 0.15
  );
  const dividendDefensiveStocks = stocksData.filter(d =>
    d.score === 100 && d.divYield >= 3 && d.payout_ratio < 0.6 && d.beta < 1
  );
  const momentumStocks = stocksData.filter(d =>
    d.score === 100 && d.bullish > 1 && d.bearish < 1 && d.alpha > 1
  );
  const lowVolStocks = stocksData.filter(d => d.vol < 1 && d.score === 100);
  const lowCorrStocks = stocksData.filter(d => d.corr < 0 && d.score === 100);

  /* ------------------------------------------------------------------ */
  /* 5.4. ETF / Futures / FX data processing                            */
  /* ------------------------------------------------------------------ */
  const { etfPrices } = await loadCSVData(); // This will use the mock or actual function

  const etfData = Object.entries(window.etfFullData).map(([inst, info]) => ({
    instrument: inst,
    score:      parseFloat(info.summaryLeft ? info.summaryLeft[0] : 0),
    trend:      info.summaryLeft ? info.summaryLeft[1] : '',
    approach:   info.summaryLeft ? info.summaryLeft[2] : '',
    gap:        parseGap(info.summaryLeft ? info.summaryLeft[3] : '0%'),
    corr:       parseFloat(info.summaryRight ? info.summaryRight[0] : 0),
    vol:        parseFloat(info.summaryRight ? info.summaryRight[1] : 0),
    bullish:    parseFloat(info.summaryRight ? info.summaryRight[2] : 0),
    bearish:    parseFloat(info.summaryRight ? info.summaryRight[3] : 0),
    alpha:      parseFloat(info.summaryRight ? info.summaryRight[4] : 0),
    return3m:   null
  }));
  const etfTrend     = etfData.filter(d => d.score === 100);
  const etfLowCorr   = etfTrend.filter(d => d.corr < 0.1);
  const etfLowVol    = etfTrend.filter(d => d.vol < 1);
  const etfTrendPlus = etfTrend.filter(d => d.bullish > 1 && d.bearish < 1 && d.alpha > 1);
  const etfLowDrawdown = etfData.filter(d => d.gap < 5 && d.vol < 1);

  // Sector Rotation: compute 3-month return (13 weeks back)
  etfData.forEach(d => {
    const hist = etfPrices[d.instrument] || [];
    const n = hist.length;
    if (n >= 14) {
      const latest = hist[n - 1].close;
      const past   = hist[n - 14].close;
      d.return3m = (latest / past) - 1;
    }
  });
  const etfSectorRotation = etfData
    .filter(d => d.return3m != null)
    .sort((a, b) => b.return3m - a.return3m)
    .slice(0, 3);

  const futData = Object.entries(window.futuresFullData).map(([inst, info]) => ({
    instrument: inst,
    score:      parseFloat(info.summaryLeft ? info.summaryLeft[0] : 0),
    trend:      info.summaryLeft ? info.summaryLeft[1] : '',
    approach:   info.summaryLeft ? info.summaryLeft[2] : '',
    gap:        parseGap(info.summaryLeft ? info.summaryLeft[3] : '0%'),
    corr:       parseFloat(info.summaryRight ? info.summaryRight[0] : 0),
    vol:        parseFloat(info.summaryRight ? info.summaryRight[1] : 0)
  }));
  const futTrend   = futData.filter(d => Math.abs(d.score) === 100);
  const futLowCorr = futTrend.filter(d => d.corr < 0.1);
  const futLowVol  = futTrend.filter(d => d.vol < 1);

  const fxData = Object.entries(window.fxFullData).map(([inst, info]) => ({
    instrument: inst,
    score:      parseFloat(info.summaryLeft ? info.summaryLeft[0] : 0),
    trend:      info.summaryLeft ? info.summaryLeft[1] : '',
    approach:   info.summaryLeft ? info.summaryLeft[2] : '',
    gap:        parseGap(info.summaryLeft ? info.summaryLeft[3] : '0%')
  }));
  const fxTrend = fxData.filter(d => d.score >= 75 || d.score <= -75);

  // Return all processed data for potential external use
  return {
    valueStocks,
    dividendDefensiveStocks,
    momentumStocks,
    lowVolStocks,
    lowCorrStocks,
    etfTrend,
    etfLowCorr,
    etfLowVol,
    etfTrendPlus,
    etfLowDrawdown,
    etfSectorRotation,
    futTrend,
    futLowCorr,
    futLowVol,
    fxTrend
  };
}

/* -------------------------------------------------------------------------- */
/* 6. Helper – renderSection                                                  */
/* -------------------------------------------------------------------------- */
// This helper is kept as it defines how sections *would* be rendered,
// but it's not called within this file to avoid direct UI manipulation.
// It can be used by an external module that consumes the data.
function renderSection(title, headers, rows) {
  if (!rows || rows.length === 0) return "";
  // Removed baseURL dependency for self-containment
  const baseURL = "#"; // Placeholder, as actual base URL is not relevant here
  const fullHeaders = [...headers, "FULL ANALYSIS"];
  return `
    <div class="thematic-portfolio-section">
      <h2>${title}</h2>
      <div class="thematic-portfolio-table-container">
        <table class="thematic-portfolio-table">
          <thead>
            <tr>${fullHeaders.map(h => `<th>${h}</th>`).join("")}</tr>
          </thead>
          <tbody>
            ${rows.map(r => `
              <tr>
                ${headers.map(h => `<td>${r[headerKeyMap[h]] ?? "-"}</td>`).join("")}
                <td><a href="${baseURL}?instrument=${encodeURIComponent(r.instrument)}" target="_blank"> 🔗 </a></td>
              </tr>
            `).join("")}
          </tbody>
        </table>
      </div>
    </div>
  `;
}

// Export the functions that might be needed externally
export { processThematicPortfolioData, riskProfiles, renderSection };
