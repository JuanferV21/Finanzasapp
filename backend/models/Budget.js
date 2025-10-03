const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Budget = sequelize.define('Budget', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  userId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'users',
      key: 'id'
    }
  },
  category: {
    type: DataTypes.STRING,
    allowNull: false
  },
  type: {
    type: DataTypes.ENUM('income', 'expense'),
    allowNull: false
  },
  amount: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false,
    validate: {
      min: 0
    }
  },
  month: {
    type: DataTypes.STRING(7), // formato YYYY-MM
    allowNull: false
  }
}, {
  tableName: 'budgets',
  timestamps: true,
  indexes: [
    {
      unique: true,
      fields: ['user_id', 'category', 'month']
    }
  ]
});

module.exports = Budget; 