const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Crear directorio de uploads si no existe
const uploadDir = path.join(__dirname, '../uploads');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// Configuración de almacenamiento
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    // Generar nombre único para el archivo
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const ext = path.extname(file.originalname);
    cb(null, file.fieldname + '-' + uniqueSuffix + ext);
  }
});

// Filtro de archivos permitidos (endurecido)
const fileFilter = (req, file, cb) => {
  // Aceptar solo imágenes y PDF (reduce superficie de ataque)
  const allowedImages = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif'];
  const isImage = file.mimetype && allowedImages.includes(file.mimetype);
  const isPdf = file.mimetype === 'application/pdf';

  if (isImage || isPdf) {
    cb(null, true);
  } else {
    cb(new Error('Tipo de archivo no permitido. Solo se permiten imágenes y archivos PDF.'), false);
  }
};

// Configuración de límites por entorno
const MAX_UPLOAD_MB = parseInt(process.env.MAX_UPLOAD_MB || '5', 10);

// Configuración de multer
const upload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: MAX_UPLOAD_MB * 1024 * 1024, // Máximo por archivo
    files: 5 // Máximo 5 archivos por transacción
  }
});

module.exports = upload; 
