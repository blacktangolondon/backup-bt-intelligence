// portfolio.js
// Renders the Portfolio overview page with six risk-based portfolio cards

function renderPortfolioPage() {
  // Clear existing content
  const content = document.getElementById('main-content') || document.getElementById('content');
  content.innerHTML = '';

  // Page title
  const title = document.createElement('h2');
  title.textContent = 'Portfolio';
  title.classList.add('page-title');
  content.appendChild(title);

  // Define portfolio levels
  const portfolios = [
    'Very Cautious',
    'Cautious',
    'Cautious to Balanced',
    'Balanced',
    'Balanced to Adventurous',
    'Adventurous'
  ];

  // Create grid container
  const grid = document.createElement('div');
  grid.classList.add('portfolio-grid');

  // Generate card for each portfolio
  portfolios.forEach(name => {
    const card = document.createElement('div');
    card.classList.add('portfolio-card');
    card.textContent = name;
    card.addEventListener('click', () => {
      // Navigate or load details for the selected portfolio
      window.location.hash = `#portfolio/${name.toLowerCase().replace(/ /g, '-')}`;
      // Placeholder for future content load
      content.innerHTML = `<h3>${name} Portfolio</h3><p>Loading...</p>`;
    });
    grid.appendChild(card);
  });

  content.appendChild(grid);
}

export { renderPortfolioPage };
