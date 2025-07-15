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

  // 2) Transform into five series arrays:
  //    [ date, ratio, lower1, lower2, upper1, upper2 ]
  const ratioSeries = [];
  const lower1Series = [];
  const lower2Series = [];
  const upper1Series = [];
  const upper2Series = [];

  rawData.forEach(entry => {
    const date    = entry[0]; // "YYYY-MM-DD"
    const ratio   = entry[1];
    const lower1  = entry[2];
    const lower2  = entry[3];
    const upper1  = entry[4];
    const upper2  = entry[5];

    ratioSeries.push ({ time: date, value: ratio  });
    lower1Series.push({ time: date, value: lower1 });
    lower2Series.push({ time: date, value: lower2 });
    upper1Series.push({ time: date, value: upper1 });
    upper2Series.push({ time: date, value: upper2 });
  });

  // 3) Get the container and clear it
  const container = document.getElementById('spread-chart');
  if (!container) {
    console.error('#spread-chart container not found');
    return;
  }
  container.innerHTML = '';

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
      timeVisible: true,
      borderColor: 'rgba(255,255,255,0.2)',
    },
    rightPriceScale: {
      borderColor: 'rgba(255,255,255,0.2)',
    },
    leftPriceScale: {
      visible: true,
    },
    crosshair: {
      mode: window.LightweightCharts.CrosshairMode.Normal,
    },
  });

  // 5) Optional watermark
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

  // 6) Add five line series
  const ratioLine = chart.addSeries(
    window.LightweightCharts.LineSeries,
    {
      color: 'rgba(255, 152, 0, 1)',
      lineWidth: 2,
      title: 'Ratio',
    }
  );
  const lower1Line = chart.addSeries(
    window.LightweightCharts.LineSeries,
    {
      color: 'rgba(0, 150, 136, 0.7)',
      lineWidth: 1,
      lineStyle: window.LightweightCharts.LineStyle.Dotted,
      title: 'Lower 1σ',
    }
  );
  const lower2Line = chart.addSeries(
    window.LightweightCharts.LineSeries,
    {
      color: 'rgba(0, 150, 136, 0.4)',
      lineWidth: 1,
      lineStyle: window.LightweightCharts.LineStyle.Dotted,
      title: 'Lower 2σ',
    }
  );
  const upper1Line = chart.addSeries(
    window.LightweightCharts.LineSeries,
    {
      color: 'rgba(255, 82, 82, 0.7)',
      lineWidth: 1,
      lineStyle: window.LightweightCharts.LineStyle.Dotted,
      title: 'Upper 1σ',
    }
  );
  const upper2Line = chart.addSeries(
    window.LightweightCharts.LineSeries,
    {
      color: 'rgba(255, 82, 82, 0.4)',
      lineWidth: 1,
      lineStyle: window.LightweightCharts.LineStyle.Dotted,
      title: 'Upper 2σ',
    }
  );

  // 7) Set the data for each series
  ratioLine.setData(ratioSeries);
  lower1Line.setData(lower1Series);
  lower2Line.setData(lower2Series);
  upper1Line.setData(upper1Series);
  upper2Line.setData(upper2Series);

  // 8) Fit the time scale and observe resizes
  chart.timeScale().fitContent();
  new ResizeObserver(entries => {
    if (!entries.length || entries[0].target.id !== 'spread-chart') return;
    const { width, height } = entries[0].contentRect;
    chart.resize(width, height);
  }).observe(container);
}
