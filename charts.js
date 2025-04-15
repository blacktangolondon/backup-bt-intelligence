/**
 * charts.js
 * Contains generic chart-rendering functions using Chart.js.
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
      labels: labels,
      datasets: [{
        label: datasetLabel,
        data: dataArr,
        backgroundColor: 'rgba(75,192,192,0.7)'
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      scales: {
        x: { ticks: { display: false } },
        y: { ticks: { color: 'white' } }
      },
      plugins: {
        legend: { labels: { boxWidth: 0, color: 'white' } }
      }
    }
  });
}

export function renderPieChart(canvasId, labels, dataArr) {
  destroyChartIfExists(canvasId);
  const ctx = document.getElementById(canvasId).getContext("2d");
  return new Chart(ctx, {
    type: 'pie',
    data: {
      labels: labels,
      datasets: [{
        data: dataArr,
        backgroundColor: [
          'rgba(255,165,0,0.8)',
          'rgba(255,140,0,0.8)',
          'rgba(255,120,0,0.8)'
        ]
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { labels: { color: 'white' } }
      }
    }
  });
}
