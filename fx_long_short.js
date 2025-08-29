// FX dashboard wiring

// ─── Chart.js defaults ───
Chart.defaults.font.family = 'Helvetica Neue, Arial, sans-serif';
Chart.defaults.font.size   = 12;
Chart.defaults.font.weight = 'normal';

// ─── Sizing & fees ───
const ACCOUNT_SIZE   = 20000;
const RISK_PCT       = 0.02;     // 2% per trade
const COMMISSION_PCT = 0.0002;    // 0.02% round-trip equivalente

// Files (FX)
const STATS_FILE    = 'fx_long_short_stats.json';
const CHANNELS_FILE = 'fx_channels.json';

// Helper
function ret(t){ return t.returnPct; }

(async function () {
  // 1) Load stats & trades
  const resp = await fetch(STATS_FILE);
  if (!resp.ok) { console.error('JSON load failed'); return; }
  const stats  = await resp.json();
  const trades = stats.trades;

  // 1a) Net P&L and return%
  const riskAmt = ACCOUNT_SIZE * RISK_PCT;
  trades.forEach(t => {
    const dist     = Math.abs(t.entry - t.take_profit);
    const shares   = dist > 0 ? (riskAmt / dist) : 0;    // pezzi
    const notional = shares * t.entry;                   // valore in valuta
    const commission = notional * COMMISSION_PCT;        // già round-trip

    const grossPnl = (t.type === 'long'
      ? (t.exit - t.entry) * shares
      : (t.entry - t.exit) * shares);

    const netPnl   = grossPnl - commission;
    t.returnPct    = netPnl / ACCOUNT_SIZE;
  });

  // 1b) Returns array
  const rets = trades.map(ret);

  // 2) Durations
  const durations = trades
    .map(t => (new Date(t.exit_date) - new Date(t.entry_date)) / 86400000)
    .sort((a,b)=>a-b);

  // 3) Period
  const entryDates = trades.map(t => new Date(t.entry_date));
  const exitDates  = trades.map(t => new Date(t.exit_date));
  const startDate  = new Date(Math.min(...entryDates));
  const endDate    = new Date(Math.max(...exitDates));
  const fmt = d => d.toLocaleString('default',{month:'short',year:'numeric'});
  const period = `${fmt(startDate)} – ${fmt(endDate)}`;

  // 4) KPI
  const numTrades   = trades.length;
  const mid         = Math.floor(durations.length/2);
  const medDur      = durations.length%2 ? durations[mid] : (durations[mid-1]+durations[mid])/2;
  const quickestDur = Math.min(...durations);
  const maxDrawdown = stats.portfolio_kpis.max_drawdown * 100;
  const avgRet      = rets.reduce((s,r)=>s+r,0) / (rets.length||1);
  const downsideRs  = rets.filter(r=>r<0);
  const downsideSD  = downsideRs.length ? Math.sqrt(downsideRs.reduce((s,r)=>s+r*r,0)/downsideRs.length) : 0;
  const sortino     = downsideSD>0 ? avgRet/downsideSD : 0;

  // 5) Render
  renderModule1({ period, numTrades, medDur, quickestDur, maxDrawdown, sortino });
  renderModule2(trades);
  renderModule3(rets);
  renderModule4();
})();

// Module 1
function renderModule1({ period, numTrades, medDur, quickestDur, maxDrawdown, sortino }) {
  const cont = document.getElementById('module1');
  cont.innerHTML = '';
  [
    { label: 'Period',           value: period },
    { label: '# Trades',         value: numTrades },
    { label: 'Median Duration',  value: medDur.toFixed(0) + ' days' },
    { label: 'Quickest Trade',   value: quickestDur.toFixed(0) + ' days' },
    { label: 'Max Drawdown',     value: maxDrawdown.toFixed(1) + '%' },
    { label: 'Sortino Ratio',    value: sortino.toFixed(2) }
  ].forEach(c => {
    const d = document.createElement('div');
    d.className = 'kpi-card';
    d.innerHTML = `<div class="kpi-value">${c.value}</div><div class="kpi-label">${c.label}</div>`;
    cont.appendChild(d);
  });
}

// Module 2
function renderModule2(trades) {
  const tbody = document.querySelector('#module2 tbody');
  const thead = document.querySelector('#module2 thead tr');
  tbody.innerHTML = ''; thead.innerHTML = `
    <th>Spread</th><th>Signal</th><th>Open Date</th><th>Close Date</th>
    <th>Open Price</th><th>Close Price</th><th>Take Profit</th><th>Stop Loss</th><th>Return</th>
  `;
  trades.slice().sort((a,b)=>new Date(a.exit_date)-new Date(b.exit_date)).forEach(t=>{
    const tr=document.createElement('tr');
    tr.innerHTML = `
      <td>${t.spread}</td><td>${t.type==='long'?'Long':'Short'}</td>
      <td>${t.entry_date}</td><td>${t.exit_date}</td>
      <td>${t.entry.toFixed(4)}</td><td>${t.exit.toFixed(4)}</td>
      <td>${t.take_profit.toFixed(4)}</td><td>${t.stop_loss.toFixed(4)}</td>
      <td>${(t.returnPct*100).toFixed(2)}%</td>
    `;
    tbody.appendChild(tr);
  });
}

// Module 3
function renderModule3(rets) {
  const cum=[]; let sum=0; rets.forEach(r=>{ sum+=r; cum.push(sum*100); });
  new Chart(document.getElementById('equityChart').getContext('2d'),{
    type:'line',
    data:{ labels:cum.map((_,i)=>i+1), datasets:[{ label:'Cumulative Return', data:cum, borderColor:'#FFA500', fill:false }]},
    options:{
      maintainAspectRatio:false, layout:{padding:{bottom:20}},
      scales:{ y:{ title:{display:true,text:'Cumulative Return (%)',font:{size:14}}, ticks:{callback:v=>v.toFixed(1)+'%'} }, x:{display:false} },
      plugins:{ legend:{display:false} }
    }
  });
}



// Module 4 — Alerts (±2σ, coerente col backtest)

async function renderModule4() {

  try {

    const resp = await fetch(CHANNELS_FILE);

    const data = await resp.json();



    const alerts = Object.entries(data)

      .filter(([_, series]) => Array.isArray(series) && series.length >= 2)

      .map(([spread, series]) => {

        const prev = series[series.length - 2];

        const last = series[series.length - 1];

        // [date, ratio, lower1, lower2, upper1, upper2]

        const [, prevPrice, , prevLower2, , prevUpper2] = prev;

        const [, price,     , lower2,     , upper2]     = last;



        const justBrokeLong  = (price <  lower2) && (prevPrice >= prevLower2);

        const justBrokeShort = (price >  upper2) && (prevPrice <= prevUpper2);

        if (!(justBrokeLong || justBrokeShort)) return;



        const signal = justBrokeLong ? 'Long' : 'Short';

        const mid    = (lower2 + upper2) / 2;   // trend

        const half   = Math.abs(price - mid);   // TP/SL simmetrici



        return {

          spread,

          signal,

          entry: price,

          takeProfit: mid,

          stopLoss: signal==='Long' ? price - half : price + half

        };

      })

      .filter(Boolean);

    
    const tbody = document.querySelector('#module4 tbody');
    tbody.innerHTML = '';
    alerts.forEach(a => {
      const tr = document.createElement('tr');
      tr.innerHTML = `
        <td>${a.spread}</td><td>${a.signal}</td>
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
