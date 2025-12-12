// js/database.js
/**
 * Manejo de IndexedDB para FinanzApp*/
class Database {
    constructor() {
        this.dbName = 'FinanzAppDB';
        this.dbVersion = 3;
        this.db = null;
    }
    
    /**
     * Inicializar la base de datos
     */
    async init() {
        return new Promise((resolve, reject) => {
            const request = indexedDB.open(this.dbName, this.dbVersion);
            
            request.onerror = (event) => {
                console.error('Error al abrir IndexedDB:', event.target.error);
                reject(event.target.error);
            };
            
            request.onupgradeneeded = (event) => {
                console.log('Actualizando esquema de IndexedDB...');
                this.db = event.target.result;
                this.createStores();
            };
            
            request.onsuccess = (event) => {
                this.db = event.target.result;
                console.log('IndexedDB inicializada correctamente');
                resolve();
            };
        });
    }
    
    /**
     * Crear almacenes de datos
     */
    createStores() {
        // Almacén de categorías
        if (!this.db.objectStoreNames.contains('categories')) {
            const categoryStore = this.db.createObjectStore('categories', { 
                keyPath: 'id', 
                autoIncrement: true 
            });
            categoryStore.createIndex('name', 'name', { unique: true });
        }
        
        // Almacén de transacciones
        if (!this.db.objectStoreNames.contains('transactions')) {
            const transactionStore = this.db.createObjectStore('transactions', { 
                keyPath: 'id', 
                autoIncrement: true 
            });
            transactionStore.createIndex('date', 'date');
            transactionStore.createIndex('category', 'category');
            transactionStore.createIndex('type', 'type');
        }
        
        // Almacén de presupuestos
        if (!this.db.objectStoreNames.contains('budgets')) {
            const budgetStore = this.db.createObjectStore('budgets', { 
                keyPath: 'id', 
                autoIncrement: true 
            });
            budgetStore.createIndex('category', 'category');
        }
    }
    
    /**
     * Métodos genéricos para CRUD
     */
    
    async getAll(storeName) {
        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction([storeName], 'readonly');
            const store = transaction.objectStore(storeName);
            const request = store.getAll();
            
            request.onsuccess = () => resolve(request.result || []);
            request.onerror = () => reject(request.error);
        });
    }
    
    async add(storeName, item) {
        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction([storeName], 'readwrite');
            const store = transaction.objectStore(storeName);
            const request = store.add(item);
            
            request.onsuccess = () => resolve(request.result);
            request.onerror = () => reject(request.error);
        });
    }
    
    async update(storeName, item) {
        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction([storeName], 'readwrite');
            const store = transaction.objectStore(storeName);
            const request = store.put(item);
            
            request.onsuccess = () => resolve(request.result);
            request.onerror = () => reject(request.error);
        });
    }
    
    async delete(storeName, id) {
        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction([storeName], 'readwrite');
            const store = transaction.objectStore(storeName);
            const request = store.delete(id);
            
            request.onsuccess = () => resolve();
            request.onerror = () => reject(request.error);
        });
    }
    
    /**
     * Métodos específicos para categorías
     */
    async getAllCategories() {
        const categories = await this.getAll('categories');
        if (categories.length === 0) {
            // Crear categorías por defecto
            const defaultCategories = Category.getDefaultCategories();
            for (const category of defaultCategories) {
                await this.add('categories', category);
            }
            return defaultCategories;
        }
        return categories.map(c => new Category(c));
    }
    
    /**
     * Métodos específicos para transacciones
     */
    async getAllTransactions() {
        const transactions = await this.getAll('transactions');
        return transactions.map(t => new Transaction(t));
    }
    
    async saveTransaction(transaction) {
        if (transaction.id) {
            return await this.update('transactions', transaction);
        } else {
            return await this.add('transactions', transaction);
        }
    }
    
    async deleteTransaction(id) {
        return await this.delete('transactions', id);
    }
    
    /**
     * Métodos específicos para presupuestos
     */
    async getAllBudgets() {
        const budgets = await this.getAll('budgets');
        return budgets.map(b => new Budget(b));
    }
    
    /**
     * Métodos para datos de ejemplo
     */
    async createSampleData() {
        console.log('Creando datos de ejemplo...');
        
        // Verificar si ya hay datos
        const transactions = await this.getAllTransactions();
        
        if (transactions.length === 0) {
            // Crear transacciones de ejemplo
            const sampleTransactions = Transaction.getSampleTransactions();
            for (const transaction of sampleTransactions) {
                await this.saveTransaction(transaction);
            }
            
            // Crear presupuestos de ejemplo
            const sampleBudgets = Budget.getSampleBudgets();
            for (const budget of sampleBudgets) {
                await this.add('budgets', budget);
            }
            
            console.log('Datos de ejemplo creados correctamente');
        }
    }
}

// Exportar al ámbito global
if (typeof window !== 'undefined') {
    window.Database = Database;
}