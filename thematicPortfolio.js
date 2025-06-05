// thematicPortfolio.js
// -----------------------------------------------------------------------------
// Builds the “Portfolio Ideas” page with STOCKS / ETFS / FUTURES / FX tabs.
// STOCKS now contains six distinct thematic portfolios, driven by
// window.stocksFullData (populated from instruments.json).
// -----------------------------------------------------------------------------

import { parseGap } from "./dashboard.js";

/* -------------------------------------------------------------------------- */
/* 1. Header-to-key mapping                                                   */
/* -------------------------------------------------------------------------- */
const headerKeyMap = {
  // Common
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
  // Fundamentals
  "P/E":            "pe",
  "P/B":            "pb",
  "Div Yield":      "divYield",
  "ROE":            "returnOnEquity",
  "D/E":            "debtToEquity",
  "Payout Ratio":   "payout_ratio",
  "β":              "beta"
};

/* -------------------------------------------------------------------------- */
/* 2. Public entry point – wire sidebar click                                 */
/* -------------------------------------------------------------------------- */
export function initThematicPortfolio() {
  const sidebar = document.getElementById("sidebar-list");
  if (!sidebar) return;

  sidebar.addEventListener("click", (e) => {
    const li = e.target.closest("li");
    if (!li) return;

    if (li.textContent.trim().toUpperCase() === "PORTFOLIO IDEAS") {
      // Hide other pages
      document.getElementById("main-content").style.display = "none";
      document.getElementById("portfolio-builder-template").style.display = "none";

      // Show / build Portfolio Ideas
      const tpl = document.getElementById("thematic-portfolio-template");
      tpl.style.display = "block";
      loadThematicPortfolio();
    }
  });
}

/* -------------------------------------------------------------------------- */
/* 3. Build entire page                                                       */
/* -------------------------------------------------------------------------- */
function loadThematicPortfolio() {
  const c = document.getElementById("thematic-portfolio-template");

  /* ------------ 3.1  Build STOCKS dataset --------------------------------- */
  const stocksData = Object.entries(window.stocksFullData).map(
    ([inst, info]) => ({
      instrument: inst,
      // Summary-left array
      score:    parseFloat(info.summaryLeft[0]),
      trend:    info.summaryLeft[1],
      approach: info.summaryLeft[2],
      gap:      parseGap(info.summaryLeft[3]),
      keyArea:  info.summaryLeft[4],
      // Summary-right array
      corr:    parseFloat(info.summaryRight[0]),
      vol:     parseFloat(info.summaryRight[1]),
      bullish: parseFloat(info.summaryRight[2]),
      bearish: parseFloat(info.summaryRight[3]),
      alpha:   parseFloat(info.summaryRight[4]),
      // Fundamentals (nullable → null when missing)
      pe:             info.pe_ratio         != null ? parseFloat(info.pe_ratio)          : null,
      pb:             info.pb_ratio         != null ? parseFloat(info.pb_ratio)          : null,
      divYield:       info.div_yield        != null ? parseFloat(info.div_yield)         : null,
      returnOnEquity: info.return_on_equity != null ? parseFloat(info.return_on_equity)  : null,
      debtToEquity:   info.debt_to_equity   != null ? parseFloat(info.debt_to_equity)    : null,
      payout_ratio:   info.payout_ratio     != null ? parseFloat(info.payout_ratio)      : null,
      beta:           info.beta             != null ? parseFloat(info.beta)              : null
    })
  );

  /* ------------ 3.2  STOCKS thematic filters ------------------------------ */
  // 1) Value Investing
  const valueStocks = stocksData.filter(
    (d) =>
      d.pe !== null &&
      d.pe < 15 &&
      d.pb !== null &&
      d.pb < 2 &&
      d.divYield !== null &&
      d.divYield >= 3 // stricter ≥3%
  );

  // 2) Momentum
  const momentumStocks = stocksData.filter(
    (d) => d.bullish > 1 && d.bearish < 1 && d.alpha > 1
  );

  // 3) Quality
  const qualityStocks = stocksData.filter(
    (d) =>
      d.returnOnEquity !== null &&
      d.returnOnEquity > 0.15 &&
      d.debtToEquity !== null &&
      d.debtToEquity < 50
  );

  // 4) Low Volatility
  const lowVolStocks = stocksData.filter((d) => d.vol < 1);

  // 5) Low Correlation
  const lowCorrStocks = stocksData.filter((d) => d.corr < 0.1);

  // 6) Dividend-Growth / Defensive
  const dividendDefensiveStocks = stocksData.filter(
    (d) =>
      d.divYield !== null &&
      d.divYield > 3 &&
      d.payout_ratio !== null &&
      d.payout_ratio < 0.6 &&
      d.beta !== null &&
      d.beta < 1
  );

  /* ------------ 3.3  ETF / Futures / FX (unchanged) ----------------------- */
  // --- ETFs
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
  const etf1 = etfData.filter((d) => d.score === 100); // Trend Following
  const etf2 = etf1.filter((d) => d.corr < 0.1);        // Low Correlation
  const etf3 = etf1.filter((d) => d.vol < 1);           // Low Volatility
  const etf4 = etf1.filter(                             // Trend Plus
    (d) => d.bullish > 1 && d.bearish < 1 && d.alpha > 1
  );

  // --- Futures
  const futData = Object.entries(window.futuresFullData).map(
    ([inst, info]) => ({
      instrument: inst,
      score:   parseFloat(info.summaryLeft[0]),
      trend:   info.summaryLeft[1],
      approach: info.summaryLeft[2],
      gap:     parseGap(info.summaryLeft[3]),
      corr:    parseFloat(info.summaryRight[0]),
      vol:     parseFloat(info.summaryRight[1])
    })
  );
  const fut1 = futData.filter((d) => Math.abs(d.score) === 100); // Trend Following
  const fut2 = fut1.filter((d) => d.corr < 0.1);                 // Low Correlation
  const fut3 = fut1.filter((d) => d.vol < 1);                    // Low Volatility

  // --- FX
  const fxData = Object.entries(window.fxFullData).map(([inst, info]) => ({
    instrument: inst,
    score:      parseFloat(info.summaryLeft[0]),
    trend:      info.summaryLeft[1],
    approach:   info.summaryLeft[3],
    gap:        parseGap(info.summaryLeft[2])
  }));
  const fx1 = fxData.filter((d) => d.score >= 75 || d.score <= -75); // Trend Following

  /* ------------ 3.4  Render HTML ----------------------------------------- */
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
          [
            "Instrument",
            "P/E",
            "P/B",
            "Div Yield",
            "Score",
            "Trend",
            "Approach",
            "Gap to Peak",
            "Key Area"
          ],
          valueStocks
        )}
        ${renderSection(
          "Momentum",
          [
            "Instrument",
            "Score",
            "Bullish Alpha",
            "Bearish Alpha",
            "Alpha Strength",
            "Trend",
            "Approach",
            "Gap to Peak",
            "Key Area"
          ],
          momentumStocks
        )}
        ${renderSection(
          "Quality",
          [
            "Instrument",
            "ROE",
            "D/E",
            "Score",
            "Trend",
            "Approach",
            "Gap to Peak",
            "Key Area"
          ],
          qualityStocks
        )}
        ${renderSection(
          "Low Volatility",
          [
            "Instrument",
            "Score",
            "Volatility",
            "Trend",
            "Approach",
            "Gap to Peak",
            "Key Area"
          ],
          lowVolStocks
        )}
        ${renderSection(
          "Low Correlation",
          [
            "Instrument",
            "Score",
            "Correlation",
            "Trend",
            "Approach",
            "Gap to Peak",
            "Key Area"
          ],
          lowCorrStocks
        )}
        ${renderSection(
          "Dividend-Growth / Defensive",
          [
            "Instrument",
            "Div Yield",
            "Payout Ratio",
            "β",
            "Score",
            "Trend",
            "Approach",
            "Gap to Peak",
            "Key Area"
          ],
          dividendDefensiveStocks
        )}
      </div>

      <!-- ETFS ------------------------------------------------------------- -->
      <div class="portfolio-tab-content" data-category="etfs">
        ${renderSection(
          "Trend Following",
          ["Instrument", "Score", "Trend", "Approach", "Gap to Peak"],
          etf1
        )}
        ${renderSection(
          "Low Correlation",
          [
            "Instrument",
            "Score",
            "Correlation",
            "Trend",
            "Approach",
            "Gap to Peak"
          ],
          etf2
        )}
        ${renderSection(
          "Low Volatility",
          [
            "Instrument",
            "Score",
            "Volatility",
            "Trend",
            "Approach",
            "Gap to Peak"
          ],
          etf3
        )}
        ${renderSection(
          "Trend Plus",
          [
            "Instrument",
            "Score",
            "Bullish Alpha",
            "Bearish Alpha",
            "Alpha Strength"
          ],
          etf4
        )}
      </div>

      <!-- FUTURES ---------------------------------------------------------- -->
      <div class="portfolio-tab-content" data-category="futures">
        ${renderSection(
          "Trend Following",
          ["Instrument", "Score", "Trend", "Approach", "Gap to Peak"],
          fut1
        )}
        ${renderSection(
          "Low Correlation",
          [
            "Instrument",
            "Score",
            "Correlation",
            "Trend",
            "Approach",
            "Gap to Peak"
          ],
          fut2
        )}
        ${renderSection(
          "Low Volatility",
          [
            "Instrument",
            "Score",
            "Volatility",
            "Trend",
            "Approach",
            "Gap to Peak"
          ],
          fut3
        )}
      </div>

      <!-- FX --------------------------------------------------------------- -->
      <div class="portfolio-tab-content" data-category="fx">
        ${renderSection(
          "Trend Following",
          ["Instrument", "Score", "Trend", "Approach", "Gap to Peak"],
          fx1
        )}
      </div>
    </div>
  `;

  /* ------------ 3.5  Tab switching + empty-tab fallback ------------------ */
  c.querySelectorAll(".portfolio-tab").forEach((btn) => {
    btn.addEventListener("click", () => {
      // toggle active button
      c.querySelectorAll(".portfolio-tab").forEach((b) =>
        b.classList.remove("active")
      );
      btn.classList.add("active");

      // toggle tab content
      c.querySelectorAll(".portfolio-tab-content").forEach((sec) =>
        sec.classList.remove("active")
      );
      c
        .querySelector(
          `.portfolio-tab-content[data-category=\"${btn.dataset.target}\"]`
        )
        .classList.add("active");
    });
  });

  // For every tab: if it now contains zero .thematic-portfolio-section,
  // replace with “No instruments match these criteria.”
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
  if (!rows || rows.length === 0) return ""; // nothing to render

  const baseURL = window.location.origin + window.location.pathname;
  const allHeaders = [...headers, "FULL ANALYSIS"];

  return `
    <div class="thematic-portfolio-section">
      <h2>${title}</h2>
      <div class="thematic-portfolio-table-container">
        <table class="thematic-portfolio-table">
          <thead>
            <tr>${allHeaders.map((h) => `<th>${h}</th>`).join("")}</tr>
          </thead>
          <tbody>
            ${rows
              .map(
                (r) =>
                  `<tr>` +
                  headers
                    .map((h) => `<td>${r[headerKeyMap[h]] ?? "-"}</td>`)
                    .join("") +
                  `<td class="full-analysis"><a href="${baseURL}?instrument=${encodeURIComponent(
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
