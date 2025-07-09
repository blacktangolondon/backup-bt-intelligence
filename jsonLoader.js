// jsonLoader.js 27-4-2025 (updated 2025-07-09)
// -------------------------------
// Load instruments.json and prices.json, then bind both to window.

export async function loadJSONData() {
  // 1) Fetch instruments
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
      future:  futuresFullData,
      fx:      fxFullData
    }[item.asset_class];
    if (!bucket) return;

    let summaryLeft, summaryRight;
    if (item.asset_class === 'future' || item.asset_class === 'fx') {
      // 7 columns for futures/FX, convert UP/DOWN to BULLISH/BEARISH
      const statsLabel = item.stats.replace(/UP/g, 'BULLISH').replace(/DOWN/g, 'BEARISH');

      summaryLeft = [
        String(item.final_score),
        item.trend,
        item.approach,
        String(item.gap_to_peak),
        item.key_area,
        String(item.limit),
        String(item.extension)
      ];
      summaryRight = [
        String(item.sp500_correlation),
        String(item.sp500_volatility_ratio),
        String(item.alpha_strength),
        String(item.projection_30),
        item.math,
        statsLabel,
        item.tech
      ];
    } else {
      // 9 columns for equity/ETF
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

  // 2) Fetch prices
  const pricesResp = await fetch('prices.json');
  const pricesData = await pricesResp.json();
  // Expecting shape: { stockPrices: {...}, etfPrices: {...}, futuresPrices: {...}, fxPrices: {...} }
  window.pricesData = pricesData;

  // 3) Bind the instrument buckets globally as well
  window.stocksFullData  = stocksFullData;
  window.etfFullData     = etfFullData;
  window.futuresFullData = futuresFullData;
  window.fxFullData      = fxFullData;

  return { stocksFullData, etfFullData, futuresFullData, fxFullData };
}

// Immediately kick off loading on import
loadJSONData().catch(err => {
  console.error('Error loading JSON data:', err);
});
