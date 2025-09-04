// FX dashboard wiring (Chart.js richiesto dalla tua HTML)  :contentReference[oaicite:1]{index=1}

// ─── Chart.js defaults ───
Chart.defaults.font.family = 'Helvetica Neue, Arial, sans-serif';
Chart.defaults.font.size   = 12;
Chart.defaults.font.weight = 'normal';

// Files
const STATS_FILE    = 'fx_long_short_stats.json';
const CHANNELS_FILE = 'fx_channels.json';
const STD_MULT      = 0.5;

// Helper
const fmtPct = v => (v*100).toFixed(2) + '%';

// Boot
(async function () {
  // 1) Carica stats
  const resp = await fetch(STATS_FILE);
  if (!resp.ok) { console.error('JSON load failed'); return; }
  const stats = await resp.json();

  // Trades ordinati per exit_date (coerente con equity_curve)
  const trades = Array.isArray(stats.trades) ? stats.trades.slice().sort((a,b)=> new Date(a.exit_date) - new Date(b.exit_date)) : [];

  // Periodo dal JSON (supporta sia oggetto {start,end} sia eventuale stringa)
  let periodLabel = '';
  if (stats.portfolio_kpis && stats.portfolio_kpis.period) {
    const p = stats.portfolio_kpis.period;
    if (p.start && p.end) {
      periodLabel = p.start + ' → ' + p.end;
    } else if (typeof p === 'string') {
      periodLabel = p;
    }
  } else if (trades.length) {
    const start = trades[0].entry_date;
    const end   = trades[trades.length-1].exit_date;
    periodLabel = start + ' → ' + end;
  }

  // KPI principali (tutto coerente con il backtest)
  const k = stats.portfolio_kpis || {};
  const kpi = {
    period:         periodLabel || '—',
    totalTrades:    k.total_trades ?? trades.length,
    winRate:        (k.win_rate_pct ?? 0).toFixed(1) + '%',
    totalPnl:       fmtPct(k.total_pnl ?? (trades.reduce((s,t)=>s+(t.pnl||0),0))),
    maxDrawdown:    fmtPct(k.max_drawdown ?? 0),
    avgDuration:    (k.avg_duration_days ?? 0).toFixed(1) + ' d'
  };

  // 2) Render KPI
  renderModule1(kpi);

  // 3) Historical Report (usa i P&L netti dal JSON — nessun ricalcolo in JS)
  renderModule2(trades);

  // 4) Equity chart: preferisci equity_curve; se mancante, costruiscila dai trade
  let curve = Array.isArray(stats.equity_curve) && stats.equity_curve.length
    ? stats.equity_curve.map(p => ({ x: p.date, y: p.cumulative_pnl }))
    : (() => {
        let cum=0; return trades.map(t => { cum += t.pnl || 0; return { x: t.exit_date, y: cum }; });
      })();

  renderModule3(curve);

  // 5) New Strategies Alert (stesse regole del backtest, prevUb/prevLb)
  const alerts = await computeNewAlerts();
  renderModule4(alerts);
})();

// Module 1 — KPI cards
function renderModule1(k) {
  const cont = document.getElementById('module1');
  cont.innerHTML = '';
  const items = [
    { label: 'Period',        value: k.period },
    { label: '# Trades',      value: k.totalTrades },
    { label: 'Win Rate',      value: k.winRate },
    { label: 'Total P&L',     value: k.totalPnl },
    { label: 'Max Drawdown',  value: k.maxDrawdown },
    { label: 'Avg Duration',  value: k.avgDuration },
  ];
  items.forEach(c => {
    const d = document.createElement('div');
    d.className = 'kpi-card';
    d.innerHTML = `<div class="kpi-value">${c.value}</div><div class="kpi-label">${c.label}</div>`;
    cont.appendChild(d);
  });
}

// Module 2 — Historical Report (tabella)
function renderModule2(trades) {
  const tbody = document.querySelector('#module2 tbody');
  const thead = document.querySelector('#module2 thead tr');
  tbody.innerHTML = ''; thead.innerHTML = `
    <th>Spread</th><th>Signal</th><th>Open Date</th><th>Close Date</th>
    <th>Open Price</th><th>Close Price</th><th>Take Profit</th><th>Stop Loss</th><th>Return</th>
  `;
  trades.forEach(t=>{
    const tr=document.createElement('tr');
    tr.innerHTML = `
      <td>${t.spread}</td><td>${t.type==='long'?'Long':'Short'}</td>
      <td>${t.entry_date}</td><td>${t.exit_date}</td>
      <td>${t.entry.toFixed(4)}</td><td>${t.exit.toFixed(4)}</td>
      <td>${t.take_profit.toFixed(4)}</td><td>${t.stop_loss.toFixed(4)}</td>
      <td>${fmtPct(t.pnl)}</td>
    `;
    tbody.appendChild(tr);
  });
}

// Module 3 — Equity chart (Chart.js)
function renderModule3(curve) {
  const ctx = document.getElementById('equityChart').getContext('2d');
  const labels = curve.map(p=>p.x);
  const data   = curve.map(p=>p.y*100); // in %
  new Chart(ctx,{
    type:'line',
    data:{ labels, datasets:[{ label:'Cumulative Return (%)', data, borderWidth:1, fill:false }]},
    options:{
      maintainAspectRatio:false, layout:{padding:{bottom:16}},
      scales:{ y:{ title:{display:true,text:'%'}, ticks:{ callback:v => v.toFixed(1)+'%' } }, x:{ ticks:{ maxRotation:0, autoSkip:true } } },
      plugins:{ legend:{display:false} }
    }
  });
}

// Module 4 — New Strategies Alert (prevUb/prevLb, σ=0.5)
async function computeNewAlerts(){
  try{
    const r = await fetch(CHANNELS_FILE);
    if(!r.ok) return [];
    const channels = await r.json();
    const out = [];
    for(const key of Object.keys(channels)){
      const rows = channels[key];
      if(!Array.isArray(rows) || rows.length < 2) continue;
      const last  = rows[rows.length-1];
      const prev  = rows[rows.length-2];
      // rows: [date, ratio, lower1, lower2, upper1, upper2]
      const r_now   = +last[1],  l1 = +last[2],  u1 = +last[4];
      const r_prev  = +prev[1], pl1 = +prev[2], pu1 = +prev[4];
      const t_now   = (u1 + l1)/2,   s_now = Math.abs(u1 - t_now);
      const t_prev  = (pu1 + pl1)/2, s_prev= Math.abs(pu1 - t_prev);
      const ub      = t_now  + s_now  * STD_MULT;
      const lb      = t_now  - s_now  * STD_MULT;
      const prevUb  = t_prev + s_prev * STD_MULT;
      const prevLb  = t_prev - s_prev * STD_MULT;

      if (r_now > ub && r_prev <= prevUb){
        out.push({spread:key, signal:'Short', open:r_now.toFixed(4), tp:t_now.toFixed(4), sl:(r_now + Math.abs(r_now - t_now)).toFixed(4)});
      } else if (r_now < lb && r_prev >= prevLb){
        out.push({spread:key, signal:'Long',  open:r_now.toFixed(4), tp:t_now.toFixed(4), sl:(r_now - Math.abs(t_now - r_now)).toFixed(4)});
      }
    }
    return out;
  }catch(e){ console.error(e); return []; }
}

function renderModule4(alerts){
  const tbody = document.querySelector('#module4 tbody');
  tbody.innerHTML = '';
  if(!alerts.length){
    const tr = document.createElement('tr');
    tr.innerHTML = `<td colspan="5" style="text-align:center;opacity:.7">No new signals today</td>`;
    tbody.appendChild(tr);
    return;
  }
  alerts.forEach(a=>{
    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td>${a.spread}</td><td>${a.signal}</td>
      <td>${a.open}</td><td>${a.tp}</td><td>${a.sl}</td>
    `;
    tbody.appendChild(tr);
  });
}
