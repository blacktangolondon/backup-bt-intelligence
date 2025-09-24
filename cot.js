// Dashboard glue (Chart.js required in HTML)

Chart.defaults.font.family = 'Helvetica Neue, Arial, sans-serif';
Chart.defaults.font.size   = 12;
Chart.defaults.font.weight = 'normal';

const STATS_FILE    = 'cot_backtest_stats.json';
const PRICE_COT_FILE = 'price_and_cot.json';
const STD_MULT      = 0.5;

const fmtPct = v => (Number(v) * 100).toFixed(2) + '%';
const num    = v => Number.isFinite(Number(v)) ? Number(v) : 0;
const fetchJSON = async (url) => {
  const u = url + (url.includes('?') ? '&' : '?') + 'ts=' + Date.now();
  const r = await fetch(u, { cache: 'no-store' });
  if (!r.ok) throw new Error(`Failed to load ${u}: ${r.status}`);
  return r.json();
};

(async function () {
  let stats;
  try { stats = await fetchJSON(STATS_FILE); }
  catch (e) { console.error('JSON load failed for stats:', e); return; }

  const trades = Array.isArray(stats.trades)
    ? stats.trades.slice().sort((a,b)=> new Date(a.exit_date) - new Date(b.exit_date))
    : [];

  const openTrades = Array.isArray(stats.open_trades)
    ? stats.open_trades.slice().sort((a,b)=> new Date(a.entry_date) - new Date(b.entry_date))
    : [];

  // Period label
  let periodLabel = '';
  if (stats.portfolio_kpis && stats.portfolio_kpis.period) {
    const p = stats.portfolio_kpis.period;
    if (p.start && p.end) periodLabel = p.start + ' → ' + p.end;
    else if (typeof p === 'string') periodLabel = p;
  } else if (trades.length) {
    periodLabel = trades[0].entry_date + ' → ' + trades[trades.length-1].exit_date;
  }

  // ── KPI (realized) — P&L / Max DD con "×"
  const k = stats.portfolio_kpis || {};
  const totalPnl = num(k.total_pnl);
  const maxDD    = Math.max(0, num(k.max_drawdown));
  const pnlOverDD= (maxDD > 0) ? (totalPnl / maxDD) : NaN;
  const pnlOverDDLabel = Number.isFinite(pnlOverDD) ? pnlOverDD.toFixed(2) + '×' : '—';

  const kpi = {
    period:         periodLabel || '—',
    totalTrades:    k.total_trades ?? trades.length,
    winRate:        (k.win_rate_pct ?? 0).toFixed(1) + '%',
    pnlOverDD:      pnlOverDDLabel,
    avgDuration:    (k.avg_duration_days ?? 0).toFixed(1) + ' d',
    openCount:      k.open_positions ?? openTrades.length
  };
  initModule1Tabs();
  renderModule1(kpi); // ← importante

  // ── Modulo 2: usa i tab già presenti in HTML; popola solo le tabelle
  renderReportTabs(trades, openTrades);

  // ── Modulo 3: Portfolio Value Index (base=100)
  const curve = Array.isArray(stats.equity_curve) && stats.equity_curve.length
    ? stats.equity_curve.map(p => ({ x: p.date, y: num(p.cumulative_pnl) }))
    : (() => { let cum=0; return trades.map(t => { cum += num(t.pnl); return { x: t.exit_date, y: cum }; }); })();
  renderModule3_asIndex(curve);

  // ── Modulo 4: New Strategies Alert
  try {
  const db = await fetchJSON(PRICE_COT_FILE);
  renderModule4(computeNewAlertsFrom(db));
  } catch (e) { renderModule4([]); }
})();

// ───────── Module 1
function renderModule1(k) {
  const cont = document.getElementById('module1-kpi');
  if (!cont) return;
  cont.innerHTML = '';
  [
    { label: 'Period', value: k.period },
    { label: '# Trades', value: k.totalTrades },
    { label: 'Win Rate', value: k.winRate },
    { label: 'P&L / Max DD', value: k.pnlOverDD },
    { label: 'Avg Duration', value: k.avgDuration },
    { label: 'Open Positions', value: k.openCount },
  ].forEach(c => {
    const d = document.createElement('div');
    d.className = 'kpi-card';
    d.innerHTML = `<div class="kpi-value">${c.value}</div><div class="kpi-label">${c.label}</div>`;
    cont.appendChild(d);
  });
}
// ───────── Module 1 (tabs: Statistics / Strategy Description)
function initModule1Tabs(){
  const tabs = document.querySelectorAll('#statsTabs .tab');
  const panes = {
    stats: document.getElementById('tab-stats'),
    desc:  document.getElementById('tab-desc')
  };
  tabs.forEach(btn=>{
    btn.addEventListener('click', ()=>{
      tabs.forEach(b=>b.classList.remove('active'));
      btn.classList.add('active');
      const tab = btn.dataset.tab;
      panes.stats.classList.toggle('active', tab === 'stats');
      panes.desc.classList.toggle('active',  tab === 'desc');
    });
  });
}

// ───────── Module 2 (riusa i tab già presenti)
function renderReportTabs(trades, openTrades){
  const tabs = document.querySelectorAll('#reportTabs .tab');
  const panes = {
    realized: document.getElementById('tab-realized'),
    open:     document.getElementById('tab-open')
  };
  tabs.forEach(btn=>{
    btn.addEventListener('click', ()=>{
      tabs.forEach(b=>b.classList.remove('active'));
      btn.classList.add('active');
      const tab = btn.dataset.tab;
      panes.realized.classList.toggle('active', tab==='realized');
      panes.open.classList.toggle('active', tab==='open');
    });
  });

  // CLOSED
  {
    const thead = panes.realized.querySelector('thead tr');
    const tbody = panes.realized.querySelector('tbody');
    thead.innerHTML = `
      <th>Ticker</th><th>Signal</th><th>Open Date</th><th>Close Date</th>
      <th>Open Price</th><th>Close Price</th><th>Target</th><th>Stop</th><th>Return</th><th>Exit</th>`;
    tbody.innerHTML = '';
    trades.forEach(t=>{
      const tr=document.createElement('tr');
      tr.innerHTML = `
        <td>${t.spread}</td><td>${t.type==='long'?'Long':'Short'}</td>
        <td>${t.entry_date}</td><td>${t.exit_date}</td>
        <td>${num(t.entry).toFixed(4)}</td><td>${num(t.exit).toFixed(4)}</td>
        <td>${num(t.take_profit).toFixed(4)}</td><td>${num(t.stop_loss).toFixed(4)}</td>
        <td>${fmtPct(num(t.pnl))}</td><td>${t.exit_reason || ''}</td>`;
      tbody.appendChild(tr);
    });
    if (!trades.length){
      const tr = document.createElement('tr');
      tr.innerHTML = `<td colspan="10" style="text-align:center;opacity:.7">No closed trades</td>`;
      tbody.appendChild(tr);
    }
  }

  // OPEN
  {
    const thead = panes.open.querySelector('thead tr');
    const tbody = panes.open.querySelector('tbody');
    thead.innerHTML = `
      <th>Ticker</th><th>Signal</th><th>Open Date</th><th>Days Open</th>
      <th>Entry</th><th>Last</th><th>Target</th><th>Stop</th><th>Return (MTM)</th>`;
    tbody.innerHTML = '';
    openTrades.forEach(t=>{
      const tr=document.createElement('tr');
      tr.innerHTML = `
        <td>${t.spread}</td><td>${t.type==='long'?'Long':'Short'}</td>
        <td>${t.entry_date}</td><td>${num(t.days_open)}</td>
        <td>${num(t.entry).toFixed(4)}</td><td>${num(t.last).toFixed(4)}</td>
        <td>${num(t.take_profit).toFixed(4)}</td><td>${num(t.stop_loss).toFixed(4)}</td>
        <td>${fmtPct(num(t.mtm_return))}</td>`;
      tbody.appendChild(tr);
    });
    if (!openTrades.length){
      const tr = document.createElement('tr');
      tr.innerHTML = `<td colspan="9" style="text-align:center;opacity:.7">No open positions</td>`;
      tbody.appendChild(tr);
    }
  }
}

// ───────── Module 3
function renderModule3_asIndex(curve) {
  const el = document.getElementById('equityChart');
  if (!el) return;
  const ctx = el.getContext('2d');
  const labels = curve.map(p=>p.x);
  const dataIdx= curve.map(p => (1 + num(p.y)) * 100);

  const grad = ctx.createLinearGradient(0, 0, 0, el.height);
  grad.addColorStop(0, 'rgba(246,163,19,0.35)');
  grad.addColorStop(1, 'rgba(246,163,19,0.00)');

  new Chart(ctx,{
    type:'line',
    data:{ labels, datasets:[{
      label:'Portfolio Value (Index)', data:dataIdx,
      borderColor:'#F6A313', backgroundColor:grad, fill:true,
      pointRadius:0, tension:0.25, borderWidth:2
    }]},
    options:{
      maintainAspectRatio:false,
      layout:{padding:{bottom:12,left:8,right:8,top:8}},
      scales:{
        y:{ grid:{color:'#2a2a2a'}, ticks:{ callback:v => Number(v).toFixed(0) } },
        x:{ grid:{display:false}, ticks:{ maxRotation:0, autoSkip:true } }
      },
      plugins:{ legend:{display:false} }
    }
  });
}

// ───────── Module 4
// ====== Segnali COT (senza canali) ======
const BUY_TRIG      = 72.0;   // COT sopra → LONG
const SELL_TRIG     = 28.0;   // COT sotto → SHORT
const USE_CROSS     = true;   // entra solo su "cross" della soglia

// TP/SL come nello script di backtest
const RISK_MODE     = 'std';  // 'std' | 'fixed_pct'
const TP_PCT        = 0.10;   // usati se RISK_MODE='fixed_pct' o come fallback
const SL_PCT        = 0.10;

const VOL_WIN_WKS   = 25;     // rolling su rendimenti weekly
const TP_MULT       = 1.4;
const SL_MULT       = 1.4;
const MIN_PCT_FLOOR = 0.005;  // 0.5%

function _std(arr){
  const xs = arr.filter(v => Number.isFinite(v));
  if (xs.length < 2) return NaN;
  const m = xs.reduce((a,b)=>a+b,0) / xs.length;
  const v = xs.reduce((a,b)=>a + (b-m)*(b-m), 0) / (xs.length - 1);
  return Math.sqrt(v);
}

function _tpSl(signal, priceNow, closes){
  // closes = array dei Close storici
  if (RISK_MODE === 'fixed_pct'){
    const tpPct = TP_PCT, slPct = SL_PCT;
    return (signal === 'Long')
      ? [priceNow*(1+tpPct), priceNow*(1-slPct)]
      : [priceNow*(1-tpPct), priceNow*(1+slPct)];
  }
  // std rolling (default)
  const rets = [];
  for (let i=1;i<closes.length;i++){
    const a = Number(closes[i-1]), b = Number(closes[i]);
    rets.push((a && isFinite(a) && isFinite(b)) ? (b/a - 1) : NaN);
  }
  const vol   = _std(rets.slice(-VOL_WIN_WKS));
  const tpPct = Math.max(MIN_PCT_FLOOR, TP_MULT * (isFinite(vol) ? vol : MIN_PCT_FLOOR));
  const slPct = Math.max(MIN_PCT_FLOOR, SL_MULT * (isFinite(vol) ? vol : MIN_PCT_FLOOR));
  return (signal === 'Long')
    ? [priceNow*(1+tpPct), priceNow*(1-slPct)]
    : [priceNow*(1-tpPct), priceNow*(1+slPct)];
}

// db = price_and_cot.json → { "TICKER": {market, data: [[Date, Close, COT_Index], ...]}, ... }
function computeNewAlertsFrom(db){
  const out = [];
  if (!db || typeof db !== 'object') return out;

  for (const [ticker, payload] of Object.entries(db)){
    const rows = Array.isArray(payload?.data) ? payload.data : [];
    if (rows.length < 2) continue;

    const prev = rows[rows.length-2];
    const last = rows[rows.length-1];

    const cotPrev  = Number(prev[2]);
    const cotNow   = Number(last[2]);
    const priceNow = Number(last[1]);

    const longCross  = USE_CROSS ? (cotPrev <= BUY_TRIG  && cotNow >  BUY_TRIG) : (cotNow >  BUY_TRIG);
    const shortCross = USE_CROSS ? (cotPrev >= SELL_TRIG && cotNow <  SELL_TRIG) : (cotNow <  SELL_TRIG);

    let signal = null;
    if (longCross) signal = 'Long';
    else if (shortCross) signal = 'Short';
    if (!signal) continue;

    const closes = rows.map(r => Number(r[1]));
    const [tp, sl] = _tpSl(signal, priceNow, closes);

    out.push({
      spread: ticker,
      signal,
      open: priceNow.toFixed(4),
      tp: isFinite(tp) ? tp.toFixed(4) : '—',
      sl: isFinite(sl) ? sl.toFixed(4) : '—'
    });
  }
  return out;
}


function renderModule4(alerts){
  const tbody = document.querySelector('#module4 tbody');
  if (!tbody) return;
  tbody.innerHTML = '';
  if(!alerts.length){
    const tr = document.createElement('tr');
    tr.innerHTML = `<td colspan="5" style="text-align:center;opacity:.7">No new signals today</td>`;
    tbody.appendChild(tr);
    return;
  }
  alerts.forEach(a=>{
    const tr = document.createElement('tr');
    tr.innerHTML = `<td>${a.spread}</td><td>${a.signal}</td><td>${a.open}</td><td>${a.tp}</td><td>${a.sl}</td>`;
    tbody.appendChild(tr);
  });
}
