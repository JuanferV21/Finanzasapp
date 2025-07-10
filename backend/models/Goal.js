const mongoose = require('mongoose');

const goalSchema = new mongoose.Schema({
  nombre: { type: String, required: true },
  montoObjetivo: { type: Number, required: true },
  montoAhorrado: { type: Number, required: true, default: 0 },
  fechaLimite: { type: Date },
  notas: { type: String },
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
}, {
  timestamps: true
});

module.exports = mongoose.model('Goal', goalSchema); 