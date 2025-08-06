// Assets page functionality
class AssetsManager {
    constructor() {
        this.app = window.portfolioApp;
        this.initialize();
    }

    initialize() {
        this.renderAssets();
        this.setupEventListeners();
    }

    setupEventListeners() {
        const addAssetForm = document.getElementById('addAssetForm');
        if (addAssetForm) {
            addAssetForm.addEventListener('submit', (e) => this.handleAddAsset(e));
        }
    }

    renderAssets() {
        const assetsGrid = document.getElementById('assetsGrid');
        if (!assetsGrid) return;

        if (this.app.assets.length === 0) {
            assetsGrid.innerHTML = `
                <div class="no-assets" style="grid-column: 1 / -1; text-align: center; padding: 3rem;">
                    <div style="font-size: 3rem; margin-bottom: 1rem;">📊</div>
                    <h3 style="color: var(--gray-600); margin-bottom: 0.5rem;">No Assets Yet</h3>
                    <p style="color: var(--gray-500);">Start building your portfolio by adding your first asset.</p>
                    <button class="btn btn-primary mt-3" onclick="openAddAssetModal()">Add Your First Asset</button>
                </div>
            `;
            return;
        }

        const assetsHtml = this.app.assets.map(asset => this.createAssetCard(asset)).join('');
        assetsGrid.innerHTML = assetsHtml;
    }

    createAssetCard(asset) {
        const totalValue = asset.quantity * asset.price;
        const changePercent = (Math.random() * 20 - 10); // Random for demo
        const changeClass = changePercent >= 0 ? 'positive' : 'negative';
        const changeSymbol = changePercent >= 0 ? '+' : '';

        return `
            <div class="asset-card">
                <div class="asset-header">
                    <div>
                        <div class="asset-symbol">${asset.symbol}</div>
                        <div class="asset-name">${asset.name}</div>
                    </div>
                    <span class="asset-type">${asset.type}</span>
                </div>
                <div class="asset-details">
                    <div class="asset-detail">
                        <span class="asset-detail-label">Quantity</span>
                        <span class="asset-detail-value">${asset.quantity}</span>
                    </div>
                    <div class="asset-detail">
                        <span class="asset-detail-label">Price</span>
                        <span class="asset-detail-value">${this.app.formatCurrency(asset.price)}</span>
                    </div>
                    <div class="asset-detail">
                        <span class="asset-detail-label">Total Value</span>
                        <span class="asset-detail-value">${this.app.formatCurrency(totalValue)}</span>
                    </div>
                    <div class="asset-detail">
                        <span class="asset-detail-label">Change</span>
                        <span class="asset-detail-value ${changeClass}">${changeSymbol}${changePercent.toFixed(2)}%</span>
                    </div>
                </div>
                <div class="asset-actions">
                    <button class="btn btn-outline btn-small" onclick="editAsset('${asset.id}')">Edit</button>
                    <button class="btn btn-secondary btn-small" onclick="addToWatchlist('${asset.symbol}', '${asset.name}', '${asset.type}', ${asset.price})">Watch</button>
                    <button class="btn btn-danger btn-small" onclick="deleteAsset('${asset.id}')">Delete</button>
                </div>
            </div>
        `;
    }

    handleAddAsset(e) {
        e.preventDefault();
        
        const formData = new FormData(e.target);
        const asset = {
            id: this.app.generateId(),
            symbol: formData.get('symbol').toUpperCase(),
            name: formData.get('name'),
            type: formData.get('type'),
            quantity: parseFloat(formData.get('quantity')),
            price: parseFloat(formData.get('price')),
            dateAdded: new Date().toISOString()
        };

        this.app.assets.push(asset);
        this.app.saveAssets();
        this.renderAssets();
        closeAddAssetModal();
        
        // Reset form
        e.target.reset();

        // Show success message
        this.showMessage('Asset added successfully!', 'success');
    }

    editAsset(id) {
        const asset = this.app.assets.find(a => a.id === id);
        if (!asset) return;

        // Fill form with asset data
        document.getElementById('assetSymbol').value = asset.symbol;
        document.getElementById('assetName').value = asset.name;
        document.getElementById('assetType').value = asset.type;
        document.getElementById('assetQuantity').value = asset.quantity;
        document.getElementById('assetPrice').value = asset.price;

        // Change form behavior to edit mode
        const form = document.getElementById('addAssetForm');
        const submitButton = form.querySelector('button[type="submit"]');
        submitButton.textContent = 'Update Asset';

        // Store the asset ID for updating
        form.dataset.editId = id;

        openAddAssetModal();
    }

    deleteAsset(id) {
        if (confirm('Are you sure you want to delete this asset?')) {
            this.app.assets = this.app.assets.filter(a => a.id !== id);
            this.app.saveAssets();
            this.renderAssets();
            this.showMessage('Asset deleted successfully!', 'success');
        }
    }

    showMessage(message, type = 'info') {
        // Simple message display - in a real app, you'd use a proper notification system
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
function openAddAssetModal() {
    const modal = document.getElementById('addAssetModal');
    const form = document.getElementById('addAssetForm');
    const submitButton = form.querySelector('button[type="submit"]');
    
    // Reset form for add mode
    if (!form.dataset.editId) {
        form.reset();
        submitButton.textContent = 'Add Asset';
    }
    
    modal.classList.add('show');
}

function closeAddAssetModal() {
    const modal = document.getElementById('addAssetModal');
    const form = document.getElementById('addAssetForm');
    
    modal.classList.remove('show');
    form.reset();
    delete form.dataset.editId;
}

function editAsset(id) {
    assetsManager.editAsset(id);
}

function deleteAsset(id) {
    assetsManager.deleteAsset(id);
}

function addToWatchlist(symbol, name, type, price) {
    const watchlistItem = {
        id: window.portfolioApp.generateId(),
        symbol: symbol,
        name: name,
        type: type,
        price: price,
        change: (Math.random() * 10 - 5), // Random for demo
        changePercent: (Math.random() * 10 - 5), // Random for demo
        dateAdded: new Date().toISOString()
    };

    // Check if already in watchlist
    const exists = window.portfolioApp.watchlist.find(item => item.symbol === symbol);
    if (exists) {
        alert('This asset is already in your watchlist!');
        return;
    }

    window.portfolioApp.watchlist.push(watchlistItem);
    window.portfolioApp.saveWatchlist();
    
    // Show success message
    assetsManager.showMessage(`${symbol} added to watchlist!`, 'success');
}

// Initialize when page loads
let assetsManager;
document.addEventListener('DOMContentLoaded', () => {
    assetsManager = new AssetsManager();
});

// Close modal when clicking outside
document.addEventListener('click', (e) => {
    if (e.target.classList.contains('modal')) {
        closeAddAssetModal();
    }
});