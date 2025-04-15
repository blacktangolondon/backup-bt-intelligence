/**
 * main.js
 * Entry point for PHASE1.
 */

import { loadCSVData } from "./csvLoader.js";
import { generateSidebarContent } from "./sidebar.js";
import { 
  updateChart, 
  updateSymbolOverview, 
  updateBlock3, 
  updateBlock4, 
  initBlock3Tabs 
} from "./dashboard.js";
import { initEventHandlers } from "./events.js";

async function initializeTrendScore() {
  try {
    // Load CSV data from Google Sheets.
    const csvData = await loadCSVData();

    // Create a groupedData object from CSV data.
    const groupedData = {
      STOCKS: csvData.stocksFullData,
      ETFS: csvData.etfFullData,
      FUTURES: csvData.futuresFullData,
      FX: csvData.fxFullData
      // Add CRYPTO if needed.
    };

    // Set global CSV data for legacy functions.
    window.stocksFullData = csvData.stocksFullData;
    window.etfFullData = csvData.etfFullData;
    window.futuresFullData = csvData.futuresFullData;
    window.fxFullData = csvData.fxFullData;

    // Prepare a pricesData object to pass to updateBlock4.
    const pricesData = {
      stockPrices: csvData.stockPrices,
      etfPrices: csvData.etfPrices,
      futuresPrices: csvData.futuresPrices,
      fxPrices: csvData.fxPrices
    };
    window.pricesData = pricesData;

    // Generate the static sidebar.
    generateSidebarContent();

    // Initialize Block3 Tabs.
    initBlock3Tabs();

    // Set default dashboard view for a default instrument.
    const defaultInstrument = Object.keys(groupedData.STOCKS)[0] || "AMAZON";
    if (groupedData.STOCKS[defaultInstrument]) {
      updateChart(defaultInstrument, groupedData.STOCKS);
      updateSymbolOverview(defaultInstrument, groupedData.STOCKS);
      updateBlock3(defaultInstrument, groupedData.STOCKS);
      updateBlock4(defaultInstrument, groupedData.STOCKS, pricesData.stockPrices);
    }

    // Initialize global event handlers, passing the proper groupedData.
    initEventHandlers(groupedData, {
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

