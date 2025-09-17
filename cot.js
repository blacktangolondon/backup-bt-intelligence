<script>
// ─── Global Chart.js defaults ───
Chart.defaults.font.family = 'Helvetica Neue, Arial, sans-serif';
Chart.defaults.font.size   = 12;
Chart.defaults.font.weight = 'normal';

// ─── File di input ───
const STATS_FILE     = 'cot_long_short_stats.json';
const PRICE_COT_FILE = 'price_and_cot.json';

// ─── Parametri di sizing & commissioni (solo per stima) ───
const ACCOUNT_SIZE   = 20000;
const RISK_PCT       = 0.02;
const COMMISSION_PCT = 0.004;

// ─── Helper numerici safe ───
const num   = v => Number.isFinite(Number(v)) ? Number(v) : NaN;
const d4    = v => Number.isFinite(Number(v)) ? Number(v).toFixed(4) : '—';
const pct   = v => Number.isFinite(Number(v)) ? (Number(v)*100).toFixed(2)+'%' : '—';

// ─── Equity utils ───
function calcMDDFromRets(rets) {
  let cum = 0, peak = 0, maxDD = 0;
  for (const r of rets) {
    cum += r;
    if (cum > peak) peak = cum;
    const dd = cum - peak;          // <= 0
    if (dd < maxDD) maxDD = dd;
  }
  return Math.abs(maxDD) * 100;     // %
}

(async function main() {
  // 1) Carico stats
  const r = await fetch(STATS_FILE, { cache:'no-store' });
  if (!r.ok) { console.error('JSON load failed', STATS_FILE); return; }
  const stats = await r.json();

  const trades = Array.isArray(stats.trades) ? stats.trades.slice() : [];
  // Alcuni converter non includono meta → fallback
  const meta = stats.meta || {};
  const BUY  = Number.isFinite(Number(meta.buy_trig))  ? Number(meta.buy_trig)  : 95;
  const SELL = Number.isFinite(Number(meta.sell_trig)) ? Number(meta.sell_trig) : 5;
  const TP_P = Number.isFinite(Number(meta.tp_pct))    ? Number(meta.tp_pct)    : null;
  const SL_P = Number.isFinite(Number(meta.sl_pct))    ? Number(meta.sl_pct)    : null;
  const RISK_MODE = (meta.risk_mode || 'fixed_pct');

  // 2) Return per trade (dimensionato se possibile, altrimenti grezzo)
  const riskAmt = ACCOUNT_SIZE * RISK_PCT;
  trades.forEach(t => {
    // normalizzo campi attesi
    const entry = num(t.entry), exit = num(t.exit);
    const sl    = num(t.stop_loss);  // può essere NaN se assente
    const dir   = (t.type || '').toLowerCase();

    // gross return grezzo se serve (fractions)
    const grossRet = (dir === 'long')
      ? (num(exit) - num(entry)) / num(entry)
      : (num(entry) - num(exit)) / num(entry);

    // dimensionato se ho distanza dallo stop (sensata)
    const dist = Math.abs(entry - sl);
    if (Number.isFinite(dist) && dist > 0) {
      const shares     = riskAmt / dist;
      const notional   = shares * entry;
      const commission = notional * COMMISSION_PCT;
      const grossPnl = (dir === 'long')
        ? (exit - entry) * shares
        : (entry - exit) * shares;
      const netPnl = grossPnl - commission;
      t.returnPct = netPnl / ACCOUNT_SIZE;   // frazione
    } else {
      t.returnPct = Number.isFinite(grossRet) ? grossRet : 0; // fallback robusto
    }
  });

  // 3) KPI principali
  const durations = trades
    .map(t => (new Date(t.exit_date) - new Date(t.entry_date)) / 86400000)
    .filter(x => Number.isFinite(x))
    .sort((a,b)=>a-b);

  const entryDates = trades.map(t => new Date(t.entry_date)).filter(d=>!isNaN(d));
  const exitDates  = trades.map(t => new Date(t.exit_date)).filter(d=>!isNaN(d));
  const startDate  = entryDates.length ? new Date(Math.min(...entryDates)) : null;
  const endDate    = exitDates.length  ? new Date(Math.max(...exitDates))  : null;
  const fmtMonthYr = d => d.toLocaleString('default', { month:'short', year:'numeric' });
  const period     = (startDate && endDate) ? `${fmtMonthYr(startDate)} – ${fmtMonthYr(endDate)}` : '—';

  const numTrades   = trades.length;
  const mid         = Math.floor(durations.length/2);
  const medDur      = durations.length ? (durations.length%2 ? durations[mid] : (durations[mid-1]+durations[mid])/2) : 0;
  const quickestDur = durations.length ? durations[0] : 0;

  const rets = trades.map(t => num(t.returnPct)).filter(x => Number.isFinite(x));
  const maxDrawdown = calcMDDFromRets(rets);
  const avgRet = rets.length ? rets.reduce((s,r)=>s+r,0)/rets.length : 0;
  const downside = rets.filter(r=>r<0);
  const downsideSD = downside.length ? Math.sqrt(downside.reduce((s,r)=>s+r*r,0)/downside.length) : 0;
  const sortino = downsideSD>0 ? avgRet/downsideSD : NaN;

  renderModule1({
    period,
    numTrades,
    medDur,
    quickestDur,
    maxDrawdown,
    sortino
  });

  renderModule2(trades);
  renderModule3(rets);

  // 4) New Strategies Alert da price_and_cot.json (cross su BUY/SELL)
  try {
    const pr = await fetch(PRICE_COT_FILE, { cache:'no-store' });
    if (pr.ok) {
      const pc = await pr.json();
      renderModule4_fromPriceCot(pc, { BUY, SELL, TP_P, SL_P });
    }
  } catch(e) {
    console.warn('Alert module skipped:', e);
  }
})();

// —––– Module 1 — KPI
function renderModule1({ period, numTrades, medDur, quickestDur, maxDrawdown, sortino }) {
  const cont = document.getElementById('module1');
  cont.innerHTML = '';
  [
    { label: 'Period',           value: period },
    { label: '# Trades',         value: numTrades },
    { label: 'Median Duration',  value: (Number(medDur)||0).toFixed(0)      + ' days' },
    { label: 'Quickest Trade',   value: (Number(quickestDur)||0).toFixed(0) + ' days' },
    { label: 'Max Drawdown',     value: (Number(maxDrawdown)||0).toFixed(1) + '%' },
    { label: 'Sortino Ratio',    value: Number.isFinite(Number(sortino)) ? Number(sortino).toFixed(2) : '—' }
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

// —––– Module 2 — Closed trades table (safe cells)
function renderModule2(trades) {
  const tbody = document.querySelector('#module2 #tab-realized tbody');
  const thead = document.querySelector('#module2 #tab-realized thead tr');
  if (!tbody || !thead) return;

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
  tbody.innerHTML = '';

  trades
    .slice()
    .sort((a,b)=> new Date(a.exit_date) - new Date(b.exit_date))
    .forEach(t => {
      const mkt = t.market || t.spread || '';
      const retPct = pct(t.returnPct);
      const tr = document.createElement('tr');
      tr.innerHTML = `
        <td>${mkt}</td>
        <td>${(t.type||'').toLowerCase()==='long'?'Long':'Short'}</td>
        <td>${t.entry_date || ''}</td>
        <td>${t.exit_date  || ''}</td>
        <td>${d4(t.entry)}</td>
        <td>${d4(t.exit)}</td>
        <td>${d4(t.take_profit)}</td>
        <td>${d4(t.stop_loss)}</td>
        <td>${retPct}</td>
      `;
      tbody.appendChild(tr);
    });
}

// —––– Module 3 — Equity (aritmetica sugli stessi rets usati per MDD)
function renderModule3(rets) {
  const el = document.getElementById('equityChart');
  if (!el) return;
  const ctx = el.getContext('2d');

  let cum=0;
  const curve = rets.map(r => (cum+=r)*100); // %

  new Chart(ctx,{
    type:'line',
    data:{ labels: curve.map((_,i)=>i+1), datasets:[{
      label:'Cumulative Return', data:curve, borderColor:'#FFA500', fill:false, tension:0.25, pointRadius:0
    }]},
    options:{
      maintainAspectRatio:false,
      layout:{ padding:{ bottom:20 } },
      scales:{
        y:{ title:{ display:true, text:'Cumulative Return (%)', font:{ size:14 } },
            ticks:{ callback:v => Number(v).toFixed(1)+'%' },
            grid:{ color:'#2a2a2a' } },
        x:{ display:false }
      },
      plugins:{ legend:{ display:false } }
    }
  });
}

// —––– Module 4 — New Strategies Alert da price_and_cot.json
function renderModule4_fromPriceCot(priceCot, { BUY, SELL, TP_P, SL_P }) {
  const tbody = document.querySelector('#module4 tbody');
  if (!tbody || !priceCot) return;
  tbody.innerHTML = '';

  Object.entries(priceCot).forEach(([ticker, obj])=>{
    const rows = Array.isArray(obj.data) ? obj.data : [];
    if (rows.length < 2) return;

    const [dPrev, closePrev, ciPrev] = rows[rows.length-2];
    const [dNow,  closeNow,  ciNow ] = rows[rows.length-1];

    // cross su soglie
    const longNow  = (ciNow  > BUY)  && (ciPrev <= BUY);
    const shortNow = (ciNow  < SELL) && (ciPrev >= SELL);
    if (!longNow && !shortNow) return;

    // Open = ultimo close; TP/SL solo se percentuali disponibili
    let tp = '—', sl = '—';
    if (Number.isFinite(TP_P) && Number.isFinite(SL_P)) {
      if (longNow) {
        tp = d4(closeNow * (1 + TP_P));
        sl = d4(closeNow * (1 - SL_P));
      } else if (shortNow) {
        tp = d4(closeNow * (1 - TP_P));
        sl = d4(closeNow * (1 + SL_P));
      }
    }

    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td>${ticker}</td>
      <td>${longNow ? 'Long' : 'Short'}</td>
      <td>${d4(closeNow)}</td>
      <td>${tp}</td>
      <td>${sl}</td>`;
    tbody.appendChild(tr);
  });

  if (!tbody.children.length){
    const tr = document.createElement('tr');
    tr.innerHTML = `<td colspan="5" style="text-align:center;opacity:.7">No fresh signals</td>`;
    tbody.appendChild(tr);
  }
}
</script>
