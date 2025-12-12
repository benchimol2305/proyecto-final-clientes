

 /** Utilidades generales para FinanzApp */
 

class Utils {
    /** Formatear moneda */
    static formatCurrency(amount) {
        return new Intl.NumberFormat('es-VE', {
            style: 'currency',
            currency: 'USD',
            minimumFractionDigits: 2
        }).format(amount);
    }
    
    /**
     * Formatear fecha
     */
    static formatDate(dateString) {
        const date = new Date(dateString);
        return date.toLocaleDateString('es-ES', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric'
        });
    }
    
    /**
     * Generar ID único
     */
    static generateId() {
        return Date.now().toString(36) + Math.random().toString(36).substr(2);
    }
    
    /**
     * Validar formulario de transacción
     */
    static validateTransactionForm(formData) {
        const errors = [];
        
        if (!formData.type) {
            errors.push('El tipo de transacción es requerido');
        }
        
        if (!formData.amount || formData.amount <= 0) {
            errors.push('El monto debe ser mayor a 0');
        }
        
        if (!formData.date) {
            errors.push('La fecha es requerida');
        }
        
        if (!formData.category) {
            errors.push('La categoría es requerida');
        }
        
        return {
            isValid: errors.length === 0,
            errors: errors
        };
    }
}

// Exportar al ámbito global
if (typeof window !== 'undefined') {
    window.Utils = Utils;
}