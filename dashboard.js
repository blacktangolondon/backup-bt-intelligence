// dashboard.js
// ----------------
// Handles dashboard updates (Blocks 1–4), tab events, fullscreen, and YouTube popup.

import { renderBarChart, renderPieChart, destroyChartIfExists } from "./charts.js";
import futuresMap from "./futuresMap.js";

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
  "SCORE","TREND","APPROACH","GAP TO PEAK","KEY AREA","LIMIT","POTENTIAL EXTENSION"
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

// Human-readable descriptions for Block 3 metrics
export const block3MetricDescriptions = {
  "SCORE": "Misura la forza complessiva del trend su scala –100 (molto ribassista) a +100 (molto rialzista)",
  "TREND": "Direzione attuale del trend principale in base allo SCORE",
  "APPROACH": "Idea di approccio operativo nel contesto attuale",
  "GAP TO PEAK": "Distanza % dall'ultimo massimo",
  "GAP TO PEAK / TO VALLEY": "Distanza % dall'ultimo massimo nei trend Long e dall'ultimo minimo nei trend Short",
  "KEY AREA": "Area di prezzo considerata supporto o resistenza chiave",
  "MICRO": "Trend ipotizzato in base all'analisi microeconomica del titolo",
  "MATH": "Trend ipotizzato in base a un'analisi matematica della serie numerica generata dai prezzi di chiusura",
  "STATS": "Trend ipotizzato in base a un'analisi statistica della serie numerica generata dai prezzi di chiusura",
  "TECH": "Trend ipotizzato in base all'analisi di sentiment generata da una serie di indicatori tecnici",
  "LIMIT": "Livello di prezzo oltre il quale il ritracciamento/rimbalzo verrebbe considerato inversione di trend",
  "POTENTIAL EXTENSION": "Livello di prezzo atteso come target di una nuova eventuale estensione di prezzo",
  "S&P500 CORRELATION": "Grado di correlazione con l’indice S&P 500",
  "S&P500 VOLATILITY RATIO": "Rapporto tra volatilità dell’asset e volatilità dell’S&P 500",
  "BULLISH ALPHA": "Extra performance positiva rispetto al benchmark in fase rialzista, valore desiderabile > 1 in quanto significa che lo strumento sta tendendo a salire maggiormente rispetto al benchmark",
  "BEARISH ALPHA": "Performance rispetto al benchmark in fase ribassista, se < 1 significa che lo strumento sta tendendo a sopportare le fasi ribassiste meglio del benchmark",
  "ALPHA STRENGHT": "Misura il differenziale di forza tra fasi rialziste e fasi ribassite dello strumento stesso. Un valore > 1 mostra maggiore forza nelle fasi rialziste",
  "PE RATIO": "Rapporto prezzo/utili: prezzo attuale diviso utili per azione",
  "EPS": "Utile per azione: guadagno netto attribuibile a ciascuna azione",
  "1 YEAR HIGH": "Prezzo di chiusura massimo registrato nell’ultimo anno",
  "1 YEAR LOW": "Prezzo di chiusura minimo registrato nell’ultimo anno",
  "TICKER": "Simbolo utilizzato per identificare lo strumento",
  "MID TERM PRICE % PROJECTION": "Proiezione percentuale del prezzo ipoteizzata nel medio termine"
};

/* Block 1: TradingView Advanced Chart */
function updateChartGeneric(instrumentName, groupData) {
  const info   = groupData[instrumentName];
  const symbol = (info && info.tvSymbol) ? info.tvSymbol : "NASDAQ:AMZN";
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

/* Block 2: Symbol Overview */
function updateSymbolOverviewGeneric(instrumentName, groupData) {
  const info   = groupData[instrumentName];
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

      // Label cell (left)
      const td1 = document.createElement('td');
      const leftLabel = leftLabelArr[i] || '';
      const leftDesc  = block3MetricDescriptions[leftLabel] || '';
      td1.innerHTML = `
        ${leftLabel}
        <span class="info-icon" title="${leftDesc}">ℹ️</span>
      `;

      // Determine correct left value, accounting for ETF shift
      let val;
      if (leftLabelArr === etfLeftLabels && i >= 5) {
        val = info.summaryLeft[i + 1] || '';
      } else {
        val = info.summaryLeft[i] || '';
      }
      if (leftLabel === 'STATS') {
        if (val === 'MEDIUM TERM UP')   val = 'MEDIUM TERM BULLISH';
        else if (val === 'MEDIUM TERM DOWN') val = 'MEDIUM TERM BEARISH';
      }

      // Value cell (left)
      const td2 = document.createElement('td');
      if (leftLabel.startsWith('GAP TO')) {
        if (val === '-' || parseFloat(val) === 0) td2.textContent = '0%';
        else td2.textContent = val;
      } else {
        td2.textContent = val;
      }

      // Label cell (right)
      const td3 = document.createElement('td');
      const rightLabel = rightLabelArr[i] || '';
      const rightDesc  = block3MetricDescriptions[rightLabel] || '';
      td3.innerHTML = `
        ${rightLabel}
        <span class="info-icon" title="${rightDesc}">ℹ️</span>
      `;

      // Value cell (right)
      const td4 = document.createElement('td');
      let rightVal;
      if (leftLabelArr === etfLeftLabels) {
        if (i === 5)       rightVal = info.summaryRight[7];
        else if (i === 6)  rightVal = info.summaryRight[8];
        else if (i === 7)  rightVal = info.ticker || info.tvSymbol;
        else               rightVal = info.summaryRight[i];
      } else {
        rightVal = info.summaryRight[i];
      }
      td4.textContent = rightVal || '';

      tr.append(td1, td2, td3, td4);
      table.appendChild(tr);
    }
    trendScoreContainer.appendChild(table);

    // TradingView vs table logic
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
  const symbol = (info && info.tvSymbol) ? info.tvSymbol : 'NASDAQ:AMZN';
  const tvContainer = document.getElementById('block3-tradingview');
  tvContainer.innerHTML = '';
  const widgetDiv = document.createElement('div');
  widgetDiv.className = 'tradingview-widget-container';
  widgetDiv.innerHTML = `<div class="tradingview-widget-container__widget"></div>
    <div class="tradingview-widget-copyright"><a href="https://www.tradingview.com/" rel="noopener nofollow" target="_blank"></a></div>`;
  tvContainer.appendChild(widgetDiv);
  const script = document.createElement('script'); script.type = 'text/javascript';
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
    trendBtn?.classList.add('active-tab'); trendDiv && (trendDiv.style.display='block');
  } else {
    tvBtn?.classList.add('active-tab'); tvDiv && (tvDiv.style.display='block');
  }
}

/* Block 4: Correlation Analysis */
function pearsonCorrelation(x,y) {
  const n=x.length; if(y.length!==n||n===0) return 0;
  const mx=x.reduce((a,b)=>a+b,0)/n, my=y.reduce((a,b)=>a+b,0)/n;
  let num=0, dx2=0, dy2=0;
  for(let i=0;i<n;i++){ const dx=x[i]-mx, dy=y[i]-my; num+=dx*dy; dx2+=dx*dx; dy2+=dy*dy; }
  return (dx2===0||dy2===0)?0:(num/Math.sqrt(dx2*dy2));
}
function drawMostCorrelatedChart(top10) {
  const block4=document.getElementById('block4'); block4.innerHTML='<canvas id="correlationChart"'></canvas>';
  const ctx=document.getElementById('correlationChart').getContext('2d');
  const labels=top10.map(i=>i[0]), dataArr=top10.map(i=>i[1]);
  new Chart(ctx,{type:'bar',data:{labels,datasets:[{label:'CORRELATION',data:dataArr}]}});
}
function getCorrelationListForCategory(inst,prices) {
  const data=prices[inst]; if(!data||!data.length) return [];
  return Object.keys(prices)
    .filter(n=>n!==inst)
    .map(n=>[n, pearsonCorrelation(data, prices[n])])
    .sort((a,b)=>b[1]-a[1])
    .slice(0,10);
}
export function updateBlock4(instrumentName, groupData, groupPrices) {
  const blk = document.getElementById('block4');
  blk.innerHTML = '<div class="loading-message"><span>CALCULATING...</span></div>';
  setTimeout(() => {
    blk.innerHTML = '';
    const info = groupData[instrumentName];
    const tvSym = info && info.tvSymbol ? info.tvSymbol : '';
    let lookupKey = futuresMap[tvSym] || (tvSym.includes(':') ? tvSym.split(':')[1] : instrumentName);
    if (!(lookupKey in groupPrices)) {
      let match = Object.keys(groupPrices).find(k => k.split('.')[0] === lookupKey);
      if (!match) match = Object.keys(groupPrices).find(k => k.startsWith(lookupKey));
      if (!match) match = Object.keys(groupPrices).find(k => k.includes(lookupKey));
      if (match) lookupKey = match;
    }
    const cor = getCorrelationListForCategory(lookupKey, groupPrices);
    if (!cor.length) {
      blk.innerHTML = `<p style="color:white;">No correlation data found for ${instrumentName}</p>`;
      return;
    }
    drawMostCorrelatedChart(cor);
  }, 300);
}

/* Block3 Tab Event */
export function initBlock3Tabs() {
  document.querySelectorAll('#block3-tabs button').forEach(tab => {
    tab.addEventListener('click', () => {
      showBlock3Tab(tab.dataset.tab);
    });
  });
}

/* Fullscreen Button & YouTube Popup */
export function updateFullscreenButton() {
  const btn = document.getElementById('fullscreen-button');
  if (!btn) return;
  btn.innerHTML = document.fullscreenElement == null
    ? `<span class="arrow">⇖</span><span class="arrow">⇗</span><br><span class="arrow">⇙</span><span class="arrow">⇘</span>`
    : `<span class="arrow">⇖</span><span class="arrow">⇗</span><br><span class="arrow">⇙</span><span class="arrow">⇘</span>`;
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
