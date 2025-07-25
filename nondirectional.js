// ─── Global Chart.js font defaults ───
Chart.defaults.font.family = 'Helvetica Neue, Arial, sans-serif';
Chart.defaults.font.size   = 12;
Chart.defaults.font.weight = 'normal';

(async function() {
  // 1) Load stats & trades
  const resp   = await fetch('non_directional_stats.json');
  if (!resp.ok) {
    console.error('JSON load failed');
    return;
  }
  const stats  = await resp.json();
  const trades = stats.trades;

  // 2) Helper: per‑trade percent return
  function ret(t) {
    return t.type === 'long'
      ? (t.exit - t.entry) / t.entry
      : (t.entry - t.exit) / t.entry;
  }

  // 3) Build percent returns array
  const rets = trades.map(ret);

  // 4) Compute win rate %
  const winPct = (rets.filter(r => r > 0).length / rets.length) * 100;

  // 5) Compute median duration (in days)
  const durations = trades
    .map(t => {
      const ms = new Date(t.exit_date) - new Date(t.entry_date);
      return ms / (1000 * 60 * 60 * 24);
    })
    .sort((a, b) => a - b);
  const mid = Math.floor(durations.length / 2);
  const medDur = durations.length % 2 === 1
    ? durations[mid]
    : (durations[mid - 1] + durations[mid]) / 2;

  // 6) Compute Period string
  const entryDates = trades.map(t => new Date(t.entry_date));
  const exitDates  = trades.map(t => new Date(t.exit_date));
  const startDate = new Date(Math.min(...entryDates));
  const endDate   = new Date(Math.max(...exitDates));
  const fmt = d => d.toLocaleString('default', { month: 'short', year: 'numeric' });
  const period = `${fmt(startDate)} – ${fmt(endDate)}`;

  // 7) Compute max win, max loss, and max drawdown
  const maxWinPct  = Math.max(...rets) * 100;
  const maxLossPct = Math.min(...rets) * 100;

  // cumulative series for drawdown
  const cum = [];
  trades.forEach((t, i) => {
    const prev = i ? cum[i - 1] : 0;
    cum[i] = (1 + prev) * (1 + ret(t)) - 1;
  });
  let peak = 0;
  let mdd  = 0;
  cum.forEach(v => {
    peak = Math.max(peak, v);
    mdd  = Math.max(mdd, peak - v);
  });
  const maxDrawdownPct = mdd * 100;

  // 8) Render Module 1 with new KPIs
  renderModule1({
    period,
    winPct,
    medDur,
    maxWinPct,
    maxLossPct,
    maxDrawdownPct
  });

  // 9) Render Module 2 (Historical Trades)
  renderModule2(trades);

  // 10) Render Module 3 (Equity Curve)
  renderModule3(cum);

  // 11) Render Module 4 (New Strategies Alert)
  renderModule4();
})();

// ——— UI renderers below ———

function renderModule1({ period, winPct, medDur, maxWinPct, maxLossPct, maxDrawdownPct }) {
  const cont = document.getElementById('module1');
  cont.innerHTML = '';
  [
    { label: 'Period',           value: period },
    { label: 'Win %',            value: winPct.toFixed(1) + '%' },
    { label: 'Median Duration',  value: medDur.toFixed(0) + ' days' },
    { label: 'Max Win',          value: maxWinPct.toFixed(1) + '%' },
    { label: 'Max Loss',         value: maxLossPct.toFixed(1) + '%' },
    { label: 'Max Drawdown',     value: maxDrawdownPct.toFixed(1) + '%' }
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

function renderModule2(trades) {
  const tbody = document.querySelector('#module2 tbody');
  tbody.innerHTML = '';
  trades
    .slice()
    .sort((a, b) => new Date(a.exit_date) - new Date(b.exit_date))
    .forEach(t => {
      const retPct = ((t.exit - t.entry) / t.entry * 100).toFixed(2) + '%';
      const tr = document.createElement('tr');
      tr.innerHTML = `
        <td>${t.exit_date}</td>
        <td>${t.spread}</td>
        <td>${t.entry.toFixed(4)}</td>
        <td>${t.exit.toFixed(4)}</td>
        <td>${retPct}</td>
      `;
      tbody.appendChild(tr);
    });
}

function renderModule3(cum) {
  new Chart(
    document.getElementById('equityChart').getContext('2d'),
    {
      type: 'line',
      data: {
        labels: cum.map((_, i) => i + 1),
        datasets: [{
          label: 'Cumulative Return',
          data: cum.map(v => v * 100),
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
            ticks: {
              callback: v => v.toFixed(1) + '%'
            }
          },
          x: { display: false }
        },
        plugins: {
          legend: { display: false }
        }
      }
    }
  );
}

async function renderModule4() {
  try {
    const resp = await fetch('spreads.json');
    if (!resp.ok) throw new Error('spreads.json load failed');
    const data = await resp.json();

    const alerts = Object.entries(data)
      .map(([spread, series]) => {
        const [ , price, , lower2, , upper2 ] = series[series.length - 1];
        if (price < lower2 || price > upper2) {
          return {
            spread,
            price,
            lower2,
            upper2,
            signal: price < lower2 ? 'Long' : 'Short'
          };
        }
      })
      .filter(Boolean);

    const tbody = document.querySelector('#module4 tbody');
    tbody.innerHTML = '';
    alerts.forEach(a => {
      const tr = document.createElement('tr');
      tr.innerHTML = `
        <td>${a.spread}</td>
        <td>${a.price.toFixed(4)}</td>
        <td>${a.lower2.toFixed(4)}</td>
        <td>${a.upper2.toFixed(4)}</td>
        <td>${a.signal}</td>
      `;
      tbody.appendChild(tr);
    });
  } catch (err) {
    console.error(err);
  }
}
