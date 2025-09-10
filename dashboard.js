// dashboard.js
// ----------------
// Handles dashboard updates (Blocks 1–4), tab events, fullscreen, YouTube popup, and global event handlers.

import { renderBarChart, renderPieChart, destroyChartIfExists } from "./charts.js";
import futuresMap from "./futuresMap.js";
import { showSpread } from "./spreadView.js";

/* ------------------------------ Helpers ------------------------------ */

function getEl(id){ return document.getElementById(id); }
export function parseGap(val){ return (val==='-'||isNaN(parseFloat(val)))?0:parseFloat(val); }
function formatFxKeyArea(str){ if(!str) return str; return String(str).replace(/-?\d+(\.\d+)?/g, n => (+n).toFixed(4)); }

function fmt(n,d=2){ if(n==null||n==='-'||isNaN(+n)) return '-'; return (+n).toFixed(d); }
function fmtPctSmart(n,d=2){ if(n==null||n==='-'||isNaN(+n)) return '-'; let v=+n; if(Math.abs(v)<=1.5) v=v*100; return v.toFixed(d)+'%'; }
function oneYearRangePct(info){
  const hi=+info.one_year_high, lo=+info.one_year_low;
  if(!isFinite(hi)||!isFinite(lo)||lo===0) return '-';
  return (((hi-lo)/Math.abs(lo))*100).toFixed(2)+'%';
}

// normalizza stringhe per i match
function norm(s){ return String(s||'').trim().replace(/\s+/g,' ').toLowerCase(); }

/** Resolver robusto: funziona con array o map, matcha per chiave, ticker, name, tvSymbol */
function resolveInfo(groupData, instrumentName){
  if(!groupData) return null;

  // 1) accesso diretto per map
  if(!Array.isArray(groupData) && instrumentName in groupData) return groupData[instrumentName];

  // 2) lavora su array (o valori della map)
  const arr = Array.isArray(groupData) ? groupData : Object.values(groupData);
  const target = norm(instrumentName);

  // match esatto su ticker o name
  let info = arr.find(o => norm(o.ticker)===target || norm(o.name)===target);
  if(info) return info;

  // match “startsWith/contains” sul ticker (utile con ticker imbottiti di spazi o suffissi)
  info = arr.find(o => norm(o.ticker).startsWith(target) || norm(o.ticker).includes(target));
  if(info) return info;

  // match su tvSymbol (es. XETR:1COV vs “Covestro AG” → non perfetto, ma aiuta)
  const targetSlim = target.replace(/[^a-z0-9]/g,'');
  info = arr.find(o => norm(o.tvSymbol).replace(/[^a-z0-9]/g,'').includes(targetSlim));
  if(info) return info;

  // fallback: prima occorrenza che contiene la prima parola del target
  const first = target.split(' ')[0];
  info = arr.find(o => norm(o.ticker).includes(first));
  return info || null;
}

/* -------------------------- Block 3 Labels --------------------------- */

// ETF / FUTURES / FX (invariati)
export const etfLeftLabels  = ["SCORE","TREND","APPROACH","GAP TO PEAK","KEY AREA","MATH","STATS","TECH"];
export const etfRightLabels = ["S&P500 CORRELATION","S&P500 VOLATILITY RATIO","BULLISH ALPHA","BEARISH ALPHA","ALPHA STRENGHT","1 YEAR HIGH","1 YEAR LOW","TICKER"];
export const futuresLeftLabels  = ["SCORE","TREND","APPROACH","GAP TO PEAK / TO VALLEY","KEY AREA","LIMIT","POTENTIAL EXTENSION"];
export const futuresRightLabels = ["S&P500 CORRELATION","S&P500 VOLATILITY RATIO","ALPHA STRENGHT","MID TERM PRICE % PROJECTION","MATH","STATS","TECH"];
export const fxLeftLabels  = ["SCORE","TREND","APPROACH","GAP TO PEAK / TO VALLEY","KEY AREA","LIMIT","POTENTIAL EXTENSION"];
export const fxRightLabels = ["S&P500 CORRELATION","S&P500 VOLATILITY RATIO","ALPHA STRENGHT","MID TERM PRICE % PROJECTION","MATH","STATS","TECH"];

// ✅ Nuovo layout “Excel” per STOCKS
export const equityExcelLeftLabels  = ["SCORE","P/E RATIO","EPS","P/B RATIO","ROE","REVENUE GROWTH","DEBT-TO-EQUITY","DIVIDEND YIELD","PAYOUT RATIO"];
export const equityExcelRightLabels = ["S&P500 CORRELATION","S&P500 VOLATILITY RATIO","BULLISH ALPHA","BEARISH ALPHA","ALPHA STRENGHT","1 YEAR HIGH","1 YEAR LOW","1 YEAR RANGE %","GAP TO PEAK %"];

/* ------------ Mapping valori per STOCKS dal file instruments.json ----------- */

function getEquityExcelLeftVal(label, info){
  switch(label){
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
function getEquityExcelRightVal(label, info){
  switch(label){
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

export function updateChart(instrumentName, groupData){
  const info   = resolveInfo(groupData, instrumentName);
  const symbol = ((info && info.tvSymbol) ? info.tvSymbol : "NASDAQ:AMZN").replace(/-/g, '_');

  const container = getEl("block1") || getEl("block1-chart") || getEl("block1-container");
  if (!container) return;
  container.innerHTML = "";

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

/* --------------------- Block 2: Symbol Overview ---------------------- */

export function updateSymbolOverview(instrumentName, groupData){
  const info   = resolveInfo(groupData, instrumentName);
  const symbol = ((info && info.tvSymbol) ? info.tvSymbol : "NASDAQ:AMZN").replace(/-/g, '_');

  const container = getEl("block2") || getEl("block2-symbol-overview") || getEl("block2-container");
  if (!container) return;
  container.innerHTML = "";

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

/* --------------- Block 3: TrendScore table + TradingView ------------- */

function updateBlock3TradingViewGeneric(instrumentName, groupData){
  const info   = resolveInfo(groupData, instrumentName);
  const symbol = ((info && info.tvSymbol) ? info.tvSymbol : "NASDAQ:AMZN").replace(/-/g, '_');
  const tvContainer = getEl("block3-tradingview");
  if (!tvContainer) return;
  tvContainer.innerHTML = "";
  const widgetDiv = document.createElement("div");
  widgetDiv.className = "tradingview-widget-container";
  widgetDiv.innerHTML = `<div class="tradingview-widget-container__widget"></div>`;
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

function updateBlock3Generic(instrumentName, groupData, rowCount, leftLabelArr, rightLabelArr, tradingViewUpdater){
  const trendScoreContainer = getEl("block3-trendscore");
  if (!trendScoreContainer) return;

  trendScoreContainer.innerHTML = '<div class="loading-message"><span>CALCULATING.</span></div>';
  setTimeout(() => {
    const info = resolveInfo(groupData, instrumentName);
    trendScoreContainer.innerHTML = "";

    if (!info) {
      trendScoreContainer.textContent = `No data available for ${instrumentName}`;
      tradingViewUpdater(instrumentName, groupData);
      showBlock3Tab("trendscore");
      return;
    }

    const isFxTable     = (leftLabelArr === fxLeftLabels);
    const isEquityExcel = (leftLabelArr === equityExcelLeftLabels);

    const table = document.createElement("table");
    for (let i = 0; i < rowCount; i++) {
      const tr = document.createElement("tr");

      const td1 = document.createElement("td");
      td1.textContent = leftLabelArr[i] || "";

      // Valore sinistro
      let leftVal;
      if (isEquityExcel) {
        leftVal = getEquityExcelLeftVal(leftLabelArr[i], info);
      } else if (info.summaryLeft) { // legacy fallback
        leftVal = (leftLabelArr === etfLeftLabels && i >= 5) ? info.summaryLeft[i + 1] : info.summaryLeft[i];
      } else {
        leftVal = '';
      }

      if (!isEquityExcel && leftLabelArr[i] === "STATS") {
        if (leftVal === "MEDIUM TERM UP")    leftVal = "MEDIUM TERM BULLISH";
        else if (leftVal === "MEDIUM TERM DOWN") leftVal = "MEDIUM TERM BEARISH";
      }
      if (isFxTable && leftLabelArr[i] === "KEY AREA") {
        leftVal = formatFxKeyArea(leftVal);
      }

      const td2 = document.createElement("td");
      td2.textContent = leftVal;

      const td3 = document.createElement("td");
      td3.textContent = rightLabelArr[i] || "";

      // Valore destro
      let rightVal;
      if (isEquityExcel) {
        rightVal = getEquityExcelRightVal(rightLabelArr[i], info);
      } else if (info.summaryRight) { // legacy fallback
        if (leftLabelArr === etfLeftLabels) {
          if (i === 5)      rightVal = info.summaryRight[7];
          else if (i === 6) rightVal = info.summaryRight[8];
          else if (i === 7) rightVal = info.ticker || info.tvSymbol;
          else              rightVal = info.summaryRight[i];
        } else {
          rightVal = info.summaryRight[i];
        }
      } else {
        rightVal = '';
      }

      const td4 = document.createElement("td");
      td4.textContent = rightVal || "";

      tr.append(td1, td2, td3, td4);
      table.appendChild(tr);
    }

    trendScoreContainer.appendChild(table);

    // TradingView tab
    updateBlock3TradingViewGeneric(instrumentName, groupData);
    showBlock3Tab("trendscore");
  }, 50);
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
    // ✅ STOCKS: layout Excel + campi diretti dal JSON
    rowCount = 9; leftArr = equityExcelLeftLabels; rightArr = equityExcelRightLabels;
    tvUpdater = inst => updateBlock3TradingViewGeneric(inst, window.stocksFullData);
  }
  updateBlock3Generic(instrumentName, groupData, rowCount, leftArr, rightArr, tvUpdater);
}

/* -------------------- Block 4: Correlation (Chart) ------------------- */

export function updateBlock4(instrumentName, correlationsOrData) {
  const host = getEl("block4");
  if (!host) return;
  host.innerHTML = '<canvas id="block4-correlation-chart"></canvas>';

  const ctxId = "block4-correlation-chart";
  destroyChartIfExists(ctxId);

  const labels = [];
  const values = [];
  (correlationsOrData || []).slice(0, 10).forEach(item => {
    labels.push(item.symbol || item.ticker || "");
    values.push(+item.value || 0);
  });
  renderBarChart(ctxId, labels, values);
}

/* ---------------- Tabs + Fullscreen + YouTube helpers ---------------- */

export function initBlock3Tabs() {
  document.querySelectorAll(".block3-tab").forEach(btn => {
    btn.addEventListener("click", () => showBlock3Tab(btn.getAttribute("data-tab")));
  });
}
export function showBlock3Tab(tabName) {
  ["trendscore","tradingview"].forEach(sec => {
    const el = getEl(`block3-${sec}`);
    if (el) el.style.display = (sec === tabName ? "block" : "none");
  });
}
export function initFullscreenButtons() {
  const btn1 = getEl("btn-fullscreen-block1");
  const btn2 = getEl("btn-fullscreen-block2");
  if (btn1) btn1.addEventListener("click", () => getEl("block1")?.requestFullscreen?.());
  if (btn2) btn2.addEventListener("click", () => getEl("block2")?.requestFullscreen?.());
}
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
export function initDashboardEvents() {
  initBlock3Tabs();
  initFullscreenButtons();
  initYouTubePopup();
}
