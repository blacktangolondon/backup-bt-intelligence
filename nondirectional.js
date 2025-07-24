(async function() {
  // 1) Load stats & trades
  const resp = await fetch('non_directional_stats.json');
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

  // 3) Compute Portfolio KPIs
  const rets    = trades.map(ret);
  const total   = rets.length;
  const wins    = rets.filter(r => r > 0).length;
  const winRate = (wins / total) * 100;
  const avgRet  = rets.reduce((a, b) => a + b, 0) / total;
  const maxWin  = Math.max(...rets);
  const maxLoss = Math.min(...rets);

  // 4) Max Drawdown on compounded curve
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

  // 5) Render Module 1
  renderModule1({
    total,
    winRate,
    avgRet,
    maxWin,
    maxLoss,
    maxDrawdown: mdd
  });

  // 6) Render Module 2
  const bySpread = {};
  trades.forEach(t => {
    const key = t.spread;
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

  // 7) Render Module 3 (only equity curve)
  renderModule3(cum);

  // 8) Render Module 4 (New Strategies Alert)
  renderModule4();
})();

// ——— UI renderers ———

function renderModule1({ total, winRate, avgRet, maxWin, maxLoss, maxDrawdown }) {
  const cont = document.getElementById('module1');
  cont.innerHTML = '';
  [
    { label: 'Total Trades', value: total },
    { label: 'Win %',        value: winRate.toFixed(1) + '%' },
    { label: 'Avg Return',   value: (avgRet * 100).toFixed(1) + '%' },
    { label: 'Max Win',      value: (maxWin * 100).toFixed(1) + '%' },
    { label: 'Max Loss',     value: (maxLoss * 100).toFixed(1) + '%' },
    { label: 'Max Drawdown', value: (maxDrawdown * 100).toFixed(1) + '%' }
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
        scales: {
          y: {
            title: {
              display: true,
              text: 'Cumulative Return (%)',
              font: { size: 14 }
            },
            ticks: {
              callback: v => v.toFixed(1) + '%',
              font: { size: 12 }
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
