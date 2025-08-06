// Portfolio page functionality
class PortfolioManager {
    constructor() {
        this.app = window.portfolioApp;
        this.initialize();
    }

    initialize() {
        this.calculatePortfolioMetrics();
        this.renderPortfolioSummary();
        this.renderHoldings();
        this.renderPerformanceMetrics();
        this.renderAllocationChart();
        this.renderPortfolioValueChart();
    }

    calculatePortfolioMetrics() {
        this.totalValue = 0;
        this.totalCost = 0;
        
        this.holdings = this.app.assets.map(asset => {
            const currentValue = asset.quantity * asset.price;
            
            // Calculate average cost from transactions
            const buyTransactions = this.app.transactions.filter(
                t => t.symbol === asset.symbol && t.type === 'buy'
            );
            
            const avgCost = buyTransactions.length > 0 
                ? buyTransactions.reduce((sum, t) => sum + (t.quantity * t.price), 0) / 
                  buyTransactions.reduce((sum, t) => sum + t.quantity, 0)
                : asset.price;
            
            const costBasis = asset.quantity * avgCost;
            const gainLoss = currentValue - costBasis;
            const gainLossPercent = costBasis > 0 ? (gainLoss / costBasis) * 100 : 0;
            
            this.totalValue += currentValue;
            this.totalCost += costBasis;
            
            return {
                ...asset,
                avgCost,
                costBasis,
                currentValue,
                gainLoss,
                gainLossPercent
            };
        });
        
        this.totalGainLoss = this.totalValue - this.totalCost;
        this.totalGainLossPercent = this.totalCost > 0 ? (this.totalGainLoss / this.totalCost) * 100 : 0;
    }

    renderPortfolioSummary() {
        const totalValueEl = document.getElementById('portfolioTotalValue');
        const gainLossEl = document.getElementById('portfolioGainLoss');
        const percentageEl = document.getElementById('portfolioPercentage');

        if (totalValueEl) {
            totalValueEl.textContent = this.app.formatCurrency(this.totalValue);
        }

        if (gainLossEl) {
            gainLossEl.textContent = this.app.formatCurrency(this.totalGainLoss);
            gainLossEl.className = `summary-value ${this.totalGainLoss >= 0 ? 'positive' : 'negative'}`;
        }

        if (percentageEl) {
            percentageEl.textContent = this.app.formatPercentage(this.totalGainLossPercent);
            percentageEl.className = `summary-value ${this.totalGainLoss >= 0 ? 'positive' : 'negative'}`;
        }
    }

    renderHoldings() {
        const tableBody = document.getElementById('holdingsTableBody');
        if (!tableBody) return;

        if (this.holdings.length === 0) {
            tableBody.innerHTML = `
                <tr>
                    <td colspan="9" class="text-center" style="padding: 3rem;">
                        <div style="font-size: 2rem; margin-bottom: 1rem;">💼</div>
                        <h3 style="color: var(--gray-600); margin-bottom: 0.5rem;">No Holdings</h3>
                        <p style="color: var(--gray-500);">Add assets to your portfolio to see your holdings here.</p>
                    </td>
                </tr>
            `;
            return;
        }

        const holdingsHtml = this.holdings.map(holding => this.createHoldingRow(holding)).join('');
        tableBody.innerHTML = holdingsHtml;
    }

    createHoldingRow(holding) {
        const allocation = this.totalValue > 0 ? (holding.currentValue / this.totalValue) * 100 : 0;
        const gainLossClass = holding.gainLoss >= 0 ? 'positive' : 'negative';

        return `
            <tr>
                <td><strong>${holding.symbol}</strong></td>
                <td>${holding.name}</td>
                <td>${holding.quantity}</td>
                <td>${this.app.formatCurrency(holding.avgCost)}</td>
                <td>${this.app.formatCurrency(holding.price)}</td>
                <td><strong>${this.app.formatCurrency(holding.currentValue)}</strong></td>
                <td class="${gainLossClass}">
                    ${this.app.formatCurrency(holding.gainLoss)}
                </td>
                <td class="${gainLossClass}">
                    ${this.app.formatPercentage(holding.gainLossPercent)}
                </td>
                <td>
                    <div style="display: flex; align-items: center; gap: 0.5rem;">
                        <div style="width: 60px; height: 8px; background: var(--gray-200); border-radius: 4px; overflow: hidden;">
                            <div style="width: ${allocation}%; height: 100%; background: var(--primary-color);"></div>
                        </div>
                        <span style="font-size: 0.75rem; font-weight: 600;">${allocation.toFixed(1)}%</span>
                    </div>
                </td>
            </tr>
        `;
    }

    renderPerformanceMetrics() {
        const bestPerformerEl = document.getElementById('bestPerformer');
        const worstPerformerEl = document.getElementById('worstPerformer');

        if (this.holdings.length === 0) {
            if (bestPerformerEl) {
                bestPerformerEl.innerHTML = '<p class="no-data">No data available</p>';
            }
            if (worstPerformerEl) {
                worstPerformerEl.innerHTML = '<p class="no-data">No data available</p>';
            }
            return;
        }

        // Find best and worst performers
        const sortedByPerformance = [...this.holdings].sort((a, b) => b.gainLossPercent - a.gainLossPercent);
        const bestPerformer = sortedByPerformance[0];
        const worstPerformer = sortedByPerformance[sortedByPerformance.length - 1];

        if (bestPerformerEl) {
            bestPerformerEl.innerHTML = `
                <div style="display: flex; justify-content: space-between; align-items: center;">
                    <div>
                        <strong>${bestPerformer.symbol}</strong>
                        <br>
                        <small style="color: var(--gray-600);">${bestPerformer.name}</small>
                    </div>
                    <div style="text-align: right;">
                        <div class="positive" style="font-weight: 600;">
                            ${this.app.formatPercentage(bestPerformer.gainLossPercent)}
                        </div>
                        <div class="positive" style="font-size: 0.875rem;">
                            ${this.app.formatCurrency(bestPerformer.gainLoss)}
                        </div>
                    </div>
                </div>
            `;
        }

        if (worstPerformerEl) {
            worstPerformerEl.innerHTML = `
                <div style="display: flex; justify-content: space-between; align-items: center;">
                    <div>
                        <strong>${worstPerformer.symbol}</strong>
                        <br>
                        <small style="color: var(--gray-600);">${worstPerformer.name}</small>
                    </div>
                    <div style="text-align: right;">
                        <div class="${worstPerformer.gainLoss >= 0 ? 'positive' : 'negative'}" style="font-weight: 600;">
                            ${this.app.formatPercentage(worstPerformer.gainLossPercent)}
                        </div>
                        <div class="${worstPerformer.gainLoss >= 0 ? 'positive' : 'negative'}" style="font-size: 0.875rem;">
                            ${this.app.formatCurrency(worstPerformer.gainLoss)}
                        </div>
                    </div>
                </div>
            `;
        }
    }

    renderAllocationChart() {
        const chartEl = document.getElementById('allocationPieChart');
        if (!chartEl || this.holdings.length === 0) return;

        const data = this.holdings.map(holding => ({
            label: holding.symbol,
            value: holding.currentValue,
        }));

        const labels = data.map(item => item.label);
        const values = data.map(item => item.value);

        new Chart(chartEl, {
            type: 'pie',
            data: {
                labels: labels,
                datasets: [{
                    data: values,
                    backgroundColor: ['#FF6384', '#36A2EB', '#FFCE56', '#4BC0C0', '#9966FF'],
                }],
            },
            options: {
                responsive: true,
            },
        });
    }

    renderPortfolioValueChart() {
        const chartEl = document.getElementById('portfolioValueChart');
        if (!chartEl) return;

        const dates = this.app.portfolioHistory.map(entry => entry.date);
        const values = this.app.portfolioHistory.map(entry => entry.value);

        new Chart(chartEl, {
            type: 'line',
            data: {
                labels: dates,
                datasets: [{
                    label: 'Portfolio Value',
                    data: values,
                    borderColor: '#36A2EB',
                    fill: false,
                }],
            },
            options: {
                responsive: true,
                scales: {
                    x: {
                        type: 'time',
                        time: {
                            unit: 'month',
                        },
                    },
                    y: {
                        beginAtZero: true,
                    },
                },
            },
        });
    }
}

// Initialize when page loads
let portfolioManager;
document.addEventListener('DOMContentLoaded', () => {
    portfolioManager = new PortfolioManager();
});
