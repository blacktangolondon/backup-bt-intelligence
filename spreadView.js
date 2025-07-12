// spreadView.js
// Renders a Spread chart (ratio, lower & upper channels) into #spread-chart using LightweightCharts

/**
 * Fetches spreads.json and draws the selected spread.
 * @param {string} spreadKey  e.g. "FTSE100/EU50"
 */
export async function showSpread(spreadKey) {
  try {
    // 1) Fetch the JSON
    const resp = await fetch('./spreads.json');
    if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
    const spreads = await resp.json();
    const rawData = spreads[spreadKey];
    if (!rawData) {
      console.error(`No data for spread ${spreadKey}`);
      return;
    }

    // 2) Build series arrays
    const ratioSeries = [];
    const lowerSeries = [];
    const upperSeries = [];
    rawData.forEach((entry, idx) => {
      const [ratio, lower, upper] = entry;
      ratioSeries.push({ time: idx, value: ratio });
      lowerSeries.push({ time: idx, value: lower });
      upperSeries.push({ time: idx, value: upper });
    });

    // 3) Prepare container
    const container = document.getElementById('spread-chart');
    if (!container) {
      console.error('#spread-chart container not found');
      return;
    }
    container.innerHTML = ''; // clear previous chart

    // 4) Create chart using global LightweightCharts
    const chart = window.LightweightCharts.createChart(container, {
      width: container.clientWidth,
      height: container.clientHeight,
      layout: {
        backgroundColor: '#ffffff',
        textColor: '#000000',
      },
      grid: {
        vertLines: { color: '#eeeeee' },
        horzLines: { color: '#eeeeee' },
      },
      timeScale: { timeVisible: true }
    });

    // 5) Add line series
    const ratioLine = chart.addLineSeries({ title: 'Spread Ratio' });
    const lowerLine = chart.addLineSeries({ title: 'Lower Channel' });
    const upperLine = chart.addLineSeries({ title: 'Upper Channel' });

    // 6) Set data
    ratioLine.setData(ratioSeries);
    lowerLine.setData(lowerSeries);
    upperLine.setData(upperSeries);

    // 7) Fit content
    chart.timeScale().fitContent();
  } catch (err) {
    console.error('Error in showSpread:', err);
  }
}
