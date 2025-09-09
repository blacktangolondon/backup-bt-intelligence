// Dashboard glue (Chart.js required in HTML)

Chart.defaults.font.family = 'Helvetica Neue, Arial, sans-serif';
Chart.defaults.font.size   = 12;
Chart.defaults.font.weight = 'normal';

const STATS_FILE    = 'equities_long_short_stats.json';
const CHANNELS_FILE = 'eq_channels.json';
const STD_MULT      = 2.0;
const ANGLE_MAX_DEG = 0.08; // filtro angolo (default)
const ANGLE_WINDOW  = 50;   // barre per calcolo angolo

const fmtPct = v => (Number(v) * 100).toFixed(2) + '%';
const num    = v => Number.isFinite(Number(v)) ? Number(v) : 0;
const fetchJSON = async (url) => {
  const u = url + (url.includes('?') ? '&' : '?') + 'ts=' + Date.now();
  const r = await fetch(u, { cache: 'no-store' });
  if (!r.ok) throw new Error(`Failed to load ${u}: ${r.status}`);
  return r.json();
};

(async () => {
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
    const channels = await fetchJSON(CHANNELS_FILE);
    renderModule4(computeNewAlertsFrom(channels));
  } catch (e) { console.warn('Channels load failed:', e); }
})();

// ───────── Module 1
function renderModule1(k) {
  const cont = document.getElementById('module1');
  if (!cont) return;
  cont.innerHTML = '';

  const html = `
    <div class="kpi-grid">
      <div class="kpi"><div class="lbl">Period</div><div class="val">${k.period}</div></div>
      <div class="kpi"><div class="lbl">Total Trades</div><div class="val">${k.totalTrades}</div></div>
      <div class="kpi"><div class="lbl">Win Rate</div><div class="val">${k.winRate}</div></div>
      <div class="kpi"><div class="lbl">P&L / Max DD</div><div class="val">${k.pnlOverDD}</div></div>
      <div class="kpi"><div class="lbl">Avg Duration</div><div class="val">${k.avgDuration}</div></div>
      <div class="kpi"><div class="lbl">Open</div><div class="val">${k.openCount}</div></div>
    </div>`;
  cont.insertAdjacentHTML('beforeend', html);
}

// ───────── Module 2
function renderReportTabs(trades, openTrades) {
  const panes = {
    realized: document.querySelector('#tab-realized'),
    open:     document.querySelector('#tab-open'),
  };
  if (!panes.realized || !panes.open) return;

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
      <th>Ticker</th><th>Signal</th><th>Open Date</th>
      <th>Open Price</th><th>Target</th><th>Stop</th><th>MTM</th>`;
    tbody.innerHTML = '';
    openTrades.forEach(t=>{
      const tr=document.createElement('tr');
      tr.innerHTML = `
        <td>${t.spread}</td><td>${t.type==='long'?'Long':'Short'}</td>
        <td>${t.entry_date}</td>
        <td>${num(t.entry).toFixed(4)}</td><td>${num(t.take_profit).toFixed(4)}</td>
        <td>${num(t.stop_loss).toFixed(4)}</td><td>${fmtPct(num(t.pnl))}</td>`;
      tbody.appendChild(tr);
    });
    if (!openTrades.length){
      const tr = document.createElement('tr');
      tr.innerHTML = `<td colspan="7" style="text-align:center;opacity:.7">No open positions</td>`;
      tbody.appendChild(tr);
    }
  }
}

// ───────── Module 3 (Portfolio Value Index)
function renderModule3_asIndex(points){
  const cont = document.getElementById('module3');
  if(!cont) return;
  cont.innerHTML = '';
  const canvas = document.createElement('canvas');
  canvas.height = 220;
  cont.appendChild(canvas);
  const ctx = canvas.getContext('2d');

  const labels = points.map(p=>p.x);
  const base = points.length ? points[0].y : 0;
  const dataIdx = points.map(p=> base ? 100 * (p.y / base) : 100);

  const grad = ctx.createLinearGradient(0,0,0,220);
  grad.addColorStop(0, 'rgba(246,163,19,0.25)');
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

// Angle helper: compute angle (deg) of trendline over last ANGLE_WINDOW bars
function angleDegFromRows(rows, window){
  if (!Array.isArray(rows) || rows.length < window) return null;
  const n = window, start = rows.length - n;
  const ys = [];
  for (let i=0;i<n;i++){
    const row = rows[start+i];
    const l1 = num(row[2]), u1 = num(row[4]);
    const t  = (u1 + l1) / 2;
    ys.push(t);
  }
  const meanX = (n - 1) / 2;
  let meanY = 0; for (const y of ys) meanY += y; meanY /= n;
  let nume = 0, deno = 0;
  for (let i=0;i<n;i++){
    const dx = i - meanX;
    nume += dx * (ys[i] - meanY);
    deno += dx * dx;
  }
  const slope = deno ? (nume / deno) : 0; // per-bar
  const rel   = meanY !== 0 ? (slope / meanY) : 0;
  const angRad= Math.atan(rel);
  return angRad * 180 / Math.PI;
}

// ───────── Module 4
function computeNewAlertsFrom(channels){
  const out = [];
  if (!channels || typeof channels !== 'object') return out;
  for (const key of Object.keys(channels)){
    const rows = channels[key];
    if(!Array.isArray(rows) || rows.length < 2) continue;

    // Filtro angolo (0.08° default, finestra 50)
    const ang = angleDegFromRows(rows, ANGLE_WINDOW);
    if (ang === null || Math.abs(ang) > ANGLE_MAX_DEG) continue;

    const last = rows[rows.length-1], prev = rows[rows.length-2];
    const r_now = num(last[1]), l1 = num(last[2]), u1 = num(last[4]);
    const r_prev= num(prev[1]), pl1= num(prev[2]), pu1= num(prev[4]);
    const t_now = (u1 + l1)/2,  s_now = Math.abs(u1 - t_now);
    const t_prev= (pu1 + pl1)/2, s_prev= Math.abs(pu1 - t_prev);
    const ub = t_now + s_now*STD_MULT, lb = t_now - s_now*STD_MULT;
    const prevUb = t_prev + s_prev*STD_MULT, prevLb = t_prev - s_prev*STD_MULT;

    if (r_now > ub && r_prev <= prevUb)
      out.push({spread:key, signal:'Short', open:r_now.toFixed(4), tp:t_now.toFixed(4), sl:(r_now + Math.abs(r_now - t_now)).toFixed(4)});
    else if (r_now < lb && r_prev >= prevLb)
      out.push({spread:key, signal:'Long',  open:r_now.toFixed(4), tp:t_now.toFixed(4), sl:(r_now - Math.abs(t_now - r_now)).toFixed(4)});
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
