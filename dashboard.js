// dashboard.js
// Block2: SIM + Benchmark (tabs) con bench selezionabile.
// Block3: metriche coerenti col bench scelto.
// Block4: fundamentals (solo 6 indicatori richiesti).

import { renderScatterWithRegression, renderBenchmarkLines } from "./charts.js";

/* ── Label arrays (compat altrove) ─────────────────────────────────── */
export const leftLabels        = ["SCORE","TREND","APPROACH","GAP TO PEAK","KEY AREA","MICRO","MATH","STATS","TECH"];
export const rightLabels       = ["S&P500 CORRELATION","S&P500 VOLATILITY RATIO","BULLISH ALPHA","BEARISH ALPHA","ALPHA STRENGHT","PE RATIO","EPS","1 YEAR HIGH","1 YEAR LOW"];
export const etfLeftLabels     = ["SCORE","TREND","APPROACH","GAP TO PEAK","KEY AREA","MATH","STATS","TECH"];
export const etfRightLabels    = ["S&P500 CORRELATION","S&P500 VOLATILITY RATIO","BULLISH ALPHA","BEARISH ALPHA","ALPHA STRENGHT","1 YEAR HIGH","1 YEAR LOW","TICKER"];
export const futuresLeftLabels = ["SCORE","TREND","APPROACH","GAP TO PEAK / TO VALLEY","KEY AREA","LIMIT","POTENTIAL EXTENSION"];
export const futuresRightLabels= ["S&P500 CORRELATION","S&P500 VOLATILITY RATIO","ALPHA STRENGHT","MID TERM PRICE % PROJECTION","MATH","STATS","TECH"];
export const fxLeftLabels      = ["SCORE","TREND","APPROACH","GAP TO PEAK / TO VALLEY","KEY AREA","LIMIT","POTENTIAL EXTENSION"];
export const fxRightLabels     = ["S&P500 CORRELATION","S&P500 VOLATILITY RATIO","ALPHA STRENGHT","MID TERM PRICE % PROJECTION","MATH","STATS","TECH"];

/* ── Helpers comuni ────────────────────────────────────────────────── */
export function parseGap(v){ return (v === "-" || isNaN(parseFloat(v))) ? 0 : parseFloat(v); }

const TV2Y_SUFFIX = {
  "XETR": ".DE","FWB": ".DE","NASDAQ":"","NYSE":"","AMEX":"","NYSEARCA":"",
  "MIL": ".MI","BIT": ".MI","BME": ".MC","TSX": ".TO","TSXV": ".V","ASX": ".AX",
  "LSE": ".L","LSEIOB": ".L","EPA": ".PA","Euronext": ".PA","AMS": ".AS",
  "SWX": ".SW","SIX": ".SW","HKEX": ".HK","JPX": ".T"
};
function candidatesFromTvSymbol(tvSymbol){
  if(!tvSymbol||typeof tvSymbol!=="string") return [];
  const parts = tvSymbol.split(":");
  const ex  = parts[0];
  const raw = parts.length>1 ? parts[1] : tvSymbol;
  const suf = TV2Y_SUFFIX[ex] || "";
  const guess = raw + suf;
  const list = [tvSymbol, raw];
  if(suf && !raw.endsWith(suf)) list.push(guess);
  return Array.from(new Set(list));
}
function lookupAny(pricesData, keys){
  const buckets=[
    (pricesData && pricesData.stockPrices)   || {},
    (pricesData && pricesData.etfPrices)     || {},
    (pricesData && pricesData.futuresPrices) || {},
    (pricesData && pricesData.fxPrices)      || {}
  ];
  for(let k of keys){ for(let b of buckets){ if(b[k]) return b[k]; } }
  return null;
}
function getSeriesForSymbol(pricesData,tv){ return lookupAny(pricesData, candidatesFromTvSymbol(tv)); }

/* benchmark: prova "desired" poi fallback ^GSPC→SPY */
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
function availableBenchKeys(pricesData){
  const b = [
    Object.keys((pricesData && pricesData.stockPrices)   || {}),
    Object.keys((pricesData && pricesData.etfPrices)     || {}),
    Object.keys((pricesData && pricesData.futuresPrices) || {}),
    Object.keys((pricesData && pricesData.fxPrices)      || {}),
  ].flat();
  const pref = ['^GSPC','GSPC','SPY','^GDAXI','DAX','^STOXX50E'];
  const set  = new Set(pref.concat(b));
  return Array.from(set).filter(Boolean).sort((a,b)=>a.localeCompare(b));
}

function extractClosesAndDates(series){
  if(!series) return {closes:[],dates:null};
  if(Array.isArray(series) && (series.length===0 || typeof series[0]==="number")){
    const closes=series.map(Number).filter(Number.isFinite); return {closes,dates:null};
  }
  const rows=series.map(function(r){
    if(Array.isArray(r)){
      const c=(r.length>=5)?+r[4]:+r[1]; const d=r[0];
      return Number.isFinite(c)?{date:d,close:c}:null;
    }
    if(r && typeof r==="object"){
      const c=+(r.close||r.Close||r.c); const d=(r.date||r.Date||r.t);
      return Number.isFinite(c)?{date:d,close:c}:null;
    }
    return null;
  }).filter(Boolean);
  return {closes:rows.map(x=>x.close), dates:rows.map(x=>x.date)};
}
function getAlignedCloses(Aseries,Bseries,lookbackPlus1){
  const A=extractClosesAndDates(Aseries), B=extractClosesAndDates(Bseries);
  if(!A.dates||!B.dates){
    const n=Math.min(A.closes.length,B.closes.length,lookbackPlus1);
    return [A.closes.slice(-n), B.closes.slice(-n)];
  }
  const mapB=new Map(B.dates.map((d,i)=>[String(d),B.closes[i]]));
  const a=[], b=[];
  for(let i=0;i<A.dates.length;i++){ const k=String(A.dates[i]); if(mapB.has(k)){ a.push(A.closes[i]); b.push(mapB.get(k)); } }
  const n=Math.min(a.length,b.length,lookbackPlus1);
  return [a.slice(-n), b.slice(-n)];
}
function getAlignedClosesAndDates(Aseries,Bseries,lookbackPlus1){
  const A=extractClosesAndDates(Aseries), B=extractClosesAndDates(Bseries);
  if(!A.dates||!B.dates){
    const n=Math.min(A.closes.length,B.closes.length,lookbackPlus1);
    const labels = Array.from({length:n}, (_,i)=>"D"+(n-i));
    return [A.closes.slice(-n), B.closes.slice(-n), labels];
  }
  const mapB=new Map(B.dates.map((d,i)=>[String(d),{i,close:B.closes[i]}]));
  const a=[], b=[], lab=[];
  for(let i=0;i<A.dates.length;i++){ const k=String(A.dates[i]); if(mapB.has(k)){ a.push(A.closes[i]); const o=mapB.get(k); b.push(o.close); lab.push(k); } }
  const n=Math.min(a.length,b.length,lookbackPlus1);
  return [a.slice(-n), b.slice(-n), lab.slice(-n)];
}

function dailyReturns(cl){ const out=[]; for(let i=1;i<cl.length;i++) out.push(cl[i]/cl[i-1]-1); return out; }
function cumulativeReturns(ret){ const out=[]; let acc=1; for(let i=0;i<ret.length;i++){ acc*=1+ret[i]; out.push(acc-1);} return out; }
function stdev(arr){ const n=arr.length; if(n<=1) return 0; const m=arr.reduce((s,v)=>s+v,0)/n; const v=arr.reduce((s,v)=>s+(v-m)*(v-m),0)/(n-1); return Math.sqrt(v); }
function maxDrawdown(cl){ if(!cl.length) return 0; let peak=cl[0],mdd=0; for(let i=0;i<cl.length;i++){ const c=cl[i]; if(c>peak) peak=c; const d=c/peak-1; if(d<mdd) mdd=d; } return mdd; }
function downsideDeviation(arr,t){ t=(t==null)?0:t; const neg=arr.filter(r=>r<t).map(r=>(r-t)*(r-t)); if(!neg.length) return 0; return Math.sqrt(neg.reduce((s,v)=>s+v,0)/neg.length); }
function olsSlopeIntercept(x,y){
  const n=x.length, mean=a=>a.reduce((s,v)=>s+v,0)/n;
  const mx=mean(x), my=mean(y);
  let num=0, den=0; for(let i=0;i<n;i++){ num+=(x[i]-mx)*(y[i]-my); den+=(x[i]-mx)*(x[i]-mx); }
  const b=den===0?0:num/den; const a=my-b*mx;
  const yhat=x.map(xi=>a+b*xi), eps=y.map((yi,i)=>yi-yhat[i]);
  const sst=y.reduce((s,yi)=>s+(yi-my)*(yi-my),0), sse=eps.reduce((s,e)=>s+e*e,0);
  const r2=sst===0?0:1-(sse/sst);
  return {a,b,r2,eps};
}
function resizeChart(idOrCanvas){
  try{
    const Chart = window.Chart; if(!Chart) return;
    const el = (typeof idOrCanvas==="string") ? document.getElementById(idOrCanvas) : idOrCanvas;
    const inst = Chart.getChart ? Chart.getChart(el) : null;
    if(inst && typeof inst.resize==="function") inst.resize();
  }catch(_){}
}
/* ── Block1: TradingView (top bar nascosta, barra laterale visibile) ── */
function updateChartGeneric(instrumentName, groupData){
  const info   = groupData[instrumentName] || {};
  const symbol = (info.tvSymbol || "NASDAQ:AMZN").replace(/-/g,"_");

  const block1 = document.getElementById("block1");
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
  script.type = "text/javascript";
  script.src  = "https://s3.tradingview.com/external-embedding/embed-widget-advanced-chart.js";
  script.async = true;
  script.textContent = JSON.stringify(cfg);
  container.appendChild(script);
}
export function updateChart(i,g){ updateChartGeneric(i,g); }

/* ── Stato bench selezionato ────────────────────────────────────────── */
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
  try{ localStorage.setItem("bt_sim_bench_map", JSON.stringify(map)); }catch(_){}
}
(function restoreBenchmarkMap(){
  try{
    const raw = localStorage.getItem("bt_sim_bench_map");
    if(raw) window.__simBenchmarkBySymbol = JSON.parse(raw);
  }catch(_){}
})();

/* ── Block2: SIM + Benchmark (tabs) + picker ────────────────────────── */
export function updateSIM(instrumentName, groupData, pricesData){
  const instKey = getInstKey(groupData, instrumentName);
  const block2  = document.getElementById("block2");

  let container = block2.querySelector("#symbol-info-container");
  if(!container){
    container = document.createElement("div");
    container.id = "symbol-info-container";
    block2.appendChild(container);
  }

  container.innerHTML =
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
    '<div class="sim-body">'+
      '<div id="pane-sim" class="sim-pane"><canvas id="sim-canvas"></canvas></div>' +
      '<div id="pane-bench" class="sim-pane hidden"><canvas id="bench-canvas"></canvas></div>' +
    '</div>';

  const list = container.querySelector("#bench-list");
  const keys = availableBenchKeys(pricesData);
  list.innerHTML = keys.map(k=>'<option value="'+k+'"></option>').join("");

  let benchKey = readSavedBenchmark(instKey);
  const benchInput = container.querySelector("#bench-input");
  const benchMsg   = container.querySelector("#bench-msg");
  benchInput.value = benchKey;

  function setMsg(txt, ok){
    benchMsg.textContent = txt || "";
    benchMsg.style.color = (ok===false) ? '#ff7d7d' : '#7fd67f';
    if(txt){ setTimeout(()=>benchMsg.textContent="", 1800); }
  }

  function renderAll(){
    const assetSeriesRaw = getSeriesForSymbol(pricesData, instKey);
    const benchSeriesRaw = getBenchmarkSeries(pricesData, benchKey);
    if(!assetSeriesRaw || !benchSeriesRaw){
      container.querySelector(".sim-body").innerHTML = '<div class="sim-missing">Serie prezzi non disponibili per grafici.</div>';
      return;
    }

    const triple = getAlignedClosesAndDates(assetSeriesRaw, benchSeriesRaw, Number.MAX_SAFE_INTEGER);
    const aAll=triple[0], mAll=triple[1], labelsAll=triple[2];

    const effLB = Math.min(252, Math.max(1, Math.min(aAll.length-1, mAll.length-1)));
    const aCloses = aAll.slice(-(effLB+1));
    const mCloses = mAll.slice(-(effLB+1));
    const labels  = labelsAll.slice(-(effLB+1)).slice(1);

    const Ri = dailyReturns(aCloses);
    const Rm = dailyReturns(mCloses);
    const n  = Math.min(Ri.length, Rm.length);
    const Yi = Ri.slice(-n), Xm = Rm.slice(-n);

    const reg = olsSlopeIntercept(Xm, Yi);
    const points = Xm.map((x,i)=>({x, y:Yi[i]}));
    renderScatterWithRegression("sim-canvas", points, { a:reg.a, b:reg.b });

    renderBenchmarkLines("bench-canvas", labels.slice(-n), cumulativeReturns(Yi), cumulativeReturns(Xm));

    updateBlock3(instrumentName, groupData, pricesData); // metriche coerenti
    updateBlock4(instrumentName, groupData);             // ← Block 4 auto-sync
  }

  benchInput.addEventListener("change", function(){
    const candidate = benchInput.value.trim();
    if(!candidate) return;
    const ok = !!getBenchmarkSeries(pricesData, candidate);
    if(ok){ benchKey=candidate; saveBenchmark(instKey, benchKey); setMsg("Benchmark aggiornato", true); renderAll(); }
    else  { setMsg("Non trovato nei dati", false); benchInput.value = benchKey; }
  });
  container.querySelector("#bench-reset").addEventListener("click", function(){
    benchKey="^GSPC"; benchInput.value=benchKey; saveBenchmark(instKey, benchKey); setMsg("Reset a S&P 500", true); renderAll();
  });

  container.querySelectorAll(".tab-btn").forEach(btn=>{
    btn.onclick = function(){
      container.querySelectorAll(".tab-btn").forEach(b=>b.classList.remove("active"));
      btn.classList.add("active");
      const tab = btn.getAttribute("data-tab");
      document.getElementById("pane-sim").classList.toggle("hidden", tab!=="sim");
      document.getElementById("pane-bench").classList.toggle("hidden", tab!=="bench");
      requestAnimationFrame(()=>resizeChart(tab==="sim"?"sim-canvas":"bench-canvas"));
    };
  });

  renderAll();
}

// ── Compat per main.js: alias updateSymbolOverview → updateSIM ──
export function updateSymbolOverview(instrumentName, groupData, pricesData){
  try {
    const pd = pricesData || (window && window.pricesData) || {};
    return updateSIM(instrumentName, groupData, pd);
  } catch (e) {
    console.error('updateSymbolOverview error:', e);
  }
}

/* ── Block3: metriche (SIM + rischio) ───────────────────────────────── */
export function updateBlock3(instrumentName, groupData, pricesData){
  const wrap=document.getElementById("block3");
  // Block3 invariato: non forziamo/nascondiamo i tab

  const content=document.getElementById("block3-content");
  content.innerHTML =
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
    const instKey = (groupData[instrumentName] && groupData[instrumentName].tvSymbol) || instrumentName;
    const benchKey= readSavedBenchmark(instKey);

    const assetSeriesRaw=getSeriesForSymbol(pricesData, instKey);
    const benchSeriesRaw=getBenchmarkSeries(pricesData, benchKey);
    if(!assetSeriesRaw||!benchSeriesRaw){
      content.querySelector(".risk-metrics").insertAdjacentHTML('beforeend','<div class="rm-warning">Serie prezzi mancanti per calcolare le metriche.</div>');
      return;
    }

    const pair = getAlignedCloses(assetSeriesRaw, benchSeriesRaw, Number.MAX_SAFE_INTEGER);
    const aAll=pair[0], mAll=pair[1];
    const effLB=Math.min(252, Math.max(1, Math.min(aAll.length-1, mAll.length-1)));
    document.getElementById("rm-title").textContent = 'Metrics (daily, last '+effLB+')';

    const aCloses=aAll.slice(-(effLB+1));
    const mCloses=mAll.slice(-(effLB+1));
    const Ri=dailyReturns(aCloses);
    const Rm=dailyReturns(mCloses);
    const n=Math.min(Ri.length,Rm.length);
    const Yi=Ri.slice(-n), Xm=Rm.slice(-n);

    const nDays=(aCloses.length-1);
    const priceRatio=aCloses[aCloses.length-1]/aCloses[0];
    const cagr = nDays>0 ? Math.pow(priceRatio, 252/nDays) - 1 : 0;

    const volAnn = stdev(Yi)*Math.sqrt(252);
    const mdd    = maxDrawdown(aCloses.slice(-effLB));
    const dd     = downsideDeviation(Yi,0)*Math.sqrt(252);

    const reg = olsSlopeIntercept(Xm, Yi);
    const a = reg.a, b=reg.b, r2=reg.r2, eps=reg.eps;

    const alphaAnn = a*252;
    const sigeAnn  = stdev(eps)*Math.sqrt(252);

    const sx=stdev(Xm), sy=stdev(Yi);
    const mx=Xm.reduce((s,v)=>s+v,0)/Xm.length;
    const my=Yi.reduce((s,v)=>s+v,0)/Yi.length;
    let cov=0; for(let i=0;i<n;i++) cov+=(Xm[i]-mx)*(Yi[i]-my); cov/=(n-1);
    const corr=(sx===0||sy===0)?0:(cov/(sx*sy));

    function set(id,val){ const el=document.getElementById(id); if(el) el.textContent=val; }
    set("rm-beta", b.toFixed(3));
    set("rm-alpha",(alphaAnn*100).toFixed(2)+"%");
    set("rm-r2",   r2.toFixed(3));
    set("rm-corr", corr.toFixed(3));
    set("rm-sige", (sigeAnn*100).toFixed(2)+"%");
    set("rm-ret",  (cagr*100).toFixed(2)+"%");
    set("rm-vol",  (volAnn*100).toFixed(2)+"%");
    set("rm-mdd",  (mdd*100).toFixed(2)+"%");
    set("rm-dd",   (dd*100).toFixed(2)+"%");
  }catch(err){
    console.error("updateBlock3 error:", err);
    content.querySelector(".risk-metrics").insertAdjacentHTML('beforeend','<div class="rm-warning">Errore durante il calcolo metriche.</div>');
  }
}

/* ── Block3: ripristino initBlock3Tabs per compat con events.js ─────── */
export function initBlock3Tabs() {
  const tabsEl = document.getElementById('block3-tabs');
  if (!tabsEl) return;
  const btns = tabsEl.querySelectorAll('button');
  const tscore = document.getElementById('block3-trendscore');
  const tview  = document.getElementById('block3-tradingview');

  const show = (tab) => {
    btns.forEach(b => b.classList.toggle('active-tab', b.dataset.tab === tab));
    if (tscore) tscore.style.display = (tab === 'trendscore') ? 'block' : 'none';
    if (tview)  tview.style.display  = (tab === 'tradingview') ? 'block' : 'none';
  };

  btns.forEach(btn => btn.addEventListener('click', () => show(btn.dataset.tab)));
  show((tabsEl.querySelector('.active-tab')?.dataset.tab) || 'trendscore');
}
/* ── Block4: Fundamentals (6 campi, design come Block3) ────────────── */
export function updateBlock4(instrumentName, groupData){
  const el = document.getElementById("block4");
  if (!el) return;

  // ---------- helpers ----------
  const norm = s => String(s||"").trim().toLowerCase();
  const stripEx = s => String(s||"").replace(/^[A-Z]+:/, "").trim(); // NASDAQ:ADBE -> ADBE

  const asList = (data) => {
    if (!data) return [];
    if (Array.isArray(data)) return data;
    for (const k of ["stocks","items","data","list"]) {
      if (data[k] && (Array.isArray(data[k]) || typeof data[k] === "object")) {
        return Array.isArray(data[k]) ? data[k] : Object.values(data[k]);
      }
    }
    return Object.values(data);
  };

  function findInfo(name, pool){
    if (!pool) return null;
    if (!Array.isArray(pool) && pool[name]) return pool[name];

    const list = asList(pool);
    const nName = norm(name);
    const nStrip= norm(stripEx(name));
    let hit = list.find(o =>
      norm(o?.ticker)         === nStrip ||
      norm(stripEx(o?.tvSymbol)) === nStrip ||
      norm(o?.tvSymbol)       === nName
    );
    if (hit) return hit;
    hit = list.find(o => norm(o?.symbol) === nStrip || norm(o?.code) === nStrip);
    if (hit) return hit;
    hit = list.find(o => norm(o?.name) === nName || norm(o?.company) === nName);
    if (hit) return hit;
    hit = list.find(o => (o?.name && nName.includes(norm(o.name))) || (o?.company && nName.includes(norm(o.company))));
    if (hit) return hit;
    return null;
  }

  // ---------- risoluzione multi-sorgente ----------
  const candidates = [
    groupData,
    (window && window.stocksFullData),
    (window && window.etfFullData),
    (window && window.futuresFullData),
    (window && window.fxFullData)
  ];
  let info = null;
  for (const src of candidates){
    info = findInfo(instrumentName, src);
    if (info) break;
  }
  console.log("[Block4] name:", instrumentName, "→ resolved:", info?.ticker || info?.tvSymbol || info?.name || "(none)");

  // ---------- numerica ----------
  const num = (v) => {
    if (v === null || v === undefined) return null;
    if (typeof v === "string") {
      const s = v.replace(/,/g,"").trim();
      if (!s || s === "-" || s.toLowerCase() === "na" || s.toLowerCase() === "n/a") return null;
      const n = Number(s); return Number.isFinite(n) ? n : null;
    }
    const n = Number(v); return Number.isFinite(n) ? n : null;
  };
  const parseYield = (v) => {
    if (v === null || v === undefined) return null;
    if (typeof v === "string") { const s=v.replace("%","").trim(); if(!s) return null; const n=Number(s); return Number.isFinite(n)? (n>1.5?n/100:n):null; }
    if (typeof v === "number") return v>1.5 ? v/100 : v;
    return null;
  };

  // ---------- letture ----------
  const pe   = num(info?.pe_ratio ?? info?.pe ?? info?.pe_ttm ?? info?.peRatio);
  const pb   = num(info?.pb_ratio ?? info?.pb ?? info?.price_to_book ?? info?.pbRatio);
  const eps  = num(info?.eps ?? info?.earnings_per_share ?? info?.eps_ttm);
  const yldF = parseYield(info?.div_yield ?? info?.dividend_yield ?? info?.dividendYield ?? info?.dividend_yield_percent);
  const payout = num(info?.payout_ratio ?? info?.dividend_payout_ratio);
  const pr   = num(info?.price ?? info?.last ?? info?.close ?? info?.last_price);

  const earningsYield = (pe && pe !== 0) ? (1/pe) : (eps && pr ? (eps/pr) : null);
  const dividendCover = (payout && payout > 0) ? (1/payout) : null;

  const fmt = (v, opts={}) => {
    if (v == null) return "–";
    if (opts.percent) return (v*100).toFixed(2) + "%";
    if (opts.decimals!=null) return v.toFixed(opts.decimals);
    return String(v);
  };

  console.log("[Block4] values:", { pe, pb, eps, yldF, payout, pr, earningsYield, dividendCover });

  // ---------- render (stile Block 3) ----------
  const box = (label, value) => `
    <div class="metric-card">
      <div class="metric-label">${label}</div>
      <div class="metric-value">${value}</div>
    </div>
  `;

  el.innerHTML = `
    <div class="section">
      <div class="section-title">Fundamentals</div>
      <div class="metrics-grid two-col">
        ${box("P/E",            fmt(pe, {decimals: 2}))}
        ${box("P/B",            fmt(pb, {decimals: 2}))}
        ${box("Dividend Yield", fmt(yldF, {percent: true}))}
        ${box("Dividend Cover", fmt(dividendCover, {decimals: 2}))}
        ${box("EPS",            fmt(eps, {decimals: 2}))}
        ${box("Earnings Yield", fmt(earningsYield, {percent: true}))}
      </div>
    </div>
  `;
}
