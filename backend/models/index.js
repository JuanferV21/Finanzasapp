const sequelize = require('../config/database');
const User = require('./User');
const Transaction = require('./Transaction');
const Goal = require('./Goal');
const Contribution = require('./Contribution');
const Budget = require('./Budget');

// Definir relaciones
User.hasMany(Transaction, { foreignKey: 'userId', as: 'transactions' });
Transaction.belongsTo(User, { foreignKey: 'userId', as: 'user' });

User.hasMany(Goal, { foreignKey: 'userId', as: 'goals' });
Goal.belongsTo(User, { foreignKey: 'userId', as: 'user' });

User.hasMany(Contribution, { foreignKey: 'userId', as: 'contributions' });
Contribution.belongsTo(User, { foreignKey: 'userId', as: 'user' });

Goal.hasMany(Contribution, { foreignKey: 'goalId', as: 'contributions' });
Contribution.belongsTo(Goal, { foreignKey: 'goalId', as: 'goal' });

User.hasMany(Budget, { foreignKey: 'userId', as: 'budgets' });
Budget.belongsTo(User, { foreignKey: 'userId', as: 'user' });

module.exports = {
  sequelize,
  User,
  Transaction,
  Goal,
  Contribution,
  Budget
};