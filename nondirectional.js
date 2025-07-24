// Fetch the JSON and wire up all three modules
(async function() {
  const resp = await fetch('non_directional_stats.json');
  if (!resp.ok) {
    console.error('Failed to load stats JSON');
    return;
  }
  const stats = await resp.json();

  renderModule1(stats.portfolio_kpis);
  renderModule2(stats.by_spread);
  renderModule3(stats.portfolio_kpis, stats.trades);
})();

// Module 1: KPI Cards
function renderModule1(kpis) {
  const container = document.getElementById('module1');
  const cards = [
    { label: 'Total Trades',      value: kpis.total_trades },
    { label: 'Win Rate %',        value: kpis.win_rate_pct.toFixed(1) },
    { label: 'Avg PnL / Trade',   value: kpis.avg_pnl_per_trade.toFixed(4) },
    { label: 'Max Win / Max Loss',value: `${kpis.max_win.toFixed(4)} / ${kpis.max_loss.toFixed(4)}` },
    { label: 'Max Drawdown',      value: kpis.max_drawdown.toFixed(4) },
    { label: 'Avg Duration (d)',  value: kpis.avg_duration_days.toFixed(1) },
  ];
  cards.forEach(c => {
    const card = document.createElement('div');
    card.className = 'kpi-card';
    card.innerHTML = `
      <div class="kpi-value">${c.value}</div>
      <div class="kpi-label">${c.label}</div>
    `;
    container.appendChild(card);
  });
}

// Module 2: By‑Spread Table
function renderModule2(list) {
  const tbody = document.querySelector('#module2 tbody');
  list.forEach(s => {
    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td>${s.key}</td>
      <td>${s.trades}</td>
      <td>${s.win_rate}%</td>
      <td>${s.avg_pnl.toFixed(4)}</td>
      <td>${s.max_win.toFixed(4)}</td>
      <td>${s.max_loss.toFixed(4)}</td>
      <td>${s.avg_duration_days}</td>
    `;
    tbody.appendChild(tr);
  });
}

// Module 3: Charts
function renderModule3(kpis, trades) {
  // 1) Cumulative PnL curve + drawdown shading
  const ctxE = document.getElementById('equityChart').getContext('2d');
  const labels = trades.map(t => t.exit_date);
  const cumPnls = trades.map(t => t.cum_pnl);
  // compute drawdown %
  let peak = cumPnls[0] || 0;
  const dd = cumPnls.map(v => {
    peak = Math.max(peak, v);
    return ((peak - v)/Math.max(1, peak))*100;
  });
  new Chart(ctxE, {
    type: 'line',
    data: {
      labels,
      datasets: [
        {
          label: 'Cumulative PnL',
          data: cumPnls,
          borderColor: '#FFA500',
          fill: false,
        },
        {
          label: 'Drawdown %',
          data: dd,
          borderColor: 'rgba(255,0,0,0.3)',
          backgroundColor: 'rgba(255,0,0,0.2)',
          fill: true,
          yAxisID: 'B'
        }
      ]
    },
    options: {
      scales: {
        A: { type: 'linear', position: 'left', title: { display:true, text: 'PnL' } },
        B: { type: 'linear', position: 'right', title: { display:true, text: 'Drawdown %' }, grid: { drawOnChartArea: false } }
      },
      interaction: { mode: 'index', intersect: false }
    }
  });

  // 2) Histogram of returns
  const ctxR = document.getElementById('returnsChart').getContext('2d');
  const returns = trades.map(t => t.pnl);
  new Chart(ctxR, {
    type: 'bar',
    data: {
      labels: returns.map((_,i)=>i+1),
      datasets:[{
        label: 'PnL per Trade',
        data: returns,
        backgroundColor: returns.map(v=>v>=0?'rgba(0,200,0,0.6)':'rgba(200,0,0,0.6)')
      }]
    },
    options: {
      plugins:{ legend:{display:false} },
      scales:{ x:{display:false}, y:{title:{ display:true, text:'PnL'}} }
    }
  });

  // 3) Duration distribution
  const ctxD = document.getElementById('durationChart').getContext('2d');
  const durs = trades.map(t=>t.duration);
  // bucket durations: 0–10, 10–30, 30–60, 60+
  const bins = [0,10,30,60,Infinity];
  const labelsD = ['0–10','10–30','30–60','60+'];
  const counts = labelsD.map((_,i)=> durs.filter(d=>d>bins[i]&&d<=bins[i+1]).length );
  new Chart(ctxD, {
    type: 'bar',
    data: { labels: labelsD, datasets:[{ data: counts, label:'Trades', backgroundColor:'#FFA500' }] },
    options: {
      plugins:{ legend:{display:false} },
      scales:{ y:{title:{ display:true, text:'# Trades'}} }
    }
  });
}
