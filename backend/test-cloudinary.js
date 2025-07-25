// Script para probar configuración de Cloudinary
require('dotenv').config();
const { testCloudinaryConnection, uploadToCloudinary } = require('./config/cloudinary');
const FileService = require('./services/fileService');
const fs = require('fs');
const path = require('path');

async function testCloudinarySetup() {
  console.log('🧪 Probando configuración de Cloudinary...\n');

  // 1. Verificar variables de entorno
  console.log('1️⃣ Verificando variables de entorno:');
  const requiredEnvVars = ['CLOUDINARY_CLOUD_NAME', 'CLOUDINARY_API_KEY', 'CLOUDINARY_API_SECRET'];
  let envVarsOk = true;

  requiredEnvVars.forEach(varName => {
    if (process.env[varName]) {
      console.log(`   ✅ ${varName}: ${process.env[varName].substring(0, 8)}...`);
    } else {
      console.log(`   ❌ ${varName}: NO CONFIGURADA`);
      envVarsOk = false;
    }
  });

  if (!envVarsOk) {
    console.log('\n❌ Faltan variables de entorno de Cloudinary.');
    console.log('📝 Copia .env.example a .env y configura tus credenciales de Cloudinary.');
    console.log('🔗 Obtén credenciales en: https://cloudinary.com/console');
    return;
  }

  // 2. Probar conexión
  console.log('\n2️⃣ Probando conexión a Cloudinary:');
  const connectionOk = await testCloudinaryConnection();
  
  if (!connectionOk) {
    console.log('❌ No se pudo conectar a Cloudinary');
    return;
  }

  // 3. Probar upload de archivo de prueba
  console.log('\n3️⃣ Probando upload de archivo de prueba:');
  
  try {
    // Crear archivo de prueba
    const testDir = path.join(__dirname, 'test-uploads');
    if (!fs.existsSync(testDir)) {
      fs.mkdirSync(testDir, { recursive: true });
    }

    const testFilePath = path.join(testDir, 'test-file.txt');
    const testContent = `Archivo de prueba para Cloudinary\nFecha: ${new Date().toISOString()}\nUsuario: test-user`;
    
    fs.writeFileSync(testFilePath, testContent);
    console.log(`   📄 Archivo de prueba creado: ${testFilePath}`);

    // Subir a Cloudinary
    const uploadResult = await uploadToCloudinary(testFilePath, {
      folder: 'finanzas-dashboard/test',
      public_id: `test-${Date.now()}`,
      tags: ['test', 'backup-verification']
    });

    console.log(`   ✅ Upload exitoso!`);
    console.log(`   🔗 URL: ${uploadResult.secure_url}`);
    console.log(`   🆔 Public ID: ${uploadResult.public_id}`);

    // Limpiar archivo de prueba
    fs.unlinkSync(testFilePath);
    fs.rmdirSync(testDir);
    console.log(`   🧹 Archivo de prueba eliminado localmente`);

    // 4. Probar FileService health check
    console.log('\n4️⃣ Probando FileService health check:');
    const healthStatus = await FileService.healthCheck();
    
    console.log(`   📁 Local storage: ${healthStatus.local_storage ? '✅' : '❌'}`);
    console.log(`   ☁️  Cloudinary: ${healthStatus.cloudinary ? '✅' : '❌'}`);
    
    if (healthStatus.errors.length > 0) {
      console.log('   ⚠️  Errores:', healthStatus.errors);
    }

    // 5. Resumen final
    console.log('\n🎉 ¡Cloudinary configurado correctamente!');
    console.log('\n📋 Funcionalidades habilitadas:');
    console.log('   ✅ Backup automático de archivos subidos');
    console.log('   ✅ Descarga desde URLs optimizadas de Cloudinary');
    console.log('   ✅ Eliminación sincronizada (local + cloud)');
    console.log('   ✅ Migración de archivos existentes');
    console.log('   ✅ Fallback a archivos locales');

    console.log('\n🚀 Próximos pasos:');
    console.log('   1. Subir archivos nuevos -> automáticamente irán a Cloudinary');
    console.log('   2. Migrar archivos existentes: POST /api/migrate/files');
    console.log('   3. Verificar estado: GET /api/migrate/status');

  } catch (error) {
    console.error('\n❌ Error durante las pruebas:', error);
    console.log('\n🔧 Posibles soluciones:');
    console.log('   • Verificar credenciales de Cloudinary');
    console.log('   • Verificar conexión a internet');
    console.log('   • Verificar permisos de escritura en directorio uploads/');
  }
}

// Ejecutar solo si se llama directamente
if (require.main === module) {
  testCloudinarySetup().then(() => {
    console.log('\n✨ Pruebas completadas');
    process.exit(0);
  }).catch(error => {
    console.error('\n💥 Error ejecutando pruebas:', error);
    process.exit(1);
  });
}

module.exports = { testCloudinarySetup };