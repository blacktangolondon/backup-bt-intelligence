// thematicPortfolio.js

import { parseGap } from "./dashboard.js";
import { staticData } from "./sidebar.js";
import { renderBarChart, renderPieChart, destroyChartIfExists } from "./charts.js";

export function initThematicPortfolio() {
  const sidebar = document.getElementById('sidebar-list');
  if (!sidebar) return;
  sidebar.addEventListener('click', e => {
    const li = e.target.closest('li');
    if (!li) return;
    if (li.textContent.trim().toUpperCase() === 'PORTFOLIO IDEAS') {
      document.getElementById('main-content').style.display = 'none';
      document.getElementById('portfolio-builder-template').style.display = 'none';
      const tpl = document.getElementById('thematic-portfolio-template');
      tpl.style.display = 'block';
      loadThematicPortfolio();
    }
  });
}

// --- Distribution helper functions ---
function computeGeoDistribution(data) {
  const counts = {};
  data.forEach(d => {
    counts[d.region] = (counts[d.region] || 0) + 1;
  });
  const total = Object.values(counts).reduce((a, b) => a + b, 0);
  const labels = Object.keys(counts);
  const arr = labels.map(l => Math.round((counts[l] / total) * 100));
  return { labels, data: arr };
}

function computeSectorDistribution(data) {
  const mapping = staticData.ETFs;
  const counts = {};
  Object.keys(mapping).forEach(sec => counts[sec] = 0);
  data.forEach(d => {
    for (const sec of Object.keys(mapping)) {
      if (mapping[sec].includes(d.instrument)) {
        counts[sec]++;
        break;
      }
    }
  });
  const labels = [];
  const arr = [];
  Object.entries(counts).forEach(([k, v]) => {
    if (v > 0) {
      labels.push(k);
      arr.push(Math.round((v / data.length) * 100));
    }
  });
  return { labels, data: arr };
}

function computeFuturesDistribution(data) {
  const groups = {
    Indices: ['FTSE 100','CAC 40','DAX40','FTSE MIB','EUROSTOXX50','S&P500','DOW JONES','NASDAQ100','RUSSELL2000'],
    Metals: ['GOLD','SILVER','COPPER'],
    Energy: ['WTI','NATURAL GAS'],
    Agricultural: ['CORN','SOYBEANS']
  };
  const counts = {};
  data.forEach(d => {
    for (const cat in groups) {
      if (groups[cat].includes(d.instrument)) {
        counts[cat] = (counts[cat] || 0) + 1;
      }
    }
  });
  const total = Object.values(counts).reduce((a, b) => a + b, 0);
  const labels = Object.keys(counts);
  const arr = labels.map(l => Math.round((counts[l] / total) * 100));
  return { labels, data: arr };
}

function computeFXBaseDistribution(data) {
  const counts = {};
  data.forEach(d => {
    const base = d.instrument.slice(0, 3);
    counts[base] = (counts[base] || 0) + 1;
  });
  const total = Object.values(counts).reduce((a, b) => a + b, 0);
  const labels = Object.keys(counts);
  const arr = labels.map(l => Math.round((counts[l] / total) * 100));
  return { labels, data: arr };
}

// --- Main renderer ---
function loadThematicPortfolio() {
  const c = document.getElementById('thematic-portfolio-template');
  // prepare raw data arrays
  const stocksData = Object.entries(window.stocksFullData).map(([inst, info]) => ({
    instrument: inst,
    score: parseFloat(info.summaryLeft[0]),
    corr: parseFloat(info.summaryRight[0]),
    vol: parseFloat(info.summaryRight[1]),
    bullish: parseFloat(info.summaryRight[2]),
    bearish: parseFloat(info.summaryRight[3]),
    alpha: parseFloat(info.summaryRight[4]),
    trend: info.summaryLeft[1],
    approach: info.summaryLeft[2],
    gap: parseGap(info.summaryLeft[3]),
    region: info.region
  }));
  const etfData = Object.entries(window.etfFullData).map(([inst, info]) => ({
    instrument: inst,
    score: parseFloat(info.summaryLeft[0]),
    corr: parseFloat(info.summaryRight[0]),
    vol: parseFloat(info.summaryRight[1]),
    bullish: parseFloat(info.summaryRight[2]),
    bearish: parseFloat(info.summaryRight[3]),
    alpha: parseFloat(info.summaryRight[4]),
    trend: info.summaryLeft[1],
    approach: info.summaryLeft[2],
    gap: parseGap(info.summaryLeft[3])
  }));
  const futuresData = Object.entries(window.futuresFullData).map(([inst, info]) => ({
    instrument: inst,
    score: parseFloat(info.summaryLeft[0]),
    corr: parseFloat(info.summaryRight[0]),
    vol: parseFloat(info.summaryRight[1]),
    trend: info.summaryLeft[1],
    approach: info.summaryLeft[2],
    gap: parseGap(info.summaryLeft[3])
  }));
  const fxData = Object.entries(window.fxFullData).map(([inst, info]) => ({
    instrument: inst,
    score: parseFloat(info.summaryLeft[0]),
    volatility: parseFloat(info.summaryRight[1]),
    trend: info.summaryLeft[1],
    approach: info.summaryLeft[3],
    gap: parseGap(info.summaryLeft[2])
  }));

  // apply filters for each theme
  const stk1 = stocksData.filter(d => d.score === 100);
  const stk2 = stk1.filter(d => d.corr < 0.1);
  const stk3 = stk1.filter(d => d.vol < 1);
  const stk4 = stk1.filter(d => d.bullish > 1 && d.bearish < 1 && d.alpha > 1);

  const etf1 = etfData.filter(d => d.score === 100);
  const etf2 = etf1.filter(d => d.corr < 0.1);
  const etf3 = etf1.filter(d => d.vol < 1);
  const etf4 = etf1.filter(d => d.bullish > 1 && d.bearish < 1 && d.alpha > 1);

  const fut1 = futuresData.filter(d => Math.abs(d.score) === 100);
  const fut2 = fut1.filter(d => d.corr < 0.1);
  const fut3 = fut1.filter(d => d.vol < 1);

  const fx1 = fxData.filter(d => d.score >= 75 || d.score <= -75);

  // assemble HTML
  c.innerHTML = `
  <div class="thematic-portfolio-nav">
    <button class="portfolio-tab active" data-target="stocks">STOCKS</button>
    <button class="portfolio-tab" data-target="etfs">ETFS</button>
    <button class="portfolio-tab" data-target="futures">FUTURES</button>
    <button class="portfolio-tab" data-target="fx">FX</button>
  </div>
  <div class="thematic-portfolio-contents">
    <div class="portfolio-tab-content active" data-category="stocks">
      ${renderSection('Trend Following', ['Instrument','Score','Trend','Approach','Gap to Peak','Key Area'], stk1, ['gap'], 'stock_tf_bar','stock_tf_pie', computeGeoDistribution)}
      ${renderSection('Low Correlation', ['Instrument','Score','Correlation','Trend','Approach','Gap to Peak','Key Area'], stk2, ['corr'], 'stock_corr_bar','stock_corr_pie', computeGeoDistribution)}
      ${renderSection('Low Volatility', ['Instrument','Score','Volatility','Trend','Approach','Gap to Peak','Key Area'], stk3, ['vol'], 'stock_vol_bar','stock_vol_pie', computeGeoDistribution)}
      ${renderSection('Trend Plus', ['Instrument','Score','Bullish Alpha','Bearish Alpha','Alpha Strength','Trend','Approach','Gap to Peak','Key Area'], stk4, ['bullish'], 'stock_plus_bar','', null)}
    </div>
    <div class="portfolio-tab-content" data-category="etfs">
      ${renderSection('Trend Following', ['Instrument','Score','Trend','Approach','Gap to Peak','Key Area'], etf1, ['gap'], 'etf1_bar','etf1_pie', computeSectorDistribution)}
      ${renderSection('Low Correlation', ['Instrument','Score','Correlation','Trend','Approach','Gap to Peak','Key Area'], etf2, ['corr'], 'etf2_bar','etf2_pie', computeSectorDistribution)}
      ${renderSection('Low Volatility', ['Instrument','Score','Volatility','Trend','Approach','Gap to Peak','Key Area'], etf3, ['vol'], 'etf3_bar','etf3_pie', computeSectorDistribution)}
      ${renderSection('Trend Plus', ['Instrument','Score','Bullish Alpha','Bearish Alpha','Alpha Strength'], etf4, ['bullish'], 'etf4_bar','etf4_pie', computeSectorDistribution)}
    </div>
    <div class="portfolio-tab-content" data-category="futures">
      ${renderSection('Trend Following', ['Instrument','Score','Trend','Approach','Gap to Peak','Key Area'], fut1, ['gap'], 'fut1_bar','fut1_pie', computeFuturesDistribution)}
      ${renderSection('Low Correlation', ['Instrument','Score','Correlation','Trend','Approach','Gap to Peak','Key Area'], fut2, ['corr'], 'fut2_bar','fut2_pie', computeFuturesDistribution)}
      ${renderSection('Low Volatility', ['Instrument','Score','Volatility','Trend','Approach','Gap to Peak','Key Area'], fut3, ['vol'], 'fut3_bar','fut3_pie', computeFuturesDistribution)}
    </div>
    <div class="portfolio-tab-content" data-category="fx">
      ${renderSection('Trend Following', ['Instrument','Score','Trend','Approach','Gap to Peak','Key Area'], fx1, ['gap'], 'fx1_bar','fx1_pie', computeFXBaseDistribution)}
    </div>
  </div>
  `;

  // tab switching
  c.querySelectorAll('.portfolio-tab').forEach(btn => btn.addEventListener('click', () => {
    c.querySelectorAll('.portfolio-tab').forEach(b => b.classList.remove('active'));
    c.querySelectorAll('.portfolio-tab-content').forEach(sec => sec.classList.remove('active'));
    btn.classList.add('active');
    const target = btn.dataset.target;
    c.querySelector(`.portfolio-tab-content[data-category="${target}"]`).classList.add('active');
  }));

  // render charts
  if (stk1.length) drawCharts('stock_tf_bar','stock_tf_pie', stk1.map(d=>d.instrument), stk1.map(d=>d.gap), computeGeoDistribution(stk1));
  if (stk2.length) drawCharts('stock_corr_bar','stock_corr_pie', stk2.map(d=>d.instrument), stk2.map(d=>d.corr), computeGeoDistribution(stk2));
  if (stk3.length) drawCharts('stock_vol_bar','stock_vol_pie', stk3.map(d=>d.instrument), stk3.map(d=>d.vol), computeGeoDistribution(stk3));
  if (stk4.length) drawBarOnly('stock_plus_bar', stk4.map(d=>d.instrument), stk4.map(d=>d.bullish));

  if (etf1.length) drawCharts('etf1_bar','etf1_pie', etf1.map(d=>d.instrument), etf1.map(d=>d.gap), computeSectorDistribution(etf1));
  if (etf2.length) drawCharts('etf2_bar','etf2_pie', etf2.map(d=>d.instrument), etf2.map(d=>d.corr), computeSectorDistribution(etf2));
  if (etf3.length) drawCharts('etf3_bar','etf3_pie', etf3.map(d=>d.instrument), etf3.map(d=>d.vol), computeSectorDistribution(etf3));
  if (etf4.length) drawCharts('etf4_bar','etf4_pie', etf4.map(d=>d.instrument), etf4.map(d=>d.bullish), computeSectorDistribution(etf4));

  if (fut1.length) drawCharts('fut1_bar','fut1_pie', fut1.map(d=>d.instrument), fut1.map(d=>d.gap), computeFuturesDistribution(fut1));
  if (fut2.length) drawCharts('fut2_bar','fut2_pie', fut2.map(d=>d.instrument), fut2.map(d=>d.corr), computeFuturesDistribution(fut2));
  if (fut3.length) drawCharts('fut3_bar','fut3_pie', fut3.map(d=>d.instrument), fut3.map(d=>d.vol), computeFuturesDistribution(fut3));

  if (fx1.length) drawCharts('fx1_bar','fx1_pie', fx1.map(d=>d.instrument), fx1.map(d=>d.gap), computeFXBaseDistribution(fx1));
}

// --- Helpers for rendering sections and charts ---
function renderSection(title, headers, rows, valueFields, barId, pieId, distFn) {
  const ths = headers.map(h => `<th>${h}</th>`).join('');
  const trs = rows.map(r => `<tr>${headers.map(h => `<td>${r[h.toLowerCase()] ?? ''}</td>`).join('')}</tr>`).join('');
  return `
    <div class="thematic-portfolio-section">
      <h2>${title}</h2>
      <div class="thematic-portfolio-table-container">
        <table class="thematic-portfolio-table">
          <thead><tr>${ths}</tr></thead>
          <tbody>${trs}</tbody>
        </table>
      </div>
      <div class="portfolio-charts">
        <div class="portfolio-chart"><canvas id="${barId}"></canvas></div>
        ${pieId ? `<div class="portfolio-chart"><canvas id="${pieId}"></canvas></div>` : ''}
      </div>
    </div>
  `;
}

function drawCharts(barId, pieId, labels, dataArr, distribution) {
  destroyChartIfExists(barId);
  renderBarChart(barId, labels, '', dataArr);
  if (pieId && distribution) {
    destroyChartIfExists(pieId);
    renderPieChart(pieId, distribution.labels, distribution.data);
  }
}

function drawBarOnly(barId, labels, dataArr) {
  destroyChartIfExists(barId);
  renderBarChart(barId, labels, '', dataArr);
}
