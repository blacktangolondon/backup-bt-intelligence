/**
 * charts.js
 * Chart.js helpers (bar, pie, scatter+regression)
 */
export function destroyChartIfExists(canvasId) {
  const existingChart = Chart.getChart(canvasId);
  if (existingChart) existingChart.destroy();
}

export function renderBarChart(canvasId, labels, datasetLabel, dataArr) {
  destroyChartIfExists(canvasId);
  const ctx = document.getElementById(canvasId).getContext("2d");
  return new Chart(ctx, {
    type: 'bar',
    data: {
      labels,
      datasets: [{ label: datasetLabel, data: dataArr, backgroundColor: 'rgba(75,192,192,0.7)' }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      scales: {
        x: { ticks: { display: false } },
        y: { ticks: { color: 'white' } }
      },
      plugins: { legend: { labels: { boxWidth: 0, color: 'white' } } }
    }
  });
}

export function renderPieChart(canvasId, labels, dataArr) {
  destroyChartIfExists(canvasId);
  const ctx = document.getElementById(canvasId).getContext("2d");
  return new Chart(ctx, {
    type: 'pie',
    data: {
      labels,
      datasets: [{ data: dataArr, backgroundColor: [
        'rgba(255,165,0,0.8)','rgba(255,140,0,0.8)','rgba(255,120,0,0.8)'] }]
    },
    options: {
      responsive: true, maintainAspectRatio: false,
      plugins: { legend: { labels: { color: 'white' } } }
    }
  });
}

/**
 * Scatter r_m vs r_i con retta di regressione.
 * points: [{x: rm, y: ri}, ...]
 * line: {a: intercept, b: slope}
 * Assi e tooltip in %.
 */
export function renderScatterWithRegression(canvasId, points, line) {
  destroyChartIfExists(canvasId);
  const ctx = document.getElementById(canvasId).getContext('2d');

  const xs = points.map(p => p.x);
  const minX = Math.min(...xs);
  const maxX = Math.max(...xs);
  const lineData = [
    { x: minX, y: line.a + line.b * minX },
    { x: maxX, y: line.a + line.b * maxX }
  ];

  const fmtPct = v => `${(v * 100).toFixed(0)}%`;
  const fmtPair = (x, y) => `(${(x*100).toFixed(2)}%, ${(y*100).toFixed(2)}%)`;

  return new Chart(ctx, {
    type: 'scatter',
    data: {
      datasets: [
        { label: 'Daily returns', data: points, pointRadius: 2 },
        { label: 'Regression', type: 'line', data: lineData, borderWidth: 2, fill: false }
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
        tooltip: { callbacks: {
          label: (ctx) => fmtPair(ctx.raw.x, ctx.raw.y)
        }}
      }
    }
  });
}
