const { uploadToCloudinary, deleteFromCloudinary } = require('../config/cloudinary');
const fs = require('fs').promises;
const fssync = require('fs');
const path = require('path');
const { loadImage } = require('canvas');

const CLEANUP_LOCAL_UPLOADS = (process.env.CLEANUP_LOCAL_UPLOADS || 'false').toLowerCase() === 'true';

class FileService {
  static allowedMimes() {
    return new Set([
      'image/jpeg',
      'image/jpg',
      'image/png',
      'image/webp',
      'image/gif',
      'application/pdf',
    ]);
  }

  static allowedExtensions() {
    return new Set(['.jpg', '.jpeg', '.png', '.webp', '.gif', '.pdf']);
  }

  static async readSignature(filePath, max = 12) {
    const fd = await fssync.promises.open(filePath, 'r');
    try {
      const { buffer } = await fd.read(Buffer.alloc(max), 0, max, 0);
      return buffer;
    } finally {
      await fd.close();
    }
  }

  static hasSignature(buf, sig) {
    if (!buf || buf.length < sig.length) return false;
    for (let i = 0; i < sig.length; i++) {
      if (buf[i] !== sig[i]) return false;
    }
    return true;
  }

  static async validateSignature(filePath, mime) {
    const buf = await this.readSignature(filePath, 12);
    // JPEG: FF D8 FF
    if (mime.includes('jpeg') || mime === 'image/jpg') {
      return this.hasSignature(buf, Buffer.from([0xFF, 0xD8, 0xFF]));
    }
    // PNG: 89 50 4E 47 0D 0A 1A 0A
    if (mime === 'image/png') {
      return this.hasSignature(buf, Buffer.from([0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A]));
    }
    // GIF: GIF87a or GIF89a
    if (mime === 'image/gif') {
      const sigText = buf.slice(0, 6).toString('ascii');
      return sigText === 'GIF87a' || sigText === 'GIF89a';
    }
    // WEBP: RIFF....WEBP
    if (mime === 'image/webp') {
      const riff = buf.slice(0, 4).toString('ascii') === 'RIFF';
      const webp = buf.slice(8, 12).toString('ascii') === 'WEBP';
      return riff && webp;
    }
    // PDF: %PDF-
    if (mime === 'application/pdf') {
      return this.hasSignature(buf, Buffer.from('%PDF-'));
    }
    return false;
  }

  static async validateImageDimensions(filePath) {
    // Si no hay límites definidos, no validar dimensiones
    const maxW = parseInt(process.env.MAX_IMAGE_WIDTH || '', 10);
    const maxH = parseInt(process.env.MAX_IMAGE_HEIGHT || '', 10);
    const maxPix = parseInt(process.env.MAX_IMAGE_PIXELS || '', 10); // en megapíxeles
    if (!(maxW > 0 || maxH > 0 || maxPix > 0)) return { ok: true };

    try {
      const img = await loadImage(filePath);
      const w = img.width || 0;
      const h = img.height || 0;
      const mp = (w * h) / 1_000_000;

      if (maxW > 0 && w > maxW) {
        return { ok: false, reason: `Ancho ${w}px excede máximo ${maxW}px` };
      }
      if (maxH > 0 && h > maxH) {
        return { ok: false, reason: `Alto ${h}px excede máximo ${maxH}px` };
      }
      if (maxPix > 0 && mp > maxPix) {
        return { ok: false, reason: `Tamaño ${mp.toFixed(2)}MP excede máximo ${maxPix}MP` };
      }
      return { ok: true };
    } catch (e) {
      return { ok: false, reason: 'No se pudo leer dimensiones de la imagen' };
    }
  }

  // Valida archivos subidos (extensión, mimetype y firma). Devuelve válidos e inválidos y limpia inválidos del disco.
  static async validateUploadedFiles(files) {
    const allowedMimes = this.allowedMimes();
    const allowedExts = this.allowedExtensions();
    const validFiles = [];
    const invalid = [];

    for (const file of files) {
      const ext = path.extname(file.originalname || '').toLowerCase();
      const mime = (file.mimetype || '').toLowerCase();
      let reason = '';

      if (!allowedExts.has(ext)) {
        reason = 'Extensión no permitida';
      } else if (!allowedMimes.has(mime)) {
        reason = 'Tipo MIME no permitido';
      } else {
        try {
          const ok = await this.validateSignature(file.path, mime);
          if (!ok) {
            reason = 'Firma de archivo no válida';
          } else if (mime.startsWith('image/')) {
            const dim = await this.validateImageDimensions(file.path);
            if (!dim.ok) reason = dim.reason || 'Dimensiones de imagen no válidas';
          }
        } catch (e) {
          reason = 'No se pudo validar el archivo';
        }
      }

      if (reason) {
        invalid.push({ filename: file.originalname, reason });
        try { await this.cleanupLocalFile(file.path); } catch (_) {}
      } else {
        validFiles.push(file);
      }
    }

    return { validFiles, invalid };
  }
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
        
        // Opcional: Eliminar archivo local después de subir a la nube
        if (CLEANUP_LOCAL_UPLOADS) {
          try {
            await this.cleanupLocalFile(file.path);
          } catch (cleanupErr) {
            console.warn(`⚠️  No se pudo limpiar archivo local ${file.path}:`, cleanupErr.message);
          }
        }
        
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
  static getFileUrl(attachment, transactionId) {
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
      url: `/api/transactions/${transactionId}/attachments/${attachment.filename}`,
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
