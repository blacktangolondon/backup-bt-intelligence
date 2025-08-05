// portfolio.js
// Renders the Risk Profile overview and detailed portfolio tables in the same container



function renderRiskProfiles() {
  const container = document.getElementById('portfolios-template');
  // hide main dashboard
  const main = document.getElementById('main-content');
  if (main) main.style.display = 'none';
  container.innerHTML = '';

  const page = document.createElement('div');
  page.classList.add('portfolio-page');
  container.appendChild(page);

  const title = document.createElement('h2');
  title.textContent = 'Risk Profile';
  title.classList.add('page-title');
  page.appendChild(title);

  const profiles = [
    'Very Cautious', 'Cautious', 'Cautious to Balanced',
    'Balanced', 'Balanced to Adventurous', 'Adventurous'
  ];

  const grid = document.createElement('div');
  grid.classList.add('portfolio-grid');

  profiles.forEach(profile => {
    const card = document.createElement('div');
    card.classList.add('portfolio-card');

    const h3 = document.createElement('h3');
    h3.textContent = profile;
    h3.classList.add('portfolio-card-title');
    card.appendChild(h3);

    const btn = document.createElement('button');
    btn.textContent = 'Access';
    btn.classList.add('portfolio-card-btn');
    btn.addEventListener('click', () => renderPortfolioDetails(profile));
    card.appendChild(btn);

    grid.appendChild(card);
  });

  page.appendChild(grid);
}

function renderPortfolioDetails(profile) {
  const container = document.getElementById('portfolios-template');
  container.innerHTML = '';

  const page = document.createElement('div');
  page.classList.add('portfolio-page');
  container.appendChild(page);

  const title = document.createElement('h2');
  title.textContent = `${profile} Portfolios`;
  title.classList.add('page-title');
  page.appendChild(title);

  // define portfolios per profile
  const data = {
    'Adventurous': [
      { name: 'Arbitrage (Dynamic)', desc: 'A blended strategy of Relative Value, Equity Neutral and Fixed Income Arbitrage with a dynamic medium-frequency approach. Focus on containing execution costs.' },
      { name: 'Arbitrage (Tactical)', desc: 'A blended strategy of Relative Value, Equity Neutral and Fixed Income Arbitrage with a tactical low-frequency approach.' },
      { name: 'Long / Short Equity', desc: '' },
      { name: 'Short Only', desc: '' },
      { name: 'Emerging Markets', desc: '' }
    ],
    // placeholders for other profiles:
    'Balanced to Adventurous': [],
    'Balanced': [],
    'Cautious to Balanced': [],
    'Cautious': [],
    'Very Cautious': []
  };

  const list = data[profile] || [];

  const table = document.createElement('table');
  table.classList.add('portfolio-list');
  table.innerHTML = `
    <thead>
      <tr><th>Portfolio</th><th>Description</th><th></th></tr>
    </thead>
    <tbody>
      ${list.map(p => `
        <tr>
          <td>${p.name}</td>
          <td>${p.desc}</td>
          <td><button class="portfolio-card-btn">Access</button></td>
        </tr>
      `).join('')}
    </tbody>
  `;

  page.appendChild(table);
}

// Initialize on first load
function initPortfolio() {
  renderRiskProfiles();
}

export { initPortfolio as renderPortfolioPage };
