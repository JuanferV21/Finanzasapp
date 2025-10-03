const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Transaction = sequelize.define('Transaction', {
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
    },
    validate: {
      notEmpty: {
        msg: 'El usuario es requerido'
      }
    }
  },
  type: {
    type: DataTypes.ENUM('income', 'expense'),
    allowNull: false,
    validate: {
      notEmpty: {
        msg: 'El tipo de transacción es requerido'
      }
    }
  },
  amount: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false,
    validate: {
      min: {
        args: [0.01],
        msg: 'El monto debe ser mayor a 0'
      },
      notEmpty: {
        msg: 'El monto es requerido'
      }
    }
  },
  category: {
    type: DataTypes.ENUM(
      'salary', 'freelance', 'investment', 'business', 'other_income',
      'food', 'transport', 'entertainment', 'shopping', 'health', 
      'education', 'housing', 'utilities', 'insurance', 'other_expense'
    ),
    allowNull: false,
    validate: {
      notEmpty: {
        msg: 'La categoría es requerida'
      }
    }
  },
  description: {
    type: DataTypes.STRING(200),
    allowNull: false,
    validate: {
      notEmpty: {
        msg: 'La descripción es requerida'
      },
      len: {
        args: [1, 200],
        msg: 'La descripción no puede tener más de 200 caracteres'
      }
    },
    set(value) {
      this.setDataValue('description', value.trim());
    }
  },
  date: {
    type: DataTypes.DATE,
    allowNull: false,
    defaultValue: DataTypes.NOW,
    validate: {
      notEmpty: {
        msg: 'La fecha es requerida'
      }
    }
  },
  tags: {
    type: DataTypes.JSON,
    defaultValue: []
  },
  isRecurring: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  },
  recurringPeriod: {
    type: DataTypes.ENUM('weekly', 'monthly', 'yearly'),
    allowNull: true
  },
  attachments: {
    type: DataTypes.JSON,
    defaultValue: []
  }
}, {
  tableName: 'transactions',
  timestamps: true,
  indexes: [
    {
      fields: ['user_id', 'date'],
      name: 'idx_user_date'
    },
    {
      fields: ['user_id', 'type'],
      name: 'idx_user_type'
    },
    {
      fields: ['user_id', 'category'],
      name: 'idx_user_category'
    },
    {
      fields: ['user_id', 'date', 'type'],
      name: 'idx_user_date_type'
    }
  ]
});

// Método virtual para obtener el monto con signo
Transaction.prototype.getSignedAmount = function() {
  return this.type === 'expense' ? -parseFloat(this.amount) : parseFloat(this.amount);
};

// Método estático para obtener categorías disponibles
Transaction.getCategories = function() {
  return {
    income: [
      { value: 'salary', label: 'Salario' },
      { value: 'freelance', label: 'Freelance' },
      { value: 'investment', label: 'Inversiones' },
      { value: 'business', label: 'Negocio' },
      { value: 'other_income', label: 'Otros Ingresos' }
    ],
    expense: [
      { value: 'food', label: 'Alimentación' },
      { value: 'transport', label: 'Transporte' },
      { value: 'entertainment', label: 'Entretenimiento' },
      { value: 'shopping', label: 'Compras' },
      { value: 'health', label: 'Salud' },
      { value: 'education', label: 'Educación' },
      { value: 'housing', label: 'Vivienda' },
      { value: 'utilities', label: 'Servicios' },
      { value: 'insurance', label: 'Seguros' },
      { value: 'other_expense', label: 'Otros Gastos' }
    ]
  };
};

// Método para obtener el label de una categoría
Transaction.prototype.getCategoryLabel = function() {
  const categories = Transaction.getCategories();
  const allCategories = [
    ...(categories.income || []),
    ...(categories.expense || [])
  ];
  const category = allCategories.find(cat => cat.value === this.category);
  return category ? category.label : this.category;
};

module.exports = Transaction; 