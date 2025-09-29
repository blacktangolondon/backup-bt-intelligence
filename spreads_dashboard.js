// Simple dashboard loader (Chart.js required)

const STATS_FILE = 'spreads_stats.json';

const fmtPct = v => (Number(v) * 100).toFixed(2) + '%';
const fmtNum = v => Number(v).toFixed(4);
const num    = v => Number.isFinite(Number(v)) ? Number(v) : 0;

async function fetchJSON(url){
  const u = url + (url.includes('?') ? '&' : '?') + 'ts=' + Date.now();
  const r = await fetch(u, { cache: 'no-store' });
  if(!r.ok) throw new Error(`Failed to load ${u}: ${r.status}`);
  return r.json();
}

function setKPI(k){
  const root = document.getElementById('kpi');
  if(!root) return;
  root.innerHTML = '';
  const items = [
    ['Period', k.period || '—'],
    ['# Trades', k.total_trades ?? '—'],
    ['Win Rate', (k.win_rate_pct ?? 0).toFixed(1) + '%'],
    ['P&L Total', fmtPct(k.total_pnl ?? 0)],
    ['Max DD', fmtPct(k.max_drawdown ?? 0)],
    ['Open', k.open_positions ?? 0],
  ];
  items.forEach(([label, value])=>{
    const d = document.createElement('div');
    d.className = 'box';
    d.innerHTML = `<div class="label">${label}</div><div class="value">${value}</div>`;
    root.appendChild(d);
  });
}

function setPeriod(p){
  const el = document.getElementById('period');
  if(!el) return;
  if(p && p.start && p.end) el.textContent = `${p.start} → ${p.end}`;
  else el.textContent = '';
}

function renderTrades(trades){
  const tb = document.getElementById('trades');
  tb.innerHTML = '';
  trades.slice().sort((a,b)=> new Date(a.exit_date) - new Date(b.exit_date))
    .forEach(t=>{
      const tr = document.createElement('tr');
      tr.innerHTML = `
        <td>${t.exit_date}</td>
        <td>${t.spread}</td>
        <td>${t.type}</td>
        <td>${fmtNum(t.entry)}</td>
        <td>${fmtNum(t.exit)}</td>
        <td>${t.days}</td>
        <td>${t.reason}</td>
        <td>${fmtPct(t.pnl)}</td>`;
      tb.appendChild(tr);
    });
}

function renderOpen(open){
  const tb = document.getElementById('open');
  tb.innerHTML = '';
  open.slice().sort((a,b)=> new Date(a.entry_date) - new Date(b.entry_date))
    .forEach(t=>{
      const tr = document.createElement('tr');
      tr.innerHTML = `
        <td>${t.entry_date}</td>
        <td>${t.spread}</td>
        <td>${t.type}</td>
        <td>${t.mtm_date}</td>
        <td>${fmtNum(t.mtm_price)}</td>
        <td>${t.days}</td>
        <td>${fmtPct(t.mtm)}</td>`;
      tb.appendChild(tr);
    });
}

function renderBySpread(rows){
  const tb = document.getElementById('byspread');
  tb.innerHTML = '';
  rows.slice().forEach(r=>{
    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td>${r.spread}</td>
      <td>${r.count}</td>
      <td>${fmtPct(r.avg_pnl)}</td>
      <td>${fmtPct(r.max_win)}</td>
      <td>${fmtPct(r.max_loss)}</td>`;
    tb.appendChild(tr);
  });
}

function renderEquity(curve){
  const ctx = document.getElementById('equityChart').getContext('2d');
  const data = (Array.isArray(curve) ? curve : []).map(p=>({ x: p.date, y: num(p.cumulative_pnl) }));
  new Chart(ctx, {
    type: 'line',
    data: {
      datasets: [{
        label: 'Portfolio Value (cum P&L)',
        parsing: { xAxisKey: 'x', yAxisKey: 'y' },
        data: data,
        fill: false,
        tension: 0.15
      }]
    },
    options: {
      responsive: true,
      plugins: { legend: { display: false } },
      scales: {
        x: { type: 'time', time: { unit: 'month' } },
        y: { ticks: { callback: v => (v*100).toFixed(1)+'%' } }
      }
    }
  });
}

(async function(){
  let stats;
  try { stats = await fetchJSON(STATS_FILE); }
  catch(e){ console.error(e); return; }

  const k = stats.portfolio_kpis || {};
  setKPI({
    period: k.period,
    total_trades: k.total_trades,
    win_rate_pct: k.win_rate_pct,
    total_pnl: k.total_pnl,
    max_drawdown: k.max_drawdown,
    open_positions: k.open_positions
  });
  setPeriod(k.period);
  renderTrades(stats.trades || []);
  renderOpen(stats.open_trades || []);
  renderBySpread(stats.by_spread || []);
  renderEquity(stats.equity_curve || []);
})();
