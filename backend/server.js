const express = require('express');
const { sequelize } = require('./models');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const { apiLimiter } = require('./middleware/rateLimiter');
require('dotenv').config();

const authRoutes = require('./routes/auth');
const transactionRoutes = require('./routes/transactions');
const statsRoutes = require('./routes/stats');
const budgetRoutes = require('./routes/budgets');
const goalRoutes = require('./routes/goals');
const contributionRoutes = require('./routes/contributions');
const migrateRoutes = require('./routes/migrate');
const categorizationRoutes = require('./routes/categorization');
const reportRoutes = require('./routes/reports');

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
// Helmet con opciones; reforzar HSTS en producción
app.use(helmet());
if (process.env.NODE_ENV === 'production') {
  // Si estás detrás de proxy (Render/Heroku), habilita trust proxy para HSTS
  app.set('trust proxy', 1);
  app.use(helmet.hsts({ maxAge: 15552000 })); // 180 días
  // CSP básica para endurecer contexto del API (afecta principalmente respuestas HTML)
  app.use(helmet.contentSecurityPolicy({
    useDefaults: true,
    directives: {
      defaultSrc: ["'none'"],
      baseUri: ["'none'"],
      frameAncestors: ["'none'"],
    }
  }));
}
app.use(morgan('combined'));
// CORS con soporte multi-origen (CSV en CORS_ORIGIN)
const allowedOrigins = (process.env.CORS_ORIGIN || 'http://localhost:5173')
  .split(',')
  .map(o => o.trim())
  .filter(Boolean);

app.use(cors({
  origin: (origin, callback) => {
    // Permitir herramientas sin origen (curl/postman) o si está en lista
    if (!origin || allowedOrigins.includes(origin)) return callback(null, true);
    return callback(new Error('CORS origin not allowed'));
  },
  credentials: true
}));

// Rate limiting global para todas las APIs
app.use('/api', apiLimiter);

// Límite de tamaño de body configurable
const jsonBodyLimit = process.env.JSON_BODY_LIMIT || '1mb';
app.use(express.json({ limit: jsonBodyLimit }));
app.use(express.urlencoded({ extended: true, limit: jsonBodyLimit }));

// Test database connection
sequelize.authenticate()
  .then(() => {
    console.log('✅ Conectado a MySQL');
    // Sync database tables (use force: false in production)
    return sequelize.sync({ force: false });
  })
  .then(() => {
    console.log('✅ Tablas sincronizadas');
  })
  .catch((error) => {
    console.error('❌ Error conectando a MySQL:', error.message);
    process.exit(1);
  });

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/transactions', transactionRoutes);
app.use('/api/stats', statsRoutes);
app.use('/api/budgets', budgetRoutes);
app.use('/api/goals', goalRoutes);
app.use('/api/contributions', contributionRoutes);
app.use('/api/migrate', migrateRoutes);
app.use('/api/categorization', categorizationRoutes);
app.use('/api/reports', reportRoutes);

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    message: 'Dashboard de Finanzas API funcionando correctamente',
    timestamp: new Date().toISOString()
  });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ 
    message: 'Error interno del servidor',
    error: process.env.NODE_ENV === 'development' ? err.message : {}
  });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({ message: 'Endpoint no encontrado' });
});

app.listen(PORT, () => {
  console.log(`🚀 Servidor corriendo en puerto ${PORT}`);
  console.log(`📊 Dashboard API: http://localhost:${PORT}/api`);
  console.log(`🏥 Health Check: http://localhost:${PORT}/api/health`);
}); 
