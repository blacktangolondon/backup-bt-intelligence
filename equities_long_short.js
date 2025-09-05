// Dashboard glue (Chart.js required in HTML)

// ─── Chart.js defaults ───
Chart.defaults.font.family = 'Helvetica Neue, Arial, sans-serif';
Chart.defaults.font.size   = 12;
Chart.defaults.font.weight = 'normal';

// ─── File paths (relative to THIS html file) ───
const STATS_FILE    = 'equities_long_short_stats.json';
const CHANNELS_FILE = 'eq_channels.json';

// Per coerenza con EQUITY (ingressi su ±2σ di default)
const STD_MULT      = 2.0;

// ─── Helpers ───
const fmtPct = v => (Number(v) * 100).toFixed(2) + '%';
const num    = v => Number.isFinite(Number(v)) ? Number(v) : 0;
const fetchJSON = async (url) => {
  const u = url + (url.includes('?') ? '&' : '?') + 'ts=' + Date.now();
  const r = await fetch(u, { cache: 'no-store' });
  if (!r.ok) throw new Error(`Failed to load ${u}: ${r.status}`);
  return r.json();
};

// ─── Boot ───
(async function () {
  let stats;
  try { stats = await fetchJSON(STATS_FILE); }
  catch (e) { console.error('JSON load failed for stats:', e); return; }

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

  // KPI (realized)  — Niente MTM qui. Unifico P&L/DD come da FX.
  const k = stats.portfolio_kpis || {};
  const totalPnl = num(k.total_pnl);
  const maxDD    = Math.max(0, num(k.max_drawdown));
  const pnlOverDD= (maxDD > 0) ? (totalPnl / maxDD) : NaN;

  const kpi = {
    period:         periodLabel || '—',
    totalTrades:    k.total_trades ?? trades.length,
    winRate:        (k.win_rate_pct ?? 0).toFixed(1) + '%',
    pnlOverDD:      Number.isFinite(pnlOverDD) ? pnlOverDD.toFixed(2) : '—',
    avgDuration:    (k.avg_duration_days ?? 0).toFixed(1) + ' d',
    openCount:      k.open_positions ?? openTrades.length
  };

  // Render KPI
  renderModule1(kpi);

  // Pulizia modulo 2 (niente titolo) + struttura tab + wrapper scrollabile & sticky
  cleanModule2Chrome();

  // Tab Closed / Open
  renderReportTabs(trades, openTrades);

  // Equity (Portfolio Value Index, base=100)
  const curve = Array.isArray(stats.equity_curve) && stats.equity_curve.length
    ? stats.equity_curve.map(p => ({ x: p.date, y: num(p.cumulative_pnl) }))
    : (() => { let cum=0; return trades.map(t => { cum += num(t.pnl); return { x: t.exit_date, y: cum }; }); })();

  renderModule3_asIndex(curve);

  // New Strategies Alert (prevUb/prevLb)
  try {
    const channels = await fetchJSON(CHANNELS_FILE);
    const alerts = computeNewAlertsFrom(channels);
    renderModule4(alerts);
  } catch (e) {
    console.warn('Channels load failed:', e);
  }
})();

// ───────── Modulo 1 — KPI cards ─────────
function renderModule1(k) {
  const cont = document.getElementById('module1');
  if (!cont) return;
  cont.innerHTML = '';
  const items = [
    { label: 'Period',        value: k.period },
    { label: '# Trades',      value: k.totalTrades },
    { label: 'Win Rate',      value: k.winRate },
    { label: 'P&L / Max DD',  value: k.pnlOverDD },
    { label: 'Avg Duration',  value: k.avgDuration },
    { label: 'Open Positions',value: k.openCount }
  ];
  items.forEach(c => {
    const d = document.createElement('div');
    d.className = 'kpi-card';
    d.innerHTML = `<div class="kpi-value">${c.value}</div><div class="kpi-label">${c.label}</div>`;
    cont.appendChild(d);
  });
}

// ───────── Modulo 2 — Tabs (Closed / Open) ─────────
function cleanModule2Chrome() {
  const m2 = document.getElementById('module2');
  if (!m2) return;

  // se manca la struttura tab, creala
  if (!m2.querySelector('#reportTabs')) {
    m2.insertAdjacentHTML('afterbegin', `
      <div class="tabs" id="reportTabs">
        <button class="tab active" data-tab="realized">Closed Trades</button>
        <button class="tab" data-tab="open">Open Positions</button>
      </div>
      <div class="tabpanes">
        <div class="tabpane active" id="tab-realized">
          <div class="table-wrapper">
            <table class="report-table">
              <thead><tr></tr></thead>
              <tbody></tbody>
            </table>
          </div>
        </div>
        <div class="tabpane" id="tab-open">
          <div class="table-wrapper">
            <table class="report-table">
              <thead><tr></tr></thead>
              <tbody></tbody>
            </table>
          </div>
        </div>
      </div>
    `);
  }
}

function renderReportTabs(trades, openTrades){
  const tabs = document.querySelectorAll('#reportTabs .tab');
  const panes= {
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

// ───────── Modulo 3 — Portfolio Value Index ─────────
function renderModule3_asIndex(curve) {
  const el = document.getElementById('equityChart');
  if (!el) return;
  const ctx = el.getContext('2d');

  // trasformo cumulative pnl in indice base 100
  const labels = curve.map(p=>p.date);
  const base = 100;
  const data  = curve.map(p=>p.y);
  const minY  = Math.min(0, ...data);
  const idx   = data.map(v => base * (1 + v)); // 1+pnl cumulato

  new Chart(ctx,{
    type:'line',
    data:{ labels, datasets:[{ label:'Portfolio Value Index (base=100)', data: idx, borderWidth:1, fill:false }]},
    options:{
      maintainAspectRatio:false, layout:{padding:{bottom:16}},
      scales:{
        y:{ title:{display:true,text:'Index'}, ticks:{ callback:v => v.toFixed(0) } },
        x:{ ticks:{ maxRotation:0, autoSkip:true } }
      },
      plugins:{ legend:{display:false} }
    }
  });
}

// ───────── Modulo 4 — New Strategies Alert (prevUb/prevLb, σ=STD_MULT) ─────────
function computeNewAlertsFrom(channels){
  const out = [];
  if (!channels || typeof channels !== 'object') return out;

  for (const key of Object.keys(channels)){
    const rows = channels[key];
    if(!Array.isArray(rows) || rows.length < 2) continue;

    const last  = rows[rows.length-1];
    const prev  = rows[rows.length-2];

    // [date, ratio, lower1, lower2, upper1, upper2]
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
