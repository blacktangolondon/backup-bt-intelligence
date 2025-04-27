// jsonLoader.js 27-4-2025
// ----------------
// Load instruments.json and bucket each item by asset class,
// preserving the full `tvSymbol` from the JSON instead of overwriting it.

export async function loadJSONData() {
  const resp = await fetch('instruments.json');
  const entries = await resp.json();

  const stocksFullData  = {};
  const etfFullData     = {};
  const futuresFullData = {};
  const fxFullData      = {};

  entries.forEach(item => {
    const bucket = {
      equity:  stocksFullData,
      etf:     etfFullData,
      future: futuresFullData,
      fx:      fxFullData
    }[item.asset_class];
    if (!bucket) return;

    let summaryLeft, summaryRight;
    if (item.asset_class === 'future' || item.asset_class === 'fx') {
      // 7 columns for futures and FX, matching futuresLeftLabels and futuresRightLabels
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
        String(item.sp500_correlation),     // S&P500 CORRELATION
        String(item.sp500_volatility_ratio),// S&P500 VOLATILITY RATIO
        String(item.alpha_strength),        // ALPHA STRENGTH
        String(item.projection_30),         // 30 DAYS PROJECTION
        item.math,                          // MATH
        item.stats,                         // STATS
        item.tech                           // TECH
      ];
    } else {
      // 9 columns for equity, ETF
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

    // Preserve the TV-style symbol built upstream
    bucket[item.ticker] = {
      summaryLeft,
      summaryRight,
      tvSymbol: item.tvSymbol
    };
  });

  return { stocksFullData, etfFullData, futuresFullData, fxFullData };
}
