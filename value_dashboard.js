// ~/Desktop/BT-intelligence/Value/value_dashboard.js

// --- Global Chart.js font defaults ---
Chart.defaults.font.family = 'Inter, Helvetica Neue, Arial, sans-serif';
Chart.defaults.font.size = 12;
Chart.defaults.font.weight = 'normal';
Chart.defaults.color = '#ddd'; // Default text color for charts

// --- Config for data file paths ---
const BACKTEST_RESULTS_FILE = 'value_backtest_results.json';

// --- Helper Functions ---

function showLoadingMessage() {
  document.getElementById('loadingMessage').style.display = 'block';
  document.getElementById('sidebar').style.display = 'none';
  document.getElementById('main-content').style.display = 'none';
}

function hideLoadingMessage() {
  document.getElementById('loadingMessage').style.display = 'none';
  document.getElementById('sidebar').style.display = 'flex'; // Restore sidebar display
  document.getElementById('main-content').style.display = 'flex'; // Restore main content display
}

async function loadData() {
  showLoadingMessage();
  try {
    const resp = await fetch(BACKTEST_RESULTS_FILE);
    if (!resp.ok) {
      throw new Error(`HTTP error! status: ${resp.status}`);
    }
    const data = await resp.json();
    return data;
  } catch (error) {
    console.error("Failed to load backtest results:", error);
    const mainContent = document.getElementById('main-content');
    mainContent.innerHTML = `<div style="color: red; text-align: center; margin-top: 50px;">
                                <p>Error loading data. Please ensure the Python scripts have run successfully and generated '${BACKTEST_RESULTS_FILE}'.</p>
                                <p>${error.message}</p>
                              </div>`;
    document.getElementById('sidebar').style.display = 'none'; // Hide sidebar on error
  } finally {
    hideLoadingMessage();
  }
}

function renderKPIs(kpis) {
  const module1 = document.getElementById('module1');
  module1.innerHTML = `
    <div class="kpi-card">
      <div class="kpi-value">$${kpis.initial_capital_usd.toLocaleString()}</div>
      <div class="kpi-label">Initial Capital</div>
    </div>
    <div class="kpi-card">
      <div class="kpi-value">$${kpis.final_portfolio_value_usd.toLocaleString()}</div>
      <div class="kpi-label">Final Value</div>
    </div>
    <div class="kpi-card">
      <div class="kpi-value">$${kpis.total_pnl_usd.toLocaleString()}</div>
      <div class="kpi-label">Total P&L</div>
    </div>
    <div class="kpi-card">
      <div class="kpi-value">${kpis.win_rate_pct}%</div>
      <div class="kpi-label">Win Rate</div>
    </div>
    <div class="kpi-card">
      <div class="kpi-value">$${kpis.max_drawdown_usd.toLocaleString()}</div>
      <div class="kpi-label">Max Drawdown</div>
    </div>
    <div class="kpi-card">
      <div class="kpi-value">${kpis.total_trades}</div>
      <div class="kpi-label">Total Trades</div>
    </div>
    <div class="kpi-card">
      <div class="kpi-value">$${kpis.avg_pnl_per_trade_usd.toLocaleString()}</div>
      <div class="kpi-label">Avg P&L/Trade</div>
    </div>
    <div class="kpi-card">
      <div class="kpi-value">${kpis.avg_duration_days} days</div>
      <div class="kpi-label">Avg Duration</div>
    </div>
  `;
}

function renderHistoricalTrades(trades) {
  const tbody = document.querySelector('#module2 tbody');
  tbody.innerHTML = ''; // Clear existing rows
  if (trades.length === 0) {
    tbody.innerHTML = '<tr><td colspan="10" style="text-align: center;">No historical trades to display.</td></tr>';
    return;
  }
  trades.forEach(trade => {
    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td>${trade.ticker}</td>
      <td>${trade.entry_date}</td>
      <td>${trade.exit_date}</td>
      <td>${trade.entry_pe.toFixed(2)}</td>
      <td>${trade.exit_pe ? trade.exit_pe.toFixed(2) : 'N/A'}</td>
      <td>$${trade.entry_price.toFixed(2)}</td>
      <td>$${trade.exit_price ? trade.exit_price.toFixed(2) : 'N/A'}</td>
      <td style="color: ${trade.pnl_usd >= 0 ? '#4CAF50' : '#FF6347'};">${trade.pnl_usd.toFixed(2)}</td>
      <td>${trade.duration_days}</td>
      <td>${trade.exit_reason || 'N/A'}</td>
    `;
    tbody.appendChild(tr);
  });
}

let equityChartInstance = null; // To store the Chart.js instance

function renderEquityCurve(equityData) {
  const ctx = document.getElementById('equityChart').getContext('2d');

  if (equityChartInstance) {
    equityChartInstance.destroy(); // Destroy previous chart instance if exists
  }

  equityChartInstance = new Chart(ctx, {
    type: 'line',
    data: {
      labels: equityData.map(d => d.date),
      datasets: [{
        label: 'Portfolio Value (USD)',
        data: equityData.map(d => d.portfolio_value),
        borderColor: '#FFA500', // Orange line
        backgroundColor: 'rgba(255, 165, 0, 0.2)', // Light orange fill
        fill: true,
        tension: 0.1,
        pointRadius: 0 // Hide points
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      scales: {
        x: {
          type: 'time',
          time: {
            unit: 'month',
            tooltipFormat: 'MMM yyyy',
            displayFormats: {
              month: 'MMM yyyy'
            }
          },
          title: {
            display: true,
            text: 'Date',
            color: '#ddd'
          },
          ticks: {
            color: '#aaa'
          },
          grid: {
            color: '#333' // Darker grid lines
          }
        },
        y: {
          title: {
            display: true,
            text: 'Portfolio Value (USD)',
            color: '#ddd'
          },
          ticks: {
            color: '#aaa',
            callback: function(value) {
              return '$' + value.toLocaleString();
            }
          },
          grid: {
            color: '#333'
          }
        }
      },
      plugins: {
        legend: {
          display: true,
          labels: {
            color: '#ddd'
          }
        },
        tooltip: {
            callbacks: {
                label: function(context) {
                    return context.dataset.label + ': $' + context.parsed.y.toLocaleString();
                }
            }
        }
      }
    }
  });
}

function renderNewBuySignals(signals) {
  const tbody = document.querySelector('#module4 tbody');
  tbody.innerHTML = ''; // Clear existing rows
  const signalKeys = Object.keys(signals);
  if (signalKeys.length === 0) {
    tbody.innerHTML = '<tr><td colspan="5" style="text-align: center;">No new buy signals at this time.</td></tr>';
    return;
  }
  signalKeys.forEach(ticker => {
    const signal = signals[ticker];
    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td>${ticker}</td>
      <td>${signal.pe_ratio.toFixed(2)}</td>
      <td>$${signal.monthly_close_price.toFixed(2)}</td>
      <td>${signal.stock_10yr_median_pe ? signal.stock_10yr_median_pe.toFixed(2) : 'N/A'}</td>
      <td>${signal.sector_median_pe ? signal.sector_median_pe.toFixed(2) : 'N/A'}</td>
      <td>${signal.entry_reason || 'N/A'}</td>
    `;
    tbody.appendChild(tr);
  });
}

// --- Main Initialization ---
document.addEventListener('DOMContentLoaded', async () => {
  const data = await loadData();
  if (data) {
    renderKPIs(data.portfolio_kpis);
    renderHistoricalTrades(data.historical_trades);
    renderEquityCurve(data.equity_curve);
    renderNewBuySignals(data.new_entry_signals);
  }

  // Sidebar collapse functionality
  const sidebar = document.getElementById('sidebar');
  const collapseBtn = document.getElementById('collapse-btn');
  collapseBtn.addEventListener('click', () => {
    sidebar.classList.toggle('collapsed');
  });
});
