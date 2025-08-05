// thematicPortfolio.js
// -----------------------------------------------------------------------------
// Portfolio Ideas – Layer 1: Risk-Profile Selection
// -----------------------------------------------------------------------------

// 1. Define the six risk profiles
const riskProfiles = [
  { id: 'very-cautious',        label: 'Very Cautious',         description: 'Capital preservation with minimal volatility.' },
  { id: 'cautious',             label: 'Cautious',               description: 'Lower-risk strategies aimed at steady returns.' },
  { id: 'cautious-balanced',    label: 'Cautious – Balanced',    description: 'A blend of defensive income and modest growth.' },
  { id: 'balanced',             label: 'Balanced',               description: 'Equal mix of growth and income.' },
  { id: 'balanced-adventurous', label: 'Balanced – Adventurous', description: 'Tilt toward growth with some defensive cushions.' },
  { id: 'adventurous',          label: 'Adventurous',            description: 'Higher-risk, high-reward strategies.' },
];

// 2. Entry point: called by sidebar.js when “PORTFOLIO IDEAS” is clicked
export function initThematicPortfolio() {
  // hide other main views
  const main = document.getElementById('main-content');
  const builder = document.getElementById('portfolio-builder-template');
  if (main)    main.style.display = 'none';
  if (builder) builder.style.display = 'none';

  // show our container
  const tpl = document.getElementById('thematic-portfolio-template');
  if (!tpl) {
    console.error('⚠ thematic-portfolio-template not found');
    return;
  }
  tpl.style.display = 'block';

  // render layer 1
  renderRiskProfiles(tpl);
}

// 3. Render the grid of cards
function renderRiskProfiles(container) {
  container.innerHTML = '';
  const grid = document.createElement('div');
  grid.className = 'risk-profile-grid';

  riskProfiles.forEach(p => {
    const card = document.createElement('div');
    card.className = 'risk-profile-card';
    card.dataset.profileId = p.id;

    const h3 = document.createElement('h3');
    h3.textContent = p.label;

    const desc = document.createElement('p');
    desc.textContent = p.description;

    card.append(h3, desc);
    card.addEventListener('click', () => handleProfileSelect(p.id));
    grid.appendChild(card);
  });

  container.appendChild(grid);
}

// 4. Stub handler for when a profile is clicked
function handleProfileSelect(profileId) {
  console.log('▶ Profile chosen:', profileId);
  // clear layer 1
  const tpl = document.getElementById('thematic-portfolio-template');
  if (tpl) tpl.innerHTML = '';
  // TODO: render layer 2 strategies for this profile
}
