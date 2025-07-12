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
  initEventHandlers
} from "./dashboard.js";
import { initPortfolioBuilder } from "./portfolioBuilder.js";
import { initThematicPortfolio } from "./thematicPortfolio.js";
import { showSpread } from "./spreadView.js";  // <-- New import for spreads

async function initializeTrendScore() {
  try {
    // 1) Load summary data for Block 3
    const jsonData = await loadJSONData();
    window.stocksFullData  = jsonData.stocksFullData;
    window.etfFullData     = jsonData.etfFullData;
    window.futuresFullData = jsonData.futuresFullData;
    window.fxFullData      = jsonData.fxFullData;
    // Ensure spreads data is also loaded globally, assuming loadJSONData provides it.
    // If not, you might need to add a separate fetch('./spreads.json') here.
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
      return priceArray.map((_, i, arr) => (i > 0 ? (arr[i] - arr[i - 1]) / arr[i - 1] : 0));
    }

    // Populate historicalReturns for all categories
    for (const category in window.pricesData) {
      if (window.pricesData.hasOwnProperty(category)) {
        window.historicalReturns[category] = {};
        for (const instrument in window.pricesData[category]) {
          if (window.pricesData[category].hasOwnProperty(instrument)) {
            window.historicalReturns[category][instrument] = computeReturns(window.pricesData[category][instrument]);
          }
        }
      }
    }

    // 3) Generate sidebar content
    await generateSidebarContent();

    // 4) Initialize Block 3 tabs
    initBlock3Tabs();

    // 5) Initialize other global event handlers (e.g., fullscreen, YouTube popup)
    initEventHandlers();

    // 6) Add event listener to sidebar instrument items
    document.querySelectorAll('.instrument-item').forEach(item => {
      item.addEventListener('click', () => {
        const key = item.textContent.trim();

        // Hide all blocks first to ensure a clean display
        document.querySelectorAll('.content-block').forEach(blk => {
          if (blk) blk.style.display = 'none';
        });

        // Determine if it's a spread or another instrument type
        if (window.spreadsFullData && key in window.spreadsFullData) {
          // If it's a spread, show only Block 5 (Spread Chart)
          const spreadBlock = document.getElementById('block5');
          if (spreadBlock) spreadBlock.style.display = 'block';
          showSpread(key); // Call the spread chart rendering function
        } else {
          // It's a non-spread instrument (stock, ETF, future, FX)
          // Ensure Block 5 (spread chart) is hidden
          const spreadBlock = document.getElementById('block5');
          if (spreadBlock) spreadBlock.style.display = 'none';

          // Determine which data group the instrument belongs to
          let groupData = null;
          let pricesData = null;
          let options = {}; // Options for updateBlock3

          if (window.stocksFullData && key in window.stocksFullData) {
            groupData = window.stocksFullData;
            pricesData = window.pricesData.stockPrices;
            options = {}; // Default for stocks
          } else if (window.etfFullData && key in window.etfFullData) {
            groupData = window.etfFullData;
            pricesData = window.pricesData.etfPrices;
            options = { isETF: true };
          } else if (window.futuresFullData && key in window.futuresFullData) {
            groupData = window.futuresFullData;
            pricesData = window.pricesData.futuresPrices;
            options = { isFutures: true };
          } else if (window.fxFullData && key in window.fxFullData) {
            groupData = window.fxFullData;
            pricesData = window.pricesData.fxPrices;
            options = { isFX: true };
          }

          if (groupData) {
            // Show Blocks 1, 2, 3, 4 for the selected instrument
            document.getElementById('block1').style.display = 'block';
            document.getElementById('block2').style.display = 'block';
            document.getElementById('block3').style.display = 'block';
            document.getElementById('block4').style.display = 'block';

            updateChart(key, groupData);
            updateSymbolOverview(key, groupData);
            updateBlock3(key, groupData, options);
            updateBlock4(key, groupData, pricesData);
          } else {
            console.warn(`No full data found for instrument: ${key} in any known category.`);
            // You might want to display a user-friendly message on the dashboard here.
          }
        }
      });
    });

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
      // ensure spreads block is hidden on default view
      const spreadBlock = document.getElementById('block5');
      if (spreadBlock) spreadBlock.style.display = 'none';

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

// Ensure the DOM is fully loaded before initializing
document.addEventListener('DOMContentLoaded', initializeTrendScore);
