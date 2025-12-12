// js/app.js - Aplicación principal
/**
 * FinanzApp - Sistema de finanzas personales
 * Punto de entrada principal que coordina todos los módulos*/

class FinanzApp {
    constructor() {
        console.log('Constructor FinanzApp llamado');
        
        // Verificar dependencias críticas
        if (typeof Database === 'undefined') {
            throw new Error('Database no está disponible');
        }
        if (typeof UI === 'undefined') {
            throw new Error('UI no está disponible');
        }
        if (typeof Transaction === 'undefined') {
            throw new Error('Transaction no está disponible');
        }
        
        // Inicializar módulos
        this.database = new Database();
        this.ui = new UI();
        this.charts = new ChartManager ? new ChartManager() : null;
        
        // Datos
        this.categories = [];
        this.transactions = [];
        this.budgets = [];
        this.stats = null;
        
        // Estado
        this.currentMonth = new Date().getMonth();
        this.currentYear = new Date().getFullYear();
        this.currentView = 'dashboard';
        
        console.log('FinanzApp instanciada');
    }
    
    /**
     * Inicializar la aplicación
     */
    async init() {
        console.log('Inicializando FinanzApp...');
        
        try {
            // 1. Cachear elementos DOM
            this.ui.cacheDOM();
            
            // 2. Configurar event listeners
            this.setupEventListeners();
            
            // 3. Inicializar base de datos
            await this.database.init();
            console.log('✅ Base de datos inicializada');
            
            // 4. Cargar datos
            await this.loadData();
            console.log('✅ Datos cargados');
            
            // 5. Actualizar vista inicial
            this.updateCurrentView();
            console.log('✅ Vista inicial actualizada');
            
            // 6. Configurar navegación
            this.setupNavigation();
            
            console.log('✅ FinanzApp inicializada correctamente');
            
        } catch (error) {
            console.error('❌ Error en init:', error);
            this.ui.showNotification('Error al inicializar: ' + error.message, 'error');
            throw error;
        }
    }
    
    /**
     * Configurar event listeners
     */
    setupEventListeners() {
        console.log('Configurando event listeners...');
        
        // Navegación principal
        document.addEventListener('click', (e) => {
            const navLink = e.target.closest('.nav-link');
            if (navLink) {
                e.preventDefault();
                const viewName = navLink.getAttribute('href').substring(1);
                this.showView(viewName);
            }
        });
        
        // Botones del dashboard
        this.setupButtonListener('newTransactionBtn', () => this.showTransactionForm());
        this.setupButtonListener('newBudgetBtn', () => this.showBudgetForm());
        this.setupButtonListener('viewAllTransactionsBtn', () => this.showView('transactions'));
        
        // Botones de otras vistas
        this.setupButtonListener('newTransactionBtn2', () => this.showTransactionForm());
        this.setupButtonListener('newCategoryBtn', () => this.showCategoryForm());
        this.setupButtonListener('newBudgetBtn2', () => this.showBudgetForm());
        
        // Delegación de eventos para botones dinámicos
        document.addEventListener('click', (e) => {
            const button = e.target.closest('button');
            if (!button) return;
            
            // Botones de editar/eliminar transacción
            if (button.classList.contains('btn-edit-transaction')) {
                const id = button.dataset.id;
                if (id) this.editTransaction(parseInt(id));
            } else if (button.classList.contains('btn-delete-transaction')) {
                const id = button.dataset.id;
                if (id) this.deleteTransaction(parseInt(id));
            }
        });
        
        console.log('✅ Event listeners configurados');
    }
    
    /**
     * Helper para configurar listeners de botones
     */
    setupButtonListener(id, handler) {
        const element = document.getElementById(id);
        if (element) {
            element.addEventListener('click', handler);
        }
    }
    
    /**
     * Configurar navegación inicial
     */
    setupNavigation() {
        // Verificar hash en URL
        const hash = window.location.hash.substring(1);
        if (hash && ['dashboard', 'transactions', 'categories', 'budgets'].includes(hash)) {
            this.showView(hash);
        } else {
            this.showView('dashboard');
        }
        
        // Escuchar cambios en hash
        window.addEventListener('hashchange', () => {
            const newHash = window.location.hash.substring(1);
            if (newHash && ['dashboard', 'transactions', 'categories', 'budgets'].includes(newHash)) {
                this.showView(newHash);
            }
        });
    }
    
    /**
     * Cargar datos desde IndexedDB
     */
    async loadData() {
        console.log('Cargando datos...');
        
        try {
            // Cargar categorías
            this.categories = await this.database.getAllCategories();
            console.log(`📂 Categorías: ${this.categories.length}`);
            
            // Cargar transacciones
            this.transactions = await this.database.getAllTransactions();
            console.log(`📂 Transacciones: ${this.transactions.length}`);
            
            // Cargar presupuestos
            this.budgets = await this.database.getAllBudgets();
            console.log(`📂 Presupuestos: ${this.budgets.length}`);
            
            // Crear datos de ejemplo si no hay nada
            if (this.transactions.length === 0) {
                console.log('Creando datos de ejemplo...');
                await this.database.createSampleData();
                
                // Recargar datos
                this.categories = await this.database.getAllCategories();
                this.transactions = await this.database.getAllTransactions();
                this.budgets = await this.database.getAllBudgets();
            }
            
            // Actualizar estadísticas
            this.updateStats();
            
            console.log('✅ Datos cargados correctamente');
            
        } catch (error) {
            console.error('❌ Error cargando datos:', error);
            throw error;
        }
    }
    
    /**
     * Actualizar estadísticas
     */
    updateStats() {
        this.stats = new FinancialStats(this.transactions, this.budgets);
    }
    
    /**
     * Mostrar vista específica
     */
    showView(viewName) {
        console.log(`Cambiando a vista: ${viewName}`);
        
        this.currentView = viewName;
        this.ui.showView(viewName);
        this.updateCurrentView();
    }
    
    /**
     * Actualizar la vista actual
     */
    updateCurrentView() {
        console.log(`Actualizando vista: ${this.currentView}`);
        
        switch (this.currentView) {
            case 'dashboard':
                this.updateDashboard();
                break;
            case 'transactions':
                this.updateTransactionsView();
                break;
            case 'categories':
                this.updateCategoriesView();
                break;
            case 'budgets':
                this.updateBudgetsView();
                break;
        }
    }
    
    /**
     * Actualizar dashboard
     */
    updateDashboard() {
        if (!this.stats) return;
        
        // Actualizar tarjetas de resumen
        this.ui.updateSummaryCards(this.stats);
        
        // Actualizar transacciones recientes
        this.ui.updateRecentTransactions(this.transactions, this.categories);
        
        // Actualizar tarjetas de presupuesto
        this.updateBudgetCards();
        
        // Actualizar gráficos si existen
        if (this.charts) {
            this.charts.updateCharts(this.stats, this.categories);
        }
    }
    
    /**
     * Actualizar tarjetas de presupuesto
     */
    updateBudgetCards() {
        const grid = document.getElementById('budgetsGrid');
        if (!grid) return;
        
        grid.innerHTML = '';
        
        if (this.budgets.length === 0) {
            grid.innerHTML = `
                <div class="empty-state">
                    <i class="fas fa-chart-pie"></i>
                    <p>No hay presupuestos para este mes</p>
                </div>
            `;
            return;
        }
        
        // Filtrar presupuestos del mes actual
        const currentBudgets = this.budgets.filter(b => 
            b.month === this.currentMonth && b.year === this.currentYear
        );
        
        if (currentBudgets.length === 0) {
            grid.innerHTML = `
                <div class="empty-state">
                    <i class="fas fa-chart-pie"></i>
                    <p>No hay presupuestos para este mes</p>
                </div>
            `;
            return;
        }
        
        currentBudgets.forEach(budget => {
            const spent = this.transactions
                .filter(t => t.type === 'expense' && t.category === budget.category && 
                          t.month === this.currentMonth && t.year === this.currentYear)
                .reduce((sum, t) => sum + t.amount, 0);
            
            const percentage = budget.amount > 0 ? (spent / budget.amount * 100) : 0;
            
            let statusClass = 'status-good';
            if (percentage >= 90) statusClass = 'status-danger';
            else if (percentage >= 70) statusClass = 'status-warning';
            
            const category = this.categories.find(c => c.name === budget.category);
            const categoryColor = category ? category.color : '#6B7280';
            
            const card = document.createElement('div');
            card.className = 'card budget-card';
            card.innerHTML = `
                <div class="budget-header">
                    <h3 class="budget-title">${budget.category}</h3>
                    <span class="budget-status ${statusClass}">
                        <i class="fas ${percentage >= 90 ? 'fa-exclamation-circle' : percentage >= 70 ? 'fa-exclamation-triangle' : 'fa-check-circle'}"></i>
                        ${Math.round(percentage)}% usado
                    </span>
                </div>
                <div class="budget-progress">
                    <div class="progress-bar">
                        <div class="progress-fill" style="width: ${Math.min(percentage, 100)}%; background-color: ${categoryColor};"></div>
                    </div>
                    <div class="budget-amounts">
                        <span class="budget-spent">$${spent.toFixed(2)} / $${budget.amount.toFixed(2)}</span>
                        <span class="budget-remaining">$${(budget.amount - spent).toFixed(2)} restantes</span>
                    </div>
                </div>
            `;
            
            grid.appendChild(card);
        });
    }
    
    /**
     * Actualizar vista de transacciones
     */
    updateTransactionsView() {
        this.showAllTransactions();
        this.updateFinancialSummary();
    }
    
    /**
     * Mostrar todas las transacciones en tabla
     */
    showAllTransactions() {
        const tableBody = document.getElementById('allTransactionsTable');
        if (!tableBody) return;
        
        // Limpiar tabla
        tableBody.innerHTML = '';
        
        if (this.transactions.length === 0) {
            tableBody.innerHTML = `
                <tr>
                    <td colspan="6" class="empty-state">
                        <i class="fas fa-exchange-alt"></i>
                        <p>No hay transacciones registradas</p>
                    </td>
                </tr>
            `;
            return;
        }
        
        // Ordenar por fecha (más recientes primero)
        const sortedTransactions = [...this.transactions]
            .sort((a, b) => new Date(b.date) - new Date(a.date));
        
        // Mostrar todas las transacciones
        sortedTransactions.forEach(transaction => {
            const row = this.ui.createTransactionRow(transaction, this.categories);
            tableBody.appendChild(row);
        });
    }
    
    /**
     * Actualizar resumen financiero
     */
    updateFinancialSummary() {
        const totalIncome = this.transactions
            .filter(t => t.type === 'income')
            .reduce((sum, t) => sum + t.amount, 0);
        
        const totalExpense = this.transactions
            .filter(t => t.type === 'expense')
            .reduce((sum, t) => sum + t.amount, 0);
        
        const totalIncomeEl = document.getElementById('totalIncome');
        const totalExpenseEl = document.getElementById('totalExpense');
        
        if (totalIncomeEl) {
            totalIncomeEl.textContent = `Ingresos: $${totalIncome.toFixed(2)}`;
        }
        if (totalExpenseEl) {
            totalExpenseEl.textContent = `Egresos: $${totalExpense.toFixed(2)}`;
        }
    }
    
    /**
     * Actualizar vista de categorías
     */
    updateCategoriesView() {
        const grid = document.getElementById('categoriesGrid');
        if (!grid) return;
        
        grid.innerHTML = '';
        
        if (this.categories.length === 0) {
            grid.innerHTML = `
                <div class="empty-state">
                    <i class="fas fa-tags"></i>
                    <p>No hay categorías</p>
                </div>
            `;
            return;
        }
        
        this.categories.forEach(category => {
            const transactionCount = this.transactions.filter(t => t.category === category.name).length;
            
            const card = document.createElement('div');
            card.className = 'card category-card';
            card.innerHTML = `
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 1rem;">
                    <div style="display: flex; align-items: center; gap: 0.5rem;">
                        <div style="width: 16px; height: 16px; background-color: ${category.color}; border-radius: 4px;"></div>
                        <h3 style="margin: 0; font-size: 1rem;">${category.name}</h3>
                    </div>
                    <i class="fas ${category.icon}"></i>
                </div>
                <div style="font-size: 0.875rem; color: #6B7280;">
                    <div>Transacciones: ${transactionCount}</div>
                </div>
            `;
            grid.appendChild(card);
        });
    }
    
    /**
     * Actualizar vista de presupuestos
     */
    updateBudgetsView() {
        const container = document.getElementById('budgetsContainer');
        if (!container) return;
        
        container.innerHTML = '';
        
        if (this.budgets.length === 0) {
            container.innerHTML = `
                <div class="empty-state">
                    <i class="fas fa-chart-pie"></i>
                    <p>No hay presupuestos</p>
                </div>
            `;
            return;
        }
        
        // Agrupar presupuestos por mes y año
        const budgetsByMonth = {};
        this.budgets.forEach(budget => {
            const key = `${budget.month}-${budget.year}`;
            if (!budgetsByMonth[key]) {
                budgetsByMonth[key] = [];
            }
            budgetsByMonth[key].push(budget);
        });
        
        // Mostrar presupuestos
        Object.keys(budgetsByMonth).forEach(key => {
            const [month, year] = key.split('-');
            const monthNames = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 
                              'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];
            
            const section = document.createElement('div');
            section.className = 'budget-month-section';
            section.innerHTML = `<h3>${monthNames[parseInt(month)]} ${year}</h3>`;
            
            budgetsByMonth[key].forEach(budget => {
                const spent = this.transactions
                    .filter(t => t.type === 'expense' && t.category === budget.category && 
                              t.month === parseInt(month) && t.year === parseInt(year))
                    .reduce((sum, t) => sum + t.amount, 0);
                
                const percentage = budget.amount > 0 ? (spent / budget.amount * 100) : 0;
                
                const budgetCard = document.createElement('div');
                budgetCard.className = 'card';
                budgetCard.innerHTML = `
                    <div style="display: flex; justify-content: space-between; align-items: center;">
                        <h4 style="margin: 0;">${budget.category}</h4>
                        <span>$${budget.amount.toFixed(2)}</span>
                    </div>
                    <div style="margin-top: 0.5rem; font-size: 0.875rem; color: #6B7280;">
                        Gastado: $${spent.toFixed(2)} (${Math.round(percentage)}%)
                    </div>
                `;
                section.appendChild(budgetCard);
            });
            
            container.appendChild(section);
        });
    }
    
    /**
     * Mostrar formulario de transacción
     */
    showTransactionForm(transactionId = null) {
        console.log('Mostrando formulario de transacción...');
        
        const transaction = transactionId 
            ? this.transactions.find(t => t.id === transactionId)
            : null;
        
        // Verificar que haya categorías
        if (this.categories.length === 0) {
            this.ui.showNotification('No hay categorías disponibles', 'error');
            return;
        }
        
        // Crear formulario
        const formHTML = this.ui.createTransactionForm(transaction, this.categories);
        const modalTitle = transaction ? 'Editar Transacción' : 'Nueva Transacción';
        
        // Crear modal
        this.ui.createModal(
            modalTitle,
            formHTML,
            () => {
                // Función para guardar
                this.saveTransactionFromForm(transaction);
            }
        );
    }
    
    /**
     * Guardar transacción desde formulario
     */
    async saveTransactionFromForm(originalTransaction = null) {
        try {
            // Obtener valores del formulario
            const formData = this.ui.getTransactionFormData();
            if (!formData) {
                this.ui.showNotification('Error al obtener datos del formulario', 'error');
                return;
            }
            
            // Validaciones
            if (!formData.type || !formData.amount || !formData.date || !formData.category) {
                this.ui.showNotification('Por favor completa todos los campos obligatorios', 'error');
                return;
            }
            
            const amount = parseFloat(formData.amount);
            if (isNaN(amount) || amount <= 0) {
                this.ui.showNotification('El monto debe ser un número mayor a 0', 'error');
                return;
            }
            
            // Crear objeto de transacción
            const transactionData = {
                type: formData.type,
                amount: amount,
                date: formData.date,
                category: formData.category,
                description: formData.description || '',
                month: new Date(formData.date).getMonth(),
                year: new Date(formData.date).getFullYear()
            };
            
            // Si es edición, mantener el ID
            if (originalTransaction && originalTransaction.id) {
                transactionData.id = originalTransaction.id;
            }
            
            // Crear instancia y guardar
            const transaction = new Transaction(transactionData);
            await this.saveTransaction(transaction, !!originalTransaction);
            
        } catch (error) {
            console.error('Error en saveTransactionFromForm:', error);
            this.ui.showNotification('Error: ' + error.message, 'error');
        }
    }
    
    /**
     * Guardar transacción
     */
    async saveTransaction(transaction, isEdit = false) {
        try {
            console.log('Guardando transacción:', transaction);
            
            // Guardar en IndexedDB
            await this.database.saveTransaction(transaction);
            
            // Recargar datos
            await this.loadData();
            
            // Actualizar vista actual
            this.updateCurrentView();
            
            this.ui.showNotification(
                isEdit ? '✅ Transacción actualizada' : '✅ Transacción guardada',
                'success'
            );
            
        } catch (error) {
            console.error('Error al guardar transacción:', error);
            this.ui.showNotification('❌ Error al guardar: ' + error.message, 'error');
        }
    }
    
    /**
     * Editar transacción
     */
    editTransaction(id) {
        this.showTransactionForm(id);
    }
    
    /**
     * Eliminar transacción
     */
    async deleteTransaction(id) {
        if (!confirm('¿Estás seguro de eliminar esta transacción?')) {
            return;
        }
        
        try {
            await this.database.deleteTransaction(id);
            
            // Recargar datos
            await this.loadData();
            
            // Actualizar vista actual
            this.updateCurrentView();
            
            this.ui.showNotification('✅ Transacción eliminada', 'success');
            
        } catch (error) {
            console.error('Error al eliminar transacción:', error);
            this.ui.showNotification('❌ Error al eliminar', 'error');
        }
    }
    
    /**
     * Mostrar formulario de categoría
     */
    showCategoryForm() {
        this.ui.showNotification('Funcionalidad de categorías en desarrollo', 'info');
    }
    
    /**
     * Mostrar formulario de presupuesto
     */
    showBudgetForm() {
        this.ui.showNotification('Funcionalidad de presupuestos en desarrollo', 'info');
    }
}

// Inicializar la aplicación cuando el DOM esté listo
document.addEventListener('DOMContentLoaded', function() {
    console.log('🚀 DOM cargado - Iniciando FinanzApp');
    
    try {
        // Crear instancia de la aplicación
        window.finanzApp = new FinanzApp();
        
        // Inicializar la aplicación
        window.finanzApp.init().then(() => {
            console.log('🎉 Aplicación lista para usar');
        }).catch(error => {
            console.error('❌ Error crítico al iniciar:', error);
            alert('Error al iniciar la aplicación. Por favor, recarga la página.');
        });
        
    } catch (error) {
        console.error('❌ Error creando FinanzApp:', error);
        alert('Error crítico: ' + error.message);
    }
});

// Hacer accesible desde la consola del navegador
console.log('FinanzApp cargada. Usa window.finanzApp para acceder desde la consola.');