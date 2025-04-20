// events.js
// Registers UI event handlers.
import { updateChart, updateSymbolOverview, updateBlock3, updateBlock4, initBlock3Tabs, openYouTubePopup } from "./dashboard.js";
import { generateSidebarContent } from "./sidebar.js";

export function initEventHandlers(groupedData, pricesData) {
  // Handle clicks on the sidebar
  document.addEventListener('click', (e) => {
    // Only proceed if a sidebar <li> was clicked
    const li = e.target.closest('li');
    if (!li) return;

    // If it's an instrument-item, switch back to main dashboard
    if (li.classList.contains('instrument-item')) {
      // Show dashboard, hide templates
      document.getElementById('main-content').style.display = '';
      document.getElementById('portfolio-builder-template').style.display = 'none';
      document.getElementById('thematic-portfolio-template').style.display = 'none';

      // Highlight the selected instrument
      document.querySelectorAll('#sidebar li.selected').forEach(item => item.classList.remove('selected'));
      li.classList.add('selected');

      const instrumentName = li.textContent.trim();
      // Update dashboard content based on asset class
      if (groupedData.STOCKS && groupedData.STOCKS[instrumentName]) {
        updateChart(instrumentName, groupedData.STOCKS);
        updateSymbolOverview(instrumentName, groupedData.STOCKS);
        updateBlock3(instrumentName, groupedData.STOCKS);
        updateBlock4(instrumentName, groupedData.STOCKS, pricesData.stockPrices);
      } else if (groupedData.ETFS && groupedData.ETFS[instrumentName]) {
        updateChart(instrumentName, groupedData.ETFS);
        updateSymbolOverview(instrumentName, groupedData.ETFS);
        updateBlock3(instrumentName, groupedData.ETFS, { isETF: true });
        updateBlock4(instrumentName, groupedData.ETFS, pricesData.etfPrices);
      } else if (groupedData.FUTURES && groupedData.FUTURES[instrumentName]) {
        updateChart(instrumentName, groupedData.FUTURES);
        updateSymbolOverview(instrumentName, groupedData.FUTURES);
        updateBlock3(instrumentName, groupedData.FUTURES, { isFutures: true });
        updateBlock4(instrumentName, groupedData.FUTURES, pricesData.futuresPrices);
      } else if (groupedData.FX && groupedData.FX[instrumentName]) {
        updateChart(instrumentName, groupedData.FX);
        updateSymbolOverview(instrumentName, groupedData.FX);
        updateBlock3(instrumentName, groupedData.FX, { isFX: true });
        updateBlock4(instrumentName, groupedData.FX, pricesData.fxPrices);
      } else if (groupedData.CRYPTO && groupedData.CRYPTO[instrumentName]) {
        updateChart(instrumentName, groupedData.CRYPTO);
        updateSymbolOverview(instrumentName, groupedData.CRYPTO);
        updateBlock3(instrumentName, groupedData.CRYPTO);
        updateBlock4(instrumentName, groupedData.CRYPTO, {});
      } else {
        // Fallback
        updateBlock3(instrumentName, groupedData.STOCKS);
      }
    }
  });

  // Fullscreen button event.
  const fsButton = document.getElementById("fullscreen-button");
  if (fsButton) {
    fsButton.addEventListener("click", () => {
      const block1 = document.getElementById("block1");
      if (block1.requestFullscreen) block1.requestFullscreen();
      else if (block1.webkitRequestFullscreen) block1.webkitRequestFullscreen();
      else console.error("Fullscreen API not supported.");
    });
  }
  document.addEventListener("fullscreenchange", () => {
    const btn = document.getElementById("fullscreen-button");
    if (btn && typeof window.updateFullscreenButton === "function") {
      window.updateFullscreenButton();
    }
  });

  // YouTube popup close event.
  const ytClose = document.getElementById("youtube-popup-close");
  if (ytClose) {
    ytClose.addEventListener("click", () => {
      const ytPopup = document.getElementById("youtube-popup");
      if (ytPopup) ytPopup.style.display = "none";
    });
  }

  // jQuery UI Autocomplete for sidebar search.
  if (typeof $ === "function" && $.fn.autocomplete) {
    const instrumentNames = [];
    document.querySelectorAll("#sidebar-list .instrument-item").forEach(elem => {
      instrumentNames.push(elem.textContent.trim());
    });
    $("#sidebar-search").autocomplete({
      source: instrumentNames,
      minLength: 1,
      select: function(event, ui) {
        $("#sidebar-list .instrument-item").each(function() {
          $(this).toggle($(this).text().trim() === ui.item.value);
        });
        $("#sidebar-list .instrument-item").filter(function() {
          return $(this).text().trim() === ui.item.value;
        }).click();
      }
    });
    $("#sidebar-search-clear").on("click", function() {
      $("#sidebar-search").val("");
      $("#sidebar-list .instrument-item").show();
    });
  }
}
