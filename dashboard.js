/**   
 * dashboard.js
 * Handles dashboard updates (Blocks 1–4) and portfolio views.
 */

import { renderBarChart, renderPieChart, destroyChartIfExists } from "./charts.js";

/* Helper function: parse Gap value */
export function parseGap(val) {
  return (val === "-" || isNaN(parseFloat(val))) ? 0 : parseFloat(val);
}

/* Label Arrays */
export const leftLabels = ["SCORE", "TREND", "APPROACH", "GAP TO PEAK", "KEY AREA", "MICRO", "MATH", "STATS", "TECH"];
export const rightLabels = ["S&P500 CORRELATION", "S&P500 VOLATILITY RATIO", "BULLISH ALPHA", "BEARISH ALPHA", "ALPHA STRENGHT", "PE RATIO", "EPS", "1 YEAR HIGH", "1 YEAR LOW"];
export const etfLeftLabels = ["SCORE", "TREND", "APPROACH", "GAP TO PEAK", "KEY AREA", "MATH", "STATS", "TECH"];
export const etfRightLabels = ["S&P500 CORRELATION", "S&P500 VOLATILITY RATIO", "BULLISH ALPHA", "BEARISH ALPHA", "ALPHA STRENGHT", "1 YEAR HIGH", "1 YEAR LOW", "ISSUER - TICKER"];
export const futuresLeftLabels = ["SCORE", "TREND", "APPROACH", "GAP TO PEAK", "KEY AREA", "LIMIT", "POTENTIAL EXTENSION"];
export const futuresRightLabels = ["S&P500 CORRELATION", "S&P500 VOLATILITY RATIO", "ALPHA STRENGHT", "30 DAYS PROJECTION", "MATH", "STATS", "TECH"];
export const fxLeftLabels = ["SCORE", "TREND", "GAP TO PEAK / TO VALLEY", "APPROACH", "KEY AREA", "LIMIT", "POTENTIAL EXTENSION"];
export const fxRightLabels = ["AVERAGE DAILY VOLATILITY", "FX VOLATILITY RATIO", "30 DAYS PROJECTION", "LONG TERM - MACRO", "MEDIUM TERM - MATH", "MEDIUM TERM - STATS", "SHORT TERM - TECH"];

/* Unified filter mappings by asset class */
const filterMappings = {
  STOCKS: {
    "Score": { source: "left", index: 0 },
    "Gap to Peak": { source: "left", index: 3 },
    "S&P500 Correlation": { source: "right", index: 0 },
    "S&P500 Volatility Ratio": { source: "right", index: 1 },
    "Bullish Alpha": { source: "right", index: 2 },
    "Bearish Alpha": { source: "right", index: 3 },
    "Alpha Strength": { source: "right", index: 4 }
  },
  ETFS: {
    "Score": { source: "left", index: 0 },
    "Gap to Peak": { source: "left", index: 3 },
    "S&P500 Correlation": { source: "right", index: 0 },
    "S&P500 Volatility Ratio": { source: "right", index: 1 },
    "Bullish Alpha": { source: "right", index: 2 },
    "Bearish Alpha": { source: "right", index: 3 },
    "Alpha Strength": { source: "right", index: 4 }
  },
  FUTURES: {
    "Score": { source: "left", index: 0 },
    "Gap to Peak": { source: "left", index: 3 },
    "S&P500 Correlation": { source: "right", index: 0 },
    "S&P500 Volatility Ratio": { source: "right", index: 1 },
    "Alpha Strength": { source: "right", index: 2 }
  },
  FX: {
    "Score": { source: "left", index: 0 },
    "Gap to Peak": { source: "left", index: 2 },
    "AVERAGE DAILY VOLATILITY": { source: "right", index: 0 },
    "FX Volatility Ratio": { source: "right", index: 1 },
    "30 DAYS PROJECTION": { source: "right", index: 2 },
    "LONG TERM - MACRO": { source: "right", index: 3 },
    "MEDIUM TERM - MATH": { source: "right", index: 4 },
    "MEDIUM TERM - STATS": { source: "right", index: 5 },
    "SHORT TERM - TECH": { source: "right", index: 6 }
  }
};

/* ------------------- Block1: TradingView Advanced Chart ------------------- */
function updateChartGeneric(instrumentName, groupData) {
  const info = groupData[instrumentName] || {};
  const symbol = info.tvSymbol || "NASDAQ:AMZN";
  const block1 = document.getElementById("block1");
  const container = block1.querySelector(".tradingview-widget-container");
  container.innerHTML = `<div class=\"tradingview-widget-container__widget\" style=\"height:calc(100% - 32px);width:100%\"></div>`;
  const script = document.createElement('script');
  script.type = "text/javascript";
  script.src = "https://s3.tradingview.com/external-embedding/embed-widget-advanced-chart.js";
  script.async = true;
  script.textContent = `{
    "autosize": true,
    "symbol": "${symbol}",
    "interval": "D",
    "timezone": "Etc/UTC",
    "theme": "dark",
    "style": "1",
    "locale": "en",
    "withdateranges": true,
    "hide_side_toolbar": false,
    "allow_symbol_change": false,
    "backgroundColor": "#001122",
    "details": true,
    "calendar": false,
    "support_host": "https://www.tradingview.com"
  }`;
  container.appendChild(script);
}
export function updateChart(instrumentName, groupData) {
  updateChartGeneric(instrumentName, groupData);
}

/* ------------------- Block2: Symbol Overview ------------------- */
function updateSymbolOverviewGeneric(instrumentName, groupData) {
  const info = groupData[instrumentName] || {};
  const symbol = info.tvSymbol || "NASDAQ:AMZN";
  const block2 = document.getElementById("block2");
  let container = block2.querySelector("#symbol-info-container");
  if (!container) {
    container = document.createElement("div");
    container.id = "symbol-info-container";
    block2.appendChild(container);
  }
  container.innerHTML = `<div class=\"tradingview-widget-container__widget\"></div>`;
  const script = document.createElement('script');
  script.type = "text/javascript";
  script.src = "https://s3.tradingview.com/external-embedding/embed-widget-symbol-overview.js";
  script.async = true;
  script.textContent = `{
    "symbols": [[ "${symbol}|1D" ]],
    "chartOnly": false,
    "width": "100%",
    "height": "100%",
    "locale": "en",
    "colorTheme": "dark",
    "autosize": true,
    "showVolume": false,
    "showMA": false,
    "hideDateRanges": false,
    "hideMarketStatus": false,
    "hideSymbolLogo": false,
    "scalePosition": "right",
    "scaleMode": "Normal",
    "fontFamily": "-apple-system, BlinkMacSystemFont, Roboto, Ubuntu, sans-serif",
    "fontSize": "10",
    "noTimeScale": false,
    "valuesTracking": "1",
    "changeMode": "price-and-percent",
    "chartType": "area",
    "maLineColor": "#2962FF",
    "maLineWidth": 1,
    "maLength": 9,
    "headerFontSize": "medium",
    "backgroundColor": "rgba(19, 23, 34, 0)",
    "widgetFontColor": "rgba(255, 152, 0, 1)",
    "lineWidth": 2,
    "lineType": 0,
    "dateRanges": [ "1d|1", "1m|30", "3m|60", "12m|1D", "60m|1W", "all|1M" ]
  }`;
  container.appendChild(script);
}
export function updateSymbolOverview(instrumentName, groupData) {
  updateSymbolOverviewGeneric(instrumentName, groupData);
}

/* ------------------- Block3: TrendScore & TradingView Technical Analysis ------------------- */
function updateBlock3Generic(instrumentName, groupData, rowCount, leftLabelsArr, rightLabelsArr, tradingViewUpdater) {
  const trendScoreContainer = document.getElementById('block3-trendscore');
  trendScoreContainer.innerHTML = '<div class="loading-message"><span>CALCULATING...</span></div>';
  setTimeout(() => {
    const info = groupData[instrumentName];
    trendScoreContainer.innerHTML = '';
    if (!info) {
      trendScoreContainer.textContent = "No data available for " + instrumentName;
      tradingViewUpdater(instrumentName);
      showBlock3Tab("trendscore");
      return;
    }
    const table = document.createElement('table');
    for (let i = 0; i < rowCount; i++) {
      const tr = document.createElement('tr');
      const td1 = document.createElement('td'); td1.textContent = leftLabelsArr[i] || ""; tr.appendChild(td1);
      const td2 = document.createElement('td');
      td2.textContent = (i === 3 && (!info.summaryLeft[i] || parseFloat(info.summaryLeft[i]) === 0))
        ? "0%" : info.summaryLeft[i] || "";
      tr.appendChild(td2);
      const td3 = document.createElement('td'); td3.textContent = rightLabelsArr[i] || ""; tr.appendChild(td3);
      const td4 = document.createElement('td'); td4.textContent = info.summaryRight[i] || ""; tr.appendChild(td4);
      table.appendChild(tr);
    }
    trendScoreContainer.appendChild(table);
    // hide tabs for futures
    if (groupData === window.futuresFullData) {
      document.getElementById("block3-tabs").style.display = "none";
      document.getElementById("block3-content").style.height = "100%";
      document.getElementById("block3-tradingview").innerHTML = '';
      table.style.height = "100%";
      Array.from(table.rows).forEach(r => r.style.height = (100/table.rows.length) + "%");
    } else {
      document.getElementById("block3-tabs").style.display = "flex";
      document.getElementById("block3-content").style.height = "calc(100% - 30px)";
      tradingViewUpdater(instrumentName);
    }
    showBlock3Tab("trendscore");
  }, 300);
}
function updateBlock3TradingViewGeneric(instrumentName, groupData) {
  const info = groupData[instrumentName] || {};
  const symbol = info.tvSymbol || "NASDAQ:AMZN";
  const tvContainer = document.getElementById('block3-tradingview');
  tvContainer.innerHTML = '';
  const widgetDiv = document.createElement('div'); widgetDiv.className = "tradingview-widget-container";
  widgetDiv.innerHTML = `<div class="tradingview-widget-container__widget"></div>`;
  tvContainer.appendChild(widgetDiv);
  const script = document.createElement('script');
  script.type = "text/javascript";
  script.src = "https://s3.tradingview.com/external-embedding/embed-widget-technical-analysis.js";
  script.async = true;
  script.textContent = `{
    "interval": "1D",
    "width": "100%",
    "isTransparent": true,
    "height": "100%",
    "symbol": "${symbol}",
    "showIntervalTabs": true,
    "displayMode": "single",
    "locale": "en",
    "colorTheme": "dark"
  }`;
  widgetDiv.appendChild(script);
}
export function updateBlock3(instrumentName, groupData, options = {}) {
  let rowCount, leftArr, rightArr, updater;
  if (options.isETF) {
    rowCount = etfLeftLabels.length;
    leftArr = etfLeftLabels;
    rightArr = etfRightLabels;
    updater = inst => updateBlock3TradingViewGeneric(inst, window.etfFullData);
  } else if (options.isFutures) {
    rowCount = futuresLeftLabels.length;
    leftArr = futuresLeftLabels;
    rightArr = futuresRightLabels;
    updater = inst => updateBlock3TradingViewGeneric(inst, window.futuresFullData);
  } else if (options.isFX) {
    rowCount = fxLeftLabels.length;
    leftArr = fxLeftLabels;
    rightArr = fxRightLabels;
    updater = inst => updateBlock3TradingViewGeneric(inst, window.fxFullData);
  } else {
    rowCount = leftLabels.length;
    leftArr = leftLabels;
    rightArr = rightLabels;
    updater = inst => updateBlock3TradingViewGeneric(inst, window.stocksFullData);
  }
  updateBlock3Generic(instrumentName, groupData, rowCount, leftArr, rightArr, updater);
}

/* ------------------- Block3 Tab Switching ------------------- */
export function initBlock3Tabs() {
  const tabs = document.querySelectorAll("#block3-tabs button");
  tabs.forEach(tab => tab.addEventListener("click", () => {
    tabs.forEach(t => t.classList.remove("active-tab"));
    document.getElementById('block3-trendscore').style.display = 'none';
    document.getElementById('block3-tradingview').style.display = 'none';
    tab.classList.add("active-tab");
    if (tab.dataset.tab === 'trendscore') {
      document.getElementById('block3-trendscore').style.display = 'block';
    } else {
      document.getElementById('block3-tradingview').style.display = 'block';
    }
  }));
}
export function showBlock3Tab(tabName) {
  const trendBtn = document.querySelector('#block3-tabs button[data-tab="trendscore"]');
  const tvBtn = document.querySelector('#block3-tabs button[data-tab="tradingview"]');
  if (trendBtn) trendBtn.classList.toggle('active-tab', tabName === 'trendscore');
  if (tvBtn) tvBtn.classList.toggle('active-tab', tabName === 'tradingview');
  document.getElementById('block3-trendscore').style.display = tabName === 'trendscore' ? 'block':'none';
  document.getElementById('block3-tradingview').style.display = tabName === 'tradingview'?'block':'none';
}

/* ------------------- Block4: Correlation Analysis ------------------- */
function pearsonCorrelation(x, y) {
  const n = x.length;
  if (y.length !== n || n === 0) return 0;
  const meanX = x.reduce((a,b)=>a+b,0)/n;
  const meanY = y.reduce((a,b)=>a+b,0)/n;
  let num=0, dx2=0, dy2=0;
  for (let i=0;i<n;i++){
    const dx=x[i]-meanX, dy=y[i]-meanY;
    num+=dx*dy;
    dx2+=dx*dx;
    dy2+=dy*dy;
  }
  return (dx2&&dy2)? num/Math.sqrt(dx2*dy2):0;
}
function drawMostCorrelatedChart(top10) {
  const block4 = document.getElementById('block4');
  block4.innerHTML = '<canvas id="correlationChart"></canvas>';
  const ctx = document.getElementById('correlationChart').getContext('2d');
  new Chart(ctx, {
    type:'bar', data:{ labels:top10.map(i=>i[0]), datasets:[{label:'CORRELATION',data:top10.map(i=>i[1]), backgroundColor:'rgba(255,165,0,0.7)',borderWidth:1}]},
    options:{ indexAxis:'y', scales:{ x:{ticks:{color:'white'}}, y:{ticks:{color:'white'}}}, plugins:{legend:{display:false},title:{display:true,text:'10 MOST CORRELATED INSTRUMENTS',color:'white',font:{size:14,family:'Arial'}} } }
  });
}
function getCorrelationListForCategory(instrumentName, pricesData) {
  const selected = pricesData[instrumentName]||[];
  const corrs = Object.entries(pricesData)
    .filter(([name])=>name!==instrumentName)
    .map(([name,arr])=>[name, pearsonCorrelation(selected,arr)]);
  return corrs.sort((a,b)=>b[1]-a[1]).slice(0,10);
}
export function updateBlock4(instrumentName, groupData, pricesData) {
  const block4 = document.getElementById("block4");
  block4.innerHTML = '<div class="loading-message"><span>CALCULATING...</span></div>';
  setTimeout(()=>{
    const top10 = getCorrelationListForCategory(instrumentName, pricesData);
    if (!top10.length) {
      block4.innerHTML = `<p style="color:white;">No correlation data for ${instrumentName}</p>`;
    } else drawMostCorrelatedChart(top10);
  },300);
}

/* ------------------- Fullscreen & YouTube Popup ------------------- */
export function updateFullscreenButton() {
  const btn = document.getElementById("fullscreen-button"); if (!btn) return;
  btn.innerHTML = document.fullscreenElement===null
    ? `<span class="arrow">↖</span><span class="arrow">↗</span><br><span class="arrow">↙</span><span class="arrow">↘</span>`
    : btn.innerHTML;
}
export function openYouTubePopup() {
  const yt = document.getElementById("youtube-popup"); if(!yt) return;
  yt.style.display="block";
  if (window.$&&$.fn.draggable) $("#youtube-popup").draggable({handle:"#youtube-popup-header"});
}
export function updateYouTubePlayer() {
  const url = document.getElementById("youtube-url").value.trim();
  document.getElementById("youtube-iframe").src = url;
}

/* ------------------- Portfolio Builder & Thematic Portfolio ------------------- */
export function loadPortfolioBuilder() {
  window.portfolioFilters = [];
  const container = document.getElementById("portfolio-builder-template");
  container.innerHTML = `
    <div id="portfolio-builder-page">...`;
  document.getElementById("add-filter-btn").addEventListener("click", openFilterSelector);
  document.getElementById("generate-portfolio-btn").addEventListener("click", generatePortfolioNew);
}

function openFilterSelector() {
  const available = window.portfolioFilters.length===0
    ? ["Asset Class"]
    : Object.keys(filterMappings[window.portfolioFilters[0].value]||{}).filter(f=>!window.portfolioFilters.find(p=>p.filterName===f));
  const selector = document.createElement("div"); selector.className="filter-selector";
  const selectEl = document.createElement("select"); available.forEach(f=>selectEl.append(new Option(f,f)));
  selector.append(selectEl);
  const inputSpan=document.createElement("span"); selector.append(inputSpan);
  function updateFields(){
    inputSpan.innerHTML="";
    if(selectEl.value==="Asset Class"){
      const sel=document.createElement("select");["STOCKS","ETFS","FUTURES","FX"].forEach(a=>sel.append(new Option(a,a)));
      inputSpan.append(sel);
    } else {
      const op=document.createElement("select");["≥","≤"].forEach(o=>op.append(new Option(o,o)));
      const num=document.createElement("input");num.type="number";num.placeholder="Numeric value";
      inputSpan.append(op,num);
    }
  }
  selectEl.addEventListener("change",updateFields);
  updateFields();
  const btn=document.createElement("button");btn.textContent="Add Filter";
  btn.onclick=()=>{
    const f={filterName:selectEl.value};
    if(f.filterName==="Asset Class") f.value=inputSpan.querySelector("select").value;
    else{f.operator=inputSpan.querySelector("select").value;f.value=inputSpan.querySelector("input").value;}
    window.portfolioFilters.push(f);
    updatePortfolioSteps();selector.remove();
  };
  selector.append(btn);
  document.getElementById("portfolio_builder1").append(selector);
}

function updatePortfolioSteps() {
  const steps=document.getElementById("portfolio-builder-steps");steps.innerHTML="";
  window.portfolioFilters.forEach((step,i)=>{
    const div=document.createElement("div");div.className="filter-step";
    let d=step.filterName+(step.filterName==="Asset Class"?": "+step.value:` ${step.operator} ${step.value}`);
    div.append(new Text(d));
    const rem=document.createElement("button");rem.textContent="✕";rem.className="remove-filter-btn";
    rem.onclick=()=>{window.portfolioFilters.splice(i,1);updatePortfolioSteps();};
    div.append(rem);
    steps.append(div);
  });
  const p=document.createElement("p");p.id="portfolio-builder-instructions";p.innerHTML='<button id="add-filter-btn">+</button> Add another filter';
  steps.append(p);document.getElementById("add-filter-btn").addEventListener("click",openFilterSelector);
}

function generatePortfolioNew() {
  if(!window.portfolioFilters.length||window.portfolioFilters[0].filterName!="Asset Class")return alert("Add Asset Class first");
  const asset=window.portfolioFilters[0].value;
  const dataObj=window[asset.toLowerCase()+"FullData"]||{};
  const mapping=filterMappings[asset];
  const results=[];
  Object.entries(dataObj).forEach(([inst,info])=>{
    let include=true;
    window.portfolioFilters.slice(1).forEach(f=>{
      const m=mapping[f.filterName]; if(!m)return;
      const v=m.source==="left"?parseFloat(info.summaryLeft[m.index]):parseFloat(info.summaryRight[m.index]);
      include = include && (f.operator==="≥"? v>=+f.value : v<=+f.value);
    });
    if(include){
      const sl=info.summaryLeft, sr=info.summaryRight;
      if(asset==="FX"){
        const score=+sl[0]; if(score>=75||score<=-75) results.push({instrument:inst,score,trend:sl[1],gap:parseGap(sl[2]),approach:sl[3],keyArea:sl[4],avgDailyVolatility:+sr[0],fxVolatilityRatio:+sr[1],projection30:+sr[2],longTermMacro:sr[3],mediumMath:sr[4],mediumStats:sr[5],shortTech:sr[6]});
      } else if(asset==="FUTURES"){
        const score=+sl[0]; if(score===100||score===-100) results.push({instrument:inst,score,trend:sl[1],approach:sl[2],gap:parseGap(sl[3]),keyArea:sl[4],correlation:+sr[0],volatility:+sr[1]});
      } else {
        results.push({instrument:inst,score:+sl[0],gap:parseGap(sl[3]),correlation:+sr[0],volatility:+sr[1],bullish:+sr[2]||0,bearish:+sr[3]||0,alphaStrength:+sr[4]||0,trend:sl[1],approach:sl[2],keyArea:sl[4]});
      }
    }
  });
  const userFilters=window.portfolioFilters.slice(1);
  let html="";
  if(!results.length) html="<p>No instrument meets criteria.</p>";
  else{
    html+="<table id='portfolio-table'><thead><tr><th>Instrument</th>";
    userFilters.forEach(f=>html+=`<th>${f.filterName}</th>`);
    html+="</tr></thead><tbody>";
    results.forEach(r=>{
      html+="<tr><td>"+r.instrument+"</td>";
      userFilters.forEach(f=>{
        const m=mapping[f.filterName];let field="";
        if(m){
          if(m.source==="left") field=(f.filterName==="Score"?r.score:r.gap);
          else field=r[f.filterName.replace(/ /g, f.filterName.includes(" ")? (f.filterName.toLowerCase().replace(/ /g,"")):"")];
        }
        html+=`<td>${field}</td>`;
      });html+="</tr>";
    });
    html+="</tbody></table>";
  }
  document.getElementById("portfolio-results").innerHTML=html;
}

export function loadThematicPortfolio() {
  const container = document.getElementById("thematic-portfolio-template");
  container.innerHTML = `
    <div class="thematic-portfolio-nav"><nav>
      <button class="portfolio-tab active-tab" data-target="stocks">STOCKS</button>
      <button class="portfolio-tab" data-target="etfs">ETFS</button>
      <button class="portfolio-tab" data-target="futures">FUTURES</button>
      <button class="portfolio-tab" data-target="fx">FX</button>
    </nav></div>
    <div id="thematic-portfolio-contents">
      <div class="portfolio-tab-content active" data-category="stocks">
        <p>Portfolio Ideas for STOCKS will be displayed here.</p>
      </div>
      <div class="portfolio-tab-content" data-category="etfs">
        <p>Portfolio Ideas for ETFS will be displayed here.</p>
      </div>
      <div class="portfolio-tab-content" data-category="futures">
        <p>Portfolio Ideas for FUTURES will be displayed here.</p>
      </div>
      <div class="portfolio-tab-content" data-category="fx">
        <p>Portfolio Ideas for FX will be displayed here.</p>
      </div>
    </div>
  `;
  initBlock3Tabs();
}

// Exports
export {
  updateChart,
  updateSymbolOverview,
  updateBlock3,
  updateBlock4,
  initBlock3Tabs,
  updateFullscreenButton,
  openYouTubePopup,
  loadPortfolioBuilder,
  loadThematicPortfolio
};
