// thematicPortfolio.js
// -----------------------------------------------------------------------------
// Pagina “Portfolio Ideas” aggiornata: 5 portafogli STOCKS (Value, Momentum,
// Dividend Defensive, Low Volatility, Low Correlation) + ETF / Futures / FX.
// -----------------------------------------------------------------------------

import { parseGap } from "./dashboard.js";

/* -------------------------------------------------------------------------- */
/* 1. Header ⇄ key mapping                                                    */
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
  "β":              "beta"
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
      document.getElementById("main-content").style.display = "none";
      document.getElementById("portfolio-builder-template").style.display = "none";

      const tpl = document.getElementById("thematic-portfolio-template");
      tpl.style.display = "block";
      loadThematicPortfolio();          // async
    }
  });
}

/* -------------------------------------------------------------------------- */
/* 3. Build page                                                              */
/* -------------------------------------------------------------------------- */
async function loadThematicPortfolio() {
  const c = document.getElementById("thematic-portfolio-template");

  /* ------------------------------------------------------------------ */
  /* 0. Merge fondamentali in window.stocksFullData (una sola volta)    */
  /* ------------------------------------------------------------------ */
  if (!window.__fundamentalsMerged__) {
    try {
      const res = await fetch("./instruments.json");
      const instruments = await res.json();
      const byTicker = Object.fromEntries(instruments.map((o) => [o.ticker.trim(), o]));

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
    } catch (err) {
      console.error("Merge fundamentals failed:", err);
    }
  }

  /* ------------------------------------------------------------------ */
  /* 1. STOCKS dataset                                                  */
  /* ------------------------------------------------------------------ */
  const stocksData = Object.entries(window.stocksFullData).map(
    ([inst, info]) => ({
      instrument:       inst,
      score:            parseFloat(info.summaryLeft[0]),
      trend:            info.summaryLeft[1],
      approach:         info.summaryLeft[2],
      gap:              parseGap(info.summaryLeft[3]),
      keyArea:          info.summaryLeft[4],
      corr:             parseFloat(info.summaryRight[0]),
      vol:              parseFloat(info.summaryRight[1]),
      bullish:          parseFloat(info.summaryRight[2]),
      bearish:          parseFloat(info.summaryRight[3]),
      alpha:            parseFloat(info.summaryRight[4]),
      pe:               info.pe_ratio        != null ? parseFloat(info.pe_ratio)        : null,
      pb:               info.pb_ratio        != null ? parseFloat(info.pb_ratio)        : null,
      divYield:         info.div_yield       != null ? parseFloat(info.div_yield)       : null,
      returnOnEquity:   info.return_on_equity!= null ? parseFloat(info.return_on_equity): null,
      debtToEquity:     info.debt_to_equity  != null ? parseFloat(info.debt_to_equity)  : null,
      payout_ratio:     info.payout_ratio    != null ? parseFloat(info.payout_ratio)    : null,
      beta:             info.beta            != null ? parseFloat(info.beta)            : null
    })
  );

  /* ------------------------------------------------------------------ */
  /* 2. STOCKS thematic filters                                         */
  /* ------------------------------------------------------------------ */
  // Value Investing
  const valueStocks = stocksData.filter(
    (d) =>
      d.pe !== null && d.pe < 15 &&
      d.pb !== null && d.pb < 2 &&
      d.divYield !== null && d.divYield >= 2 &&
      d.debtToEquity !== null && d.debtToEquity < 50 &&
      d.returnOnEquity !== null && d.returnOnEquity > 0.15
  );

  // Momentum (immutato)
  const momentumStocks = stocksData.filter(
    (d) => d.bullish > 1 && d.bearish < 1 && d.alpha > 1
  );

  // Dividend Defensive
  const dividendDefensiveStocks = stocksData.filter(
    (d) =>
      d.divYield !== null && d.divYield >= 3 &&
      d.payout_ratio !== null && d.payout_ratio < 0.6 &&
      d.beta !== null && d.beta < 1 &&
      d.score > 50
  );

  // Low Volatility
  const lowVolStocks = stocksData.filter(
    (d) => d.vol < 1 && d.score === 100
  );

  // Low Correlation
  const lowCorrStocks = stocksData.filter(
    (d) => d.corr < 0 && d.score === 100
  );

  /* ------------------------------------------------------------------ */
  /* 3. ETF / Futures / FX (immutati)                                   */
  /* ------------------------------------------------------------------ */
  const etfData = Object.entries(window.etfFullData).map(([inst, info]) => ({
    instrument: inst,
    score:      parseFloat(info.summaryLeft[0]),
    trend:      info.summaryLeft[1],
    approach:   info.summaryLeft[2],
    gap:        parseGap(info.summaryLeft[3]),
    corr:       parseFloat(info.summaryRight[0]),
    vol:        parseFloat(info.summaryRight[1]),
    bullish:    parseFloat(info.summaryRight[2]),
    bearish:    parseFloat(info.summaryRight[3]),
    alpha:      parseFloat(info.summaryRight[4])
  }));
  const etfTrend     = etfData.filter((d) => d.score === 100);
  const etfLowCorr   = etfTrend.filter((d) => d.corr < 0.1);
  const etfLowVol    = etfTrend.filter((d) => d.vol < 1);
  const etfTrendPlus = etfTrend.filter(
    (d) => d.bullish > 1 && d.bearish < 1 && d.alpha > 1
  );

  const futData = Object.entries(window.futuresFullData).map(
    ([inst, info]) => ({
      instrument: inst,
      score:      parseFloat(info.summaryLeft[0]),
      trend:      info.summaryLeft[1],
      approach:   info.summaryLeft[2],
      gap:        parseGap(info.summaryLeft[3]),
      corr:       parseFloat(info.summaryRight[0]),
      vol:        parseFloat(info.summaryRight[1])
    })
  );
  const futTrend   = futData.filter((d) => Math.abs(d.score) === 100);
  const futLowCorr = futTrend.filter((d) => d.corr < 0.1);
  const futLowVol  = futTrend.filter((d) => d.vol < 1);

  const fxData = Object.entries(window.fxFullData).map(([inst, info]) => ({
    instrument: inst,
    score:      parseFloat(info.summaryLeft[0]),
    trend:      info.summaryLeft[1],
    approach:   info.summaryLeft[3],
    gap:        parseGap(info.summaryLeft[2])
  }));
  const fxTrend = fxData.filter((d) => d.score >= 75 || d.score <= -75);

  /* ------------------------------------------------------------------ */
  /* 4. Render HTML                                                     */
  /* ------------------------------------------------------------------ */
  c.innerHTML = `
    <div class="thematic-portfolio-nav">
      <button class="portfolio-tab active" data-target="stocks">STOCKS</button>
      <button class="portfolio-tab" data-target="etfs">ETFS</button>
      <button class="portfolio-tab" data-target="futures">FUTURES</button>
      <button class="portfolio-tab" data-target="fx">FX</button>
    </div>

    <div class="thematic-portfolio-contents">
      <!-- STOCKS ----------------------------------------------------------- -->
      <div class="portfolio-tab-content active" data-category="stocks">
        ${renderSection(
          "Value Investing",
          ["Instrument", "P/E", "P/B", "Div Yield", "ROE", "D/E"],
          valueStocks
        )}
        ${renderSection(
          "Momentum",
          ["Instrument", "Score", "Bullish Alpha", "Bearish Alpha", "Alpha Strength"],
          momentumStocks
        )}
        ${renderSection(
          "Dividend Defensive",
          ["Instrument", "Div Yield", "Payout Ratio", "β", "Score", "Gap to Peak", "Key Area"],
          dividendDefensiveStocks
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
          ["Instrument", "Score", "Correlation", "Trend", "Approach", "Gap to Peak"],
          etfLowCorr
        )}
        ${renderSection(
          "Low Volatility",
          ["Instrument", "Score", "Volatility", "Trend", "Approach", "Gap to Peak"],
          etfLowVol
        )}
        ${renderSection(
          "Trend Plus",
          ["Instrument", "Score", "Bullish Alpha", "Bearish Alpha", "Alpha Strength"],
          etfTrendPlus
        )}
      </div>

      <!-- FUTURES ---------------------------------------------------------- -->
      <div class="portfolio-tab-content" data-category="futures">
        ${renderSection(
          "Trend Following",
          ["Instrument", "Score", "Trend", "Approach", "Gap to Peak"],
          futTrend
        )}
        ${renderSection(
          "Low Correlation",
          ["Instrument", "Score", "Correlation", "Trend", "Approach", "Gap to Peak"],
          futLowCorr
        )}
        ${renderSection(
          "Low Volatility",
          ["Instrument", "Score", "Volatility", "Trend", "Approach", "Gap to Peak"],
          futLowVol
        )}
      </div>

      <!-- FX --------------------------------------------------------------- -->
      <div class="portfolio-tab-content" data-category="fx">
        ${renderSection(
          "Trend Following",
          ["Instrument", "Score", "Trend", "Approach", "Gap to Peak"],
          fxTrend
        )}
      </div>
    </div>
  `;

  /* ------------------------------------------------------------------ */
  /* 5. Tab switching + fallback                                        */
  /* ------------------------------------------------------------------ */
  c.querySelectorAll(".portfolio-tab").forEach((btn) => {
    btn.addEventListener("click", () => {
      c.querySelectorAll(".portfolio-tab").forEach((b) => b.classList.remove("active"));
      btn.classList.add("active");

      c.querySelectorAll(".portfolio-tab-content").forEach((sec) => sec.classList.remove("active"));
      c.querySelector(`.portfolio-tab-content[data-category="${btn.dataset.target}"]`).classList.add("active");
    });
  });

  c.querySelectorAll(".portfolio-tab-content").forEach((content) => {
    if (!content.querySelector(".thematic-portfolio-section")) {
      content.innerHTML = `
        <div class="no-ideas">
          <p>No instruments match these criteria.</p>
        </div>
      `;
    }
  });
}

/* -------------------------------------------------------------------------- */
/* 4. Helper – renderSection                                                  */
/* -------------------------------------------------------------------------- */
function renderSection(title, headers, rows) {
  if (!rows || rows.length === 0) return "";

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
