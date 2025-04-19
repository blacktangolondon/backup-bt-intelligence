/**
 * main.js
 * Entry point for TrendScore.
 */
import { loadCSVData } from "./csvLoader.js";
import { generateSidebarContent } from "./sidebar.js";
import { updateChart, updateSymbolOverview, updateBlock3, updateBlock4, initBlock3Tabs, updateFullscreenButton, openYouTubePopup, updateYouTubePlayer } from "./dashboard.js";
import { initEventHandlers } from "./events.js";

async function initializeTrendScore() {
  try {
    // Load CSV data from Google Sheets.
    const csvData = await loadCSVData();

    // Create a groupedData object.
    const groupedData = {
      STOCKS: csvData.stocksFullData,
      ETFS:   csvData.etfFullData,
      FUTURES: csvData.futuresFullData,
      FX:     csvData.fxFullData
    };

    // Expose for debugging / legacy.
    window.stocksFullData   = csvData.stocksFullData;
    window.etfFullData      = csvData.etfFullData;
    window.futuresFullData  = csvData.futuresFullData;
    window.fxFullData       = csvData.fxFullData;

    // Prepare a pricesData object.
    const pricesData = {
      stockPrices:   csvData.stockPrices,
      etfPrices:     csvData.etfPrices,
      futuresPrices: csvData.futuresPrices,
      fxPrices:      csvData.fxPrices
    };
    window.pricesData = pricesData;

    // Generate the sidebar, passing groupedData so it includes special items
    generateSidebarContent(groupedData);

    // Initialize Block3 tab switching
    initBlock3Tabs();

    // Render default view for the first STOCKS instrument
    const defaultInstrument = Object.keys(groupedData.STOCKS)[0] || "AMAZON";
    if (groupedData.STOCKS[defaultInstrument]) {
      updateChart(defaultInstrument, groupedData.STOCKS);
      updateSymbolOverview(defaultInstrument, groupedData.STOCKS);
      updateBlock3(defaultInstrument, groupedData.STOCKS);
      updateBlock4(defaultInstrument, groupedData.STOCKS, pricesData.stockPrices);
    }

    // Wire up all UI event handlers (including sidebar clicks)
    initEventHandlers(groupedData, pricesData);
  } catch (error) {
    console.error("Error initializing TrendScore:", error);
  }
}

initializeTrendScore();

