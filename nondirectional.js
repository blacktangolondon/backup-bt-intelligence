// ─── Global Chart.js font defaults ───
Chart.defaults.font.family = 'Helvetica Neue, Arial, sans-serif';
Chart.defaults.font.size   = 12;
Chart.defaults.font.weight = 'normal';

// ——— Helper at top‑level so every renderModule can use it ———
function ret(t) {
  return t.type === 'long'
    ? (t.exit - t.entry) / t.entry
    : (t.entry - t.exit) / t.entry;
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

  // 2) Build percent‐return array
  const rets = trades.map(ret);

  // 3) Compute win rate %
  const winPct = (rets.filter(r => r > 0).length / rets.length) * 100;

  // 4) Compute median duration (in days)
  const durations = trades
    .map(t => (new Date(t.exit_date) - new Date(t.entry_date)) / (1000 * 60 * 60 * 24))
    .sort((a, b) => a - b);
  const mid = Math.floor(durations.length / 2);
  const medDur = durations.length % 2 === 1
    ? durations[mid]
    : (durations[mid - 1] + durations[mid]) / 2;

  // 5) Compute Period string
  const entryDates = trades.map(t => new Date(t.entry_date));
  const exitDates  = trades.map(t => new Date(t.exit_date));
  const startDate = new Date(Math.min(...entryDates));
  const endDate   = new Date(Math.max(...exitDates));
  const fmt = d => d.toLocaleString('default', { month: 'short', year: 'numeric' });
  const period = `${fmt(startDate)} – ${fmt(endDate)}`;

  // 6) Compute max win & loss
  const maxWinPct  = Math.max(...rets) * 100;
  const maxLossPct = Math.min(...rets) * 100;

  // 7) Geometric series for drawdown
  const geomCum = [];
  trades.forEach((t, i) => {
    const prev = i ? geomCum[i - 1] : 0;
    geomCum[i] = (1 + prev) * (1 + ret(t)) - 1;
  });
  let peak = 0, mdd = 0;
  geomCum.forEach(x => {
    peak = Math.max(peak, x);
    mdd  = Math.max(mdd, peak - x);
  });
  const maxDrawdownPct = mdd * 100;

  // 8) Render everything
  renderModule1({ period, winPct, medDur, maxWinPct, maxLossPct, maxDrawdownPct });
  renderModule2(trades);
  renderModule3(rets);
  renderModule4();
})();

// ——— Module 1 —–––
function renderModule1({ period, winPct, medDur, maxWinPct, maxLossPct, maxDrawdownPct }) {
  const cont = document.getElementById('module1');
  cont.innerHTML = '';
  [
    { label: 'Period',          value: period },
    { label: 'Win %',           value: winPct.toFixed(1) + '%' },
    { label: 'Median Duration', value: medDur.toFixed(0) + ' days' },
    { label: 'Max Win',         value: maxWinPct.toFixed(1) + '%' },
    { label: 'Max Loss',        value: maxLossPct.toFixed(1) + '%' },
    { label: 'Max Drawdown',    value: maxDrawdownPct.toFixed(1) + '%' }
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

  trades
    .slice()
    .sort((a, b) => new Date(a.exit_date) - new Date(b.exit_date))
    .forEach(t => {
      const movement = (ret(t) * 100).toFixed(2) + '%';
      const dir      = t.type === 'long' ? 'Long' : 'Short';

      const tr = document.createElement('tr');
      tr.innerHTML = `
        <td>${t.spread}</td>
        <td>${t.entry_date}</td>
        <td>${t.exit_date}</td>
        <td>${t.entry.toFixed(4)}</td>
        <td>${t.exit.toFixed(4)}</td>
        <td>${dir}</td>
        <td>${movement}</td>
      `;
      tbody.appendChild(tr);
    });
}

// —––– Module 3 — Arithmetic Equity Curve
function renderModule3(rets) {
  // build simple cumulative returns
  const cum = [];
  let sum = 0;
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

// —––– Module 4 — New Strategies Alert
async function renderModule4() {
  try {
    const resp = await fetch('spreads.json');
    if (!resp.ok) throw new Error('spreads.json load failed');
    const data = await resp.json();

    const alerts = Object.entries(data)
      .map(([spread, series]) => {
        const [ , price, , lower1, , upper1 ] = series[series.length - 1];
        if (price < lower1 || price > upper1) {
          return {
            spread,
            price,
            lower1,
            upper1,
            signal: price < lower1 ? 'Long' : 'Short'
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
        <td>${a.lower1.toFixed(4)}</td>
        <td>${a.upper1.toFixed(4)}</td>
        <td>${a.signal}</td>
      `;
      tbody.appendChild(tr);
    });
  } catch (err) {
    console.error(err);
  }
}
