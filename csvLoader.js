// csvLoader.js
// ----------------
// Loads bundled prices.json instead of Google Sheets CSVs

export async function loadCSVData() {
  try {
    const resp = await fetch('prices.json');
    if (!resp.ok) {
      console.error('Failed to load prices.json:', resp.status, resp.statusText);
      return {
        stockPrices: {},
        etfPrices: {},
        futuresPrices: {},
        fxPrices: {}
      };
    }
    const {
      stockPrices,
      etfPrices,
      futuresPrices,
      fxPrices
    } = await resp.json();
    return { stockPrices, etfPrices, futuresPrices, fxPrices };
  } catch (err) {
    console.error('Error loading prices.json:', err);
    return {
      stockPrices: {},
      etfPrices: {},
      futuresPrices: {},
      fxPrices: {}
    };
  }
}
