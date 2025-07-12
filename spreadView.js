// spreadView.js
import { createChart } from 'lightweight-charts';

/**
 * Renders a Spread chart (ratio, lower & upper channels) into #spread-chart.
 * @param {string} spreadKey  e.g. "FTSE100/EU50"
 */
export async function showSpread(spreadKey) {
  // 1) fetch the JSON
  const resp = await fetch('./spreads.json');
  if (!resp.ok) {
    console.error(`Failed to load spreads.json: ${resp.status}`);
    return;
  }
  const spreads = await resp.json();
  const rawData = spreads[spreadKey];
  if (!rawData) {
    console.error(`No data for spread ${spreadKey}`);
    return;
  }

  // 2) build the three series
  const ratioSeries = [];
  const lowerSeries = [];
  const upperSeries = [];
  rawData.forEach((triple, idx) => {
    ratioSeries.push({ time: idx,      value: triple[0] });
    lowerSeries.push({ time: idx,      value: triple[1] });
    upperSeries.push({ time: idx,      value: triple[2] });
  });

  // 3) clear old chart
  const container = document.getElementById('spread-chart');
  container.innerHTML = '';

  // 4) create new chart
  const chart = createChart(container, {
    width: container.clientWidth,
    height: container.clientHeight,
    layout: {
      backgroundColor: '#ffffff',
      textColor: '#000',
    },
    grid: {
      vertLines: { color: '#eee' },
      horzLines: { color: '#eee' },
    },
    timeScale: { timeVisible: true }
  });

  // 5) add three line series
  chart.addLineSeries({ title: 'Ratio'  }).setData(ratioSeries);
  chart.addLineSeries({ title: 'Lower'  }).setData(lowerSeries);
  chart.addLineSeries({ title: 'Upper'  }).setData(upperSeries);

  // 6) fit
  chart.timeScale().fitContent();
}
