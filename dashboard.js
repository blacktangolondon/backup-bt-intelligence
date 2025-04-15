/**
 * dashboard.js
 * Handles dashboard updates.
 */

import { renderBarChart, renderPieChart, destroyChartIfExists } from "./charts.js";

// Helper: parseGap value.
export function parseGap(val) {
  return (val === "-" || isNaN(parseFloat(val))) ? 0 : parseFloat(val);
}

/* Label arrays */
export const leftLabels = ["SCORE", "TREND", "APPROACH", "GAP TO PEAK", "KEY AREA", "MICRO", "MATH", "STATS", "TECH"];
export const rightLabels = ["S&P500 CORRELATION", "S&P500 VOLATILITY RATIO", "BULLISH ALPHA", "BEARISH ALPHA", "ALPHA STRENGHT", "PE RATIO", "EPS", "1 YEAR HIGH", "1 YEAR LOW"];
export const etfLeftLabels = ["SCORE", "TREND", "APPROACH", "GAP TO PEAK", "KEY AREA", "MATH", "STATS", "TECH"];
export const etfRightLabels = ["S&P500 CORRELATION", "S&P500 VOLATILITY RATIO", "BULLISH ALPHA", "BEARISH ALPHA", "ALPHA STRENGHT", "1 YEAR HIGH", "1 YEAR LOW", "ISSUER - TICKER"];
export const futuresLeftLabels = ["SCORE", "TREND", "APPROACH", "GAP TO PEAK", "KEY AREA", "LIMIT", "POTENTIAL EXTENSION"];
export const futuresRightLabels = ["S&P500 CORRELATION", "S&P500 VOLATILITY RATIO", "ALPHA STRENGHT", "30 DAYS PROJECTION", "MATH", "STATS", "TECH"];
export const fxLeftLabels = ["SCORE", "TREND", "GAP TO PEAK / TO VALLEY", "APPROACH", "KEY AREA", "LIMIT", "POTENTIAL EXTENSION"];
export const fxRightLabels = ["AVERAGE DAILY VOLATILITY", "FX VOLATILITY RATIO", "30 DAYS PROJECTION", "LONG TERM - MACRO", "MEDIUM TERM - MATH", "MEDIUM TERM - STATS", "SHORT TERM - TECH"];

/* Block1: TradingView Advanced Chart */
function updateChartGeneric(instrumentName, groupData) {
  const info = groupData[instrumentName];
  const symbol = (info && info.tvSymbol) ? info.tvSymbol : "NASDAQ:AMZN";
  const block1 = document.getElementById("block1");
  const container = block1.querySelector(".tradingview-widget-container");
  container.innerHTML = `<div class="tradingview-widget-container__widget" style="height:calc(100% - 32px);width:100%"></div>`;
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

/* Block2: Symbol Overview */
function updateSymbolOverviewGeneric(instrumentName, groupData) {
  const info = groupData[instrumentName];
  const symbol = (info && info.tvSymbol) ? info.tvSymbol : "NASDAQ:AMZN";
  const block2 = document.getElementById("block2");
  let container = block2.querySelector("#symbol-info-container");
  if (!container) {
    container = document.createElement("div");
    container.id = "symbol-info-container";
    block2.appendChild(container);
  }
  container.innerHTML = `<div class="tradingview-widget-container__widget"></div>`;
  const script = document.createElement('script');
  script.type = "text/javascript";
  script.src = "https://s3.tradingview.com/external-embedding/embed-widget-symbol-overview.js";
  script.async = true;
  script.textContent = `{
    "symbols": [
      [ "${symbol}|1D" ]
    ],
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

/* Block3: TrendScore Table and TradingView Technical Analysis */
function updateBlock3Generic(instrumentName, groupData, rowCount, leftLabelArr, rightLabelArr, tradingViewUpdater) {
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
      const td1 = document.createElement('td');
      td1.textContent = leftLabelArr[i] || "";
      tr.appendChild(td1);
      const td2 = document.createElement('td');
      if (i === 3) {
        let gapVal = info.summaryLeft[i];
        td2.textContent = (gapVal === "-" || parseFloat(gapVal) === 0) ? "0%" : gapVal;
      } else {
        td2.textContent = info.summaryLeft[i] || "";
      }
      tr.appendChild(td2);
      const td3 = document.createElement('td');
      td3.textContent = rightLabelArr[i] || "";
      tr.appendChild(td3);
      const td4 = document.createElement('td');
      td4.textContent = info.summaryRight[i] || "";
      tr.appendChild(td4);
      table.appendChild(tr);
    }
    trendScoreContainer.appendChild(table);
    if (groupData === window.futuresFullData || instrumentName === "CAC 40" || instrumentName === "FTSE MIB") {
      document.getElementById("block3-tabs").style.display = "none";
      document.getElementById("block3-content").style.height = "100%";
      document.getElementById("block3-tradingview").innerHTML = '';
      table.style.height = "100%";
      const rows = table.getElementsByTagName("tr");
      const numRows = rows.length;
      for (let i = 0; i < numRows; i++) {
        rows[i].style.height = (100 / numRows) + "%";
      }
    } else {
      document.getElementById("block3-tabs").style.display = "flex";
      document.getElementById("block3-content").style.height = "calc(100% - 30px)";
      tradingViewUpdater(instrumentName);
    }
    showBlock3Tab("trendscore");
  }, 300);
}
function updateBlock3TradingViewGeneric(instrumentName, groupData) {
  const info = groupData[instrumentName];
  const symbol = (info && info.tvSymbol) ? info.tvSymbol : "NASDAQ:AMZN";
  const tvContainer = document.getElementById('block3-tradingview');
  tvContainer.innerHTML = '';
  const widgetDiv = document.createElement('div');
  widgetDiv.className = "tradingview-widget-container";
  widgetDiv.innerHTML = `
    <div class="tradingview-widget-container__widget"></div>
    <div class="tradingview-widget-copyright">
      <a href="https://www.tradingview.com/" rel="noopener nofollow" target="_blank"></a>
    </div>
  `;
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
  let rowCount, leftLabelsArr, rightLabelsArr;
  let tradingViewUpdater;
  if (options.isETF) {
    rowCount = 8;
    leftLabelsArr = etfLeftLabels;
    rightLabelsArr = etfRightLabels;
    tradingViewUpdater = (inst) => updateBlock3TradingViewGeneric(inst, window.etfFullData);
  } else if (options.isFutures) {
    rowCount = 7;
    leftLabelsArr = futuresLeftLabels;
    rightLabelsArr = futuresRightLabels;
    tradingViewUpdater = (inst) => updateBlock3TradingViewGeneric(inst, window.futuresFullData);
  } else if (options.isFX) {
    rowCount = 7;
    leftLabelsArr = fxLeftLabels;
    rightLabelsArr = fxRightLabels;
    tradingViewUpdater = (inst) => updateBlock3TradingViewGeneric(inst, window.fxFullData);
  } else {
    rowCount = 9;
    leftLabelsArr = leftLabels;
    rightLabelsArr = rightLabels;
    tradingViewUpdater = (inst) => updateBlock3TradingViewGeneric(inst, window.stocksFullData);
  }
  updateBlock3Generic(instrumentName, groupData, rowCount, leftLabelsArr, rightLabelsArr, tradingViewUpdater);
}
export function showBlock3Tab(tabName) {
  const trendBtn = document.querySelector('#block3-tabs button[data-tab="trendscore"]');
  const tvBtn = document.querySelector('#block3-tabs button[data-tab="tradingview"]');
  const trendDiv = document.getElementById('block3-trendscore');
  const tvDiv = document.getElementById('block3-tradingview');
  if (trendBtn) trendBtn.classList.remove('active-tab');
  if (tvBtn) tvBtn.classList.remove('active-tab');
  if (trendDiv) trendDiv.style.display = 'none';
  if (tvDiv) tvDiv.style.display = 'none';
  if (tabName === 'trendscore') {
    if (trendBtn) trendBtn.classList.add('active-tab');
    if (trendDiv) trendDiv.style.display = 'block';
  } else {
    if (tvBtn) tvBtn.classList.add('active-tab');
    if (tvDiv) tvDiv.style.display = 'block';
  }
}

/* Block4: Correlation Analysis */
function pearsonCorrelation(x, y) {
  const n = x.length;
  if (y.length !== n || n === 0) return 0;
  const meanX = x.reduce((a, b) => a + b, 0) / n;
  const meanY = y.reduce((a, b) => a + b, 0) / n;
  let numerator = 0, denomX = 0, denomY = 0;
  for (let i = 0; i < n; i++){
    const dx = x[i] - meanX;
    const dy = y[i] - meanY;
    numerator += dx * dy;
    denomX += dx * dx;
    denomY += dy * dy;
  }
  if (denomX === 0 || denomY === 0) return 0;
  return numerator / Math.sqrt(denomX * denomY);
}
function drawMostCorrelatedChart(top10) {
  const block4 = document.getElementById('block4');
  block4.innerHTML = '<canvas id="correlationChart"></canvas>';
  const ctx = document.getElementById('correlationChart').getContext('2d');
  const labels = top10.map(item => item[0]);
  const dataArr = top10.map(item => item[1]);
  new Chart(ctx, {
    type: 'bar',
    data: {
      labels: labels,
      datasets: [{
        label: 'CORRELATION',
        data: dataArr,
        backgroundColor: 'rgba(255,165,0,0.7)',
        borderColor: 'rgba(255,165,0,1)',
        borderWidth: 1
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      indexAxis: 'y',
      scales: {
        x: { ticks: { color: 'white' }, grid: { color: 'rgba(255,255,255,0.2)' } },
        y: { ticks: { color: 'white' }, grid: { color: 'rgba(255,255,255,0.2)' } }
      },
      plugins: {
        legend: { display: false },
        title: { display: true, text: '10 MOST CORRELATED INSTRUMENTS', color: 'white', font: { size: 14, family: 'Arial' } }
      }
    }
  });
}
function getCorrelationListForCategory(instrumentName, pricesData) {
  const selectedData = pricesData[instrumentName];
  if (!selectedData || selectedData.length === 0) return [];
  const compareList = Object.keys(pricesData).filter(name => name !== instrumentName);
  const correlations = [];
  compareList.forEach(otherName => {
    const otherData = pricesData[otherName];
    if (otherData) { correlations.push([otherName, pearsonCorrelation(selectedData, otherData)]); }
  });
  correlations.sort((a, b) => b[1] - a[1]);
  return correlations.slice(0, 10);
}
// In this Phase1, price arrays are loaded from CSV and stored separately in csvLoader.js.
// We assume that updateBlock4 will be called with a price object passed along.
export function updateBlock4(instrumentName, groupData, groupPrices) {
  const block4 = document.getElementById("block4");
  block4.innerHTML = '<div class="loading-message"><span>CALCULATING...</span></div>';
  setTimeout(() => {
    block4.innerHTML = "";
    const correlations = getCorrelationListForCategory(instrumentName, groupPrices);
    if (!correlations || correlations.length === 0) {
      block4.innerHTML = `<p style="color:white;">No correlation data found for ${instrumentName}</p>`;
      return;
    }
    drawMostCorrelatedChart(correlations);
  }, 300);
}

/* Block3 Tab Event */
export function initBlock3Tabs() {
  const tabs = document.querySelectorAll("#block3-tabs button");
  tabs.forEach(tab => {
    tab.addEventListener("click", () => {
      tabs.forEach(t => t.classList.remove("active-tab"));
      const contents = document.querySelectorAll(".portfolio-tab-content");
      contents.forEach(content => content.classList.remove("active"));
      tab.classList.add("active-tab");
      const target = tab.getAttribute("data-target");
      const activeContent = document.querySelector(`.portfolio-tab-content[data-category="${target}"]`);
      if (activeContent) activeContent.classList.add("active");
    });
  });
}

/* Fullscreen and YouTube Popup Functions */
export function updateFullscreenButton() {
  const btn = document.getElementById("fullscreen-button");
  if (!btn) return;
  if (document.fullscreenElement === null) {
    btn.innerHTML = `<span class="arrow">&#8598;</span>
                     <span class="arrow">&#8599;</span><br>
                     <span class="arrow">&#8601;</span>
                     <span class="arrow">&#8600;</span>`;
  } else {
    btn.innerHTML = `<span class="arrow">&#8598;</span>
                     <span class="arrow">&#8599;</span><br>
                     <span class="arrow">&#8601;</span>
                     <span class="arrow">&#8600;</span>`;
  }
}
export function openYouTubePopup() {
  const ytPopup = document.getElementById("youtube-popup");
  if (!ytPopup) return;
  ytPopup.style.display = "block";
  if (typeof $ === "function" && $.fn.draggable) {
    $("#youtube-popup").draggable({ handle: "#youtube-popup-header" });
  }
}
export function updateYouTubePlayer() {
  const url = document.getElementById("youtube-url").value.trim();
  document.getElementById("youtube-iframe").src = url;
}
