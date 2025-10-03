const express = require('express');
const Transaction = require('../models/Transaction');
const { auth } = require('../middleware/auth');
const { sensitiveOpLimiter } = require('../middleware/rateLimiter');
const FileService = require('../services/fileService');

const router = express.Router();

// Aplicar autenticación a todas las rutas
router.use(auth);
// Limitar fuertemente operaciones de migración
router.use(sensitiveOpLimiter);

// POST /api/migrate/files - Migrar archivos existentes a Cloudinary
router.post('/files', async (req, res) => {
  try {
    console.log(`🚀 Iniciando migración de archivos para usuario: ${req.user._id}`);
    
    // Obtener todas las transacciones del usuario que tengan attachments
    const transactions = await Transaction.find({
      user: req.user._id,
      'attachments.0': { $exists: true } // Solo transacciones con al menos un attachment
    });

    if (transactions.length === 0) {
      return res.json({
        message: 'No se encontraron archivos para migrar',
        migrated: 0,
        failed: 0,
        alreadyMigrated: 0
      });
    }

    let totalFiles = 0;
    let migrated = 0;
    let failed = 0;
    let alreadyMigrated = 0;
    const errors = [];

    // Procesar cada transacción
    for (const transaction of transactions) {
      let transactionUpdated = false;

      for (let i = 0; i < transaction.attachments.length; i++) {
        totalFiles++;
        const attachment = transaction.attachments[i];

        try {
          // Verificar si ya está migrado
          if (attachment.cloudinary && attachment.cloudinary.public_id) {
            alreadyMigrated++;
            console.log(`⏭️ Ya migrado: ${attachment.filename}`);
            continue;
          }

          // Migrar archivo
          const migratedAttachment = await FileService.migrateExistingFile(
            attachment, 
            req.user._id
          );

          // Actualizar el attachment en la transacción
          transaction.attachments[i] = migratedAttachment;

          if (migratedAttachment.cloudinary && migratedAttachment.cloudinary.public_id) {
            migrated++;
            transactionUpdated = true;
            console.log(`✅ Migrado: ${attachment.filename} -> ${migratedAttachment.cloudinary.public_id}`);
          } else {
            failed++;
            console.log(`❌ Falló migración: ${attachment.filename}`);
          }

        } catch (error) {
          failed++;
          errors.push({
            file: attachment.filename,
            error: error.message
          });
          console.error(`❌ Error migrando ${attachment.filename}:`, error);
        }
      }

      // Guardar transacción si se actualizó
      if (transactionUpdated) {
        await transaction.save();
      }
    }

    console.log(`📊 Migración completada: ${migrated} migrados, ${failed} fallidos, ${alreadyMigrated} ya migrados`);

    res.json({
      message: 'Migración de archivos completada',
      total: totalFiles,
      migrated,
      failed,
      alreadyMigrated,
      errors: errors.length > 0 ? errors : undefined
    });

  } catch (error) {
    console.error('Error en migración de archivos:', error);
    res.status(500).json({
      message: 'Error interno durante la migración',
      error: error.message
    });
  }
});

// GET /api/migrate/status - Estado de migración
router.get('/status', async (req, res) => {
  try {
    const transactions = await Transaction.find({
      user: req.user._id,
      'attachments.0': { $exists: true }
    });

    let totalFiles = 0;
    let migratedFiles = 0;
    let localOnlyFiles = 0;

    transactions.forEach(transaction => {
      transaction.attachments.forEach(attachment => {
        totalFiles++;
        if (attachment.cloudinary && attachment.cloudinary.public_id) {
          migratedFiles++;
        } else {
          localOnlyFiles++;
        }
      });
    });

    const migrationPercentage = totalFiles > 0 ? Math.round((migratedFiles / totalFiles) * 100) : 100;

    res.json({
      total: totalFiles,
      migrated: migratedFiles,
      localOnly: localOnlyFiles,
      percentage: migrationPercentage,
      needsMigration: localOnlyFiles > 0
    });

  } catch (error) {
    console.error('Error obteniendo estado de migración:', error);
    res.status(500).json({
      message: 'Error interno del servidor'
    });
  }
});

// GET /api/migrate/health - Verificar salud del servicio de archivos
router.get('/health', async (req, res) => {
  try {
    const health = await FileService.healthCheck();
    
    res.json({
      message: 'Estado del servicio de archivos',
      ...health,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Error verificando salud del servicio:', error);
    res.status(500).json({
      message: 'Error verificando salud del servicio',
      error: error.message
    });
  }
});

module.exports = router;
