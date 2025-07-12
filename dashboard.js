// dashboard.js
// ----------------
// Handles dashboard updates (Blocks 1–4), tab events, fullscreen, and YouTube popup.

import { renderBarChart, renderPieChart, destroyChartIfExists } from "./charts.js";
import futuresMap from "./futuresMap.js";
import { showSpread } from "./spreadView.js";

// Helper: parseGap value.
export function parseGap(val) {
  return (val === "-" || isNaN(parseFloat(val))) ? 0 : parseFloat(val);
}

// Label arrays for Block 3
export const leftLabels        = [
  "SCORE","TREND","APPROACH","GAP TO PEAK","KEY AREA","MICRO","MATH","STATS","TECH"
];
export const rightLabels       = [
  "S&P500 CORRELATION","S&P500 VOLATILITY RATIO","BULLISH ALPHA","BEARISH ALPHA",
  "ALPHA STRENGHT","PE RATIO","EPS","1 YEAR HIGH","1 YEAR LOW"
];
export const etfLeftLabels     = [
  "SCORE","TREND","APPROACH","GAP TO PEAK","KEY AREA","MATH","STATS","TECH"
];
export const etfRightLabels    = [
  "S&P500 CORRELATION","S&P500 VOLATILITY RATIO","BULLISH ALPHA","BEARISH ALPHA",
  "ALPHA STRENGHT","1 YEAR HIGH","1 YEAR LOW","TICKER"
];
export const futuresLeftLabels = [
  "SCORE","TREND","APPROACH","GAP TO PEAK / TO VALLEY","KEY AREA","LIMIT","POTENTIAL EXTENSION"
];
export const futuresRightLabels= [
  "S&P500 CORRELATION","S&P500 VOLATILITY RATIO","ALPHA STRENGHT","MID TERM PRICE % PROJECTION",
  "MATH","STATS","TECH"
];
export const fxLeftLabels      = [
  "SCORE","TREND","APPROACH","GAP TO PEAK / TO VALLEY","KEY AREA","LIMIT","POTENTIAL EXTENSION"
];
export const fxRightLabels     = [
  "S&P500 CORRELATION","S&P500 VOLATILITY RATIO","ALPHA STRENGHT","MID TERM PRICE % PROJECTION",
  "MATH","STATS","TECH"
];

/* Block 1: TradingView Advanced Chart */
function updateChartGeneric(instrumentName, groupData) {
  const info   = groupData[instrumentName];
  const symbol = (
    (info && info.tvSymbol) ? info.tvSymbol : "NASDAQ:AMZN"
  ).replace(/-/g, '_');
  const block1 = document.getElementById("block1");
  const container = block1.querySelector(".tradingview-widget-container");
  container.innerHTML = `<div class="tradingview-widget-container__widget" style="height:calc(100% - 32px);width:100%"></div>`;

  const script = document.createElement('script');
  script.type  = "text/javascript";
  script.src   = "https://s3.tradingview.com/external-embedding/embed-widget-advanced-chart.js";
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
    "backgroundColor": "#000000",
    "details": true,
    "calendar": false,
    "support_host": "https://www.tradingview.com"
  }`;
  container.appendChild(script);
}
export function updateChart(instrumentName, groupData) {
  updateChartGeneric(instrumentName, groupData);
}

/* Block 2: Symbol Overview */
function updateSymbolOverviewGeneric(instrumentName, groupData) {
  const info   = groupData[instrumentName];
  const symbol = (
    (info && info.tvSymbol) ? info.tvSymbol : "NASDAQ:AMZN"
  ).replace(/-/g, '_');
  const block2 = document.getElementById("block2");

  let container = block2.querySelector("#symbol-info-container");
  if (!container) {
    container = document.createElement("div");
    container.id = "symbol-info-container";
    block2.appendChild(container);
  }
  container.innerHTML = `<div class="tradingview-widget-container__widget"></div>`;

  const script = document.createElement('script');
  script.type  = "text/javascript";
  script.src   = "https://s3.tradingview.com/external-embedding/embed-widget-symbol-overview.js";
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
    "dateRanges": ["1d|1","1m|30","3m|60","12m|1D","60m|1W","all|1M"]
  }`;
  container.appendChild(script);
}
export function updateSymbolOverview(instrumentName, groupData) {
  updateSymbolOverviewGeneric(instrumentName, groupData);
}

/* Block 3: TrendScore Table and Technical Analysis */
function updateBlock3Generic(instrumentName, groupData, rowCount, leftLabelArr, rightLabelArr, tradingViewUpdater) {
  const trendScoreContainer = document.getElementById('block3-trendscore');
  trendScoreContainer.innerHTML = '<div class="loading-message"><span>CALCULATING.</span></div>';
  setTimeout(() => {
    const info = groupData[instrumentName];
    trendScoreContainer.innerHTML = '';
    if (!info) {
      trendScoreContainer.textContent = `No data available for ${instrumentName}`;
      tradingViewUpdater(instrumentName);
      showBlock3Tab('trendscore');
      return;
    }

    const table = document.createElement('table');
    for (let i = 0; i < rowCount; i++) {
      const tr = document.createElement('tr');

      // Label cell
      const td1 = document.createElement('td');
      td1.textContent = leftLabelArr[i] || '';

      // Determine correct left value, accounting for ETF shift
      let val;
      if (leftLabelArr === etfLeftLabels && i >= 5) {
        // ETFs skip the 'MICRO' field, so offset by +1
        val = info.summaryLeft[i + 1] || '';
      } else {
        val = info.summaryLeft[i] || '';
      }
      // Convert STATS cell from UP/DOWN into BULLISH/BEARISH for all asset classes
      if (leftLabelArr[i] === 'STATS') {
        if (val === 'MEDIUM TERM UP')    val = 'MEDIUM TERM BULLISH';
        else if (val === 'MEDIUM TERM DOWN') val = 'MEDIUM TERM BEARISH';
      }

      // Value cell (left)
      const td2 = document.createElement('td');
      // Special 0% case for GAP TO PEAK / TO VALLEY
      if ((leftLabelArr[i] === 'GAP TO PEAK' || leftLabelArr[i] === 'GAP TO PEAK / TO VALLEY') && (val === '-' || parseFloat(val) === 0)) {
        td2.textContent = '0%';
      } else {
        td2.textContent = val;
      }

      // Label cell (right)
      const td3 = document.createElement('td');
      td3.textContent = rightLabelArr[i] || '';

      // Value cell (right)
      const td4 = document.createElement('td');
      let rightVal;
      if (leftLabelArr === etfLeftLabels) {
        // ETFs have one fewer left column, so summaryRight indices shift:
        if (i === 5)     rightVal = info.summaryRight[7];      // 1 YEAR HIGH
        else if (i === 6)  rightVal = info.summaryRight[8];      // 1 YEAR LOW
        else if (i === 7)  rightVal = info.ticker || info.tvSymbol;     // ISSUER - TICKER
        else           rightVal = info.summaryRight[i];
      } else {
        rightVal = info.summaryRight[i];
      }
      td4.textContent = rightVal || '';

      tr.append(td1, td2, td3, td4);
      table.appendChild(tr);
    }
    trendScoreContainer.appendChild(table);

    // TradingView pane or full table for futures/index
    if (groupData === window.futuresFullData || ['CAC 40','FTSE MIB'].includes(instrumentName)) {
      document.getElementById('block3-tabs').style.display = 'none';
      document.getElementById('block3-content').style.height = '100%';
      document.getElementById('block3-tradingview').innerHTML = '';
      [...table.rows].forEach(r => r.style.height = `${100/table.rows.length}%`);
    } else {
      document.getElementById('block3-tabs').style.display = 'flex';
      document.getElementById('block3-content').style.height = 'calc(100% - 30px)';
      tradingViewUpdater(instrumentName);
    }
    showBlock3Tab('trendscore');
  }, 300);
}

function updateBlock3TradingViewGeneric(instrumentName, groupData) {
  const info   = groupData[instrumentName];
  const symbol = (
    (info && info.tvSymbol) ? info.tvSymbol : "NASDAQ:AMZN"
  ).replace(/-/g, '_');
  const tvContainer = document.getElementById('block3-tradingview');
  tvContainer.innerHTML = '';
  const widgetDiv = document.createElement('div');
  widgetDiv.className = 'tradingview-widget-container';
  widgetDiv.innerHTML = `<div class="tradingview-widget-container__widget"></div>
    <div class="tradingview-widget-copyright"><a href="https://www.tradingview.com/" rel="noopener nofollow" target="_blank"></a></div>`;
  tvContainer.appendChild(widgetDiv);
  const script = document.createElement('script');
  script.type  = 'text/javascript';
  script.src   = 'https://s3.tradingview.com/external-embedding/embed-widget-technical-analysis.js';
  script.async = true;
  script.textContent = `{
    "interval":"1D","width":"100%","height":"100%","isTransparent":true,
    "symbol":"${symbol}","showIntervalTabs":true,"displayMode":"single",
    "locale":"en","colorTheme":"dark"
  }`;
  widgetDiv.appendChild(script);
}

export function updateBlock3(instrumentName, groupData, options = {}) {
  let rowCount, leftArr, rightArr, tvUpdater;
  if (options.isETF) {
    rowCount = 8; leftArr = etfLeftLabels; rightArr = etfRightLabels;
    tvUpdater = inst => updateBlock3TradingViewGeneric(inst, window.etfFullData);
  } else if (options.isFutures) {
    rowCount = 7; leftArr = futuresLeftLabels; rightArr = futuresRightLabels;
    tvUpdater = inst => updateBlock3TradingViewGeneric(inst, window.futuresFullData);
  } else if (options.isFX) {
    rowCount = 7; leftArr = fxLeftLabels; rightArr = fxRightLabels;
    tvUpdater = inst => updateBlock3TradingViewGeneric(inst, window.fxFullData);
  } else {
    rowCount = 9; leftArr = leftLabels; rightArr = rightLabels;
    tvUpdater = inst => updateBlock3TradingViewGeneric(inst, window.stocksFullData);
  }
  updateBlock3Generic(instrumentName, groupData, rowCount, leftArr, rightArr, tvUpdater);
}

export function showBlock3Tab(tabName) {
  const trendBtn = document.querySelector('#block3-tabs button[data-tab="trendscore"]');
  const tvBtn    = document.querySelector('#block3-tabs button[data-tab="tradingview"]');
  const trendDiv = document.getElementById('block3-trendscore');
  const tvDiv    = document.getElementById('block3-tradingview');
  trendBtn?.classList.remove('active-tab'); tvBtn?.classList.remove('active-tab');
  trendDiv && (trendDiv.style.display='none'); tvDiv && (tvDiv.style.display='none');
  if (tabName==='trendscore') {
    trendBtn?.classList.add('active-tab');
    trendDiv && (trendDiv.style.display='block');
  } else {
    tvBtn?.classList.add('active-tab');
    tvDiv && (tvDiv.style.display='block');
  }
}

/* Block 4: Correlation Analysis */
function pearsonCorrelation(x, y) {
  // Ensure x and y are arrays and not empty
  if (!Array.isArray(x) || !Array.isArray(y) || x.length === 0 || y.length === 0) return 0;

  const n = Math.min(x.length, y.length); // Use the length of the shorter array
  if (n === 0) return 0; // If one array is empty after min, no correlation

  // Slice to ensure same length for calculation
  const xSliced = x.slice(0, n);
  const ySliced = y.slice(0, n);

  const mx = xSliced.reduce((a, b) => a + b, 0) / n;
  const my = ySliced.reduce((a, b) => a + b, 0) / n;

  let num = 0, dx2 = 0, dy2 = 0;
  for (let i = 0; i < n; i++) {
    const dx = xSliced[i] - mx;
    const dy = ySliced[i] - my;
    num += dx * dy;
    dx2 += dx * dx;
    dy2 += dy * dy;
  }
  return (dx2 === 0 || dy2 === 0) ? 0 : (num / Math.sqrt(dx2 * dy2));
}

function drawMostCorrelatedChart(top10) {
  const block4=document.getElementById('block4'); block4.innerHTML='<canvas id="correlationChart"></canvas>';
  const ctx=document.getElementById('correlationChart').getContext('2d');
  const labels=top10.map(i=>i[0]), dataArr=top10.map(i=>i[1]);
  new Chart(ctx,{
    type:'bar',
    data:{ labels, datasets:[{ label:'CORRELATION', data:dataArr, backgroundColor:'rgba(255,165,0,0.7)', borderColor:'rgba(255,165,0,1)', borderWidth:1 }]},
    options:{
      responsive:true,
      maintainAspectRatio:false,
      indexAxis:'y',
      scales:{
        x:{ ticks:{ color:'white' }, grid:{ color:'rgba(255,255,255,0.2)' } },
        y:{ ticks:{ color:'white' }, grid:{ color:'rgba(255,255,255,0.2)' } }
      },
      plugins:{
        legend:{ display:false },
        title:{ display:true, text:'10 MOST CORRELATED INSTRUMENTS', color:'white', font:{ size:14, family:'Arial' } }
      }
    }
  });
}
/**
 * Gets a list of instruments most correlated to the given instrument within its category.
 * @param {string} inst - The instrument key (e.g., "AMZN").
 * @param {object} returnsData - An object where keys are instrument names and values are arrays of historical returns.
 */
function getCorrelationListForCategory(inst, returnsData) {
  const data = returnsData[inst]; // This will be the array of returns for the selected instrument
  if (!data || !data.length) return [];

  return Object.keys(returnsData) // Iterate over all instruments in the provided returnsData object
    .filter(n => n !== inst && returnsData[n] && returnsData[n].length > 0) // Only filter out self and empty arrays
    .map(n => [n, pearsonCorrelation(data, returnsData[n])]) // Pass arrays of returns to pearsonCorrelation
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10);
}


/**
 * Updates Block 4 with correlation analysis.
 * @param {string} instrumentName - The name of the currently selected instrument.
 * @param {object} groupData - The full data object for the instrument's group (e.g., stocksFullData).
 * @param {object} groupReturns - The object containing historical returns for instruments in this category.
 */
export function updateBlock4(instrumentName, groupData, groupReturns) {
  const blk = document.getElementById('block4');
  blk.innerHTML = '<div class="loading-message"><span>CALCULATING...</span></div>';
  setTimeout(() => {
    blk.innerHTML = '';

    // 1) grab tvSymbol, then map via futuresMap if a future
    const info = groupData[instrumentName];
    // The lookup key needs to align with the keys in `groupReturns` (window.historicalReturns)
    // which are directly the instrument names (e.g., "AMZN", "EURUSD").
    let lookupKey = instrumentName; // Use instrumentName directly as the key for historicalReturns

    // Debugging line (add this if you want to see the lookupKey)
    console.log(`Debug - Instrument: ${instrumentName}, Lookup Key: ${lookupKey}, Returns Data Exists in groupReturns: ${lookupKey in groupReturns}, Length of Returns Data for lookupKey: ${groupReturns[lookupKey] ? groupReturns[lookupKey].length : 'N/A'}`);


    // If there's a specific mapping or transformation for the key to match
    // the historicalReturns keys, apply it here.
    // For futures, futuresMap might still be relevant if historicalReturns keys
    // for futures are different from sidebar names.
    if (groupData === window.futuresFullData) { // Check if it's a futures instrument
        const tvSym = info && info.tvSymbol ? info.tvSymbol : '';
        const mappedFuturesKey = futuresMap[tvSym];
        if (mappedFuturesKey) {
            lookupKey = mappedFuturesKey;
        } else {
            // Fallback for futures if not found in map, try derived from tvSymbol
            lookupKey = tvSym.includes(':') ? tvSym.split(':')[1] : instrumentName;
        }
    }


    // 2) The fallback logic for prefix/substring matches is typically for raw price data.
    // If historicalReturns is consistently keyed by instrument name or mapped futures keys,
    // this fallback might not be strictly necessary, but keep for robustness if keys vary.
    if (!(lookupKey in groupReturns)) {
      let match = Object.keys(groupReturns).find(k => k.split('.')[0] === lookupKey);
      if (!match) match = Object.keys(groupReturns).find(k => k.startsWith(lookupKey));
      if (!match) match = Object.keys(groupReturns).find(k => k.includes(lookupKey));
      if (match) lookupKey = match;
    }

    // 3) compute correlations
    const cor = getCorrelationListForCategory(lookupKey, groupReturns); // Pass groupReturns

    if (!cor.length) {
      blk.innerHTML = `<p style="color:white;">No correlation data found for ${instrumentName}</p>`;
      return;
    }

    // 4) render chart
    drawMostCorrelatedChart(cor);
  }, 300);
}

/* Block3 Tab Event */
export function initBlock3Tabs() {
  document.querySelectorAll('#block3-tabs button').forEach(tab => {
    tab.addEventListener('click', () => {
      // use the built-in showBlock3Tab to switch views
      showBlock3Tab(tab.dataset.tab);
    });
  });
}

/* Fullscreen Button & YouTube Popup */
export function updateFullscreenButton() {
  const btn = document.getElementById('fullscreen-button');
  if (!btn) return;
  btn.innerHTML = document.fullscreenElement == null
    ? `<span class="arrow">&#8598;</span><span class="arrow">&#8599;</span><br><span class="arrow">&#8601;</span><span class="arrow">&#8600;</span>`
    : `<span class="arrow">&#8598;</span><span class="arrow">&#8599;</span><br><span class="arrow">&#8601;</span><span class="arrow">&#8600;</span>`;
}
export function openYouTubePopup() {
  const yt = document.getElementById('youtube-popup');
  if (!yt) return;
  yt.style.display = 'block';
  if (typeof $ === 'function' && $.fn.draggable) {
    $('#youtube-popup').draggable({ handle: '#youtube-popup-header' });
  }
}
export function updateYouTubePlayer() {
  document.getElementById('youtube-iframe').src =
    document.getElementById('youtube-url').value.trim();
}

/**
 * Initializes global event handlers, specifically for sidebar instrument clicks.
 * This function now consolidates all instrument click logic (spreads vs. others).
 * @param {object} allGroupData - An object containing all full data groups (stocks, etfs, futures, fx, spreads).
 * @param {object} allPricesData - An object containing all raw price history data (stockPrices, etfPrices, etc.).
 * @param {object} allReturnsData - The flat object containing all historical returns data (instrument -> returns array).
 */
export function initEventHandlers(allGroupData, allPricesData, allReturnsData) {
  console.log('initEventHandlers called - adding general dashboard event listeners...');

  // Event listener for sidebar instrument items (consolidated logic)
  document.querySelectorAll('.instrument-item').forEach(item => {
    item.addEventListener('click', () => {
      const key = item.textContent.trim();

      // Hide all blocks first to ensure a clean display
      document.querySelectorAll('.content-block').forEach(blk => {
        if (blk) blk.style.display = 'none';
      });

      // --- Determine if it's a spread or another instrument type ---
      // Check allGroupData.SPREADS for existence and if the key is in it.
      if (allGroupData.SPREADS && key in allGroupData.SPREADS) {
        // It's a spread: show Block 5 and render spread chart
        const spreadBlock = document.getElementById('block5');
        if (spreadBlock) spreadBlock.style.display = 'block';
        showSpread(key); // Call the spread chart rendering function
      } else {
        // It's a non-spread instrument: ensure Block 5 is hidden and show Blocks 1-4
        const spreadBlock = document.getElementById('block5');
        if (spreadBlock) spreadBlock.style.display = 'none';

        let groupData = null;
        let pricesData = null; // Raw prices
        let returnsData = allReturnsData; // allReturnsData IS the flat map from main.js
        let options = {}; // Options for updateBlock3

        // Identify which category the instrument belongs to
        if (allGroupData.STOCKS && key in allGroupData.STOCKS) {
          groupData = allGroupData.STOCKS;
          pricesData = allPricesData.stockPrices;
          options = {}; // Default for stocks
        } else if (allGroupData.ETFS && key in allGroupData.ETFS) {
          groupData = allGroupData.ETFS;
          pricesData = allPricesData.etfPrices;
          options = { isETF: true };
        } else if (allGroupData.FUTURES && key in allGroupData.FUTURES) {
          groupData = allGroupData.FUTURES;
          pricesData = allPricesData.futuresPrices;
          options = { isFutures: true };
        } else if (allGroupData.FX && key in allGroupData.FX) {
          groupData = allGroupData.FX;
          pricesData = allPricesData.fxPrices;
          options = { isFX: true };
        }

        if (groupData) {
          // Show Blocks 1, 2, 3, 4 for the selected instrument
          document.getElementById('block1').style.display = 'block';
          document.getElementById('block2').style.display = 'block';
          document.getElementById('block3').style.display = 'block';
          document.getElementById('block4').style.display = 'block';

          // Update content for non-spread blocks
          updateChart(key, groupData);
          updateSymbolOverview(key, groupData);
          updateBlock3(key, groupData, options);
          updateBlock4(key, groupData, returnsData); // Pass returnsData (which is the flat map) to updateBlock4
        } else {
          console.warn(`No full data found for instrument: ${key} in any known category.`);
          // Optionally, display a user-friendly message on the dashboard here.
        }
      }
    });
  });

  // You can add other general event listeners here (e.g., fullscreen, YouTube popup)
}
