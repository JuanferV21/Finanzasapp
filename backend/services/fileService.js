const { uploadToCloudinary, deleteFromCloudinary } = require('../config/cloudinary');
const fs = require('fs').promises;
const path = require('path');

class FileService {
  // Procesar archivos subidos: guardar localmente Y en Cloudinary
  static async processUploadedFiles(files, userId) {
    const processedFiles = [];
    
    for (const file of files) {
      try {
        // Datos básicos del archivo
        const fileData = {
          filename: file.filename,
          originalName: file.originalname,
          mimeType: file.mimetype,
          size: file.size,
          path: file.path,
          uploadedAt: new Date()
        };

        // Subir a Cloudinary con metadatos de usuario
        const cloudinaryResult = await uploadToCloudinary(file.path, {
          folder: `finanzas-dashboard/user-${userId}`,
          public_id: `${file.filename}`,
          tags: [`user-${userId}`, 'transaction-attachment'],
          context: {
            user_id: userId,
            original_name: file.originalname,
            upload_date: new Date().toISOString()
          }
        });

        // Agregar datos de Cloudinary al archivo
        fileData.cloudinary = {
          public_id: cloudinaryResult.public_id,
          secure_url: cloudinaryResult.secure_url,
          url: cloudinaryResult.url,
          resource_type: cloudinaryResult.resource_type,
          format: cloudinaryResult.format
        };

        processedFiles.push(fileData);
        
        console.log(`✅ Archivo procesado: ${file.originalname} -> ${cloudinaryResult.public_id}`);
        
        // Opcional: Eliminar archivo local después de subir a cloud
        // await this.cleanupLocalFile(file.path);
        
      } catch (error) {
        console.error(`❌ Error procesando archivo ${file.originalname}:`, error);
        
        // Si falla Cloudinary, al menos guardamos localmente
        processedFiles.push({
          filename: file.filename,
          originalName: file.originalname,
          mimeType: file.mimetype,
          size: file.size,
          path: file.path,
          uploadedAt: new Date(),
          cloudinary: null // Indica que falló el backup en cloud
        });
      }
    }
    
    return processedFiles;
  }

  // Eliminar archivos tanto localmente como de Cloudinary
  static async deleteAttachment(attachment) {
    const errors = [];
    
    try {
      // Eliminar de Cloudinary si existe
      if (attachment.cloudinary && attachment.cloudinary.public_id) {
        await deleteFromCloudinary(
          attachment.cloudinary.public_id,
          attachment.cloudinary.resource_type || 'auto'
        );
        console.log(`🗑️ Eliminado de Cloudinary: ${attachment.cloudinary.public_id}`);
      }
    } catch (error) {
      console.error('Error eliminando de Cloudinary:', error);
      errors.push(`Cloudinary: ${error.message}`);
    }

    try {
      // Eliminar archivo local si existe
      if (attachment.path) {
        await this.cleanupLocalFile(attachment.path);
        console.log(`🗑️ Eliminado localmente: ${attachment.path}`);
      }
    } catch (error) {
      console.error('Error eliminando archivo local:', error);
      errors.push(`Local: ${error.message}`);
    }

    if (errors.length > 0) {
      throw new Error(`Errores al eliminar archivo: ${errors.join(', ')}`);
    }

    return true;
  }

  // Obtener URL del archivo (priorizar Cloudinary)
  static getFileUrl(attachment) {
    // Priorizar URL de Cloudinary si está disponible
    if (attachment.cloudinary && attachment.cloudinary.secure_url) {
      return {
        url: attachment.cloudinary.secure_url,
        source: 'cloudinary',
        public_id: attachment.cloudinary.public_id
      };
    }
    
    // Fallback a archivo local
    return {
      url: `/api/transactions/${attachment.transactionId}/attachments/${attachment.filename}`,
      source: 'local',
      path: attachment.path
    };
  }

  // Limpiar archivo local
  static async cleanupLocalFile(filePath) {
    try {
      await fs.unlink(filePath);
      console.log(`🧹 Archivo local eliminado: ${filePath}`);
    } catch (error) {
      if (error.code !== 'ENOENT') { // Ignorar si el archivo no existe
        throw error;
      }
    }
  }

  // Migrar archivos existentes a Cloudinary
  static async migrateExistingFile(attachment, userId) {
    try {
      // Solo migrar si no tiene datos de Cloudinary y el archivo local existe
      if (attachment.cloudinary && attachment.cloudinary.public_id) {
        console.log(`⏭️ Archivo ya migrado: ${attachment.filename}`);
        return attachment;
      }

      // Verificar si el archivo local existe
      try {
        await fs.access(attachment.path);
      } catch (error) {
        console.log(`⚠️ Archivo local no encontrado: ${attachment.path}`);
        return attachment;
      }

      // Subir a Cloudinary
      const cloudinaryResult = await uploadToCloudinary(attachment.path, {
        folder: `finanzas-dashboard/user-${userId}`,
        public_id: `migrated-${attachment.filename}`,
        tags: [`user-${userId}`, 'transaction-attachment', 'migrated'],
        context: {
          user_id: userId,
          original_name: attachment.originalName,
          migration_date: new Date().toISOString()
        }
      });

      // Actualizar attachment con datos de Cloudinary
      attachment.cloudinary = {
        public_id: cloudinaryResult.public_id,
        secure_url: cloudinaryResult.secure_url,
        url: cloudinaryResult.url,
        resource_type: cloudinaryResult.resource_type,
        format: cloudinaryResult.format
      };

      console.log(`✅ Archivo migrado: ${attachment.filename} -> ${cloudinaryResult.public_id}`);
      return attachment;
      
    } catch (error) {
      console.error(`❌ Error migrando archivo ${attachment.filename}:`, error);
      return attachment; // Devolver sin cambios si falla
    }
  }

  // Verificar salud del servicio
  static async healthCheck() {
    const status = {
      local_storage: false,
      cloudinary: false,
      errors: []
    };

    try {
      // Verificar directorio local
      const uploadDir = path.join(__dirname, '../uploads');
      await fs.access(uploadDir);
      status.local_storage = true;
    } catch (error) {
      status.errors.push(`Local storage: ${error.message}`);
    }

    try {
      // Verificar Cloudinary
      const { testCloudinaryConnection } = require('../config/cloudinary');
      status.cloudinary = await testCloudinaryConnection();
    } catch (error) {
      status.errors.push(`Cloudinary: ${error.message}`);
    }

    return status;
  }
}

module.exports = FileService;