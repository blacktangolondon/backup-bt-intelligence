// nondirectional-2sd.js

// ─── Config per la conversione in £ ───
const CONFIG = {
  accountGBP: 18000,    // capitale conto
  allocPerTrade: 1.0,   // quota di capitale allocata per trade (1.0 = 100%; 0.25 = 25%)
  // commissionGBP: 0,  // se vuoi, possiamo sottrarre costi fissi/variabili qui
};

// ─── Global Chart.js font defaults ───
Chart.defaults.font.family = 'Helvetica Neue, Arial, sans-serif';
Chart.defaults.font.size   = 12;
Chart.defaults.font.weight = 'normal';

// ——— Helper: t.pnl è il PnL assoluto in GBP ———
// (da non_directional_stats-2sd.json / trades[])
function pnl(t) { return t.pnl; }

(async function() {
  // 1) Load stats & trades (2σ backtest output)
  const resp   = await fetch('non_directional_stats-2sd.json');
  if (!resp.ok) {
    console.error('JSON load failed');
    return;
  }
  const stats  = await resp.json();
  const trades = stats.trades;

  // 2) Build PnL-in-GBP array (fractions in t.pnl → *100 later)
  const pnls = trades.map(pnl);

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

  // pull max-drawdown from stats
  const maxDrawdown = stats.portfolio_kpis.max_drawdown; // Value is already in GBP
  // Note: the original code expected a percentage. The new code should not multiply by 100.

  // compute Sortino
  const avgPnl     = pnls.reduce((sum, p) => sum + p, 0) / pnls.length;
  const downsidePnls = pnls.filter(p => p < 0);
  const downsideSD = downsidePnls.length
    ? Math.sqrt(downsidePnls.reduce((sum, p) => sum + p*p, 0) / downsidePnls.length)
    : 0;
  const sortino    = downsideSD > 0 ? avgPnl / downsideSD : 0;

  // 6) Render everything
  renderModule1({ period, numTrades, medDur, quickestDur, maxDrawdown, sortino });
  renderModule2(trades);
  renderModule3(pnls);
  renderModule4();   // 2σ alerts
})();

// ——— Module 1 — Portfolio KPI Cards —–––
function renderModule1({ period, numTrades, medDur, quickestDur, maxDrawdown, sortino }) {
  const cont = document.getElementById('module1');
  cont.innerHTML = '';
  [
    { label: 'Period',           value: period },
    { label: '# Trades',         value: numTrades },
    { label: 'Median Duration',  value: medDur.toFixed(0)    + ' days' },
    { label: 'Quickest Trade',   value: quickestDur.toFixed(0) + ' days' },
    { label: 'Max Drawdown',     value: '£' + maxDrawdown.toFixed(2) }, // Now correctly displayed in GBP
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

// —––– Module 2 — Historical Report —–––
// Colonna "Delta" = |(take_profit - entry) / entry| * 100
// P&L ora in £: t.pnl (valore assoluto in GBP)
function renderModule2(trades) {
  const tbody = document.querySelector('#module2 tbody');
  tbody.innerHTML = '';

  // rebuild header
  const thead = document.querySelector('#module2 thead tr');
  thead.innerHTML = `
    <th>Spread</th>
    <th>Signal</th>
    <th>Delta</th>
    <th>Open Date</th>
    <th>Close Date</th>
    <th>Open Price</th>
    <th>Close Price</th>
    <th>Take Profit</th>
    <th>Stop Loss</th>
    <th>P&L (£)</th>
  `;

  const money = (gbp) => '£' + gbp.toFixed(2);

  trades
    .slice()
    .sort((a, b) => new Date(a.entry_date) - new Date(b.entry_date))
    .forEach(t => {
      const deltaPct   = (Math.abs((t.take_profit - t.entry) / t.entry) * 100).toFixed(2) + '%';
      const pnlGBP     = t.pnl; // ← Corretto: usa il valore PnL assoluto fornito dal backtest

      const tr = document.createElement('tr');
      tr.innerHTML = `
        <td class="instrument-item" data-key="${t.spread}">${t.spread}</td>
        <td>${t.type === 'long' ? 'Long' : 'Short'}</td>
        <td>${deltaPct}</td>
        <td>${t.entry_date}</td>
        <td>${t.exit_date}</td>
        <td>${t.entry.toFixed(4)}</td>
        <td>${t.exit.toFixed(4)}</td>
        <td>${t.take_profit.toFixed(4)}</td>
        <td>${t.stop_loss.toFixed(4)}</td>
        <td>${money(pnlGBP)}</td>
      `;
      tbody.appendChild(tr);
    });
}

// —––– Module 3 — Arithmetic Equity Curve —–––
function renderModule3(pnls) {
  // Calcola il capitale iniziale del portafoglio in GBP
  // Il backtest usa TOTAL_PORTFOLIO_CAPITAL_USD = 18000 e GBP_USD_EXCHANGE_RATE = 1.27
  const initialCapitalUSD = 18000;
  const exchangeRate = 1.27;
  const initialCapitalGBP = initialCapitalUSD / exchangeRate;
  
  const cum = [];
  let sumGBP = 0;
  pnls.forEach(pnl => {
    sumGBP += pnl;
    // Calcola il ritorno percentuale cumulativo rispetto al capitale iniziale in GBP
    const cumulativeReturnPct = (sumGBP / initialCapitalGBP) * 100;
    cum.push(cumulativeReturnPct);
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

// —––– Module 4 — New Strategies Alert (2σ) —–––
async function renderModule4() {
  try {
    const resp = await fetch('spreads.json');
    const data = await resp.json();

    const alerts = Object.entries(data)
      .filter(([_, series]) => Array.isArray(series) && series.length >= 2)
      .map(([spread, series]) => {
        const prev = series[series.length - 2];
        const last = series[series.length - 1];
        // unpack both 1σ and 2σ levels
        const [, prevPrice, prevL1, prevL2, prevU1, prevU2] = prev;
        const [, price,     lower1, lower2, upper1, upper2] = last;

        // trigger only on ±2σ crossings
        const justBrokeLong  = price < lower2  && prevPrice >= prevL2;
        const justBrokeShort = price > upper2  && prevPrice <= prevU2;
        if (!justBrokeLong && !justBrokeShort) return;

        const signal = justBrokeLong ? 'Long' : 'Short';
        // TP/SL still based on mid-of-1σ band
        const mid    = (lower1 + upper1) / 2;
        const half   = Math.abs(price - mid);

        return {
          spread,
          signal,
          entry:      price,
          takeProfit: mid,
          stopLoss:   signal === 'Long'
                        ? price - half
                        : price + half
        };
      })
      .filter(Boolean);

    const tbody = document.querySelector('#module4 tbody');
    tbody.innerHTML = '';
    alerts.forEach(a => {
      const tr = document.createElement('tr');
      tr.innerHTML = `
        <td class="instrument-item" data-key="${a.spread}">${a.spread}</td>
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
