// ─── Global Chart.js font defaults ───
Chart.defaults.font.family = 'Helvetica Neue, Arial, sans-serif';
Chart.defaults.font.size   = 12;
Chart.defaults.font.weight = 'normal';

// ——— Helper at top‑level so every renderModule can use it ———
function ret(t) {
  return t.pnl;
}

(async function() {
  // 1) Load stats & trades
  const resp   = await fetch('non_directional_stats.json');
  if (!resp.ok) {
    console.error('JSON load failed');
    return;
  }
  const stats  = await resp.json();
  const trades = stats.trades;

  // 2) Build percent‐return array (already fractions, so *100 later)
  const rets = trades.map(ret);

  // 3) Compute durations (in days)
  const durations = trades
    .map(t => (new Date(t.exit_date) - new Date(t.entry_date)) / (1000 * 60 * 60 * 24))
    .sort((a, b) => a - b);

  // 4) Compute period string
  const entryDates = trades.map(t => new Date(t.entry_date));
  const exitDates  = trades.map(t => new Date(t.exit_date));
  const startDate  = new Date(Math.min(...entryDates));
  const endDate    = new Date(Math.max(...exitDates));
  const fmt = d => d.toLocaleString('default', { month: 'short', year: 'numeric' });
  const period = `${fmt(startDate)} – ${fmt(endDate)}`;

  // 5) Compute metrics
  const numTrades   = trades.length;
  const mid         = Math.floor(durations.length / 2);
  const medDur      = durations.length % 2 === 1
    ? durations[mid]
    : (durations[mid - 1] + durations[mid]) / 2;
  const quickestDur = Math.min(...durations);

  // pull max‑drawdown from stats
  const maxDrawdown = stats.portfolio_kpis.max_drawdown * 100;

  // compute Sortino
  const avgRet     = rets.reduce((sum, r) => sum + r, 0) / rets.length;
  const downsideRs = rets.filter(r => r < 0);
  const downsideSD = downsideRs.length
    ? Math.sqrt(downsideRs.reduce((sum, r) => sum + r*r, 0) / downsideRs.length)
    : 0;
  const sortino    = downsideSD > 0 ? avgRet / downsideSD : 0;

  // 6) Render everything
  renderModule1({ period, numTrades, medDur, quickestDur, maxDrawdown, sortino });
  renderModule2(trades);
  renderModule3(rets);
  renderModule4();   // back to spreads.json
})();

// ——— Module 1 — Portfolio KPI Cards —–––
function renderModule1({ period, numTrades, medDur, quickestDur, maxDrawdown, sortino }) {
  const cont = document.getElementById('module1');
  cont.innerHTML = '';
  [
    { label: 'Period',           value: period },
    { label: '# Trades',         value: numTrades },
    { label: 'Median Duration',  value: medDur.toFixed(0)    + ' days' },
    { label: 'Quickest Trade',   value: quickestDur.toFixed(0) + ' days' },
    { label: 'Max Drawdown',     value: maxDrawdown.toFixed(1) + '%' },
    { label: 'Sortino Ratio',    value: sortino.toFixed(2)     }
  ].forEach(c => {
    const d = document.createElement('div');
    d.className = 'kpi-card';
    d.innerHTML = `
      <div class="kpi-value">${c.value}</div>
      <div class="kpi-label">${c.label}</div>
    `;
    cont.appendChild(d);
  });
}

// —––– Module 2 — Historical Report
function renderModule2(trades) {
  const tbody = document.querySelector('#module2 tbody');
  tbody.innerHTML = '';

  // rebuild header
  const thead = document.querySelector('#module2 thead tr');
  thead.innerHTML = `
    <th>Spread</th>
    <th>Signal</th>
    <th>Open Date</th>
    <th>Close Date</th>
    <th>Open Price</th>
    <th>Close Price</th>
    <th>Take Profit</th>
    <th>Stop Loss</th>
    <th>P&L</th>
  `;

  trades
    .slice()
    .sort((a, b) => new Date(a.exit_date) - new Date(b.exit_date))
    .forEach(t => {
      const pnlPct = (t.pnl * 100).toFixed(2) + '%';
      const tr = document.createElement('tr');
      tr.innerHTML = `
        <td>${t.spread}</td>
        <td>${t.type === 'long' ? 'Long' : 'Short'}</td>
        <td>${t.entry_date}</td>
        <td>${t.exit_date}</td>
        <td>${t.entry.toFixed(4)}</td>
        <td>${t.exit.toFixed(4)}</td>
        <td>${t.take_profit.toFixed(4)}</td>
        <td>${t.stop_loss.toFixed(4)}</td>
        <td>${pnlPct}</td>
      `;
      tbody.appendChild(tr);
    });
}

// —––– Module 3 — Arithmetic Equity Curve
function renderModule3(rets) {
  const cum = [];
  let sum   = 0;
  rets.forEach(r => {
    sum += r;
    cum.push(sum * 100);
  });

  new Chart(
    document.getElementById('equityChart').getContext('2d'),
    {
      type: 'line',
      data: {
        labels: cum.map((_, i) => i + 1),
        datasets: [{
          label: 'Cumulative Return',
          data: cum,
          borderColor: '#FFA500',
          fill: false
        }]
      },
      options: {
        maintainAspectRatio: false,
        layout: { padding: { bottom: 20 } },
        scales: {
          y: {
            beginAtZero: true,
            min: 0,
            title: {
              display: true,
              text: 'Cumulative Return (%)',
              font: { size: 14 }
            },
            ticks: { callback: v => v.toFixed(1) + '%' }
          },
          x: { display: false }
        },
        plugins: { legend: { display: false } }
      }
    }
  );
}

// —––– Module 4 — New Strategies Alert (live open_trades.json) —–––
async function renderModule4() {
  try {
    // 1) fetch the array of open‑trade objects
    const resp = await fetch('open_trades.json');
    const trades = await resp.json();

    // 2) render each one directly
    const tbody = document.querySelector('#module4 tbody');
    tbody.innerHTML = '';
    trades.forEach(t => {
      const tr = document.createElement('tr');
      tr.innerHTML = `
        <td>${t.spread}</td>
        <td>${t.signal}</td>
        <td>${t.entry.toFixed(4)}</td>
        <td>${t.take_profit.toFixed(4)}</td>
        <td>${t.stop_loss.toFixed(4)}</td>
      `;
      tbody.appendChild(tr);
    });
  } catch(err) {
    console.error('Module 4 render error:', err);
  }
}
