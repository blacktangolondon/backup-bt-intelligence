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

    const summaryLeft = [
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
    const summaryRight = [
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

    // Preserve the TV-style symbol built upstream
    bucket[item.ticker] = {
      summaryLeft,
      summaryRight,
      tvSymbol: item.tvSymbol
    };
  });

  return { stocksFullData, etfFullData, futuresFullData, fxFullData };
}
