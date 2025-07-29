// spreadView.js
// Renders a Spread chart (ratio and channel lines) into #spread-chart
// using the global LightweightCharts standalone IIFE build.

/**
 * Fetches spreads.json and draws the selected spread.
 * @param {string} spreadKey  e.g. "FTSE100/EU50"
 */
export async function showSpread(spreadKey) {
  // 1) Fetch the JSON
  const resp = await fetch('./spreads.json');
  if (!resp.ok) {
    console.error(`Failed to load spreads.json: HTTP ${resp.status}`);
    return;
  }
  const spreads = await resp.json();
  const rawData = spreads[spreadKey];
  if (!rawData) {
    console.error(`No data for spread ${spreadKey}`);
    return;
  }

  // 2) Transform into five series arrays:
  //    [ date, ratio, lower1, lower2, upper1, upper2 ]
  const ratioSeries  = [];
  const lower1Series = [];
  const lower2Series = [];
  const upper1Series = [];
  const upper2Series = [];

  rawData.forEach(entry => {
    const date   = entry[0]; // "YYYY-MM-DD"
    const ratio  = entry[1];
    const l1     = entry[2];
    const l2     = entry[3];
    const u1     = entry[4];
    const u2     = entry[5];

    ratioSeries .push({ time: date, value: ratio });
    lower1Series.push({ time: date, value: l1    });
    lower2Series.push({ time: date, value: l2    });
    upper1Series.push({ time: date, value: u1    });
    upper2Series.push({ time: date, value: u2    });
  });

  // 3) Get the container and clear it
  const container = document.getElementById('spread-chart');
  if (!container) {
    console.error('#spread-chart container not found');
    return;
  }
  container.innerHTML = '';
  container.style.position = 'relative'; // for the floating title

  // 3a) Add floating title block
  const friendly = getFriendlyLabel(spreadKey);
  const LEFT_OFFSET_PX = 70; // push away from Y-axis
  const titleDiv = document.createElement('div');
  titleDiv.style.position      = 'absolute';
  titleDiv.style.top           = '8px';
  titleDiv.style.left          = LEFT_OFFSET_PX + 'px';
  titleDiv.style.zIndex        = '5';
  titleDiv.style.pointerEvents = 'none';
  titleDiv.style.lineHeight    = '1.2';

  titleDiv.innerHTML = `
    <div style="font-size:16px;font-weight:bold;color:#FFA500;">
      ${friendly}
    </div>
    <div style="font-size:11px;color:#FFA500;opacity:0.7;letter-spacing:0.5px;">
      BT-intelligence&nbsp;&nbsp;&nbsp;www.blacktangocapital.com
    </div>
  `;
  container.appendChild(titleDiv);

  // 4) Create the chart …
  const chart = window.LightweightCharts.createChart(container, {
    width:  container.clientWidth,
    height: container.clientHeight,
    layout: {
      background: { type: 'solid', color: 'black' },
      textColor:  'rgba(255, 152, 0, 1)',
    },
    grid: {
      vertLines: { color: 'rgba(255,255,255,0.1)' },
      horzLines: { color: 'rgba(255,255,255,0.1)' },
    },
    timeScale: {
      timeVisible: true,
      borderColor: 'rgba(255,255,255,0.2)',
    },
    rightPriceScale: {
      visible: true,
      borderColor: 'rgba(255,255,255,0.2)',
    },
    leftPriceScale: { visible: false },
    crosshair: { mode: window.LightweightCharts.CrosshairMode.Normal },
    watermark: { visible: false },
  });

  // 5) Add series…
  const ratioLine = chart.addSeries(window.LightweightCharts.LineSeries, {
    color:            'rgba(255, 152, 0, 1)',
    lineWidth:        2,
    lastValueVisible: true,
    priceLineVisible: true,
  });
  const channelOpts = {
    lineWidth:        4,
    lineStyle:        window.LightweightCharts.LineStyle.Dotted,
    lastValueVisible: false,
    priceLineVisible: false,
  };
  const lower1Line = chart.addSeries(window.LightweightCharts.LineSeries, { color:'rgba(0,150,136,0.7)', ...channelOpts });
  const lower2Line = chart.addSeries(window.LightweightCharts.LineSeries, { color:'rgba(0,150,136,0.4)', ...channelOpts });
  const upper1Line = chart.addSeries(window.LightweightCharts.LineSeries, { color:'rgba(255,82,82,0.7)', ...channelOpts });
  const upper2Line = chart.addSeries(window.LightweightCharts.LineSeries, { color:'rgba(255,82,82,0.4)', ...channelOpts });

  // 6) Set data
  ratioLine .setData(ratioSeries);
  lower1Line.setData(lower1Series);
  lower2Line.setData(lower2Series);
  upper1Line.setData(upper1Series);
  upper2Line.setData(upper2Series);

  // 7) Fit & resize
  chart.timeScale().fitContent();
  new ResizeObserver(entries => {
    if (entries[0]?.target?.id !== 'spread-chart') return;
    const { width, height } = entries[0].contentRect;
    chart.resize(width, height);
  }).observe(container);
}

// ----------------------------------------------------------------------------
// Helpers to produce a human-friendly title
// ----------------------------------------------------------------------------

function getFriendlyLabel(pair) {
  if (LABEL_MAP[pair]) return LABEL_MAP[pair];
  if (isCalendarPair(pair)) return prettyCalendar(pair);
  return pair;
}

function isCalendarPair(pair) {
  return /^[A-Z]+[FGHJKMNQUVXZ]\d{2}\/[A-Z]+[FGHJKMNQUVXZ]\d{2}$/.test(pair);
}

function prettyCalendar(pair) {
  const [a,b] = pair.split('/');
  return `${legToText(a)} / ${legToText(b)}`;
}
function legToText(leg) {
  const m = leg.match(/^([A-Z]+)([FGHJKMNQUVXZ])(\d{2})$/);
  if (!m) return leg;
  const [, root, mCode, yy] = m;
  const rootName = ROOT_NAME[root] || root;
  return `${rootName} ${MONTH_NAME[mCode]} 20${yy}`;
}

const MONTH_NAME = {
  F:'Jan', G:'Feb', H:'Mar', J:'Apr', K:'May', M:'Jun',
  N:'Jul', Q:'Aug', U:'Sep', V:'Oct', X:'Nov', Z:'Dec'
};

const ROOT_NAME = {
  ES:'E-mini S&P 500', NQ:'E-mini Nasdaq 100', YM:'Dow Jones 30 (Mini)',
  RTY:'Russell 2000 (Mini)', ZB:'US 30Y Bond', ZN:'US 10Y Note',
  ZF:'US 5Y Note', ZT:'US 2Y Note', CL:'WTI Crude Oil', RB:'RBOB Gasoline',
  HO:'Heating Oil', NG:'Natural Gas', GC:'Gold', SI:'Silver', HG:'Copper',
  ZC:'Corn', ZW:'Wheat', ZS:'Soybeans', LE:'Live Cattle', HE:'Lean Hogs'
};

// ──────────────────────────────────────────────────────────────────────────────
// Very important: update this map with every single A/B you want a friendly name for
// ──────────────────────────────────────────────────────────────────────────────
const LABEL_MAP = {
  // ── RELATIVE VALUE
  'FTSE100/EU50'         : 'FTSE 100 / Euro Stoxx 50',
  'FTSE100/CAC40'        : 'FTSE 100 / CAC 40',
  'CAC40/EU50'           : 'CAC 40 / Euro Stoxx 50',
  'DAX40/EU50'           : 'DAX 40 / Euro Stoxx 50',
  'DOW30/S&P500'         : 'Dow Jones 30 / S&P 500',
  'DOW30/NASDAQ100'      : 'Dow Jones 30 / Nasdaq 100',
  'DOW30/RUSSELL2000'    : 'Dow Jones 30 / Russell 2000',
  'NASDAQ100/S&P500'     : 'Nasdaq 100 / S&P 500',
  'NASDAQ100/RUSSELL2000': 'Nasdaq 100 / Russell 2000',
  'S&P500/RUSSELL2000'   : 'S&P 500 / Russell 2000',
  'GOLD/SILVER'          : 'Gold / Silver',
  'GOLD/PLATINUM'        : 'Gold / Platinum',
  'PLATINUM/SILVER'      : 'Platinum / Silver',
  'WTI/BRENT'            : 'WTI Crude / Brent Crude',
  'BRENT/WTI'            : 'Brent Crude / WTI Crude',
  'CORN/WHEAT'           : 'Corn / Wheat',
  'SOYBEANS/CORN'        : 'Soybeans / Corn',
  'BITCOIN/ETHEREUM'     : 'Bitcoin / Ethereum',
  'COPPER/ALUMINIUM'     : 'Copper / Aluminium',

  // ── EQUITY NEUTRAL
  'AAPL/MSFT'            : 'Apple / Microsoft',
  'NVDA/AMD'             : 'Nvidia / AMD',
  'GOOGL/META'           : 'Google (Alphabet) / Meta',
  'JPM/BAC'              : 'JPMorgan / Bank of America',
  'XOM/CVX'              : 'Exxon Mobil / Chevron',
  'KO/PEP'               : 'Coca‑Cola / PepsiCo',
  'TSLA/F'               : 'Tesla / Ford',
  'ASML/TSM'             : 'ASML / TSMC',
  'DIS/CMCSA'            : 'Disney / Comcast',
  'CAT/DE'               : 'Caterpillar / Deere',
  'AMZN/NFLX'            : 'Amazon / Netflix',
  'JNJ/PFE'              : 'Johnson & Johnson / Pfizer',
  'BA/LMT'               : 'Boeing / Lockheed Martin',
  'V/MA'                 : 'Visa / Mastercard',
  'NFLX/DIS'             : 'Netflix / Disney',
  'F/GM'                 : 'Ford / General Motors',

  // ── FIXED INCOME
  'ZN/ZF'                : '10Y Note / 5Y Note',
  'ZF/ZT'                : '5Y Note / 2Y Note',
  'ZN/ZT'                : '10Y Note / 2Y Note',
  'UB/ZT'                : 'Ultra Bond / 2Y Note',
  'UB/ZF'                : 'Ultra Bond / 5Y Note',
  'HYG/LQD'              : 'High‑Yield ETF / Investment‑Grade ETF',
  'HYG/ZB'               : 'High‑Yield ETF / 30Y Bond Futures'
};
