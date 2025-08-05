// thematicPortfolio.js
// -----------------------------------------------------------------------------
// “Portfolio Ideas” – Layer 1: Risk-Profile Selection
// -----------------------------------------------------------------------------

/* 1. Risk profiles */
const riskProfiles = [
  { id: 'very-cautious',        label: 'Very Cautious',         description: 'Capital preservation with minimal volatility.' },
  { id: 'cautious',             label: 'Cautious',               description: 'Lower-risk strategies aimed at steady returns.' },
  { id: 'cautious-balanced',    label: 'Cautious – Balanced',    description: 'A blend of defensive income and modest growth.' },
  { id: 'balanced',             label: 'Balanced',               description: 'Equal mix of growth and income.' },
  { id: 'balanced-adventurous', label: 'Balanced – Adventurous', description: 'Tilt toward growth with some defensive cushions.' },
  { id: 'adventurous',          label: 'Adventurous',            description: 'Higher-risk, high-reward strategies.' },
];

/* 2. Entry point: called _once_ by sidebar.js click */
export function initThematicPortfolio() {
  // 2.1 hide other sections
  document.getElementById("main-content").style.display = "none";
  document.getElementById("portfolio-builder-template").style.display = "none";

  // 2.2 show our container
  const tpl = document.getElementById("thematic-portfolio-template");
  tpl.style.display = "block";

  // 2.3 immediately render Layer 1
  loadThematicPortfolio();
}

/* 3. Layer 1 renderer */
function loadThematicPortfolio() {
  const tpl = document.getElementById("thematic-portfolio-template");
  tpl.innerHTML = "";

  const grid = document.createElement("div");
  grid.className = "risk-profile-grid";

  riskProfiles.forEach(p => {
    const card = document.createElement("div");
    card.className = "risk-profile-card";
    card.dataset.profileId = p.id;

    const h3 = document.createElement("h3");
    h3.textContent = p.label;
    card.appendChild(h3);

    const pDesc = document.createElement("p");
    pDesc.textContent = p.description;
    card.appendChild(pDesc);

    card.addEventListener("click", () => handleProfileSelect(p.id));
    grid.appendChild(card);
  });

  tpl.appendChild(grid);
}

/* 4. Stub for Layer 2 */
function handleProfileSelect(profileId) {
  const tpl = document.getElementById("thematic-portfolio-template");
  tpl.innerHTML = "";
  console.log("Risk profile selected:", profileId);
  // TODO → render strategy list for `profileId`
}
