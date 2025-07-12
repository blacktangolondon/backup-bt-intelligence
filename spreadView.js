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
    // Assuming entry is [ratio, lowerChannel, upperChannel]
    // Use an appropriate time value, e.g., index or a proper timestamp if available in your data
    // For now, using index (idx) as time. If your data has actual dates/timestamps, use those.
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
  container.innerHTML = ''; // Clear previous chart if any

  // 4) Create the chart using the global LightweightCharts object
  const chart = window.LightweightCharts.createChart(container, { // CRITICAL FIX: Use window.LightweightCharts
    width: container.clientWidth,
    height: container.clientHeight,
    layout: {
      background: { type: 'solid', color: 'rgb(19, 23, 34)' }, // Darker background to match dashboard
      textColor: 'rgba(255, 152, 0, 1)', // Orange text for visibility
    },
    grid: {
      vertLines:   { color: 'rgba(255, 255, 255, 0.1)' }, // Lighter grid lines for dark background
      horzLines:   { color: 'rgba(255, 255, 255, 0.1)' },
    },
    timeScale: {
      timeVisible: true,
      borderColor: 'rgba(255, 255, 255, 0.2)',
      // alignLabels: true, // Optional: Align labels for better readability
    },
    rightPriceScale: {
        borderColor: 'rgba(255, 255, 255, 0.2)',
    },
    leftPriceScale: {
        visible: false, // Usually not needed for a single spread chart
    },
    crosshair: {
        mode: LightweightCharts.CrosshairMode.Normal,
    },
    // Watermark to indicate the spread (optional)
    watermark: {
        visible: true,
        fontSize: 24,
        horzAlign: 'left',
        vertAlign: 'top',
        color: 'rgba(255, 152, 0, 0.2)',
        text: `Spread: ${spreadKey}`,
    },
  });

  // Optional: Add a legend if needed
  // chart.applyOptions({
  //   paneProperties: {
  //     legend: {
  //       visible: true,
  //       position: 'top-left',
  //       fontSize: 12,
  //       fontFamily: 'Arial',
  //     },
  //   },
  // });


  // 5) Add three line series
  const ratioLine = chart.addLineSeries({
      color: 'rgba(255, 152, 0, 1)', // Orange for the main ratio line
      lineWidth: 2,
      title: 'Spread Ratio',
      // priceLineVisible: true, // Show a horizontal line for the last price
      // lastValueVisible: true, // Show the last value on the price scale
  });
  const lowerLine = chart.addLineSeries({
      color: 'rgba(0, 150, 136, 0.7)', // Green for lower channel
      lineWidth: 1,
      lineStyle: LightweightCharts.LineStyle.Dotted, // Dotted style
      title: 'Lower Channel',
  });
  const upperLine = chart.addLineSeries({
      color: 'rgba(255, 82, 82, 0.7)', // Red for upper channel
      lineWidth: 1,
      lineStyle: LightweightCharts.LineStyle.Dotted, // Dotted style
      title: 'Upper Channel',
  });

  // 6) Set the data for each series
  ratioLine.setData(ratioSeries);
  lowerLine.setData(lowerSeries);
  upperLine.setData(upperSeries);

  // 7) Fit the time scale so all points are visible
  chart.timeScale().fitContent();

  // Resize observer for responsiveness (already in place in your previous code logic)
  const resizeObserver = new ResizeObserver(entries => {
    if (entries.length === 0 || entries[0].target.id !== 'spread-chart') {
      return;
    }
    const { width, height } = entries[0].contentRect;
    chart.resize(width, height);
  });
  resizeObserver.observe(container);

  // Clean up observer when the chart is no longer needed (e.g., when block5 is hidden)
  // This part would typically be handled by a cleanup function if charts are frequently created/destroyed.
  // For now, it will simply observe the container.
}
