// thematicPortfolio.js

import { parseGap } from "./dashboard.js";
import { renderBarChart, renderPieChart, destroyChartIfExists } from "./charts.js";
import { staticData } from "./sidebar.js";

// field mapping from table headers to object properties
const headerKeyMap = {
  "Instrument": "instrument",
  "Score": "score",
  "Trend": "trend",
  "Approach": "approach",
  "Gap to Peak": "gap",
  "Key Area": "keyArea",
  "Correlation": "corr",
  "Volatility": "vol",
  "Bullish Alpha": "bullish",
  "Bearish Alpha": "bearish",
  "Alpha Strength": "alpha"
};

export function initThematicPortfolio() {
  const sidebar = document.getElementById('sidebar-list');
  if (!sidebar) return;
  sidebar.addEventListener('click', e => {
    const li = e.target.closest('li'); if (!li) return;
    if (li.textContent.trim().toUpperCase() === 'PORTFOLIO IDEAS') {
      document.getElementById('main-content').style.display = 'none';
      document.getElementById('portfolio-builder-template').style.display = 'none';
      const tpl = document.getElementById('thematic-portfolio-template'); tpl.style.display = 'block';
      loadThematicPortfolio();
    }
  });
}

// Distribution helpers
function computeGeoDistribution(data) {
  const counts = {};
  data.forEach(d => { counts[d.region] = (counts[d.region] || 0) + 1; });
  const total = Object.values(counts).reduce((a,b)=>a+b,0);
  const labels = Object.keys(counts);
  const arr = labels.map(l=>Math.round(counts[l]/total*100));
  return { labels, data: arr };
}
function computeSectorDistribution(data) {
  const mapping = staticData.ETFs;
  const counts = {};
  Object.keys(mapping).forEach(sec=>counts[sec]=0);
  data.forEach(d=>{
    for (const sec in mapping) {
      if (mapping[sec].includes(d.instrument)) {
        counts[sec]++;
        break;
      }
    }
  });
  const labels = [], arr = [];
  Object.entries(counts).forEach(([k,v])=>{
    if(v>0) { labels.push(k); arr.push(Math.round(v/data.length*100)); }
  });
  return { labels, data: arr };
}
function computeFuturesDistribution(data) {
  const map = {
    Indices:['FTSE 100','CAC 40','DAX40','FTSE MIB','EUROSTOXX50','S&P500','DOW JONES','NASDAQ100','RUSSELL2000'],
    Metals:['GOLD','SILVER','COPPER'],
    Energy:['WTI','NATURAL GAS'],
    Agri:['CORN','SOYBEANS']
  };
  const counts = {};
  data.forEach(d=>{
    for (const cat in map) {
      if (map[cat].includes(d.instrument)) {
        counts[cat] = (counts[cat]||0)+1;
        break;
      }
    }
  });
  const total = Object.values(counts).reduce((a,b)=>a+b,0);
  const labels = Object.keys(counts);
  const arr = labels.map(l=>Math.round(counts[l]/total*100));
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

  // Prepare data sets
  const stocksData = Object.entries(window.stocksFullData).map(([inst,info])=>({
    instrument: inst,
    score: parseFloat(info.summaryLeft[0]),
    trend: info.summaryLeft[1],
    approach: info.summaryLeft[2],
    gap: parseGap(info.summaryLeft[3]),
    keyArea: info.summaryLeft[4],
    corr: parseFloat(info.summaryRight[0]),
    vol: parseFloat(info.summaryRight[1]),
    bullish: parseFloat(info.summaryRight[2]),
    bearish: parseFloat(info.summaryRight[3]),
    alpha: parseFloat(info.summaryRight[4]),
    region: info.region
  }));
  const stk1 = stocksData.filter(d=>d.score===100);
  const stk2 = stk1.filter(d=>d.corr<0.1);
  const stk3 = stk1.filter(d=>d.vol<1);
  const stk4 = stk1.filter(d=>d.bullish>1 && d.bearish<1 && d.alpha>1);

  // ETF data
  const etfData = Object.entries(window.etfFullData).map(([inst,info])=>({
    instrument: inst,
    score: parseFloat(info.summaryLeft[0]),
    trend: info.summaryLeft[1],
    approach: info.summaryLeft[2],
    gap: parseGap(info.summaryLeft[3]),
    corr: parseFloat(info.summaryRight[0]),
    vol: parseFloat(info.summaryRight[1]),
    bullish: parseFloat(info.summaryRight[2]),
    bearish: parseFloat(info.summaryRight[3]),
    alpha: parseFloat(info.summaryRight[4])
  }));
  const etf1 = etfData.filter(d=>d.score===100);
  const etf2 = etf1.filter(d=>d.corr<0.1);
  const etf3 = etf1.filter(d=>d.vol<1);
  const etf4 = etf1.filter(d=>d.bullish>1 && d.bearish<1 && d.alpha>1);

  // Futures data
  const futData = Object.entries(window.futuresFullData).map(([inst,info])=>({
    instrument: inst,
    score: parseFloat(info.summaryLeft[0]),
    trend: info.summaryLeft[1],
    approach: info.summaryLeft[2],
    gap: parseGap(info.summaryLeft[3]),
    corr: parseFloat(info.summaryRight[0]),
    vol: parseFloat(info.summaryRight[1])
  }));
  const fut1 = futData.filter(d=>Math.abs(d.score)===100);
  const fut2 = fut1.filter(d=>d.corr<0.1);
  const fut3 = fut1.filter(d=>d.vol<1);

  // FX data
  const fxData = Object.entries(window.fxFullData).map(([inst,info])=>({
    instrument: inst,
    score: parseFloat(info.summaryLeft[0]),
    trend: info.summaryLeft[1],
    approach: info.summaryLeft[3],
    gap: parseGap(info.summaryLeft[2])
  }));
  const fx1 = fxData.filter(d=>d.score>=75 || d.score<=-75);

  // Build HTML
  c.innerHTML = `
  <div class="thematic-portfolio-nav">
    <button class="portfolio-tab active" data-target="stocks">STOCKS</button>
    <button class="portfolio-tab" data-target="etfs">ETFS</button>
    <button class="portfolio-tab" data-target="futures">FUTURES</button>
    <button class="portfolio-tab" data-target="fx">FX</button>
  </div>
  <div class="thematic-portfolio-contents">
    <div class="portfolio-tab-content active" data-category="stocks">
      ${renderSection('Trend Following', ['Instrument','Score','Trend','Approach','Gap to Peak','Key Area'], stk1)}
      ${renderSection('Low S&P500 Correlation', ['Instrument','Score','Correlation','Trend','Approach','Gap to Peak','Key Area'], stk2)}
      ${renderSection('Low Volatility', ['Instrument','Score','Volatility','Trend','Approach','Gap to Peak','Key Area'], stk3)}
      ${renderSection('Trend Plus', ['Instrument','Score','Bullish Alpha','Bearish Alpha','Alpha Strength','Trend','Approach','Gap to Peak','Key Area'], stk4)}
    </div>
    <div class="portfolio-tab-content" data-category="etfs">
      ${renderSection('Trend Following', ['Instrument','Score','Trend','Approach','Gap to Peak'], etf1)}
      ${renderSection('Low Correlation', ['Instrument','Score','Correlation','Trend','Approach','Gap to Peak'], etf2)}
      ${renderSection('Low Volatility', ['Instrument','Score','Volatility','Trend','Approach','Gap to Peak'], etf3)}
      ${renderSection('Trend Plus', ['Instrument','Score','Bullish Alpha','Bearish Alpha','Alpha Strength'], etf4)}
    </div>
    <div class="portfolio-tab-content" data-category="futures">
      ${renderSection('Trend Following', ['Instrument','Score','Trend','Approach','Gap to Peak'], fut1)}
      ${renderSection('Low Correlation', ['Instrument','Score','Correlation','Trend','Approach','Gap to Peak'], fut2)}
      ${renderSection('Low Volatility', ['Instrument','Score','Volatility','Trend','Approach','Gap to Peak'], fut3)}
    </div>
    <div class="portfolio-tab-content" data-category="fx">
      ${renderSection('Trend Following', ['Instrument','Score','Trend','Approach','Gap to Peak'], fx1)}
    </div>
  </div>
  `;

  // Tab switching
  c.querySelectorAll('.portfolio-tab').forEach(btn=>btn.addEventListener('click',()=>{
    c.querySelectorAll('.portfolio-tab').forEach(b=>b.classList.remove('active'));
    c.querySelectorAll('.portfolio-tab-content').forEach(sec=>sec.classList.remove('active'));
    btn.classList.add('active');
    c.querySelector(`.portfolio-tab-content[data-category="${btn.dataset.target}"]`).classList.add('active');
  }));

  // Render charts per section
  renderAllCharts();
}

function renderSection(title, headers, rows) {
  if (!rows || rows.length === 0) return '';
  return `
  <div class="thematic-portfolio-section">
    <h2>${title}</h2>
    <div class="thematic-portfolio-table-container">
      <table class="thematic-portfolio-table">
        <thead><tr>${headers.map(h=>`<th>${h}</th>`).join('')}</tr></thead>
        <tbody>${rows.map(r=>
          `<tr>${headers.map(h=>`<td>${r[headerKeyMap[h]]}</td>`).join('')}</tr>`
        ).join('')}</tbody>
      </table>
    </div>
    <div class="portfolio-charts">${generateChartContainers(title)}</div>
  </div>
  `;
}

function generateChartContainers(title) {
  // derive IDs from title
  const idBase = title.toLowerCase().replace(/[^a-z]+/g,'_');
  return `
    <div class="portfolio-chart"><canvas id="${idBase}_bar"></canvas></div>
    <div class="portfolio-chart"><canvas id="${idBase}_pie"></canvas></div>
  `;
}

function renderAllCharts() {
  // iterate each section and draw charts based on data present in DOM
  document.querySelectorAll('.thematic-portfolio-section').forEach(section=>{
    const h2 = section.querySelector('h2').textContent;
    const idBase = h2.toLowerCase().replace(/[^a-z]+/g,'_');
    const rows = Array.from(section.querySelectorAll('tbody tr')).map(tr=>{
      const instrument = tr.children[0].textContent;
      const value = parseFloat(tr.children[ section.querySelectorAll('th').length > 6 ? 2 : 1 ].textContent);
      return { instrument, value };
    });
    if (rows.length) {
      const labels = rows.map(r=>r.instrument);
      const dataArr = rows.map(r=>r.value);
      destroyChartIfExists(idBase+'_bar');
      renderBarChart(idBase+'_bar', labels, '', dataArr);
      // choose distribution fn
      let dist;
      if (section.dataset.category==='stocks') dist = computeGeoDistribution(rows);
      else if (section.dataset.category==='etfs') dist = computeSectorDistribution(rows);
      else if (section.dataset.category==='futures') dist = computeFuturesDistribution(rows);
      else if (section.dataset.category==='fx') dist = computeFXBaseDistribution(rows);
      destroyChartIfExists(idBase+'_pie');
      renderPieChart(idBase+'_pie', dist.labels, dist.data);
    }
  });
}
