// nondirectional.js
(async function(){
  const resp = await fetch('./non_directional_stats.json');
  const stats = await resp.json();

  // Module 1: aggregate summary
  const agg = stats.aggregate;
  document.getElementById('module1').innerHTML = `
    <h2>Portfolio Summary</h2>
    <p>Period: ${agg.period_start} → ${agg.period_end}</p>
    <p>Total Trades: ${agg.total_trades}</p>
    <p>Wins: ${agg.wins} &nbsp; Losses: ${agg.losses} &nbsp; Win Rate: ${agg.win_rate_pct.toFixed(1)}%</p>
    <p>Total PnL: ${agg.total_pnl.toFixed(4)}</p>
    <p>Avg PnL/Trade: ${agg.avg_pnl.toFixed(4)}</p>
    <p>Max Win: ${agg.max_profit.toFixed(4)} &nbsp; Max Loss: ${agg.max_loss.toFixed(4)}</p>
  `;

  // Module 2: per‑spread table
  const per = stats.per_spread;
  const rows = Object.entries(per)
    .map(([k,v]) => `
      <tr>
        <td>${k}</td>
        <td>${v.trades}</td>
        <td>${v.win_rate_pct.toFixed(1)}%</td>
        <td>${v.total_pnl.toFixed(4)}</td>
      </tr>`)
    .join('');
  document.getElementById('module2').innerHTML = `
    <h2>By Spread</h2>
    <table>
      <thead><tr><th>Spread</th><th>Trades</th><th>Win %</th><th>PnL</th></tr></thead>
      <tbody>${rows}</tbody>
    </table>
  `;

  // Module 3: equity curve chart
  const canvas = document.createElement('canvas');
  document.getElementById('module3').appendChild(canvas);
  new Chart(canvas.getContext('2d'), {
    type: 'line',
    data: {
      labels: stats.equity_curve.map(d => d.date),
      datasets: [{
        label: 'Cumulative PnL',
        data:  stats.equity_curve.map(d => d.cumulative_pnl),
        borderColor:  '#FFA500',
        borderWidth: 2,
        fill: false,
        pointRadius: 0
      }]
    },
    options: {
      plugins: { legend: { display: false } },
      scales: {
        x: { ticks: { color: '#FFA500' } },
        y: { ticks: { color: '#FFA500' } }
      },
      animation: false
    }
  });
})();
