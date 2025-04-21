/**
 * sidebar.js
 * Generates the sidebar content from instruments.json
 */
export async function generateSidebarContent() {
  const sidebarList = document.getElementById('sidebar-list');
  if (!sidebarList) {
    console.error("Sidebar (#sidebar-list) not found");
    return;
  }
  sidebarList.innerHTML = "";

  // 1. Load instruments.json via fetch
  let instruments = [];
  try {
    const resp = await fetch("./instruments.json");
    instruments = await resp.json();
  } catch (err) {
    console.error("Failed to load instruments.json", err);
  }

  // 2. Group by asset_class
  const staticData = { STOCKS: [], ETFs: [], FUTURES: [], FX: [], CRYPTO: [] };
  instruments.forEach(({ ticker, asset_class }) => {
    const name = ticker;
    switch ((asset_class||"").toLowerCase()) {
      case "equity": staticData.STOCKS.push(name); break;
      case "etf":    staticData.ETFs.push(name);    break;
      case "future": case "futures":
                     staticData.FUTURES.push(name); break;
      case "fx":     staticData.FX.push(name);      break;
      case "crypto": staticData.CRYPTO.push(name);  break;
    }
  });

  // 3. Render sidebar (skip CRYPTO here if you like)
  const skip = ["CRYPTO"];
  Object.entries(staticData).forEach(([category, items]) => {
    if (skip.includes(category)) return;
    const displayName = category === "STOCKS" ? "STOCKS" : category;
    const li = document.createElement("li");
    li.textContent = displayName;
    sidebarList.appendChild(li);

    if (items.length) {
      li.classList.add("expandable");
      const toggle = document.createElement("div");
      toggle.classList.add("toggle-btn");
      toggle.innerHTML = `${displayName} <span>+</span>`;
      li.textContent = "";
      li.appendChild(toggle);

      const ul = document.createElement("ul");
      ul.classList.add("sub-list");
      items.forEach(inst => {
        const item = document.createElement("li");
        item.classList.add("instrument-item");
        item.textContent = inst;
        ul.appendChild(item);
      });
      li.appendChild(ul);

      toggle.addEventListener("click", () => {
        li.classList.toggle("expanded");
        toggle.querySelector("span").textContent =
          li.classList.contains("expanded") ? "-" : "+";
      });
    }
  });

  // 4. (optional) Full‑screen item
  const fs = document.createElement("li");
  fs.id = "sidebar-fullscreen";
  fs.textContent = "FULL SCREEN PLATFORM";
  fs.style.cursor = "pointer";
  fs.style.display = "none";
  sidebarList.appendChild(fs);
  fs.addEventListener("click", e => {
    e.stopPropagation();
    if (!document.fullscreenElement) document.documentElement.requestFullscreen();
    else document.exitFullscreen();
  });
}
