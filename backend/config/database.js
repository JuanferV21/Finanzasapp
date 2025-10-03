const { Sequelize } = require('sequelize');
require('dotenv').config();

// Soporte para DATABASE_URL (PlanetScale/Render) o variables individuales (local)
let sequelize;

if (process.env.DATABASE_URL) {
  // Producción: usar DATABASE_URL (PlanetScale)
  sequelize = new Sequelize(process.env.DATABASE_URL, {
    dialect: 'mysql',
    dialectOptions: {
      ssl: {
        rejectUnauthorized: true
      }
    },
    logging: false,
    define: {
      timestamps: true,
      underscored: true,
    },
    pool: {
      max: 5,
      min: 0,
      acquire: 30000,
      idle: 10000
    }
  });
} else {
  // Desarrollo: usar variables individuales
  sequelize = new Sequelize(
    process.env.DB_NAME || 'finanzas_dashboard',
    process.env.DB_USER || 'root',
    process.env.DB_PASSWORD || '',
    {
      host: process.env.DB_HOST || 'localhost',
      port: process.env.DB_PORT || 3306,
      dialect: 'mysql',
      logging: process.env.NODE_ENV === 'development' ? console.log : false,
      define: {
        timestamps: true,
        underscored: true,
      },
      pool: {
        max: 5,
        min: 0,
        acquire: 30000,
        idle: 10000
      }
    }
  );
}

module.exports = sequelize;