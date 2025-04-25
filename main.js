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

    // 3) Sidebar, Portfolio Builder & Thematic Portfolio
    //    <-- fully awaited so sidebar is built after data loads
    await generateSidebarContent();
    initPortfolioBuilder();
    initThematicPortfolio();

    // 4) TrendScore (Block 3) tabs
    initBlock3Tabs();

    // 5) Default dashboard view
    const defaultInstrument = "AMZN";
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

    // 6) Global event handlers (sidebar clicks, fullscreen, etc.)
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
  } catch (error) {
    console.error("Error initializing TrendScore:", error);
  }
}

initializeTrendScore();
