// thematicPortfolio.js

import { parseGap } from "./dashboard.js";
import { renderBarChart, renderPieChart, destroyChartIfExists } from "./charts.js";

export function initThematicPortfolio() {
  const sidebar = document.getElementById('sidebar-list');
  if (!sidebar) return;
  sidebar.addEventListener('click', e => {
    const li = e.target.closest('li'); if (!li) return;
    if (li.textContent.trim().toUpperCase().includes('PORTFOLIO IDEAS')) {
      document.getElementById('main-content').style.display = 'none';
      document.getElementById('portfolio-builder-template').style.display = 'none';
      const tpl = document.getElementById('thematic-portfolio-template'); tpl.style.display = 'block';
      loadThematicPortfolio();
    }
  });
}

function computeGeoDistribution(data) {
  const counts = {};
  data.forEach(d => { counts[d.region] = (counts[d.region] || 0) + 1; });
  const total = Object.values(counts).reduce((a,b)=>a+b,0);
  const labels = Object.keys(counts);
  const arr = labels.map(l=>Math.round(counts[l]/total*100));
  return { labels, data: arr };
}
function computeSectorDistribution(data) {
  const mapping = window.staticData.ETFs;
  const counts = {};
  Object.keys(mapping).forEach(sec=>counts[sec]=0);
  data.forEach(d=>{
    for (const sec of Object.keys(mapping)) if (mapping[sec].includes(d.instrument)) counts[sec]++;
  });
  const labels = [];
  const arr = [];
  Object.entries(counts).forEach(([k,v])=>{ if(v>0){ labels.push(k); arr.push(Math.round(v/data.length*100)); }});
  return { labels, data: arr };
}
function computeFuturesDistribution(data) {
  const map = { Indices:['FTSE 100','CAC 40','DAX40','FTSE MIB','EUROSTOXX50','S&P500','DOW JONES','NASDAQ100','RUSSELL2000'],
                Metals:['GOLD','SILVER','COPPER'], Energy:['WTI','NATURAL GAS'], Agri:['CORN','SOYBEANS'] };
  const counts = {};
  data.forEach(d=>{
    for (const cat in map) if (map[cat].includes(d.instrument)) counts[cat]=(counts[cat]||0)+1;
  });
  const total=Object.values(counts).reduce((a,b)=>a+b,0);
  const labels=Object.keys(counts);
  const arr=labels.map(l=>Math.round(counts[l]/total*100));
  return { labels, data: arr };
}
function computeFXBaseDistribution(data) {
  const counts = {};
  data.forEach(d=>{ const base=d.instrument.slice(0,3); counts[base]=(counts[base]||0)+1; });
  const total=Object.values(counts).reduce((a,b)=>a+b,0);
  const labels=Object.keys(counts);
  const arr=labels.map(l=>Math.round(counts[l]/total*100));
  return { labels, data: arr };
}

function loadThematicPortfolio() {
  const c = document.getElementById('thematic-portfolio-template');
  // build STOCKS
  const stocksData = Object.entries(window.stocksFullData).map(([inst,info])=>{
    const score=parseFloat(info.summaryLeft[0]);
    const corr=parseFloat(info.summaryRight[0]);
    const vol=parseFloat(info.summaryRight[1]);
    const bullish=parseFloat(info.summaryRight[2]);
    const bearish=parseFloat(info.summaryRight[3]);
    const alpha=parseFloat(info.summaryRight[4]);
    const gap=parseGap(info.summaryLeft[3]);
    return { instrument:inst,score,corr,vol,bullish,bearish,alpha,trend:info.summaryLeft[1],approach:info.summaryLeft[2],gap,region:info.region };
  });
  const stk1=stocksData.filter(d=>d.score===100);
  const stk2=stocksData.filter(d=>d.score===100&&d.corr<0.1);
  const stk3=stocksData.filter(d=>d.score===100&&d.vol<1);
  const stk4=stocksData.filter(d=>d.score===100&&d.bullish>1&&d.bearish<1&&d.alpha>1);

  // build ETFS
  const etfData = Object.entries(window.etfFullData).map(([inst,info])=>({ instrument:inst,score:parseFloat(info.summaryLeft[0]),corr:parseFloat(info.summaryRight[0]),vol:parseFloat(info.summaryRight[1]),trend:info.summaryLeft[1],approach:info.summaryLeft[2],gap:parseGap(info.summaryLeft[3]) }));
  const etf1=etfData.filter(d=>d.score===100);
  const etf2=etfData.filter(d=>d.score===100&&d.corr<0.1);
  const etf3=etfData.filter(d=>d.score===100&&d.vol<1);
  const etf4=etfData.filter(d=>d.score===100&&parseFloat(window.etfFullData[d.instrument].summaryRight[2])>1&&parseFloat(window.etfFullData[d.instrument].summaryRight[3])<1&&parseFloat(window.etfFullData[d.instrument].summaryRight[4])>1);

  // FUTURES
  const futData=Object.entries(window.futuresFullData).map(([inst,info])=>({ instrument:inst,score:parseFloat(info.summaryLeft[0]),corr:parseFloat(info.summaryRight[0]),vol:parseFloat(info.summaryRight[1]),trend:info.summaryLeft[1],approach:info.summaryLeft[2],gap:parseGap(info.summaryLeft[3]) }));
  const fut1=futData.filter(d=>Math.abs(d.score)===100);
  const fut2=fut1.filter(d=>d.corr<0.1);
  const fut3=fut1.filter(d=>d.vol<1);

  // FX
  const fxData=Object.entries(window.fxFullData).map(([inst,info])=>({ instrument:inst,score:parseFloat(info.summaryLeft[0]),volatility:parseFloat(info.summaryRight[1]),trend:info.summaryLeft[1],approach:info.summaryLeft[3],gap:parseGap(info.summaryLeft[2]) }));
  const fx1=fxData.filter(d=>d.score>=75||d.score<=-75);

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
      ${renderSection('Low S&P500 Correlation', ['Instrument','Score','Correlation','Trend','Approach','Gap to Peak','Key Area'], stk2, ['corr'], 'stock_corr_bar','stock_corr_pie', computeGeoDistribution)}
      ${renderSection('Low Volatility', ['Instrument','Score','Volatility','Trend','Approach','Gap to Peak','Key Area'], stk3, ['vol'], 'stock_vol_bar','stock_vol_pie', computeGeoDistribution)}
      ${renderSection('Trend Plus', ['Instrument','Score','Bullish Alpha','Bearish Alpha','Alpha Strength','Trend','Approach','Gap to Peak','Key Area'], stk4, ['bullish','bearish','alpha'], 'stock_plus_bar','', null)}
    </div>
    <div class="portfolio-tab-content" data-category="etfs">
      ${renderSection('Trend Following', ['Instrument','Score','Trend','Approach','Gap to Peak'], etf1, ['gap'], 'etf1_bar','etf1_pie', computeSectorDistribution)}
      ${renderSection('Low Correlation', ['Instrument','Score','Correlation','Trend','Approach','Gap to Peak'], etf2, ['corr'], 'etf2_bar','etf2_pie', computeSectorDistribution)}
      ${renderSection('Low Volatility', ['Instrument','Score','Volatility','Trend','Approach','Gap to Peak'], etf3, ['vol'], 'etf3_bar','etf3_pie', computeSectorDistribution)}
      ${renderSection('Trend Plus', ['Instrument','Score','Bullish Alpha','Bearish Alpha','Alpha Strength'], etf4, ['bullish','bearish','alpha'], 'etf4_bar','etf4_pie', computeSectorDistribution)}
    </div>
    <div class="portfolio-tab-content" data-category="futures">
      ${renderSection('Trend Following', ['Instrument','Score','Trend','Approach','Gap to Peak'], fut1, ['gap'], 'fut1_bar','fut1_pie', computeFuturesDistribution)}
      ${renderSection('Low Correlation', ['Instrument','Score','Correlation','Trend','Approach','Gap to Peak'], fut2, ['corr'], 'fut2_bar','fut2_pie', computeFuturesDistribution)}
      ${renderSection('Low Volatility', ['Instrument','Score','Volatility','Trend','Approach','Gap to Peak'], fut3, ['vol'], 'fut3_bar','fut3_pie', computeFuturesDistribution)}
    </div>
    <div class="portfolio-tab-content" data-category="fx">
      ${renderSection('Trend Following', ['Instrument','Score','Trend','Approach','Gap to Peak'], fx1, ['gap'], 'fx1_bar','fx1_pie', computeFXBaseDistribution)}
    </div>
  </div>
  `;

  // tabs
  c.querySelectorAll('.portfolio-tab').forEach(btn=>btn.addEventListener('click',()=>{
    c.querySelectorAll('.portfolio-tab').forEach(b=>b.classList.remove('active'));
    c.querySelectorAll('.portfolio-tab-content').forEach(sec=>sec.classList.remove('active'));
    btn.classList.add('active');
    c.querySelector(`.portfolio-tab-content[data-category="${btn.dataset.target}"]`).classList.add('active');
  }));

  // chart rendering
  stk1.length && drawCharts('stock_tf_bar','stock_tf_pie', stk1.map(d=>d.instrument), stk1.map(d=>d.gap), computeGeoDistribution(stk1));
  stk2.length && drawCharts('stock_corr_bar','stock_corr_pie', stk2.map(d=>d.instrument), stk2.map(d=>d.corr), computeGeoDistribution(stk2));
  stk3.length && drawCharts('stock_vol_bar','stock_vol_pie', stk3.map(d=>d.instrument), stk3.map(d=>d.vol), computeGeoDistribution(stk3));
  stk4.length && drawBarOnly('stock_plus_bar', stk4.map(d=>d.instrument), stk4.map(d=>d.bullish));

  etf1.length && drawCharts('etf1_bar','etf1_pie', etf1.map(d=>d.instrument), etf1.map(d=>d.gap), computeSectorDistribution(etf1));
  etf2.length && drawCharts('etf2_bar','etf2_pie', etf2.map(d=>d.instrument), etf2.map(d=>d.corr), computeSectorDistribution(etf2));
  etf3.length && drawCharts('etf3_bar','etf3_pie', etf3.map(d=>d.instrument), etf3.map(d=>d.vol), computeSectorDistribution(etf3));
  etf4.length && drawBarOnly('etf4_bar', etf4.map(d=>d.instrument), etf4.map(d=>d.bullish));

  fut1.length && drawCharts('fut1_bar','fut1_pie', fut1.map(d=>d.instrument), fut1.map(d=>d.gap), computeFuturesDistribution(fut1));
  fut2.length && drawCharts('fut2_bar','fut2_pie', fut2.map(d=>d.instrument), fut2.map(d=>d.corr), computeFuturesDistribution(fut2));
  fut3.length && drawCharts('fut3_bar','fut3_pie', fut3.map(d=>d.instrument), fut3.map(d=>d.vol), computeFuturesDistribution(fut3));

  fx1.length && drawCharts('fx1_bar','fx1_pie', fx1.map(d=>d.instrument), fx1.map(d=>d.gap), computeFXBaseDistribution(fx1));
}

// helpers
function renderSection(title, headers, rows, valueFields, barId, pieId, distFn) {
  return `
  <div class="thematic-portfolio-section">
    <h2>${title}</h2>
    <div class="thematic-portfolio-table-container">
      <table class="thematic-portfolio-table">
        <thead><tr>${headers.map(h=>`<th>${h}</th>`).join('')}</tr></thead>
        <tbody>${rows.map(r=>`<tr>${[...fieldsToCells(r, headers)].join('')}</tr>`).join('')}</tbody>
      </table>
    </div>
    <div class="portfolio-charts">
      <div class="portfolio-chart"><canvas id="${barId}"></canvas></div>
      <div class="portfolio-chart"><canvas id="${pieId}"></canvas></div>
    </div>
  </div>
  `;
}
function fieldsToCells(r, headers) {
  const vals = Object.values(r);
  return vals.map(v=>`<td>${v}</td>`);
}
function drawCharts(barId, pieId, labels, dataArr, distribution) {
  destroyChartIfExists(barId);
  renderBarChart(barId, labels, '', dataArr);
  if (distribution) {
    destroyChartIfExists(pieId);
    renderPieChart(pieId, distribution.labels, distribution.data);
  }
}
function drawBarOnly(barId, labels, dataArr) {
  destroyChartIfExists(barId);
  renderBarChart(barId, labels, '', dataArr);
}
