const express = require('express');
const { body, validationResult } = require('express-validator');
const Budget = require('../models/Budget');
const { auth } = require('../middleware/auth');

const router = express.Router();

// Obtener presupuestos del usuario para un mes
router.get('/', auth, async (req, res) => {
  try {
    const { month } = req.query; // formato YYYY-MM
    if (!month) {
      return res.status(400).json({ message: 'El mes es requerido (YYYY-MM)' });
    }
    const budgets = await Budget.find({ user: req.user._id, month });
    res.json(budgets);
  } catch (error) {
    console.error('Error obteniendo presupuestos:', error);
    res.status(500).json({ message: 'Error interno del servidor' });
  }
});

// Crear o actualizar presupuesto
router.post('/', auth, [
  body('category').isString().notEmpty(),
  body('type').isIn(['income', 'expense']),
  body('amount').isFloat({ min: 0 }),
  body('month').matches(/^\d{4}-\d{2}$/)
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ message: 'Datos inválidos', errors: errors.array() });
    }
    const { category, type, amount, month } = req.body;
    // Upsert: si existe, actualiza; si no, crea
    const budget = await Budget.findOneAndUpdate(
      { user: req.user._id, category, month },
      { $set: { type, amount } },
      { new: true, upsert: true }
    );
    res.status(201).json(budget);
  } catch (error) {
    console.error('Error guardando presupuesto:', error);
    res.status(500).json({ message: 'Error interno del servidor' });
  }
});

// Eliminar presupuesto
router.delete('/:id', auth, async (req, res) => {
  try {
    const budget = await Budget.findOneAndDelete({ _id: req.params.id, user: req.user._id });
    if (!budget) {
      return res.status(404).json({ message: 'Presupuesto no encontrado' });
    }
    res.json({ message: 'Presupuesto eliminado' });
  } catch (error) {
    console.error('Error eliminando presupuesto:', error);
    res.status(500).json({ message: 'Error interno del servidor' });
  }
});

module.exports = router; 