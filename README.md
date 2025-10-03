# Dashboard de Finanzas Personales

Una aplicación web completa para gestionar finanzas personales con análisis visual y seguimiento de transacciones.

## 🚀 Características

- **Gestión de Transacciones**: Agregar ingresos y gastos con categorías
- **Dashboard Visual**: Gráficas circulares y de barras con Recharts
- **Resumen Financiero**: Balance neto, totales de ingresos y egresos
- **Filtros Avanzados**: Por categoría, tipo y fecha
- **Autenticación JWT**: Sistema de login seguro
- **Base de Datos**: MySQL con Sequelize ORM
- **Metas de Ahorro**: Crea y rastrea tus objetivos financieros
- **Presupuestos**: Controla gastos por categoría mensualmente
- **Exportación**: Genera reportes en CSV y PDF

## 🛠️ Stack Tecnológico

### Frontend
- React 18 + Vite
- Tailwind CSS
- Recharts (gráficas)
- Axios (HTTP client)
- React Router DOM

### Backend
- Node.js + Express
- MySQL + Sequelize ORM
- JWT (autenticación)
- bcryptjs (encriptación)
- cors, helmet (seguridad)
- Cloudinary (almacenamiento de archivos)
- Nodemailer (recuperación de contraseña)

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
- MySQL 8.0+ (o MariaDB 10.5+)
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
```env
DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASSWORD=tu_password
DB_NAME=finanzas_dashboard
JWT_SECRET=your-super-secret-jwt-key
```

### 2. Configurar MySQL

1. Instalar MySQL 8.0+ o MariaDB 10.5+
2. Crear base de datos:
```bash
mysql -u root -p
CREATE DATABASE finanzas_dashboard;
exit;
```
3. Las tablas se crearán automáticamente al iniciar el servidor (Sequelize sync)

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
Servidor corriendo en: http://localhost:5001

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

### Backend (Railway/Render)
1. Conectar repositorio a Railway o Render
2. Configurar variables de entorno:
   - `DB_HOST`: Host de la base de datos MySQL
   - `DB_PORT`: Puerto de MySQL (generalmente 3306)
   - `DB_USER`: Usuario de MySQL
   - `DB_PASSWORD`: Contraseña de MySQL
   - `DB_NAME`: Nombre de la base de datos
   - `JWT_SECRET`: Clave secreta JWT
   - `CLEANUP_LOCAL_UPLOADS`: `true` en producción para borrar archivos locales tras subirlos a Cloudinary
   - `CORS_ORIGIN`: Lista de orígenes permitidos (coma-separados). Ej: `https://app.example.com,https://admin.example.com`
   - `MAX_UPLOAD_MB`: Tamaño máximo por archivo (MB). Ej: `5`
   - `JSON_BODY_LIMIT`: Límite del body JSON (ej: `1mb`)
   - `MAX_IMAGE_WIDTH` / `MAX_IMAGE_HEIGHT`: Dimensiones máximas de imagen (px). Opcional
   - `MAX_IMAGE_PIXELS`: Máximo de megapíxeles permitidos (ancho*alto/1e6). Opcional

## 📝 API Endpoints

### Autenticación
- `POST /api/auth/register` - Registrar usuario
- `POST /api/auth/login` - Iniciar sesión

### Transacciones
- `GET /api/transactions` - Obtener transacciones
- `POST /api/transactions` - Crear transacción
- `POST /api/transactions/:id/attachments` - Subir adjuntos (solo imágenes JPG/PNG/WEBP/GIF o PDF). Se valida firma binaria y, si se configuraron límites, dimensiones máximas; los archivos inválidos son rechazados con detalle.
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

