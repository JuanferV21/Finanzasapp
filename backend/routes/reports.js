const express = require('express');
const { body, validationResult, query } = require('express-validator');
const { auth } = require('../middleware/auth');
const { apiLimiter, sensitiveOpLimiter } = require('../middleware/rateLimiter');
const reportService = require('../services/reportService');

const router = express.Router();

// Aplicar middleware de autenticación y rate limiting
router.use(auth);
router.use(apiLimiter);

// GET /api/reports/advanced-pdf - Generar PDF avanzado
router.get('/advanced-pdf', [
  sensitiveOpLimiter,
  query('startDate')
    .optional()
    .isDate()
    .withMessage('startDate debe ser una fecha válida'),
  query('endDate')
    .optional()
    .isDate()
    .withMessage('endDate debe ser una fecha válida'),
  query('includeCharts')
    .optional()
    .isBoolean()
    .withMessage('includeCharts debe ser booleano'),
  query('includeBudgets')
    .optional()
    .isBoolean()
    .withMessage('includeBudgets debe ser booleano')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        message: 'Parámetros de consulta inválidos',
        errors: errors.array()
      });
    }

    const { startDate, endDate, includeCharts = true, includeBudgets = true } = req.query;
    const userId = req.user._id;

    const filters = {};
    if (startDate) filters.startDate = startDate;
    if (endDate) filters.endDate = endDate;

    const options = {
      includeCharts: includeCharts === 'true',
      includeBudgets: includeBudgets === 'true'
    };

    console.log('📊 Generando PDF avanzado para usuario:', userId);
    
    const pdfDoc = await reportService.generateAdvancedPDF(userId, filters, options);
    
    // Configurar headers para descarga
    const filename = `reporte_avanzado_${new Date().toISOString().slice(0, 10)}.pdf`;
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);

    // Stream el PDF
    pdfDoc.pipe(res);
    pdfDoc.end();

  } catch (error) {
    console.error('Error generando PDF avanzado:', error);
    res.status(500).json({
      message: 'Error interno del servidor al generar PDF',
      error: process.env.NODE_ENV === 'development' ? error.message : {}
    });
  }
});

// GET /api/reports/advanced-excel - Generar Excel avanzado
router.get('/advanced-excel', [
  sensitiveOpLimiter,
  query('startDate')
    .optional()
    .isDate()
    .withMessage('startDate debe ser una fecha válida'),
  query('endDate')
    .optional()
    .isDate()
    .withMessage('endDate debe ser una fecha válida')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        message: 'Parámetros de consulta inválidos',
        errors: errors.array()
      });
    }

    const { startDate, endDate } = req.query;
    const userId = req.user._id;

    const filters = {};
    if (startDate) filters.startDate = startDate;
    if (endDate) filters.endDate = endDate;

    console.log('📈 Generando Excel avanzado para usuario:', userId);
    
    const excelBuffer = await reportService.generateAdvancedExcel(userId, filters);
    
    // Configurar headers para descarga
    const filename = `reporte_avanzado_${new Date().toISOString().slice(0, 10)}.xlsx`;
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.setHeader('Content-Length', excelBuffer.length);

    res.send(excelBuffer);

  } catch (error) {
    console.error('Error generando Excel avanzado:', error);
    res.status(500).json({
      message: 'Error interno del servidor al generar Excel',
      error: process.env.NODE_ENV === 'development' ? error.message : {}
    });
  }
});

// POST /api/reports/custom - Generar reporte personalizado
router.post('/custom', [
  body('title')
    .trim()
    .isLength({ min: 1, max: 100 })
    .withMessage('El título debe tener entre 1 y 100 caracteres'),
  body('filters')
    .isObject()
    .withMessage('Los filtros deben ser un objeto'),
  body('includeCharts')
    .optional()
    .isBoolean()
    .withMessage('includeCharts debe ser booleano'),
  body('includeBudgets')
    .optional()
    .isBoolean()
    .withMessage('includeBudgets debe ser booleano'),
  body('includeRecommendations')
    .optional()
    .isBoolean()
    .withMessage('includeRecommendations debe ser booleano'),
  body('format')
    .isIn(['pdf', 'excel'])
    .withMessage('El formato debe ser pdf o excel')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        message: 'Datos de entrada inválidos',
        errors: errors.array()
      });
    }

    const { 
      title, 
      filters, 
      includeCharts = true, 
      includeBudgets = true, 
      includeRecommendations = true,
      format 
    } = req.body;
    
    const userId = req.user._id;

    const options = {
      title,
      includeCharts,
      includeBudgets,
      includeRecommendations
    };

    console.log(`📋 Generando reporte personalizado (${format}) para usuario:`, userId);

    if (format === 'pdf') {
      const pdfDoc = await reportService.generateAdvancedPDF(userId, filters, options);
      
      const filename = `${title.replace(/\s+/g, '_').toLowerCase()}_${new Date().toISOString().slice(0, 10)}.pdf`;
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
      
      pdfDoc.pipe(res);
      pdfDoc.end();
    } else {
      const excelBuffer = await reportService.generateAdvancedExcel(userId, filters);
      
      const filename = `${title.replace(/\s+/g, '_').toLowerCase()}_${new Date().toISOString().slice(0, 10)}.xlsx`;
      res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
      res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
      
      res.send(excelBuffer);
    }

  } catch (error) {
    console.error('Error generando reporte personalizado:', error);
    res.status(500).json({
      message: 'Error interno del servidor al generar reporte personalizado',
      error: process.env.NODE_ENV === 'development' ? error.message : {}
    });
  }
});

// GET /api/reports/data - Obtener datos para vista previa
router.get('/data', [
  query('startDate')
    .optional()
    .isDate()
    .withMessage('startDate debe ser una fecha válida'),
  query('endDate')
    .optional()
    .isDate()
    .withMessage('endDate debe ser una fecha válida')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        message: 'Parámetros de consulta inválidos',
        errors: errors.array()
      });
    }

    const { startDate, endDate } = req.query;
    const userId = req.user._id;

    const filters = {};
    if (startDate) filters.startDate = startDate;
    if (endDate) filters.endDate = endDate;

    const reportData = await reportService.generateReportData(userId, filters);

    res.json({
      message: 'Datos del reporte obtenidos exitosamente',
      data: reportData,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Error obteniendo datos del reporte:', error);
    res.status(500).json({
      message: 'Error interno del servidor al obtener datos',
      error: process.env.NODE_ENV === 'development' ? error.message : {}
    });
  }
});

// GET /api/reports/templates - Obtener plantillas de reportes
router.get('/templates', async (req, res) => {
  try {
    const templates = [
      {
        id: 'monthly',
        name: 'Reporte Mensual',
        description: 'Análisis completo del mes actual con gráficos y recomendaciones',
        filters: {
          startDate: new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().slice(0, 10),
          endDate: new Date().toISOString().slice(0, 10)
        },
        options: {
          includeCharts: true,
          includeBudgets: true,
          includeRecommendations: true
        }
      },
      {
        id: 'quarterly',
        name: 'Reporte Trimestral',
        description: 'Análisis de los últimos 3 meses con tendencias y proyecciones',
        filters: {
          startDate: new Date(new Date().setMonth(new Date().getMonth() - 3)).toISOString().slice(0, 10),
          endDate: new Date().toISOString().slice(0, 10)
        },
        options: {
          includeCharts: true,
          includeBudgets: false,
          includeRecommendations: true
        }
      },
      {
        id: 'annual',
        name: 'Reporte Anual',
        description: 'Resumen completo del año con análisis detallado',
        filters: {
          startDate: new Date(new Date().getFullYear(), 0, 1).toISOString().slice(0, 10),
          endDate: new Date().toISOString().slice(0, 10)
        },
        options: {
          includeCharts: true,
          includeBudgets: true,
          includeRecommendations: true
        }
      },
      {
        id: 'expenses-only',
        name: 'Análisis de Gastos',
        description: 'Reporte enfocado únicamente en gastos y categorías',
        filters: {},
        options: {
          includeCharts: true,
          includeBudgets: true,
          includeRecommendations: false
        }
      }
    ];

    res.json({
      message: 'Plantillas de reportes obtenidas exitosamente',
      templates,
      total: templates.length
    });

  } catch (error) {
    console.error('Error obteniendo plantillas:', error);
    res.status(500).json({
      message: 'Error interno del servidor al obtener plantillas'
    });
  }
});

module.exports = router;
