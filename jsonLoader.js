// jsonLoader.js — robusto ai diversi formati di instruments.json e channels.json

function normalizeInstruments(raw) {
  // Ritorna sempre un array di oggetti-strumento
  if (!raw) return [];
  if (Array.isArray(raw)) return raw;
  if (Array.isArray(raw.entries)) return raw.entries;
  if (Array.isArray(raw.items)) return raw.items;
  if (typeof raw === 'object') return Object.values(raw); // mappa {TICKER: {...}}
  return [];
}

// Loads instruments.json, buckets by asset class, and also loads channels.json
export async function loadJSONData() {
  let instResp, chanResp;
  try {
    [instResp, chanResp] = await Promise.all([
      fetch('./instruments.json'),
      fetch('./channels.json')
    ]);
  } catch (e) {
    console.error('Network error fetching JSONs:', e);
  }

  let rawInstruments = [];
  try {
    rawInstruments = instResp && instResp.ok ? await instResp.json() : [];
  } catch (e) {
    console.error('Failed to parse instruments.json:', e);
    rawInstruments = [];
  }

  try {
    window.channelsData = chanResp && chanResp.ok ? await chanResp.json() : {};
  } catch (e) {
    console.warn('Failed to parse channels.json (fallback to empty):', e);
    window.channelsData = {};
  }

  const entries = normalizeInstruments(rawInstruments);

  const stocksFullData  = {};
  const etfFullData     = {};
  const futuresFullData = {};
  const fxFullData      = {};

  entries.forEach(item => {
    if (!item) return;

    const cls = (item.asset_class || '').toLowerCase();
    const bucket = {
      equity:  stocksFullData,
      etf:     etfFullData,
      future:  futuresFullData,
      fx:      fxFullData
    }[cls];
    if (!bucket) return;

    // campi di sicurezza
    const safe = (v) => (v === null || v === undefined ? '' : v);
    const tvSymbol = item.tvSymbol || item.ticker || item.name || '';

    let summaryLeft, summaryRight;
    if (cls === 'future' || cls === 'fx') {
      const statsLabel = safe(item.stats).toString().replace(/UP/g, 'BULLISH').replace(/DOWN/g, 'BEARISH');
      summaryLeft = [
        String(safe(item.final_score)),
        safe(item.trend),
        safe(item.approach),
        String(safe(item.gap_to_peak)),
        safe(item.key_area),
        String(safe(item.limit)),
        String(safe(item.extension))
      ];
      summaryRight = [
        String(safe(item.sp500_correlation)),
        String(safe(item.sp500_volatility_ratio)),
        String(safe(item.alpha_strength)),
        String(safe(item.projection_30)),
        safe(item.math),
        statsLabel,
        safe(item.tech)
      ];
    } else {
      summaryLeft = [
        String(safe(item.final_score)),
        safe(item.trend),
        safe(item.approach),
        String(safe(item.gap_to_peak)),
        safe(item.key_area),
        safe(item.micro),
        safe(item.math),
        safe(item.stats),
        safe(item.tech)
      ];
      summaryRight = [
        String(safe(item.sp500_correlation)),
        String(safe(item.sp500_volatility_ratio)),
        String(safe(item.bullish_alpha)),
        String(safe(item.bearish_alpha)),
        String(safe(item.alpha_strength)),
        String(safe(item.pe_ratio)),
        String(safe(item.eps)),
        String(safe(item.one_year_high)),
        String(safe(item.one_year_low))
      ];
    }

    const key = item.ticker || item.name || tvSymbol || Math.random().toString(36).slice(2);
    bucket[key] = { summaryLeft, summaryRight, tvSymbol };
  });

  return { stocksFullData, etfFullData, futuresFullData, fxFullData };
}
