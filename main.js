/**
 * main.js
 * Entry point for PHASE1.
 */
import { loadCSVData } from "./csvLoader.js";
import { generateSidebarContent } from "./sidebar.js";
import { updateChart, updateSymbolOverview, updateBlock3, updateBlock4, initBlock3Tabs, updateFullscreenButton, openYouTubePopup, updateYouTubePlayer } from "./dashboard.js";
import { initEventHandlers } from "./events.js";

async function initializeTrendScore() {
  try {
    // Load CSV data from Google Sheets.
    const csvData = await loadCSVData();
    // Set global CSV data for dashboard functions.
    window.etfFullData = csvData.etfFullData;
    window.futuresFullData = csvData.futuresFullData;
    window.fxFullData = csvData.fxFullData;
    window.stocksFullData = csvData.stocksFullData;

    // Prepare a pricesData object to pass to updateBlock4.
    const pricesData = {
      etfPrices: csvData.etfPrices,
      futuresPrices: csvData.futuresPrices,
      fxPrices: csvData.fxPrices,
      stockPrices: csvData.stockPrices
    };
    window.pricesData = pricesData;

    // Generate the static sidebar.
    generateSidebarContent();

    // Initialize Block3 Tabs.
    initBlock3Tabs();

    // Set default dashboard view for a default instrument.
    const defaultInstrument = Object.keys(window.stocksFullData)[0] || "AMAZON";
    if (window.stocksFullData[defaultInstrument]) {
      updateChart(defaultInstrument, window.stocksFullData);
      updateSymbolOverview(defaultInstrument, window.stocksFullData);
      updateBlock3(defaultInstrument, window.stocksFullData);
      updateBlock4(defaultInstrument, window.stocksFullData, pricesData.stockPrices);
    }

    // Initialize global event handlers.
    initEventHandlers(window, {
      stockPrices: pricesData.stockPrices,
      etfPrices: pricesData.etfPrices,
      futuresPrices: pricesData.futuresPrices,
      fxPrices: pricesData.fxPrices
    });
  } catch (error) {
    console.error("Error initializing TrendScore:", error);
  }
}

initializeTrendScore();
