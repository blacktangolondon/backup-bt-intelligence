// portfolios.js
// -----------------------------------------------------------------------------
// “Portfolios” section – Layer 1: Risk‐Profile Selection
// -----------------------------------------------------------------------------

/**
 * initPortfolios
 * Hides all other main views and shows the “portfolios” container,
 * then renders the six risk‐profile cards (Layer 1).
 */
export function initPortfolios() {
  // 1) Hide existing main views
  const mainContent = document.getElementById("main-content");
  const builderTpl  = document.getElementById("portfolio-builder-template");
  const thematicTpl = document.getElementById("thematic-portfolio-template");
  if (mainContent) mainContent.style.display = "none";
  if (builderTpl)  builderTpl.style.display  = "none";
  if (thematicTpl) thematicTpl.style.display = "none";

  // 2) Show the new portfolios container
  const portTpl = document.getElementById("portfolios-template");
  if (!portTpl) {
    console.error("#portfolios-template not found");
    return;
  }
  portTpl.style.display = "block";

  // 3) Render the risk‐profile grid into it
  renderRiskProfiles(portTpl);
}

// 4) Data for Layer 1
const riskProfiles = [
  { id: "very-cautious",        label: "Very Cautious",         description: "Capital preservation with minimal volatility." },
  { id: "cautious",             label: "Cautious",               description: "Lower-risk strategies aimed at steady returns." },
  { id: "cautious-balanced",    label: "Cautious–Balanced",      description: "A blend of defensive income and modest growth." },
  { id: "balanced",             label: "Balanced",               description: "Equal mix of growth and income." },
  { id: "balanced-adventurous", label: "Balanced–Adventurous",   description: "Tilt toward growth with some defensive cushions." },
  { id: "adventurous",          label: "Adventurous",            description: "Higher-risk, high-reward strategies." }
];

/**
 * renderRiskProfiles
 * Builds a 2×3 grid of cards for each risk-profile.
 */
function renderRiskProfiles(container) {
  container.innerHTML = "";
  const grid = document.createElement("div");
  grid.className = "risk-profile-grid";

  riskProfiles.forEach(profile => {
    const card = document.createElement("div");
    card.className = "risk-profile-card";
    card.dataset.profileId = profile.id;

    const h3 = document.createElement("h3");
    h3.textContent = profile.label;
    card.appendChild(h3);

    const p = document.createElement("p");
    p.textContent = profile.description;
    card.appendChild(p);

    card.addEventListener("click", () => handleProfileSelect(profile.id));
    grid.appendChild(card);
  });

  container.appendChild(grid);
}

/**
 * handleProfileSelect
 * Placeholder for when a user clicks a risk-profile card.
 * (Layer 2 rendering would go here.)
 */
function handleProfileSelect(profileId) {
  console.log("Portfolios › Profile selected:", profileId);
  const tpl = document.getElementById("portfolios-template");
  if (tpl) tpl.innerHTML = "";  // clear Layer 1
  // TODO: render Layer 2 strategies for `profileId`
}
