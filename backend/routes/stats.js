const express = require('express');
const { query, validationResult } = require('express-validator');
const { Transaction } = require('../models');
const { auth } = require('../middleware/auth');
const { apiLimiter } = require('../middleware/rateLimiter');
const { Op } = require('sequelize');

const router = express.Router();

// Aplicar middleware de autenticación a todas las rutas
router.use(auth);
// Aplicar rate limiting general a estadísticas
router.use(apiLimiter);

// GET /api/stats/summary - Resumen financiero general
router.get('/summary', [
  query('startDate').optional().isISO8601(),
  query('endDate').optional().isISO8601()
], async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    
    // Construir filtros de fecha
    const whereClause = { userId: req.user.id };
    if (startDate || endDate) {
      whereClause.date = {};
      if (startDate) whereClause.date[Op.gte] = new Date(startDate);
      if (endDate) whereClause.date[Op.lte] = new Date(endDate);
    }

    // Obtener totales de ingresos
    const incomeStats = await Transaction.findAll({
      where: { ...whereClause, type: 'income' },
      attributes: [
        [Transaction.sequelize.fn('SUM', Transaction.sequelize.col('amount')), 'total'],
        [Transaction.sequelize.fn('COUNT', '*'), 'count']
      ],
      raw: true
    });

    // Obtener totales de gastos
    const expenseStats = await Transaction.findAll({
      where: { ...whereClause, type: 'expense' },
      attributes: [
        [Transaction.sequelize.fn('SUM', Transaction.sequelize.col('amount')), 'total'],
        [Transaction.sequelize.fn('COUNT', '*'), 'count']
      ],
      raw: true
    });

    const totalIncome = parseFloat(incomeStats[0]?.total || 0);
    const totalExpense = parseFloat(expenseStats[0]?.total || 0);
    const incomeCount = parseInt(incomeStats[0]?.count || 0);
    const expenseCount = parseInt(expenseStats[0]?.count || 0);
    const balance = totalIncome - totalExpense;

    // Obtener transacciones más recientes
    const recentTransactions = await Transaction.findAll({
      where: whereClause,
      order: [['date', 'DESC']],
      limit: 5,
      attributes: ['id', 'type', 'amount', 'category', 'description', 'date']
    });

    res.json({
      summary: {
        totalIncome,
        totalExpense,
        balance,
        incomeCount,
        expenseCount,
        totalTransactions: incomeCount + expenseCount
      },
      recentTransactions
    });

  } catch (error) {
    console.error('Error obteniendo resumen:', error);
    res.status(500).json({
      message: 'Error interno del servidor'
    });
  }
});

// GET /api/stats/categories - Estadísticas por categoría
router.get('/categories', [
  query('type').optional().isIn(['income', 'expense']),
  query('startDate').optional().isISO8601(),
  query('endDate').optional().isISO8601()
], async (req, res) => {
  try {
    const { type, startDate, endDate } = req.query;
    
    // Construir filtros
    const whereClause = { userId: req.user.id };
    if (type) whereClause.type = type;
    
    if (startDate || endDate) {
      whereClause.date = {};
      if (startDate) whereClause.date[Op.gte] = new Date(startDate);
      if (endDate) whereClause.date[Op.lte] = new Date(endDate);
    }

    // Obtener datos agrupados por tipo y categoría
    const categoryStats = await Transaction.findAll({
      where: whereClause,
      attributes: [
        'type', 
        'category',
        [Transaction.sequelize.fn('SUM', Transaction.sequelize.col('amount')), 'total'],
        [Transaction.sequelize.fn('COUNT', '*'), 'count']
      ],
      group: ['type', 'category'],
      order: [['type', 'ASC'], [Transaction.sequelize.literal('total'), 'DESC']],
      raw: true
    });

    // Formatear datos para gráficas
    const categories = Transaction.getCategories();
    const formattedData = {};

    // Agrupar por tipo
    const groupedByType = {};
    categoryStats.forEach(stat => {
      if (!groupedByType[stat.type]) {
        groupedByType[stat.type] = [];
      }
      groupedByType[stat.type].push({
        category: stat.category,
        total: parseFloat(stat.total),
        count: parseInt(stat.count)
      });
    });

    // Formatear para cada tipo
    Object.keys(groupedByType).forEach(type => {
      const typeData = groupedByType[type];
      const totalAmount = typeData.reduce((sum, cat) => sum + cat.total, 0);
      
      const categoryData = typeData.map(cat => {
        const categoryInfo = categories[type]?.find(c => c.value === cat.category);
        return {
          name: categoryInfo?.label || cat.category,
          value: cat.total,
          count: cat.count,
          percentage: totalAmount > 0 ? (cat.total / totalAmount * 100).toFixed(1) : 0
        };
      });

      formattedData[type] = {
        total: totalAmount,
        categories: categoryData.sort((a, b) => b.value - a.value)
      };
    });

    res.json(formattedData);

  } catch (error) {
    console.error('Error obteniendo estadísticas por categoría:', error);
    res.status(500).json({
      message: 'Error interno del servidor'
    });
  }
});

// GET /api/stats/monthly - Evolución mensual
router.get('/monthly', [
  query('startDate').optional().isISO8601(),
  query('endDate').optional().isISO8601(),
  query('year').optional().isInt({ min: 2020, max: 2030 }),
  query('months').optional().isInt({ min: 1, max: 24 })
], async (req, res) => {
  try {
    const { startDate, endDate, year, months = 12 } = req.query;
    
    let whereClause = { userId: req.user.id };
    
    // Si se proporcionan startDate/endDate, usarlos (para el selector de período)
    if (startDate || endDate) {
      whereClause.date = {};
      if (startDate) whereClause.date[Op.gte] = new Date(startDate);
      if (endDate) whereClause.date[Op.lte] = new Date(endDate);
    } else {
      // Modo legacy: usar year y months
      const currentYear = year || new Date().getFullYear();
      const endDate = new Date(currentYear, 11, 31);
      const startDate = new Date(endDate);
      startDate.setMonth(endDate.getMonth() - (parseInt(months) - 1));
      startDate.setDate(1);
      
      whereClause.date = {
        [Op.gte]: startDate,
        [Op.lte]: endDate
      };
    }

    // Obtener datos agrupados por mes, año y tipo
    const monthlyStats = await Transaction.findAll({
      where: whereClause,
      attributes: [
        [Transaction.sequelize.fn('YEAR', Transaction.sequelize.col('date')), 'year'],
        [Transaction.sequelize.fn('MONTH', Transaction.sequelize.col('date')), 'month'],
        'type',
        [Transaction.sequelize.fn('SUM', Transaction.sequelize.col('amount')), 'total']
      ],
      group: [
        Transaction.sequelize.fn('YEAR', Transaction.sequelize.col('date')),
        Transaction.sequelize.fn('MONTH', Transaction.sequelize.col('date')),
        'type'
      ],
      order: [
        [Transaction.sequelize.fn('YEAR', Transaction.sequelize.col('date')), 'ASC'],
        [Transaction.sequelize.fn('MONTH', Transaction.sequelize.col('date')), 'ASC']
      ],
      raw: true
    });

    // Agrupar los datos por mes/año
    const monthlyGrouped = {};
    monthlyStats.forEach(stat => {
      const key = `${stat.year}-${stat.month}`;
      if (!monthlyGrouped[key]) {
        monthlyGrouped[key] = { year: stat.year, month: stat.month, income: 0, expense: 0 };
      }
      monthlyGrouped[key][stat.type] = parseFloat(stat.total);
    });

    // Formatear datos para gráficas
    const monthNames = [
      'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
      'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
    ];

    const formattedData = Object.values(monthlyGrouped).map(stat => ({
      month: `${monthNames[stat.month - 1]} ${stat.year}`,
      income: stat.income,
      expense: stat.expense,
      balance: stat.income - stat.expense
    }));

    res.json({
      monthlyData: formattedData,
      summary: {
        totalIncome: formattedData.reduce((sum, item) => sum + item.income, 0),
        totalExpense: formattedData.reduce((sum, item) => sum + item.expense, 0),
        averageBalance: formattedData.length > 0 ? 
          formattedData.reduce((sum, item) => sum + item.balance, 0) / formattedData.length : 0
      }
    });

  } catch (error) {
    console.error('Error obteniendo evolución mensual:', error);
    res.status(500).json({
      message: 'Error interno del servidor'
    });
  }
});

// GET /api/stats/trends - Tendencias y análisis
router.get('/trends', async (req, res) => {
  try {
    // Obtener datos de los últimos 6 meses
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

    const monthlyStats = await Transaction.findAll({
      where: {
        userId: req.user.id,
        date: { [Op.gte]: sixMonthsAgo }
      },
      attributes: [
        [Transaction.sequelize.fn('YEAR', Transaction.sequelize.col('date')), 'year'],
        [Transaction.sequelize.fn('MONTH', Transaction.sequelize.col('date')), 'month'],
        'type',
        [Transaction.sequelize.fn('SUM', Transaction.sequelize.col('amount')), 'total']
      ],
      group: [
        Transaction.sequelize.fn('YEAR', Transaction.sequelize.col('date')),
        Transaction.sequelize.fn('MONTH', Transaction.sequelize.col('date')),
        'type'
      ],
      order: [
        [Transaction.sequelize.fn('YEAR', Transaction.sequelize.col('date')), 'ASC'],
        [Transaction.sequelize.fn('MONTH', Transaction.sequelize.col('date')), 'ASC']
      ],
      raw: true
    });

    // Agrupar los datos por mes/año
    const monthlyGrouped = {};
    monthlyStats.forEach(stat => {
      const key = `${stat.year}-${stat.month}`;
      if (!monthlyGrouped[key]) {
        monthlyGrouped[key] = { _id: { year: stat.year, month: stat.month }, income: 0, expense: 0 };
      }
      monthlyGrouped[key][stat.type] = parseFloat(stat.total);
    });

    const trends = Object.values(monthlyGrouped);

    // Calcular tendencias
    if (trends.length >= 2) {
      const current = trends[trends.length - 1];
      const previous = trends[trends.length - 2];

      const incomeTrend = previous.income > 0
        ? ((current.income - previous.income) / previous.income * 100).toFixed(1)
        : 0;

      const expenseTrend = previous.expense > 0
        ? ((current.expense - previous.expense) / previous.expense * 100).toFixed(1)
        : 0;

      res.json({
        trends: {
          incomeTrend: parseFloat(incomeTrend),
          expenseTrend: parseFloat(expenseTrend),
          isIncomeIncreasing: parseFloat(incomeTrend) > 0,
          isExpenseIncreasing: parseFloat(expenseTrend) > 0
        },
        monthlyData: trends
      });
    } else {
      res.json({
        trends: {
          incomeTrend: 0,
          expenseTrend: 0,
          isIncomeIncreasing: false,
          isExpenseIncreasing: false
        },
        monthlyData: trends
      });
    }

  } catch (error) {
    console.error('Error obteniendo tendencias:', error);
    res.status(500).json({
      message: 'Error interno del servidor'
    });
  }
});

// GET /api/stats/export - Exportar reportes a CSV
router.get('/export', [
  query('startDate').optional().isISO8601(),
  query('endDate').optional().isISO8601(),
  query('type').optional().isIn(['summary', 'category-breakdown', 'monthly-trends'])
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        message: 'Parámetros de consulta inválidos',
        errors: errors.array()
      });
    }

    const { startDate, endDate, type = 'summary' } = req.query;
    const whereClause = { userId: req.user.id };

    if (startDate || endDate) {
      whereClause.date = {};
      if (startDate) whereClause.date[Op.gte] = new Date(startDate);
      if (endDate) whereClause.date[Op.lte] = new Date(endDate);
    }

    let csvContent = '';

    if (type === 'summary') {
      // Resumen general
      const summary = await Transaction.findAll({
        where: whereClause,
        attributes: [
          'type',
          [Transaction.sequelize.fn('SUM', Transaction.sequelize.col('amount')), 'total'],
          [Transaction.sequelize.fn('COUNT', '*'), 'count']
        ],
        group: ['type'],
        raw: true
      });

      const income = summary.find(s => s.type === 'income')?.total || 0;
      const expenses = summary.find(s => s.type === 'expense')?.total || 0;
      const balance = income - expenses;

      csvContent = [
        ['Métrica', 'Valor'],
        ['Ingresos Totales', parseFloat(income).toFixed(2)],
        ['Gastos Totales', parseFloat(expenses).toFixed(2)],
        ['Balance', balance.toFixed(2)],
        ['Total Transacciones', summary.reduce((acc, s) => acc + parseInt(s.count), 0)],
        ['Período', `${startDate || 'Inicio'} - ${endDate || 'Hoy'}`]
      ]
        .map(row => row.map(field => `"${field}"`).join(','))
        .join('\n');

    } else if (type === 'category-breakdown') {
      // Desglose por categorías
      const categoryBreakdown = await Transaction.findAll({
        where: whereClause,
        attributes: [
          'type',
          'category',
          [Transaction.sequelize.fn('SUM', Transaction.sequelize.col('amount')), 'total'],
          [Transaction.sequelize.fn('COUNT', '*'), 'count']
        ],
        group: ['type', 'category'],
        order: [['type', 'ASC'], [Transaction.sequelize.literal('total'), 'DESC']],
        raw: true
      });

      const csvHeaders = ['Tipo', 'Categoría', 'Total', 'Cantidad'];
      const csvRows = categoryBreakdown.map(item => [
        item.type === 'income' ? 'Ingreso' : 'Gasto',
        item.category,
        parseFloat(item.total).toFixed(2),
        item.count
      ]);

      csvContent = [csvHeaders, ...csvRows]
        .map(row => row.map(field => `"${field}"`).join(','))
        .join('\n');

    } else if (type === 'monthly-trends') {
      // Tendencias mensuales
      const monthlyTrends = await Transaction.findAll({
        where: whereClause,
        attributes: [
          [Transaction.sequelize.fn('YEAR', Transaction.sequelize.col('date')), 'year'],
          [Transaction.sequelize.fn('MONTH', Transaction.sequelize.col('date')), 'month'],
          'type',
          [Transaction.sequelize.fn('SUM', Transaction.sequelize.col('amount')), 'total']
        ],
        group: [
          Transaction.sequelize.fn('YEAR', Transaction.sequelize.col('date')),
          Transaction.sequelize.fn('MONTH', Transaction.sequelize.col('date')),
          'type'
        ],
        order: [
          [Transaction.sequelize.fn('YEAR', Transaction.sequelize.col('date')), 'ASC'],
          [Transaction.sequelize.fn('MONTH', Transaction.sequelize.col('date')), 'ASC']
        ],
        raw: true
      });

      const csvHeaders = ['Año', 'Mes', 'Tipo', 'Total'];
      const csvRows = monthlyTrends.map(item => [
        item.year,
        item.month,
        item.type === 'income' ? 'Ingreso' : 'Gasto',
        parseFloat(item.total).toFixed(2)
      ]);

      csvContent = [csvHeaders, ...csvRows]
        .map(row => row.map(field => `"${field}"`).join(','))
        .join('\n');
    }

    // Configurar headers para descarga
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename="reporte_${type}_${new Date().toISOString().split('T')[0]}.csv"`);

    res.send(csvContent);

  } catch (error) {
    console.error('Error exportando reportes:', error);
    res.status(500).json({
      message: 'Error interno del servidor'
    });
  }
});

module.exports = router; 
