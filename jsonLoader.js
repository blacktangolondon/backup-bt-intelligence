// jsonLoader.js  — updated to also load channels.json

// Loads instruments.json, buckets by asset class, and also loads channels.json
export async function loadJSONData() {
  // Fetch both JSONs in parallel
  const [instResp, chanResp] = await Promise.all([
    fetch('instruments.json'),
    fetch('channels.json')
  ]);

  const entries       = await instResp.json();
  window.channelsData = await chanResp.json(); // { TICKER: {close,L1,L2,U1,U2}, ... }

  const stocksFullData  = {};
  const etfFullData     = {};
  const futuresFullData = {};
  const fxFullData      = {};

  entries.forEach(item => {
    const bucket = {
      equity:  stocksFullData,
      etf:     etfFullData,
      future:  futuresFullData,
      fx:      fxFullData
    }[item.asset_class];
    if (!bucket) return;

    let summaryLeft, summaryRight;
    if (item.asset_class === 'future' || item.asset_class === 'fx') {
      // 7 columns for futures and FX
      const statsLabel = item.stats.replace(/UP/g, 'BULLISH').replace(/DOWN/g, 'BEARISH');

      summaryLeft = [
        String(item.final_score),         // SCORE
        item.trend,                       // TREND
        item.approach,                    // APPROACH
        String(item.gap_to_peak),         // GAP TO PEAK
        item.key_area,                    // KEY AREA
        String(item.limit),               // LIMIT
        String(item.extension)            // POTENTIAL EXTENSION
      ];
      summaryRight = [
        String(item.sp500_correlation),      // S&P500 CORRELATION
        String(item.sp500_volatility_ratio), // S&P500 VOLATILITY RATIO
        String(item.alpha_strength),         // ALPHA STRENGTH
        String(item.projection_30),          // 30 DAYS PROJECTION
        item.math,                           // MATH
        statsLabel,                          // STATS (BULLISH/BEARISH)
        item.tech                            // TECH
      ];
    } else {
      // 9 columns for equity & ETF
      summaryLeft = [
        String(item.final_score),
        item.trend,
        item.approach,
        String(item.gap_to_peak),
        item.key_area,
        item.micro,
        item.math,
        item.stats,
        item.tech
      ];
      summaryRight = [
        String(item.sp500_correlation),
        String(item.sp500_volatility_ratio),
        String(item.bullish_alpha),
        String(item.bearish_alpha),
        String(item.alpha_strength),
        String(item.pe_ratio),
        String(item.eps),
        String(item.one_year_high),
        String(item.one_year_low)
      ];
    }

    bucket[item.ticker] = {
      summaryLeft,
      summaryRight,
      tvSymbol: item.tvSymbol
    };
  });

  return { stocksFullData, etfFullData, futuresFullData, fxFullData };
}
