// Watchlist page functionality
class WatchlistManager {
    constructor() {
        this.app = window.portfolioApp;
        this.initialize();
    }

    initialize() {
        this.renderWatchlist();
        this.setupEventListeners();
        this.startPriceUpdates(); // Simulate real-time price updates
    }

    setupEventListeners() {
        const addWatchlistForm = document.getElementById('addWatchlistForm');
        if (addWatchlistForm) {
            addWatchlistForm.addEventListener('submit', (e) => this.handleAddWatchlistItem(e));
        }
    }

    renderWatchlist() {
        const tableBody = document.getElementById('watchlistTableBody');
        if (!tableBody) return;

        if (this.app.watchlist.length === 0) {
            tableBody.innerHTML = `
                <tr>
                    <td colspan="7" class="text-center" style="padding: 3rem;">
                        <div style="font-size: 2rem; margin-bottom: 1rem;">👀</div>
                        <h3 style="color: var(--gray-600); margin-bottom: 0.5rem;">No Watchlist Items</h3>
                        <p style="color: var(--gray-500);">Add stocks or other assets to track their performance.</p>
                    </td>
                </tr>
            `;
            return;
        }

        const watchlistHtml = this.app.watchlist.map(item => this.createWatchlistRow(item)).join('');
        tableBody.innerHTML = watchlistHtml;
    }

    createWatchlistRow(item) {
        const changeClass = item.changePercent >= 0 ? 'positive' : 'negative';
        const changeSymbol = item.changePercent >= 0 ? '+' : '';

        return `
            <tr data-id="${item.id}">
                <td><strong>${item.symbol}</strong></td>
                <td>${item.name}</td>
                <td><span class="asset-type" style="padding: 0.25rem 0.75rem; background: var(--gray-100); border-radius: 1rem; font-size: 0.75rem; text-transform: uppercase;">${item.type}</span></td>
                <td>${this.app.formatCurrency(item.price)}</td>
                <td class="${changeClass}">${changeSymbol}${this.app.formatCurrency(item.change)}</td>
                <td class="${changeClass}">${changeSymbol}${item.changePercent.toFixed(2)}%</td>
                <td>
                    <div style="display: flex; gap: 0.5rem;">
                        <button class="btn btn-primary btn-small" onclick="buyFromWatchlist('${item.id}')">Buy</button>
                        <button class="btn btn-danger btn-small" onclick="removeFromWatchlist('${item.id}')">Remove</button>
                    </div>
                </td>
            </tr>
        `;
    }

    handleAddWatchlistItem(e) {
        e.preventDefault();
        
        const formData = new FormData(e.target);
        const watchlistItem = {
            id: this.app.generateId(),
            symbol: formData.get('symbol').toUpperCase(),
            name: formData.get('name'),
            type: formData.get('type'),
            price: parseFloat(formData.get('price')),
            change: (Math.random() * 10 - 5), // Random for demo
            changePercent: (Math.random() * 10 - 5), // Random for demo
            dateAdded: new Date().toISOString()
        };

        // Check if already exists
        const exists = this.app.watchlist.find(item => item.symbol === watchlistItem.symbol);
        if (exists) {
            alert('This symbol is already in your watchlist!');
            return;
        }

        this.app.watchlist.push(watchlistItem);
        this.app.saveWatchlist();
        this.renderWatchlist();
        closeAddWatchlistModal();
        
        // Reset form
        e.target.reset();

        this.showMessage('Added to watchlist successfully!', 'success');
    }

    removeFromWatchlist(id) {
        if (confirm('Remove this item from your watchlist?')) {
            this.app.watchlist = this.app.watchlist.filter(item => item.id !== id);
            this.app.saveWatchlist();
            this.renderWatchlist();
            this.showMessage('Removed from watchlist!', 'success');
        }
    }

    buyFromWatchlist(id) {
        const watchlistItem = this.app.watchlist.find(item => item.id === id);
        if (!watchlistItem) return;

        // Pre-fill transaction form data
        const transactionData = {
            type: 'buy',
            symbol: watchlistItem.symbol,
            price: watchlistItem.price,
            date: new Date().toISOString().split('T')[0]
        };

        // Store in session for transaction page
        sessionStorage.setItem('prefillTransaction', JSON.stringify(transactionData));
        
        // Navigate to transactions page
        window.location.href = 'transactions.html';
    }

    startPriceUpdates() {
        // Simulate real-time price updates every 10 seconds
        setInterval(() => {
            this.app.watchlist.forEach(item => {
                const oldPrice = item.price;
                const priceChange = (Math.random() - 0.5) * oldPrice * 0.02; // Max 2% change
                item.price = Math.max(0.01, oldPrice + priceChange);
                item.change = item.price - oldPrice;
                item.changePercent = (item.change / oldPrice) * 100;
            });
            
            this.app.saveWatchlist();
            this.renderWatchlist();
        }, 10000);
    }

    showMessage(message, type = 'info') {
        const messageDiv = document.createElement('div');
        messageDiv.textContent = message;
        messageDiv.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            padding: 1rem 1.5rem;
            background: var(--${type === 'success' ? 'success' : 'info'}-color);
            color: white;
            border-radius: 0.5rem;
            z-index: 1001;
            animation: slideIn 0.3s ease;
        `;
        
        document.body.appendChild(messageDiv);
        setTimeout(() => messageDiv.remove(), 3000);
    }
}

// Modal functions
function openAddWatchlistModal() {
    const modal = document.getElementById('addWatchlistModal');
    modal.classList.add('show');
}

function closeAddWatchlistModal() {
    const modal = document.getElementById('addWatchlistModal');
    const form = document.getElementById('addWatchlistForm');
    modal.classList.remove('show');
    form.reset();
}

function removeFromWatchlist(id) {
    watchlistManager.removeFromWatchlist(id);
}

function buyFromWatchlist(id) {
    watchlistManager.buyFromWatchlist(id);
}

// Initialize when page loads
let watchlistManager;
document.addEventListener('DOMContentLoaded', () => {
    watchlistManager = new WatchlistManager();
});

// Close modal when clicking outside
document.addEventListener('click', (e) => {
    if (e.target.classList.contains('modal')) {
        closeAddWatchlistModal();
    }
});