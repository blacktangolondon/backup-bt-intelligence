(async function() {
  const resp = await fetch('non_directional_stats.json');
  if (!resp.ok) {
    console.error('JSON load failed');
    return;
  }
  const stats = await resp.json();
  const trades = stats.trades;

  // 1) Helper: per‑trade percent return
  function ret(t) {
    return t.type === 'long'
      ? (t.exit - t.entry) / t.entry
      : (t.entry - t.exit) / t.entry;
  }

  // 2) Compute Portfolio KPIs (all %‐based)
  const rets    = trades.map(ret);
  const total   = rets.length;
  const wins    = rets.filter(r => r > 0).length;
  const winRate = (wins / total) * 100;
  const avgRet  = rets.reduce((a, b) => a + b, 0) / total;
  const maxWin  = Math.max(...rets);
  const maxLoss = Math.min(...rets);

  // 3) Max Drawdown on cumulative (compounded) curve
  const cum = [];
  trades.forEach((t, i) => {
    const prev = i ? cum[i - 1] : 0;
    cum[i] = (1 + prev) * (1 + ret(t)) - 1;
  });
  let peak = 0, mdd = 0;
  cum.forEach(v => {
    peak = Math.max(peak, v);
    mdd  = Math.max(mdd, peak - v);
  });

  // 4) Render Module 1 (KPI Cards)
  renderModule1({
    total,
    winRate,
    avgRet,
    maxWin,
    maxLoss,
    maxDrawdown: mdd
  });

  // 5) By‑Spread Breakdown
  const bySpread = {};
  trades.forEach(t => {
    const key = t.spread; // your spread name
    bySpread[key] = bySpread[key] || [];
    bySpread[key].push(ret(t));
  });
  const tableData = Object.entries(bySpread).map(([key, arr]) => {
    const wins = arr.filter(r => r > 0).length;
    const avg  = arr.reduce((a, b) => a + b, 0) / arr.length || 0;
    return {
      key,
      trades:   arr.length,
      win_rate: ((wins / arr.length) * 100).toFixed(1) + '%',
      avg_ret:  (avg * 100).toFixed(1) + '%',
      max_win:  (Math.max(...arr) * 100).toFixed(1) + '%',
      max_loss: (Math.min(...arr) * 100).toFixed(1) + '%'
    };
  });
  renderModule2(tableData);

  // 6) Module 3: Charts
  renderModule3(cum, rets);
})();

// --- UI renderers below ---

function renderModule1({ total, winRate, avgRet, maxWin, maxLoss, maxDrawdown }) {
  const cont = document.getElementById('module1');
  cont.innerHTML = '';
  [
    { label: 'Total Trades',  value: total },
    { label: 'Win %',         value: winRate.toFixed(1) + '%' },
    { label: 'Avg Return',    value: (avgRet * 100).toFixed(1) + '%' },
    { label: 'Max Win',       value: (maxWin * 100).toFixed(1) + '%' },
    { label: 'Max Loss',      value: (maxLoss * 100).toFixed(1) + '%' },
    { label: 'Max Drawdown',  value: (maxDrawdown * 100).toFixed(1) + '%' },
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

function renderModule2(data) {
  const tbody = document.querySelector('#module2 tbody');
  tbody.innerHTML = '';
  data.forEach(r => {
    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td>${r.key}</td>
      <td>${r.trades}</td>
      <td>${r.win_rate}</td>
      <td>${r.avg_ret}</td>
      <td>${r.max_win}</td>
      <td>${r.max_loss}</td>
    `;
    tbody.appendChild(tr);
  });
}

function renderModule3(cum, rets) {
  // Equity curve (cumulative return %)
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
        scales: {
          y: {
            title: {
              display: true,
              text: 'Cumulative Return (%)',
              font: { size: 14 }
            },
            ticks: {
              callback: v => v.toFixed(1) + '%',
              font: { size: 12 }    // <— explicit tick size
            }
          },
          x: {
            display: false,
            ticks: { font: { size: 12 } }
          }
        },
        plugins: {
          legend: {
            labels: { font: { size: 12 } }
          }
        }
      }
    }
  );

  // Histogram (returns per trade %)
  new Chart(
    document.getElementById('pnlChart').getContext('2d'),
    {
      type: 'bar',
      data: {
        labels: rets.map((_, i) => i + 1),
        datasets: [{
          label: 'Return per Trade',
          data: rets.map(v => v * 100),
          backgroundColor: rets.map(v =>
            v >= 0 ? 'rgba(0,200,0,0.6)' : 'rgba(200,0,0,0.6)'
          )
        }]
      },
      options: {
        plugins: {
          legend: {
            display: false,
            labels: { font: { size: 12 } }
          }
        },
        scales: {
          x: {
            display: false,
            ticks: { font: { size: 12 } }
          },
          y: {
            title: {
              display: true,
              text: 'Return (%)',
              font: { size: 14 }
            },
            ticks: {
              callback: v => v.toFixed(0) + '%',
              font: { size: 12 }    // <— explicit tick size
            }
          }
        }
      }
    }
  );
}
