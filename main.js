/**
 * main.js
 * Entry point for PHASE1.
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
  updateFullscreenButton,
  openYouTubePopup,
  updateYouTubePlayer
} from "./dashboard.js";
import { initEventHandlers } from "./events.js";
import { initPortfolioBuilder } from "./portfolioBuilder.js";
import { initThematicPortfolio } from "./thematicPortfolio.js";

async function initializeTrendScore() {
  try {
    // 1) Load summary data for Block 3
    const jsonData = await loadJSONData();
    window.stocksFullData  = jsonData.stocksFullData;
    window.etfFullData     = jsonData.etfFullData;
    window.futuresFullData = jsonData.futuresFullData;
    window.fxFullData      = jsonData.fxFullData;

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
    // Helper to turn a price array into day-over-day return array
    function computeReturns(priceArray) {
      return priceArray.map((p, i, arr) =>
        i === 0 ? 0 : (p.close / arr[i - 1].close) - 1
      );
    }
    // Stocks
    for (const [sym, prices] of Object.entries(window.pricesData.stockPrices)) {
      window.historicalReturns[sym] = computeReturns(prices);
    }
    // ETFs
    for (const [sym, prices] of Object.entries(window.pricesData.etfPrices)) {
      window.historicalReturns[sym] = computeReturns(prices);
    }
    // Futures
    for (const [sym, prices] of Object.entries(window.pricesData.futuresPrices)) {
      window.historicalReturns[sym] = computeReturns(prices);
    }
    // FX
    for (const [sym, prices] of Object.entries(window.pricesData.fxPrices)) {
      window.historicalReturns[sym] = computeReturns(prices);
    }

    // 3) Sidebar, Portfolio Builder & Thematic Portfolio
    await generateSidebarContent();
    initPortfolioBuilder();
    initThematicPortfolio();

    // 4) TrendScore (Block 3) tabs
    initBlock3Tabs();

    // 5) Global event handlers (sidebar clicks, fullscreen, etc.)
    initEventHandlers(
      {
        STOCKS:  window.stocksFullData,
        ETFS:    window.etfFullData,
        FUTURES: window.futuresFullData,
        FX:      window.fxFullData
      },
      {
        stockPrices:   window.pricesData.stockPrices,
        etfPrices:     window.pricesData.etfPrices,
        futuresPrices: window.pricesData.futuresPrices,
        fxPrices:      window.pricesData.fxPrices
      }
    );

    // 6) Auto-select via URL parameter or default
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

    // 7) Default dashboard view
    const defaultInstrument = Object.keys(window.stocksFullData)[0] || "AMZN";
    if (window.stocksFullData[defaultInstrument]) {
      updateChart(defaultInstrument, window.stocksFullData);
      updateSymbolOverview(defaultInstrument, window.stocksFullData);
      updateBlock3(defaultInstrument, window.stocksFullData);
      updateBlock4(
        defaultInstrument,
        window.stocksFullData,
        window.pricesData.stockPrices
      );
    }
  } catch (error) {
    console.error("Error initializing TrendScore:", error);
  }
}

initializeTrendScore();
