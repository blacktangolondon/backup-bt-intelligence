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
import { initEventHandlers } from "./events.js";          // ← import from events.js
import { initPortfolioBuilder } from "./portfolioBuilder.js";
import { initThematicPortfolio } from "./thematicPortfolio.js";
import { showSpread } from "./spreadView.js";             // ← Your spread chart renderer

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
    function computeReturns(priceArray) {
      return priceArray.map((p, i, arr) =>
        i === 0 ? 0 : (p.close / arr[i - 1].close) - 1
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

    // 3) Sidebar, Portfolio Builder & Thematic Portfolio
    await generateSidebarContent();
    initPortfolioBuilder();
    initThematicPortfolio();

    // 4) TrendScore (Block 3) tabs
    initBlock3Tabs();

    // 5) Global event handlers (sidebar clicks for stocks/etfs/etc, fullscreen, YouTube)
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

    // 6) SPREAD clicks: hide blocks 1–4, show block5, and render chart
    document.querySelectorAll('.instrument-item').forEach(el => {
      el.addEventListener('click', () => {
        const key = el.textContent.trim();
        if (key.includes('/')) {
          // hide Blocks 1–4
          [1, 2, 3, 4].forEach(n => {
            const blk = document.getElementById(`block${n}`);
            if (blk) blk.style.display = 'none';
          });
          // show Spread block5
          const spreadBlock = document.getElementById('block5');
          if (spreadBlock) spreadBlock.style.display = 'block';

          // render the spread chart
          showSpread(key);
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
      // ensure spreads block is hidden
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

initializeTrendScore();
