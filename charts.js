/**
 * charts.js – helper per Chart.js
 * - scatter SIM con gradient temporale e outlier evidenziati
 * - bar/pie placeholder (compat)
 */

/* distrugge un chart esistente se presente */
export function destroyChartIfExists(canvasId) {
  const existing = window.Chart && window.Chart.getChart(canvasId);
  if (existing) existing.destroy();
}

/* (compat) – lascio implementazioni semplici nel caso siano usate altrove */
export function renderBarChart(canvasId, labels, datasetLabel, dataArr) {
  destroyChartIfExists(canvasId);
  const ctx = document.getElementById(canvasId)?.getContext("2d");
  if (!ctx) return null;
  return new Chart(ctx, {
    type: 'bar',
    data: { labels, datasets: [{ label: datasetLabel, data: dataArr }]},
    options: { responsive: true, maintainAspectRatio: false }
  });
}
export function renderPieChart(canvasId, labels, dataArr) {
  destroyChartIfExists(canvasId);
  const ctx = document.getElementById(canvasId)?.getContext("2d");
  if (!ctx) return null;
  return new Chart(ctx, {
    type: 'pie',
    data: { labels, datasets: [{ data: dataArr }]},
    options: { responsive: true, maintainAspectRatio: false }
  });
}

/**
 * renderScatterWithRegression
 * points: [{x, y, tIdx (0..1), outlier:boolean}]
 * line: { a: intercept, b: slope }
 */
export function renderScatterWithRegression(canvasId, points, line) {
  destroyChartIfExists(canvasId);
  const canvas = document.getElementById(canvasId);
  if (!canvas) return null;
  const ctx = canvas.getContext('2d');

  // linea di regressione sugli estremi X presenti
  const xs = points.map(p => p.x);
  const minX = Math.min(...xs);
  const maxX = Math.max(...xs);
  const lineData = [
    { x: minX, y: line.a + line.b * minX },
    { x: maxX, y: line.a + line.b * maxX }
  ];

  // palette temporale: vecchi -> grigio/blu tenue, recenti -> arancio
  const colorFromT = (t) => {
    // t in [0,1]
    const lerp = (a,b,u)=>Math.round(a+(b-a)*u);
    const r = lerp(90, 255, t);
    const g = lerp(140,165, t);
    const b = lerp(200,  0, t);
    return `rgba(${r},${g},${b},0.9)`;
  };

  const basePoints = points.filter(p => !p.outlier);
  const outPoints  = points.filter(p =>  p.outlier);

  const baseColors = basePoints.map(p => colorFromT(p.tIdx));

  const fmtPct = v => `${(v * 100).toFixed(0)}%`;
  const fmtPair = (x, y) => `(${(x*100).toFixed(2)}%, ${(y*100).toFixed(2)}%)`;

  const chart = new Chart(ctx, {
    type: 'scatter',
    data: {
      datasets: [
        {
          label: 'Daily returns',
          data: basePoints,
          pointRadius: 2,
          pointBackgroundColor: baseColors,
        },
        {
          label: 'Outliers (> 3σ)',
          data: outPoints,
          pointRadius: 3.5,
          pointBackgroundColor: 'rgba(255,80,80,1)',
          pointBorderColor: 'rgba(255,255,255,0.9)',
          pointBorderWidth: 1,
        },
        {
          label: 'Regression',
          type: 'line',
          data: lineData,
          borderWidth: 2,
          borderColor: 'rgba(255, 165, 0, 0.95)',
          pointRadius: 0,
          fill: false
        }
      ]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      scales: {
        x: {
          title: { display: true, text: 'Market return (GSPC)' },
          ticks: { color: 'white', callback: (v) => fmtPct(v) }
        },
        y: {
          title: { display: true, text: 'Asset return' },
          ticks: { color: 'white', callback: (v) => fmtPct(v) }
        }
      },
      plugins: {
        legend: { labels: { color: 'white' } },
        tooltip: {
          callbacks: {
            label: (ctx) => {
              const p = ctx.raw;
              const tag = p?.outlier ? ' • outlier' : '';
              return `${fmtPair(p.x, p.y)}${tag}`;
            }
          }
        }
      }
    }
  });

  // forza resize per riempire il contenitore
  requestAnimationFrame(() => chart.resize());
  return chart;
}
