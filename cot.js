// cot.js

// ─── Global Chart.js font defaults ───
Chart.defaults.font.family = 'Helvetica Neue, Arial, sans-serif';
Chart.defaults.font.size   = 12;
Chart.defaults.font.weight = 'normal';

// ——— Position-sizing & fees settings ———
const ACCOUNT_SIZE   = 20000;   // your Saxo account equity in $
const RISK_PCT       = 0.02;    // risk per trade (2%)
const COMMISSION_PCT = 0.004;   // commission (0.4%)

// ——— Helper at top-level so every renderModule can use it ———
function ret(t) {
  // for Module 3: return the fractional return, matching Excel col M
  return t.returnPct;
}

(async function() {
  // 1) Load stats & trades
  const resp   = await fetch('cot_backtest_stats.json');
  if (!resp.ok) {
    console.error('JSON load failed');
    return;
  }
  const stats  = await resp.json();
  const trades = stats.trades;

  // 1a) Compute net P&L and return% for each trade (Excel cols J, M)
  const riskAmt = ACCOUNT_SIZE * RISK_PCT;

  trades.forEach(t => {
    // ✅ FIX #1: sizing basato sulla distanza dallo STOP, non dal take profit
    const dist     = Math.abs(t.entry - t.stop_loss);
    const shares   = dist > 0 ? (riskAmt / dist) : 0;   // pezzi
    const notional = shares * t.entry;                  // valore monetario
    const commission = notional * COMMISSION_PCT;       // ok se 0.004 è già round-trip

    const grossPnl = (t.type === 'long'
      ? (t.exit - t.entry) * shares
      : (t.entry - t.exit) * shares);

    const netPnl = grossPnl - commission;
    t.returnPct  = netPnl / ACCOUNT_SIZE;
  });

  // 1b) Build percent-return array (fractions) for Module 3
  const rets = trades.map(ret);

  // 2) Compute durations (in days) – unchanged
  const durations = trades
    .map(t => (new Date(t.exit_date) - new Date(t.entry_date)) / (1000 * 60 * 60 * 24))
    .sort((a, b) => a - b);

  // 3) Compute period string – unchanged
  const entryDates = trades.map(t => new Date(t.entry_date));
  const exitDates  = trades.map(t => new Date(t.exit_date));
  const startDate  = new Date(Math.min(...entryDates));
  const endDate    = new Date(Math.max(...exitDates));
  const fmt = d => d.toLocaleString('default', { month: 'short', year: 'numeric' });
  const period = `${fmt(startDate)} – ${fmt(endDate)}`;

  // 4) Compute metrics – unchanged
  const numTrades   = trades.length;
  const mid         = Math.floor(durations.length / 2);
  const medDur      = durations.length % 2 === 1
    ? durations[mid]
    : (durations[mid - 1] + durations[mid]) / 2;
  const quickestDur = Math.min(...durations);
  const maxDrawdown = stats.portfolio_kpis.max_drawdown * 100;
  const avgRet      = rets.reduce((sum, r) => sum + r, 0) / rets.length;
  const downsideRs  = rets.filter(r => r < 0);
  const downsideSD  = downsideRs.length
    ? Math.sqrt(downsideRs.reduce((sum, r) => sum + r*r, 0) / downsideRs.length)
    : 0;
  const sortino     = downsideSD > 0 ? avgRet / downsideSD : 0;

  // 5) Render everything
  renderModule1({ period, numTrades, medDur, quickestDur, maxDrawdown, sortino });
  renderModule2(trades);
  renderModule3(rets);
  renderModule4();
})();

// —––– Module 1 — Portfolio KPI Cards —–––
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

// —––– Module 2 — Historical Report
function renderModule2(trades) {
  const tbody = document.querySelector('#module2 tbody');
  tbody.innerHTML = '';

  // rebuild header
  const thead = document.querySelector('#module2 thead tr');
  // ✅ FIX #2: intestazione "Market" e uso di t.market
  thead.innerHTML = `
    <th>Market</th>
    <th>Signal</th>
    <th>Open Date</th>
    <th>Close Date</th>
    <th>Open Price</th>
    <th>Close Price</th>
    <th>Take Profit</th>
    <th>Stop Loss</th>
    <th>Return</th>
  `;

  trades
    .slice()
    .sort((a, b) => new Date(a.exit_date) - new Date(b.exit_date))
    .forEach(t => {
      const retPct = (t.returnPct * 100).toFixed(2) + '%';
      const tr = document.createElement('tr');
      tr.innerHTML = `
        <td>${t.market}</td>
        <td>${t.type === 'long' ? 'Long' : 'Short'}</td>
        <td>${t.entry_date}</td>
        <td>${t.exit_date}</td>
        <td>${t.entry.toFixed(4)}</td>
        <td>${t.exit.toFixed(4)}</td>
        <td>${t.take_profit.toFixed(4)}</td>
        <td>${t.stop_loss.toFixed(4)}</td>
        <td>${retPct}</td>
      `;
      tbody.appendChild(tr);
    });
}

// —––– Module 3 — Arithmetic Equity Curve
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

// —––– Module 4 — New Strategies Alert —–––
async function renderModule4() {
  try {
    const resp = await fetch('eq_channels.json');
    const data = await resp.json();

    const alerts = Object.entries(data)
      .filter(([_, series]) => Array.isArray(series) && series.length >= 2)
      .map(([spread, series]) => {
        const prev = series[series.length - 2];
        const last = series[series.length - 1];

        // [date, ratio, lower1, lower2, upper1, upper2]
        const [, prevPrice, , prevLower2, , prevUpper2] = prev;
        const [, price,     , lower2,     , upper2]     = last;

        const justBrokeLong  = (price <  lower2) && (prevPrice >= prevLower2);
        const justBrokeShort = (price >  upper2) && (prevPrice <= prevUpper2);
        if (!(justBrokeLong || justBrokeShort)) return;

        const signal = justBrokeLong ? 'Long' : 'Short';
        const mid    = (lower2 + upper2) / 2;     // == trend
        const half   = Math.abs(price - mid);     // distanza simmetrica

        return {
          spread,
          signal,
          entry:      price,
          takeProfit: mid,
          stopLoss:   signal === 'Long' ? price - half : price + half
        };
      })
      .filter(Boolean);

    const tbody = document.querySelector('#module4 tbody');
    tbody.innerHTML = '';
    alerts.forEach(a => {
      const tr = document.createElement('tr');
      tr.innerHTML = `
        <td>${a.spread}</td>
        <td>${a.signal}</td>
        <td>${a.entry.toFixed(4)}</td>
        <td>${a.takeProfit.toFixed(4)}</td>
        <td>${a.stopLoss.toFixed(4)}</td>
      `;
      tbody.appendChild(tr);
    });
  } catch (err) {
    console.error('Module 4 render error:', err);
  }
}
