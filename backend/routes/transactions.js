const express = require('express');
const { body, validationResult, query } = require('express-validator');
const { Transaction, User } = require('../models');
const { auth } = require('../middleware/auth');
const upload = require('../middleware/upload');
const { apiLimiter, uploadLimiter, sensitiveOpLimiter } = require('../middleware/rateLimiter');
const FileService = require('../services/fileService');
const path = require('path');
const fs = require('fs');
const { Op } = require('sequelize');

const router = express.Router();

// Aplicar middleware de autenticación a todas las rutas
router.use(auth);

// Middleware global de manejo de errores de multer
router.use((err, req, res, next) => {
  if (err && err.name === 'MulterError') {
    return res.status(400).json({ message: err.message })
  }
  if (err) {
    return res.status(400).json({ message: err.message })
  }
  next()
})

// GET /api/transactions - Obtener transacciones con filtros
router.get('/', [
  query('type').optional().isIn(['income', 'expense']),
  query('category').optional().isString(),
  query('startDate').optional().isISO8601(),
  query('endDate').optional().isISO8601(),
  query('minAmount').optional().isFloat({ min: 0 }),
  query('maxAmount').optional().isFloat({ min: 0 }),
  query('page').optional().isInt({ min: 1 }),
  query('limit').optional().isInt({ min: 1, max: 100 }),
  query('search').optional().isString()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        message: 'Parámetros de consulta inválidos',
        errors: errors.array()
      });
    }

    const {
      type,
      category,
      startDate,
      endDate,
      minAmount,
      maxAmount,
      page = 1,
      limit = 20,
      search
    } = req.query;

    // Construir filtros para Sequelize
    const whereClause = { userId: req.user.id };

    if (type) whereClause.type = type;
    if (category) whereClause.category = category;

    if (startDate || endDate) {
      whereClause.date = {};
      if (startDate) whereClause.date[Op.gte] = new Date(startDate);
      if (endDate) whereClause.date[Op.lte] = new Date(endDate);
    }

    if (minAmount || maxAmount) {
      whereClause.amount = {};
      if (minAmount) whereClause.amount[Op.gte] = parseFloat(minAmount);
      if (maxAmount) whereClause.amount[Op.lte] = parseFloat(maxAmount);
    }

    if (search) {
      whereClause.description = { [Op.like]: `%${search}%` };
    }

    // Calcular paginación
    const offset = (page - 1) * limit;

    // Ejecutar consulta
    const transactions = await Transaction.findAll({
      where: whereClause,
      order: [['date', 'DESC'], ['createdAt', 'DESC']],
      offset: offset,
      limit: parseInt(limit),
      include: [{
        model: User,
        as: 'user',
        attributes: ['name', 'email']
      }]
    });

    // Agregar URL de acceso a cada adjunto (prioriza Cloudinary si existe)
    const transactionsWithAttachmentUrls = transactions.map(tx => {
      const txObj = tx.toJSON();
      if (Array.isArray(txObj.attachments)) {
        txObj.attachments = txObj.attachments.map(att => {
          const fileUrl = FileService.getFileUrl(att, txObj.id);
          return {
            ...att,
            url: fileUrl.url
          };
        });
      }
      return txObj;
    });

    // Contar total de documentos
    const total = await Transaction.count({ where: whereClause });

    res.json({
      transactions: transactionsWithAttachmentUrls,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit)
      }
    });

  } catch (error) {
    console.error('Error obteniendo transacciones:', error);
    res.status(500).json({
      message: 'Error interno del servidor'
    });
  }
});

// GET /api/transactions/categories - Obtener categorías disponibles
router.get('/categories', async (req, res) => {
  try {
    const categories = Transaction.getCategories();
    res.json(categories);
  } catch (error) {
    console.error('Error obteniendo categorías:', error);
    res.status(500).json({
      message: 'Error interno del servidor'
    });
  }
});

// POST /api/transactions - Crear nueva transacción
router.post('/', [
  body('type')
    .isIn(['income', 'expense'])
    .withMessage('El tipo debe ser income o expense'),
  body('amount')
    .isFloat({ min: 0.01 })
    .withMessage('El monto debe ser un número mayor a 0'),
  body('category')
    .isString()
    .notEmpty()
    .withMessage('La categoría es requerida'),
  body('description')
    .isString()
    .trim()
    .isLength({ min: 1, max: 200 })
    .withMessage('La descripción debe tener entre 1 y 200 caracteres'),
  body('date')
    .optional()
    .isISO8601()
    .withMessage('La fecha debe ser válida'),
  body('tags')
    .optional()
    .isArray()
    .withMessage('Los tags deben ser un array'),
  body('isRecurring')
    .optional()
    .isBoolean()
    .withMessage('isRecurring debe ser un booleano'),
  body('recurringPeriod')
    .optional()
    .isIn(['weekly', 'monthly', 'yearly'])
    .withMessage('El período recurrente debe ser weekly, monthly o yearly')
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
      type,
      amount,
      category,
      description,
      date = new Date(),
      tags = [],
      isRecurring = false,
      recurringPeriod
    } = req.body;

    // Validar que la categoría sea válida para el tipo
    const categories = Transaction.getCategories();
    const validCategories = categories[type] || [];
    const isValidCategory = validCategories.some(cat => cat.value === category);
    
    if (!isValidCategory) {
      return res.status(400).json({
        message: 'Categoría inválida para el tipo de transacción'
      });
    }

    // Crear transacción
    const transaction = await Transaction.create({
      userId: req.user.id,
      type,
      amount,
      category,
      description,
      date,
      tags,
      isRecurring,
      recurringPeriod: isRecurring ? recurringPeriod : null
    });

    res.status(201).json({
      message: 'Transacción creada exitosamente',
      transaction
    });

  } catch (error) {
    console.error('Error creando transacción:', error);
    res.status(500).json({
      message: 'Error interno del servidor'
    });
  }
});

// GET /api/transactions/:id - Obtener transacción específica
router.get('/:id', async (req, res) => {
  try {
    const transaction = await Transaction.findOne({
      where: {
        id: req.params.id,
        userId: req.user.id
      },
      include: [{
        model: User,
        as: 'user',
        attributes: ['name', 'email']
      }]
    });

    if (!transaction) {
      return res.status(404).json({
        message: 'Transacción no encontrada'
      });
    }

    res.json({ transaction });

  } catch (error) {
    console.error('Error obteniendo transacción:', error);
    res.status(500).json({
      message: 'Error interno del servidor'
    });
  }
});

// PUT /api/transactions/:id - Actualizar transacción
router.put('/:id', [
  body('type')
    .optional()
    .isIn(['income', 'expense'])
    .withMessage('El tipo debe ser income o expense'),
  body('amount')
    .optional()
    .isFloat({ min: 0.01 })
    .withMessage('El monto debe ser un número mayor a 0'),
  body('category')
    .optional()
    .isString()
    .notEmpty()
    .withMessage('La categoría no puede estar vacía'),
  body('description')
    .optional()
    .isString()
    .trim()
    .isLength({ min: 1, max: 200 })
    .withMessage('La descripción debe tener entre 1 y 200 caracteres'),
  body('date')
    .optional()
    .isISO8601()
    .withMessage('La fecha debe ser válida')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        message: 'Datos de entrada inválidos',
        errors: errors.array()
      });
    }

    const transaction = await Transaction.findOne({
      where: {
        id: req.params.id,
        userId: req.user.id
      }
    });

    if (!transaction) {
      return res.status(404).json({
        message: 'Transacción no encontrada'
      });
    }

    // Actualizar campos
    Object.keys(req.body).forEach(key => {
      if (req.body[key] !== undefined) {
        transaction[key] = req.body[key];
      }
    });

    await transaction.save();

    // Recargar con relaciones
    await transaction.reload({
      include: [{
        model: User,
        as: 'user',
        attributes: ['name', 'email']
      }]
    });

    res.json({
      message: 'Transacción actualizada exitosamente',
      transaction
    });

  } catch (error) {
    console.error('Error actualizando transacción:', error);
    res.status(500).json({
      message: 'Error interno del servidor'
    });
  }
});

// DELETE /api/transactions/:id - Eliminar transacción
router.delete('/:id', async (req, res) => {
  try {
    const transaction = await Transaction.findOne({
      where: {
        id: req.params.id,
        userId: req.user.id
      }
    });

    if (!transaction) {
      return res.status(404).json({
        message: 'Transacción no encontrada'
      });
    }

    await transaction.destroy();

    res.json({
      message: 'Transacción eliminada exitosamente'
    });

  } catch (error) {
    console.error('Error eliminando transacción:', error);
    res.status(500).json({
      message: 'Error interno del servidor'
    });
  }
});

// PUT /api/transactions/bulk-update - Actualización masiva de transacciones
router.put('/bulk-update', sensitiveOpLimiter, [
  body('transactionIds')
    .isArray({ min: 1 })
    .withMessage('Debe seleccionar al menos una transacción'),
  body('action')
    .isIn(['update', 'add_tags'])
    .withMessage('La acción debe ser update o add_tags'),
  body('type')
    .optional()
    .isIn(['income', 'expense'])
    .withMessage('El tipo debe ser income o expense'),
  body('category')
    .optional()
    .isString()
    .notEmpty()
    .withMessage('La categoría no puede estar vacía'),
  body('tags')
    .optional()
    .isString()
    .notEmpty()
    .withMessage('Los tags no pueden estar vacíos')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        message: 'Datos de entrada inválidos',
        errors: errors.array()
      });
    }

    const { transactionIds, action, type, category, tags } = req.body;

    // Verificar que todas las transacciones pertenezcan al usuario
    const transactions = await Transaction.findAll({
      where: {
        id: { [Op.in]: transactionIds },
        userId: req.user.id
      }
    });

    if (transactions.length !== transactionIds.length) {
      return res.status(400).json({
        message: 'Algunas transacciones no existen o no tienes permisos para editarlas'
      });
    }

    let updateData = {};

    if (action === 'update') {
      // Validar que la categoría sea válida para el tipo
      if (type && category) {
        const categories = Transaction.getCategories();
        const validCategories = categories[type] || [];
        const isValidCategory = validCategories.some(cat => cat.value === category);

        if (!isValidCategory) {
          return res.status(400).json({
            message: 'Categoría inválida para el tipo de transacción'
          });
        }
      }

      if (type) updateData.type = type;
      if (category) updateData.category = category;
    }

    if (action === 'add_tags' && tags) {
      // Parsear tags y agregarlos a las transacciones existentes
      const newTags = tags.split(',').map(tag => tag.trim()).filter(tag => tag);

      // Actualizar cada transacción agregando los nuevos tags
      for (const transaction of transactions) {
        const existingTags = transaction.tags || [];
        const uniqueTags = [...new Set([...existingTags, ...newTags])];
        transaction.tags = uniqueTags;
        await transaction.save();
      }

      return res.json({
        message: `Tags agregados exitosamente a ${transactions.length} transacción(es)`
      });
    }

    // Actualizar transacciones con los nuevos datos
    const [updatedCount] = await Transaction.update(
      updateData,
      {
        where: {
          id: { [Op.in]: transactionIds },
          userId: req.user.id
        }
      }
    );

    res.json({
      message: `${updatedCount} transacción(es) actualizada(s) exitosamente`
    });

  } catch (error) {
    console.error('Error en actualización masiva:', error);
    res.status(500).json({
      message: 'Error interno del servidor'
    });
  }
});

// POST /api/transactions/:id/attachments - Subir archivos adjuntos
router.post('/:id/attachments', uploadLimiter, auth, upload.array('files', 5), async (req, res) => {
  try {
    console.log('Intentando adjuntar archivos a transacción:', req.params.id, 'para usuario:', req.user.id)
    const transaction = await Transaction.findOne({
      where: {
        id: req.params.id,
        userId: req.user.id
      }
    });
    console.log('Resultado de búsqueda de transacción:', transaction)
    if (!transaction) {
      return res.status(404).json({
        message: 'Transacción no encontrada para este usuario'
      });
    }

    if (!req.files || req.files.length === 0) {
      return res.status(400).json({
        message: 'No se han subido archivos'
      });
    }

    // Validar archivos (extensión, MIME y firma real)
    const { validFiles, invalid } = await FileService.validateUploadedFiles(req.files);

    if (validFiles.length === 0) {
      return res.status(400).json({
        message: 'Todos los archivos fueron rechazados',
        errors: invalid
      });
    }

    // Procesar archivos válidos (local + Cloudinary)
    const attachments = await FileService.processUploadedFiles(validFiles, req.user._id);

    // Agregar archivos a la transacción
    transaction.attachments.push(...attachments);
    await transaction.save();

    // Respuesta con URLs optimizadas
    const attachmentSummary = attachments.map(att => ({
      filename: att.filename,
      originalName: att.originalName,
      mimeType: att.mimeType,
      size: att.size,
      url: FileService.getFileUrl(att, req.params.id),
      cloudBackup: !!att.cloudinary
    }));

    res.json({
      message: `${attachments.length} archivo(s) subido(s) exitosamente` + (invalid.length ? `, ${invalid.length} rechazado(s)` : ''),
      attachments: attachmentSummary,
      cloudBackup: attachments.every(att => att.cloudinary),
      rejected: invalid.length ? invalid : undefined
    });

  } catch (error) {
    console.error('Error subiendo archivos:', error);
    res.status(500).json({
      message: 'Error interno del servidor'
    });
  }
});

// GET /api/transactions/:id/attachments/:filename - Descargar archivo
router.get('/:id/attachments/:filename', auth, async (req, res) => {
  try {
    const transaction = await Transaction.findOne({
      where: {
        id: req.params.id,
        userId: req.user.id
      }
    });

    if (!transaction) {
      return res.status(404).json({
        message: 'Transacción no encontrada'
      });
    }

    const attachment = transaction.attachments.find(
      att => att.filename === req.params.filename
    );

    if (!attachment) {
      return res.status(404).json({
        message: 'Archivo no encontrado'
      });
    }

    // Priorizar Cloudinary si está disponible
    if (attachment.cloudinary && attachment.cloudinary.secure_url) {
      console.log(`📥 Redirigiendo a Cloudinary: ${attachment.cloudinary.secure_url}`);
      
      // Opción 1: Redirección directa (más eficiente)
      return res.redirect(attachment.cloudinary.secure_url);
      
      // Opción 2: Proxy de descarga (descomenta si prefieres esto)
      // const axios = require('axios');
      // const response = await axios.get(attachment.cloudinary.secure_url, {
      //   responseType: 'stream'
      // });
      // res.setHeader('Content-Disposition', `attachment; filename="${attachment.originalName}"`);
      // res.setHeader('Content-Type', attachment.mimeType);
      // return response.data.pipe(res);
    }

    // Fallback a archivo local
    const filePath = path.join(__dirname, '../uploads', attachment.filename);
    
    if (!fs.existsSync(filePath)) {
      return res.status(404).json({
        message: 'Archivo no encontrado ni en la nube ni localmente'
      });
    }

    console.log(`📥 Descargando archivo local: ${filePath}`);
    res.download(filePath, attachment.originalName);

  } catch (error) {
    console.error('Error descargando archivo:', error);
    res.status(500).json({
      message: 'Error interno del servidor'
    });
  }
});

// DELETE /api/transactions/:id/attachments/:filename - Eliminar archivo adjunto
router.delete('/:id/attachments/:filename', auth, async (req, res) => {
  try {
    const transaction = await Transaction.findOne({
      where: {
        id: req.params.id,
        userId: req.user.id
      }
    });

    if (!transaction) {
      return res.status(404).json({
        message: 'Transacción no encontrada'
      });
    }

    const attachmentIndex = transaction.attachments.findIndex(
      att => att.filename === req.params.filename
    );

    if (attachmentIndex === -1) {
      return res.status(404).json({
        message: 'Archivo no encontrado'
      });
    }

    const attachment = transaction.attachments[attachmentIndex];

    // Eliminar archivo usando FileService (local + Cloudinary)
    try {
      await FileService.deleteAttachment(attachment);
      console.log(`🗑️ Archivo eliminado completamente: ${attachment.filename}`);
    } catch (error) {
      console.error('Error eliminando archivo:', error);
      // Continuar con la eliminación de la referencia aunque falle la eliminación física
    }

    // Eliminar referencia de la base de datos
    transaction.attachments.splice(attachmentIndex, 1);
    await transaction.save();

    res.json({
      message: 'Archivo eliminado exitosamente',
      filename: attachment.filename
    });

  } catch (error) {
    console.error('Error eliminando archivo:', error);
    res.status(500).json({
      message: 'Error interno del servidor'
    });
  }
});

// GET /api/transactions/export - Exportar transacciones a CSV
router.get('/export', auth, [
  query('startDate').optional().isISO8601(),
  query('endDate').optional().isISO8601(),
  query('type').optional().isIn(['income', 'expense']),
  query('category').optional().isString()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        message: 'Parámetros de consulta inválidos',
        errors: errors.array()
      });
    }

    const { startDate, endDate, type, category } = req.query;

    // Construir filtros
    const whereClause = { userId: req.user.id };

    if (type) whereClause.type = type;
    if (category) whereClause.category = category;

    if (startDate || endDate) {
      whereClause.date = {};
      if (startDate) whereClause.date[Op.gte] = new Date(startDate);
      if (endDate) whereClause.date[Op.lte] = new Date(endDate);
    }

    // Obtener transacciones
    const transactions = await Transaction.findAll({
      where: whereClause,
      order: [['date', 'DESC'], ['createdAt', 'DESC']],
      include: [{
        model: User,
        as: 'user',
        attributes: ['name', 'email']
      }]
    });

    // Generar CSV
    const csvHeaders = [
      'Fecha',
      'Tipo',
      'Categoría',
      'Descripción',
      'Monto',
      'Tags',
      'Recurrente',
      'Período Recurrente',
      'Archivos Adjuntos'
    ];

    const csvRows = transactions.map(transaction => [
      new Date(transaction.date).toLocaleDateString('es-ES'),
      transaction.type === 'income' ? 'Ingreso' : 'Gasto',
      transaction.category,
      transaction.description,
      transaction.amount.toFixed(2),
      transaction.tags?.join(', ') || '',
      transaction.isRecurring ? 'Sí' : 'No',
      transaction.recurringPeriod || '',
      transaction.attachments?.length || 0
    ]);

    const csvContent = [csvHeaders, ...csvRows]
      .map(row => row.map(field => `"${field}"`).join(','))
      .join('\n');

    // Configurar headers para descarga
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename="transacciones_${new Date().toISOString().split('T')[0]}.csv"`);

    res.send(csvContent);

  } catch (error) {
    console.error('Error exportando transacciones:', error);
    res.status(500).json({
      message: 'Error interno del servidor'
    });
  }
});

module.exports = router; 
