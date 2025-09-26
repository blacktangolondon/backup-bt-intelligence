// events.js
import {
  updateChart,
  updateSIM,            // nuovo Block2 per equities
  updateBlock3,
  updateBlock4,
  initBlock3Tabs,
  openYouTubePopup
} from "./dashboard.js";
import { showSpread } from "./spreadView.js";

export function initEventHandlers(groupedData, pricesData, returnsData) {
  // ── Overlay helpers ─────────────────────────────────────────────────
  function openStrategyOverlay(url) {
    closeStrategyOverlay();
    document.documentElement.style.overflow = "hidden";
    const overlay = document.createElement("div");
    overlay.id = "strategy-overlay";
    Object.assign(overlay.style, {
      position: "fixed",
      inset: "0",
      background: "#000",
      zIndex: "100000",
      display: "block"
    });

    const iframe = document.createElement("iframe");
    iframe.id = "strategy-iframe";
    iframe.src = url || "";
    iframe.loading = "lazy";
    Object.assign(iframe.style, {
      position: "absolute",
      inset: "0",
      width: "100%",
      height: "100%",
      border: "0",
      display: "block"
    });
    overlay.appendChild(iframe);
    document.body.appendChild(overlay);

    const back = document.createElement("button");
    back.id = "strategy-back";
    back.textContent = "← Menu";
    Object.assign(back.style, {
      position: "fixed",
      top: "10px",
      left: "10px",
      zIndex: "100001",
      padding: "8px 12px",
      borderRadius: "8px",
      border: "1px solid #444",
      background: "#1e1e1e",
      color: "#ffa500",
      cursor: "pointer"
    });
    back.addEventListener("click", closeStrategyOverlay);
    document.body.appendChild(back);
  }

  function closeStrategyOverlay() {
    const overlay = document.getElementById("strategy-overlay");
    if (overlay) overlay.remove();
    const back = document.getElementById("strategy-back");
    if (back) back.remove();
    document.documentElement.style.overflow = "";
  }

  // ── Sidebar clicks ──────────────────────────────────────────────────
  document.addEventListener("click", (e) => {
    // Strategies → overlay full screen
    if (e.target && e.target.classList && e.target.classList.contains("strategy-item")) {
      const url = e.target.dataset.url || "";
      openStrategyOverlay(url);
      return;
    }

    // Instruments / Spreads → dashboard normale
    if (e.target && e.target.classList.contains("instrument-item")) {
      closeStrategyOverlay();

      const mc = document.getElementById("main-content");
      if (mc) mc.style.display = "grid";
      const pb = document.getElementById("portfolio-builder-template");
      if (pb) pb.style.display = "none";
      const tp = document.getElementById("thematic-portfolio-template");
      if (tp) tp.style.display = "none";

      document.querySelectorAll("#sidebar li.selected").forEach(n => n.classList.remove("selected"));
      e.target.classList.add("selected");

      const instrumentName = e.target.dataset.pair || e.target.dataset.key || e.target.textContent.trim();

      // nascondi tutti i blocchi
      document.querySelectorAll(".content-block").forEach(b => b.style.display = "none");

      // spread
      if (groupedData.SPREADS && groupedData.SPREADS[instrumentName]) {
        const spreadBlock = document.getElementById("block5");
        if (spreadBlock) spreadBlock.style.display = "block";
        showSpread(instrumentName);
        return;
      }

      // non-spread: mostra 1–4
      ["block1","block2","block3","block4"].forEach(id => {
        const el = document.getElementById(id);
        if (el) el.style.display = "block";
      });

      // EQUITIES → nuovo layout
      if (groupedData.STOCKS && groupedData.STOCKS[instrumentName]) {
        updateChart(instrumentName, groupedData.STOCKS);                       // Block1 TV chart
        updateSIM(instrumentName, groupedData.STOCKS, pricesData);             // Block2 SIM
        updateBlock3(instrumentName, groupedData.STOCKS, pricesData);          // Block3 metrics
        updateBlock4(instrumentName, groupedData.STOCKS, returnsData);         // Block4 fondamentali

      // ETF → legacy (puoi adeguare in seguito)
      } else if (groupedData.ETFS && groupedData.ETFS[instrumentName]) {
        updateChart(instrumentName, groupedData.ETFS);
        // per ora lasciamo il blocco2 legacy (se esiste altrove). Riutilizziamo SIM su ETF? opzionale:
        updateSIM(instrumentName, groupedData.ETFS, pricesData);
        updateBlock3(instrumentName, groupedData.ETFS, pricesData);
        updateBlock4(instrumentName, groupedData.ETFS, returnsData);

      // FUTURES/FX → comportamento esistente
      } else if (groupedData.FUTURES && groupedData.FUTURES[instrumentName]) {
        updateChart(instrumentName, groupedData.FUTURES);
        // qui potresti richiamare i vecchi renderer simbol overview ecc.
        updateBlock3(instrumentName, groupedData.FUTURES, pricesData);
        updateBlock4(instrumentName, groupedData.FUTURES, returnsData);
      } else if (groupedData.FX && groupedData.FX[instrumentName]) {
        updateChart(instrumentName, groupedData.FX);
        updateBlock3(instrumentName, groupedData.FX, pricesData);
        updateBlock4(instrumentName, groupedData.FX, returnsData);
      }
    }
  });

  // altri handler globali se necessari…
}
