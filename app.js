// Global app functionality and navigation
class PortfolioApp {
    constructor() {
        this.assets = JSON.parse(localStorage.getItem('portfolio_assets') || '[]');
        this.watchlist = JSON.parse(localStorage.getItem('portfolio_watchlist') || '[]');
        this.transactions = JSON.parse(localStorage.getItem('portfolio_transactions') || '[]');
        this.performanceChart = null;
        this.allocationChart = null;
        
        this.initializeNavigation();
        this.updateDashboardStats();
        this.initializeCharts();
    }

    // Navigation functionality
    initializeNavigation() {
        const hamburger = document.querySelector('.hamburger');
        const navMenu = document.querySelector('.nav-menu');

        if (hamburger && navMenu) {
            hamburger.addEventListener('click', () => {
                hamburger.classList.toggle('active');
                navMenu.classList.toggle('active');
            });

            // Close mobile menu when clicking on links
            document.querySelectorAll('.nav-link').forEach(link => {
                link.addEventListener('click', () => {
                    hamburger.classList.remove('active');
                    navMenu.classList.remove('active');
                });
            });
        }
    }

    // Data persistence
    saveAssets() {
        localStorage.setItem('portfolio_assets', JSON.stringify(this.assets));
        this.updateDashboardStats();
    }

    saveWatchlist() {
        localStorage.setItem('portfolio_watchlist', JSON.stringify(this.watchlist));
        this.updateDashboardStats();
    }

    saveTransactions() {
        localStorage.setItem('portfolio_transactions', JSON.stringify(this.transactions));
        this.updateDashboardStats();
    }

    // Dashboard statistics
    updateDashboardStats() {
        const totalValue = document.getElementById('totalValue');
        const totalChange = document.getElementById('totalChange');
        const totalAssets = document.getElementById('totalAssets');
        const watchlistCount = document.getElementById('watchlistCount');
        const transactionCount = document.getElementById('transactionCount');

        if (totalValue) {
            const portfolioValue = this.calculatePortfolioValue();
            totalValue.textContent = this.formatCurrency(portfolioValue);
        }

        if (totalAssets) {
            totalAssets.textContent = this.assets.length.toString();
        }

        if (watchlistCount) {
            watchlistCount.textContent = this.watchlist.length.toString();
        }

        if (transactionCount) {
            const currentMonth = new Date().getMonth();
            const currentYear = new Date().getFullYear();
            const monthlyTransactions = this.transactions.filter(t => {
                const transactionDate = new Date(t.date);
                return transactionDate.getMonth() === currentMonth && 
                       transactionDate.getFullYear() === currentYear;
            });
            transactionCount.textContent = monthlyTransactions.length.toString();
        }

        if (totalChange) {
            // Calculate portfolio change (simplified)
            const change = this.calculatePortfolioChange();
            totalChange.textContent = `${change >= 0 ? '+' : ''}${change.toFixed(2)}%`;
            totalChange.className = `stat-change ${change >= 0 ? 'positive' : 'negative'}`;
        }

        this.updateRecentActivity();
        this.updateCharts();
    }

    calculatePortfolioValue() {
        return this.assets.reduce((total, asset) => {
            return total + (asset.quantity * asset.price);
        }, 0);
    }

    calculatePortfolioChange() {
        // Simplified calculation - in a real app, you'd track purchase prices
        return Math.random() * 20 - 10; // Random change for demo
    }

    updateRecentActivity() {
        const activityList = document.getElementById('recentActivity');
        if (!activityList) return;

        const recentTransactions = this.transactions
            .sort((a, b) => new Date(b.date) - new Date(a.date))
            .slice(0, 5);

        if (recentTransactions.length === 0) {
            activityList.innerHTML = '<p class="no-data">No recent activity</p>';
            return;
        }

        const activityHtml = recentTransactions.map(transaction => `
            <div class="activity-item" style="padding: 0.75rem 0; border-bottom: 1px solid var(--gray-200);">
                <div style="display: flex; justify-content: space-between; align-items: center;">
                    <div>
                        <strong>${transaction.type.toUpperCase()}</strong> ${transaction.symbol}
                        <br>
                        <small style="color: var(--gray-600);">${this.formatDate(transaction.date)}</small>
                    </div>
                    <div style="text-align: right;">
                        <div>${transaction.quantity} shares</div>
                        <div style="font-weight: 600;">${this.formatCurrency(transaction.quantity * transaction.price)}</div>
                    </div>
                </div>
            </div>
        `).join('');

        activityList.innerHTML = activityHtml;
    }

    // Chart initialization and updates
    initializeCharts() {
        if (typeof Chart === 'undefined') return;
        
        this.initializePerformanceChart();
        this.initializeAllocationChart();
    }

    initializePerformanceChart() {
        const ctx = document.getElementById('performanceChart');
        if (!ctx) return;

        // Generate sample performance data
        const performanceData = this.generatePerformanceData();

        this.performanceChart = new Chart(ctx, {
            type: 'line',
            data: {
                labels: performanceData.labels,
                datasets: [{
                    label: 'Portfolio Value',
                    data: performanceData.values,
                    borderColor: 'rgb(30, 58, 138)',
                    backgroundColor: 'rgba(30, 58, 138, 0.1)',
                    borderWidth: 3,
                    fill: true,
                    tension: 0.4,
                    pointBackgroundColor: 'rgb(30, 58, 138)',
                    pointBorderColor: '#fff',
                    pointBorderWidth: 2,
                    pointRadius: 5,
                    pointHoverRadius: 7
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        display: false
                    }
                },
                scales: {
                    y: {
                        beginAtZero: false,
                        ticks: {
                            callback: function(value) {
                                return '$' + value.toLocaleString();
                            }
                        },
                        grid: {
                            color: 'rgba(0, 0, 0, 0.1)'
                        }
                    },
                    x: {
                        grid: {
                            display: false
                        }
                    }
                },
                interaction: {
                    intersect: false,
                    mode: 'index'
                }
            }
        });
    }

    initializeAllocationChart() {
        const ctx = document.getElementById('allocationChart');
        if (!ctx) return;

        const allocationData = this.generateAllocationData();

        this.allocationChart = new Chart(ctx, {
            type: 'doughnut',
            data: {
                labels: allocationData.labels,
                datasets: [{
                    data: allocationData.values,
                    backgroundColor: [
                        'rgb(30, 58, 138)',   // Primary blue
                        'rgb(5, 150, 105)',   // Secondary green
                        'rgb(245, 158, 11)',  // Accent yellow
                        'rgb(59, 130, 246)',  // Info blue
                        'rgb(16, 185, 129)',  // Success green
                        'rgb(239, 68, 68)',   // Danger red
                        'rgb(139, 92, 246)',  // Purple
                        'rgb(236, 72, 153)'   // Pink
                    ],
                    borderWidth: 3,
                    borderColor: '#fff',
                    hoverBorderWidth: 4
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        position: 'bottom',
                        labels: {
                            padding: 20,
                            usePointStyle: true,
                            font: {
                                size: 12
                            }
                        }
                    },
                    tooltip: {
                        callbacks: {
                            label: function(context) {
                                const label = context.label || '';
                                const value = context.parsed;
                                const total = context.dataset.data.reduce((a, b) => a + b, 0);
                                const percentage = ((value / total) * 100).toFixed(1);
                                return `${label}: $${value.toLocaleString()} (${percentage}%)`;
                            }
                        }
                    }
                },
                cutout: '60%'
            }
        });
    }

    generatePerformanceData() {
        const labels = [];
        const values = [];
        const currentValue = this.calculatePortfolioValue();
        const baseValue = Math.max(1000, currentValue * 0.8);
        
        // Generate 30 days of data
        for (let i = 29; i >= 0; i--) {
            const date = new Date();
            date.setDate(date.getDate() - i);
            labels.push(date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }));
            
            // Generate realistic portfolio growth with some volatility
            const progress = (29 - i) / 29;
            const trend = baseValue + (currentValue - baseValue) * progress;
            const volatility = trend * 0.05 * (Math.random() - 0.5);
            values.push(Math.round(trend + volatility));
        }
        
        return { labels, values };
    }

    generateAllocationData() {
        if (this.assets.length === 0) {
            return {
                labels: ['No Assets'],
                values: [1]
            };
        }

        const labels = [];
        const values = [];
        
        this.assets.forEach(asset => {
            labels.push(asset.symbol);
            values.push(asset.quantity * asset.price);
        });

        return { labels, values };
    }

    updateCharts() {
        if (this.performanceChart) {
            const performanceData = this.generatePerformanceData();
            this.performanceChart.data.labels = performanceData.labels;
            this.performanceChart.data.datasets[0].data = performanceData.values;
            this.performanceChart.update('none');
        }

        if (this.allocationChart) {
            const allocationData = this.generateAllocationData();
            this.allocationChart.data.labels = allocationData.labels;
            this.allocationChart.data.datasets[0].data = allocationData.values;
            this.allocationChart.update('none');
        }
    }

    // Utility functions
    formatCurrency(amount) {
        return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: 'USD'
        }).format(amount);
    }

    formatDate(dateString) {
        return new Date(dateString).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        });
    }

    formatPercentage(value) {
        return `${value >= 0 ? '+' : ''}${value.toFixed(2)}%`;
    }

    generateId() {
        return Date.now().toString(36) + Math.random().toString(36).substr(2);
    }
}

// Initialize the app
const app = new PortfolioApp();

// Make app globally available
window.portfolioApp = app;

// Initialize page-specific functionality
document.addEventListener('DOMContentLoaded', () => {
    // Set today's date as default for date inputs
    const dateInputs = document.querySelectorAll('input[type="date"]');
    const today = new Date().toISOString().split('T')[0];
    dateInputs.forEach(input => {
        if (!input.value) {
            input.value = today;
        }
    });
});