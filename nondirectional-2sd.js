// nondirectional-2sd.js

// ─── Config per la conversione in £ ───
const CONFIG = {
  accountGBP: 18000,   // capitale conto
  allocPerTrade: 1.0,  // quota allocata per trade (1.0 = 100%; es. 0.25 = 25%)
  // commissionGBP: 0,  // opzionale: costo fisso per round-trip
};

// ─── Global Chart.js defaults ───
Chart.defaults.font.family = 'Helvetica Neue, Arial, sans-serif';
Chart.defaults.font.size   = 12;
Chart.defaults.font.weight = 'normal';

// ─── Helpers di normalizzazione ───
// Se |x| > 1 supponiamo che "x" sia già in percento (es. 2 = 2%) → ritorna frazione 0.02
function normalizeReturn(x) {
  if (x == null || Number.isNaN(x)) return 0;
  const ax = Math.abs(x);
  return ax > 1 ? x / 100 : x;  // percent → fraction
}
// Se KPI percentuale: se ≤1 è frazione (0.12 = 12%) → ×100; se >1 è già percentuale.
function normalizePct(x) {
  if (x == null || Number.isNaN(x)) return 0;
  return Math.abs(x) <= 1 ? x * 100 : x;
}
// Formattazione £ con segno corretto
function money(gbp) {
  const v = Number(gbp) || 0;
  const s = Math.sign(v) < 0 ? '-£' : '£';
  return s + Math.abs(v).toFixed(2);
}

(async function() {
  // 1) Load stats & trades (2σ backtest output)
  const resp = await fetch('non_directional_stats-2sd.json');
  if (!resp.ok) {
    console.error('JSON load failed');
    return;
  }
  const stats  = await resp.json();
  const trades = stats.trades || [];

  // 2) Ritorni normalizzati (frazione)
  const rets = trades.map(t => normalizeReturn(t.pnl)); // t.pnl può essere % o frazione

  // 3) Durate (giorni)
  const durations = trades
    .map(t => (new Date(t.exit_date) - new Date(t.entry_date)) / (1000 * 60 * 60 * 24))
    .filter(d => Number.isFinite(d))
    .sort((a, b) => a - b);

  // 4) Periodo
  const entryDates = trades.map(t => new Date(t.entry_date)).filter(d => !isNaN(d));
  const exitDates  = trades.map(t => new Date(t.exit_date)).filter(d => !isNaN(d));
  const startDate  = entryDates.length ? new Date(Math.min(...entryDates)) : null;
  const endDate    = exitDates.length  ? new Date(Math.max(...exitDates))  : null;
  const fmt = d => d ? d.toLocaleString('default', { month: 'short', year: 'numeric' }) : '-';
  const period = `${fmt(startDate)} – ${fmt(endDate)}`;

  // 5) KPI
  const numTrades   = trades.length;
  const mid         = Math.floor(Math.max(0, durations.length - 1) / 2);
  const medDur      = durations.length
    ? (durations.length % 2 === 1 ? durations[mid] : (durations[mid - 1] + durations[mid]) / 2)
    : 0;
  const quickestDur = durations.length ? Math.min(...durations) : 0;

  // Max Drawdown dal JSON: normalizza all'unità corretta
  const maxDrawdown = normalizePct(stats?.portfolio_kpis?.max_drawdown);

  // Sortino sui ritorni normalizzati
  const avgRet     = rets.length ? rets.reduce((s, r) => s + r, 0) / rets.length : 0;
  const downsideRs = rets.filter(r => r < 0);
  const downsideSD = downsideRs.length
    ? Math.sqrt(downsideRs.reduce((s, r) => s + r*r, 0) / downsideRs.length)
    : 0;
  const sortino    = downsideSD > 0 ? avgRet / downsideSD : 0;

  // 6) Render
  renderModule1({ period, numTrades, medDur, quickestDur, maxDrawdown, sortino });
  renderModule2(trades);
  renderModule3(rets);
  renderModule4();   // 2σ alerts
})();

// ——— Module 1 — Portfolio KPI Cards —–––
function renderModule1({ period, numTrades, medDur, quickestDur, maxDrawdown, sortino }) {
  const cont = document.getElementById('module1');
  cont.innerHTML = '';
  [
    { label: 'Period',          value: period },
    { label: '# Trades',        value: numTrades },
    { label: 'Median Duration', value: (medDur || 0).toFixed(0)    + ' days' },
    { label: 'Quickest Trade',  value: (quickestDur || 0).toFixed(0) + ' days' },
    { label: 'Max Drawdown',    value: (maxDrawdown || 0).toFixed(1) + '%' },
    { label: 'Sortino Ratio',   value: (sortino || 0).toFixed(2)     }
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
// Delta = |(take_profit - entry) / entry| * 100
// P&L (£) = ritorno_normalizzato * accountGBP * allocPerTrade  (senza doppi ×100)
function renderModule2(trades) {
  const tbody = document.querySelector('#module2 tbody');
  tbody.innerHTML = '';

  // header
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

  trades
    .slice()
    .sort((a, b) => new Date(a.exit_date) - new Date(b.exit_date))
    .forEach(t => {
      const entry = Number(t.entry);
      const tp    = Number(t.take_profit);
      const deltaPct = (Math.abs((tp - entry) / entry) * 100);
      const r      = normalizeReturn(t.pnl); // frazione
      const pnlGBP = r * CONFIG.accountGBP * CONFIG.allocPerTrade
                     - (CONFIG.commissionGBP || 0 || 0); // opzionale

      const tr = document.createElement('tr');
      tr.innerHTML = `
        <td class="instrument-item" data-key="${t.spread}">${t.spread}</td>
        <td>${t.type === 'long' ? 'Long' : 'Short'}</td>
        <td>${deltaPct.toFixed(2)}%</td>
        <td>${t.entry_date}</td>
        <td>${t.exit_date}</td>
        <td>${entry.toFixed(4)}</td>
        <td>${Number(t.exit).toFixed(4)}</td>
        <td>${tp.toFixed(4)}</td>
        <td>${Number(t.stop_loss).toFixed(4)}</td>
        <td>${money(pnlGBP)}</td>
      `;
      tbody.appendChild(tr);
    });
}

// —––– Module 3 — Equity Curve (composta) —–––
function renderModule3(rets) {
  const labels = [];
  const curve  = [];
  let equity   = 1;     // 1 = 100% iniziale
  rets.forEach((r, i) => {
    equity *= (1 + (Number.isFinite(r) ? r : 0));
    curve.push((equity - 1) * 100);  // in %
    labels.push(i + 1);
  });

  new Chart(
    document.getElementById('equityChart').getContext('2d'),
    {
      type: 'line',
      data: {
        labels,
        datasets: [{
          label: 'Cumulative Return',
          data: curve,
          borderColor: '#FFA500',
          fill: false
        }]
      },
      options: {
        maintainAspectRatio: false,
        layout: { padding: { bottom: 20 } },
        scales: {
          y: {
            title: { display: true, text: 'Cumulative Return (%)', font: { size: 14 } },
            ticks: { callback: v => Number(v).toFixed(1) + '%' }
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
    if (!resp.ok) return;
    const data = await resp.json();

    const alerts = Object.entries(data)
      .filter(([k, series]) => k !== '_groups' && Array.isArray(series) && series.length >= 2)
      .map(([spread, series]) => {
        const prev = series[series.length - 2];
        const last = series[series.length - 1];
        // unpack: [date, price, l1, l2, u1, u2]
        const [, prevPrice, prevL1, prevL2, prevU1, prevU2] = prev;
        const [, price,     lower1, lower2, upper1, upper2] = last;

        const justBrokeLong  = price < lower2 && prevPrice >= prevL2;
        const justBrokeShort = price > upper2 && prevPrice <= prevU2;
        if (!justBrokeLong && !justBrokeShort) return null;

        const signal = justBrokeLong ? 'Long' : 'Short';
        const mid    = (lower1 + upper1) / 2;
        const half   = Math.abs(price - mid);

        return {
          spread,
          signal,
          entry:      price,
          takeProfit: mid,
          stopLoss:   signal === 'Long' ? (price - half) : (price + half),
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
