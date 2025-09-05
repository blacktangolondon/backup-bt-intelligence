// Dashboard glue (Chart.js required in HTML)

// ─── Chart.js defaults ───
Chart.defaults.font.family = 'Helvetica Neue, Arial, sans-serif';
Chart.defaults.font.size   = 12;
Chart.defaults.font.weight = 'normal';

// ─── File paths (relative to THIS html file) ───
const PATH_PREFIX   = '';  // '' = stessa cartella del file HTML
const STATS_FILE    = PATH_PREFIX + 'fx_long_short_stats.json';
const CHANNELS_FILE = PATH_PREFIX + 'fx_channels.json';
const STD_MULT      = 0.5;

// ─── Helpers ───
const fmtPct = v => (Number(v) * 100).toFixed(2) + '%';
const num    = v => Number.isFinite(Number(v)) ? Number(v) : 0;
const fetchJSON = async (url) => {
  const u = url + (url.includes('?') ? '&' : '?') + 'ts=' + Date.now();
  const r = await fetch(u, { cache: 'no-store' });
  console.log('Loaded', r.url, r.ok ? '' : `status=${r.status}`);
  if (!r.ok) throw new Error(`Failed to load ${u}: ${r.status}`);
  return r.json();
};

// 👉 offset per sticky: altezza dei tab (scritta come CSS var su #module2)
function setStickyOffsets(){
  const m2 = document.getElementById('module2');
  const tabs = m2 ? m2.querySelector('.tabs') : null;
  if (m2 && tabs) m2.style.setProperty('--tabs-h', tabs.offsetHeight + 'px');
}

// 👉 crea/sincronizza l'header sticky per una pane (id: "tab-realized" / "tab-open")
function ensureStickyHeader(paneId){
  const pane = document.getElementById(paneId);
  if (!pane) return;
  const wrap  = pane.querySelector('.table-wrapper');
  const table = wrap ? wrap.querySelector('table') : null;
  if (!table) return;

  let sticky = pane.querySelector('.sticky-head');
  if (!sticky) {
    sticky = document.createElement('div');
    sticky.className = 'sticky-head';
    sticky.innerHTML = `<table class="report-table"><thead>${table.querySelector('thead').innerHTML}</thead></table>`;
    pane.insertBefore(sticky, wrap);
  } else {
    sticky.querySelector('thead').innerHTML = table.querySelector('thead').innerHTML;
  }

  const sync = () => {
    const bodyTh = table.querySelectorAll('thead th');
    const headTh = sticky.querySelectorAll('thead th');
    if (!bodyTh.length || bodyTh.length !== headTh.length) return;
    const widths = Array.from(bodyTh).map(th => th.getBoundingClientRect().width);
    sticky.style.width = wrap.getBoundingClientRect().width + 'px';
    sticky.querySelector('table').style.tableLayout = 'fixed';
    table.style.tableLayout = 'fixed';
    widths.forEach((w,i) => {
      headTh[i].style.width = w + 'px';
      bodyTh[i].style.width = w + 'px';
    });
  };
  sync(); requestAnimationFrame(sync);
  window.addEventListener('resize', sync);
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

  // KPI (realized) + open count
  const k = stats.portfolio_kpis || {};
  const totalPnl = k.total_pnl ?? trades.reduce((s,t)=>s+num(t.pnl),0);  // frazione (es. 1.2689 = 126.89%)
  const maxDDabs = Math.abs(k.max_drawdown ?? 0);                        // frazione positiva
  const ratioDD  = maxDDabs > 0 ? totalPnl / maxDDabs : null;            // numero puro

  const kpi = {
    period:         periodLabel || '—',
    totalTrades:    k.total_trades ?? trades.length,
    winRate:        (k.win_rate_pct ?? 0).toFixed(1) + '%',
    // totalPnl & maxDrawdown NON più mostrati singolarmente
    ratio_pnl_dd:   ratioDD,                      // nuovo KPI
    avgDuration:    (k.avg_duration_days ?? 0).toFixed(1) + ' d',
    openCount:      k.open_positions ?? openTrades.length
  };

  // Render KPI
  renderModule1(kpi);

  // Modulo 2 (tabs + tabelle)
  cleanModule2Chrome();
  renderReportTabs(trades, openTrades);

  // offset sticky e header sticky per entrambe le tab
  setStickyOffsets();
  ensureStickyHeader('tab-realized');
  ensureStickyHeader('tab-open');

  // Equity (area chart stile “screenshot”)
  const curve = Array.isArray(stats.equity_curve) && stats.equity_curve.length
    ? stats.equity_curve.map(p => ({ x: p.date, y: num(p.cumulative_pnl) }))
    : (() => { let cum=0; return trades.map(t => { cum += num(t.pnl); return { x: t.exit_date, y: cum }; }); })();
  renderModule3(curve);

  // New Strategies Alert da channels (prevUb/prevLb)
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

  // valore formattato del nuovo KPI (es. 2.08× oppure —)
  const ratioText = (k.ratio_pnl_dd == null || !isFinite(k.ratio_pnl_dd))
    ? '—'
    : k.ratio_pnl_dd.toFixed(2) + '×';

  const items = [
    { label: 'Period',              value: k.period },
    { label: '# Trades',            value: k.totalTrades },
    { label: 'Win Rate',            value: k.winRate },
    { label: 'P&L / Max DD',        value: ratioText },            // <— nuovo KPI unico
    { label: 'Avg Duration',        value: k.avgDuration },
    { label: 'Open Positions',      value: `${k.openCount}` },
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
  const h2 = m2.querySelector(':scope > h2'); if (h2) h2.remove();
  if (!m2.querySelector('#reportTabs')) {
    m2.insertAdjacentHTML('afterbegin', `
      <div class="tabs" id="reportTabs">
        <button class="tab active" data-tab="realized">Closed Trades</button>
        <button class="tab" data-tab="open">Open Positions</button>
      </div>
      <div class="tabpanes">
        <div class="tabpane active" id="tab-realized">
          <div class="sticky-head"></div>
          <div class="table-wrapper">
            <table class="report-table">
              <thead><tr></tr></thead>
              <tbody></tbody>
            </table>
          </div>
        </div>
        <div class="tabpane" id="tab-open">
          <div class="sticky-head"></div>
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
      setStickyOffsets();
      ensureStickyHeader(tab === 'realized' ? 'tab-realized' : 'tab-open');
    });
  });

  // CLOSED
  {
    const thead = panes.realized.querySelector('thead tr');
    const tbody = panes.realized.querySelector('tbody');
    thead.innerHTML = `
      <th>FX Pairs</th><th>Signal</th><th>Open Date</th><th>Close Date</th>
      <th>Open Price</th><th>Close Price</th><th>Take Profit</th><th>Stop Loss</th><th>Return</th><th>Exit</th>
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
      <th>FX Pairs</th><th>Signal</th><th>Open Date</th><th>Days Open</th>
      <th>Entry</th><th>Last</th><th>Take Profit</th><th>Stop Loss</th><th>Return (MTM)</th>
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

// ───────── Modulo 3 — Equity chart (stile “screenshot”) ─────────
function renderModule3(curve) {
  const el = document.getElementById('equityChart');
  if (!el) return;
  const ctx = el.getContext('2d');

  const labels = curve.map(p=>p.x);

  // Converte cumulative_pnl in indice (100 = inizio)
  const base = 100;
  const dataIndex = curve.map(p => (1 + num(p.y)) * base);

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
        y:{
          grid:{ color:'#2a2a2a' },
          ticks:{ callback: v => Number(v).toLocaleString() }
        },
        x:{
          grid:{ display:false },
          ticks:{ maxRotation:0, autoSkip:true }
        }
      },
      plugins:{
        legend:{ display:true, position:'top', labels:{ color:'#ddd' } },
        tooltip:{ callbacks:{ label: ctx => `Index: ${Number(ctx.parsed.y).toLocaleString()}` } }
      }
    }
  });
}

// ───────── Modulo 4 — New Strategies Alert ─────────
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
