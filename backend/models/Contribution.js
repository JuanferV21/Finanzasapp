const mongoose = require('mongoose');

const contributionSchema = new mongoose.Schema({
  goal: { type: mongoose.Schema.Types.ObjectId, ref: 'Goal', required: true },
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  monto: { type: Number, required: true },
  fecha: { type: Date, default: Date.now },
  nota: { type: String }
}, { timestamps: true });

module.exports = mongoose.model('Contribution', contributionSchema); 