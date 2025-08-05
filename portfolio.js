// portfolio.js
// Renders the Portfolio overview page with six risk-based portfolio cards

function renderPortfolioPage() {
  // Clear existing content
  const container = document.getElementById('portfolios-template') || document.getElementById('main-content');
  container.innerHTML = '';

  // Create a wrapper for styling
  const page = document.createElement('div');
  page.classList.add('portfolio-page');
  container.appendChild(page);

  // Page title
  const pageTitle = document.createElement('h2');
  pageTitle.textContent = 'Portfolio';
  pageTitle.classList.add('page-title');
  page.appendChild(pageTitle);

  // Define portfolio levels with descriptions
  const portfolios = [
    {
      title: 'Very Cautious',
      desc: 'Target returns just above bank deposit rates, with capital preservation.'
    },
    {
      title: 'Cautious',
      desc: 'Reluctant to take much, if any, risk; returns are expected to barely keep pace with inflation.'
    },
    {
      title: 'Cautious to Balanced',
      desc: 'Some loss is accepted, and one may wish to invest in other areas besides cash.'
    },
    {
      title: 'Balanced',
      desc: 'It is accepted that, to achieve growth, risks must be balanced.'
    },
    {
      title: 'Balanced to Adventurous',
      desc: 'Accepting significant risk to achieve higher returns.'
    },
    {
      title: 'Adventurous',
      desc: 'It is understood and accepted the implied risk necessary in aiming for higher returns.'
    }
  ];

  // Create grid container
  const grid = document.createElement('div');
  grid.classList.add('portfolio-grid');

  // Generate card for each portfolio
  portfolios.forEach(({ title, desc }) => {
    const card = document.createElement('div');
    card.classList.add('portfolio-card');

    // Title element
    const cardTitle = document.createElement('h3');
    cardTitle.textContent = title;
    cardTitle.classList.add('portfolio-card-title');
    card.appendChild(cardTitle);

    // Description element
    const cardDesc = document.createElement('p');
    cardDesc.textContent = desc;
    cardDesc.classList.add('portfolio-card-desc');
    card.appendChild(cardDesc);

    // Click handler
    card.addEventListener('click', () => {
      const slug = title.toLowerCase().replace(/ /g, '-');
      window.location.hash = `#portfolio/${slug}`;
      page.innerHTML = `<h3>${title} Portfolio</h3><p>Loading...</p>`;
    });

    grid.appendChild(card);
  });

  page.appendChild(grid);
}

export { renderPortfolioPage };
