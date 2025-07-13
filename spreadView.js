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
  const rawData = spreads[spreadKey];
  if (!rawData) {
    console.error(`No data for spread ${spreadKey}`);
    return;
  }

  // 2) Transform into three series arrays
  //    Each entry is now [ "YYYY-MM-DD", ratio, lowerChannel, upperChannel ]
  const ratioSeries = [];
  const lowerSeries = [];
  const upperSeries = [];
  rawData.forEach(entry => {
    const date = entry[0];         // e.g. "2024-09-09"
    const ratio = entry[1];
    const lower = entry[2];
    const upper = entry[3];
    ratioSeries.push({ time: date, value: ratio });
    lowerSeries.push({ time: date, value: lower });
    upperSeries.push({ time: date, value: upper });
  });

  // 3) Get the container and clear it
  const container = document.getElementById('spread-chart');
  if (!container) {
    console.error('#spread-chart container not found');
    return;
  }
  container.innerHTML = ''; // Clear previous chart if any

  // 4) Create the chart using the global LightweightCharts object
  const chart = window.LightweightCharts.createChart(container, {
    width: container.clientWidth,
    height: container.clientHeight,
    layout: {
      background: { type: 'solid', color: 'rgb(19, 23, 34)' },
      textColor: 'rgba(255, 152, 0, 1)',
    },
    grid: {
      vertLines: { color: 'rgba(255,255,255,0.1)' },
      horzLines: { color: 'rgba(255,255,255,0.1)' },
    },
    timeScale: {
      timeVisible: true,             // keep X-axis labels visible
      borderColor: 'rgba(255,255,255,0.2)',
    },
    rightPriceScale: {
      borderColor: 'rgba(255,255,255,0.2)',
    },
    leftPriceScale: {
      visible: true,                 // keep Y-axis labels visible
    },
    crosshair: {
      mode: LightweightCharts.CrosshairMode.Normal,
    },
  });

  // apply a watermark to indicate the spread (optional)
  chart.applyOptions({
    watermark: {
      visible: true,
      fontSize: 24,
      horzAlign: 'left',
      vertAlign: 'top',
      color: 'rgba(255,152,0,0.2)',
      text: `Spread: ${spreadKey}`,
    },
  });

  // 5) Add three line series using the v5 IIFE API
  const ratioLine = chart.addSeries(
    window.LightweightCharts.LineSeries,
    {
      color: 'rgba(255, 152, 0, 1)', // Orange for the main ratio line
      lineWidth: 2,
      title: 'Spread Ratio',
    }
  );
  const lowerLine = chart.addSeries(
    window.LightweightCharts.LineSeries,
    {
      color: 'rgba(0, 150, 136, 0.7)', // Green for lower channel
      lineWidth: 1,
      lineStyle: LightweightCharts.LineStyle.Dotted,
      title: 'Lower Channel',
    }
  );
  const upperLine = chart.addSeries(
    window.LightweightCharts.LineSeries,
    {
      color: 'rgba(255, 82, 82, 0.7)', // Red for upper channel
      lineWidth: 1,
      lineStyle: LightweightCharts.LineStyle.Dotted,
      title: 'Upper Channel',
    }
  );

  // 6) Set the data for each series
  ratioLine.setData(ratioSeries);
  lowerLine.setData(lowerSeries);
  upperLine.setData(upperSeries);

  // 7) Fit the time scale so all points are visible
  chart.timeScale().fitContent();

  // 8) Observe resizes for responsiveness
  const resizeObserver = new ResizeObserver(entries => {
    if (!entries.length || entries[0].target.id !== 'spread-chart') {
      return;
    }
    const { width, height } = entries[0].contentRect;
    chart.resize(width, height);
  });
  resizeObserver.observe(container);
}
