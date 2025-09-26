// dashboard.js
// ----------------
// EQUITIES: Block2 = Single-Index Model (SIM); Block3 = risk/return metrics; Block4 = fondamentali.
// Altre asset class restano come prima.

import { renderBarChart, renderPieChart, destroyChartIfExists, renderScatterWithRegression } from "./charts.js";
// import futuresMap from "./futuresMap.js"; // legacy
// import { showSpread } from "./spreadView.js"; // legacy

// ───────────────────────────────────────────────────────────
// Label arrays (reintroduced for backward-compat with portfolioBuilder)
// ───────────────────────────────────────────────────────────
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
  "ALPHA STRENGHT","1 YEAR HIGH","1 YEAR LOW","TICKER"
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

// ───────────────────────────────────────────────────────────
// Helpers comuni
// ───────────────────────────────────────────────────────────
export function parseGap(val) {
  return (val === "-" || isNaN(parseFloat(val))) ? 0 : parseFloat(val);
}

function getSeriesForSymbol(pricesData, tvSymbol) {
  const buckets = [
    pricesData?.stockPrices || {},
    pricesData?.etfPrices || {},
    pricesData?.futuresPrices || {},
    pricesData?.fxPrices || {}
  ];
  for (const b of buckets) {
    if (b[tvSymbol]) return b[tvSymbol];
  }
  return null;
}

function getBenchmarkSeries(pricesData) {
  const candidates = ['^GSPC', 'GSPC', 'INDEX:GSPC', 'SPX', 'SPX500USD'];
  const buckets = [
    pricesData?.stockPrices || {},
    pricesData?.etfPrices || {},
    pricesData?.futuresPrices || {},
    pricesData?.fxPrices || {}
  ];
  for (const name of candidates) {
    for (const b of buckets) {
      if (b[name]) return b[name];
    }
  }
  return null;
}

function normalizeCloseSeries(series) {
  if (!series) return [];
  return series.map(row => {
    if (Array.isArray(row)) {
      const c = (row.length >= 5) ? row[4] : row[1];
      const d = row[0];
      return { date: d, close: +c };
    } else if (typeof row === 'object') {
      const c = row.close ?? row.Close ?? row.c;
      const d = row.date ?? row.Date ?? row.t;
      return { date: d, close: +c };
    }
    return null;
  }).filter(Boolean);
}

function dailyReturns(closes) {
  const rets = [];
  for (let i = 1; i < closes.length; i++) {
    rets.push(closes[i] / closes[i - 1] - 1);
  }
  return rets;
}

function alignByDate(seriesA, seriesB) {
  const mapB = new Map(seriesB.map(r => [String(r.date), r.close]));
  const outA = [], outB = [];
  for (const a of seriesA) {
    const bClose = mapB.get(String(a.date));
    if (bClose != null) { outA.push(a); outB.push({ date: a.date, close: bClose }); }
  }
  return [outA, outB];
}
function lastN(arr, n){ return arr.slice(Math.max(arr.length - n, 0)); }

function olsSlopeIntercept(x, y) {
  const n = x.length;
  const mean = a => a.reduce((s,v)=>s+v,0)/n;
  const mx = mean(x), my = mean(y);
  let num=0, den=0;
  for (let i=0;i<n;i++){ num += (x[i]-mx)*(y[i]-my); den += (x[i]-mx)**2; }
  const b = den === 0 ? 0 : num/den;
  const a = my - b*mx;
  const yhat = x.map(xi => a + b*xi);
  const eps  = y.map((yi, i) => yi - yhat[i]);
  const sst  = y.reduce((s,yi)=>s+(yi-my)**2,0);
  const sse  = eps.reduce((s,e)=>s+e**2,0);
  const r2   = sst === 0 ? 0 : 1 - (sse/sst);
  return { a, b, r2, eps, yhat, mx, my };
}

function stdev(arr) {
  const n = arr.length;
  if (n <= 1) return 0;
  const m = arr.reduce((s,v)=>s+v,0)/n;
  const v = arr.reduce((s,v)=>s+(v-m)**2,0)/(n-1);
  return Math.sqrt(v);
}
function maxDrawdown(closes) {
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
// Block 2: Single-Index Model (solo EQUITIES)
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
      <div class="sim-chart">
        <canvas id="sim-canvas"></canvas>
      </div>
    </div>
  `;

  const seriesA = normalizeCloseSeries(getSeriesForSymbol(pricesData, tv));
  const seriesM = normalizeCloseSeries(getBenchmarkSeries(pricesData));

  if (!seriesA?.length || !seriesM?.length) {
    const b = container.querySelector(".sim-metrics");
    if (b) b.innerHTML = `<div class="sim-missing">Benchmark o serie prezzi non disponibili.</div>`;
    return;
  }

  const [aAligned, mAligned] = alignByDate(seriesA, seriesM);
  const aCloses = lastN(aAligned.map(r => r.close), lookback+1);
  const mCloses = lastN(mAligned.map(r => r.close), lookback+1);

  const ri = dailyReturns(aCloses);
  const rm = dailyReturns(mCloses);
  const n  = Math.min(ri.length, rm.length);
  const R_i = ri.slice(-n);
  const R_m = rm.slice(-n);

  const { a, b, r2, eps } = olsSlopeIntercept(R_m, R_i);
  const corr = (function(){
    const sx = stdev(R_m), sy = stdev(R_i);
    if (sx===0 || sy===0) return 0;
    const mx = R_m.reduce((s,v)=>s+v,0)/R_m.length;
    const my = R_i.reduce((s,v)=>s+v,0)/R_i.length;
    let cov = 0; for (let i=0;i<R_m.length;i++) cov += (R_m[i]-mx)*(R_i[i]-my);
    cov /= (R_m.length-1);
    return cov / (sx*sy);
  })();

  const alphaAnn = a * 252;
  const sigeAnn  = stdev(eps) * Math.sqrt(252);

  document.getElementById("sim-beta").textContent = b.toFixed(3);
  document.getElementById("sim-alpha").textContent = (alphaAnn*100).toFixed(2) + "%";
  document.getElementById("sim-r2").textContent   = r2.toFixed(3);
  document.getElementById("sim-sige").textContent = (sigeAnn*100).toFixed(2) + "%";
  document.getElementById("sim-corr").textContent = corr.toFixed(3);

  const points = R_m.map((x, i) => ({ x, y: R_i[i] }));
  renderScatterWithRegression("sim-canvas", points, { a, b });
}

// ───────────────────────────────────────────────────────────
// Block 3: Risk/Return metrics (solo EQUITIES)
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
  const seriesA = normalizeCloseSeries(getSeriesForSymbol(pricesData, tv));
  const seriesM = normalizeCloseSeries(getBenchmarkSeries(pricesData));
  if (!seriesA?.length || !seriesM?.length) {
    content.querySelector(".risk-metrics").insertAdjacentHTML('beforeend',
      `<div class="rm-warning">Serie prezzi mancanti per calcolare le metriche.</div>`);
    return;
  }

  const [aAligned, mAligned] = alignByDate(seriesA, seriesM);
  const aCloses = lastN(aAligned.map(r => r.close), lookback+1);
  const mCloses = lastN(mAligned.map(r => r.close), lookback+1);

  const ri = dailyReturns(aCloses);
  const rm = dailyReturns(mCloses);
  const n  = Math.min(ri.length, rm.length);
  const R_i = ri.slice(-n);
  const R_m = rm.slice(-n);

  const muD  = R_i.reduce((s,v)=>s+v,0)/R_i.length;
  const sdD  = stdev(R_i);
  const retAnn = muD * 252;
  const volAnn = sdD * Math.sqrt(252);

  const mdd = maxDrawdown(aCloses.slice(-lookback));
  const dd  = downsideDeviation(R_i, 0) * Math.sqrt(252);

  const { a, b, r2, eps } = olsSlopeIntercept(R_m, R_i);
  const alphaAnn = a * 252;
  const sigeAnn  = stdev(eps) * Math.sqrt(252);
  const corr = (function(){
    const sx = stdev(R_m), sy = stdev(R_i);
    if (sx===0 || sy===0) return 0;
    const mx = R_m.reduce((s,v)=>s+v,0)/R_m.length;
    const my = R_i.reduce((s,v)=>s+v,0)/R_i.length;
    let cov = 0; for (let i=0;i<R_m.length;i++) cov += (R_m[i]-mx)*(R_i[i]-my);
    cov /= (R_m.length-1);
    return cov / (sx*sy);
  })();

  const set = (id, val) => document.getElementById(id).textContent = val;
  set("rm-ret",  (retAnn*100).toFixed(2) + "%");
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
  else {
    if (typeof value === "number") {
      if (isFraction) value = (value*100).toFixed(2) + (suffix||"");
      else value = String(value);
    }
  }
  return `<div class="fund-row"><span>${label}</span><strong>${value}</strong></div>`;
}

export function initBlock3Tabs() { /* single tab now for equities */ }
export function openYouTubePopup() {
  const popup = document.getElementById("youtube-popup");
  if (popup) popup.style.display = "block";
}
