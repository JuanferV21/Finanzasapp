# Dashboard de Finanzas Personales

Una aplicación web completa para gestionar finanzas personales con análisis visual y seguimiento de transacciones.

## 🚀 Características

- **Gestión de Transacciones**: Agregar ingresos y gastos con categorías
- **Dashboard Visual**: Gráficas circulares y de barras con Recharts
- **Resumen Financiero**: Balance neto, totales de ingresos y egresos
- **Filtros Avanzados**: Por categoría, tipo y fecha
- **Autenticación JWT**: Sistema de login seguro
- **Base de Datos Cloud**: MongoDB Atlas

## 🛠️ Stack Tecnológico

### Frontend
- React 18 + Vite
- Tailwind CSS
- Recharts (gráficas)
- Axios (HTTP client)
- React Router DOM

### Backend
- Node.js + Express
- MongoDB Atlas
- JWT (autenticación)
- bcryptjs (encriptación)
- cors (CORS)

## 📁 Estructura del Proyecto

```
finanzasdash/
├── frontend/          # Aplicación React
├── backend/           # API Node.js
├── README.md         # Este archivo
└── .gitignore        # Archivos a ignorar
```

## 🚀 Instalación y Configuración

### Prerrequisitos
- Node.js 18+ 
- MongoDB Atlas (cuenta gratuita)
- Git

### 1. Clonar y Configurar Backend

```bash
cd backend
npm install
```

Crear archivo `.env` basado en `.env.example`:
```bash
cp .env.example .env
```

Configurar variables en `.env`:
- `MONGODB_URI`: String de conexión de MongoDB Atlas
- `JWT_SECRET`: Clave secreta para JWT (puede ser cualquier string)

### 2. Configurar MongoDB Atlas

1. Crear cuenta en [MongoDB Atlas](https://www.mongodb.com/atlas)
2. Crear cluster gratuito
3. Obtener string de conexión
4. Reemplazar `<password>` con tu contraseña de usuario
5. Agregar IP 0.0.0.0/0 en Network Access (para desarrollo)

### 3. Clonar y Configurar Frontend

```bash
cd frontend
npm install
```

### 4. Ejecutar en Desarrollo

**Backend:**
```bash
cd backend
npm run dev
```
Servidor corriendo en: http://localhost:5000

**Frontend:**
```bash
cd frontend
npm run dev
```
Aplicación corriendo en: http://localhost:5173

## 📊 Funcionalidades

### Dashboard Principal
- Resumen de balance neto
- Gráfica circular de gastos por categoría
- Gráfica de barras de evolución mensual
- Estadísticas rápidas

### Gestión de Transacciones
- Agregar ingresos y gastos
- Categorías predefinidas
- Descripción y fecha
- Validación de datos

### Filtros y Búsqueda
- Filtrar por categoría
- Filtrar por tipo (ingreso/gasto)
- Filtrar por rango de fechas
- Búsqueda por descripción

## 🚀 Deploy

### Frontend (Vercel)
1. Conectar repositorio a Vercel
2. Configurar variables de entorno:
   - `VITE_API_URL`: URL del backend desplegado

### Backend (Render)
1. Conectar repositorio a Render
2. Configurar variables de entorno:
   - `MONGODB_URI`: String de conexión MongoDB
   - `JWT_SECRET`: Clave secreta JWT

## 📝 API Endpoints

### Autenticación
- `POST /api/auth/register` - Registrar usuario
- `POST /api/auth/login` - Iniciar sesión

### Transacciones
- `GET /api/transactions` - Obtener transacciones
- `POST /api/transactions` - Crear transacción
- `PUT /api/transactions/:id` - Actualizar transacción
- `DELETE /api/transactions/:id` - Eliminar transacción

### Estadísticas
- `GET /api/stats/summary` - Resumen financiero
- `GET /api/stats/categories` - Estadísticas por categoría
- `GET /api/stats/monthly` - Evolución mensual

## 🤝 Contribuir

1. Fork el proyecto
2. Crear rama feature (`git checkout -b feature/AmazingFeature`)
3. Commit cambios (`git commit -m 'Add AmazingFeature'`)
4. Push a la rama (`git push origin feature/AmazingFeature`)
5. Abrir Pull Request

## 📄 Licencia

Este proyecto está bajo la Licencia MIT - ver el archivo [LICENSE](LICENSE) para detalles. 

