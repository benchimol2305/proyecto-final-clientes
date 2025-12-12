// js/models.js
/**
 * Modelos de datos para FinanzApp*/

// Clase base para todas las entidades
class BaseModel {
    constructor(data = {}) {
        this.id = data.id || null;
        this.createdAt = data.createdAt || new Date().toISOString();
        this.updatedAt = data.updatedAt || new Date().toISOString();
    }
}

// Modelo de categoría
class Category extends BaseModel {
    constructor(data = {}) {
        super(data);
        this.name = data.name || '';
        this.color = data.color || '#6B7280';
        this.icon = data.icon || 'fa-tag';
        this.isDefault = data.isDefault || false;
    }
    
    static getDefaultCategories() {
        return [
            new Category({ name: 'Alimentación', icon: 'fa-shopping-cart', color: '#10B981', isDefault: true }),
            new Category({ name: 'Transporte', icon: 'fa-car', color: '#3B82F6', isDefault: true }),
            new Category({ name: 'Ocio', icon: 'fa-film', color: '#8B5CF6', isDefault: true }),
            new Category({ name: 'Servicios', icon: 'fa-bolt', color: '#F59E0B', isDefault: true }),
            new Category({ name: 'Salud', icon: 'fa-heart', color: '#EF4444', isDefault: true }),
            new Category({ name: 'Educación', icon: 'fa-graduation-cap', color: '#06B6D4', isDefault: true }),
            new Category({ name: 'Ingreso fijo', icon: 'fa-money-bill-wave', color: '#10B981', isDefault: true }),
            new Category({ name: 'Trabajo Extra', icon: 'fa-laptop-code', color: '#8B5CF6', isDefault: true }),
            new Category({ name: 'Otros', icon: 'fa-ellipsis-h', color: '#6B7280', isDefault: true })
        ];
    }
}

// Modelo de transacción
class Transaction extends BaseModel {
    constructor(data = {}) {
        super(data);
        this.type = data.type || 'expense';
        this.amount = data.amount || 0;
        this.date = data.date || new Date().toISOString().split('T')[0];
        this.category = data.category || '';
        this.description = data.description || '';
        this.month = data.month || new Date().getMonth();
        this.year = data.year || new Date().getFullYear();
    }
    
    getFormattedDate() {
        const date = new Date(this.date);
        return `${date.getDate().toString().padStart(2, '0')}/${(date.getMonth() + 1).toString().padStart(2, '0')}/${date.getFullYear()}`;
    }
    
    getFormattedAmount() {
        const sign = this.type === 'income' ? '+' : '-';
        return `${sign}$${this.amount.toFixed(2)}`;
    }
    
    getTypeText() {
        return this.type === 'income' ? 'Ingreso' : 'Egreso';
    }
    
    static getSampleTransactions() {
        const currentMonth = new Date().getMonth();
        const currentYear = new Date().getFullYear();
        const today = new Date().toISOString().split('T')[0];
        
        return [
            new Transaction({
                type: 'income',
                amount: 2850.00,
                date: today,
                category: 'Ingreso fijo',
                description: 'Salario mensual',
                month: currentMonth,
                year: currentYear
            }),
            new Transaction({
                type: 'expense',
                amount: 450.50,
                date: today,
                category: 'Alimentación',
                description: 'Supermercado semanal',
                month: currentMonth,
                year: currentYear
            })
        ];
    }
}

// Modelo de presupuesto
class Budget extends BaseModel {
    constructor(data = {}) {
        super(data);
        this.category = data.category || '';
        this.amount = data.amount || 0;
        this.month = data.month || new Date().getMonth();
        this.year = data.year || new Date().getFullYear();
    }
    
    static getSampleBudgets() {
        const currentMonth = new Date().getMonth();
        const currentYear = new Date().getFullYear();
        
        return [
            new Budget({
                category: 'Alimentación',
                amount: 600,
                month: currentMonth,
                year: currentYear
            }),
            new Budget({
                category: 'Transporte',
                amount: 200,
                month: currentMonth,
                year: currentYear
            })
        ];
    }
}

// Estadísticas financieras
class FinancialStats {
    constructor(transactions = [], budgets = []) {
        this.transactions = transactions;
        this.budgets = budgets;
        this.currentMonth = new Date().getMonth();
        this.currentYear = new Date().getFullYear();
    }
    
    getCurrentMonthTransactions() {
        return this.transactions.filter(t => 
            t.month === this.currentMonth && t.year === this.currentYear
        );
    }
    
    getIncome() {
        return this.getCurrentMonthTransactions()
            .filter(t => t.type === 'income')
            .reduce((sum, t) => sum + t.amount, 0);
    }
    
    getExpenses() {
        return this.getCurrentMonthTransactions()
            .filter(t => t.type === 'expense')
            .reduce((sum, t) => sum + t.amount, 0);
    }
    
    getBalance() {
        return this.getIncome() - this.getExpenses();
    }
    
    getTotalBudget() {
        return this.budgets
            .filter(b => b.month === this.currentMonth && b.year === this.currentYear)
            .reduce((sum, b) => sum + b.amount, 0);
    }
    
    getRemainingBudget() {
        return this.getTotalBudget() - this.getExpenses();
    }
    
    getBudgetUsagePercentage() {
        const total = this.getTotalBudget();
        return total > 0 ? (this.getExpenses() / total * 100) : 0;
    }
}

// Exportar al ámbito global
if (typeof window !== 'undefined') {
    window.Category = Category;
    window.Transaction = Transaction;
    window.Budget = Budget;
    window.FinancialStats = FinancialStats;
}