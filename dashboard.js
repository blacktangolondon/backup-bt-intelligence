// dashboard.js
// ----------------
// Handles dashboard updates (Blocks 1–4), tab events, fullscreen, YouTube popup, and global event handlers.

import { renderBarChart, renderPieChart, destroyChartIfExists } from "./charts.js";
import futuresMap from "./futuresMap.js";
import { showSpread } from "./spreadView.js";

// Helper: parseGap value.
export function parseGap(val) {
  return (val === "-" || isNaN(parseFloat(val))) ? 0 : parseFloat(val);
}

// Helper: format FX key area to 4 decimals
function formatFxKeyArea(str) {
  if (!str) return str;
  return String(str).replace(/-?\d+(\.\d+)?/g, n => (+n).toFixed(4));
}

// Label arrays for Block 3
export const leftLabels        = [
  "SCORE","TREND","APPROACH","GAP TO PEAK","KEY AREA","MICRO","MATH","STATS","TECH"
];
export const rightLabels       = [
  "S&P500 CORRELATION","S&P500 VOLATILITY RATIO","BULLISH ALPHA","BEARISH ALPHA",
  "ALPHA STRENGHT","PE RATIO","EPS","1 YEAR HIGH","1 YEAR LOW"
];
export const etfLeftLabels     = [
  "SCORE","TREND","APPROACH","GAP TO PEAK","KEY AREA","MATH","STATS","TECH"
];
export const etfRightLabels    = [
  "S&P500 CORRELATION","S&P500 VOLATILITY RATIO","BULLISH ALPHA","BEARISH ALPHA",
  "ALPHA STRENGHT","CATEGORY","CATEGORY 2","TICKER"
];
export const futuresLeftLabels = [
  "SCORE","TREND","APPROACH","GAP TO PEAK / TO VALLEY","KEY AREA","LIMIT","POTENTIAL EXTENSION"
];
export const futuresRightLabels= [
  "S&P500 CORRELATION","S&P500 VOLATILITY RATIO","ALPHA STRENGHT","MID TERM PRICE % PROJECTION",
  "MATH","STATS","TECH"
];
export const fxLeftLabels      = [
  "SCORE","TREND","APPROACH","GAP TO PEAK / TO VALLEY","KEY AREA","LIMIT","POTENTIAL EXTENSION"
];
export const fxRightLabels     = [
  "S&P500 CORRELATION","S&P500 VOLATILITY RATIO","ALPHA STRENGHT","MID TERM PRICE % PROJECTION",
  "MATH","STATS","TECH"
];

// --- New: Excel-style labels for STOCKS (left/right) ---
export const equityExcelLeftLabels = [
  "SCORE","P/E RATIO","EPS","P/B RATIO","ROE",
  "REVENUE GROWTH","DEBT-TO-EQUITY","DIVIDEND YIELD","PAYOUT RATIO"
];
export const equityExcelRightLabels = [
  "S&P500 CORRELATION","S&P500 VOLATILITY RATIO","BULLISH ALPHA","BEARISH ALPHA",
  "ALPHA STRENGHT","1 YEAR HIGH","1 YEAR LOW","1 YEAR RANGE %","GAP TO PEAK %"
];

/* Block 1: TradingView Advanced Chart */
function getEl(id) { return document.getElementById(id); }
function updateChartGeneric(instrumentName, groupData, containerId = "block1") {
  // Fallback per vecchi id
  let container = getEl(containerId) || getEl("block1-chart") || getEl("block1-container");
  if (!container) {
    console.warn("[Block1] Container not found. Tried:", containerId, "block1-chart", "block1-container");
    return;
  }
  container.innerHTML = "";

  const info = groupData[instrumentName];
  if (!info || !info.tvSymbol) {
    container.textContent = "No chart data available.";
    return;
  }

  const symbol = info.tvSymbol.replace(/-/g, '_');

  const script = document.createElement("script");
  script.type = "text/javascript";
  script.src  = "https://s3.tradingview.com/external-embedding/embed-widget-advanced-chart.js";
  script.async = true;
  script.text = `{
    "autosize": true,
    "symbol": "${symbol}",
    "interval": "D",
    "timezone": "Etc/UTC",
    "theme": "dark",
    "style": "1",
    "locale": "en",
    "withdateranges": true,
    "hide_side_toolbar": false,
    "allow_symbol_change": false,
    "backgroundColor": "#000000",
    "details": true,
    "calendar": false,
    "support_host": "https://www.tradingview.com"
  }`;
  container.appendChild(script);
}
export function updateChart(instrumentName, groupData) {
  updateChartGeneric(instrumentName, groupData, "block1");
}

/* Block 2: Symbol Overview (Right big chart) */
export function updateSymbolOverview(instrumentName, groupData) {
  // Fallback su vecchi id se necessario
  const container = getEl("block2") || getEl("block2-symbol-overview") || getEl("block2-container");
  if (!container) {
    console.warn("[Block2] Container not found.");
    return;
  }
  container.innerHTML = "";

  const info = groupData[instrumentName];
  if (!info || !info.tvSymbol) {
    container.textContent = "No data available for symbol overview.";
    return;
  }
  const symbol = info.tvSymbol.replace(/-/g, '_');

  const script = document.createElement("script");
  script.type = "text/javascript";
  script.src  = "https://s3.tradingview.com/external-embedding/embed-widget-symbol-overview.js";
  script.async = true;
  script.text  = `{
    "symbols": [[ "${symbol}" ]],
    "chartOnly": true,
    "width": "100%",
    "height": "100%",
    "locale": "en",
    "colorTheme": "dark",
    "autosize": true,
    "showVolume": false,
    "showMA": false,
    "hideDateRanges": false,
    "hideMarketStatus": false,
    "hideSymbolLogo": false,
    "scalePosition": "right",
    "scaleMode": "Normal",
    "fontFamily": "Trebuchet MS, sans-serif",
    "fontSize": "12",
    "noTimeScale": false,
    "valuesTracking": "1",
    "changeMode": "price-and-percent",
    "chartType": "area",
    "lineWidth": 2,
    "lineType": 0,
    "dateRange": "12M",
    "upColor": "#22ab94",
    "downColor": "#f23645",
    "lineColor": "#f23645",
    "support_host": "https://www.tradingview.com"
  }`;
  container.appendChild(script);
}

/* Block 3: Trend Score (table + TradingView tech analysis) */

// --- Helpers for Excel-style STOCKS mapping & formatting ---
function fmt(n, d = 2) {
  if (n == null || n === '-' || isNaN(+n)) return '-';
  return (+n).toFixed(d);
}
function fmtPctSmart(n, d = 2) {
  if (n == null || n === '-' || isNaN(+n)) return '-';
  let v = +n;
  if (Math.abs(v) <= 1.5) v = v * 100; // treat 0.04 as 4%
  return v.toFixed(d) + '%';
}
function oneYearRangePct(info) {
  const hi = +info.one_year_high, lo = +info.one_year_low;
  if (!isFinite(hi) || !isFinite(lo) || lo === 0) return '-';
  return (((hi - lo) / Math.abs(lo)) * 100).toFixed(2) + '%';
}
function getEquityExcelLeftVal(label, info) {
  switch (label) {
    case "SCORE":            return (info.final_score ?? info.secondary_score ?? '-');
    case "P/E RATIO":        return fmt(info.pe_ratio);
    case "EPS":              return fmt(info.eps);
    case "P/B RATIO":        return fmt(info.pb_ratio);
    case "ROE":              return fmtPctSmart(info.return_on_equity);
    case "REVENUE GROWTH":   return fmtPctSmart(info.revenue_growth);
    case "DEBT-TO-EQUITY":   return fmt(info.debt_to_equity);
    case "DIVIDEND YIELD":   return fmtPctSmart(info.div_yield);
    case "PAYOUT RATIO":     return fmtPctSmart(info.payout_ratio);
    default: return '-';
  }
}
function getEquityExcelRightVal(label, info) {
  switch (label) {
    case "S&P500 CORRELATION":      return fmt(info.sp500_correlation);
    case "S&P500 VOLATILITY RATIO": return fmt(info.sp500_volatility_ratio);
    case "BULLISH ALPHA":           return fmt(info.bullish_alpha);
    case "BEARISH ALPHA":           return fmt(info.bearish_alpha);
    case "ALPHA STRENGHT":          return fmt(info.alpha_strength);
    case "1 YEAR HIGH":             return fmt(info.one_year_high);
    case "1 YEAR LOW":              return fmt(info.one_year_low);
    case "1 YEAR RANGE %":          return oneYearRangePct(info);
    case "GAP TO PEAK %":           return (info.gap_to_peak == null ? '-' : fmt(info.gap_to_peak) + '%');
    default: return '-';
  }
}

function updateBlock3Generic(instrumentName, groupData, rowCount, leftLabelArr, rightLabelArr, tradingViewUpdater) {
  const trendScoreContainer = document.getElementById("block3-trendscore");
  trendScoreContainer.innerHTML = '<div class="loading-message"><span>CALCULATING.</span></div>';
  setTimeout(() => {
    const info = groupData[instrumentName];
    trendScoreContainer.innerHTML = "";
    if (!info) {
      trendScoreContainer.textContent = `No data available for ${instrumentName}`;
      tradingViewUpdater(instrumentName);
      showBlock3Tab("trendscore");
      return;
    }

    const isFxTable = (leftLabelArr === fxLeftLabels);
    const isEquityExcel = (leftLabelArr === equityExcelLeftLabels);

    const table = document.createElement("table");
    for (let i = 0; i < rowCount; i++) {
      const tr = document.createElement("tr");

      const td1 = document.createElement("td");
      td1.textContent = leftLabelArr[i] || "";

      let val;
      if (isEquityExcel) {
        val = getEquityExcelLeftVal(leftLabelArr[i], info);
      } else if (leftLabelArr === etfLeftLabels && i >= 5) {
        val = info.summaryLeft[i + 1] || "";
      } else {
        val = info.summaryLeft[i] || "";
      }
      if (!isEquityExcel && leftLabelArr[i] === "STATS") {
        if (val === "MEDIUM TERM UP")    val = "MEDIUM TERM BULLISH";
        else if (val === "MEDIUM TERM DOWN") val = "MEDIUM TERM BEARISH";
      }

      // FX: format KEY AREA to 4 decimals
      if (isFxTable && leftLabelArr[i] === "KEY AREA") {
        val = formatFxKeyArea(val);
      }

      const td2 = document.createElement("td");
      if (
        typeof val === "string" &&
        (leftLabelArr[i].includes("GAP") || leftLabelArr[i].includes("TO VALLEY")) &&
        (val === "-" || parseFloat(val) === 0)
      ) {
        td2.textContent = "0%";
      } else {
        td2.textContent = val;
      }

      const td3 = document.createElement("td");
      td3.textContent = rightLabelArr[i] || "";

      const td4 = document.createElement("td");
      let rightVal;
      if (isEquityExcel) {
        rightVal = getEquityExcelRightVal(rightLabelArr[i], info);
      } else if (leftLabelArr === etfLeftLabels) {
        if (i === 5)      rightVal = info.summaryRight[7];
        else if (i === 6) rightVal = info.summaryRight[8];
        else if (i === 7) rightVal = info.ticker || info.tvSymbol;
        else              rightVal = info.summaryRight[i];
      } else {
        rightVal = info.summaryRight[i];
      }
      td4.textContent = rightVal || "";

      tr.append(td1, td2, td3, td4);
      table.appendChild(tr);
    }
    trendScoreContainer.appendChild(table);

    if (
      groupData === window.futuresFullData ||
      ["CAC 40","FTSE MIB"].includes(instrumentName)
    ) {
      document.getElementById("block3-tv-tab").style.display = "none";
    } else {
      document.getElementById("block3-tv-tab").style.display = "";
    }

    tradingViewUpdater(instrumentName);
    showBlock3Tab("trendscore");
  }, 50);
}

function updateBlock3TradingViewGeneric(instrumentName, groupData) {
  const info   = groupData[instrumentName];
  const symbol = ((info && info.tvSymbol) ? info.tvSymbol : "NASDAQ:AMZN").replace(/-/g, '_');
  const tvContainer = document.getElementById("block3-tradingview");
  tvContainer.innerHTML = "";
  const widgetDiv = document.createElement("div");
  widgetDiv.className = "tradingview-widget-container";
  widgetDiv.innerHTML = `<div class="tradingview-widget-container__widget"></div>
    <div class="tradingview-widget-copyright"><a href="https://www.tradingview.com/" rel="noopener nofollow" target="_blank"></a></div>`;
  tvContainer.appendChild(widgetDiv);
  const script = document.createElement("script");
  script.type  = "text/javascript";
  script.src   = "https://s3.tradingview.com/external-embedding/embed-widget-technical-analysis.js";
  script.async = true;
  script.textContent = `{
    "interval":"1D","width":"100%","height":"100%","isTransparent": false,
    "symbol":"${symbol}","showIntervalTabs":false,"colorTheme":"dark",
    "locale":"en","support_host":"https://www.tradingview.com"
  }`;
  tvContainer.appendChild(script);
}

export function updateBlock3(instrumentName, groupData, options = {}) {
  let rowCount, leftArr, rightArr, tvUpdater;
  if (options.isETF) {
    rowCount = 8; leftArr = etfLeftLabels; rightArr = etfRightLabels;
    tvUpdater = inst => updateBlock3TradingViewGeneric(inst, window.etfFullData);
  } else if (options.isFutures) {
    rowCount = 7; leftArr = futuresLeftLabels; rightArr = futuresRightLabels;
    tvUpdater = inst => updateBlock3TradingViewGeneric(inst, window.futuresFullData);
  } else if (options.isFX) {
    rowCount = 7; leftArr = fxLeftLabels; rightArr = fxRightLabels;
    tvUpdater = inst => updateBlock3TradingViewGeneric(inst, window.fxFullData);
  } else {
    // STOCKS → use the Excel-style layout by default
    rowCount = 9; leftArr = equityExcelLeftLabels; rightArr = equityExcelRightLabels;
    tvUpdater = inst => updateBlock3TradingViewGeneric(inst, window.stocksFullData);
  }
  updateBlock3Generic(instrumentName, groupData, rowCount, leftArr, rightArr, tvUpdater);
}

/* Block 3 Tabs */
export function initBlock3Tabs() {
  document.querySelectorAll(".block3-tab").forEach(btn => {
    btn.addEventListener("click", () => {
      const tab = btn.getAttribute("data-tab");
      showBlock3Tab(tab);
    });
  });
}
export function showBlock3Tab(tabName) {
  const sections = ["trendscore", "tradingview"];
  sections.forEach(sec => {
    document.getElementById(`block3-${sec}`).style.display = (sec === tabName ? "block" : "none");
  });
}

/* Block 4: Correlation Bar Chart */
export function updateBlock4(instrumentName, correlationsOrData, maybeReturns) {
  // Container esistente in index.html
  const host = document.getElementById("block4");
  if (!host) {
    console.warn("[Block4] Container #block4 non trovato");
    return;
  }
  host.innerHTML = '<canvas id="block4-correlation-chart"></canvas>';

  const ctxId = "block4-correlation-chart";
  destroyChartIfExists(ctxId);

  // Accetta sia un array di correlazioni sia un map globale
  let corrList = [];
  if (Array.isArray(correlationsOrData)) {
    corrList = correlationsOrData;
  } else if (window.correlationMap && window.correlationMap[instrumentName]) {
    corrList = window.correlationMap[instrumentName];
  } else if (correlationsOrData && correlationsOrData[instrumentName] && correlationsOrData[instrumentName].correlations) {
    corrList = correlationsOrData[instrumentName].correlations;
  }

  const labels = [];
  const values = [];
  (corrList || []).slice(0, 10).forEach(item => {
    labels.push(item.symbol || item.ticker || "");
    values.push(+item.value || 0);
  });
  renderBarChart(ctxId, labels, values);
}

/* Sidebar interaction: select item -> update all blocks */
export function attachSidebarHandlers() {
  const sidebar = document.getElementById("sidebar");
  if (!sidebar) return;
  sidebar.addEventListener("click", (e) => {
    const item = e.target.closest(".sidebar-item");
    if (!item) return;

    const symbol = item.getAttribute("data-symbol");
    const group  = item.getAttribute("data-group"); // stocks / etf / futures / fx / spreads
    const name   = item.getAttribute("data-name") || symbol;

    if (group === "spreads") {
      showSpread(symbol);
      return;
    }

    let dataRef, opts = {};
    if (group === "etf") {
      dataRef = window.etfFullData; opts.isETF = true;
    } else if (group === "futures") {
      dataRef = window.futuresFullData; opts.isFutures = true;
    } else if (group === "fx") {
      dataRef = window.fxFullData; opts.isFX = true;
    } else {
      dataRef = window.stocksFullData;
    }

    updateChart(name, dataRef);
    updateSymbolOverview(name, dataRef);
    updateBlock3(name, dataRef, opts);

    try {
      const corr = (window.correlationMap && window.correlationMap[name]) ? window.correlationMap[name] : [];
      updateBlock4(name, corr);
    } catch(e) {
      console.warn('No correlation data available for', name, e);
    }
  });
}

/* Fullscreen handlers for Block 1 & 2 */
function toggleFullscreen(el) {
  if (!document.fullscreenElement) el?.requestFullscreen?.();
  else document.exitFullscreen?.();
}
export function initFullscreenButtons() {
  const btn1 = document.getElementById("btn-fullscreen-block1");
  const btn2 = document.getElementById("btn-fullscreen-block2");
  if (btn1) btn1.addEventListener("click", () => toggleFullscreen(document.getElementById("block1")));
  if (btn2) btn2.addEventListener("click", () => toggleFullscreen(document.getElementById("block2")));
}

/* YouTube popup (if used somewhere) */
export function initYouTubePopup() {
  document.querySelectorAll("[data-youtube]").forEach(el => {
    el.addEventListener("click", () => {
      const id = el.getAttribute("data-youtube");
      const overlay = document.createElement("div");
      overlay.className = "yt-overlay";
      overlay.innerHTML = `
        <div class="yt-modal">
          <button class="yt-close">×</button>
          <iframe width="100%" height="100%" src="https://www.youtube.com/embed/${id}" frameborder="0" allowfullscreen></iframe>
        </div>`;
      document.body.appendChild(overlay);
      overlay.querySelector(".yt-close").addEventListener("click", () => overlay.remove());
    });
  });
}

/* Global init (called from main) */
export function initDashboardEvents() {
  initBlock3Tabs();
  initFullscreenButtons();
  initYouTubePopup();
}
