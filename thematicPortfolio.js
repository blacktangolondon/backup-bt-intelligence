// thematicPortfolio.js
// -----------------------------------------------------------------------------
// “Portfolio Ideas” – Layer 1: Risk-Profile Selection
// -----------------------------------------------------------------------------

/* -------------------------------------------------------------------------- */
/* 1. Risk profiles definition                                                */
/* -------------------------------------------------------------------------- */
const riskProfiles = [
  { id: 'very-cautious',         label: 'Very Cautious',         description: 'Capital preservation with minimal volatility.' },
  { id: 'cautious',              label: 'Cautious',               description: 'Lower-risk strategies aimed at steady returns.' },
  { id: 'cautious-balanced',     label: 'Cautious – Balanced',    description: 'A blend of defensive income and modest growth.' },
  { id: 'balanced',              label: 'Balanced',               description: 'Equal mix of growth and income.' },
  { id: 'balanced-adventurous',  label: 'Balanced – Adventurous', description: 'Tilt toward growth with some defensive cushions.' },
  { id: 'adventurous',           label: 'Adventurous',            description: 'Higher-risk, high-reward strategies.' },
];

/* -------------------------------------------------------------------------- */
/* 2. Entry point – hook into sidebar                                         */
/* -------------------------------------------------------------------------- */
export function initThematicPortfolio() {
  const sidebar = document.getElementById("sidebar-list");
  if (!sidebar) return;

  sidebar.addEventListener("click", e => {
    const li = e.target.closest("li");
    if (!li) return;
    if (li.textContent.trim().toUpperCase() === "PORTFOLIO IDEAS") {
      // hide other views
      document.getElementById("main-content").style.display = "none";
      document.getElementById("portfolio-builder-template").style.display = "none";
      // show our thematic portfolio container
      const tpl = document.getElementById("thematic-portfolio-template");
      tpl.style.display = "block";
      // render Layer 1
      loadThematicPortfolio();
    }
  });
}

/* -------------------------------------------------------------------------- */
/* 3. Layer 1 renderer – risk-profile grid                                     */
/* -------------------------------------------------------------------------- */
function loadThematicPortfolio() {
  const tpl = document.getElementById("thematic-portfolio-template");
  tpl.innerHTML = ""; 

  const grid = document.createElement("div");
  grid.className = "risk-profile-grid";

  riskProfiles.forEach(profile => {
    const card = document.createElement("div");
    card.className = "risk-profile-card";
    card.dataset.profileId = profile.id;

    const title = document.createElement("h3");
    title.textContent = profile.label;
    card.appendChild(title);

    const desc = document.createElement("p");
    desc.textContent = profile.description;
    card.appendChild(desc);

    card.addEventListener("click", () => handleProfileSelect(profile.id));

    grid.appendChild(card);
  });

  tpl.appendChild(grid);
}

/* -------------------------------------------------------------------------- */
/* 4. Stub for Layer 2 hook                                                    */
/* -------------------------------------------------------------------------- */
function handleProfileSelect(profileId) {
  const tpl = document.getElementById("thematic-portfolio-template");
  tpl.innerHTML = ""; 
  // TODO: render Layer 2 (strategy listing) for this risk profile
  console.log("Risk profile selected:", profileId);
}
