// dashboard.js
// ----------------
// Handles dashboard updates (Blocks 1–4), tab events, fullscreen, YouTube popup, and global event handlers.

import { renderBarChart, renderPieChart, destroyChartIfExists } from "./charts.js";
import futuresMap from "./futuresMap.js";
import { showSpread } from "./spreadView.js";

/* ------------------------------ Helpers ------------------------------ */

// % gap parser (legacy)
export function parseGap(val) {
  return (val === "-" || isNaN(parseFloat(val))) ? 0 : parseFloat(val);
}

// FX: format "KEY AREA" numbers to 4 decimals
function formatFxKeyArea(str) {
  if (!str) return str;
  return String(str).replace(/-?\d+(\.\d+)?/g, n => (+n).toFixed(4));
}

// Generic formatters for Excel-style stock fields
function fmt(n, d = 2) {
  if (n == null || n === '-' || Number.isNaN(+n)) return '-';
  return (+n).toFixed(d);
}
function fmtPctSmart(n, d = 2) {
  if (n == null || n === '-' || Number.isNaN(+n)) return '-';
  let v = +n;
  // se arriva 0.04 intendiamo 4%
  if (Math.abs(v) <= 1.5) v = v * 100;
  return v.toFixed(d) + '%';
}
function oneYearRangePct(info) {
  const hi = +info.one_year_high, lo = +info.one_year_low;
  if (!isFinite(hi) || !isFinite(lo) || lo === 0) return '-';
  return (((hi - lo) / Math.abs(lo)) * 100).toFixed(2) + '%';
}

/* -------------------------- Block 3 Labels --------------------------- */

// LEGACY stock layout (non lo usiamo più di default ma lo teniamo)
export const leftLabels  = [
  "SCORE","TREND","APPROACH","GAP TO PEAK","KEY AREA","MICRO","MATH","STATS","TECH"
];
export const rightLabels = [
  "S&P500 CORRELATION","S&P500 VOLATILITY RATIO","BULLISH ALPHA","BEARISH ALPHA",
  "ALPHA STRENGHT","PE RATIO","EPS","1 YEAR HIGH","1 YEAR LOW"
];

// ETF / FUTURES / FX (invariati)
export const etfLeftLabels  = [
  "SCORE","TREND","APPROACH","GAP TO PEAK","KEY AREA","MATH","STATS","TECH"
];
export const etfRightLabels = [
  "S&P500 CORRELATION","S&P500 VOLATILITY RATIO","BULLISH ALPHA","BEARISH ALPHA",
  "ALPHA STRENGHT","1 YEAR HIGH","1 YEAR LOW","TICKER"
];
export const futuresLeftLabels = [
  "SCORE","TREND","APPROACH","GAP TO PEAK / TO VALLEY","KEY AREA","LIMIT","POTENTIAL EXTENSION"
];
export const futuresRightLabels = [
  "S&P500 CORRELATION","S&P500 VOLATILITY RATIO","ALPHA STRENGHT","MID TERM PRICE % PROJECTION",
  "MATH","STATS","TECH"
];
export const fxLeftLabels = [
  "SCORE","TREND","APPROACH","GAP TO PEAK / TO VALLEY","KEY AREA","LIMIT","POTENTIAL EXTENSION"
];
export const fxRightLabels = [
  "S&P500 CORRELATION","S&P500 VOLATILITY RATIO","ALPHA STRENGHT","MID TERM PRICE % PROJECTION",
  "MATH","STATS","TECH"
];

// ✅ Nuovo layout “Excel” per STOCKS (questo è quello che vedi nello screenshot)
export const equityExcelLeftLabels = [
  "SCORE","P/E RATIO","EPS","P/B RATIO","ROE",
  "REVENUE GROWTH","DEBT-TO-EQUITY","DIVIDEND YIELD","PAYOUT RATIO"
];
export const equityExcelRightLabels = [
  "S&P500 CORRELATION","S&P500 VOLATILITY RATIO","BULLISH ALPHA","BEARISH ALPHA",
  "ALPHA STRENGHT","1 YEAR HIGH","1 YEAR LOW","1 YEAR RANGE %","GAP TO PEAK %"
];

/* ------------ Mapping valori per STOCKS dal file instruments.json ----------- */

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
    default:                 return '-';
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
    default:                        return '-';
  }
}

/* ---------------------- Block 1: Advanced Chart ---------------------- */

function updateChartGeneric(instrumentName, groupData) {
  const info   = groupData[instrumentName];
  const symbol = ((info && info.tvSymbol) ? info.tvSymbol : "NASDAQ:AMZN").replace(/-/g, '_');
  const block1 = document.getElementById("block1");
  const container = block1.querySelector(".tradingview-widget-container");
  container.innerHTML = `<div class="tradingview-widget-container__widget" style="height:calc(100% - 32px);width:100%"></div>`;

  const script = document.createElement('script');
  script.type  = "text/javascript";
  script.src   = "https://s3.tradingview.com/external-embedding/embed-widget-advanced-chart.js";
  script.async = true;
  script.textContent = `{
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
  updateChartGeneric(instrumentName, groupData);
}

/* --------------------- Block 2: Symbol Overview ---------------------- */

function updateSymbolOverviewGeneric(instrumentName, groupData) {
  const info   = groupData[instrumentName];
  const symbol = ((info && info.tvSymbol) ? info.tvSymbol : "NASDAQ:AMZN").replace(/-/g, '_');
  const block2 = document.getElementById("block2");

  let container = block2.querySelector("#symbol-info-container");
  if (!container) {
    container = document.createElement("div");
    container.id = "symbol-info-container";
    block2.appendChild(container);
  }
  container.innerHTML = `<div class="tradingview-widget-container__widget"></div>`;

  const script = document.createElement('script');
  script.type  = "text/javascript";
  script.src   = "https://s3.tradingview.com/external-embedding/embed-widget-symbol-overview.js";
  script.async = true;
  script.textContent = `{
    "symbols": [ [ "${symbol}|1D" ] ],
    "chartOnly": false,
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
    "fontFamily": "-apple-system, BlinkMacSystemFont, Roboto, Ubuntu, sans-serif",
    "fontSize": "10",
    "noTimeScale": false,
    "valuesTracking": "1",
    "changeMode": "price-and-percent",
    "chartType": "area",
    "maLineColor": "#2962FF",
    "maLineWidth": 1,
    "maLength": 9,
    "headerFontSize": "medium",
    "backgroundColor": "rgba(19, 23, 34, 0)",
    "widgetFontColor": "rgba(255, 152, 0, 1)",
    "lineWidth": 2,
    "lineType": 0,
    "dateRanges": ["1d|1","1m|30","3m|60","12m|1D","60m|1W","all|1M"]
  }`;
  container.appendChild(script);
}
export function updateSymbolOverview(instrumentName, groupData) {
  updateSymbolOverviewGeneric(instrumentName, groupData);
}

/* ---------------- Block 3: TrendScore + TradingView ------------------ */

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

    const isFxTable      = (leftLabelArr === fxLeftLabels);
    const isEquityExcel  = (leftLabelArr === equityExcelLeftLabels);

    const table = document.createElement("table");
    for (let i = 0; i < rowCount; i++) {
      const tr = document.createElement("tr");

      // Colonna sinistra: etichetta
      const td1 = document.createElement("td");
      td1.textContent = leftLabelArr[i] || "";

      // Valore sinistro
      let leftVal;
      if (isEquityExcel) {
        leftVal = getEquityExcelLeftVal(leftLabelArr[i], info);
      } else if (leftLabelArr === etfLeftLabels && i >= 5) {
        leftVal = (info.summaryLeft && info.summaryLeft[i + 1]) || "";
      } else if (info.summaryLeft) {
        leftVal = info.summaryLeft[i] || "";
      } else {
        // fallback assoluto (se mai servisse)
        leftVal = '';
      }

      // Normalizzazioni legacy
      if (!isEquityExcel && leftLabelArr[i] === "STATS") {
        if (leftVal === "MEDIUM TERM UP")   leftVal = "MEDIUM TERM BULLISH";
        if (leftVal === "MEDIUM TERM DOWN") leftVal = "MEDIUM TERM BEARISH";
      }

      // FX: formatta KEY AREA
      if (isFxTable && leftLabelArr[i] === "KEY AREA") {
        leftVal = formatFxKeyArea(leftVal);
      }

      const td2 = document.createElement("td");
      if (
        typeof leftVal === "string" &&
        (leftLabelArr[i].includes("GAP") || leftLabelArr[i].includes("TO VALLEY")) &&
        (leftVal === "-" || parseFloat(leftVal) === 0)
      ) {
        td2.textContent = "0%";
      } else {
        td2.textContent = leftVal;
      }

      // Colonna destra: etichetta
      const td3 = document.createElement("td");
      td3.textContent = rightLabelArr[i] || "";

      // Valore destro
      let rightVal;
      if (isEquityExcel) {
        rightVal = getEquityExcelRightVal(rightLabelArr[i], info);
      } else if (leftLabelArr === etfLeftLabels) {
        if (i === 5)      rightVal = info.summaryRight?.[7];
        else if (i === 6) rightVal = info.summaryRight?.[8];
        else if (i === 7) rightVal = info.ticker || info.tvSymbol;
        else              rightVal = info.summaryRight?.[i];
      } else if (info.summaryRight) {
        rightVal = info.summaryRight[i];
      } else {
        rightVal = '';
      }

      const td4 = document.createElement("td");
      td4.textContent = rightVal || "";

      tr.append(td1, td2, td3, td4);
      table.appendChild(tr);
    }
    trendScoreContainer.appendChild(table);

    // Mostra/Nascondi tab TradingView (niente ID non esistenti)
    const tabsWrap    = document.getElementById("block3-tabs");
    const contentWrap = document.getElementById("block3-content");
    if (
      groupData === window.futuresFullData ||
      ["CAC 40","FTSE MIB"].includes(instrumentName)
    ) {
      if (tabsWrap)    tabsWrap.style.display = "none";
      if (contentWrap) contentWrap.style.height = "100%";
      document.getElementById("block3-tradingview").innerHTML = "";
      // riga compatta a piena altezza
      [...table.rows].forEach(r => r.style.height = `${100/table.rows.length}%`);
    } else {
      if (tabsWrap)    tabsWrap.style.display = "flex";
      if (contentWrap) contentWrap.style.height = "calc(100% - 30px)";
      tradingViewUpdater(instrumentName);
    }

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
    // ✅ STOCKS: usa layout Excel e campi diretti dal JSON
    rowCount = 9; leftArr = equityExcelLeftLabels; rightArr = equityExcelRightLabels;
    tvUpdater = inst => updateBlock3TradingViewGeneric(inst, window.stocksFullData);
  }
  updateBlock3Generic(instrumentName, groupData, rowCount, leftArr, rightArr, tvUpdater);
}

/* --------------------- Block 3: Tabs handling ------------------------ */

export function initBlock3Tabs() {
  document.querySelectorAll('#block3-tabs button').forEach(tab => {
    tab.addEventListener('click', () => {
      showBlock3Tab(tab.dataset.tab);
    });
  });
}

export function showBlock3Tab(tabName) {
  const trendBtn = document.querySelector('#block3-tabs button[data-tab="trendscore"]');
  const tvBtn    = document.querySelector('#block3-tabs button[data-tab="tradingview"]');
  const trendDiv = document.getElementById("block3-trendscore");
  const tvDiv    = document.getElementById("block3-tradingview");
  trendBtn?.classList.remove("active-tab");
  tvBtn?.classList.remove("active-tab");
  if (trendDiv) trendDiv.style.display = "none";
  if (tvDiv)    tvDiv.style.display    = "none";
  if (tabName === "trendscore") {
    trendBtn?.classList.add("active-tab");
    if (trendDiv) trendDiv.style.display = "block";
  } else {
    tvBtn?.classList.add("active-tab");
    if (tvDiv) tvDiv.style.display = "block";
  }
}

/* -------------------- Block 4: Correlation (Chart) ------------------- */

function pearsonCorrelation(x, y) {
  if (!Array.isArray(x) || !Array.isArray(y) || x.length === 0 || y.length === 0) return 0;
  const n = Math.min(x.length, y.length);
  const xS = x.slice(0, n), yS = y.slice(0, n);
  const mx = xS.reduce((a, b) => a + b, 0) / n;
  const my = yS.reduce((a, b) => a + b, 0) / n;
  let num = 0, dx2 = 0, dy2 = 0;
  for (let i = 0; i < n; i++) {
    const dx = xS[i] - mx, dy = yS[i] - my;
    num += dx * dy;
    dx2 += dx * dx;
    dy2 += dy * dy;
  }
  return dx2 === 0 || dy2 === 0 ? 0 : num / Math.sqrt(dx2 * dy2);
}

function drawMostCorrelatedChart(top10) {
  const block4 = document.getElementById("block4");
  block4.innerHTML = '<canvas id="correlationChart"></canvas>';
  const ctx = document.getElementById("correlationChart").getContext("2d");
  const labels = top10.map(i => i[0]), dataArr = top10.map(i => i[1]);
  new Chart(ctx, {
    type: "bar",
    data: {
      labels,
      datasets: [{
        label: "CORRELATION",
        data: dataArr,
        backgroundColor: 'orange',
        borderColor: 'orange',
        borderWidth: 1
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      indexAxis: "y",
      scales: {
        x: { ticks: { color: "white" }, grid: { color: "rgba(255,255,255,0.2)" } },
        y: { ticks: { color: "white" }, grid: { color: "rgba(255,255,255,0.2)" } }
      },
      plugins: {
        legend: { display: false },
        title: {
          display: true,
          text: "10 MOST CORRELATED INSTRUMENTS",
          color: "white",
          font: { size: 14, family: "Arial" }
        }
      }
    }
  });
}

function getCorrelationListForCategory(inst, returnsData) {
  const data = returnsData[inst];
  if (!data || !data.length) return [];
  return Object.keys(returnsData)
    .filter(n => n !== inst && returnsData[n] && returnsData[n].length > 0)
    .map(n => [n, pearsonCorrelation(data, returnsData[n])])
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10);
}

export function updateBlock4(instrumentName, groupData, groupReturns) {
  const blk = document.getElementById("block4");
  blk.innerHTML = '<div class="loading-message"><span>CALCULATING...</span></div>';
  setTimeout(() => {
    blk.innerHTML = "";

    const info = groupData[instrumentName];
    let lookupKey = instrumentName;

    if (info && info.tvSymbol && info.tvSymbol.includes(":")) {
      const code = info.tvSymbol.split(":")[1];
      if (code in groupReturns) {
        lookupKey = code;
      } else {
        const match = Object.keys(groupReturns).find(k => k.includes(code));
        if (match) lookupKey = match;
      }
    }

    if (groupData === window.futuresFullData) {
      const tv = info.tvSymbol || "";
      if (futuresMap[tv]) lookupKey = futuresMap[tv];
    }

    if (!(lookupKey in groupReturns)) {
      const alt = Object.keys(groupReturns).find(
        k => k.startsWith(lookupKey) || k.includes(lookupKey)
      );
      if (alt) lookupKey = alt;
    }

    if (!Array.isArray(groupReturns[lookupKey]) || !groupReturns[lookupKey].length) {
      blk.innerHTML = `<p style="color:white;">No correlation data found for ${instrumentName}</p>`;
      return;
    }

    const cor = getCorrelationListForCategory(lookupKey, groupReturns);
    if (!cor.length) {
      blk.innerHTML = `<p style="color:white;">No correlation data found for ${instrumentName}</p>`;
      return;
    }

    drawMostCorrelatedChart(cor);
  }, 300);
}

/* ---------------- Global event handlers / Sidebar -------------------- */

export function initEventHandlers(allGroupData, allPricesData, allReturnsData) {
  document.querySelectorAll('.instrument-item').forEach(item => {
    item.addEventListener('click', () => {
      // torna sempre alla dashboard dai template portfolio
      document.getElementById('main-content').style.display = 'grid';
      document.getElementById('portfolio-builder-template').style.display = 'none';
      document.getElementById('thematic-portfolio-template').style.display = 'none';

      const key = item.textContent.trim();

      // nascondi tutto
      document.querySelectorAll('.content-block').forEach(b => b.style.display = 'none');

      // spreads
      if (allGroupData.SPREADS && key in allGroupData.SPREADS) {
        document.getElementById('block5').style.display = 'block';
        showSpread(key);
        return;
      }

      // mostra i blocchi 1–4
      ['block1','block2','block3','block4'].forEach(id => {
        const el = document.getElementById(id);
        if (el) el.style.display = 'block';
      });

      let groupData, options;
      if (allGroupData.STOCKS[key]) {
        groupData = allGroupData.STOCKS; options = {};
      } else if (allGroupData.ETFS[key]) {
        groupData = allGroupData.ETFS; options = { isETF: true };
      } else if (allGroupData.FUTURES[key]) {
        groupData = allGroupData.FUTURES; options = { isFutures: true };
      } else if (allGroupData.FX[key]) {
        groupData = allGroupData.FX; options = { isFX: true };
      }

      updateChart(key, groupData);
      updateSymbolOverview(key, groupData);
      updateBlock3(key, groupData, options);
      updateBlock4(key, groupData, allReturnsData);
    });
  });
}

/* ---------------- Fullscreen & YouTube helpers ---------------------- */

export function updateFullscreenButton() {
  const btn = document.getElementById("fullscreen-button");
  if (!btn) return;
  btn.innerHTML = document.fullscreenElement == null
    ? `<span class="arrow">&#8598;</span><span class="arrow">&#8599;</span><br><span class="arrow">&#8601;</span><span class="arrow">&#8600;</span>`
    : `<span class="arrow">&#8598;</span><span class="arrow">&#8599;</span><br><span class="arrow">&#8601;</span><span class="arrow">&#8600;</span>`;
}
export function openYouTubePopup() {
  const yt = document.getElementById("youtube-popup");
  if (!yt) return;
  yt.style.display = "block";
  if (typeof $ === "function" && $.fn.draggable) {
    $('#youtube-popup').draggable({ handle: '#youtube-popup-header' });
  }
}
export function updateYouTubePlayer() {
  const url = document.getElementById("youtube-url")?.value?.trim() || "";
  const iframe = document.getElementById("youtube-iframe");
  if (iframe) iframe.src = url;
}
