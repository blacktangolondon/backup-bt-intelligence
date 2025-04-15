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

/* ------------------- Block1: TradingView Advanced Chart ------------------- */
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

/* ------------------- Block2: Symbol Overview ------------------- */
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

/* ------------------- Block3: TrendScore & TradingView Technical Analysis ------------------- */
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

/* ------------------- Block3 Tab Switching ------------------- */
// SINGLE, UNIQUE declaration of initBlock3Tabs.
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

/* ------------------- Block4: Correlation Analysis ------------------- */
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
export function updateBlock4(instrumentName, groupData, pricesData) {
  const block4 = document.getElementById("block4");
  block4.innerHTML = '<div class="loading-message"><span>CALCULATING...</span></div>';
  setTimeout(() => {
    block4.innerHTML = "";
    const correlations = getCorrelationListForCategory(instrumentName, pricesData);
    if (!correlations || correlations.length === 0) {
      block4.innerHTML = `<p style="color:white;">No correlation data found for ${instrumentName}</p>`;
      return;
    }
    drawMostCorrelatedChart(correlations);
  }, 300);
}

/* ------------------- Fullscreen & YouTube Popup ------------------- */
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

/* ------------------- Portfolio Builder & Thematic Portfolio ------------------- */
// Portfolio Builder
export function loadPortfolioBuilder() {
  window.portfolioFilters = [];
  const builderContainer = document.getElementById("portfolio-builder-template");
  builderContainer.innerHTML = `
    <div id="portfolio-builder-page">
      <div id="portfolio-builder-container">
        <div id="portfolio_builder1">
          <div id="portfolio-builder-steps">
            <p id="portfolio-builder-instructions">
              <button id="add-filter-btn">+</button> Add your filters and build your portfolio
            </p>
          </div>
          <div id="portfolio-builder-actions">
            <button id="generate-portfolio-btn">GENERATE PORTFOLIO</button>
          </div>
        </div>
        <div id="portfolio_builder2">
          <div id="portfolio-results"></div>
        </div>
      </div>
    </div>
  `;
  document.getElementById("add-filter-btn").addEventListener("click", openFilterSelector);
  document.getElementById("generate-portfolio-btn").addEventListener("click", generatePortfolioNew);
}

function openFilterSelector() {
  let availableFilters = [];
  const assetType = (window.portfolioFilters.length > 0) ? window.portfolioFilters[0].value : null;
  let allFilters;
  if (assetType === "FUTURES") {
    allFilters = ["Score", "Gap to Peak", "S&P500 Correlation", "S&P500 Volatility Ratio", "Alpha Strength"];
  } else if (assetType === "FX") {
    allFilters = ["Score", "Gap to Peak", "AVERAGE DAILY VOLATILITY", "FX Volatility Ratio", "30 DAYS PROJECTION", "LONG TERM - MACRO", "MEDIUM TERM - MATH", "MEDIUM TERM - STATS", "SHORT TERM - TECH"];
  } else {
    allFilters = ["Score", "Gap to Peak", "S&P500 Correlation", "S&P500 Volatility Ratio", "Bullish Alpha", "Bearish Alpha", "Alpha Strength"];
  }
  if (window.portfolioFilters.length === 0) {
    availableFilters.push("Asset Class");
  } else {
    availableFilters = allFilters.filter(f => window.portfolioFilters.findIndex(item => item.filterName === f) === -1);
  }
  const selectorDiv = document.createElement("div");
  selectorDiv.className = "filter-selector";
  const selectEl = document.createElement("select");
  availableFilters.forEach(filterName => {
    const opt = document.createElement("option");
    opt.value = filterName;
    opt.textContent = filterName;
    selectEl.appendChild(opt);
  });
  selectorDiv.appendChild(selectEl);
  const inputContainer = document.createElement("span");
  selectorDiv.appendChild(inputContainer);
  function updateInputFields() {
    inputContainer.innerHTML = "";
    const selectedFilter = selectEl.value;
    if (selectedFilter === "Asset Class") {
      const assetSelect = document.createElement("select");
      ["STOCKS", "ETFS", "FUTURES", "FX"].forEach(asset => {
        const opt = document.createElement("option");
        opt.value = asset;
        opt.textContent = asset;
        assetSelect.appendChild(opt);
      });
      inputContainer.appendChild(assetSelect);
    } else {
      const opSelect = document.createElement("select");
      ["≥", "≤"].forEach(op => {
        const opt = document.createElement("option");
        opt.value = op;
        opt.textContent = op;
        opSelect.appendChild(opt);
      });
      const numInput = document.createElement("input");
      numInput.type = "number";
      numInput.placeholder = "Numeric value";
      inputContainer.appendChild(opSelect);
      inputContainer.appendChild(numInput);
    }
  }
  selectEl.addEventListener("change", updateInputFields);
  updateInputFields();
  const addBtn = document.createElement("button");
  addBtn.textContent = "Add Filter";
  addBtn.style.marginLeft = "10px";
  addBtn.addEventListener("click", () => {
    const newFilter = { filterName: selectEl.value };
    if (selectEl.value === "Asset Class") {
      newFilter.value = inputContainer.querySelector("select").value;
    } else {
      newFilter.operator = inputContainer.querySelector("select").value;
      newFilter.value = inputContainer.querySelector("input").value;
    }
    window.portfolioFilters.push(newFilter);
    updatePortfolioSteps();
    selectorDiv.parentNode.removeChild(selectorDiv);
  });
  selectorDiv.appendChild(addBtn);
  document.getElementById("portfolio_builder1").appendChild(selectorDiv);
}

function updatePortfolioSteps() {
  const stepsContainer = document.getElementById("portfolio-builder-steps");
  stepsContainer.innerHTML = "";
  window.portfolioFilters.forEach((step, index) => {
    const stepDiv = document.createElement("div");
    stepDiv.className = "filter-step";
    let desc = step.filterName;
    if (step.filterName === "Asset Class") {
      desc += ": " + step.value;
    } else {
      desc += " " + step.operator + " " + step.value;
    }
    const descSpan = document.createElement("span");
    descSpan.textContent = desc;
    stepDiv.appendChild(descSpan);
    const removeBtn = document.createElement("button");
    removeBtn.className = "remove-filter-btn";
    removeBtn.textContent = "✕";
    removeBtn.addEventListener("click", () => {
      window.portfolioFilters.splice(index, 1);
      updatePortfolioSteps();
    });
    stepDiv.appendChild(removeBtn);
    stepsContainer.appendChild(stepDiv);
  });
  const instr = document.createElement("p");
  instr.id = "portfolio-builder-instructions";
  instr.style.textAlign = "center";
  instr.style.fontSize = "16px";
  instr.style.color = "#cccccc";
  instr.innerHTML = '<button id="add-filter-btn">+</button> Add another filter';
  stepsContainer.appendChild(instr);
  document.getElementById("add-filter-btn").addEventListener("click", openFilterSelector);
}

function generatePortfolioNew() {
  if (window.portfolioFilters.length === 0 || window.portfolioFilters[0].filterName !== "Asset Class") {
    alert("Please add the Asset Class filter as your first filter.");
    return;
  }
  const asset = window.portfolioFilters[0].value;
  let dataObj, mapping;
  if (asset === "STOCKS") {
    dataObj = window.stocksFullData;
    mapping = {
      "Score": { source: "left", index: 0 },
      "Gap to Peak": { source: "left", index: 3 },
      "S&P500 Correlation": { source: "right", index: 0 },
      "S&P500 Volatility Ratio": { source: "right", index: 1 },
      "Bullish Alpha": { source: "right", index: 2 },
      "Bearish Alpha": { source: "right", index: 3 },
      "Alpha Strength": { source: "right", index: 4 }
    };
  } else if (asset === "ETFS") {
    dataObj = window.etfFullData;
    mapping = {
      "Score": { source: "left", index: 0 },
      "Gap to Peak": { source: "left", index: 3 },
      "S&P500 Correlation": { source: "right", index: 0 },
      "S&P500 Volatility Ratio": { source: "right", index: 1 },
      "Bullish Alpha": { source: "right", index: 2 },
      "Bearish Alpha": { source: "right", index: 3 },
      "Alpha Strength": { source: "right", index: 4 }
    };
  } else if (asset === "FUTURES") {
    dataObj = window.futuresFullData;
    mapping = {
      "Score": { source: "left", index: 0 },
      "Gap to Peak": { source: "left", index: 3 },
      "S&P500 Correlation": { source: "right", index: 0 },
      "S&P500 Volatility Ratio": { source: "right", index: 1 },
      "Alpha Strength": { source: "right", index: 2 }
    };
  } else if (asset === "FX") {
    dataObj = window.fxFullData;
    mapping = {
      "Score": { source: "left", index: 0 },
      "Gap to Peak": { source: "left", index: 2 },
      "AVERAGE DAILY VOLATILITY": { source: "right", index: 0 },
      "FX Volatility Ratio": { source: "right", index: 1 },
      "30 DAYS PROJECTION": { source: "right", index: 2 },
      "LONG TERM - MACRO": { source: "right", index: 3 },
      "MEDIUM TERM - MATH": { source: "right", index: 4 },
      "MEDIUM TERM - STATS": { source: "right", index: 5 },
      "SHORT TERM - TECH": { source: "right", index: 6 }
    };
  } else {
    alert("Invalid asset class.");
    return;
  }
  const results = [];
  Object.keys(dataObj).forEach(instrument => {
    const info = dataObj[instrument];
    let include = true;
    for (let i = 1; i < window.portfolioFilters.length; i++) {
      const filt = window.portfolioFilters[i];
      const map = mapping[filt.filterName];
      if (!map) return;
      const val = map.source === "left" ? parseFloat(info.summaryLeft[map.index]) : parseFloat(info.summaryRight[map.index]);
      const condition = filt.operator === "≥" ? (val >= parseFloat(filt.value)) : (val <= parseFloat(filt.value));
      include = include && condition;
    }
    if (include) {
      if (asset === "FX") {
        const score = parseFloat(info.summaryLeft[0]);
        if (score >= 75 || score <= -75) {
          results.push({
            instrument: instrument,
            score: score,
            trend: info.summaryLeft[1],
            approach: info.summaryLeft[3],
            gap: parseGap(info.summaryLeft[2]),
            keyArea: info.summaryLeft[4],
            fxVolatilityRatio: parseFloat(info.summaryRight[1]),
            avgDailyVolatility: parseFloat(info.summaryRight[0])
          });
        }
      } else if (asset === "FUTURES") {
        const score = parseFloat(info.summaryLeft[0]);
        if (score === 100 || score === -100) {
          results.push({
            instrument: instrument,
            score: score,
            trend: info.summaryLeft[1],
            approach: info.summaryLeft[2],
            gap: parseGap(info.summaryLeft[3]),
            keyArea: info.summaryLeft[4],
            correlation: parseFloat(info.summaryRight[0]),
            volatility: parseFloat(info.summaryRight[1])
          });
        }
      } else {
        results.push({
          instrument: instrument,
          score: parseFloat(info.summaryLeft[0]),
          gap: parseGap(info.summaryLeft[3]),
          correlation: parseFloat(info.summaryRight[0]),
          volatility: parseFloat(info.summaryRight[1]),
          bullish: parseFloat(info.summaryRight[2]) || 0,
          bearish: parseFloat(info.summaryRight[3]) || 0,
          alphaStrength: parseFloat(info.summaryRight[4]) || 0,
          trend: info.summaryLeft[1],
          approach: info.summaryLeft[2],
          keyArea: info.summaryLeft[4]
        });
      }
    }
  });
  const userFilters = window.portfolioFilters.slice(1);
  let html = "";
  if (results.length === 0) {
    html = "<p>No instrument meets this criteria.</p>";
  } else {
    html += "<table id='portfolio-table'><thead><tr>";
    html += "<th>Instrument</th>";
    userFilters.forEach(filter => {
      html += `<th>${filter.filterName}</th>`;
    });
    html += "</tr></thead><tbody>";
    results.forEach(r => {
      html += `<tr>`;
      html += `<td>${r.instrument}</td>`;
      userFilters.forEach(filter => {
        const map = mapping[filter.filterName];
        let field = "";
        if (map) {
          if (map.source === "left") {
            field = filter.filterName === "Score" ? r.score : r.gap;
          } else if (map.source === "right") {
            if (filter.filterName === "S&P500 Correlation") field = r.correlation;
            else if (filter.filterName === "S&P500 Volatility Ratio") field = r.volatility;
            else if (filter.filterName === "Bullish Alpha") field = r.bullish;
            else if (filter.filterName === "Bearish Alpha") field = r.bearish;
            else if (filter.filterName === "Alpha Strength") field = r.alphaStrength;
            else if (filter.filterName === "AVERAGE DAILY VOLATILITY") field = r.avgDailyVolatility;
            else if (filter.filterName === "FX Volatility Ratio") field = r.fxVolatilityRatio;
            else if (filter.filterName === "30 DAYS PROJECTION") field = r.projection30;
            else if (filter.filterName === "LONG TERM - MACRO") field = r.longTermMacro;
            else if (filter.filterName === "MEDIUM TERM - MATH") field = r.mediumMath;
            else if (filter.filterName === "MEDIUM TERM - STATS") field = r.mediumStats;
            else if (filter.filterName === "SHORT TERM - TECH") field = r.shortTech;
          }
        }
        html += `<td>${field}</td>`;
      });
      html += `</tr>`;
    });
    html += "</tbody></table>";
  }
  document.getElementById("portfolio-results").innerHTML = html;
  if (typeof attachPortfolioTableSorting === "function") {
    attachPortfolioTableSorting();
  }
}

// Portfolio Ideas: Thematic Portfolio view
export function loadThematicPortfolio() {
  const container = document.getElementById("thematic-portfolio-template");
  if (
    Object.keys(window.stocksFullData).length === 0 ||
    Object.keys(window.etfFullData).length === 0 ||
    Object.keys(window.futuresFullData).length === 0 ||
    Object.keys(window.fxFullData).length === 0
  ) {
    container.innerHTML = '<div class="loading-message"><span>LOADING DATA...</span></div>';
    setTimeout(loadThematicPortfolio, 1000);
    return;
  }
  container.innerHTML = `
    <div class="thematic-portfolio-nav">
      <nav>
        <button class="portfolio-tab active-tab" data-target="stocks">STOCKS</button>
        <button class="portfolio-tab" data-target="etfs">ETFS</button>
        <button class="portfolio-tab" data-target="futures">FUTURES</button>
        <button class="portfolio-tab" data-target="fx">FX</button>
      </nav>
    </div>
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
  // Reinitialize the tab switching.
  initBlock3Tabs();
}

/* ------------------- Fullscreen & YouTube Popup ------------------- */
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
