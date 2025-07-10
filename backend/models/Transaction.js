const mongoose = require('mongoose');

const transactionSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'El usuario es requerido']
  },
  type: {
    type: String,
    enum: ['income', 'expense'],
    required: [true, 'El tipo de transacción es requerido']
  },
  amount: {
    type: Number,
    required: [true, 'El monto es requerido'],
    min: [0.01, 'El monto debe ser mayor a 0']
  },
  category: {
    type: String,
    required: [true, 'La categoría es requerida'],
    enum: [
      // Ingresos
      'salary', 'freelance', 'investment', 'business', 'other_income',
      // Gastos
      'food', 'transport', 'entertainment', 'shopping', 'health', 
      'education', 'housing', 'utilities', 'insurance', 'other_expense'
    ]
  },
  description: {
    type: String,
    required: [true, 'La descripción es requerida'],
    trim: true,
    maxlength: [200, 'La descripción no puede tener más de 200 caracteres']
  },
  date: {
    type: Date,
    required: [true, 'La fecha es requerida'],
    default: Date.now
  },
  tags: [{
    type: String,
    trim: true,
    maxlength: 20
  }],
  isRecurring: {
    type: Boolean,
    default: false
  },
  recurringPeriod: {
    type: String,
    enum: ['weekly', 'monthly', 'yearly', null],
    default: null
  },
  attachments: [{
    filename: {
      type: String,
      required: true
    },
    originalName: {
      type: String,
      required: true
    },
    mimeType: {
      type: String,
      required: true
    },
    size: {
      type: Number,
      required: true
    },
    path: {
      type: String,
      required: true
    },
    uploadedAt: {
      type: Date,
      default: Date.now
    }
  }]
}, {
  timestamps: true
});

// Índices para mejorar performance de consultas
transactionSchema.index({ user: 1, date: -1 });
transactionSchema.index({ user: 1, type: 1 });
transactionSchema.index({ user: 1, category: 1 });
transactionSchema.index({ user: 1, date: 1, type: 1 });

// Método virtual para obtener el monto con signo
transactionSchema.virtual('signedAmount').get(function() {
  return this.type === 'expense' ? -this.amount : this.amount;
});

// Configurar virtuals para que se incluyan en JSON
transactionSchema.set('toJSON', { virtuals: true });
transactionSchema.set('toObject', { virtuals: true });

// Método estático para obtener categorías disponibles
transactionSchema.statics.getCategories = function() {
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
transactionSchema.methods.getCategoryLabel = function() {
  const categories = this.constructor.getCategories();
  const allCategories = [
    ...(categoryStats.income?.categories || []),
    ...(categoryStats.expense?.categories || [])
  ];
  const category = allCategories.find(cat => cat.value === this.category);
  return category ? category.label : this.category;
};

module.exports = mongoose.model('Transaction', transactionSchema); 