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

/**
 * Initialize global event handlers for the dashboard, including spreads.
 * @param {Object} groupedData - All instruments grouped by asset class.
 * @param {Object} pricesData - Price history data for non‐spread instruments.
 * @param {Object} returnsData - Historical returns for correlation analysis.
 */
export function initEventHandlers(groupedData, pricesData, returnsData) {
  // Global click handler for hiding Portfolio and routing
  document.addEventListener('click', (e) => {
    // Detect clicks on the sidebar "Portfolio" item by its text
    const isPortfolioLink = e.target &&
      e.target.tagName === 'LI' &&
      e.target.textContent.trim() === 'PORTFOLIO';

    // Hide Portfolio container on all clicks except the Portfolio link itself
    if (!isPortfolioLink) {
      const pf = document.getElementById('portfolios-template');
      if (pf) pf.style.display = 'none';
    }

    // ---------- Dashboard navigation ----------
    if (e.target && e.target.classList.contains('instrument-item')) {
      // Show main dashboard, hide other templates
      document.getElementById('main-content').style.display = 'grid';
      document.getElementById('portfolio-builder-template').style.display = 'none';
      document.getElementById('thematic-portfolio-template').style.display = 'none';

      // Clear previous selection and highlight current
      document.querySelectorAll('#sidebar li.selected')
        .forEach(item => item.classList.remove('selected'));
      e.target.classList.add('selected');

      const instrumentName = e.target.textContent.trim();

      // Hide all dashboard blocks
      document.querySelectorAll('.content-block').forEach(b => b.style.display = 'none');

      // Handle spreads
      if (groupedData.SPREADS && groupedData.SPREADS[instrumentName]) {
        const spreadBlock = document.getElementById('block5');
        if (spreadBlock) spreadBlock.style.display = 'block';
        showSpread(instrumentName);
        return;
      }

      // Non-spreads: show blocks 1–4
      ['block1','block2','block3','block4'].forEach(id => {
        const el = document.getElementById(id);
        if (el) el.style.display = 'block';
      });

      // Stocks
      if (groupedData.STOCKS && groupedData.STOCKS[instrumentName]) {
        updateChart(instrumentName, groupedData.STOCKS);
        updateSymbolOverview(instrumentName, groupedData.STOCKS);
        updateBlock3(instrumentName, groupedData.STOCKS);
        updateBlock4(instrumentName, groupedData.STOCKS, returnsData);
      }
      // ETFs
      else if (groupedData.ETFS && groupedData.ETFS[instrumentName]) {
        updateChart(instrumentName, groupedData.ETFS);
        updateSymbolOverview(instrumentName, groupedData.ETFS);
        updateBlock3(instrumentName, groupedData.ETFS, { isETF: true });
        updateBlock4(instrumentName, groupedData.ETFS, returnsData);
      }
      // Futures
      else if (groupedData.FUTURES && groupedData.FUTURES[instrumentName]) {
        updateChart(instrumentName, groupedData.FUTURES);
        updateSymbolOverview(instrumentName, groupedData.FUTURES);
        updateBlock3(instrumentName, groupedData.FUTURES, { isFutures: true });
        updateBlock4(instrumentName, groupedData.FUTURES, returnsData);
      }
      // FX
      else if (groupedData.FX && groupedData.FX[instrumentName]) {
        updateChart(instrumentName, groupedData.FX);
        updateSymbolOverview(instrumentName, groupedData.FX);
        updateBlock3(instrumentName, groupedData.FX, { isFX: true });
        updateBlock4(instrumentName, groupedData.FX, returnsData);
      }
      // Crypto
      else if (groupedData.CRYPTO && groupedData.CRYPTO[instrumentName]) {
        updateChart(instrumentName, groupedData.CRYPTO);
        updateSymbolOverview(instrumentName, groupedData.CRYPTO);
        updateBlock3(instrumentName, groupedData.CRYPTO);
        updateBlock4(instrumentName, groupedData.CRYPTO, returnsData);
      }
      // Fallback: show trend score only
      else {
        updateBlock3(instrumentName, groupedData.STOCKS);
      }
    }

    // ---------- Portfolio Ideas handling ----------
    if (e.target && e.target.classList.contains('clickable-idea')) {
      const instrument = e.target.dataset.instrument;
      const base = window.location.origin + window.location.pathname;
      window.open(
        `${base}?instrument=${encodeURIComponent(instrument)}`,
        '_blank'
      );
    }

    // ---------- Portfolio link handling ----------
    if (isPortfolioLink) {
      // Show Portfolio container and render
      const pst = document.getElementById('portfolios-template');
      pst.style.display = 'block';
      renderPortfolioPage();  // ensure you’ve imported this if needed
    }
  });

  // Fullscreen button event
  const fsButton = document.getElementById('fullscreen-button');
  if (fsButton) {
    fsButton.addEventListener('click', () => {
      const block1 = document.getElementById('block1');
      if (block1.requestFullscreen) block1.requestFullscreen();
      else if (block1.webkitRequestFullscreen) block1.webkitRequestFullscreen();
      else console.error('Fullscreen API not supported.');
    });
  }

  document.addEventListener('fullscreenchange', () => {
    if (typeof initBlock3Tabs === 'function') initBlock3Tabs();
  });

  // YouTube popup close event
  const ytClose = document.getElementById('youtube-popup-close');
  if (ytClose) {
    ytClose.addEventListener('click', () => {
      const ytPopup = document.getElementById('youtube-popup');
      if (ytPopup) ytPopup.style.display = 'none';
    });
  }

  // jQuery UI Autocomplete for sidebar search
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
