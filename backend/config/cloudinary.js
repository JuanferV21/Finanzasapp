const cloudinary = require('cloudinary').v2;

// Configuración de Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
  secure: true // Usar HTTPS siempre
});

// Función para subir archivo a Cloudinary
const uploadToCloudinary = async (filePath, options = {}) => {
  try {
    const defaultOptions = {
      use_filename: true,
      unique_filename: true,
      overwrite: false,
      folder: 'finanzas-dashboard', // Carpeta en Cloudinary
      resource_type: 'auto', // Detectar automáticamente el tipo de archivo
    };

    const uploadOptions = { ...defaultOptions, ...options };
    
    const result = await cloudinary.uploader.upload(filePath, uploadOptions);
    
    console.log('✅ Archivo subido a Cloudinary:', result.public_id);
    
    return {
      public_id: result.public_id,
      secure_url: result.secure_url,
      url: result.url,
      resource_type: result.resource_type,
      format: result.format,
      bytes: result.bytes,
      width: result.width,
      height: result.height,
      created_at: result.created_at
    };
  } catch (error) {
    console.error('❌ Error subiendo a Cloudinary:', error);
    throw new Error(`Error al subir archivo a la nube: ${error.message}`);
  }
};

// Función para eliminar archivo de Cloudinary
const deleteFromCloudinary = async (publicId, resourceType = 'image') => {
  try {
    const result = await cloudinary.uploader.destroy(publicId, {
      resource_type: resourceType
    });
    
    console.log('🗑️ Archivo eliminado de Cloudinary:', publicId);
    return result;
  } catch (error) {
    console.error('❌ Error eliminando de Cloudinary:', error);
    throw new Error(`Error al eliminar archivo de la nube: ${error.message}`);
  }
};

// Función para generar URL optimizada
const getOptimizedUrl = (publicId, options = {}) => {
  try {
    const defaultOptions = {
      quality: 'auto',
      fetch_format: 'auto',
    };

    const urlOptions = { ...defaultOptions, ...options };
    
    return cloudinary.url(publicId, urlOptions);
  } catch (error) {
    console.error('❌ Error generando URL optimizada:', error);
    return null;
  }
};

// Función para verificar configuración
const testCloudinaryConnection = async () => {
  try {
    const result = await cloudinary.api.ping();
    console.log('✅ Conexión a Cloudinary exitosa:', result);
    return true;
  } catch (error) {
    console.error('❌ Error conectando a Cloudinary:', error.message);
    return false;
  }
};

module.exports = {
  cloudinary,
  uploadToCloudinary,
  deleteFromCloudinary,
  getOptimizedUrl,
  testCloudinaryConnection
};



