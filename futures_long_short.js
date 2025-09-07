// Futures dashboard — allineato a FX (sticky header, tabs, KPI ratio, index chart)

// ─── Chart.js defaults ───
Chart.defaults.font.family = 'Helvetica Neue, Arial, sans-serif';
Chart.defaults.font.size   = 12;
Chart.defaults.font.weight = 'normal';

// ─── File paths (relative to THIS html file) ───
const PATH_PREFIX   = '';  // '' = stessa cartella del file HTML
const STATS_FILE    = PATH_PREFIX + 'futures_long_short_stats.json';
const CHANNELS_FILE = PATH_PREFIX + 'futures_channels.json';
const STD_MULT      = 2.25; // ← futures: moltiplicatore σ (default aggiornato)

// ─── Helpers ───
const fmtPct = v => (Number(v) * 100).toFixed(2) + '%';
const num    = v => Number.isFinite(Number(v)) ? Number(v) : 0;
const fetchJSON = async (url) => {
  const u = url + (url.includes('?') ? '&' : '?') + 'ts=' + Date.now();
  const r = await fetch(u, { cache: 'no-store' });
  if (!r.ok) throw new Error(`Failed to load ${u}: ${r.status}`);
  return r.json();
};

// 👉 offset per sticky: altezza dei tab (le CSS usano --tabs-h su #module2)
function setStickyOffsets(){
  const m2 = document.getElementById('module2');
  const tabs = m2 ? m2.querySelector('.tabs') : null;
  if (m2 && tabs) m2.style.setProperty('--tabs-h', tabs.offsetHeight + 'px');
}

// ─── Boot ───
(async function () {
  window.addEventListener('load', setStickyOffsets);
  window.addEventListener('resize', setStickyOffsets);

  let stats;
  try {
    stats = await fetchJSON(STATS_FILE);
  } catch (e) {
    console.error('JSON load failed for stats:', e);
    return;
  }

  // Realized trades (chiuse)
  const trades = Array.isArray(stats.trades)
    ? stats.trades.slice().sort((a,b)=> new Date(a.exit_date) - new Date(b.exit_date))
    : [];

  // Open positions (MTM)
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

  // KPI (realized) — unico “P&L / Max DD” con ×
  const k = stats.portfolio_kpis || {};
  const totalPnl = k.total_pnl ?? trades.reduce((s,t)=>s+num(t.pnl),0);  // frazione (es. 1.2689 = 126.89%)
  const maxDDabs = Math.abs(k.max_drawdown ?? 0);                        // frazione positiva
  const ratioDD  = maxDDabs > 0 ? totalPnl / maxDDabs : null;            // numero puro

  const kpi = {
    period:         periodLabel || '—',
    totalTrades:    k.total_trades ?? trades.length,
    winRate:        (k.win_rate_pct ?? 0).toFixed(1) + '%',
    ratio_pnl_dd:   ratioDD,
    avgDuration:    (k.avg_duration_days ?? 0).toFixed(1) + ' d',
    openCount:      k.open_positions ?? openTrades.length
  };

  renderModule1(kpi);
  renderReportTabs(trades, openTrades);
  renderModule3(buildEquityCurve(stats, trades));

  // New Strategies Alert (prevUb/prevLb, σ=STD_MULT)
  try {
    const channels = await fetchJSON(CHANNELS_FILE);
    renderModule4(computeNewAlertsFrom(channels));
  } catch (e) {
    console.warn('Channels load failed:', e);
  }
})();

// ───────── Helpers
function buildEquityCurve(stats, trades){
  if (Array.isArray(stats.equity_curve) && stats.equity_curve.length) {
    return stats.equity_curve.map(p => ({ x: p.date, y: num(p.cumulative_pnl) }));
  }
  // fallback: ricostruzione dai trade chiusi
  let cum = 0;
  return trades.map(t => {
    cum += num(t.pnl);
    return { x: t.exit_date, y: cum };
  });
}

// ───────── Modulo 1 — KPI cards
function renderModule1(k) {
  const cont = document.getElementById('module1');
  if (!cont) return;
  cont.innerHTML = '';

  const ratioText = (k.ratio_pnl_dd == null || !isFinite(k.ratio_pnl_dd))
    ? '—'
    : k.ratio_pnl_dd.toFixed(2) + '×';

  const items = [
    { label: 'Period',         value: k.period },
    { label: '# Trades',       value: k.totalTrades },
    { label: 'Win Rate',       value: k.winRate },
    { label: 'P&L / Max DD',   value: ratioText },
    { label: 'Avg Duration',   value: k.avgDuration },
    { label: 'Open Positions', value: `${k.openCount}` },
  ];

  items.forEach(c => {
    const d = document.createElement('div');
    d.className = 'kpi-card';
    d.innerHTML = `<div class="kpi-value">${c.value}</div><div class="kpi-label">${c.label}</div>`;
    cont.appendChild(d);
  });
}

// ───────── Modulo 2 — Tabs (Closed / Open) + sticky offset
function renderReportTabs(trades, openTrades){
  const m2   = document.getElementById('module2');
  const tabs = m2.querySelectorAll('#reportTabs .tab');
  const panes= {
    realized: document.getElementById('tab-realized'),
    open:     document.getElementById('tab-open')
  };

  // (re)calcolo offset sticky in base all’altezza dei tab
  const setOffset = () => setStickyOffsets();
  setOffset(); window.addEventListener('resize', setOffset);

  tabs.forEach(btn=>{
    btn.addEventListener('click', ()=>{
      tabs.forEach(b=>b.classList.remove('active'));
      btn.classList.add('active');
      const tab = btn.dataset.tab;
      panes.realized.classList.toggle('active', tab==='realized');
      panes.open.classList.toggle('active', tab==='open');
      setOffset();
    });
  });

  // CLOSED
  {
    const thead = panes.realized.querySelector('thead tr');
    const tbody = panes.realized.querySelector('tbody');
    thead.innerHTML = `
      <th>Ticker</th><th>Signal</th><th>Open Date</th><th>Close Date</th>
      <th>Open Price</th><th>Close Price</th><th>Target</th><th>Stop</th><th>Return</th><th>Exit</th>
    `;
    tbody.innerHTML = '';
    trades.forEach(t=>{
      const tr=document.createElement('tr');
      tr.innerHTML = `
        <td>${t.spread}</td><td>${t.type==='long'?'Long':'Short'}</td>
        <td>${t.entry_date}</td><td>${t.exit_date}</td>
        <td>${num(t.entry).toFixed(4)}</td><td>${num(t.exit).toFixed(4)}</td>
        <td>${num(t.take_profit).toFixed(4)}</td><td>${num(t.stop_loss).toFixed(4)}</td>
        <td>${fmtPct(num(t.pnl))}</td><td>${t.exit_reason || ''}</td>
      `;
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
      <th>Entry</th><th>Last</th><th>Target</th><th>Stop</th><th>Return (MTM)</th>
    `;
    tbody.innerHTML = '';
    openTrades.forEach(t=>{
      const tr=document.createElement('tr');
      tr.innerHTML = `
        <td>${t.spread}</td><td>${t.type==='long'?'Long':'Short'}</td>
        <td>${t.entry_date}</td><td>${num(t.days_open)}</td>
        <td>${num(t.entry).toFixed(4)}</td><td>${num(t.last).toFixed(4)}</td>
        <td>${num(t.take_profit).toFixed(4)}</td><td>${num(t.stop_loss).toFixed(4)}</td>
        <td>${fmtPct(num(t.mtm_return))}</td>
      `;
      tbody.appendChild(tr);
    });
    if (!openTrades.length){
      const tr = document.createElement('tr');
      tr.innerHTML = `<td colspan="9" style="text-align:center;opacity:.7">No open positions</td>`;
      tbody.appendChild(tr);
    }
  }
}

// ───────── Modulo 3 — Equity chart (indice)
function renderModule3(curve) {
  const el = document.getElementById('equityChart');
  if (!el) return;
  const ctx = el.getContext('2d');

  const labels = curve.map(p=>p.x);
  const dataIndex = curve.map(p => (1 + num(p.y)) * 100);

  const grad = ctx.createLinearGradient(0, 0, 0, el.height);
  grad.addColorStop(0, 'rgba(246,163,19,0.35)');
  grad.addColorStop(1, 'rgba(246,163,19,0.00)');

  new Chart(ctx,{
    type:'line',
    data:{
      labels,
      datasets:[{
        label: 'Portfolio Value (Index)',
        data: dataIndex,
        borderColor: '#F6A313',
        backgroundColor: grad,
        fill: true,
        pointRadius: 0,
        tension: 0.25,
        borderWidth: 2,
      }]
    },
    options:{
      maintainAspectRatio:false,
      layout:{padding:{bottom:12, left:8, right:8, top:8}},
      scales:{
        y:{ grid:{ color:'#2a2a2a' }, ticks:{ callback: v => Number(v).toLocaleString() } },
        x:{ grid:{ display:false },    ticks:{ maxRotation:0, autoSkip:true } }
      },
      plugins:{
        legend:{ display:true, position:'top', labels:{ color:'#ddd' } },
        tooltip:{ callbacks:{ label: ctx => `Index: ${Number(ctx.parsed.y).toLocaleString()}` } }
      }
    }
  });
}

// ───────── Modulo 4 — New Strategies Alert (prevUb/prevLb, σ=STD_MULT)
function computeNewAlertsFrom(channels){
  const out = [];
  if (!channels || typeof channels !== 'object') return out;

  for (const key of Object.keys(channels)){
    const rows = channels[key];
    if(!Array.isArray(rows) || rows.length < 2) continue;

    const last  = rows[rows.length-1];
    const prev  = rows[rows.length-2];

    // [date, price, lower1, lower2, upper1, upper2]
    const r_now   = num(last[1]),  l1 = num(last[2]),  u1 = num(last[4]);
    const r_prev  = num(prev[1]), pl1 = num(prev[2]), pu1 = num(prev[4]);

    const t_now   = (u1 + l1)/2;
    const s_now   = Math.abs(u1 - t_now);
    const t_prev  = (pu1 + pl1)/2;
    const s_prev  = Math.abs(pu1 - t_prev);

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
    tr.innerHTML = `
      <td>${a.spread}</td><td>${a.signal}</td>
      <td>${a.open}</td><td>${a.tp}</td><td>${a.sl}</td>
    `;
    tbody.appendChild(tr);
  });
}
