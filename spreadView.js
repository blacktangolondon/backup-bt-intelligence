// spreadView.js
// Renders a Spread chart (ratio, lower & upper channels) into #spread-chart
// using the global LightweightCharts standalone IIFE build.

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

  // 2) Get the data for selected spread
  const seriesData = spreads[spreadKey];
  if (!seriesData) {
    console.error(`Spread ${spreadKey} not found in JSON`);
    return;
  }

  // 3) Clear previous chart
  const container = document.getElementById('spread-chart');
  if (!container) {
    console.error('#spread-chart container not found');
    return;
  }
  container.innerHTML = '';

  // 4) Create the chart
  const chart = window.LightweightCharts.createChart(container, {
    width: container.clientWidth,
    height: container.clientHeight,
    layout: { backgroundColor: '#ffffff', textColor: '#000000' },
    grid: { vertLines: { visible: false }, horzLines: { visible: true } },
    rightPriceScale: { scaleMargins: { top: 0.1, bottom: 0.1 } },
    timeScale: { timeVisible: true, secondsVisible: false },
  });

  // 5) Watermark for context
  chart.applyOptions({
    watermark: {
      visible: true,
      fontSize: 24,
      horzAlign: 'left',
      vertAlign: 'top',
      color: 'rgba(0,0,0,0.1)',
      text: `Spread: ${spreadKey}`,
    },
  });

  // 6) Prepare series arrays for all 5 lines
  const ratioSeries = seriesData.map(d => ({ time: d[0], value: d[1] }));
  const lower1Series = seriesData.map(d => ({ time: d[0], value: d[2] }));
  const lower2Series = seriesData.map(d => ({ time: d[0], value: d[3] }));
  const upper1Series = seriesData.map(d => ({ time: d[0], value: d[4] }));
  const upper2Series = seriesData.map(d => ({ time: d[0], value: d[5] }));

  // 7) Add five line series to the chart
  const ratioLine = chart.addLineSeries({ title: 'Ratio', lineWidth: 2 });
  ratioLine.setData(ratioSeries);

  const lower1Line = chart.addLineSeries({ title: 'Lower σ', lineWidth: 1 });
  lower1Line.setData(lower1Series);

  const lower2Line = chart.addLineSeries({ title: 'Lower 2σ', lineWidth: 1 });
  lower2Line.setData(lower2Series);

  const upper1Line = chart.addLineSeries({ title: 'Upper σ', lineWidth: 1 });
  upper1Line.setData(upper1Series);

  const upper2Line = chart.addLineSeries({ title: 'Upper 2σ', lineWidth: 1 });
  upper2Line.setData(upper2Series);

  // 8) Fit the time scale and handle resizing
  chart.timeScale().fitContent();
  new ResizeObserver(entries => {
    if (!entries.length || entries[0].target.id !== 'spread-chart') return;
    const { width, height } = entries[0].contentRect;
    chart.resize(width, height);
  }).observe(container);
}
