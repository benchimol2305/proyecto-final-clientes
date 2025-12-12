document.addEventListener('DOMContentLoaded', () => {
    const app = new FinanzApp();
    app.init();
});

/**
 * Clase principal de la aplicacin finanzApp
 */
class FinanzApp {
    constructor() {
        this.db = null;
        this.dbName = 'FinanzAppDB';
        this.dbVersion = 1;
        
        // referencias a elementos del DOM
        this.domElements = {};
        
        // datos actuales
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
     * Inicializacion de app
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
            
            // Navegacion
            navLinks: document.querySelectorAll('.nav-link'),
            
            // Dashboard
            incomeValue: document.querySelector('.income-value'),
            expenseValue: document.querySelector('.expense-value'),
            balanceValue: document.querySelector('.balance-value'),
            budgetValue: document.querySelector('.budget-value'),
            
            // Graficos
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
    }

    /**
     * Actualizar vista de transacciones
     */
    async updateTransactionsView() {
        if (this.currentView !== 'transactions') return;
        
        await this.updateTransactionsTable();
        this.updateTransactionsSummary();
        this.populateCategoryFilter();
    }

    /**
     * Actualizar tabla de transacciones
     */
    async updateTransactionsTable() {
        if (!this.domElements.allTransactionsTable) return;

        // Obtener filtros
        const filterType = this.domElements.filterType ? this.domElements.filterType.value : 'all';
        const filterCategory = this.domElements.filterCategory ? this.domElements.filterCategory.value : 'all';
        const filterMonth = this.domElements.filterMonth ? this.domElements.filterMonth.value : '';
        const searchText = this.domElements.searchTransactions ? this.domElements.searchTransactions.value.toLowerCase() : '';

        // Filtrar transacciones
        let filteredTransactions = this.transactions;

        if (filterType !== 'all') {
            filteredTransactions = filteredTransactions.filter(t => t.type === filterType);
        }

        if (filterCategory !== 'all') {
            filteredTransactions = filteredTransactions.filter(t => t.category === filterCategory);
        }

        if (filterMonth) {
            const [year, month] = filterMonth.split('-').map(Number);
            filteredTransactions = filteredTransactions.filter(t => 
                t.year === year && t.month === (month - 1)
            );
        }

        if (searchText) {
            filteredTransactions = filteredTransactions.filter(t => 
                (t.description?.toLowerCase().includes(searchText) || 
                 t.category?.toLowerCase().includes(searchText))
            );
        }

        // Ordenar por fecha (más reciente primero)
        filteredTransactions.sort((a, b) => new Date(b.date) - new Date(a.date));

        // Limpiar tabla
        this.domElements.allTransactionsTable.innerHTML = '';

        // Agregar transacciones
        filteredTransactions.forEach(transaction => {
            const row = this.createTransactionRow(transaction);
            this.domElements.allTransactionsTable.appendChild(row);
        });
    }

    /**
     * Actualizar resumen de transacciones
     */
    updateTransactionsSummary(filteredTransactions = null) {
        const transactions = filteredTransactions || this.transactions;
        
        const totalIncome = transactions
            .filter(t => t.type === 'income')
            .reduce((sum, t) => sum + t.amount, 0);
            
        const totalExpense = transactions
            .filter(t => t.type === 'expense')
            .reduce((sum, t) => sum + t.amount, 0);

        if (this.domElements.totalIncome) {
            this.domElements.totalIncome.textContent = `Ingresos: $${totalIncome.toFixed(2)}`;
        }

        if (this.domElements.totalExpense) {
            this.domElements.totalExpense.textContent = `Egresos: $${totalExpense.toFixed(2)}`;
        }
    }

    /**
     * Llenar filtro de categorías
     */
    populateCategoryFilter() {
        if (!this.domElements.filterCategory) return;

        // Guardar valor seleccionado
        const selectedValue = this.domElements.filterCategory.value;
        
        // Limpiar opciones excepto la primera
        while (this.domElements.filterCategory.options.length > 1) {
            this.domElements.filterCategory.remove(1);
        }

        // Agregar categorías
        this.categories.forEach(category => {
            const option = document.createElement('option');
            option.value = category.name;
            option.textContent = category.name;
            this.domElements.filterCategory.appendChild(option);
        });

        // Restaurar valor seleccionado si existe
        if (selectedValue && selectedValue !== 'all') {
            this.domElements.filterCategory.value = selectedValue;
        }
    }

    /**
     * Actualizar vista de categorías
     */
    async updateCategoriesView() {
        if (this.currentView !== 'categories') return;
        
        await this.loadCategories();
        this.updateCategoriesGrid();
    }

    /**
     * Actualizar grid de categorías
     */
    updateCategoriesGrid() {
        if (!this.domElements.categoriesGrid) return;

        this.domElements.categoriesGrid.innerHTML = '';

        if (this.categories.length === 0) {
            this.domElements.categoriesGrid.innerHTML = `
                <div class="empty-state">
                    <i class="fas fa-tags"></i>
                    <p>No hay categorías creadas</p>
                </div>
            `;
            return;
        }

        // Agregar categorías predefinidas primero
        const defaultCategories = ['Alimentación', 'Transporte', 'Ocio', 'Servicios', 'Salud', 'Educación', 'Ingreso fijo', 'Trabajo Extra', 'Otros'];
        
        defaultCategories.forEach(categoryName => {
            const category = this.categories.find(c => c.name === categoryName);
            if (category) {
                const categoryCard = this.createCategoryCard(category);
                this.domElements.categoriesGrid.appendChild(categoryCard);
            }
        });

        // Agregar categorías personalizadas
        this.categories
            .filter(c => !defaultCategories.includes(c.name))
            .forEach(category => {
                const categoryCard = this.createCategoryCard(category);
                this.domElements.categoriesGrid.appendChild(categoryCard);
            });
    }

    /**
     * Crear tarjeta de categoría
     */
    createCategoryCard(category) {
        const card = document.createElement('div');
        card.className = 'card category-card';
        card.style.borderTop = `4px solid ${category.color || '#6B7280'}`;
        
        // Contar transacciones en esta categoría
        const transactionCount = this.transactions.filter(t => t.category === category.name).length;
        
        card.innerHTML = `
            <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 1rem;">
                <div>
                    <h3 style="font-weight: 600; color: var(--gray-900); margin-bottom: 0.25rem;">${category.name}</h3>
                    <p style="color: var(--gray-500); font-size: 0.875rem; margin: 0;">
                        <i class="fas ${category.icon || 'fa-tag'}"></i> 
                        ${transactionCount} transacción${transactionCount !== 1 ? 'es' : ''}
                    </p>
                </div>
                <div style="width: 40px; height: 40px; border-radius: var(--radius-md); background-color: ${category.color || '#6B7280'}20; display: flex; align-items: center; justify-content: center; color: ${category.color || '#6B7280'};">
                    <i class="fas ${category.icon || 'fa-tag'}"></i>
                </div>
            </div>
            
            <div style="display: flex; gap: 0.5rem; margin-top: 1rem;">
                <button class="btn btn-secondary btn-edit-category" style="flex: 1; padding: 0.5rem;" data-id="${category.id}">
                    <i class="fas fa-edit"></i> Editar
                </button>
                ${category.name === 'Otros' ? '' : `
                    <button class="btn btn-secondary btn-delete-category" style="flex: 1; padding: 0.5rem; background-color: #FEE2E2; color: #DC2626;" data-id="${category.id}">
                        <i class="fas fa-trash"></i> Eliminar
                    </button>
                `}
            </div>
        `;

        return card;
    }

    /**
     * Actualizar vista de presupuestos
     */
    async updateBudgetsView() {
        if (this.currentView !== 'budgets') return;
        
        await this.loadBudgets();
        this.updateBudgetsContainer();
    }

    /**
     * Llenar selects de mes y año
     */
    populateMonthYearSelects() {
        if (!this.domElements.budgetMonthSelect || !this.domElements.budgetYearSelect) return;

        // Llenar meses
        const months = [
            'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
            'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
        ];
        
        this.domElements.budgetMonthSelect.innerHTML = '';
        months.forEach((month, index) => {
            const option = document.createElement('option');
            option.value = index;
            option.textContent = month;
            if (index === this.currentMonth) option.selected = true;
            this.domElements.budgetMonthSelect.appendChild(option);
        });

        // Llenar años
        this.domElements.budgetYearSelect.innerHTML = '';
        const currentYear = this.currentYear;
        for (let i = currentYear - 1; i <= currentYear + 2; i++) {
            const option = document.createElement('option');
            option.value = i;
            option.textContent = i;
            if (i === currentYear) option.selected = true;
            this.domElements.budgetYearSelect.appendChild(option);
        }
    }

    /**
     * Actualizar contenedor de presupuestos
     */
    updateBudgetsContainer() {
        if (!this.domElements.budgetsContainer || !this.domElements.budgetSummarySection) return;
        
        const month = parseInt(this.domElements.budgetMonthSelect.value);
        const year = parseInt(this.domElements.budgetYearSelect.value);
        
        // Obtener presupuestos del mes seleccionado
        const monthBudgets = this.budgets.filter(b => 
            b.month === month && b.year === year
        );
        
        // Calcular gastos reales por categoría
        const expensesByCategory = {};
        this.transactions
            .filter(t => t.type === 'expense' && t.month === month && t.year === year)
            .forEach(t => {
                expensesByCategory[t.category] = (expensesByCategory[t.category] || 0) + t.amount;
            });
        
        // Limpiar contenedores
        this.domElements.budgetsContainer.innerHTML = '';
        this.domElements.budgetSummarySection.innerHTML = '';
        
        if (monthBudgets.length === 0) {
            this.domElements.budgetsContainer.innerHTML = `
                <div class="empty-state">
                    <i class="fas fa-chart-pie"></i>
                    <p>No hay presupuestos configurados para este mes.</p>
                    <button class="btn btn-primary" id="btnCreateFirstBudget" style="margin-top: 1rem;">
                        <i class="fas fa-plus"></i> Crear primer presupuesto
                    </button>
                </div>
            `;
            
            // Agregar event listener al botón
            setTimeout(() => {
                const btn = document.getElementById('btnCreateFirstBudget');
                if (btn) {
                    btn.addEventListener('click', () => this.showBudgetForm());
                }
            }, 100);
            
            return;
        }
        
        // Crear tarjetas de presupuesto
        monthBudgets.forEach(budget => {
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
            
            const budgetCard = document.createElement('div');
            budgetCard.className = 'card budget-card';
            budgetCard.innerHTML = `
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
                <div style="display: flex; gap: 0.5rem; margin-top: 1rem;">
                    <button class="btn btn-secondary btn-edit-budget" style="flex: 1; padding: 0.5rem;" data-id="${budget.id}">
                        <i class="fas fa-edit"></i> Editar
                    </button>
                    <button class="btn btn-secondary btn-delete-budget" style="flex: 1; padding: 0.5rem; background-color: #FEE2E2; color: #DC2626;" data-id="${budget.id}">
                        <i class="fas fa-trash"></i> Eliminar
                    </button>
                </div>
            `;
            
            this.domElements.budgetsContainer.appendChild(budgetCard);
        });
        
        // Actualizar resumen
        this.updateBudgetSummary(month, year, monthBudgets, expensesByCategory);
    }

    /**
     * Actualizar resumen de presupuestos
     */
    updateBudgetSummary(month, year, monthBudgets, expensesByCategory) {
        const totalBudget = monthBudgets.reduce((sum, b) => sum + b.amount, 0);
        const totalSpent = Object.values(expensesByCategory).reduce((sum, amount) => sum + amount, 0);
        const totalRemaining = totalBudget - totalSpent;
        const overallPercentage = totalBudget > 0 ? (totalSpent / totalBudget * 100) : 0;
        
        let summaryStatus = 'status-good';
        let summaryIcon = 'fa-check-circle';
        let summaryMessage = 'Todo bajo control';
        
        if (overallPercentage >= 90) {
            summaryStatus = 'status-danger';
            summaryIcon = 'fa-exclamation-circle';
            summaryMessage = '¡Cuidado! Has superado el 90% de tu presupuesto';
        } else if (overallPercentage >= 70) {
            summaryStatus = 'status-warning';
            summaryIcon = 'fa-exclamation-triangle';
            summaryMessage = 'Estás cerca de alcanzar tu límite de presupuesto';
        }
        
        const monthNames = [
            'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
            'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
        ];
        
        this.domElements.budgetSummarySection.innerHTML = `
            <h3 style="margin-bottom: 1rem; color: var(--gray-900);">Resumen de ${monthNames[month]} ${year}</h3>
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 1rem;">
                <div>
                    <h4 style="margin: 0; color: var(--gray-800);">Presupuesto total: $${totalBudget.toFixed(2)}</h4>
                    <p style="margin: 0.25rem 0 0 0; color: var(--gray-600); font-size: 0.875rem;">
                        Gastado: $${totalSpent.toFixed(2)} | Restante: $${totalRemaining.toFixed(2)}
                    </p>
                </div>
                <span class="budget-status ${summaryStatus}">
                    <i class="fas ${summaryIcon}"></i>
                    ${Math.round(overallPercentage)}% utilizado
                </span>
            </div>
            <div class="progress-bar" style="height: 10px;">
                <div class="progress-fill" style="width: ${Math.min(overallPercentage, 100)}%; background-color: ${overallPercentage >= 90 ? '#EF4444' : overallPercentage >= 70 ? '#F59E0B' : '#10B981'};"></div>
            </div>
            <p style="margin-top: 0.5rem; color: var(--gray-600); font-size: 0.875rem;">
                <i class="fas ${summaryIcon}"></i> ${summaryMessage}
            </p>
        `;
    }

    /**
     * Mostrar formulario de transacción
     */
    async showTransactionForm(transactionId = null) {
        const isEdit = transactionId !== null;
        const transaction = isEdit ? this.transactions.find(t => t.id === transactionId) : null;

        const modalHTML = `
            <div class="modal-overlay" id="transactionModal">
                <div class="modal">
                    <div class="modal-header">
                        <h3 class="modal-title">${isEdit ? 'Editar Transacción' : 'Nueva Transacción'}</h3>
                        <button class="modal-close" id="closeTransactionModal">
                            <i class="fas fa-times"></i>
                        </button>
                    </div>
                    <div class="modal-body">
                        <form id="transactionForm">
                            <div class="form-group">
                                <label for="transactionType">Tipo *</label>
                                <select id="transactionType" name="type" required>
                                    <option value="income" ${transaction?.type === 'income' ? 'selected' : ''}>Ingreso</option>
                                    <option value="expense" ${transaction?.type === 'expense' ? 'selected' : ''}>Egreso</option>
                                </select>
                            </div>
                            
                            <div class="form-group">
                                <label for="transactionAmount">Monto ($) *</label>
                                <input type="number" id="transactionAmount" name="amount" step="0.01" min="0.01" required 
                                       value="${transaction?.amount || ''}" placeholder="0.00">
                            </div>
                            
                            <div class="form-group">
                                <label for="transactionDate">Fecha *</label>
                                <input type="date" id="transactionDate" name="date" required 
                                       value="${transaction?.date || new Date().toISOString().split('T')[0]}">
                            </div>
                            
                            <div class="form-group">
                                <label for="transactionCategory">Categoría *</label>
                                <select id="transactionCategory" name="category" required>
                                    <option value="">Seleccionar categoría</option>
                                    ${this.categories.map(c => `
                                        <option value="${c.name}" ${transaction?.category === c.name ? 'selected' : ''}>
                                            ${c.name}
                                        </option>
                                    `).join('')}
                                </select>
                            </div>
                            
                            <div class="form-group">
                                <label for="transactionDescription">Descripción (opcional)</label>
                                <textarea id="transactionDescription" name="description" rows="3" placeholder="Descripción de la transacción...">${transaction?.description || ''}</textarea>
                            </div>
                        </form>
                    </div>
                    <div class="modal-footer">
                        <button class="btn btn-secondary" id="cancelTransaction">Cancelar</button>
                        <button class="btn btn-primary" id="saveTransaction">
                            ${isEdit ? 'Actualizar' : 'Guardar'}
                        </button>
                    </div>
                </div>
            </div>
        `;

        // Crear modal
        const modalContainer = document.getElementById('modals-container') || document.body;
        modalContainer.insertAdjacentHTML('beforeend', modalHTML);
        
        const modal = document.getElementById('transactionModal');
        
        // Mostrar modal
        setTimeout(() => modal.classList.add('active'), 10);

        // Configurar event listeners del modal
        const closeModal = () => {
            modal.classList.remove('active');
            setTimeout(() => modal.remove(), 300);
        };

        document.getElementById('closeTransactionModal').addEventListener('click', closeModal);
        document.getElementById('cancelTransaction').addEventListener('click', closeModal);

        document.getElementById('saveTransaction').addEventListener('click', async () => {
            const form = document.getElementById('transactionForm');
            const formData = new FormData(form);
            
            const transactionData = {
                type: formData.get('type'),
                amount: parseFloat(formData.get('amount')),
                date: formData.get('date'),
                category: formData.get('category'),
                description: formData.get('description'),
                month: new Date(formData.get('date')).getMonth(),
                year: new Date(formData.get('date')).getFullYear()
            };

            // Validar
            if (!transactionData.type || !transactionData.amount || !transactionData.date || !transactionData.category) {
                this.showNotification('Por favor complete todos los campos obligatorios', 'error');
                return;
            }

            if (transactionData.amount <= 0) {
                this.showNotification('El monto debe ser mayor a 0', 'error');
                return;
            }

            try {
                if (isEdit) {
                    transactionData.id = transactionId;
                    await this.updateTransaction(transactionData);
                    this.showNotification('Transacción actualizada correctamente', 'success');
                } else {
                    await this.saveTransaction(transactionData);
                    this.showNotification('Transacción guardada correctamente', 'success');
                }

                closeModal();
                await this.reloadAndUpdate();
            } catch (error) {
                this.showNotification('Error al guardar la transacción', 'error');
                console.error('Error:', error);
            }
        });
    }

    /**
     * Mostrar formulario de categoría
     */
    async showCategoryForm(categoryId = null) {
        const isEdit = categoryId !== null;
        const category = isEdit ? this.categories.find(c => c.id === categoryId) : null;

        const modalHTML = `
            <div class="modal-overlay" id="categoryModal">
                <div class="modal">
                    <div class="modal-header">
                        <h3 class="modal-title">${isEdit ? 'Editar Categoría' : 'Nueva Categoría'}</h3>
                        <button class="modal-close" id="closeCategoryModal">
                            <i class="fas fa-times"></i>
                        </button>
                    </div>
                    <div class="modal-body">
                        <form id="categoryForm">
                            <div class="form-group">
                                <label for="categoryName">Nombre *</label>
                                <input type="text" id="categoryName" name="name" required 
                                       value="${category?.name || ''}" placeholder="Ej: Comida">
                            </div>
                            
                            <div class="form-group">
                                <label for="categoryColor">Color *</label>
                                <input type="color" id="categoryColor" name="color" required 
                                       value="${category?.color || '#6B7280'}">
                            </div>
                            
                            <div class="form-group">
                                <label for="categoryIcon">Ícono</label>
                                <select id="categoryIcon" name="icon">
                                    <option value="fa-shopping-cart" ${category?.icon === 'fa-shopping-cart' ? 'selected' : ''}>🛒 Compras</option>
                                    <option value="fa-car" ${category?.icon === 'fa-car' ? 'selected' : ''}>🚗 Auto</option>
                                    <option value="fa-film" ${category?.icon === 'fa-film' ? 'selected' : ''}>🎬 Entretenimiento</option>
                                    <option value="fa-bolt" ${category?.icon === 'fa-bolt' ? 'selected' : ''}>⚡ Servicios</option>
                                    <option value="fa-heart" ${category?.icon === 'fa-heart' ? 'selected' : ''}>❤️ Salud</option>
                                    <option value="fa-graduation-cap" ${category?.icon === 'fa-graduation-cap' ? 'selected' : ''}>🎓 Educación</option>
                                    <option value="fa-money-bill-wave" ${category?.icon === 'fa-money-bill-wave' ? 'selected' : ''}>💰 Ingreso</option>
                                    <option value="fa-laptop-code" ${category?.icon === 'fa-laptop-code' ? 'selected' : ''}>💻 Trabajo</option>
                                    <option value="fa-ellipsis-h" ${category?.icon === 'fa-ellipsis-h' ? 'selected' : ''}>⋯ Otros</option>
                                </select>
                            </div>
                        </form>
                    </div>
                    <div class="modal-footer">
                        <button class="btn btn-secondary" id="cancelCategory">Cancelar</button>
                        <button class="btn btn-primary" id="saveCategory">
                            ${isEdit ? 'Actualizar' : 'Guardar'}
                        </button>
                    </div>
                </div>
            </div>
        `;

        // Crear modal
        const modalContainer = document.getElementById('modals-container') || document.body;
        modalContainer.insertAdjacentHTML('beforeend', modalHTML);
        
        const modal = document.getElementById('categoryModal');
        
        // Mostrar modal
        setTimeout(() => modal.classList.add('active'), 10);

        // Configurar event listeners del modal
        const closeModal = () => {
            modal.classList.remove('active');
            setTimeout(() => modal.remove(), 300);
        };

        document.getElementById('closeCategoryModal').addEventListener('click', closeModal);
        document.getElementById('cancelCategory').addEventListener('click', closeModal);

        document.getElementById('saveCategory').addEventListener('click', async () => {
            const form = document.getElementById('categoryForm');
            const formData = new FormData(form);
            
            const categoryData = {
                name: formData.get('name').trim(),
                color: formData.get('color'),
                icon: formData.get('icon') || 'fa-tag'
            };

            // Validar
            if (!categoryData.name) {
                this.showNotification('El nombre de la categoría es obligatorio', 'error');
                return;
            }

            // Verificar si ya existe (solo para nuevas categorías)
            if (!isEdit && this.categories.some(c => c.name.toLowerCase() === categoryData.name.toLowerCase())) {
                this.showNotification('Ya existe una categoría con ese nombre', 'error');
                return;
            }

            try {
                if (isEdit) {
                    categoryData.id = categoryId;
                    await this.updateCategory(categoryData);
                    this.showNotification('Categoría actualizada correctamente', 'success');
                } else {
                    await this.saveCategory(categoryData);
                    this.showNotification('Categoría creada correctamente', 'success');
                }

                closeModal();
                await this.reloadAndUpdate();
            } catch (error) {
                this.showNotification('Error al guardar la categoría', 'error');
                console.error('Error:', error);
            }
        });
    }

    /**
     * Mostrar formulario de presupuesto
     */
    async showBudgetForm(budgetId = null) {
        const isEdit = budgetId !== null;
        const budget = isEdit ? this.budgets.find(b => b.id === budgetId) : null;

        const modalHTML = `
            <div class="modal-overlay" id="budgetModal">
                <div class="modal">
                    <div class="modal-header">
                        <h3 class="modal-title">${isEdit ? 'Editar Presupuesto' : 'Nuevo Presupuesto'}</h3>
                        <button class="modal-close" id="closeBudgetModal">
                            <i class="fas fa-times"></i>
                        </button>
                    </div>
                    <div class="modal-body">
                        <form id="budgetForm">
                            <div class="form-group">
                                <label for="budgetCategory">Categoría *</label>
                                <select id="budgetCategory" name="category" required>
                                    <option value="">Seleccionar categoría</option>
                                    ${this.categories.map(c => `
                                        <option value="${c.name}" ${budget?.category === c.name ? 'selected' : ''}>
                                            ${c.name}
                                        </option>
                                    `).join('')}
                                </select>
                            </div>
                            
                            <div class="form-group">
                                <label for="budgetAmount">Monto ($) *</label>
                                <input type="number" id="budgetAmount" name="amount" step="0.01" min="0.01" required 
                                       value="${budget?.amount || ''}" placeholder="0.00">
                            </div>
                            
                            <div class="form-group">
                                <label for="budgetMonth">Mes *</label>
                                <select id="budgetMonth" name="month" required>
                                    ${Array.from({length: 12}, (_, i) => {
                                        const monthNames = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 
                                                          'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];
                                        return `<option value="${i}" ${budget?.month === i ? 'selected' : this.currentMonth === i ? 'selected' : ''}>
                                                    ${monthNames[i]}
                                                </option>`;
                                    }).join('')}
                                </select>
                            </div>
                            
                            <div class="form-group">
                                <label for="budgetYear">Año *</label>
                                <select id="budgetYear" name="year" required>
                                    ${Array.from({length: 5}, (_, i) => {
                                        const year = this.currentYear - 2 + i;
                                        return `<option value="${year}" ${budget?.year === year ? 'selected' : this.currentYear === year ? 'selected' : ''}>
                                                    ${year}
                                                </option>`;
                                    }).join('')}
                                </select>
                            </div>
                        </form>
                    </div>
                    <div class="modal-footer">
                        <button class="btn btn-secondary" id="cancelBudget">Cancelar</button>
                        <button class="btn btn-primary" id="saveBudget">
                            ${isEdit ? 'Actualizar' : 'Guardar'}
                        </button>
                    </div>
                </div>
            </div>
        `;

        // Crear modal
        const modalContainer = document.getElementById('modals-container') || document.body;
        modalContainer.insertAdjacentHTML('beforeend', modalHTML);
        
        const modal = document.getElementById('budgetModal');
        
        // Mostrar modal
        setTimeout(() => modal.classList.add('active'), 10);

        // Configurar event listeners del modal
        const closeModal = () => {
            modal.classList.remove('active');
            setTimeout(() => modal.remove(), 300);
        };

        document.getElementById('closeBudgetModal').addEventListener('click', closeModal);
        document.getElementById('cancelBudget').addEventListener('click', closeModal);

        document.getElementById('saveBudget').addEventListener('click', async () => {
            const form = document.getElementById('budgetForm');
            const formData = new FormData(form);
            
            const budgetData = {
                category: formData.get('category'),
                amount: parseFloat(formData.get('amount')),
                month: parseInt(formData.get('month')),
                year: parseInt(formData.get('year'))
            };

            // Validar
            if (!budgetData.category || !budgetData.amount || isNaN(budgetData.month) || isNaN(budgetData.year)) {
                this.showNotification('Por favor complete todos los campos', 'error');
                return;
            }

            if (budgetData.amount <= 0) {
                this.showNotification('El monto debe ser mayor a 0', 'error');
                return;
            }

            // Verificar si ya existe un presupuesto para esta categoría en el mismo mes/año
            const existingBudget = this.budgets.find(b => 
                b.category === budgetData.category && 
                b.month === budgetData.month && 
                b.year === budgetData.year &&
                (!isEdit || b.id !== budgetId)
            );

            if (existingBudget) {
                this.showNotification('Ya existe un presupuesto para esta categoría en el mismo mes', 'warning');
                return;
            }

            try {
                if (isEdit) {
                    budgetData.id = budgetId;
                    await this.updateBudget(budgetData);
                    this.showNotification('Presupuesto actualizado correctamente', 'success');
                } else {
                    await this.saveBudget(budgetData);
                    this.showNotification('Presupuesto creado correctamente', 'success');
                }

                closeModal();
                await this.reloadAndUpdate();
            } catch (error) {
                this.showNotification('Error al guardar el presupuesto', 'error');
                console.error('Error:', error);
            }
        });
    }

    /**
     * Mostrar filtros avanzados
     */
    showAdvancedFilters() {
        // Implementar lógica para mostrar filtros avanzados
        this.showNotification('Funcionalidad de filtros avanzados en desarrollo', 'warning');
    }

    /**
     * Exportar transacciones
     */
    exportTransactions() {
        if (this.transactions.length === 0) {
            this.showNotification('No hay transacciones para exportar', 'warning');
            return;
        }

        // Crear CSV
        const headers = ['Fecha', 'Descripción', 'Categoría', 'Tipo', 'Monto'];
        const csvData = this.transactions.map(t => [
            new Date(t.date).toLocaleDateString('es-ES'),
            t.description || '',
            t.category,
            t.type === 'income' ? 'Ingreso' : 'Egreso',
            `$${t.amount.toFixed(2)}`
        ]);

        const csvContent = [
            headers.join(','),
            ...csvData.map(row => row.join(','))
        ].join('\n');

        // Crear blob y descargar
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        const url = URL.createObjectURL(blob);
        
        link.setAttribute('href', url);
        link.setAttribute('download', `transacciones_${new Date().toISOString().split('T')[0]}.csv`);
        link.style.visibility = 'hidden';
        
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        
        this.showNotification('Transacciones exportadas correctamente', 'success');
    }

    /**
     * Editar transacción
     */
    editTransaction(transactionId) {
        this.showTransactionForm(transactionId);
    }

    /**
     * Eliminar transacción
     */
    async deleteTransaction(transactionId) {
        if (!confirm('¿Estás seguro de que deseas eliminar esta transacción?')) {
            return;
        }

        try {
            await this.deleteTransactionFromDB(transactionId);
            this.showNotification('Transacción eliminada correctamente', 'success');
            await this.reloadAndUpdate();
        } catch (error) {
            this.showNotification('Error al eliminar la transacción', 'error');
            console.error('Error:', error);
        }
    }

    /**
     * Editar categoría
     */
    editCategory(categoryId) {
        this.showCategoryForm(categoryId);
    }

    /**
     * Eliminar categoría
     */
    async deleteCategory(categoryId) {
        const category = this.categories.find(c => c.id === categoryId);
        if (!category) return;

        // Contar transacciones en esta categoría
        const transactionCount = this.transactions.filter(t => t.category === category.name).length;
        
        let message = `¿Estás seguro de que deseas eliminar la categoría "${category.name}"?`;
        if (transactionCount > 0) {
            message += `\n\nADVERTENCIA: Esta categoría tiene ${transactionCount} transacción${transactionCount !== 1 ? 'es' : ''} asociada${transactionCount !== 1 ? 's' : ''}.`;
            message += `\nTodas las transacciones asociadas también serán eliminadas permanentemente.`;
        }

        if (!confirm(message)) {
            return;
        }

        try {
            // Eliminar transacciones asociadas primero
            const transactionsToDelete = this.transactions.filter(t => t.category === category.name);
            for (const transaction of transactionsToDelete) {
                await this.deleteTransactionFromDB(transaction.id);
            }

            // Eliminar la categoría
            await this.deleteCategoryFromDB(categoryId);
            
            this.showNotification('Categoría eliminada correctamente', 'success');
            await this.reloadAndUpdate();
        } catch (error) {
            this.showNotification('Error al eliminar la categoría', 'error');
            console.error('Error:', error);
        }
    }

    /**
     * Editar presupuesto
     */
    editBudget(budgetId) {
        this.showBudgetForm(budgetId);
    }

    /**
     * Eliminar presupuesto
     */
    async deleteBudget(budgetId) {
        if (!confirm('¿Estás seguro de que deseas eliminar este presupuesto?')) {
            return;
        }

        try {
            await this.deleteBudgetFromDB(budgetId);
            this.showNotification('Presupuesto eliminado correctamente', 'success');
            await this.reloadAndUpdate();
        } catch (error) {
            this.showNotification('Error al eliminar el presupuesto', 'error');
            console.error('Error:', error);
        }
    }

    /**
     * Recargar y actualizar datos
     */
    async reloadAndUpdate() {
        await this.loadCategories();
        await this.loadTransactions();
        await this.loadBudgets();
        
        // Actualizar vista actual
        switch(this.currentView) {
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
     * Mostrar notificación
     */
    showNotification(message, type = 'info') {
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
        
        const container = document.getElementById('notifications-container') || document.body;
        container.appendChild(notification);
        
        // Mostrar
        setTimeout(() => notification.classList.add('active'), 10);
        
        // Ocultar y eliminar después de 5 segundos
        setTimeout(() => {
            notification.classList.remove('active');
            setTimeout(() => notification.remove(), 300);
        }, 5000);
    }

    // ========== indexdab ==========

    /**
     * Guardar transacción en IndexedDB
     */
    async saveTransaction(transaction) {
        return new Promise((resolve, reject) => {
            const transactionDB = this.db.transaction(['transactions'], 'readwrite');
            const store = transactionDB.objectStore('transactions');
            const request = store.add(transaction);

            request.onsuccess = () => resolve(request.result);
            request.onerror = () => reject(request.error);
        });
    }

    /**
     * Actualizar transacción en IndexedDB
     */
    async updateTransaction(transaction) {
        return new Promise((resolve, reject) => {
            const transactionDB = this.db.transaction(['transactions'], 'readwrite');
            const store = transactionDB.objectStore('transactions');
            const request = store.put(transaction);

            request.onsuccess = () => resolve(request.result);
            request.onerror = () => reject(request.error);
        });
    }

    /**
     * Eliminar transacción de IndexedDB
     */
    async deleteTransactionFromDB(id) {
        return new Promise((resolve, reject) => {
            const transactionDB = this.db.transaction(['transactions'], 'readwrite');
            const store = transactionDB.objectStore('transactions');
            const request = store.delete(id);

            request.onsuccess = () => resolve();
            request.onerror = () => reject(request.error);
        });
    }

    /**
     * Guardar categoría en IndexedDB
     */
    async saveCategory(category) {
        return new Promise((resolve, reject) => {
            const transactionDB = this.db.transaction(['categories'], 'readwrite');
            const store = transactionDB.objectStore('categories');
            const request = store.add(category);

            request.onsuccess = () => resolve(request.result);
            request.onerror = () => reject(request.error);
        });
    }

    /**
     * Actualizar categoría en IndexedDB
     */
    async updateCategory(category) {
        return new Promise((resolve, reject) => {
            const transactionDB = this.db.transaction(['categories'], 'readwrite');
            const store = transactionDB.objectStore('categories');
            const request = store.put(category);

            request.onsuccess = () => resolve(request.result);
            request.onerror = () => reject(request.error);
        });
    }

    /**
     * Eliminar categoría de IndexedDB
     */
    async deleteCategoryFromDB(id) {
        return new Promise((resolve, reject) => {
            const transactionDB = this.db.transaction(['categories'], 'readwrite');
            const store = transactionDB.objectStore('categories');
            const request = store.delete(id);

            request.onsuccess = () => resolve();
            request.onerror = () => reject(request.error);
        });
    }

    /**
     * Guardar presupuesto en IndexedDB
     */
    async saveBudget(budget) {
        return new Promise((resolve, reject) => {
            const transactionDB = this.db.transaction(['budgets'], 'readwrite');
            const store = transactionDB.objectStore('budgets');
            const request = store.add(budget);

            request.onsuccess = () => resolve(request.result);
            request.onerror = () => reject(request.error);
        });
    }

    /**
     * Actualizar presupuesto en IndexedDB
     */
    async updateBudget(budget) {
        return new Promise((resolve, reject) => {
            const transactionDB = this.db.transaction(['budgets'], 'readwrite');
            const store = transactionDB.objectStore('budgets');
            const request = store.put(budget);

            request.onsuccess = () => resolve(request.result);
            request.onerror = () => reject(request.error);
        });
    }

    /**
     * Eliminar presupuesto de IndexedDB
     */
    async deleteBudgetFromDB(id) {
        return new Promise((resolve, reject) => {
            const transactionDB = this.db.transaction(['budgets'], 'readwrite');
            const store = transactionDB.objectStore('budgets');
            const request = store.delete(id);

            request.onsuccess = () => resolve();
            request.onerror = () => reject(request.error);
        });
    }
}