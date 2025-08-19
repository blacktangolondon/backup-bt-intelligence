// main.js
/**
 * main.js
 * Entry point for PHASE1, now including SPREAD support.
 */
import { loadJSONData } from "./jsonLoader.js";
import { loadCSVData } from "./csvLoader.js";
import { generateSidebarContent } from "./sidebar.js";
import {
  updateChart,
  updateSymbolOverview,
  updateBlock3,
  updateBlock4,
  initBlock3Tabs
} from "./dashboard.js";
import { initPortfolioBuilder } from "./portfolioBuilder.js";
import { initThematicPortfolio } from "./thematicPortfolio.js";
import { initEventHandlers } from "./events.js";

// No longer directly import showSpread here as dashboard.js will handle it (via a unified event handler)

async function initializeTrendScore() {
  try {
    // 1) Load summary data for Block 3
    const jsonData = await loadJSONData();
    window.stocksFullData  = jsonData.stocksFullData;
    window.etfFullData     = jsonData.etfFullData;
    window.futuresFullData = jsonData.futuresFullData;
    window.fxFullData      = jsonData.fxFullData;

    // --- Load spreadsFullData explicitly (for sidebar + events.js) ---
    try {
      const resp = await fetch('./spreads.json');
      window.spreadsFullData = resp.ok ? await resp.json() : {};
      console.log('Loaded spreadsFullData:', window.spreadsFullData);
    } catch (e) {
      console.error('Failed to load spreads.json:', e);
      window.spreadsFullData = {};
    }

    // 2) Load price history from CSVs for Block 4
    const csvData = await loadCSVData();
    window.pricesData = {
      stockPrices:   csvData.stockPrices,
      etfPrices:     csvData.etfPrices,
      futuresPrices: csvData.futuresPrices,
      fxPrices:      csvData.fxPrices
    };

    // --- DEBUG: Verify pricesData is populated ---
    console.log('window.pricesData after CSV load:', window.pricesData);
    if (Object.keys(window.pricesData.stockPrices).length === 0) {
      console.warn('No stock prices loaded. Check stock_prices.csv.');
    }

    // ——— Build historicalReturns for correlation ———
    window.historicalReturns = {};
    function computeReturns(priceArray) {
      if (!Array.isArray(priceArray) || priceArray.length < 2) return [];
      return priceArray.map((price, idx, arr) =>
        idx === 0 ? 0 : price / arr[idx - 1] - 1
      );
    }

    for (const [sym, prices] of Object.entries(window.pricesData.stockPrices)) {
      window.historicalReturns[sym] = computeReturns(prices);
    }
    for (const [sym, prices] of Object.entries(window.pricesData.etfPrices)) {
      window.historicalReturns[sym] = computeReturns(prices);
    }
    for (const [sym, prices] of Object.entries(window.pricesData.futuresPrices)) {
      window.historicalReturns[sym] = computeReturns(prices);
    }
    for (const [sym, prices] of Object.entries(window.pricesData.fxPrices)) {
      window.historicalReturns[sym] = computeReturns(prices);
    }

    // --- DEBUG: Verify historicalReturns is populated ---
    console.log('window.historicalReturns after computation:', window.historicalReturns);
    if (Object.keys(window.historicalReturns).length === 0) {
      console.error('window.historicalReturns is empty. Correlation will not work.');
    }

    // 3) Generate sidebar content
    await generateSidebarContent();

    // 4) Initialize Block 3 tabs
    initBlock3Tabs();

    // 5) Global event handlers (sidebar clicks for stocks/etfs/etc, fullscreen, etc.)
    initEventHandlers(
      { // allGroupData
        STOCKS:  window.stocksFullData,
        ETFS:    window.etfFullData,
        FUTURES: window.futuresFullData,
        FX:      window.fxFullData,
        SPREADS: window.spreadsFullData // <-- aggiunto
      },
      { // allPricesData
        stockPrices:   window.pricesData.stockPrices,
        etfPrices:     window.pricesData.etfPrices,
        futuresPrices: window.pricesData.futuresPrices,
        fxPrices:      window.pricesData.fxPrices
      },
      window.historicalReturns
    );

    // 6) Initialize Portfolio Builder & Portfolio Ideas
    initPortfolioBuilder();
    initThematicPortfolio();

    // 7) Auto-select via URL parameter or default
    const params = new URLSearchParams(window.location.search);
    const instParam = params.get('instrument');
    if (instParam) {
      const sidebarItem = [...document.querySelectorAll('.instrument-item')]
        .find(li => li.textContent.trim() === instParam);
      if (sidebarItem) {
        sidebarItem.click();
        return;
      }
    }

    // 8) Default dashboard view (first stock)
    const defaultInstrument = Object.keys(window.stocksFullData)[0] || "AMZN";
    if (window.stocksFullData[defaultInstrument]) {
      // ensure spreads block is hidden at startup; it will be shown when a spread is clicked
      const spreadBlock = document.getElementById('block5');
      if (spreadBlock) spreadBlock.style.display = 'none';

      updateChart(defaultInstrument, window.stocksFullData);
      updateSymbolOverview(defaultInstrument, window.stocksFullData);
      updateBlock3(defaultInstrument, window.stocksFullData);
      updateBlock4(
        defaultInstrument,
        window.stocksFullData,
        window.historicalReturns
      );
    }
  } catch (error) {
    console.error("Error initializing TrendScore:", error);
  }
}

// Ensure the DOM is fully loaded before initializing
document.addEventListener('DOMContentLoaded', initializeTrendScore);
