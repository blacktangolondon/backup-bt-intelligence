// portfolio.js
// Renders the Portfolio (Risk Profile) overview page and drills into Adventurous portfolios

/**
 * Renders the six risk profiles as cards.
 */
function renderPortfolioPage() {
  const container = document.getElementById('portfolios-template');
  const main = document.getElementById('main-content');
  if (main) main.style.display = 'none';
  container.innerHTML = '';

  const page = document.createElement('div');
  page.classList.add('portfolio-page');
  container.appendChild(page);

  // Page title
  const pageTitle = document.createElement('h2');
  pageTitle.textContent = 'Risk Profile';
  pageTitle.classList.add('page-title');
  page.appendChild(pageTitle);

  // Risk profiles
  const profiles = [
    { title: 'Very Cautious', desc: 'Target returns just above bank deposit rates, with capital preservation.' },
    { title: 'Cautious', desc: 'Reluctant to take much, if any, risk; returns are expected to barely keep pace with inflation.' },
    { title: 'Cautious to Balanced', desc: 'Some loss is accepted, and one may wish to invest in other areas besides cash.' },
    { title: 'Balanced', desc: 'It is accepted that, to achieve growth, risks must be balanced.' },
    { title: 'Balanced to Adventurous', desc: 'Accepting significant risk to achieve higher returns.' },
    { title: 'Adventurous', desc: 'It is understood and accepted the implied risk necessary in aiming for higher returns.' }
  ];

  const grid = document.createElement('div');
  grid.classList.add('portfolio-grid');
  page.appendChild(grid);

  profiles.forEach(({ title, desc }) => {
    const card = document.createElement('div');
    card.classList.add('portfolio-card');

    const cardTitle = document.createElement('h3');
    cardTitle.textContent = title;
    cardTitle.classList.add('portfolio-card-title');
    card.appendChild(cardTitle);

    const cardDesc = document.createElement('p');
    cardDesc.textContent = desc;
    cardDesc.classList.add('portfolio-card-desc');
    card.appendChild(cardDesc);

    const btn = document.createElement('button');
    btn.textContent = 'Access';
    btn.classList.add('portfolio-card-btn');
    card.appendChild(btn);

    btn.addEventListener('click', () => {
      if (title === 'Adventurous') {
        renderAdventurousPortfolios();
      } else {
        // Future detail views for other profiles
        alert(`Detail view for ${title} coming soon!`);
      }
    });

    grid.appendChild(card);
  });
}

/**
 * Renders the table of Adventurous portfolios.
 */
function renderAdventurousPortfolios() {
  const container = document.getElementById('portfolios-template');
  container.innerHTML = '';

  const page = document.createElement('div');
  page.classList.add('portfolio-page');
  container.appendChild(page);

  const title = document.createElement('h2');
  title.textContent = 'Adventurous Portfolio';
  title.classList.add('page-title');
  page.appendChild(title);

  const adventures = [
    {
      name: 'Arbitrage (Dynamic)',
      desc: 'A blended strategy of Relative Value, Equity Neutral and Fixed Income Arbitrage with a dynamic medium-frequency approach. Focus on containing execution costs.'
    },
    {
      name: 'Arbitrage (Tactical)',
      desc: 'A blended strategy of Relative Value, Equity Neutral and Fixed Income Arbitrage with a tactical low-frequency approach.'
    },
    { name: 'Long / Short Equity', desc: '' },
    { name: 'Short Only', desc: '' },
    { name: 'Emerging Markets', desc: '' }
  ];

  const table = document.createElement('table');
  table.classList.add('portfolio-list');
  const thead = document.createElement('thead');
  thead.innerHTML = `
    <tr>
      <th>Portfolio</th>
      <th>Description</th>
      <th></th>
    </tr>`;
  table.appendChild(thead);

  const tbody = document.createElement('tbody');
  adventures.forEach(({ name, desc }) => {
    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td>${name}</td>
      <td>${desc}</td>
      <td><button class="portfolio-card-btn">Access</button></td>
    `;
    tbody.appendChild(tr);
  });
  table.appendChild(tbody);

  page.appendChild(table);
}

export { renderPortfolioPage };
