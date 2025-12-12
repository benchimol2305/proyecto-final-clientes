// js/ui.js
/**
 * Manejo de la interfaz de usuario para FinanzApp*/

class UI {
    constructor() {
        this.currentView = 'dashboard';
        this.domElements = {};
    }
    
    /**
     * Cachear elementos del DOM
     */
    cacheDOM() {
        console.log('Cacheando elementos DOM...');
        
        // Vistas
        this.domElements.views = document.querySelectorAll('.view');
        
        // Navegación
        this.domElements.navLinks = document.querySelectorAll('.nav-link');
        
        // Dashboard - Tarjetas de resumen
        this.domElements.incomeValue = document.querySelector('.income-value');
        this.domElements.expenseValue = document.querySelector('.expense-value');
        this.domElements.balanceValue = document.querySelector('.balance-value');
        this.domElements.budgetValue = document.querySelector('.budget-value');
        
        // Dashboard - Botones
        this.domElements.newTransactionBtn = document.getElementById('newTransactionBtn');
        this.domElements.newBudgetBtn = document.getElementById('newBudgetBtn');
        this.domElements.viewAllTransactionsBtn = document.getElementById('viewAllTransactionsBtn');
        
        // Dashboard - Tablas
        this.domElements.recentTransactionsTable = document.getElementById('recentTransactionsTable');
        this.domElements.budgetsGrid = document.getElementById('budgetsGrid');
        
        // Transacciones - Elementos
        this.domElements.newTransactionBtn2 = document.getElementById('newTransactionBtn2');
        this.domElements.allTransactionsTable = document.getElementById('allTransactionsTable');
        this.domElements.totalIncome = document.getElementById('totalIncome');
        this.domElements.totalExpense = document.getElementById('totalExpense');
        
        // Categorías - Elementos
        this.domElements.newCategoryBtn = document.getElementById('newCategoryBtn');
        this.domElements.categoriesGrid = document.getElementById('categoriesGrid');
        
        // Presupuestos - Elementos
        this.domElements.newBudgetBtn2 = document.getElementById('newBudgetBtn2');
        
        console.log('Elementos DOM cacheados correctamente');
        return this.domElements;
    }
    
    /**
     * Mostrar vista específica
     */
    showView(viewName) {
        console.log(`UI: Cambiando a vista ${viewName}`);
        
        this.currentView = viewName;
        
        // Ocultar todas las vistas
        this.domElements.views.forEach(view => {
            view.classList.remove('active');
        });
        
        // Mostrar la vista seleccionada
        const activeView = document.getElementById(`${viewName}-view`);
        if (activeView) {
            activeView.classList.add('active');
        }
        
        // Actualizar enlaces de navegación
        this.updateNavigation(viewName);
        
        return viewName;
    }
    
    /**
     * Actualizar navegación activa
     */
    updateNavigation(activeView) {
        this.domElements.navLinks.forEach(link => {
            link.classList.remove('active');
            const view = link.getAttribute('href').substring(1);
            if (view === activeView) {
                link.classList.add('active');
            }
        });
    }
    
    /**
     * Actualizar tarjetas de resumen del dashboard
     */
    updateSummaryCards(stats) {
        console.log('UI: Actualizando tarjetas de resumen');
        
        if (this.domElements.incomeValue) {
            this.domElements.incomeValue.textContent = `$${stats.getIncome().toFixed(2)}`;
        }
        
        if (this.domElements.expenseValue) {
            this.domElements.expenseValue.textContent = `$${stats.getExpenses().toFixed(2)}`;
        }
        
        if (this.domElements.balanceValue) {
            this.domElements.balanceValue.textContent = `$${stats.getBalance().toFixed(2)}`;
        }
        
        if (this.domElements.budgetValue) {
            const remaining = stats.getRemainingBudget();
            const percentage = stats.getBudgetUsagePercentage();
            this.domElements.budgetValue.textContent = `$${remaining.toFixed(2)}`;
        }
    }
    
    /**
     * Actualizar tabla de transacciones recientes
     */
    updateRecentTransactions(transactions, categories) {
        if (!this.domElements.recentTransactionsTable) {
            console.warn('No se encontró la tabla de transacciones recientes');
            return;
        }
        
        console.log('UI: Actualizando transacciones recientes');
        
        // Ordenar por fecha (más recientes primero)
        const recentTransactions = [...transactions]
            .sort((a, b) => new Date(b.date) - new Date(a.date))
            .slice(0, 5);
        
        // Limpiar tabla
        this.domElements.recentTransactionsTable.innerHTML = '';
        
        if (recentTransactions.length === 0) {
            this.domElements.recentTransactionsTable.innerHTML = `
                <tr>
                    <td colspan="6" style="text-align: center; padding: 2rem; color: #6B7280;">
                        <i class="fas fa-exchange-alt" style="font-size: 2rem; margin-bottom: 1rem; display: block; opacity: 0.5;"></i>
                        <p>No hay transacciones recientes</p>
                    </td>
                </tr>
            `;
            return;
        }
        
        // Agregar transacciones a la tabla
        recentTransactions.forEach(transaction => {
            const row = this.createTransactionRow(transaction, categories);
            this.domElements.recentTransactionsTable.appendChild(row);
        });
    }
    
    /**
     * Crear fila de tabla para transacción
     */
    createTransactionRow(transaction, categories) {
        const row = document.createElement('tr');
        
        const category = categories.find(c => c.name === transaction.category);
        const categoryIcon = category ? category.icon : 'fa-ellipsis-h';
        
        const date = new Date(transaction.date);
        const formattedDate = `${date.getDate().toString().padStart(2, '0')}/${(date.getMonth() + 1).toString().padStart(2, '0')}/${date.getFullYear()}`;
        
        const typeText = transaction.type === 'income' ? 'Ingreso' : 'Egreso';
        const amountClass = transaction.type === 'income' ? 'income-value' : 'expense-value';
        const amountSign = transaction.type === 'income' ? '+' : '-';
        const formattedAmount = `${amountSign}$${transaction.amount.toFixed(2)}`;
        
        row.innerHTML = `
            <td>${formattedDate}</td>
            <td>${transaction.description || '-'}</td>
            <td>
                <span class="category-badge">
                    <i class="fas ${categoryIcon}"></i>
                    ${transaction.category}
                </span>
            </td>
            <td>
                <span class="transaction-type type-${transaction.type}">
                    ${typeText}
                </span>
            </td>
            <td class="${amountClass}">${formattedAmount}</td>
            <td>
                <button class="icon-btn btn-edit-transaction" title="Editar" data-id="${transaction.id}">
                    <i class="fas fa-edit"></i>
                </button>
                <button class="icon-btn btn-delete-transaction" title="Eliminar" data-id="${transaction.id}">
                    <i class="fas fa-trash"></i>
                </button>
            </td>
        `;
        
        return row;
    }
    
    /**
     * Crear modal
     */
    createModal(title, content, onSave, onCancel = null) {
        const modalId = 'modal-' + Date.now();
        
        const modalHTML = `
            <div class="modal-overlay" id="${modalId}">
                <div class="modal">
                    <div class="modal-header">
                        <h3 class="modal-title">${title}</h3>
                        <button class="modal-close" id="close-${modalId}">
                            <i class="fas fa-times"></i>
                        </button>
                    </div>
                    <div class="modal-body">
                        ${content}
                    </div>
                    <div class="modal-footer">
                        <button class="btn btn-secondary" id="cancel-${modalId}">Cancelar</button>
                        <button class="btn btn-primary" id="save-${modalId}">Guardar</button>
                    </div>
                </div>
            </div>
        `;
        
        // Agregar modal al DOM
        let container = document.getElementById('modals-container');
        if (!container) {
            container = document.createElement('div');
            container.id = 'modals-container';
            document.body.appendChild(container);
        }
        
        container.insertAdjacentHTML('beforeend', modalHTML);
        
        const modal = document.getElementById(modalId);
        
        if (!modal) {
            console.error('No se pudo crear el modal');
            return null;
        }
        
        // Mostrar modal
        setTimeout(() => modal.classList.add('active'), 10);
        
        // Configurar event listeners
        const closeModal = () => {
            modal.classList.remove('active');
            setTimeout(() => {
                if (modal.parentNode) {
                    modal.parentNode.removeChild(modal);
                }
            }, 300);
        };
        
        // Botón cerrar
        const closeBtn = document.getElementById(`close-${modalId}`);
        if (closeBtn) {
            closeBtn.addEventListener('click', closeModal);
        }
        
        // Botón cancelar
        const cancelBtn = document.getElementById(`cancel-${modalId}`);
        if (cancelBtn) {
            cancelBtn.addEventListener('click', () => {
                if (onCancel) onCancel();
                closeModal();
            });
        }
        
        // Botón guardar
        const saveBtn = document.getElementById(`save-${modalId}`);
        if (saveBtn) {
            saveBtn.addEventListener('click', () => {
                if (onSave) onSave();
                closeModal();
            });
        }
        
        // Cerrar al hacer clic fuera del modal
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                closeModal();
            }
        });
        
        // Cerrar con tecla Escape
        const handleEscape = (e) => {
            if (e.key === 'Escape') {
                closeModal();
                document.removeEventListener('keydown', handleEscape);
            }
        };
        document.addEventListener('keydown', handleEscape);
        
        return modalId;
    }
    
    /**
     * Crear formulario de transacción
     */
    createTransactionForm(transaction = null, categories = []) {
        const isEdit = transaction !== null;
        
        const categoriesOptions = categories.map(c => `
            <option value="${c.name}" ${transaction?.category === c.name ? 'selected' : ''}>
                ${c.name}
            </option>
        `).join('');
        
        const today = new Date().toISOString().split('T')[0];
        
        return `
            <form id="transactionForm">
                <div class="form-group">
                    <label for="type">Tipo *</label>
                    <select id="type" name="type" required>
                        <option value="">Seleccionar tipo</option>
                        <option value="income" ${transaction?.type === 'income' ? 'selected' : ''}>Ingreso</option>
                        <option value="expense" ${transaction?.type === 'expense' ? 'selected' : ''}>Egreso</option>
                    </select>
                </div>
                
                <div class="form-group">
                    <label for="amount">Monto ($) *</label>
                    <input type="number" id="amount" name="amount" step="0.01" min="0.01" required 
                           value="${transaction?.amount || ''}" placeholder="0.00">
                </div>
                
                <div class="form-group">
                    <label for="date">Fecha *</label>
                    <input type="date" id="date" name="date" required 
                           value="${transaction?.date || today}">
                </div>
                
                <div class="form-group">
                    <label for="category">Categoría *</label>
                    <select id="category" name="category" required>
                        <option value="">Seleccionar categoría</option>
                        ${categoriesOptions}
                    </select>
                </div>
                
                <div class="form-group">
                    <label for="description">Descripción (opcional)</label>
                    <textarea id="description" name="description" rows="3" 
                              placeholder="Descripción de la transacción...">${transaction?.description || ''}</textarea>
                </div>
            </form>
        `;
    }
    
    /**
     * Obtener datos del formulario de transacción
     */
    getTransactionFormData() {
        const form = document.getElementById('transactionForm');
        if (!form) {
            console.error('No se encontró el formulario de transacción');
            return null;
        }
        
        try {
            return {
                type: form.type.value,
                amount: form.amount.value,
                date: form.date.value,
                category: form.category.value,
                description: form.description.value
            };
        } catch (error) {
            console.error('Error al obtener datos del formulario:', error);
            return null;
        }
    }
    
    /**
     * Mostrar notificación
     */
    showNotification(message, type = 'info') {
        console.log(`UI: Mostrando notificación (${type}): ${message}`);
        
        const notification = document.createElement('div');
        notification.className = `notification notification-${type}`;
        
        const icons = {
            success: 'fa-check-circle',
            error: 'fa-exclamation-circle',
            warning: 'fa-exclamation-triangle',
            info: 'fa-info-circle'
        };
        
        notification.innerHTML = `
            <i class="fas ${icons[type] || 'fa-info-circle'} notification-icon"></i>
            <span>${message}</span>
        `;
        
        const container = document.getElementById('notifications-container');
        if (!container) {
            const newContainer = document.createElement('div');
            newContainer.id = 'notifications-container';
            document.body.appendChild(newContainer);
            newContainer.appendChild(notification);
        } else {
            container.appendChild(notification);
        }
        
        // Mostrar
        setTimeout(() => {
            notification.classList.add('active');
        }, 10);
        
        // Ocultar después de 5 segundos
        setTimeout(() => {
            notification.classList.remove('active');
            setTimeout(() => {
                if (notification.parentNode) {
                    notification.parentNode.removeChild(notification);
                }
            }, 300);
        }, 5000);
    }
}

// Exportar la clase UI para uso global
if (typeof window !== 'undefined') {
    window.UI = UI;
}