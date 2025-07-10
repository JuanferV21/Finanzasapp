# 🚀 Guía de Configuración - Dashboard de Finanzas Personales

## 📋 Prerrequisitos

- **Node.js 18+** - [Descargar aquí](https://nodejs.org/)
- **Git** - [Descargar aquí](https://git-scm.com/)
- **Cuenta de MongoDB Atlas** - [Registrarse aquí](https://www.mongodb.com/atlas)

## 🗄️ Configuración de MongoDB Atlas

### 1. Crear cuenta y cluster
1. Ve a [MongoDB Atlas](https://www.mongodb.com/atlas)
2. Crea una cuenta gratuita
3. Crea un nuevo cluster (gratuito)
4. Selecciona tu región preferida

### 2. Configurar acceso a la base de datos
1. En el menú lateral, ve a **Database Access**
2. Crea un nuevo usuario de base de datos:
   - Username: `finanzas_user`
   - Password: `tu_contraseña_segura`
   - Role: `Read and write to any database`

### 3. Configurar acceso de red
1. En el menú lateral, ve a **Network Access**
2. Haz clic en **Add IP Address**
3. Para desarrollo: `0.0.0.0/0` (permite acceso desde cualquier IP)
4. Para producción: agrega solo las IPs específicas

### 4. Obtener string de conexión
1. Ve a **Database** en el menú lateral
2. Haz clic en **Connect**
3. Selecciona **Connect your application**
4. Copia el string de conexión

## 🔧 Configuración del Backend

### 1. Instalar dependencias
```bash
cd backend
npm install
```

### 2. Configurar variables de entorno
```bash
# Copiar archivo de ejemplo
cp env.example .env

# Editar .env con tus datos
```

**Contenido del archivo `.env`:**
```env
# MongoDB Atlas Connection String
# Reemplaza <username>, <password>, <cluster> con tus datos
MONGODB_URI=mongodb+srv://finanzas_user:juan12@cluster0.uzw4y1e.mongodb.net/finanzas-dashboard?retryWrites=true&w=majority&appName=Cluster0

# JWT Secret Key (puede ser cualquier string seguro)
JWT_SECRET=tu_jwt_secret_super_seguro_aqui_2024

# Server Configuration
PORT=5000
NODE_ENV=development

# CORS Configuration
CORS_ORIGIN=http://localhost:5173
```

### 3. Ejecutar el backend
```bash
npm run dev
```

El servidor estará disponible en: `http://localhost:5000`

## 🎨 Configuración del Frontend

### 1. Instalar dependencias
```bash
cd frontend
npm install
```

### 2. Configurar variables de entorno (opcional)
```bash
# Crear archivo .env si necesitas cambiar la URL del API
echo "VITE_API_URL=http://localhost:5000/api" > .env
```

### 3. Ejecutar el frontend
```bash
npm run dev
```

La aplicación estará disponible en: `http://localhost:5173`

## 🧪 Probar la aplicación

### 1. Verificar que ambos servidores estén corriendo
- Backend: `http://localhost:5000/api/health`
- Frontend: `http://localhost:5173`

### 2. Crear una cuenta
1. Ve a `http://localhost:5173/register`
2. Completa el formulario de registro
3. Inicia sesión

### 3. Agregar transacciones
1. En el dashboard, haz clic en "Nueva transacción"
2. Completa los datos
3. Verifica que aparezca en las gráficas

## 📊 Estructura de la base de datos

### Colección: users
```json
{
  "_id": "ObjectId",
  "name": "Juan Pérez",
  "email": "juan@example.com",
  "password": "hash_encriptado",
  "createdAt": "2024-01-01T00:00:00.000Z",
  "lastLogin": "2024-01-01T00:00:00.000Z"
}
```

### Colección: transactions
```json
{
  "_id": "ObjectId",
  "user": "ObjectId(user)",
  "type": "income|expense",
  "amount": 100.50,
  "category": "salary|food|transport|...",
  "description": "Descripción de la transacción",
  "date": "2024-01-01T00:00:00.000Z",
  "tags": ["tag1", "tag2"],
  "isRecurring": false,
  "recurringPeriod": null
}
```

## 🚀 Deploy en Producción

### Frontend (Vercel)
1. Conecta tu repositorio a Vercel
2. Configura variables de entorno:
   - `VITE_API_URL`: URL de tu backend desplegado

### Backend (Render)
1. Conecta tu repositorio a Render
2. Configura variables de entorno:
   - `MONGODB_URI`: String de conexión MongoDB
   - `JWT_SECRET`: Clave secreta JWT
   - `NODE_ENV`: production
   - `CORS_ORIGIN`: URL de tu frontend desplegado

## 🔍 Solución de problemas

### Error de conexión a MongoDB
- Verifica que el string de conexión sea correcto
- Asegúrate de que la IP esté en la lista blanca de MongoDB Atlas
- Verifica que el usuario tenga permisos correctos

### Error de CORS
- Verifica que `CORS_ORIGIN` en el backend coincida con la URL del frontend
- En desarrollo: `http://localhost:5173`
- En producción: URL de tu dominio

### Error de autenticación
- Verifica que `JWT_SECRET` esté configurado
- Asegúrate de que el token no haya expirado

### Gráficas no se muestran
- Verifica que Recharts esté instalado correctamente
- Asegúrate de que haya datos en la base de datos
- Revisa la consola del navegador para errores

## 📝 Comandos útiles

### Backend
```bash
# Desarrollo
npm run dev

# Producción
npm start

# Ver logs
npm run dev | cat
```

### Frontend
```bash
# Desarrollo
npm run dev

# Build para producción
npm run build

# Preview del build
npm run preview
```

### Base de datos
```bash
# Conectar a MongoDB Atlas (opcional)
mongosh "tu_string_de_conexion"
```

## 🎯 Próximos pasos

1. **Personalizar categorías**: Modifica `backend/models/Transaction.js`
2. **Agregar más gráficas**: Usa Recharts en `frontend/src/pages/Dashboard.jsx`
3. **Implementar exportación**: Agrega funcionalidad para exportar datos
4. **Notificaciones**: Implementa alertas para gastos altos
5. **Presupuestos**: Agrega sistema de presupuestos por categoría

## 📞 Soporte

Si tienes problemas:
1. Revisa los logs del servidor
2. Verifica la consola del navegador
3. Asegúrate de que todas las dependencias estén instaladas
4. Verifica que las variables de entorno estén correctas

¡Disfruta tu Dashboard de Finanzas Personales! 💰 