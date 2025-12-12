// js/charts.js
/**
 * Manejo de gráficos con Chart.js*/

class ChartManager {
    constructor() {
        this.charts = {};
        this.colors = {
            primary: '#4F46E5',
            income: '#10B981',
            expense: '#EF4444'
        };
    }
    
    /**
     * Inicializar gráficos
     */
    init() {
        this.createCharts();
    }
    
    /**
     * Crear todos los gráficos
     */
    createCharts() {
        // Gráfico 1: Gastos por categoría
        this.createExpensesByCategoryChart();
        
        // Gráfico 2: Evolución del balance
        this.createBalanceEvolutionChart();
        
        // Gráfico 3: Presupuesto vs Real
        this.createBudgetVsActualChart();
        
        // Gráfico 4: Ingresos vs Gastos
        this.createIncomeVsExpensesChart();
    }
    
    /**
     * Actualizar gráficos con datos
     */
    updateCharts(stats, categories) {
        this.updateExpensesByCategoryChart(stats, categories);
        this.updateBalanceEvolutionChart(stats);
        this.updateBudgetVsActualChart(stats);
        this.updateIncomeVsExpensesChart(stats);
    }
    
    /**
     * Gráfico 1: Gastos por categoría
     */
    createExpensesByCategoryChart() {
        const canvas = document.getElementById('expensesByCategoryChart');
        if (!canvas) return;
        
        const ctx = canvas.getContext('2d');
        
        this.charts.expensesByCategory = new Chart(ctx, {
            type: 'doughnut',
            data: {
                labels: [],
                datasets: [{
                    data: [],
                    backgroundColor: [],
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
    
    updateExpensesByCategoryChart(stats, categories) {
        const chart = this.charts.expensesByCategory;
        if (!chart) return;
        
        // Obtener gastos por categoría del mes actual
        const expenses = stats.getCurrentMonthTransactions()
            .filter(t => t.type === 'expense');
        
        const expensesByCategory = {};
        expenses.forEach(t => {
            expensesByCategory[t.category] = (expensesByCategory[t.category] || 0) + t.amount;
        });
        
        const labels = Object.keys(expensesByCategory);
        const data = Object.values(expensesByCategory);
        
        // Obtener colores de las categorías
        const backgroundColors = labels.map(categoryName => {
            const category = categories.find(c => c.name === categoryName);
            return category ? category.color + '80' : '#6B728080';
        });
        
        chart.data.labels = labels;
        chart.data.datasets[0].data = data;
        chart.data.datasets[0].backgroundColor = backgroundColors;
        chart.update();
    }
    
    /**
     * Gráfico 2: Evolución del balance
     */
    createBalanceEvolutionChart() {
        const canvas = document.getElementById('balanceEvolutionChart');
        if (!canvas) return;
        
        const ctx = canvas.getContext('2d');
        
        this.charts.balanceEvolution = new Chart(ctx, {
            type: 'line',
            data: {
                labels: [],
                datasets: [{
                    label: 'Balance',
                    data: [],
                    borderColor: this.colors.primary,
                    backgroundColor: this.colors.primary + '20',
                    fill: true,
                    tension: 0.4
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false
            }
        });
    }
    
    /**
     * Gráfico 3: Presupuesto vs Real
     */
    createBudgetVsActualChart() {
        const canvas = document.getElementById('budgetVsActualChart');
        if (!canvas) return;
        
        const ctx = canvas.getContext('2d');
        
        this.charts.budgetVsActual = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: [],
                datasets: [
                    {
                        label: 'Presupuestado',
                        data: [],
                        backgroundColor: this.colors.primary + '80'
                    },
                    {
                        label: 'Real',
                        data: [],
                        backgroundColor: this.colors.expense + '80'
                    }
                ]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false
            }
        });
    }
    
    /**
     * Gráfico 4: Ingresos vs Gastos
     */
    createIncomeVsExpensesChart() {
        const canvas = document.getElementById('incomeVsExpensesChart');
        if (!canvas) return;
        
        const ctx = canvas.getContext('2d');
        
        this.charts.incomeVsExpenses = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: ['Ingresos', 'Gastos'],
                datasets: [{
                    data: [0, 0],
                    backgroundColor: [
                        this.colors.income + 'CC',
                        this.colors.expense + 'CC'
                    ]
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        display: false
                    }
                }
            }
        });
    }
    
    updateIncomeVsExpensesChart(stats) {
        const chart = this.charts.incomeVsExpenses;
        if (!chart) return;
        
        const income = stats.getIncome();
        const expenses = stats.getExpenses();
        
        chart.data.datasets[0].data = [income, expenses];
        chart.update();
    }
}

// Exportar al ámbito global
if (typeof window !== 'undefined') {
    window.ChartManager = ChartManager;
}