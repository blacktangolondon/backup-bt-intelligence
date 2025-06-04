// thematicPortfolio.js
import { parseGap } from "./dashboard.js";

// field mapping from table headers to object properties
const headerKeyMap = {
  "Instrument":      "instrument",
  "Score":           "score",
  "Trend":           "trend",
  "Approach":        "approach",
  "Gap to Peak":     "gap",
  "Key Area":        "keyArea",
  "Correlation":     "corr",
  "Volatility":      "vol",
  "Bullish Alpha":   "bullish",
  "Bearish Alpha":   "bearish",
  "Alpha Strength":  "alpha",
  // New columns for Value & Quality & Growth & Dividend
  "P/E":             "pe",
  "P/B":             "pb",
  "Div Yield":       "divYield",
  "ROE":             "roe",
  "D/E":             "deRatio",
  "Rev Growth":      "revGrowth",
  "Payout Ratio":    "payoutRatio"
};

export function initThematicPortfolio() {
  const sidebar = document.getElementById('sidebar-list');
  if (!sidebar) return;
  sidebar.addEventListener('click', e => {
    const li = e.target.closest('li');
    if (!li) return;
    if (li.textContent.trim().toUpperCase() === 'PORTFOLIO IDEAS') {
      document.getElementById('main-content').style.display = 'none';
      document.getElementById('portfolio-builder-template').style.display = 'none';
      const tpl = document.getElementById('thematic-portfolio-template');
      tpl.style.display = 'block';
      loadThematicPortfolio();
    }
  });
}

function loadThematicPortfolio() {
  const c = document.getElementById('thematic-portfolio-template');

  // Prepare data sets
  const stocksData = Object.entries(window.stocksFullData).map(([inst, info]) => ({
    instrument:  inst,
    score:       parseFloat(info.summaryLeft[0]),
    trend:       info.summaryLeft[1],
    approach:    info.summaryLeft[2],
    gap:         parseGap(info.summaryLeft[3]),
    keyArea:     info.summaryLeft[4],
    corr:        parseFloat(info.summaryRight[0]),
    vol:         parseFloat(info.summaryRight[1]),
    bullish:     parseFloat(info.summaryRight[2]),
    bearish:     parseFloat(info.summaryRight[3]),
    alpha:       parseFloat(info.summaryRight[4]),
    region:      info.region,
    // Pull P/E, P/B, Div Yield from summaryRight indices:
    pe:          info.summaryRight[5]   != null ? parseFloat(info.summaryRight[5])   : null,
    pb:          info.summaryRight[6]   != null ? parseFloat(info.summaryRight[6])   : null,
    divYield:    info.summaryRight[7]   != null ? parseFloat(info.summaryRight[7])   : null,
    // Pull Quality/Growth metrics from the record
    roe:         info.roe            != null ? parseFloat(info.roe)            : null,
    deRatio:     info.de_ratio       != null ? parseFloat(info.de_ratio)       : null,
    revGrowth:   info.rev_growth     != null ? parseFloat(info.rev_growth)     : null,
    payoutRatio: info.payout_ratio   != null ? parseFloat(info.payout_ratio)   : null
  }));

  // Value Investing: P/E < 15, P/B < 2, Div Yield ≥ 2%
  const valueStocks = stocksData.filter(d =>
    d.pe       !== null && d.pe       < 15 &&
    d.pb       !== null && d.pb       < 2 &&
    d.divYield !== null && d.divYield >= 2
  );

  // Quality: ROE ≥ 15%, D/E < 1
  const qualityStocks = stocksData.filter(d =>
    d.roe      !== null && d.roe      >= 15 &&
    d.deRatio  !== null && d.deRatio  < 1
  );

  // Growth: Rev Growth ≥ 15%
  const growthStocks = stocksData.filter(d =>
    d.revGrowth !== null && d.revGrowth >= 15
  );

  // Dividend Income: Div Yield ≥ 3%, Payout Ratio < 0.75
  const dividendStocks = stocksData.filter(d =>
    d.divYield    !== null && d.divYield    >= 3 &&
    d.payoutRatio !== null && d.payoutRatio < 0.75
  );

  // Low Volatility (score == 100 and vol < 1)
  const lowVolStocks = stocksData.filter(d =>
    d.score === 100 && d.vol < 1
  );

  // ETF data
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
  const etf1 = etfData.filter(d => d.score === 100);
  const etf2 = etf1.filter(d => d.corr < 0.1);
  const etf3 = etf1.filter(d => d.vol < 1);
  const etf4 = etf1.filter(d => d.bullish > 1 && d.bearish < 1 && d.alpha > 1);

  // Futures data
  const futData = Object.entries(window.futuresFullData).map(([inst, info]) => ({
    instrument: inst,
    score:      parseFloat(info.summaryLeft[0]),
    trend:      info.summaryLeft[1],
    approach:   info.summaryLeft[2],
    gap:        parseGap(info.summaryLeft[3]),
    corr:       parseFloat(info.summaryRight[0]),
    vol:        parseFloat(info.summaryRight[1])
  }));
  const fut1 = futData.filter(d => Math.abs(d.score) === 100);
  const fut2 = fut1.filter(d => d.corr < 0.1);
  const fut3 = fut1.filter(d => d.vol < 1);

  // FX data
  const fxData = Object.entries(window.fxFullData).map(([inst, info]) => ({
    instrument: inst,
    score:      parseFloat(info.summaryLeft[0]),
    trend:      info.summaryLeft[1],
    approach:   info.summaryLeft[3],
    gap:        parseGap(info.summaryLeft[2])
  }));
  const fx1 = fxData.filter(d => d.score >= 75 || d.score <= -75);

  // Build HTML
  c.innerHTML = `
  <div class="thematic-portfolio-nav">
    <button class="portfolio-tab active" data-target="stocks">STOCKS</button>
    <button class="portfolio-tab" data-target="etfs">ETFS</button>
    <button class="portfolio-tab" data-target="futures">FUTURES</button>
    <button class="portfolio-tab" data-target="fx">FX</button>
  </div>
  <div class="thematic-portfolio-contents">
    <div class="portfolio-tab-content active" data-category="stocks">
      ${renderSection('Value Investing',   ['Instrument','P/E','P/B','Div Yield','Score','Trend','Approach','Gap to Peak','Key Area'], valueStocks)}
      ${renderSection('Quality',           ['Instrument','ROE','D/E','Score','Trend','Approach','Gap to Peak','Key Area'], qualityStocks)}
      ${renderSection('Growth',            ['Instrument','Rev Growth','Score','Trend','Approach','Gap to Peak','Key Area'], growthStocks)}
      ${renderSection('Dividend Income',   ['Instrument','Div Yield','Payout Ratio','Score','Trend','Approach','Gap to Peak','Key Area'], dividendStocks)}
      ${renderSection('Low Volatility',     ['Instrument','Score','Volatility','Trend','Approach','Gap to Peak','Key Area'], lowVolStocks)}
    </div>
    <div class="portfolio-tab-content" data-category="etfs">
      ${renderSection('Trend Following', ['Instrument','Score','Trend','Approach','Gap to Peak'], etf1)}
      ${renderSection('Low Correlation',  ['Instrument','Score','Correlation','Trend','Approach','Gap to Peak'], etf2)}
      ${renderSection('Low Volatility',   ['Instrument','Score','Volatility','Trend','Approach','Gap to Peak'], etf3)}
      ${renderSection('Trend Plus',       ['Instrument','Score','Bullish Alpha','Bearish Alpha','Alpha Strength'], etf4)}
    </div>
    <div class="portfolio-tab-content" data-category="futures">
      ${renderSection('Trend Following', ['Instrument','Score','Trend','Approach','Gap to Peak'], fut1)}
      ${renderSection('Low Correlation',  ['Instrument','Score','Correlation','Trend','Approach','Gap to Peak'], fut2)}
      ${renderSection('Low Volatility',   ['Instrument','Score','Volatility','Trend','Approach','Gap to Peak'], fut3)}
    </div>
    <div class="portfolio-tab-content" data-category="fx">
      ${renderSection('Trend Following', ['Instrument','Score','Trend','Approach','Gap to Peak'], fx1)}
    </div>
  </div>
  `;

  // Tab switching
  c.querySelectorAll('.portfolio-tab').forEach(btn => {
    btn.addEventListener('click', () => {
      c.querySelectorAll('.portfolio-tab').forEach(b => b.classList.remove('active'));
      c.querySelectorAll('.portfolio-tab-content').forEach(sec => sec.classList.remove('active'));
      btn.classList.add('active');
      c.querySelector(`.portfolio-tab-content[data-category="${btn.dataset.target}"]`).classList.add('active');
    });
  });

  // Show friendly message if a tab has no sections
  c.querySelectorAll('.portfolio-tab-content').forEach(content => {
    if (!content.querySelector('.thematic-portfolio-section')) {
      content.innerHTML = `
        <div class="no-ideas">
          <p>No instruments match these criteria.</p>
        </div>
      `;
    }
  });
}

function renderSection(title, headers, rows) {
  if (!rows || rows.length === 0) return '';
  const base = window.location.origin + window.location.pathname;
  const allHeaders = [...headers, 'FULL ANALYSIS'];
  return `
  <div class="thematic-portfolio-section">
    <h2>${title}</h2>
    <div class="thematic-portfolio-table-container">
      <table class="thematic-portfolio-table">
        <thead>
          <tr>${allHeaders.map(h => `<th>${h}</th>`).join('')}</tr>
        </thead>
        <tbody>
          ${rows.map(r =>
            `<tr>` +
              headers.map(h => `<td>${r[headerKeyMap[h]]}</td>`).join('') +
              `<td class="full-analysis">
                <a href="${base}?instrument=${encodeURIComponent(r.instrument)}" target="_blank">🔗</a>
              </td>` +
            `</tr>`
          ).join('')}
        </tbody>
      </table>
    </div>
  </div>
  `;
}
