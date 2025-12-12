
# FinanzApp - Sistema de Finanzas Personales Web

## Descripción del Proyecto

**FinanzApp** es una aplicación web completa para el seguimiento y control de finanzas personales mensuales

La aplicación permite a los usuarios gestionar categorías, registrar transacciones, establecer presupuestos y visualizar información financiera a través de un dashboard interactivo con gráficos, todo almacenado localmente en el navegador.

### Objetivos Principales

- ✅ Desarrollo de una aplicación web completa
- ✅ Implementación de persistencia local con IndexedDB
- ✅ Gestión de transacciones (ingresos/egresos)
- ✅ Sistema de presupuestos por categoría
- ✅ Dashboard interactivo con gráficos
- ✅ Interfaz de usuario intuitiva y atractiva

## Características

### Dashboard Principal
- Resumen financiero del mes actual
- Tarjetas informativas de ingresos, gastos y balance
- Gráficos interactivos con Chart.js
- Vista de transacciones recientes

### Gestión de Transacciones
- Registro de ingresos y egresos
- Asignación a categorías personalizadas
- Búsqueda y filtrado avanzado
- Edición y eliminación de transacciones

### Gestión de Categorías
- Categorías predefinidas y personalizadas
- Sistema de colores y iconos
- Eliminación con confirmación
- Categorías predefinidas incluidas:
  - Alimentación
  - Transporte
  - Ocio
  - Servicios
  - Salud
  - Educación
  - Otros

### Sistema de Presupuestos
- Establecimiento de presupuestos mensuales por categoría
- Comparación automática vs gastos reales
- Alertas visuales cuando se supera el presupuesto
- Proyección de egresos totales

## Tecnologías Utilizadas
- HTML
- CSS
- JavaScript 
- Chart.js

### Persistencia de Datos
- IndexedDB para almacenamiento local

### Desarrollo y Despliegue
- Git para control de versiones
- GitHub para repositorio
- Vercel para despliegue


## Instalación y Uso Local

### Prerrequisitos
- Navegador web moderno (Chrome 58+, Firefox 54+, Safari 10.1+)
- Editor de código (VS Code recomendado)
- Git instalado

### Pasos de Instalación

1. Clonar el repositorio:
```bash
git clone [url-del-repositorio]
cd finanzapp
```

2. Abrir el proyecto:
- Abrir `index.html` en tu navegador
- O usar un servidor local (Live Server de VS Code)

3. Para desarrollo:
- No se requiere instalación adicional
- La aplicación funciona completamente en el cliente

## Funcionalidades Técnicas

### Persistencia con IndexedDB
- Almacenamiento local en el navegador
- Sin necesidad de backend
- Datos persistentes entre sesiones
- Estructura de datos optimizada

### Estructura de Código
- Arquitectura orientada a pseudocomponentes
- Código modular y mantenible
- Separación de responsabilidades
- Patrón MVC (Modelo-Vista-Controlador)

### Interfaz de Usuario
- Diseño responsivo (mobile-first)
- Navegación intuitiva
- Formularios validados
- Feedback visual inmediato
- Modo oscuro compatible

## Guía de Uso

### Primeros Pasos
1. Al abrir la aplicación, verás el dashboard principal
2. Comienza agregando categorías desde la sección "Categorías"
3. Registra tus primeras transacciones en "Transacciones"
4. Establece presupuestos mensuales en "Presupuestos"

### Registro de Transacciones
1. Haz clic en "Nueva Transacción"
2. Selecciona tipo (Ingreso/Egreso)
3. Ingresa monto y fecha
4. Asigna una categoría
5. Agrega descripción opcional

### Gestión de Presupuestos
1. Navega a "Presupuestos"
2. Selecciona mes y año
3. Asigna montos por categoría
4. Monitorea el progreso en el dashboard

## Metodología de Trabajo

### Trabajo en Parejas
- Desarrollo colaborativo en GitHub
- Commits distribuidos entre ambos miembros
- Code review mutuo
- Resolución de conflictos colaborativa

### Control de Versiones
- Uso de ramas feature
- Commits descriptivos
- Pull requests para integración
- Issues para seguimiento de tareas


### En Vercel
1. Conecta repositorio GitHub a Vercel
2. Configurar proyecto como sitio estático
3. Desplegar automáticamente con cada push

### En GitHub Pages
1. Ir a configuración del repositorio
2. Habilitar GitHub Pages
3. Seleccionar rama main como fuente

### Desarrolladores
- Cesar Benchimol
- Miguel Castillos

