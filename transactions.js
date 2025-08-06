// Transactions page functionality
class TransactionsManager {
    constructor() {
        this.app = window.portfolioApp;
        this.initialize();
    }

    initialize() {
        this.renderTransactions();
        this.setupEventListeners();
        this.checkForPrefillData();
    }

    setupEventListeners() {
        const addTransactionForm = document.getElementById('addTransactionForm');
        if (addTransactionForm) {
            addTransactionForm.addEventListener('submit', (e) => this.handleAddTransaction(e));
        }
    }

    checkForPrefillData() {
        const prefillData = sessionStorage.getItem('prefillTransaction');
        if (prefillData) {
            const data = JSON.parse(prefillData);
            
            // Fill the form
            document.getElementById('transactionType').value = data.type || '';
            document.getElementById('transactionSymbol').value = data.symbol || '';
            document.getElementById('transactionPrice').value = data.price || '';
            document.getElementById('transactionDate').value = data.date || '';
            
            // Clear session data
            sessionStorage.removeItem('prefillTransaction');
            
            // Open modal
            openAddTransactionModal();
        }
    }

    renderTransactions() {
        const tableBody = document.getElementById('transactionsTableBody');
        if (!tableBody) return;

        if (this.app.transactions.length === 0) {
            tableBody.innerHTML = `
                <tr>
                    <td colspan="7" class="text-center" style="padding: 3rem;">
                        <div style="font-size: 2rem; margin-bottom: 1rem;">📋</div>
                        <h3 style="color: var(--gray-600); margin-bottom: 0.5rem;">No Transactions Yet</h3>
                        <p style="color: var(--gray-500);">Start tracking your investment activity by recording your first transaction.</p>
                    </td>
                </tr>
            `;
            return;
        }

        const filteredTransactions = this.getFilteredTransactions();
        const transactionsHtml = filteredTransactions.map(transaction => this.createTransactionRow(transaction)).join('');
        tableBody.innerHTML = transactionsHtml;
    }

    createTransactionRow(transaction) {
        const total = transaction.quantity * transaction.price;
        const typeClass = transaction.type === 'buy' ? 'success' : transaction.type === 'sell' ? 'danger' : 'info';

        return `
            <tr data-id="${transaction.id}">
                <td>${this.app.formatDate(transaction.date)}</td>
                <td>
                    <span class="btn btn-${typeClass} btn-small" style="font-size: 0.625rem; padding: 0.25rem 0.75rem;">
                        ${transaction.type.toUpperCase()}
                    </span>
                </td>
                <td><strong>${transaction.symbol}</strong></td>
                <td>${transaction.quantity}</td>
                <td>${this.app.formatCurrency(transaction.price)}</td>
                <td><strong>${this.app.formatCurrency(total)}</strong></td>
                <td>
                    <div style="display: flex; gap: 0.5rem;">
                        <button class="btn btn-outline btn-small" onclick="editTransaction('${transaction.id}')">Edit</button>
                        <button class="btn btn-danger btn-small" onclick="deleteTransaction('${transaction.id}')">Delete</button>
                    </div>
                </td>
            </tr>
        `;
    }

    handleAddTransaction(e) {
        e.preventDefault();
        
        const formData = new FormData(e.target);
        const transaction = {
            id: this.app.generateId(),
            type: formData.get('type'),
            symbol: formData.get('symbol').toUpperCase(),
            quantity: parseFloat(formData.get('quantity')),
            price: parseFloat(formData.get('price')),
            date: formData.get('date'),
            notes: formData.get('notes') || '',
            timestamp: new Date().toISOString()
        };

        const editId = e.target.dataset.editId;
        if (editId) {
            // Update existing transaction
            const index = this.app.transactions.findIndex(t => t.id === editId);
            if (index !== -1) {
                transaction.id = editId;
                this.app.transactions[index] = transaction;
                this.showMessage('Transaction updated successfully!', 'success');
            }
        } else {
            // Add new transaction
            this.app.transactions.push(transaction);
            this.showMessage('Transaction recorded successfully!', 'success');
        }

        // Update assets if it's a buy/sell transaction
        this.updateAssetsFromTransaction(transaction);

        this.app.saveTransactions();
        this.renderTransactions();
        closeAddTransactionModal();
        
        // Reset form
        e.target.reset();
        delete e.target.dataset.editId;
    }

    updateAssetsFromTransaction(transaction) {
        if (transaction.type === 'dividend') return;

        const existingAsset = this.app.assets.find(asset => asset.symbol === transaction.symbol);

        if (transaction.type === 'buy') {
            if (existingAsset) {
                // Update existing asset quantity
                const totalValue = (existingAsset.quantity * existingAsset.price) + (transaction.quantity * transaction.price);
                const totalQuantity = existingAsset.quantity + transaction.quantity;
                existingAsset.quantity = totalQuantity;
                existingAsset.price = totalValue / totalQuantity; // Update average price
            } else {
                // Create new asset
                const newAsset = {
                    id: this.app.generateId(),
                    symbol: transaction.symbol,
                    name: `${transaction.symbol} Holdings`, // You'd typically fetch this from an API
                    type: 'stock', // Default type
                    quantity: transaction.quantity,
                    price: transaction.price,
                    dateAdded: transaction.date
                };
                this.app.assets.push(newAsset);
            }
        } else if (transaction.type === 'sell' && existingAsset) {
            // Reduce quantity for sell transactions
            existingAsset.quantity -= transaction.quantity;
            if (existingAsset.quantity <= 0) {
                // Remove asset if quantity becomes zero or negative
                this.app.assets = this.app.assets.filter(asset => asset.id !== existingAsset.id);
            }
        }

        this.app.saveAssets();
    }

    getFilteredTransactions() {
        const typeFilter = document.getElementById('filterType')?.value || 'all';
        const symbolFilter = document.getElementById('filterSymbol')?.value || '';

        return this.app.transactions.filter(transaction => {
            const matchesType = typeFilter === 'all' || transaction.type === typeFilter;
            const matchesSymbol = !symbolFilter || transaction.symbol.toLowerCase().includes(symbolFilter.toLowerCase());
            return matchesType && matchesSymbol;
        }).sort((a, b) => new Date(b.date) - new Date(a.date));
    }

    editTransaction(id) {
        const transaction = this.app.transactions.find(t => t.id === id);
        if (!transaction) return;

        // Fill form with transaction data
        document.getElementById('transactionType').value = transaction.type;
        document.getElementById('transactionSymbol').value = transaction.symbol;
        document.getElementById('transactionQuantity').value = transaction.quantity;
        document.getElementById('transactionPrice').value = transaction.price;
        document.getElementById('transactionDate').value = transaction.date;
        document.getElementById('transactionNotes').value = transaction.notes;

        // Change form behavior to edit mode
        const form = document.getElementById('addTransactionForm');
        const submitButton = form.querySelector('button[type="submit"]');
        submitButton.textContent = 'Update Transaction';

        // Store the transaction ID for updating
        form.dataset.editId = id;

        openAddTransactionModal();
    }

    deleteTransaction(id) {
        if (confirm('Are you sure you want to delete this transaction?')) {
            this.app.transactions = this.app.transactions.filter(t => t.id !== id);
            this.app.saveTransactions();
            this.renderTransactions();
            this.showMessage('Transaction deleted successfully!', 'success');
        }
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
function openAddTransactionModal() {
    const modal = document.getElementById('addTransactionModal');
    const form = document.getElementById('addTransactionForm');
    const submitButton = form.querySelector('button[type="submit"]');
    
    // Reset form for add mode if not editing
    if (!form.dataset.editId) {
        form.reset();
        submitButton.textContent = 'Record Transaction';
        // Set default date to today
        document.getElementById('transactionDate').value = new Date().toISOString().split('T')[0];
    }
    
    modal.classList.add('show');
}

function closeAddTransactionModal() {
    const modal = document.getElementById('addTransactionModal');
    const form = document.getElementById('addTransactionForm');
    
    modal.classList.remove('show');
    form.reset();
    delete form.dataset.editId;
}

function filterTransactions() {
    transactionsManager.renderTransactions();
}

function editTransaction(id) {
    transactionsManager.editTransaction(id);
}

function deleteTransaction(id) {
    transactionsManager.deleteTransaction(id);
}

// Initialize when page loads
let transactionsManager;
document.addEventListener('DOMContentLoaded', () => {
    transactionsManager = new TransactionsManager();
});

// Close modal when clicking outside
document.addEventListener('click', (e) => {
    if (e.target.classList.contains('modal')) {
        closeAddTransactionModal();
    }
});