// thematicPortfolio.js
// -----------------------------------------------------------------------------
// “Portfolio Ideas” – Layer 1: Risk‐Profile Selection
// -----------------------------------------------------------------------------

/* -------------------------------------------------------------------------- */
/* 1. Risk profiles definition                                                */
/* -------------------------------------------------------------------------- */
const riskProfiles = [
  {
    id: 'very-cautious',
    label: 'Very Cautious',
    description: 'Capital preservation with minimal volatility.',
  },
  {
    id: 'cautious',
    label: 'Cautious',
    description: 'Lower-risk strategies aimed at steady returns.',
  },
  {
    id: 'cautious-balanced',
    label: 'Cautious – Balanced',
    description: 'A blend of defensive income and modest growth.',
  },
  {
    id: 'balanced',
    label: 'Balanced',
    description: 'Equal mix of growth and income.',
  },
  {
    id: 'balanced-adventurous',
    label: 'Balanced – Adventurous',
    description: 'Tilt toward growth with some defensive cushions.',
  },
  {
    id: 'adventurous',
    label: 'Adventurous',
    description: 'Higher-risk, high-reward strategies.',
  },
];

/* -------------------------------------------------------------------------- */
/* 2. Entry point – hook into sidebar                                         */
/* -------------------------------------------------------------------------- */
export function initThematicPortfolio() {
  const sidebar = document.getElementById("sidebar-list");
  if (!sidebar) return;

  sidebar.addEventListener("click", (e) => {
    const li = e.target.closest("li");
    if (!li) return;
    if (li.textContent.trim().toUpperCase() === "PORTFOLIO IDEAS") {
      // hide other views
      document.getElementById("main-content").style.display = "none";
      document.getElementById("portfolio-builder-template").style.display = "none";
      // show our template container
      const tpl = document.getElementById("thematic-portfolio-template");
      tpl.style.display = "block";
      // render first layer
      loadThematicPortfolio(tpl);
    }
  });
}

/* -------------------------------------------------------------------------- */
/* 3. First layer renderer                                                    */
/* -------------------------------------------------------------------------- */
function loadThematicPortfolio(container) {
  // clear any previous
  container.innerHTML = '';

  // grid wrapper
  const grid = document.createElement('div');
  grid.className = 'risk-profile-grid';

  riskProfiles.forEach(profile => {
    const card = document.createElement('div');
    card.className = 'risk-profile-card';
    card.dataset.profileId = profile.id;

    const h3 = document.createElement('h3');
    h3.textContent = profile.label;
    card.appendChild(h3);

    const p = document.createElement('p');
    p.textContent = profile.description;
    card.appendChild(p);

    card.addEventListener('click', () => {
      handleProfileSelect(profile.id);
    });

    grid.appendChild(card);
  });

  container.appendChild(grid);
}

/* -------------------------------------------------------------------------- */
/* 4. Handler for profile click – stub for layer 2                             */
/* -------------------------------------------------------------------------- */
function handleProfileSelect(profileId) {
  const tpl = document.getElementById("thematic-portfolio-template");
  // clear first layer
  tpl.innerHTML = '';
  // TODO: render layer 2 (strategy listing) for profileId
  console.log('Risk profile selected:', profileId);
}
