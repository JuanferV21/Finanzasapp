const express = require('express');
const { body, validationResult } = require('express-validator');
const { auth } = require('../middleware/auth');
const { apiLimiter } = require('../middleware/rateLimiter');
const categorizationService = require('../services/categorizationService');

const router = express.Router();

// Aplicar middleware de autenticación y rate limiting
router.use(auth);
router.use(apiLimiter);

// POST /api/categorization/suggest - Sugerir categoría para una descripción
router.post('/suggest', [
  body('description')
    .trim()
    .isLength({ min: 1, max: 200 })
    .withMessage('La descripción debe tener entre 1 y 200 caracteres'),
  body('type')
    .optional()
    .isIn(['income', 'expense'])
    .withMessage('El tipo debe ser income o expense')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        message: 'Datos de entrada inválidos',
        errors: errors.array()
      });
    }

    const { description, type } = req.body;
    const userId = req.user._id;

    // Obtener sugerencia personalizada para el usuario
    const suggestion = await categorizationService.suggestCategoryForUser(
      userId, 
      description, 
      type
    );

    res.json({
      message: 'Sugerencia de categoría generada exitosamente',
      description: description,
      type: type,
      suggestion: {
        category: suggestion.suggested,
        confidence: Math.round(suggestion.confidence * 100), // Convertir a porcentaje
        source: suggestion.source || 'base_model'
      },
      alternatives: suggestion.alternatives.map(alt => ({
        category: alt.category,
        confidence: Math.round(alt.confidence * 100)
      })),
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Error sugiriendo categoría:', error);
    res.status(500).json({
      message: 'Error interno del servidor',
      error: process.env.NODE_ENV === 'development' ? error.message : {}
    });
  }
});

// POST /api/categorization/batch-suggest - Sugerir categorías para múltiples descripciones
router.post('/batch-suggest', [
  body('items')
    .isArray({ min: 1, max: 20 })
    .withMessage('Debe proporcionar entre 1 y 20 elementos'),
  body('items.*.description')
    .trim()
    .isLength({ min: 1, max: 200 })
    .withMessage('Cada descripción debe tener entre 1 y 200 caracteres'),
  body('items.*.type')
    .optional()
    .isIn(['income', 'expense'])
    .withMessage('El tipo debe ser income o expense')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        message: 'Datos de entrada inválidos',
        errors: errors.array()
      });
    }

    const { items } = req.body;
    const userId = req.user._id;
    const suggestions = [];

    for (const item of items) {
      try {
        const suggestion = await categorizationService.suggestCategoryForUser(
          userId,
          item.description,
          item.type
        );

        suggestions.push({
          description: item.description,
          type: item.type,
          suggestion: {
            category: suggestion.suggested,
            confidence: Math.round(suggestion.confidence * 100),
            source: suggestion.source || 'base_model'
          },
          alternatives: suggestion.alternatives.slice(0, 2).map(alt => ({
            category: alt.category,
            confidence: Math.round(alt.confidence * 100)
          }))
        });
      } catch (error) {
        console.error(`Error procesando "${item.description}":`, error);
        suggestions.push({
          description: item.description,
          type: item.type,
          error: 'Error procesando esta descripción',
          suggestion: null
        });
      }
    }

    res.json({
      message: `${suggestions.length} sugerencias generadas`,
      results: suggestions,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Error en sugerencias por lote:', error);
    res.status(500).json({
      message: 'Error interno del servidor'
    });
  }
});

// GET /api/categorization/categories - Obtener categorías disponibles con ejemplos
router.get('/categories', async (req, res) => {
  try {
    const { type } = req.query;
    
    let categories;
    if (type && ['income', 'expense'].includes(type)) {
      categories = categorizationService.getValidCategoriesForType(type);
    } else {
      categories = [
        ...categorizationService.getValidCategoriesForType('income'),
        ...categorizationService.getValidCategoriesForType('expense')
      ];
    }

    // Obtener ejemplos de palabras clave para cada categoría
    const categoriesWithExamples = categories.map(category => {
      const keywords = categorizationService.trainingData[category] || [];
      return {
        category,
        type: categorizationService.getValidCategoriesForType('income').includes(category) ? 'income' : 'expense',
        examples: keywords.slice(0, 5), // Primeros 5 ejemplos
        keywordCount: keywords.length
      };
    });

    res.json({
      message: 'Categorías obtenidas exitosamente',
      categories: categoriesWithExamples,
      total: categoriesWithExamples.length
    });

  } catch (error) {
    console.error('Error obteniendo categorías:', error);
    res.status(500).json({
      message: 'Error interno del servidor'
    });
  }
});

// GET /api/categorization/stats - Obtener estadísticas del modelo
router.get('/stats', async (req, res) => {
  try {
    const userId = req.user._id;
    const stats = await categorizationService.getModelStats(userId);

    if (!stats) {
      return res.status(500).json({
        message: 'Error obteniendo estadísticas'
      });
    }

    res.json({
      message: 'Estadísticas del modelo de categorización',
      stats: {
        model: {
          totalKeywords: stats.totalKeywords,
          categoriesCount: stats.categoriesCount,
          version: '1.0.0'
        },
        user: {
          transactionsCount: stats.userTransactions || 0,
          hasPersonalizedModel: stats.hasUserPatterns || false,
          recommendedMinTransactions: 10
        },
        categories: Object.keys(stats.categories).map(category => ({
          name: category,
          keywordCount: stats.categories[category].keywordCount,
          type: categorizationService.getValidCategoriesForType('income').includes(category) ? 'income' : 'expense'
        }))
      },
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Error obteniendo estadísticas:', error);
    res.status(500).json({
      message: 'Error interno del servidor'
    });
  }
});

// POST /api/categorization/feedback - Enviar feedback sobre una sugerencia
router.post('/feedback', [
  body('description')
    .trim()
    .isLength({ min: 1, max: 200 })
    .withMessage('La descripción es requerida'),
  body('suggestedCategory')
    .isString()
    .withMessage('La categoría sugerida es requerida'),
  body('actualCategory')
    .isString()
    .withMessage('La categoría real es requerida'),
  body('wasAccurate')
    .isBoolean()
    .withMessage('El campo wasAccurate debe ser booleano'),
  body('confidence')
    .optional()
    .isInt({ min: 0, max: 100 })
    .withMessage('La confianza debe ser un número entre 0 y 100')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        message: 'Datos de entrada inválidos',
        errors: errors.array()
      });
    }

    const { description, suggestedCategory, actualCategory, wasAccurate, confidence } = req.body;
    
    // Log del feedback para análisis futuro
    console.log('📊 Feedback de categorización:', {
      userId: req.user._id,
      description: description.substring(0, 50) + '...',
      suggested: suggestedCategory,
      actual: actualCategory,
      accurate: wasAccurate,
      confidence: confidence || 'N/A',
      timestamp: new Date().toISOString()
    });

    // TODO: En una implementación más avanzada, esto se guardaría en BD
    // para entrenar el modelo automáticamente

    res.json({
      message: 'Feedback recibido exitosamente',
      feedback: {
        processed: true,
        willImproveModel: true,
        thanksForFeedback: true
      }
    });

  } catch (error) {
    console.error('Error procesando feedback:', error);
    res.status(500).json({
      message: 'Error interno del servidor'
    });
  }
});

// GET /api/categorization/test - Endpoint de prueba para testing
router.get('/test', async (req, res) => {
  try {
    const testCases = [
      { description: 'Supermercado Soriana', type: 'expense' },
      { description: 'Salario mensual empresa', type: 'income' },
      { description: 'Gasolina Pemex', type: 'expense' },
      { description: 'Netflix suscripción', type: 'expense' },
      { description: 'Consulta médico', type: 'expense' },
      { description: 'Freelance proyecto web', type: 'income' }
    ];

    const results = [];
    
    for (const testCase of testCases) {
      const suggestion = categorizationService.suggestCategory(
        testCase.description, 
        testCase.type
      );
      
      results.push({
        input: testCase,
        output: {
          category: suggestion.suggested,
          confidence: Math.round(suggestion.confidence * 100),
          alternatives: suggestion.alternatives.slice(0, 2)
        }
      });
    }

    res.json({
      message: 'Pruebas del modelo de categorización',
      testResults: results,
      modelVersion: '1.0.0',
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Error en pruebas:', error);
    res.status(500).json({
      message: 'Error ejecutando pruebas'
    });
  }
});

module.exports = router;