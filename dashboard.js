// dashboard.js
// ----------------
// EQUITIES: Block2 = Single-Index Model (SIM); Block3 = risk/return metrics (Return= CAGR window); Block4 = fondamentali.

import { renderBarChart, renderPieChart, destroyChartIfExists, renderScatterWithRegression } from "./charts.js";

// ───────────────────────────────────────────────────────────
// Label arrays (compatibilità con moduli legacy)
// ───────────────────────────────────────────────────────────
export const leftLabels        = ["SCORE","TREND","APPROACH","GAP TO PEAK","KEY AREA","MICRO","MATH","STATS","TECH"];
export const rightLabels       = ["S&P500 CORRELATION","S&P500 VOLATILITY RATIO","BULLISH ALPHA","BEARISH ALPHA","ALPHA STRENGHT","PE RATIO","EPS","1 YEAR HIGH","1 YEAR LOW"];
export const etfLeftLabels     = ["SCORE","TREND","APPROACH","GAP TO PEAK","KEY AREA","MATH","STATS","TECH"];
export const etfRightLabels    = ["S&P500 CORRELATION","S&P500 VOLATILITY RATIO","BULLISH ALPHA","BEARISH ALPHA","ALPHA STRENGHT","1 YEAR HIGH","1 YEAR LOW","TICKER"];
export const futuresLeftLabels = ["SCORE","TREND","APPROACH","GAP TO PEAK / TO VALLEY","KEY AREA","LIMIT","POTENTIAL EXTENSION"];
export const futuresRightLabels= ["S&P500 CORRELATION","S&P500 VOLATILITY RATIO","ALPHA STRENGHT","MID TERM PRICE % PROJECTION","MATH","STATS","TECH"];
export const fxLeftLabels      = ["SCORE","TREND","APPROACH","GAP TO PEAK / TO VALLEY","KEY AREA","LIMIT","POTENTIAL EXTENSION"];
export const fxRightLabels     = ["S&P500 CORRELATION","S&P500 VOLATILITY RATIO","ALPHA STRENGHT","MID TERM PRICE % PROJECTION","MATH","STATS","TECH"];

// ───────────────────────────────────────────────────────────
// Helpers
// ───────────────────────────────────────────────────────────
export function parseGap(val) {
  return (val === "-" || isNaN(parseFloat(val))) ? 0 : parseFloat(val);
}

// Mapping TradingView → suffisso Yahoo
const TV2Y_SUFFIX = {
  "XETR": ".DE", "FWB": ".DE",
  "NASDAQ": "", "NYSE": "", "AMEX": "", "NYSEARCA": "",
  "MIL": ".MI", "BIT": ".MI",
  "BME": ".MC",
  "TSX": ".TO", "TSXV": ".V",
  "ASX": ".AX",
  "LSE": ".L", "LSEIOB": ".L",
  "EPA": ".PA", "Euronext": ".PA", "AMS": ".AS",
  "SWX": ".SW", "SIX": ".SW",
  "HKEX": ".HK",
  "JPX": ".T"
};

function candidatesFromTvSymbol(tvSymbol) {
  if (!tvSymbol || typeof tvSymbol !== "string") return [];
  const [ex, raw] = tvSymbol.split(":");
  const base = raw || tvSymbol;
  const suffix = TV2Y_SUFFIX[ex] ?? "";
  const yahooGuess = base + suffix;
  const list = [tvSymbol, base];
  if (suffix && !base.endsWith(suffix)) list.push(yahooGuess);
  return Array.from(new Set(list));
}

function lookupAny(pricesData, keys) {
  const buckets = [
    pricesData?.stockPrices || {},
    pricesData?.etfPrices || {},
    pricesData?.futuresPrices || {},
    pricesData?.fxPrices || {}
  ];
  for (const k of keys) {
    for (const b of buckets) {
      if (b[k]) return b[k];
    }
  }
  return null;
}

function getSeriesForSymbol(pricesData, tvSymbol) {
  return lookupAny(pricesData, candidatesFromTvSymbol(tvSymbol));
}

function getBenchmarkSeries(pricesData) {
  const primary = lookupAny(pricesData, ['^GSPC','GSPC','INDEX:GSPC','SPX','SPX500USD']);
  if (primary) return primary;
  return lookupAny(pricesData, ['SPY','NYSEARCA:SPY','AMEX:SPY','ARCX:SPY']);
}

// Estrae close + (se disponibili) date
function extractClosesAndDates(series) {
  if (!series) return { closes: [], dates: null };
  if (Array.isArray(series) && (series.length === 0 || typeof series[0] === "number")) {
    const closes = series.map(Number).filter(v => Number.isFinite(v));
    return { closes, dates: null }; // close-only → allineamento per indice
  }
  const rows = series.map(row => {
    if (Array.isArray(row)) {
      const close = (row.length >= 5) ? +row[4] : +row[1];
      const date  = row[0];
      return Number.isFinite(close) ? { date: date, close } : null;
    } else if (typeof row === "object" && row) {
      const close = +(row.close ?? row.Close ?? row.c);
      const date  =  (row.date ?? row.Date ?? row.t);
      return Number.isFinite(close) ? { date, close } : null;
    }
    return null;
  }).filter(Boolean);
  return { closes: rows.map(r => r.close), dates: rows.map(r => r.date) };
}

// Allineamento: per data se entrambe le serie hanno date, altrimenti per indice
function getAlignedCloses(seriesA, seriesB, lookbackPlus1) {
  const A = extractClosesAndDates(seriesA);
  const B = extractClosesAndDates(seriesB);
  if (!A.dates || !B.dates) {
    const n = Math.min(A.closes.length, B.closes.length, lookbackPlus1);
    return [A.closes.slice(-n), B.closes.slice(-n)];
  }
  const mapB = new Map(B.dates.map((d,i) => [String(d), B.closes[i]]));
  const aCloses = [], bCloses = [];
  for (let i=0;i<A.dates.length;i++) {
    const key = String(A.dates[i]);
    if (mapB.has(key)) { aCloses.push(A.closes[i]); bCloses.push(mapB.get(key)); }
  }
  const n = Math.min(aCloses.length, bCloses.length, lookbackPlus1);
  return [aCloses.slice(-n), bCloses.slice(-n)];
}

function dailyReturns(closes) {
  const out = [];
  for (let i = 1; i < closes.length; i++) out.push(closes[i] / closes[i - 1] - 1);
  return out;
}
function lastN(arr, n){ return arr.slice(Math.max(arr.length - n, 0)); }

function olsSlopeIntercept(x, y) {
  const n = x.length;
  const mean = a => a.reduce((s,v)=>s+v,0)/n;
  const mx = mean(x), my = mean(y);
  let num=0, den=0;
  for (let i=0;i<n;i++){ num += (x[i]-mx)*(y[i]-my); den += (x[i]-mx)**2; }
  const b = den === 0 ? 0 : num/den;          // beta
  const a = my - b*mx;                         // alpha (daily)
  const yhat = x.map(xi => a + b*xi);
  const eps  = y.map((yi, i) => yi - yhat[i]);
  const sst  = y.reduce((s,yi)=>s+(yi-my)**2,0);
  const sse  = eps.reduce((s,e)=>s+e**2,0);
  const r2   = sst === 0 ? 0 : 1 - (sse/sst);
  return { a, b, r2, eps };
}

function stdev(arr) {
  const n = arr.length;
  if (n <= 1) return 0;
  const m = arr.reduce((s,v)=>s+v,0)/n;
  const v = arr.reduce((s,v)=>s+(v-m)**2,0)/(n-1);
  return Math.sqrt(v);
}
function maxDrawdown(closes) {
  if (!closes.length) return 0;
  let peak = closes[0], mdd = 0;
  for (const c of closes) { peak = Math.max(peak, c); mdd = Math.min(mdd, c/peak - 1); }
  return mdd;
}
function downsideDeviation(arr, target = 0) {
  const neg = arr.filter(r => r < target).map(r => (r - target) ** 2);
  if (neg.length === 0) return 0;
  return Math.sqrt(neg.reduce((s,v)=>s+v,0) / neg.length);
}

// ───────────────────────────────────────────────────────────
// Block 1: TradingView (invariato)
// ───────────────────────────────────────────────────────────
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
export function updateChart(instrumentName, groupData) { updateChartGeneric(instrumentName, groupData); }

// ───────────────────────────────────────────────────────────
// Block 2: Single-Index Model (EQUITIES)
// ───────────────────────────────────────────────────────────
export function updateSIM(instrumentName, groupData, pricesData, lookback=252) {
  const info = groupData[instrumentName];
  const tv   = info?.tvSymbol;
  const block2 = document.getElementById("block2");

  let container = block2.querySelector("#symbol-info-container");
  if (!container) {
    container = document.createElement("div");
    container.id = "symbol-info-container";
    block2.appendChild(container);
  }
  container.innerHTML = `
    <div class="sim-header">Single-Index Model (daily)</div>
    <div class="sim-grid">
      <div class="sim-metrics">
        <div><span>β</span><strong id="sim-beta">–</strong></div>
        <div><span>α (ann.)</span><strong id="sim-alpha">–</strong></div>
        <div><span>R²</span><strong id="sim-r2">–</strong></div>
        <div><span>σ<sub>ε</sub> (ann.)</span><strong id="sim-sige">–</strong></div>
        <div><span>Corr(i,m)</span><strong id="sim-corr">–</strong></div>
      </div>
      <div class="sim-chart"><canvas id="sim-canvas"></canvas></div>
    </div>
  `;

  const assetSeriesRaw = getSeriesForSymbol(pricesData, tv);
  const benchSeriesRaw = getBenchmarkSeries(pricesData);

  if (!assetSeriesRaw || !benchSeriesRaw) {
    container.querySelector(".sim-chart").innerHTML =
      `<div class="sim-missing">Benchmark o serie prezzi non disponibili.</div>`;
    return;
  }

  const [aCloses, mCloses] = getAlignedCloses(assetSeriesRaw, benchSeriesRaw, lookback+1);
  if (aCloses.length < 2 || mCloses.length < 2) {
    container.querySelector(".sim-chart").innerHTML =
      `<div class="sim-missing">Dati insufficienti per la regressione.</div>`;
    return;
  }

  const R_i = dailyReturns(aCloses);
  const R_m = dailyReturns(mCloses);
  const n   = Math.min(R_i.length, R_m.length);
  const Yi  = R_i.slice(-n);
  const Xm  = R_m.slice(-n);

  const { a, b, r2, eps } = olsSlopeIntercept(Xm, Yi);

  // Corr
  const sx = stdev(Xm), sy = stdev(Yi);
  const mx = Xm.reduce((s,v)=>s+v,0)/Xm.length;
  const my = Yi.reduce((s,v)=>s+v,0)/Yi.length;
  let cov = 0; for (let i=0;i<n;i++) cov += (Xm[i]-mx)*(Yi[i]-my);
  cov /= (n-1);
  const corr = (sx===0 || sy===0) ? 0 : (cov/(sx*sy));

  const alphaAnn = a * 252;
  const sigeAnn  = stdev(eps) * Math.sqrt(252);

  document.getElementById("sim-beta").textContent = b.toFixed(3);
  document.getElementById("sim-alpha").textContent = (alphaAnn*100).toFixed(2) + "%";
  document.getElementById("sim-r2").textContent   = r2.toFixed(3);
  document.getElementById("sim-sige").textContent = (sigeAnn*100).toFixed(2) + "%";
  document.getElementById("sim-corr").textContent = corr.toFixed(3);

  const points = Xm.map((x, i) => ({ x, y: Yi[i] }));
  renderScatterWithRegression("sim-canvas", points, { a, b });
}

// ───────────────────────────────────────────────────────────
// Block 3: Risk/Return metrics (EQUITIES)
// ───────────────────────────────────────────────────────────
export function updateBlock3(instrumentName, groupData, pricesData, lookback=252) {
  const wrap = document.getElementById("block3");
  const tabs = wrap.querySelector("#block3-tabs");
  if (tabs) tabs.style.display = "none";

  const content = document.getElementById("block3-content");
  content.innerHTML = `
    <div id="risk-metrics" class="risk-metrics">
      <div class="rm-title">Risk & Return (daily, last ${lookback})</div>
      <div class="rm-grid">
        <div><span>Return (ann.)</span><strong id="rm-ret">–</strong></div>
        <div><span>Volatility (ann.)</span><strong id="rm-vol">–</strong></div>
        <div><span>β</span><strong id="rm-beta">–</strong></div>
        <div><span>α (ann.)</span><strong id="rm-alpha">–</strong></div>
        <div><span>R²</span><strong id="rm-r2">–</strong></div>
        <div><span>Corr(i,m)</span><strong id="rm-corr">–</strong></div>
        <div><span>Idiosyncratic vol (ann.)</span><strong id="rm-sige">–</strong></div>
        <div><span>Max Drawdown</span><strong id="rm-mdd">–</strong></div>
        <div><span>Downside dev.</span><strong id="rm-dd">–</strong></div>
      </div>
    </div>
  `;

  const tv = groupData[instrumentName]?.tvSymbol;
  const assetSeriesRaw = getSeriesForSymbol(pricesData, tv);
  const benchSeriesRaw = getBenchmarkSeries(pricesData);

  if (!assetSeriesRaw || !benchSeriesRaw) {
    content.querySelector(".risk-metrics").insertAdjacentHTML('beforeend',
      `<div class="rm-warning">Serie prezzi mancanti per calcolare le metriche.</div>`);
    return;
  }

  const [aCloses, mCloses] = getAlignedCloses(assetSeriesRaw, benchSeriesRaw, lookback+1);
  if (aCloses.length < 2 || mCloses.length < 2) {
    content.querySelector(".risk-metrics").insertAdjacentHTML('beforeend',
      `<div class="rm-warning">Dati insufficienti.</div>`);
    return;
  }

  const R_i = dailyReturns(aCloses);
  const R_m = dailyReturns(mCloses);
  const n   = Math.min(R_i.length, R_m.length);
  const Yi  = R_i.slice(-n);
  const Xm  = R_m.slice(-n);

  // === RETURN (ann.) come CAGR sul window ===
  const nDays = (aCloses.length - 1);
  const priceRatio = aCloses[aCloses.length - 1] / aCloses[0];
  const cagr = nDays > 0 ? Math.pow(priceRatio, 252 / nDays) - 1 : 0;

  // Volatilità totale ann.
  const volAnn = stdev(Yi) * Math.sqrt(252);

  // drawdown / downside
  const mdd = maxDrawdown(aCloses.slice(-lookback));
  const dd  = downsideDeviation(Yi, 0) * Math.sqrt(252);

  // SIM
  const { a, b, r2, eps } = olsSlopeIntercept(Xm, Yi);
  const alphaAnn = a * 252;
  const sigeAnn  = stdev(eps) * Math.sqrt(252);

  // corr
  const sx = stdev(Xm), sy = stdev(Yi);
  const mx = Xm.reduce((s,v)=>s+v,0)/Xm.length;
  const my = Yi.reduce((s,v)=>s+v,0)/Yi.length;
  let cov = 0; for (let i=0;i<n;i++) cov += (Xm[i]-mx)*(Yi[i]-my);
  cov /= (n-1);
  const corr = (sx===0 || sy===0) ? 0 : (cov/(sx*sy));

  const set = (id, val) => document.getElementById(id).textContent = val;
  set("rm-ret",  (cagr*100).toFixed(2) + "%");
  set("rm-vol",  (volAnn*100).toFixed(2) + "%");
  set("rm-beta", b.toFixed(3));
  set("rm-alpha",(alphaAnn*100).toFixed(2) + "%");
  set("rm-r2",   r2.toFixed(3));
  set("rm-corr", corr.toFixed(3));
  set("rm-sige", (sigeAnn*100).toFixed(2) + "%");
  set("rm-mdd",  (mdd*100).toFixed(2) + "%");
  set("rm-dd",   (dd*100).toFixed(2) + "%");
}

// ───────────────────────────────────────────────────────────
// Block 4: Fondamentali
// ───────────────────────────────────────────────────────────
export function updateBlock4(instrumentName, groupData) {
  const info = groupData[instrumentName] || {};
  const block4 = document.getElementById("block4");
  block4.innerHTML = `
    <div class="fund-card">
      <div class="fund-title">Fundamentals</div>
      <div class="fund-grid">
        ${renderFundRow("P/E", info?.pe_ratio)}
        ${renderFundRow("EPS", info?.eps)}
        ${renderFundRow("P/B", info?.pb_ratio)}
        ${renderFundRow("Dividend Yield", info?.div_yield, "%")}
        ${renderFundRow("ROE", info?.return_on_equity, "%", true)}
        ${renderFundRow("Debt/Equity", info?.debt_to_equity)}
        ${renderFundRow("Beta", info?.beta)}
        ${renderFundRow("Revenue growth", info?.revenue_growth, "%", true)}
        ${renderFundRow("Payout ratio", info?.payout_ratio, "%", true)}
        ${renderFundRow("1Y High", info?.one_year_high)}
        ${renderFundRow("1Y Low", info?.one_year_low)}
      </div>
    </div>
  `;
}
function renderFundRow(label, value, suffix="", isFraction=false) {
  if (value == null || value === "") value = "–";
  else if (typeof value === "number") value = isFraction ? (value*100).toFixed(2) + (suffix||"") : String(value);
  return `<div class="fund-row"><span>${label}</span><strong>${value}</strong></div>`;
}

// Compat: richiesto da main.js (instrada al SIM)
export function updateSymbolOverview(instrumentName, groupData) {
  const pricesData = window?.pricesData || {
    stockPrices:{}, etfPrices:{}, futuresPrices:{}, fxPrices:{}
  };
  return updateSIM(instrumentName, groupData, pricesData, 252);
}

// Legacy no-op
export function initBlock3Tabs() { /* single tab now for equities */ }
export function openYouTubePopup() {
  const popup = document.getElementById("youtube-popup");
  if (popup) popup.style.display = "block";
}
