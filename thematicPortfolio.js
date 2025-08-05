// thematicPortfolio.js
// -----------------------------------------------------------------------------
// Pagina “Portfolio Ideas” – Thematic Portfolio (Layer 1: Risk-Profile Selection)
// -----------------------------------------------------------------------------

/* -------------------------------------------------------------------------- */
/* 1. Entry point                                                             */
/* -------------------------------------------------------------------------- */
export function initThematicPortfolio() {
  // Hide other main views
  const main = document.getElementById("main-content");
  const builder = document.getElementById("portfolio-builder-template");
  if (main) main.style.display = "none";
  if (builder) builder.style.display = "none";
  
  // Show thematic portfolio container
  const tpl = document.getElementById("thematic-portfolio-template");
  if (!tpl) {
    console.error("#thematic-portfolio-template not found");
    return;
  }
  tpl.style.display = "block";
  
  // Render Layer 1
  renderRiskProfiles(tpl);
}

/* -------------------------------------------------------------------------- */
/* 2. Risk profiles definition (Layer 1 data)                                 */
/* -------------------------------------------------------------------------- */
const riskProfiles = [
  { id: 'very-cautious',        label: 'Very Cautious',         description: 'Capital preservation with minimal volatility.' },
  { id: 'cautious',             label: 'Cautious',               description: 'Lower-risk strategies aimed at steady returns.' },
  { id: 'cautious-balanced',    label: 'Cautious – Balanced',    description: 'A blend of defensive income and modest growth.' },
  { id: 'balanced',             label: 'Balanced',               description: 'Equal mix of growth and income.' },
  { id: 'balanced-adventurous', label: 'Balanced – Adventurous', description: 'Tilt toward growth with some defensive cushions.' },
  { id: 'adventurous',          label: 'Adventurous',            description: 'Higher-risk, high-reward strategies.' }
];

/* -------------------------------------------------------------------------- */
/* 3. Build Layer 1                                                             */
/* -------------------------------------------------------------------------- */
function renderRiskProfiles(container) {
  // clear existing
  container.innerHTML = '';

  const grid = document.createElement('div');
  grid.className = 'risk-profile-grid';

  riskProfiles.forEach(profile => {
    const card = document.createElement('div');
    card.className = 'risk-profile-card';
    card.dataset.profileId = profile.id;

    const title = document.createElement('h3');
    title.textContent = profile.label;
    card.appendChild(title);

    const desc = document.createElement('p');
    desc.textContent = profile.description;
    card.appendChild(desc);

    card.addEventListener('click', () => handleProfileSelect(profile.id));
    grid.appendChild(card);
  });

  container.appendChild(grid);
}

/* -------------------------------------------------------------------------- */
/* 4. Handler for profile selection (stub for Layer 2)                        */
/* -------------------------------------------------------------------------- */
function handleProfileSelect(profileId) {
  console.log('Selected risk profile:', profileId);
  const tpl = document.getElementById('thematic-portfolio-template');
  if (!tpl) return;
  // clear Layer 1
  tpl.innerHTML = '';
  // TODO: render Layer 2 strategies for profileId
}
