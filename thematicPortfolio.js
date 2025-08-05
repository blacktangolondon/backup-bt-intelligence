/* thematicPortfolio.js
 * -----------------------------------------------------------------------------
 * First layer: Risk Profile Selection for Portfolio Ideas
 * -----------------------------------------------------------------------------
 */

// Data model: six risk profiles
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
    label: 'Cautious – Balanced',
    description: 'A blend of defensive income and modest growth.',
  },
  {
    id: 'balanced',
    label: 'Balanced',
    description: 'Equal mix of growth and income.',
  },
  {
    id: 'balanced-adventurous',
    label: 'Balanced – Adventurous',
    description: 'Tilt toward growth with some defensive cushions.',
  },
  {
    id: 'adventurous',
    label: 'Adventurous',
    description: 'Higher-risk, high-reward strategies.',
  },
];

// Entry point: call this on page load
export function initThematicPortfolio() {
  const container = document.getElementById('portfolio-ideas');
  if (!container) {
    console.warn('Portfolio Ideas container not found: #portfolio-ideas');
    return;
  }
  renderRiskProfileSelection(container);
}

/**
 * Renders the grid of risk profile cards (first layer)
 * @param {HTMLElement} container
 */
function renderRiskProfileSelection(container) {
  container.innerHTML = '';

  const grid = document.createElement('div');
  grid.className = 'risk-profile-grid';

  riskProfiles.forEach(profile => {
    const card = document.createElement('div');
    card.className = 'risk-profile-card';
    card.setAttribute('data-profile-id', profile.id);

    const title = document.createElement('h3');
    title.textContent = profile.label;
    card.appendChild(title);

    const desc = document.createElement('p');
    desc.textContent = profile.description;
    card.appendChild(desc);

    card.addEventListener('click', () => {
      handleProfileSelect(profile.id);
    });

    grid.appendChild(card);
  });

  container.appendChild(grid);
}

/**
 * Handler when a risk profile is selected.
 * Clears the first layer and calls next renderer (to be implemented).
 * @param {string} profileId
 */
function handleProfileSelect(profileId) {
  const container = document.getElementById('portfolio-ideas');
  // Clear first layer
  container.innerHTML = '';

  // TODO: Render second layer (strategy listing) for chosen profile
  // e.g. renderStrategyList(profileId, container);

  console.log('Selected profile:', profileId);
}
