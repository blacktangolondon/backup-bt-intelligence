// portfolioBuilder.js

export function initPortfolioBuilder() {
  // Find the "PORTFOLIO BUILDER" toggle in the sidebar
  const items = document.querySelectorAll('#sidebar-list .toggle-btn');
  items.forEach(btn => {
    if (btn.textContent.trim().startsWith('PORTFOLIO BUILDER')) {
      btn.addEventListener('click', () => {
        // Hide the main dashboard and thematic portfolio
        document.getElementById('main-content').style.display = 'none';
        document.getElementById('thematic-portfolio-template').style.display = 'none';
        // Show portfolio builder template
        const tpl = document.getElementById('portfolio-builder-template');
        tpl.style.display = 'block';
        renderPortfolioBuilder();
      });
    }
  });
}

function renderPortfolioBuilder() {
  const tpl = document.getElementById('portfolio-builder-template');
  tpl.innerHTML = `
    <div id="portfolio-builder-page">
      <div id="portfolio-builder-steps"></div>
      <div id="portfolio-builder-container">
        <div id="portfolio_builder1"></div>
        <div id="portfolio_builder2"></div>
      </div>
      <div id="portfolio-builder-actions">
        <button id="generate-portfolio-btn">Generate Portfolio</button>
      </div>
      <div id="portfolio-results"></div>
    </div>
  `;
  // TODO: add filter controls into #portfolio_builder1
  // TODO: hook up #generate-portfolio-btn to build your results in #portfolio-results
}
