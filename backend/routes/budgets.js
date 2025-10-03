const express = require('express');
const { body, validationResult } = require('express-validator');
const { Budget } = require('../models');
const { auth } = require('../middleware/auth');
const { Op } = require('sequelize');

const router = express.Router();

// Obtener presupuestos del usuario para un mes (o todos si no se especifica)
router.get('/', auth, async (req, res) => {
  try {
    const { month } = req.query; // formato YYYY-MM (opcional)
    const where = { userId: req.user.id };
    if (month) {
      where.month = month;
    }
    const budgets = await Budget.findAll({
      where,
      order: [['month', 'DESC'], ['category', 'ASC']]
    });
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
    const [budget, created] = await Budget.findOrCreate({
      where: { userId: req.user.id, category, month },
      defaults: { type, amount }
    });

    if (!created) {
      // Si ya existía, actualizarlo
      budget.type = type;
      budget.amount = amount;
      await budget.save();
    }

    res.status(201).json(budget);
  } catch (error) {
    console.error('Error guardando presupuesto:', error);
    res.status(500).json({ message: 'Error interno del servidor' });
  }
});

// Actualizar presupuesto
router.put('/:id', auth, [
  body('amount').optional().isFloat({ min: 0 }),
  body('category').optional().isString().notEmpty(),
  body('type').optional().isIn(['income', 'expense']),
  body('month').optional().matches(/^\d{4}-\d{2}$/)
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ message: 'Datos inválidos', errors: errors.array() });
    }

    const budget = await Budget.findOne({
      where: { id: req.params.id, userId: req.user.id }
    });

    if (!budget) {
      return res.status(404).json({ message: 'Presupuesto no encontrado' });
    }

    // Actualizar solo los campos proporcionados
    const { amount, category, type, month } = req.body;
    if (amount !== undefined) budget.amount = amount;
    if (category !== undefined) budget.category = category;
    if (type !== undefined) budget.type = type;
    if (month !== undefined) budget.month = month;

    await budget.save();
    res.json(budget);
  } catch (error) {
    console.error('Error actualizando presupuesto:', error);
    res.status(500).json({ message: 'Error interno del servidor' });
  }
});

// Eliminar presupuesto
router.delete('/:id', auth, async (req, res) => {
  try {
    const budget = await Budget.findOne({
      where: { id: req.params.id, userId: req.user.id }
    });

    if (!budget) {
      return res.status(404).json({ message: 'Presupuesto no encontrado' });
    }

    await budget.destroy();
    res.json({ message: 'Presupuesto eliminado' });
  } catch (error) {
    console.error('Error eliminando presupuesto:', error);
    res.status(500).json({ message: 'Error interno del servidor' });
  }
});

module.exports = router; 