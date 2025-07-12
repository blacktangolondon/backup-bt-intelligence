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
  initBlock3Tabs,
  initEventHandlers // Now receives data parameters
} from "./dashboard.js";
import { initPortfolioBuilder } from "./portfolioBuilder.js";
import { initThematicPortfolio } from "./thematicPortfolio.js";
// No longer directly import showSpread here as dashboard.js will handle it

async function initializeTrendScore() {
  try {
    // 1) Load summary data for Block 3
    const jsonData = await loadJSONData();
    window.stocksFullData  = jsonData.stocksFullData;
    window.etfFullData     = jsonData.etfFullData;
    window.futuresFullData = jsonData.futuresFullData;
    window.fxFullData      = jsonData.fxFullData;
    // Ensure spreads data is also loaded globally, assuming loadJSONData provides it.
    window.spreadsFullData = jsonData.spreadsFullData; // <--- ASSUMPTION: jsonData now includes spreadsFullData

    // 2) Load price history from CSVs for Block 4
    const csvData = await loadCSVData();
    window.pricesData = {
      stockPrices:   csvData.stockPrices,
      etfPrices:     csvData.etfPrices,
      futuresPrices: csvData.futuresPrices,
      fxPrices:      csvData.fxPrices
    };

    // ——— New: build historicalReturns for correlation ———
    window.historicalReturns = {};
    function computeReturns(priceArray) {
      // Assuming priceArray elements are objects with a 'close' property
      return priceArray.map((p, i, arr) =>
        i === 0 ? 0 : (p.close / arr[i - 1].close) - 1
      );
    }

    // Populate historicalReturns for all categories
    // Ensure pricesData structures are consistent (e.g., objects with 'close' for historical data)
    for (const instrument in window.pricesData.stockPrices) {
      if (window.pricesData.stockPrices.hasOwnProperty(instrument)) {
        window.historicalReturns[instrument] = computeReturns(window.pricesData.stockPrices[instrument]);
      }
    }
    for (const instrument in window.pricesData.etfPrices) {
      if (window.pricesData.etfPrices.hasOwnProperty(instrument)) {
        window.historicalReturns[instrument] = computeReturns(window.pricesData.etfPrices[instrument]);
      }
    }
    for (const instrument in window.pricesData.futuresPrices) {
      if (window.pricesData.futuresPrices.hasOwnProperty(instrument)) {
        window.historicalReturns[instrument] = computeReturns(window.pricesData.futuresPrices[instrument]);
      }
    }
    for (const instrument in window.pricesData.fxPrices) {
      if (window.pricesData.fxPrices.hasOwnProperty(instrument)) {
        window.historicalReturns[instrument] = computeReturns(window.pricesData.fxPrices[instrument]);
      }
    }

    // 3) Generate sidebar content
    await generateSidebarContent();

    // 4) Initialize Block 3 tabs
    initBlock3Tabs();

    // 5) Initialize other global event handlers (e.g., fullscreen, YouTube popup)
    // Pass ALL necessary data for the click handlers to initEventHandlers
    initEventHandlers(
      { // groupData: collection of all full data objects
        STOCKS:  window.stocksFullData,
        ETFS:    window.etfFullData,
        FUTURES: window.futuresFullData,
        FX:      window.fxFullData,
        SPREADS: window.spreadsFullData // Pass spreads data
      },
      { // pricesData: collection of all price history data objects
        stockPrices:   window.pricesData.stockPrices,
        etfPrices:     window.pricesData.etfPrices,
        futuresPrices: window.pricesData.futuresPrices,
        fxPrices:      window.pricesData.fxPrices
      },
      // Pass the flat returns-map directly as the third argument
      window.historicalReturns
    );

    // 6) REMOVED: The redundant "Add event listener to sidebar instrument items" block is now handled by initEventHandlers in dashboard.js

    // 7) Auto-select via URL parameter or default
    const params = new URLSearchParams(window.location.search);
    const instParam = params.get('instrument');
    if (instParam) {
      const sidebarItem = [...document.querySelectorAll('.instrument-item')]
        .find(li => li.textContent.trim() === instParam);
      if (sidebarItem) {
        sidebarItem.click(); // This will now trigger the consolidated handler in initEventHandlers
        return;
      }
    }

    // 8) Default dashboard view (first stock)
    const defaultInstrument = Object.keys(window.stocksFullData)[0] || "AMZN";
    if (window.stocksFullData[defaultInstrument]) {
      // ensure spreads block is hidden on default view
      const spreadBlock = document.getElementById('block5');
      if (spreadBlock) spreadBlock.style.display = 'none';

      updateChart(defaultInstrument, window.stocksFullData);
      updateSymbolOverview(defaultInstrument, window.stocksFullData);
      updateBlock3(defaultInstrument, window.stocksFullData);
      // Pass the same flat historicalReturns object to updateBlock4
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
