// dashboard.js
// Block2: tab "Single-Index" (scatter) + "Benchmark" (line chart cum %), con selezione benchmark.
// Block3: metriche (SIM + rischio) coerenti con il benchmark selezionato. Block4: fondamentali.

import { renderScatterWithRegression, renderBenchmarkLines } from "./charts.js";

/* ── Label arrays (compat con altri moduli) ─────────────────────────── */
export const leftLabels        = ["SCORE","TREND","APPROACH","GAP TO PEAK","KEY AREA","MICRO","MATH","STATS","TECH"];
export const rightLabels       = ["S&P500 CORRELATION","S&P500 VOLATILITY RATIO","BULLISH ALPHA","BEARISH ALPHA","ALPHA STRENGHT","PE RATIO","EPS","1 YEAR HIGH","1 YEAR LOW"];
export const etfLeftLabels     = ["SCORE","TREND","APPROACH","GAP TO PEAK","KEY AREA","MATH","STATS","TECH"];
export const etfRightLabels    = ["S&P500 CORRELATION","S&P500 VOLATILITY RATIO","BULLISH ALPHA","BEARISH ALPHA","ALPHA STRENGHT","1 YEAR HIGH","1 YEAR LOW","TICKER"];
export const futuresLeftLabels = ["SCORE","TREND","APPROACH","GAP TO PEAK / TO VALLEY","KEY AREA","LIMIT","POTENTIAL EXTENSION"];
export const futuresRightLabels= ["S&P500 CORRELATION","S&P500 VOLATILITY RATIO","ALPHA STRENGHT","MID TERM PRICE % PROJECTION","MATH","STATS","TECH"];
export const fxLeftLabels      = ["SCORE","TREND","APPROACH","GAP TO PEAK / TO VALLEY","KEY AREA","LIMIT","POTENTIAL EXTENSION"];
export const fxRightLabels     = ["S&P500 CORRELATION","S&P500 VOLATILITY RATIO","ALPHA STRENGHT","MID TERM PRICE % PROJECTION","MATH","STATS","TECH"];

/* ── Helpers ─────────────────────────────────────────────────────────── */
export function parseGap(v){ return (v === "-" || isNaN(parseFloat(v))) ? 0 : parseFloat(v); }

const TV2Y_SUFFIX = {
  "XETR": ".DE","FWB": ".DE","NASDAQ":"","NYSE":"","AMEX":"","NYSEARCA":"",
  "MIL": ".MI","BIT": ".MI","BME": ".MC","TSX": ".TO","TSXV": ".V","ASX": ".AX",
  "LSE": ".L","LSEIOB": ".L","EPA": ".PA","Euronext": ".PA","AMS": ".AS",
  "SWX": ".SW","SIX": ".SW","HKEX": ".HK","JPX": ".T"
};
function candidatesFromTvSymbol(tvSymbol){
  if(!tvSymbol||typeof tvSymbol!=="string") return [];
  const [ex, raw] = tvSymbol.split(":");
  const base = raw || tvSymbol;
  const suf = TV2Y_SUFFIX[ex] ?? "";
  const guess = base + suf;
  const list = [tvSymbol, base];
  if(suf && !base.endsWith(suf)) list.push(guess);
  return Array.from(new Set(list));
}
function lookupAny(pricesData, keys){
  const buckets=[pricesData && pricesData.stockPrices || {},
                 pricesData && pricesData.etfPrices || {},
                 pricesData && pricesData.futuresPrices || {},
                 pricesData && pricesData.fxPrices || {}];
  for(let k of keys){
    for(let b of buckets){
      if(b[k]) return b[k];
    }
  }
  return null;
}
function getSeriesForSymbol(pricesData,tv){ return lookupAny(pricesData, candidatesFromTvSymbol(tv)); }

/* benchmark: se "desired" è definito, prova quello. Altrimenti fallback GSPC→SPY */
function getBenchmarkSeries(pricesData, desired){
  if (desired && typeof desired === "string") {
    const keys = candidatesFromTvSymbol(desired).concat([desired]);
    const found = lookupAny(pricesData, keys);
    if (found) return found;
  }
  const primary = lookupAny(pricesData, ['^GSPC','GSPC','INDEX:GSPC','SPX','SPX500USD']);
  if (primary) return primary;
  return lookupAny(pricesData, ['SPY','NYSEARCA:SPY','AMEX:SPY','ARCX:SPY']);
}
/* elenco chiavi disponibili per il datalist */
function availableBenchKeys(pricesData){
  const b = [
    Object.keys(pricesData && pricesData.stockPrices   || {}),
    Object.keys(pricesData && pricesData.etfPrices     || {}),
    Object.keys(pricesData && pricesData.futuresPrices || {}),
    Object.keys(pricesData && pricesData.fxPrices      || {}),
  ].flat();
  const pref = ['^GSPC','GSPC','SPY','^GDAXI','DAX','^STOXX50E'];
  const set  = new Set(pref.concat(b));
  return Array.from(set).filter(Boolean).sort(function(a,b){ return a.localeCompare(b); });
}

function extractClosesAndDates(series){
  if(!series) return {closes:[],dates:null};
  if(Array.isArray(series) && (series.length===0 || typeof series[0]==="number")){
    const closes=series.map(Number).filter(Number.isFinite); return {closes,dates:null};
  }
  const rows=series.map(function(r){
    if(Array.isArray(r)){
      const c=(r.length>=5)?+r[4]:+r[1];
      const d=r[0];
      return Number.isFinite(c)?{date:d,close:c}:null;
    }
    if(typeof r==="object"&&r){
      const c=+(r.close||r.Close||r.c);
      const d=(r.date||r.Date||r.t);
      return Number.isFinite(c)?{date:d,close:c}:null;
    }
    return null;
  }).filter(Boolean);
  return {closes:rows.map(function(x){return x.close;}), dates:rows.map(function(x){return x.date;})};
}
function getAlignedCloses(seriesA,seriesB,lookbackPlus1){
  const A=extractClosesAndDates(seriesA), B=extractClosesAndDates(seriesB);
  if(!A.dates||!B.dates){
    const n=Math.min(A.closes.length,B.closes.length,lookbackPlus1);
    return [A.closes.slice(-n), B.closes.slice(-n)];
  }
  const mapB=new Map(B.dates.map(function(d,i){return [String(d),B.closes[i]];}));
  const a=[], b=[];
  for(let i=0;i<A.dates.length;i++){
    const key=String(A.dates[i]);
    if(mapB.has(key)){ a.push(A.closes[i]); b.push(mapB.get(key)); }
  }
  const n=Math.min(a.length,b.length,lookbackPlus1);
  return [a.slice(-n), b.slice(-n)];
}
function getAlignedClosesAndDates(seriesA, seriesB, lookbackPlus1){
  const A=extractClosesAndDates(seriesA), B=extractClosesAndDates(seriesB);
  if(!A.dates||!B.dates){
    const n=Math.min(A.closes.length,B.closes.length,lookbackPlus1);
    const labels = Array.from({length:n}, function(_,i){return "D"+(n-i);});
    return [A.closes.slice(-n), B.closes.slice(-n), labels];
  }
  const mapB=new Map(B.dates.map(function(d,i){return [String(d),{idx:i,close:B.closes[i]}];}));
  const a=[], b=[], lab=[];
  for(let i=0;i<A.dates.length;i++){
    const key=String(A.dates[i]);
    if(mapB.has(key)){ a.push(A.closes[i]); b.push(mapB.get(key).close); lab.push(key); }
  }
  const n=Math.min(a.length,b.length,lookbackPlus1);
  return [a.slice(-n), b.slice(-n), lab.slice(-n)];
}

function dailyReturns(closes){ const out=[]; for(let i=1;i<closes.length;i++) out.push(closes[i]/closes[i-1]-1); return out; }
function cumulativeReturns(ret){ const out=[]; let acc=1; for(let i=0;i<ret.length;i++){ acc*=1+ret[i]; out.push(acc-1); } return out; }
function stdev(arr){ const n=arr.length; if(n<=1) return 0; const m=arr.reduce(function(s,v){return s+v;},0)/n; const v=arr.reduce(function(s,v){return s+(v-m)*(v-m);},0)/(n-1); return Math.sqrt(v); }
function maxDrawdown(closes){ if(!closes.length) return 0; let peak=closes[0],mdd=0; for(let i=0;i<closes.length;i++){ const c=closes[i]; if(c>peak) peak=c; const dd=c/peak-1; if(dd<mdd) mdd=dd; } return mdd; }
function downsideDeviation(arr,t){ t=t||0; const neg=arr.filter(function(r){return r<t;}).map(function(r){return (r-t)*(r-t);}); if(!neg.length) return 0; return Math.sqrt(neg.reduce(function(s,v){return s+v;},0)/neg.length); }
function olsSlopeIntercept(x,y){
  const n=x.length, mean=function(a){return a.reduce(function(s,v){return s+v;},0)/n;};
  const mx=mean(x), my=mean(y);
  let num=0,den=0; for(let i=0;i<n;i++){ num+=(x[i]-mx)*(y[i]-my); den+=(x[i]-mx)*(x[i]-mx); }
  const b=den===0?0:num/den; const a=my-b*mx;
  const yhat=x.map(function(xi){return a+b*xi;}); const eps=y.map(function(yi,i){return yi-yhat[i];});
  const sst=y.reduce(function(s,yi){return s+(yi-my)*(yi-my);},0); const sse=eps.reduce(function(s,e){return s+e*e;},0);
  const r2=sst===0?0:1-(sse/sst);
  return {a:a,b:b,r2:r2,eps:eps};
}

/* ── Helper: resize chart senza optional chaining ────────────────────── */
function resizeChart(idOrCanvas){
  try{
    const Chart = window.Chart;
    if (!Chart) return;
    const el = (typeof idOrCanvas === "string") ? document.getElementById(idOrCanvas) : idOrCanvas;
    const inst = Chart.getChart ? Chart.getChart(el) : null;
    if (inst && typeof inst.resize === "function") inst.resize();
  }catch(_){}
}

/* ── Block 1: TradingView (barra SUP. rimossa, laterale visibile) ────── */
function updateChartGeneric(instrumentName, groupData){
  const info   = groupData[instrumentName] || {};
  const symbol = (info.tvSymbol || "NASDAQ:AMZN").replace(/-/g, "_");

  const block1    = document.getElementById("block1");
  const container = block1.querySelector(".tradingview-widget-container");
  container.innerHTML = '<div class="tradingview-widget-container__widget" style="height:100%;width:100%"></div>';

  const cfg = {
    autosize: true,
    symbol: symbol,
    interval: "D",
    timezone: "Etc/UTC",
    theme: "dark",
    style: "1",
    locale: "en",
    hide_top_toolbar: true,
    hide_side_toolbar: false,
    withdateranges: false,
    details: false,
    allow_symbol_change: false,
    backgroundColor: "#000000",
    calendar: false,
    support_host: "https://www.tradingview.com"
  };

  const script = document.createElement("script");
  script.type  = "text/javascript";
  script.src   = "https://s3.tradingview.com/external-embedding/embed-widget-advanced-chart.js";
  script.async = true;
  script.textContent = JSON.stringify(cfg);
  container.appendChild(script);
}
export function updateChart(i,g){ updateChartGeneric(i,g); }

/* ── Stato per benchmark selezionato ─────────────────────────────────── */
function getInstKey(groupData, instrumentName){
  return (groupData[instrumentName] && groupData[instrumentName].tvSymbol) || instrumentName || "";
}
function readSavedBenchmark(instKey){
  const map = (window.__simBenchmarkBySymbol = window.__simBenchmarkBySymbol || {});
  return map[instKey] || window.__simBenchmarkGlobal || "^GSPC";
}
function saveBenchmark(instKey, benchKey){
  const map = (window.__simBenchmarkBySymbol = window.__simBenchmarkBySymbol || {});
  map[instKey] = benchKey;
  window.__simBenchmarkGlobal = benchKey;
  try { localStorage.setItem("bt_sim_bench_map", JSON.stringify(map)); } catch(_){}
}
(function restoreBenchmarkMap(){
  try{
    const raw = localStorage.getItem("bt_sim_bench_map");
    if (raw) window.__simBenchmarkBySymbol = JSON.parse(raw);
  }catch(_){}
})();

/* ── Block 2: SIM + Benchmark (tab) + bench picker ──────────────────── */
export function updateSIM(instrumentName, groupData, pricesData){
  const instKey = getInstKey(groupData, instrumentName);
  const block2 = document.getElementById("block2");

  let container = block2.querySelector("#symbol-info-container");
  if (!container) {
    container = document.createElement("div");
    container.id = "symbol-info-container";
    block2.appendChild(container);
  }

  container.innerHTML = '' +
    '<div class="sim-toolbar">' +
      '<div class="sim-tabs">' +
        '<button class="tab-btn active" data-tab="sim">Single-Index</button>' +
        '<button class="tab-btn" data-tab="bench">Benchmark</button>' +
      '</div>' +
      '<div class="bench-picker">' +
        '<label for="bench-input">Benchmark</label>' +
        '<input id="bench-input" list="bench-list" placeholder="^GSPC, DAX, SPY, ..." />' +
        '<datalist id="bench-list"></datalist>' +
        '<button id="bench-reset" title="Reset to S&P 500">↺</button>' +
        '<small id="bench-msg"></small>' +
      '</div>' +
    '</div>' +
    '<div class="sim-body">' +
      '<div id="pane-sim" class="sim-pane"><canvas id="sim-canvas"></canvas></div>' +
      '<div id="pane-bench" class="sim-pane hidden"><canvas id="bench-canvas"></canvas></div>' +
    '</div>';

  // Popola datalist
  const list = container.querySelector('#bench-list');
  const keys = availableBenchKeys(pricesData);
  list.innerHTML = keys.map(function(k){ return '<option value="'+k+'"></option>'; }).join("");

  // Stato iniziale benchmark
  let benchKey = readSavedBenchmark(instKey);
  const benchInput = container.querySelector('#bench-input');
  const benchMsg   = container.querySelector('#bench-msg');
  benchInput.value = benchKey;

  function setMsg(txt, ok){
    ok = (ok !== false);
    benchMsg.textContent = txt || "";
    benchMsg.style.color = ok ? '#7fd67f' : '#ff7d7d';
    if (txt){
      setTimeout(function(){ benchMsg.textContent=""; }, 1800);
    }
  }

  function renderAll(){
    const assetSeriesRaw = getSeriesForSymbol(pricesData, instKey);
    const benchSeriesRaw = getBenchmarkSeries(pricesData, benchKey);

    if (!assetSeriesRaw || !benchSeriesRaw) {
      container.querySelector(".sim-body").innerHTML =
        '<div class="sim-missing">Serie prezzi non disponibili per grafici.</div>';
      return;
    }

    const triple = getAlignedClosesAndDates(assetSeriesRaw, benchSeriesRaw, Number.MAX_SAFE_INTEGER);
    const aAll = triple[0], mAll = triple[1], labelsAll = triple[2];

    const effLB = Math.min(252, Math.max(1, Math.min(aAll.length - 1, mAll.length - 1)));
    const aCloses = aAll.slice(-(effLB + 1));
    const mCloses = mAll.slice(-(effLB + 1));
    const labels  = labelsAll.slice(-(effLB + 1)).slice(1);

    const Ri = dailyReturns(aCloses);
    const Rm = dailyReturns(mCloses);
    const n  = Math.min(Ri.length, Rm.length);
    const Yi = Ri.slice(-n), Xm = Rm.slice(-n);

    const reg  = olsSlopeIntercept(Xm, Yi);
    const a    = reg.a, b = reg.b;
    const points = Xm.map(function(x,i){ return { x:x, y:Yi[i] }; });
    renderScatterWithRegression("sim-canvas", points, { a:a, b:b });

    const assetCum = cumulativeReturns(Yi);
    const benchCum = cumulativeReturns(Xm);
    renderBenchmarkLines("bench-canvas", labels.slice(-n), assetCum, benchCum);

    // Aggiorna metriche coerenti
    updateBlock3(instrumentName, groupData, pricesData);
  }

  // Eventi benchmark
  benchInput.addEventListener('change', function(){
    const candidate = benchInput.value.trim();
    if (!candidate) return;
    const exists = !!getBenchmarkSeries(pricesData, candidate);
    if (exists){
      benchKey = candidate;
      saveBenchmark(instKey, benchKey);
      setMsg('Benchmark aggiornato', true);
      renderAll();
    } else {
      setMsg('Non trovato nei dati', false);
      benchInput.value = benchKey;
    }
  });
  container.querySelector('#bench-reset').addEventListener('click', function(){
    benchKey = '^GSPC';
    benchInput.value = benchKey;
    saveBenchmark(instKey, benchKey);
    setMsg('Reset a S&P 500', true);
    renderAll();
  });

  // Switch tab
  container.querySelectorAll(".tab-btn").forEach(function(btn){
    btn.onclick = function(){
      container.querySelectorAll(".tab-btn").forEach(function(b){ b.classList.remove("active"); });
      btn.classList.add("active");
      const tab = btn.getAttribute("data-tab");
      document.getElementById("pane-sim").classList.toggle("hidden", tab !== "sim");
      document.getElementById("pane-bench").classList.toggle("hidden", tab !== "bench");
      const id = (tab === "sim") ? "sim-canvas" : "bench-canvas";
      requestAnimationFrame(function(){ resizeChart(id); });
    };
  });

  renderAll();
}

/* ── Block 3: Metriche (coerenti con SIM) ───────────────────────────── */
export function updateBlock3(instrumentName, groupData, pricesData){
  const wrap=document.getElementById("block3");
  const tabs=wrap.querySelector("#block3-tabs"); if(tabs) tabs.style.display="none";

  const content=document.getElementById("block3-content");
  content.innerHTML='' +
    '<div id="risk-metrics" class="risk-metrics">' +
      '<div class="rm-title" id="rm-title">Metrics (daily, last ...)</div>' +
      '<div class="rm-section">' +
        '<div class="rm-section-title">Single-Index Model</div>' +
        '<div class="rm-grid rm-grid-sim">' +
          '<div><span>β</span><strong id="rm-beta">–</strong></div>' +
          '<div><span>α (ann.)</span><strong id="rm-alpha">–</strong></div>' +
          '<div><span>R²</span><strong id="rm-r2">–</strong></div>' +
          '<div><span>Corr(i,m)</span><strong id="rm-corr">–</strong></div>' +
          '<div><span>Idiosyncratic vol (ann.)</span><strong id="rm-sige">–</strong></div>' +
        '</div>' +
      '</div>' +
      '<div class="rm-section">' +
        '<div class="rm-section-title">Risk & Drawdown</div>' +
        '<div class="rm-grid rm-grid-risk">' +
          '<div><span>Return (ann.)</span><strong id="rm-ret">–</strong></div>' +
          '<div><span>Volatility (ann.)</span><strong id="rm-vol">–</strong></div>' +
          '<div><span>Max Drawdown</span><strong id="rm-mdd">–</strong></div>' +
          '<div><span>Downside dev.</span><strong id="rm-dd">–</strong></div>' +
        '</div>' +
      '</div>' +
    '</div>';

  try{
    const instKey = getInstKey(groupData, instrumentName);
    const benchKey = readSavedBenchmark(instKey);

    const assetSeriesRaw=getSeriesForSymbol(pricesData, instKey);
    const benchSeriesRaw=getBenchmarkSeries(pricesData, benchKey);
    if(!assetSeriesRaw||!benchSeriesRaw){
      content.querySelector(".risk-metrics").insertAdjacentHTML('beforeend', '<div class="rm-warning">Serie prezzi mancanti per calcolare le metriche.</div>');
      return;
    }

    const pair = getAlignedCloses(assetSeriesRaw, benchSeriesRaw, Number.MAX_SAFE_INTEGER);
    const aAll = pair[0], mAll = pair[1];
    const effLB=Math.min(252, Math.max(1, Math.min(aAll.length-1, mAll.length-1)));
    document.getElementById("rm-title").textContent = 'Metrics (daily, last '+effLB+')';

    const aCloses=aAll.slice(-(effLB+1));
    const mCloses=mAll.slice(-(effLB+1));
    const Ri=dailyReturns(aCloses);
    const Rm=dailyReturns(mCloses);
    const n=Math.min(Ri.length, Rm.length);
    const Yi=Ri.slice(-n), Xm=Rm.slice(-n);

    // Return (ann.) = CAGR finestra effettiva
    const nDays=(aCloses.length-1);
    const priceRatio=aCloses[aCloses.length-1]/aCloses[0];
    const cagr = nDays>0 ? Math.pow(priceRatio, 252/nDays) - 1 : 0;

    const volAnn = stdev(Yi) * Math.sqrt(252);
    const mdd    = maxDrawdown(aCloses.slice(-effLB));
    const dd     = downsideDeviation(Yi, 0) * Math.sqrt(252);

    const reg = olsSlopeIntercept(Xm, Yi);
    const a = reg.a, b = reg.b, r2 = reg.r2, eps = reg.eps;

    const alphaAnn = a * 252;
    const sigeAnn  = stdev(eps) * Math.sqrt(252);

    // correlazione
    const sx=stdev(Xm), sy=stdev(Yi);
    const mx=Xm.reduce(function(s,v){return s+v;},0)/Xm.length;
    const my=Yi.reduce(function(s,v){return s+v;},0)/Yi.length;
    let cov=0; for(let i=0;i<n;i++) cov+=(Xm[i]-mx)*(Yi[i]-my); cov/=(n-1);
    const corr=(sx===0||sy===0)?0:(cov/(sx*sy));

    function set(id,val){ var el=document.getElementById(id); if(el) el.textContent=val; }
    set("rm-beta", b.toFixed(3));
    set("rm-alpha",(alphaAnn*100).toFixed(2)+"%");
    set("rm-r2",   r2.toFixed(3));
    set("rm-corr", corr.toFixed(3));
    set("rm-sige", (sigeAnn*100).toFixed(2)+"%");
    set("rm-ret",  (cagr*100).toFixed(2)+"%");
    set("rm-vol",  (volAnn*100).toFixed(2)+"%");
    set("rm-mdd",  (mdd*100).toFixed(2)+"%");
    set("rm-dd",   (dd*100).toFixed(2)+"%");
  } catch(err){
    console.error("updateBlock3 error:", err);
    content.querySelector(".risk-metrics").insertAdjacentHTML('beforeend', '<div class="rm-warning">Errore durante il calcolo metriche.</div>');
  }
}

/* ── Block 4: Fundamentals – 8 indicatori ──────────────────────────── */
function _num(v){ const n = Number(v); return Number.isFinite(n) ? n : null; }
function _fmt(v, {pct=false, dec=2}={}){ 
  if(v==null) return "–"; 
  return pct ? (v.toFixed(dec) + "%") : v.toFixed(dec);
}

export function updateBlock4(instrumentName, groupData){
  const info = groupData[instrumentName] || {};

  // --- Letture base dal dataset (con alias comuni) ---
  const eps   = _num(info.eps);                                  // Earnings Per Share
  const pe    = _num(info.pe_ratio ?? info.pe);                  // P/E
  const pb    = _num(info.pb_ratio ?? info.pb);                  // P/B
  const roe   = _num(info.return_on_equity ?? info.roe);         // atteso come frazione (0.18=18%)
  const dps   = _num(info.dividend_per_share ?? info.dps);       // Dividend per Share
  const dyPct = _num(info.div_yield ?? info.dividend_yield);     // in percentuale (es. 2.4)

  // opzionale: prezzo corrente se presente nel dataset
  const price = _num(info.price ?? info.last ?? info.close);

  // --- Derivati robusti ---
  // Earnings Yield (%) = 100 / P/E (fallback: 100 * EPS/Price)
  const earningsYieldPct =
    (pe && pe > 0) ? (100/pe) :
    (eps && price && price !== 0) ? (100 * eps / price) : null;

  // Stima prezzo se serve per DPS via Dividend Yield
  const priceEst = (price ?? ((pe && eps) ? pe * eps : null));

  // Dividend Cover = EPS / DPS  (fallback: EPS / (DY% * Price))
  let divCover = null;
  if (eps && dps && dps !== 0) {
    divCover = eps / dps;
  } else if (eps && dyPct != null && priceEst) {
    const dpsFromYield = (dyPct/100) * priceEst;
    if (dpsFromYield) divCover = eps / dpsFromYield;
  }

  // Se manca il DPS ma ho DY% e prezzo, calcolo DPS stimato
  const dpsShown = (dps != null) ? dps :
                   (dyPct != null && priceEst) ? (dyPct/100) * priceEst : null;

  // --- Render ---
  const block4 = document.getElementById("block4");
  block4.innerHTML = `
    <div class="fund-card">
      <div class="fund-title">Fundamentals</div>

      <div class="fund-subtitle">Earnings focus</div>
      <div class="fund-grid">
        ${_fundRow("EPS", eps)}
        ${_fundRow("Earnings Yield", earningsYieldPct, {pct:true})}
      </div>

      <div class="fund-subtitle">Dividend focus</div>
      <div class="fund-grid">
        ${_fundRow("Dividend Yield", dyPct, {pct:true})}
        ${_fundRow("Dividend Cover", divCover)}
      </div>

      <div class="fund-subtitle">Valuation focus</div>
      <div class="fund-grid">
        ${_fundRow("P/E", pe)}
        ${_fundRow("P/B", pb)}
      </div>

      <div class="fund-subtitle">Other</div>
      <div class="fund-grid">
        ${_fundRow("ROE", (roe!=null ? roe*100 : null), {pct:true})}
        ${_fundRow("DPS (est.)", dpsShown)}
      </div>
    </div>
  `;
}

function _fundRow(label, value, opt={}){
  const val = (value==null) ? "–" : _fmt(value, opt);
  return `<div class="fund-row"><span>${label}</span><strong>${val}</strong></div>`;
}

/* ==== Compat per moduli esistenti (events.js, main.js) ==== */

// vecchio hook: non fa nulla ma evita l'errore di import
export function initBlock3Tabs(){ /* no-op (legacy) */ }

// alias storico usato da altri moduli: chiama il nuovo updateSIM
export function updateSymbolOverview(instrumentName, groupData){
  const pricesData = window?.pricesData || {
    stockPrices:{}, etfPrices:{}, futuresPrices:{}, fxPrices:{}
  };
  return updateSIM(instrumentName, groupData, pricesData);
}

// opzionale: alcuni punti del sito lo richiedono
export function openYouTubePopup(){
  const p = document.getElementById("youtube-popup");
  if (p) p.style.display = "block";
}
