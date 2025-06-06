// thematicPortfolio.js
// -----------------------------------------------------------------------------
// Pagina “Portfolio Ideas” – STOCKS, ETFS, FUTURES, FX
//
// STOCKS (ordine):
//   1) Value Investing
//   2) Dividend Defensive   (score === 100)
//   3) Momentum             (score === 100)
//   4) Low Volatility       (score === 100)
//   5) Low Correlation      (score === 100)
// ----------------------------------------------------------------------------- 

import { parseGap } from "./dashboard.js";

/* -------------------------------------------------------------------------- */
/* 1. Header ⇄ key mapping                                                    */
/* -------------------------------------------------------------------------- */
const headerKeyMap = {
  Instrument: "instrument",
  "P/E": "pe",
  "P/B": "pb",
  "Div Yield": "divYield",
  ROE: "roe",
  "D/E": "de",
  "Volatility": "vol",
  Score: "score",
  Trend: "trend",
  Approach: "approach",
  Correlation: "corr",
  "Gap to Peak": "gap",
  "Key Area": "keyArea",
  "Bullish Alpha": "bullish",
  "Bearish Alpha": "bearish",
  "Alpha Strength": "alpha",
  "MAX Drawdown": "maxDD",
  "High Limit": "highLimit",
  "Low Limit": "lowLimit",
  "Upper Band": "upperBand",
  "Lower Band": "lowerBand",
  "Momentum": "mom",
  "SDR Momentum": "sdrMom",
  "ADv Momentum": "advMom",
};

/* -------------------------------------------------------------------------- */
/* 2. Data preparation                                                         */
/* -------------------------------------------------------------------------- */
const stockData = Object.entries(window.stocksFullData).map(
  ([inst, info]) => ({
    instrument: inst,
    pe:       info.fundamentals?.pe ?? null,
    pb:       info.fundamentals?.pb ?? null,
    divYield: info.fundamentals?.divYield ?? null,
    roe:      info.fundamentals?.roe ?? null,
    de:       info.fundamentals?.de ?? null,
    score:    parseFloat(info.summaryLeft[0]),
    trend:    info.summaryLeft[1],
    approach: info.summaryLeft[2],
    gap:      parseGap(info.summaryLeft[3]),
    corr:     parseFloat(info.summaryRight[0]),
    keyArea:  info.summaryRight[1],
    bullish:  parseFloat(info.summaryLeft[1]),
    bearish:  parseFloat(info.summaryLeft[2]),
    alpha:    parseFloat(info.summaryLeft[3]),
    maxDD:    parseFloat(info.summaryRight[2]),
    highLimit: parseFloat(info.summaryRight[3]),
    lowLimit:  parseFloat(info.summaryRight[4]),
    upperBand: parseFloat(info.summaryRight[5]),
    lowerBand: parseFloat(info.summaryRight[6]),
    mom:       parseFloat(info.summaryLeft[4]),
    sdrMom:    parseFloat(info.summaryLeft[5]),
    advMom:    parseFloat(info.summaryLeft[6]),
  })
);

// Filtri per STOCKS
const valueStocks = stockData.filter(
  (d) =>
    d.pe !== null &&
    d.pb !== null &&
    d.divYield !== null &&
    d.roe !== null &&
    d.de !== null
);

const dividendDefensiveStocks = stockData.filter(
  (d) => d.score === 100 && d.divYield !== null
);

const momentumStocks = stockData.filter((d) => d.score === 100);

const lowVolStocks = stockData.filter((d) => d.score === 100);

const lowCorrStocks = stockData.filter((d) => d.score === 100);

/* -------------------------------------------------------------------------- */
/* 3. ETF / Futures / FX (immutati)                                           */
/* -------------------------------------------------------------------------- */
const etfTrend = Object.entries(window.etfFullData).map(
  ([inst, info]) => ({
    instrument: inst,
    score:      parseFloat(info.summaryLeft[0]),
    trend:      info.summaryLeft[1],
    approach:   info.summaryLeft[2],
    gap:        parseGap(info.summaryLeft[3]),
    corr:       parseFloat(info.summaryRight[0]),
    vol:        parseFloat(info.summaryRight[1]),
    divYield:   info.fundamentals?.divYield ?? null,
    bullish:    parseFloat(info.summaryLeft[1]),
    bearish:    parseFloat(info.summaryLeft[2]),
    alpha:      parseFloat(info.summaryLeft[3]),
  })
);

// ETF sogli
const etfLowCorr      = etfTrend.filter((d) => d.corr < 0.1);
const etfLowVol       = etfTrend.filter((d) => d.vol < 1);
const etfTrendPlus    = etfTrend.filter(
  (d) => d.bullish > 1 && d.bearish < 1 && d.alpha > 1
);

// New ETF portfolios
const etfMomentum     = etfTrendPlus; // same as Trend Plus
const etfHighDividend = etfTrend.filter(
  (d) => d.divYield !== null && d.divYield >= 3
);

const futData = Object.entries(window.futuresFullData).map(
  ([inst, info]) => ({
    instrument: inst,
    score:      parseFloat(info.summaryLeft[0]),
    trend:      info.summaryLeft[1],
    approach:   info.summaryLeft[2],
    gap:        parseGap(info.summaryLeft[3]),
    corr:       parseFloat(info.summaryRight[0]),
    maxDD:      parseFloat(info.summaryRight[2]),
    highLimit:  parseFloat(info.summaryRight[3]),
    lowLimit:   parseFloat(info.summaryRight[4]),
    upperBand:  parseFloat(info.summaryRight[5]),
    lowerBand:  parseFloat(info.summaryRight[6]),
  })
);

const fxData = Object.entries(window.fxFullData).map(
  ([inst, info]) => ({
    instrument: inst,
    score:      parseFloat(info.summaryLeft[0]),
    trend:      info.summaryLeft[1],
    approach:   info.summaryLeft[2],
    gap:        parseGap(info.summaryLeft[3]),
    corr:       parseFloat(info.summaryRight[0]),
    maxDD:      parseFloat(info.summaryRight[2]),
    highLimit:  parseFloat(info.summaryRight[3]),
    lowLimit:   parseFloat(info.summaryRight[4]),
    upperBand:  parseFloat(info.summaryRight[5]),
    lowerBand:  parseFloat(info.summaryRight[6]),
  })
);

/* -------------------------------------------------------------------------- */
/* 4. Build HTML                                                               */
/* -------------------------------------------------------------------------- */
export function buildThematicPortfolio() {
  document.getElementById("app").innerHTML = `
    <div class="portfolio-tabs">
      <button class="portfolio-tab active" data-target="stocks">STOCKS</button>
      <button class="portfolio-tab" data-target="etfs">ETFS</button>
      <button class="portfolio-tab" data-target="futures">FUTURES</button>
      <button class="portfolio-tab" data-target="fx">FX</button>
    </div>
    
    <div class="portfolio-tab-content-container">
    
      <!-- STOCKS ----------------------------------------------------------- -->
      <div class="portfolio-tab-content active" data-category="stocks">
        ${renderSection(
          "Value Investing",
          ["Instrument", "P/E", "P/B", "Div Yield", "ROE", "D/E"],
          valueStocks
        )}
        ${renderSection(
          "Dividend Defensive",
          ["Instrument", "Div Yield", "Payout Ratio", "β", "Score", "Gap to Peak", "Key Area"],
          dividendDefensiveStocks
        )}
        ${renderSection(
          "Momentum",
          ["Instrument", "Score", "Trend", "Approach", "Gap to Peak", "Key Area"],
          momentumStocks
        )}
        ${renderSection(
          "Low Volatility",
          ["Instrument", "Volatility", "Score", "Gap to Peak", "Key Area"],
          lowVolStocks
        )}
        ${renderSection(
          "Low Correlation",
          ["Instrument", "Correlation", "Score", "Gap to Peak", "Key Area"],
          lowCorrStocks
        )}
      </div>
    
      <!-- ETFS ------------------------------------------------------------- -->
      <div class="portfolio-tab-content" data-category="etfs">
        ${renderSection(
          "Trend Following",
          ["Instrument", "Score", "Trend", "Approach", "Gap to Peak"],
          etfTrend
        )}
        ${renderSection(
          "Low Correlation",
          ["Instrument", "Correlation", "Score", "Gap to Peak"],
          etfLowCorr
        )}
        ${renderSection(
          "Low Volatility",
          ["Instrument", "Volatility", "Score", "Gap to Peak"],
          etfLowVol
        )}
        ${renderSection(
          "Momentum ETFs",
          ["Instrument", "Score", "Bullish Alpha", "Bearish Alpha", "Alpha Strength", "Gap to Peak"],
          etfMomentum
        )}
        ${renderSection(
          "High-Dividend ETFs",
          ["Instrument", "Div Yield", "Score", "Gap to Peak"],
          etfHighDividend
        )}
      </div>
    
      <!-- FUTURES ---------------------------------------------------------- -->
      <div class="portfolio-tab-content" data-category="futures">
        ${renderSection(
          "Trend Following Futures",
          ["Instrument", "Score", "Trend", "Approach", "Gap to Peak"],
          futData
        )}
        ${renderSection(
          "High Volatility Futures",
          ["Instrument", "Max Drawdown", "High Limit", "Low Limit", "Upper Band", "Lower Band"],
          futData.filter((d) => d.maxDD !== null && d.maxDD > 10)
        )}
      </div>
    
      <!-- FX --------------------------------------------------------------- -->
      <div class="portfolio-tab-content" data-category="fx">
        ${renderSection(
          "FX Trend Following",
          ["Instrument", "Score", "Trend", "Approach", "Gap to Peak"],
          fxData
        )}
        ${renderSection(
          "FX High Volatility",
          ["Instrument", "Max Drawdown", "High Limit", "Low Limit", "Upper Band", "Lower Band"],
          fxData.filter((d) => d.maxDD !== null && d.maxDD > 10)
        )}
      </div>
    
    </div>
    
    <div id="footer">Data provided by YourDataProvider</div>
  `;

  /* Tab switching logic */
  const tabs = document.querySelectorAll(".portfolio-tab");
  const contents = document.querySelectorAll(".portfolio-tab-content");
  tabs.forEach((tab) =>
    tab.addEventListener("click", () => {
      tabs.forEach((t) => t.classList.remove("active"));
      tab.classList.add("active");
      const target = tab.getAttribute("data-target");
      contents.forEach((c) =>
        c.getAttribute("data-category") === target
          ? c.classList.add("active")
          : c.classList.remove("active")
      );
    })
  );
}

/* -------------------------------------------------------------------------- */
/* Helper – renderSection                                                      */
/* -------------------------------------------------------------------------- */
function renderSection(title, headers, rows) {
  if (!rows || rows.length === 0) {
    return `
      <div class="thematic-portfolio-section">
        <h2>${title}</h2>
        <div class="no-instruments">No instruments match these criteria.</div>
      </div>
    `;
  }

  const baseURL = window.location.origin + window.location.pathname;
  const fullHeaders = [...headers, "FULL ANALYSIS"];

  return `
    <div class="thematic-portfolio-section">
      <h2>${title}</h2>
      <div class="thematic-portfolio-table-container">
        <table class="thematic-portfolio-table">
          <thead>
            <tr>${fullHeaders.map((h) => `<th>${h}</th>`).join("")}</tr>
          </thead>
          <tbody>
            ${rows
              .map(
                (r) =>
                  `<tr>` +
                  headers
                    .map((h) => `<td>${r[headerKeyMap[h]] ?? "-"}</td>`)
                    .join("") +
                  `<td><a href="${baseURL}?instrument=${encodeURIComponent(
                    r.instrument
                  )}" target="_blank">🔗</a></td>` +
                  `</tr>`
              )
              .join("")}
          </tbody>
        </table>
      </div>
    </div>
  `;
}
