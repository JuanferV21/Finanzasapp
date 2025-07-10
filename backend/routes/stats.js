const express = require('express');
const { query, validationResult } = require('express-validator');
const Transaction = require('../models/Transaction');
const { auth } = require('../middleware/auth');

const router = express.Router();

// Aplicar middleware de autenticación a todas las rutas
router.use(auth);

// GET /api/stats/summary - Resumen financiero general
router.get('/summary', [
  query('startDate').optional().isISO8601(),
  query('endDate').optional().isISO8601()
], async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    
    // Construir filtros de fecha
    const dateFilter = {};
    if (startDate || endDate) {
      if (startDate) dateFilter.$gte = new Date(startDate);
      if (endDate) dateFilter.$lte = new Date(endDate);
    }

    // Obtener totales por tipo
    const incomeResult = await Transaction.aggregate([
      {
        $match: {
          user: req.user._id,
          type: 'income',
          ...(Object.keys(dateFilter).length > 0 && { date: dateFilter })
        }
      },
      {
        $group: {
          _id: null,
          total: { $sum: '$amount' },
          count: { $sum: 1 }
        }
      }
    ]);

    const expenseResult = await Transaction.aggregate([
      {
        $match: {
          user: req.user._id,
          type: 'expense',
          ...(Object.keys(dateFilter).length > 0 && { date: dateFilter })
        }
      },
      {
        $group: {
          _id: null,
          total: { $sum: '$amount' },
          count: { $sum: 1 }
        }
      }
    ]);

    const totalIncome = incomeResult.length > 0 ? incomeResult[0].total : 0;
    const totalExpense = expenseResult.length > 0 ? expenseResult[0].total : 0;
    const incomeCount = incomeResult.length > 0 ? incomeResult[0].count : 0;
    const expenseCount = expenseResult.length > 0 ? expenseResult[0].count : 0;
    const balance = totalIncome - totalExpense;

    // Obtener transacciones más recientes
    const recentTransactions = await Transaction.find({
      user: req.user._id,
      ...(Object.keys(dateFilter).length > 0 && { date: dateFilter })
    })
    .sort({ date: -1 })
    .limit(5)
    .select('type amount category description date');

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
    const matchFilter = { user: req.user._id };
    if (type) matchFilter.type = type;
    
    if (startDate || endDate) {
      matchFilter.date = {};
      if (startDate) matchFilter.date.$gte = new Date(startDate);
      if (endDate) matchFilter.date.$lte = new Date(endDate);
    }

    const categoryStats = await Transaction.aggregate([
      { $match: matchFilter },
      {
        $group: {
          _id: {
            type: '$type',
            category: '$category'
          },
          total: { $sum: '$amount' },
          count: { $sum: 1 }
        }
      },
      {
        $group: {
          _id: '$_id.type',
          categories: {
            $push: {
              category: '$_id.category',
              total: '$total',
              count: '$count'
            }
          },
          totalAmount: { $sum: '$total' }
        }
      },
      { $sort: { _id: 1 } }
    ]);

    // Formatear datos para gráficas
    const categories = Transaction.getCategories();
    const formattedData = {};

    categoryStats.forEach(stat => {
      const type = stat._id;
      const categoryData = stat.categories.map(cat => {
        const categoryInfo = categories[type]?.find(c => c.value === cat.category);
        return {
          name: categoryInfo?.label || cat.category,
          value: cat.total,
          count: cat.count,
          percentage: stat.totalAmount > 0 ? (cat.total / stat.totalAmount * 100).toFixed(1) : 0
        };
      });

      formattedData[type] = {
        total: stat.totalAmount,
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
  query('year').optional().isInt({ min: 2020, max: 2030 }),
  query('months').optional().isInt({ min: 1, max: 24 })
], async (req, res) => {
  try {
    const { year = new Date().getFullYear(), months = 12 } = req.query;
    
    // Calcular fechas de inicio y fin
    const endDate = new Date(year, 11, 31); // Fin del año especificado
    const startDate = new Date(endDate);
    startDate.setMonth(endDate.getMonth() - (parseInt(months) - 1));
    startDate.setDate(1);

    const monthlyStats = await Transaction.aggregate([
      {
        $match: {
          user: req.user._id,
          date: { $gte: startDate, $lte: endDate }
        }
      },
      {
        $group: {
          _id: {
            year: { $year: '$date' },
            month: { $month: '$date' },
            type: '$type'
          },
          total: { $sum: '$amount' }
        }
      },
      {
        $group: {
          _id: {
            year: '$_id.year',
            month: '$_id.month'
          },
          income: {
            $sum: {
              $cond: [
                { $eq: ['$_id.type', 'income'] },
                '$total',
                0
              ]
            }
          },
          expense: {
            $sum: {
              $cond: [
                { $eq: ['$_id.type', 'expense'] },
                '$total',
                0
              ]
            }
          }
        }
      },
      {
        $addFields: {
          balance: { $subtract: ['$income', '$expense'] }
        }
      },
      { $sort: { '_id.year': 1, '_id.month': 1 } }
    ]);

    // Formatear datos para gráficas
    const monthNames = [
      'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
      'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
    ];

    const formattedData = monthlyStats.map(stat => ({
      month: `${monthNames[stat._id.month - 1]} ${stat._id.year}`,
      income: stat.income,
      expense: stat.expense,
      balance: stat.balance
    }));

    res.json({
      monthlyData: formattedData,
      summary: {
        totalIncome: formattedData.reduce((sum, item) => sum + item.income, 0),
        totalExpense: formattedData.reduce((sum, item) => sum + item.expense, 0),
        averageBalance: formattedData.reduce((sum, item) => sum + item.balance, 0) / formattedData.length
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

    const trends = await Transaction.aggregate([
      {
        $match: {
          user: req.user._id,
          date: { $gte: sixMonthsAgo }
        }
      },
      {
        $group: {
          _id: {
            year: { $year: '$date' },
            month: { $month: '$date' },
            type: '$type'
          },
          total: { $sum: '$amount' }
        }
      },
      {
        $group: {
          _id: {
            year: '$_id.year',
            month: '$_id.month'
          },
          income: {
            $sum: {
              $cond: [
                { $eq: ['$_id.type', 'income'] },
                '$total',
                0
              ]
            }
          },
          expense: {
            $sum: {
              $cond: [
                { $eq: ['$_id.type', 'expense'] },
                '$total',
                0
              ]
            }
          }
        }
      },
      { $sort: { '_id.year': 1, '_id.month': 1 } }
    ]);

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
    const filters = { user: req.user._id };

    if (startDate || endDate) {
      filters.date = {};
      if (startDate) filters.date.$gte = new Date(startDate);
      if (endDate) filters.date.$lte = new Date(endDate);
    }

    let csvContent = '';

    if (type === 'summary') {
      // Resumen general
      const summary = await Transaction.aggregate([
        { $match: filters },
        {
          $group: {
            _id: '$type',
            total: { $sum: '$amount' },
            count: { $sum: 1 }
          }
        }
      ]);

      const income = summary.find(s => s._id === 'income')?.total || 0;
      const expenses = summary.find(s => s._id === 'expense')?.total || 0;
      const balance = income - expenses;

      csvContent = [
        ['Métrica', 'Valor'],
        ['Ingresos Totales', income.toFixed(2)],
        ['Gastos Totales', expenses.toFixed(2)],
        ['Balance', balance.toFixed(2)],
        ['Total Transacciones', summary.reduce((acc, s) => acc + s.count, 0)],
        ['Período', `${startDate || 'Inicio'} - ${endDate || 'Hoy'}`]
      ]
        .map(row => row.map(field => `"${field}"`).join(','))
        .join('\n');

    } else if (type === 'category-breakdown') {
      // Desglose por categorías
      const categoryBreakdown = await Transaction.aggregate([
        { $match: filters },
        {
          $group: {
            _id: { type: '$type', category: '$category' },
            total: { $sum: '$amount' },
            count: { $sum: 1 }
          }
        },
        { $sort: { '_id.type': 1, total: -1 } }
      ]);

      const csvHeaders = ['Tipo', 'Categoría', 'Total', 'Cantidad'];
      const csvRows = categoryBreakdown.map(item => [
        item._id.type === 'income' ? 'Ingreso' : 'Gasto',
        item._id.category,
        item.total.toFixed(2),
        item.count
      ]);

      csvContent = [csvHeaders, ...csvRows]
        .map(row => row.map(field => `"${field}"`).join(','))
        .join('\n');

    } else if (type === 'monthly-trends') {
      // Tendencias mensuales
      const monthlyTrends = await Transaction.aggregate([
        { $match: filters },
        {
          $group: {
            _id: {
              year: { $year: '$date' },
              month: { $month: '$date' },
              type: '$type'
            },
            total: { $sum: '$amount' }
          }
        },
        { $sort: { '_id.year': 1, '_id.month': 1 } }
      ]);

      const csvHeaders = ['Año', 'Mes', 'Tipo', 'Total'];
      const csvRows = monthlyTrends.map(item => [
        item._id.year,
        item._id.month,
        item._id.type === 'income' ? 'Ingreso' : 'Gasto',
        item.total.toFixed(2)
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