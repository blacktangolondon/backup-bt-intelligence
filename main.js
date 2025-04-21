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
    // 1) Load summary data for Block 3 from instruments.json
    const jsonData = await loadJSONData();
    window.etfFullData     = jsonData.etfFullData;
    window.futuresFullData = jsonData.futuresFullData;
    window.fxFullData      = jsonData.fxFullData;
    window.stocksFullData  = jsonData.stocksFullData;

    // 2) Load price history from CSVs for Block 4
    const csvData = await loadCSVData();
    const pricesData = {
      etfPrices:     csvData.etfPrices,
      futuresPrices: csvData.futuresPrices,
      fxPrices:      csvData.fxPrices,
      stockPrices:   csvData.stockPrices
    };
    window.pricesData = pricesData;

    // 3) Sidebar, Portfolio & Thematic
    generateSidebarContent();
    initPortfolioBuilder();
    initThematicPortfolio();

    // 4) TrendScore tabs
    initBlock3Tabs();

    // 5) Initial view
    const defaultInstrument = Object.keys(window.stocksFullData)[0] || "AMAZON";
    if (window.stocksFullData[defaultInstrument]) {
      updateChart(defaultInstrument, window.stocksFullData);
      updateSymbolOverview(defaultInstrument, window.stocksFullData);
      updateBlock3(defaultInstrument, window.stocksFullData);
      updateBlock4(defaultInstrument, window.stocksFullData, pricesData.stockPrices);
    }

    // 6) Global handlers
    initEventHandlers(
      {
        STOCKS:  window.stocksFullData,
        ETFS:    window.etfFullData,
        FUTURES: window.futuresFullData,
        FX:      window.fxFullData
      },
      {
        stockPrices:   pricesData.stockPrices,
        etfPrices:     pricesData.etfPrices,
        futuresPrices: pricesData.futuresPrices,
        fxPrices:      pricesData.fxPrices
      }
    );
  } catch (error) {
    console.error("Error initializing TrendScore:", error);
  }
}

initializeTrendScore();
