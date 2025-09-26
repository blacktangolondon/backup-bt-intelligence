/**
 * charts.js – helper per Chart.js
 * - scatter SIM (assi/tooltip in %)
 * - line chart benchmark vs asset (assi/tooltip in %)
 */

export function destroyChartIfExists(canvasId) {
  const existing = window.Chart && window.Chart.getChart(canvasId);
  if (existing) existing.destroy();
}

/** Scatter r_m vs r_i con retta; assi/tooltip in % */
export function renderScatterWithRegression(canvasId, points, line) {
  destroyChartIfExists(canvasId);
  const canvas = document.getElementById(canvasId);
  if (!canvas) return null;
  const ctx = canvas.getContext('2d');

  const xs = points.map(p => p.x);
  const minX = Math.min(...xs);
  const maxX = Math.max(...xs);
  const lineData = [
    { x: minX, y: line.a + line.b * minX },
    { x: maxX, y: line.a + line.b * maxX }
  ];

  const fmtPct = v => `${(v * 100).toFixed(0)}%`;
  const fmtPair = (x, y) => `(${(x*100).toFixed(2)}%, ${(y*100).toFixed(2)}%)`;

  const chart = new Chart(ctx, {
    type: 'scatter',
    data: {
      datasets: [
        {
          label: 'Daily returns',
          data: points,
          pointRadius: 2,
          pointBackgroundColor: 'rgba(70,150,220,0.9)'
        },
        {
          label: 'Regression',
          type: 'line',
          data: lineData,
          borderWidth: 2,
          borderColor: 'rgba(255,165,0,0.95)',
          pointRadius: 0,
          fill: false
        }
      ]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      scales: {
        x: { title: { display: true, text: 'Market return (GSPC)' },
             ticks: { color: 'white', callback: (v)=>fmtPct(v) } },
        y: { title: { display: true, text: 'Asset return' },
             ticks: { color: 'white', callback: (v)=>fmtPct(v) } }
      },
      plugins: {
        legend: { labels: { color: 'white' } },
        tooltip: { callbacks: { label: (ctx)=>fmtPair(ctx.raw.x, ctx.raw.y) } }
      }
    }
  });

  requestAnimationFrame(() => chart.resize());
  return chart;
}

/** Line chart: cumulative returns asset vs benchmark (assi/tooltip in %) */
export function renderBenchmarkLines(canvasId, labels, assetCum, benchCum) {
  destroyChartIfExists(canvasId);
  const canvas = document.getElementById(canvasId);
  if (!canvas) return null;
  const ctx = canvas.getContext('2d');

  const fmtPct = v => `${(v * 100).toFixed(0)}%`;
  const fmtPctTT = v => `${(v * 100).toFixed(2)}%`;

  const chart = new Chart(ctx, {
    type: 'line',
    data: {
      labels,
      datasets: [
        { label: 'Asset (cum %)', data: assetCum, borderWidth: 2, pointRadius: 0, tension: 0.2 },
        { label: 'Benchmark (cum %)', data: benchCum, borderWidth: 2, pointRadius: 0, tension: 0.2 }
      ]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      scales: {
        x: {
          ticks: { color: 'white', maxRotation: 0, autoSkip: true },
        },
        y: {
          ticks: { color: 'white', callback: (v)=>fmtPct(v) }
        }
      },
      plugins: {
        legend: { labels: { color: 'white' } },
        tooltip: {
          callbacks: {
            title: (items)=> items?.[0]?.label ?? '',
            label: (ctx)=> `${ctx.dataset.label}: ${fmtPctTT(ctx.parsed.y)}`
          }
        }
      }
    }
  });

  requestAnimationFrame(() => chart.resize());
  return chart;
}

/* Stubs compat (se altri moduli li importano) */
export function renderBarChart(){ /* no-op */ }
export function renderPieChart(){ /* no-op */ }
