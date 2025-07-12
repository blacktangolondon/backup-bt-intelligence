// spreadView.js
// Renders a Spread chart (ratio, lower & upper channels) into #spread-chart
// using the global LightweightCharts object loaded via the standalone script.

/**
 * Fetches spreads.json and draws the selected spread.
 * @param {string} spreadKey  e.g. "FTSE100/EU50"
 */
export async function showSpread(spreadKey) {
  // 1) Fetch the JSON
  const resp = await fetch('./spreads.json');
  if (!resp.ok) {
    console.error(`Failed to load spreads.json: HTTP ${resp.status}`);
    return;
  }
  const spreads = await resp.json();
  const rawData = spreads[spreadKey];
  if (!rawData) {
    console.error(`No data for spread ${spreadKey}`);
    return;
  }

  // 2) Transform into three series arrays
  const ratioSeries = [];
  const lowerSeries = [];
  const upperSeries = [];
  rawData.forEach((entry, idx) => {
    ratioSeries.push({ time: idx, value: entry[0] });
    lowerSeries.push({ time: idx, value: entry[1] });
    upperSeries.push({ time: idx, value: entry[2] });
  });

  // 3) Get the container and clear it
  const container = document.getElementById('spread-chart');
  if (!container) {
    console.error('#spread-chart container not found');
    return;
  }
  container.innerHTML = '';

  // 4) Create the chart exactly as per docs :contentReference[oaicite:0]{index=0}
  const chart = LightweightCharts.createChart(container, {
    width: container.clientWidth,
    height: container.clientHeight,
    layout: {
      background: { type: 'solid', color: 'white' },
      textColor: 'black',
    },
    grid: {
      vertLines:   { color: 'rgba(0, 0, 0, 0.1)' },
      horzLines:   { color: 'rgba(0, 0, 0, 0.1)' },
    },
    timeScale: {
      timeVisible: true,
      borderColor: 'rgba(0, 0, 0, 0.2)',
    },
  });

  // 5) Add three line series as per docs
  const ratioLine = chart.addLineSeries({ title: 'Spread Ratio' });
  const lowerLine = chart.addLineSeries({ title: 'Lower Channel' });
  const upperLine = chart.addLineSeries({ title: 'Upper Channel' });

  // 6) Set the data for each series
  ratioLine.setData(ratioSeries);
  lowerLine.setData(lowerSeries);
  upperLine.setData(upperSeries);

  // 7) Fit the time scale so all points are visible
  chart.timeScale().fitContent();

  // 8) (Optional) handle container resize
  window.addEventListener('resize', () => {
    chart.applyOptions({
      width: container.clientWidth,
      height: container.clientHeight,
    });
    chart.timeScale().fitContent();
  });
}
