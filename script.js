document.addEventListener('DOMContentLoaded', () => {
    const app = new FinanzApp();
    app.init();
});

/**
 * Clase principal de la aplicación FinanzApp
 */
class FinanzApp {
    constructor() {
        this.db = null;
        this.dbName = 'FinanzAppDB';
        this.dbVersion = 1;
        
        // Referencias a elementos del DOM
        this.domElements = {};
        
        // Datos actuales
        this.currentMonth = new Date().getMonth();
        this.currentYear = new Date().getFullYear();
        this.categories = [];
        this.transactions = [];
        this.budgets = [];
        
        // Vistas
        this.currentView = 'dashboard';
        
        // Charts
        this.charts = {};
    }

    /**
     * Inicializar la aplicación
     */
    async init() {
        this.cacheDOM();
        this.setupEventListeners();
        await this.initDatabase();
        await this.loadInitialData();
        this.setupNavigation();
        this.updateDashboard();
    }

    /**
     * Cachear elementos del DOM
     */
    cacheDOM() {
        this.domElements = {
            // Vistas
            views: document.querySelectorAll('.view'),
            
            // Navegación
            navLinks: document.querySelectorAll('.nav-link'),
            
            // Dashboard
            incomeValue: document.querySelector('.income-value'),
            expenseValue: document.querySelector('.expense-value'),
            balanceValue: document.querySelector('.balance-value'),
            budgetValue: document.querySelector('.budget-value'),
            
            // Gráficos
            chartCanvases: {
                expensesByCategory: document.getElementById('expensesByCategoryChart'),
                balanceEvolution: document.getElementById('balanceEvolutionChart'),
                budgetVsActual: document.getElementById('budgetVsActualChart'),
                incomeVsExpenses: document.getElementById('incomeVsExpensesChart')
            },
            
            // Tablas
            recentTransactionsTable: document.getElementById('recentTransactionsTable'),
            allTransactionsTable: document.getElementById('allTransactionsTable'),
            
            // Botones
            newTransactionBtn: document.getElementById('newTransactionBtn'),
            newTransactionBtn2: document.getElementById('newTransactionBtn2'),
            newCategoryBtn: document.getElementById('newCategoryBtn'),
            newBudgetBtn: document.getElementById('newBudgetBtn'),
            newBudgetBtn2: document.getElementById('newBudgetBtn2'),
            viewAllTransactionsBtn: document.getElementById('viewAllTransactionsBtn'),
            exportTransactionsBtn: document.getElementById('exportTransactionsBtn'),
            filterTransactionsBtn: document.getElementById('filterTransactionsBtn'),
            
            // Filtros
            filterType: document.getElementById('filterType'),
            filterCategory: document.getElementById('filterCategory'),
            filterMonth: document.getElementById('filterMonth'),
            searchTransactions: document.getElementById('searchTransactions'),
            budgetMonthSelect: document.getElementById('budgetMonthSelect'),
            budgetYearSelect: document.getElementById('budgetYearSelect'),
            
            // Contenedores
            budgetsGrid: document.getElementById('budgetsGrid'),
            categoriesGrid: document.getElementById('categoriesGrid'),
            budgetsContainer: document.getElementById('budgetsContainer'),
            budgetSummarySection: document.getElementById('budgetSummarySection'),
            
            // Totales
            totalIncome: document.getElementById('totalIncome'),
            totalExpense: document.getElementById('totalExpense')
        };
    }

    /**
     * Configurar event listeners
     */
    setupEventListeners() {
        // Navegación
        this.domElements.navLinks.forEach(link => {
            link.addEventListener('click', (e) => this.handleNavigation(e));
        });

        // Botones
        if (this.domElements.newTransactionBtn) {
            this.domElements.newTransactionBtn.addEventListener('click', () => this.showTransactionForm());
        }
        
        if (this.domElements.newTransactionBtn2) {
            this.domElements.newTransactionBtn2.addEventListener('click', () => this.showTransactionForm());
        }
        
        if (this.domElements.newCategoryBtn) {
            this.domElements.newCategoryBtn.addEventListener('click', () => this.showCategoryForm());
        }
        
        if (this.domElements.newBudgetBtn) {
            this.domElements.newBudgetBtn.addEventListener('click', () => this.showBudgetForm());
        }
        
        if (this.domElements.newBudgetBtn2) {
            this.domElements.newBudgetBtn2.addEventListener('click', () => this.showBudgetForm());
        }
        
        if (this.domElements.viewAllTransactionsBtn) {
            this.domElements.viewAllTransactionsBtn.addEventListener('click', () => {
                window.location.hash = 'transactions';
                this.showView('transactions');
            });
        }
        
        if (this.domElements.exportTransactionsBtn) {
            this.domElements.exportTransactionsBtn.addEventListener('click', () => this.exportTransactions());
        }
        
        if (this.domElements.filterTransactionsBtn) {
            this.domElements.filterTransactionsBtn.addEventListener('click', () => this.showAdvancedFilters());
        }

        // Filtros de transacciones
        if (this.domElements.filterType) {
            this.domElements.filterType.addEventListener('change', () => this.updateTransactionsTable());
        }
        
        if (this.domElements.filterCategory) {
            this.domElements.filterCategory.addEventListener('change', () => this.updateTransactionsTable());
        }
        
        if (this.domElements.filterMonth) {
            // Establecer valor por defecto
            const currentMonth = (this.currentMonth + 1).toString().padStart(2, '0');
            this.domElements.filterMonth.value = `${this.currentYear}-${currentMonth}`;
            this.domElements.filterMonth.addEventListener('change', () => this.updateTransactionsTable());
        }
        
        if (this.domElements.searchTransactions) {
            this.domElements.searchTransactions.addEventListener('input', () => this.updateTransactionsTable());
        }

        // Filtros de presupuestos
        if (this.domElements.budgetMonthSelect) {
            this.populateMonthYearSelects();
            this.domElements.budgetMonthSelect.addEventListener('change', () => this.updateBudgetsView());
            this.domElements.budgetYearSelect.addEventListener('change', () => this.updateBudgetsView());
        }

        // Delegación de eventos para tablas
        document.addEventListener('click', (e) => {
            // Botones de editar/eliminar en transacciones
            if (e.target.closest('.btn-edit-transaction')) {
                const button = e.target.closest('.btn-edit-transaction');
                const transactionId = parseInt(button.dataset.id);
                if (transactionId) this.editTransaction(transactionId);
            }
            
            if (e.target.closest('.btn-delete-transaction')) {
                const button = e.target.closest('.btn-delete-transaction');
                const transactionId = parseInt(button.dataset.id);
                if (transactionId) this.deleteTransaction(transactionId);
            }
            
            // Botones de editar/eliminar en categorías
            if (e.target.closest('.btn-edit-category')) {
                const button = e.target.closest('.btn-edit-category');
                const categoryId = parseInt(button.dataset.id);
                if (categoryId) this.editCategory(categoryId);
            }
            
            if (e.target.closest('.btn-delete-category')) {
                const button = e.target.closest('.btn-delete-category');
                const categoryId = parseInt(button.dataset.id);
                if (categoryId) this.deleteCategory(categoryId);
            }
            
            // Botones de editar/eliminar en presupuestos
            if (e.target.closest('.btn-edit-budget')) {
                const button = e.target.closest('.btn-edit-budget');
                const budgetId = parseInt(button.dataset.id);
                if (budgetId) this.editBudget(budgetId);
            }
            
            if (e.target.closest('.btn-delete-budget')) {
                const button = e.target.closest('.btn-delete-budget');
                const budgetId = parseInt(button.dataset.id);
                if (budgetId) this.deleteBudget(budgetId);
            }
        });
    }

    /**
     * Configurar navegación
     */
    setupNavigation() {
        // Verificar si hay un hash en la URL
        const hash = window.location.hash.substring(1);
        if (hash && ['dashboard', 'transactions', 'categories', 'budgets'].includes(hash)) {
            this.showView(hash);
        } else {
            this.showView('dashboard');
        }

        // Escuchar cambios en el hash
        window.addEventListener('hashchange', () => {
            const hash = window.location.hash.substring(1);
            if (hash && ['dashboard', 'transactions', 'categories', 'budgets'].includes(hash)) {
                this.showView(hash);
            }
        });
    }

    /**
     * Mostrar vista específica
     */
    showView(viewName) {
        this.currentView = viewName;
        
        // Ocultar todas las vistas
        this.domElements.views.forEach(view => {
            view.classList.remove('active');
        });
        
        // Mostrar la vista activa
        const activeView = document.getElementById(`${viewName}-view`);
        if (activeView) {
            activeView.classList.add('active');
        }
        
        // Actualizar enlace activo
        this.domElements.navLinks.forEach(link => {
            link.classList.remove('active');
            if (link.getAttribute('href') === `#${viewName}`) {
                link.classList.add('active');
            }
        });
        
        // Actualizar datos específicos de la vista
        switch(viewName) {
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
     * Manejar navegación
     */
    handleNavigation(e) {
        e.preventDefault();
        const target = e.target.closest('a');
        const viewName = target.getAttribute('href').substring(1);
        
        // Actualizar URL
        window.location.hash = viewName;
    }

    /**
     * Inicializar IndexedDB
     */
    initDatabase() {
        return new Promise((resolve, reject) => {
            const request = indexedDB.open(this.dbName, this.dbVersion);

            request.onerror = (event) => {
                console.error('Error al abrir la base de datos:', event.target.error);
                this.showNotification('Error al conectar con la base de datos', 'error');
                reject(event.target.error);
            };

            request.onupgradeneeded = (event) => {
                this.db = event.target.result;
                this.createDatabaseSchema();
            };

            request.onsuccess = (event) => {
                this.db = event.target.result;
                console.log('Base de datos inicializada correctamente');
                resolve();
            };
        });
    }

    /**
     * Crear esquema de la base de datos
     */
    createDatabaseSchema() {
        // Almacén de categorías
        if (!this.db.objectStoreNames.contains('categories')) {
            const categoryStore = this.db.createObjectStore('categories', { keyPath: 'id', autoIncrement: true });
            categoryStore.createIndex('name', 'name', { unique: true });
        }

        // Almacén de transacciones
        if (!this.db.objectStoreNames.contains('transactions')) {
            const transactionStore = this.db.createObjectStore('transactions', { keyPath: 'id', autoIncrement: true });
            transactionStore.createIndex('date', 'date');
            transactionStore.createIndex('category', 'category');
            transactionStore.createIndex('type', 'type');
            transactionStore.createIndex('monthYear', ['month', 'year']);
        }

        // Almacén de presupuestos
        if (!this.db.objectStoreNames.contains('budgets')) {
            const budgetStore = this.db.createObjectStore('budgets', { keyPath: 'id', autoIncrement: true });
            budgetStore.createIndex('category', 'category');
            budgetStore.createIndex('monthYear', ['month', 'year']);
        }

        // Insertar categorías predefinidas
        this.initializeDefaultCategories();
    }

    /**
     * Inicializar categorías predefinidas
     */
    async initializeDefaultCategories() {
        const defaultCategories = [
            { name: 'Alimentación', icon: 'fa-shopping-cart', color: '#10B981' },
            { name: 'Transporte', icon: 'fa-car', color: '#3B82F6' },
            { name: 'Ocio', icon: 'fa-film', color: '#8B5CF6' },
            { name: 'Servicios', icon: 'fa-bolt', color: '#F59E0B' },
            { name: 'Salud', icon: 'fa-heart', color: '#EF4444' },
            { name: 'Educación', icon: 'fa-graduation-cap', color: '#06B6D4' },
            { name: 'Ingreso fijo', icon: 'fa-money-bill-wave', color: '#10B981' },
            { name: 'Trabajo Extra', icon: 'fa-laptop-code', color: '#8B5CF6' },
            { name: 'Otros', icon: 'fa-ellipsis-h', color: '#6B7280' }
        ];

        const transaction = this.db.transaction(['categories'], 'readwrite');
        const store = transaction.objectStore('categories');

        for (const category of defaultCategories) {
            // Verificar si ya existe
            const request = store.index('name').get(category.name);
            request.onsuccess = (e) => {
                if (!e.target.result) {
                    store.add(category);
                }
            };
        }
    }

    /**
     * Cargar datos iniciales
     */
    async loadInitialData() {
        await this.loadCategories();
        await this.loadTransactions();
        await this.loadBudgets();
        
        // Si no hay datos de ejemplo, crearlos
        if (this.transactions.length === 0) {
            await this.createSampleData();
        }
    }

    /**
     * Cargar categorías
     */
    async loadCategories() {
        return new Promise((resolve) => {
            const transaction = this.db.transaction(['categories'], 'readonly');
            const store = transaction.objectStore('categories');
            const request = store.getAll();

            request.onsuccess = (event) => {
                this.categories = event.target.result || [];
                console.log('Categorías cargadas:', this.categories.length);
                resolve();
            };
            
            request.onerror = () => {
                this.categories = [];
                resolve();
            };
        });
    }

    /**
     * Cargar transacciones
     */
    async loadTransactions() {
        return new Promise((resolve) => {
            const transaction = this.db.transaction(['transactions'], 'readonly');
            const store = transaction.objectStore('transactions');
            const request = store.getAll();

            request.onsuccess = (event) => {
                this.transactions = event.target.result || [];
                console.log('Transacciones cargadas:', this.transactions.length);
                resolve();
            };
            
            request.onerror = () => {
                this.transactions = [];
                resolve();
            };
        });
    }

    /**
     * Cargar presupuestos
     */
    async loadBudgets() {
        return new Promise((resolve) => {
            const transaction = this.db.transaction(['budgets'], 'readonly');
            const store = transaction.objectStore('budgets');
            const request = store.getAll();

            request.onsuccess = (event) => {
                this.budgets = event.target.result || [];
                console.log('Presupuestos cargados:', this.budgets.length);
                resolve();
            };
            
            request.onerror = () => {
                this.budgets = [];
                resolve();
            };
        });
    }

    /**
     * Crear datos de ejemplo
     */
    async createSampleData() {
        const sampleTransactions = [
            {
                type: 'expense',
                amount: 85.50,
                date: '2023-10-15',
                category: 'Alimentación',
                description: 'Supermercado semanal',
                month: 9, // Octubre (0-indexed)
                year: 2023
            },
            {
                type: 'income',
                amount: 2500.00,
                date: '2023-10-14',
                category: 'Ingreso fijo',
                description: 'Salario mensual',
                month: 9,
                year: 2023
            },
            {
                type: 'expense',
                amount: 65.00,
                date: '2023-10-13',
                category: 'Servicios',
                description: 'Pago de electricidad',
                month: 9,
                year: 2023
            },
            {
                type: 'expense',
                amount: 40.00,
                date: '2023-10-12',
                category: 'Transporte',
                description: 'Gasolina del auto',
                month: 9,
                year: 2023
            },
            {
                type: 'income',
                amount: 350.00,
                date: '2023-10-10',
                category: 'Trabajo Extra',
                description: 'Freelance diseño web',
                month: 9,
                year: 2023
            }
        ];

        const sampleBudgets = [
            {
                category: 'Alimentación',
                amount: 500,
                month: this.currentMonth,
                year: this.currentYear
            },
            {
                category: 'Transporte',
                amount: 200,
                month: this.currentMonth,
                year: this.currentYear
            },
            {
                category: 'Ocio',
                amount: 200,
                month: this.currentMonth,
                year: this.currentYear
            }
        ];

        // Guardar transacciones de ejemplo
        for (const transaction of sampleTransactions) {
            await this.saveTransaction(transaction);
        }

        // Guardar presupuestos de ejemplo
        for (const budget of sampleBudgets) {
            await this.saveBudget(budget);
        }

        // Recargar datos
        await this.loadTransactions();
        await this.loadBudgets();
    }

    /**
     * Actualizar dashboard
     */
    async updateDashboard() {
        await this.updateSummaryCards();
        await this.updateRecentTransactions();
        await this.updateBudgetStatus();
        this.updateCharts();
    }

    /**
     * Actualizar tarjetas de resumen
     */
    async updateSummaryCards() {
        const currentMonthTransactions = this.transactions.filter(t => 
            t.month === this.currentMonth && t.year === this.currentYear
        );

        const income = currentMonthTransactions
            .filter(t => t.type === 'income')
            .reduce((sum, t) => sum + t.amount, 0);

        const expenses = currentMonthTransactions
            .filter(t => t.type === 'expense')
            .reduce((sum, t) => sum + t.amount, 0);

        const balance = income - expenses;

        // Calcular cambio porcentual vs mes anterior
        const lastMonth = this.currentMonth === 0 ? 11 : this.currentMonth - 1;
        const lastMonthYear = this.currentMonth === 0 ? this.currentYear - 1 : this.currentYear;
        
        const lastMonthTransactions = this.transactions.filter(t => 
            t.month === lastMonth && t.year === lastMonthYear
        );

        const lastMonthIncome = lastMonthTransactions
            .filter(t => t.type === 'income')
            .reduce((sum, t) => sum + t.amount, 0);

        const lastMonthExpenses = lastMonthTransactions
            .filter(t => t.type === 'expense')
            .reduce((sum, t) => sum + t.amount, 0);

        const lastMonthBalance = lastMonthIncome - lastMonthExpenses;

        const incomeChange = lastMonthIncome > 0 ? ((income - lastMonthIncome) / lastMonthIncome * 100).toFixed(1) : '0.0';
        const expenseChange = lastMonthExpenses > 0 ? ((expenses - lastMonthExpenses) / lastMonthExpenses * 100).toFixed(1) : '0.0';
        const balanceChange = lastMonthBalance !== 0 ? ((balance - lastMonthBalance) / Math.abs(lastMonthBalance) * 100).toFixed(1) : '0.0';

        // Actualizar valores en el DOM
        if (this.domElements.incomeValue) {
            this.domElements.incomeValue.textContent = `$${income.toFixed(2)}`;
            const changeElement = this.domElements.incomeValue.closest('.card').querySelector('.card-change');
            if (changeElement) {
                const isPositive = income >= lastMonthIncome;
                changeElement.innerHTML = `
                    <i class="fas fa-arrow-${isPositive ? 'up' : 'down'}"></i>
                    <span>${isPositive ? '+' : ''}${incomeChange}% vs mes anterior</span>
                `;
                changeElement.className = `card-change ${isPositive ? 'positive-change' : 'negative-change'}`;
            }
        }

        if (this.domElements.expenseValue) {
            this.domElements.expenseValue.textContent = `$${expenses.toFixed(2)}`;
            const changeElement = this.domElements.expenseValue.closest('.card').querySelector('.card-change');
            if (changeElement) {
                const isPositive = expenses <= lastMonthExpenses;
                changeElement.innerHTML = `
                    <i class="fas fa-arrow-${isPositive ? 'down' : 'up'}"></i>
                    <span>${isPositive ? '' : '+'}${expenseChange}% vs mes anterior</span>
                `;
                changeElement.className = `card-change ${isPositive ? 'positive-change' : 'negative-change'}`;
            }
        }

        if (this.domElements.balanceValue) {
            this.domElements.balanceValue.textContent = `$${balance.toFixed(2)}`;
            const changeElement = this.domElements.balanceValue.closest('.card').querySelector('.card-change');
            if (changeElement) {
                const isPositive = balance >= lastMonthBalance;
                changeElement.innerHTML = `
                    <i class="fas fa-arrow-${isPositive ? 'up' : 'down'}"></i>
                    <span>${isPositive ? '+' : ''}${balanceChange}% vs mes anterior</span>
                `;
                changeElement.className = `card-change ${isPositive ? 'positive-change' : 'negative-change'}`;
            }
        }

        // Calcular presupuesto restante
        const totalBudget = this.budgets
            .filter(b => b.month === this.currentMonth && b.year === this.currentYear)
            .reduce((sum, b) => sum + b.amount, 0);

        const budgetUsed = this.transactions
            .filter(t => t.type === 'expense' && t.month === this.currentMonth && t.year === this.currentYear)
            .reduce((sum, t) => sum + t.amount, 0);

        const remainingBudget = totalBudget - budgetUsed;
        const budgetUsedPercentage = totalBudget > 0 ? (budgetUsed / totalBudget * 100).toFixed(0) : 0;

        if (this.domElements.budgetValue) {
            this.domElements.budgetValue.textContent = `$${remainingBudget.toFixed(2)}`;
            const changeElement = this.domElements.budgetValue.closest('.card').querySelector('.card-change');
            if (changeElement) {
                changeElement.innerHTML = `<span>${budgetUsedPercentage}% del presupuesto utilizado</span>`;
            }
        }
    }

    /**
     * Actualizar transacciones recientes
     */
    async updateRecentTransactions() {
        if (!this.domElements.recentTransactionsTable) return;

        // Ordenar transacciones por fecha (más recientes primero)
        const recentTransactions = [...this.transactions]
            .sort((a, b) => new Date(b.date) - new Date(a.date))
            .slice(0, 5);

        // Limpiar tabla
        this.domElements.recentTransactionsTable.innerHTML = '';

        // Agregar transacciones
        recentTransactions.forEach(transaction => {
            const row = this.createTransactionRow(transaction);
            this.domElements.recentTransactionsTable.appendChild(row);
        });
    }

    /**
     * Crear fila de transacción para tabla
     */
    createTransactionRow(transaction) {
        const row = document.createElement('tr');
        
        const category = this.categories.find(c => c.name === transaction.category);
        const categoryIcon = category ? category.icon : 'fa-ellipsis-h';
        
        const date = new Date(transaction.date);
        const formattedDate = `${date.getDate().toString().padStart(2, '0')}/${(date.getMonth() + 1).toString().padStart(2, '0')}/${date.getFullYear()}`;
        
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
                    ${transaction.type === 'income' ? 'Ingreso' : 'Egreso'}
                </span>
            </td>
            <td class="${transaction.type === 'income' ? 'income-value' : 'expense-value'}">
                ${transaction.type === 'income' ? '+' : '-'}$${transaction.amount.toFixed(2)}
            </td>
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
     * Actualizar estado de presupuestos en dashboard
     */
    async updateBudgetStatus() {
        if (!this.domElements.budgetsGrid) return;

        // Obtener presupuestos del mes actual
        const currentBudgets = this.budgets.filter(b => 
            b.month === this.currentMonth && b.year === this.currentYear
        );

        // Calcular gastos por categoría
        const expensesByCategory = {};
        this.transactions
            .filter(t => t.type === 'expense' && t.month === this.currentMonth && t.year === this.currentYear)
            .forEach(t => {
                expensesByCategory[t.category] = (expensesByCategory[t.category] || 0) + t.amount;
            });

        // Limpiar grid
        this.domElements.budgetsGrid.innerHTML = '';

        // Crear tarjetas de presupuesto
        currentBudgets.forEach(budget => {
            const spent = expensesByCategory[budget.category] || 0;
            const percentage = budget.amount > 0 ? (spent / budget.amount * 100) : 0;
            const remaining = budget.amount - spent;
            
            let statusClass = 'status-good';
            let statusIcon = 'fa-check-circle';
            let statusText = `${Math.round(percentage)}% usado`;
            
            if (percentage >= 90) {
                statusClass = 'status-danger';
                statusIcon = 'fa-exclamation-circle';
            } else if (percentage >= 70) {
                statusClass = 'status-warning';
                statusIcon = 'fa-exclamation-triangle';
            }

            const category = this.categories.find(c => c.name === budget.category);
            const categoryColor = category ? category.color : '#6B7280';

            const card = document.createElement('div');
            card.className = 'card budget-card';
            card.innerHTML = `
                <div class="budget-header">
                    <h3 class="budget-title">${budget.category}</h3>
                    <span class="budget-status ${statusClass}">
                        <i class="fas ${statusIcon}"></i>
                        ${statusText}
                    </span>
                </div>
                <div class="budget-progress">
                    <div class="progress-bar">
                        <div class="progress-fill" style="width: ${Math.min(percentage, 100)}%; background-color: ${categoryColor};"></div>
                    </div>
                    <div class="budget-amounts">
                        <span class="budget-spent">$${spent.toFixed(2)} / $${budget.amount.toFixed(2)}</span>
                        <span class="budget-remaining">$${remaining.toFixed(2)} restantes</span>
                    </div>
                </div>
            `;
            
            this.domElements.budgetsGrid.appendChild(card);
        });
    }

    /**
     * Actualizar gráficos
     */
    updateCharts() {
        if (typeof Chart === 'undefined') {
            console.warn('Chart.js no está cargado. Los gráficos no se mostrarán.');
            return;
        }

        this.destroyCharts();
        this.createCharts();
    }

    /**
     * Destruir gráficos existentes
     */
    destroyCharts() {
        Object.values(this.charts).forEach(chart => {
            if (chart) chart.destroy();
        });
        this.charts = {};
    }

    /**
     * Crear gráficos
     */
    createCharts() {
        // Gráfico 1: Gastos por categoría
        if (this.domElements.chartCanvases.expensesByCategory) {
            this.charts.expensesByCategory = this.createExpensesByCategoryChart(
                this.domElements.chartCanvases.expensesByCategory
            );
        }

        // Gráfico 2: Evolución del balance
        if (this.domElements.chartCanvases.balanceEvolution) {
            this.charts.balanceEvolution = this.createBalanceEvolutionChart(
                this.domElements.chartCanvases.balanceEvolution
            );
        }

        // Gráfico 3: Presupuesto vs Real
        if (this.domElements.chartCanvases.budgetVsActual) {
            this.charts.budgetVsActual = this.createBudgetVsActualChart(
                this.domElements.chartCanvases.budgetVsActual
            );
        }

        // Gráfico 4: Ingresos vs Gastos
        if (this.domElements.chartCanvases.incomeVsExpenses) {
            this.charts.incomeVsExpenses = this.createIncomeVsExpensesChart(
                this.domElements.chartCanvases.incomeVsExpenses
            );
        }
    }

    /**
     * Crear gráfico de gastos por categoría
     */
    createExpensesByCategoryChart(canvas) {
        const ctx = canvas.getContext('2d');
        
        const currentMonthExpenses = this.transactions.filter(t => 
            t.type === 'expense' && t.month === this.currentMonth && t.year === this.currentYear
        );

        // Agrupar por categoría
        const expensesByCategory = {};
        currentMonthExpenses.forEach(t => {
            expensesByCategory[t.category] = (expensesByCategory[t.category] || 0) + t.amount;
        });

        const categories = Object.keys(expensesByCategory);
        const amounts = Object.values(expensesByCategory);

        // Obtener colores de las categorías
        const backgroundColors = categories.map(category => {
            const cat = this.categories.find(c => c.name === category);
            return cat ? cat.color + '80' : '#6B728080';
        });

        if (categories.length === 0) {
            // Mostrar mensaje si no hay datos
            ctx.font = '14px Inter';
            ctx.fillStyle = '#6B7280';
            ctx.textAlign = 'center';
            ctx.fillText('No hay datos disponibles', canvas.width / 2, canvas.height / 2);
            return null;
        }

        return new Chart(ctx, {
            type: 'doughnut',
            data: {
                labels: categories,
                datasets: [{
                    data: amounts,
                    backgroundColor: backgroundColors,
                    borderWidth: 1
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        position: 'right'
                    }
                }
            }
        });
    }

    /**
     * Crear gráfico de evolución del balance
     */
    createBalanceEvolutionChart(canvas) {
        const ctx = canvas.getContext('2d');
        
        // Obtener últimos 6 meses
        const months = [];
        const balances = [];
        
        for (let i = 5; i >= 0; i--) {
            const date = new Date(this.currentYear, this.currentMonth - i, 1);
            const month = date.getMonth();
            const year = date.getFullYear();
            
            const monthTransactions = this.transactions.filter(t => 
                t.month === month && t.year === year
            );
            
            const income = monthTransactions
                .filter(t => t.type === 'income')
                .reduce((sum, t) => sum + t.amount, 0);
                
            const expenses = monthTransactions
                .filter(t => t.type === 'expense')
                .reduce((sum, t) => sum + t.amount, 0);
            
            const balance = income - expenses;
            
            months.push(date.toLocaleDateString('es-ES', { month: 'short' }));
            balances.push(balance);
        }

        if (balances.every(b => b === 0)) {
            // Mostrar mensaje si no hay datos
            ctx.font = '14px Inter';
            ctx.fillStyle = '#6B7280';
            ctx.textAlign = 'center';
            ctx.fillText('No hay datos disponibles', canvas.width / 2, canvas.height / 2);
            return null;
        }

        return new Chart(ctx, {
            type: 'line',
            data: {
                labels: months,
                datasets: [{
                    label: 'Balance',
                    data: balances,
                    borderColor: '#4F46E5',
                    backgroundColor: 'rgba(79, 70, 229, 0.1)',
                    fill: true,
                    tension: 0.4
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
                        beginAtZero: true
                    }
                }
            }
        });
    }

    /**
     * Crear gráfico de presupuesto vs real
     */
    createBudgetVsActualChart(canvas) {
        const ctx = canvas.getContext('2d');
        
        const currentBudgets = this.budgets.filter(b => 
            b.month === this.currentMonth && b.year === this.currentYear
        );

        // Calcular gastos reales por categoría
        const expensesByCategory = {};
        this.transactions
            .filter(t => t.type === 'expense' && t.month === this.currentMonth && t.year === this.currentYear)
            .forEach(t => {
                expensesByCategory[t.category] = (expensesByCategory[t.category] || 0) + t.amount;
            });

        const categories = currentBudgets.map(b => b.category);
        const budgeted = currentBudgets.map(b => b.amount);
        const actual = categories.map(category => expensesByCategory[category] || 0);

        if (categories.length === 0) {
            // Mostrar mensaje si no hay datos
            ctx.font = '14px Inter';
            ctx.fillStyle = '#6B7280';
            ctx.textAlign = 'center';
            ctx.fillText('No hay datos disponibles', canvas.width / 2, canvas.height / 2);
            return null;
        }

        return new Chart(ctx, {
            type: 'bar',
            data: {
                labels: categories,
                datasets: [
                    {
                        label: 'Presupuestado',
                        data: budgeted,
                        backgroundColor: 'rgba(79, 70, 229, 0.5)',
                        borderColor: '#4F46E5',
                        borderWidth: 1
                    },
                    {
                        label: 'Real',
                        data: actual,
                        backgroundColor: 'rgba(16, 185, 129, 0.5)',
                        borderColor: '#10B981',
                        borderWidth: 1
                    }
                ]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                scales: {
                    x: {
                        grid: {
                            display: false
                        }
                    },
                    y: {
                        beginAtZero: true
                    }
                }
            }
        });
    }

    /**
     * Crear gráfico de ingresos vs gastos
     */
    createIncomeVsExpensesChart(canvas) {
        const ctx = canvas.getContext('2d');
        
        const currentMonthTransactions = this.transactions.filter(t => 
            t.month === this.currentMonth && t.year === this.currentYear
        );

        const income = currentMonthTransactions
            .filter(t => t.type === 'income')
            .reduce((sum, t) => sum + t.amount, 0);

        const expenses = currentMonthTransactions
            .filter(t => t.type === 'expense')
            .reduce((sum, t) => sum + t.amount, 0);

        if (income === 0 && expenses === 0) {
            // Mostrar mensaje si no hay datos
            ctx.font = '14px Inter';
            ctx.fillStyle = '#6B7280';
            ctx.textAlign = 'center';
            ctx.fillText('No hay datos disponibles', canvas.width / 2, canvas.height / 2);
            return null;
        }

        return new Chart(ctx, {
            type: 'bar',
            data: {
                labels: ['Ingresos', 'Gastos'],
                datasets: [{
                    data: [income, expenses],
                    backgroundColor: [
                        'rgba(16, 185, 129, 0.7)',
                        'rgba(239, 68, 68, 0.7)'
                    ],
                    borderColor: [
                        '#10B981',
                        '#EF4444'
                    ],
                    borderWidth: 1
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
                        beginAtZero: true
                    }
                }
            }
        });
    }}