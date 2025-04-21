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

  // 2. Build staticData by asset_class
  const staticData = {
    STOCKS: [], ETFs: [], FUTURES: [], FX: [], CRYPTO: [],
    "PORTFOLIO BUILDER": [], "THEMATIC PORTFOLIO": [], "LIVE TV": [],
    "MEMBERS CHAT": [], SUPPORT: []
  };
  instruments.forEach(({ ticker, asset_class }) => {
    const name = ticker;
    switch ((asset_class || "").toLowerCase()) {
      case "equity": staticData.STOCKS.push(name); break;
      case "etf":    staticData.ETFs.push(name);    break;
      case "future":
      case "futures":staticData.FUTURES.push(name); break;
      case "fx":     staticData.FX.push(name);      break;
      case "crypto": staticData.CRYPTO.push(name);  break;
    }
  });

  // 3. Render sidebar
  const skip = ["SPREAD","CRYPTO","MEMBERS CHAT","SUPPORT"];
  Object.keys(staticData).forEach(category => {
    if (skip.includes(category)) return;
    const displayName = category === "THEMATIC PORTFOLIO" ? "PORTFOLIO IDEAS" : category;
    const li = document.createElement("li");
    li.textContent = displayName;
    sidebarList.appendChild(li);

    const items = staticData[category];
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
        toggle.querySelector("span").textContent = li.classList.contains("expanded") ? "-" : "+";
      });
    }
  });

  // 4. Full‐screen platform item
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
