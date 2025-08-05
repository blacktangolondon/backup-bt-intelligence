// events.js
import {
  updateChart,
  updateSymbolOverview,
  updateBlock3,
  updateBlock4,
  initBlock3Tabs,
  openYouTubePopup
} from "./dashboard.js";
import { showSpread } from "./spreadView.js";
import { renderPortfolioPage } from "./portfolio.js";

/**
 * Initialize global event handlers for the dashboard, including spreads and Portfolio.
 * @param {Object} groupedData - All instruments grouped by asset class.
 * @param {Object} pricesData - Price history data for non-spread instruments.
 * @param {Object} returnsData - Historical returns for correlation analysis.
 */
export function initEventHandlers(groupedData, pricesData, returnsData) {
  // Unified click handler for sidebar navigation and content swapping
  document.addEventListener('click', (e) => {
    // 1) Portfolio sidebar click
    if (
      e.target &&
      e.target.tagName === 'LI' &&
      e.target.textContent.trim().toUpperCase() === 'PORTFOLIO'
    ) {
      // Hide main dashboard
      document.getElementById('main-content').style.display = 'none';
      document.getElementById('portfolio-builder-template').style.display = 'none';
      document.getElementById('thematic-portfolio-template').style.display = 'none';

      // Show portfolio container and render
      const pst = document.getElementById('portfolios-template');
      pst.style.display = 'block';
      renderPortfolioPage();
      return;
    }

    // 2) Instrument-item click (dashboard)
    if (e.target && e.target.classList.contains('instrument-item')) {
      // Hide portfolio
      const pf = document.getElementById('portfolios-template');
      if (pf) pf.style.display = 'none';

      // Show main dashboard
      document.getElementById('main-content').style.display = 'grid';
      document.getElementById('portfolio-builder-template').style.display = 'none';
      document.getElementById('thematic-portfolio-template').style.display = 'none';

      // Highlight selected
      document.querySelectorAll('#sidebar li.selected')
        .forEach(item => item.classList.remove('selected'));
      e.target.classList.add('selected');

      const instrumentName = e.target.textContent.trim();

      // Hide dashboard blocks
      document.querySelectorAll('.content-block').forEach(b => b.style.display = 'none');

      // Spread handling
      if (groupedData.SPREADS && groupedData.SPREADS[instrumentName]) {
        const spreadBlock = document.getElementById('block5');
        if (spreadBlock) spreadBlock.style.display = 'block';
        showSpread(instrumentName);
        return;
      }

      // Non-spread: show blocks 1-4
      ['block1','block2','block3','block4'].forEach(id => {
        const el = document.getElementById(id);
        if (el) el.style.display = 'block';
      });

      // Update content based on asset type
      if (groupedData.STOCKS && groupedData.STOCKS[instrumentName]) {
        updateChart(instrumentName, groupedData.STOCKS);
        updateSymbolOverview(instrumentName, groupedData.STOCKS);
        updateBlock3(instrumentName, groupedData.STOCKS);
        updateBlock4(instrumentName, groupedData.STOCKS, returnsData);
      } else if (groupedData.ETFS && groupedData.ETFS[instrumentName]) {
        updateChart(instrumentName, groupedData.ETFS);
        updateSymbolOverview(instrumentName, groupedData.ETFS);
        updateBlock3(instrumentName, groupedData.ETFS, { isETF: true });
        updateBlock4(instrumentName, groupedData.ETFS, returnsData);
      } else if (groupedData.FUTURES && groupedData.FUTURES[instrumentName]) {
        updateChart(instrumentName, groupedData.FUTURES);
        updateSymbolOverview(instrumentName, groupedData.FUTURES);
        updateBlock3(instrumentName, groupedData.FUTURES, { isFutures: true });
        updateBlock4(instrumentName, groupedData.FUTURES, returnsData);
      } else if (groupedData.FX && groupedData.FX[instrumentName]) {
        updateChart(instrumentName, groupedData.FX);
        updateSymbolOverview(instrumentName, groupedData.FX);
        updateBlock3(instrumentName, groupedData.FX, { isFX: true });
        updateBlock4(instrumentName, groupedData.FX, returnsData);
      } else if (groupedData.CRYPTO && groupedData.CRYPTO[instrumentName]) {
        updateChart(instrumentName, groupedData.CRYPTO);
        updateSymbolOverview(instrumentName, groupedData.CRYPTO);
        updateBlock3(instrumentName, groupedData.CRYPTO);
        updateBlock4(instrumentName, groupedData.CRYPTO, returnsData);
      } else {
        updateBlock3(instrumentName, groupedData.STOCKS);
      }
      return;
    }

    // 3) Portfolio Ideas click (open in new tab)
    if (e.target && e.target.classList.contains('clickable-idea')) {
      const pf2 = document.getElementById('portfolios-template');
      if (pf2) pf2.style.display = 'none';
      const instrument = e.target.dataset.instrument;
      const base = window.location.origin + window.location.pathname;
      window.open(
        `${base}?instrument=${encodeURIComponent(instrument)}`,
        '_blank'
      );
    }
  });

  // Fullscreen button
  const fsButton = document.getElementById('fullscreen-button');
  if (fsButton) {
    fsButton.addEventListener('click', () => {
      const block1 = document.getElementById('block1');
      if (block1.requestFullscreen) block1.requestFullscreen();
      else if (block1.webkitRequestFullscreen) block1.webkitRequestFullscreen();
      else console.error('Fullscreen API not supported.');
    });
  }

  // Refresh tabs after full screen
  document.addEventListener('fullscreenchange', () => {
    if (typeof initBlock3Tabs === 'function') initBlock3Tabs();
  });

  // YouTube popup close
  const ytClose = document.getElementById('youtube-popup-close');
  if (ytClose) {
    ytClose.addEventListener('click', () => {
      const ytPopup = document.getElementById('youtube-popup');
      if (ytPopup) ytPopup.style.display = 'none';
    });
  }

  // Autocomplete for sidebar search
  if (typeof $ === 'function' && $.fn.autocomplete) {
    const instrumentNames = [];
    document.querySelectorAll('#sidebar-list .instrument-item')
      .forEach(elem => instrumentNames.push(elem.textContent.trim()));

    $('#sidebar-search').autocomplete({
      source: instrumentNames,
      minLength: 1,
      select: function(event, ui) {
        $('#sidebar-list .instrument-item').each(function() {
          $(this).toggle($(this).text().trim() === ui.item.value);
        });
        $('#sidebar-list .instrument-item')
          .filter(function() { return $(this).text().trim() === ui.item.value; })
          .click();
      }
    });

    $('#sidebar-search-clear').on('click', function() {
      $('#sidebar-search').val('');
      $('#sidebar-list .instrument-item').show();
    });
  }
}
