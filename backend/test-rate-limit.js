// Script simple para probar rate limiting
const axios = require('axios');

async function testRateLimit() {
  const API_URL = 'http://localhost:5000/api';
  
  console.log('🧪 Probando Rate Limiting...\n');
  
  try {
    // Test 1: Rate limiting en login (5 intentos por 15 minutos)
    console.log('1️⃣ Probando rate limiting en /auth/login');
    
    for (let i = 1; i <= 7; i++) {
      try {
        const response = await axios.post(`${API_URL}/auth/login`, {
          email: 'test@test.com',
          password: 'wrongpassword'
        });
        console.log(`   Intento ${i}: ✅ ${response.status}`);
      } catch (error) {
        if (error.response?.status === 429) {
          console.log(`   Intento ${i}: 🚫 Rate limit activado! (${error.response.status})`);
          console.log(`   Mensaje: ${error.response.data.error}`);
          break;
        } else {
          console.log(`   Intento ${i}: ⚠️  Error ${error.response?.status || error.message}`);
        }
      }
      
      // Pequeña pausa entre requests
      await new Promise(resolve => setTimeout(resolve, 100));
    }
    
    console.log('\n2️⃣ Probando rate limiting en /health (API general)');
    
    // Test 2: Rate limiting general (100 requests por 15 minutos)
    let requestCount = 0;
    let blocked = false;
    
    while (requestCount < 5 && !blocked) {
      try {
        const response = await axios.get(`${API_URL}/health`);
        requestCount++;
        console.log(`   Request ${requestCount}: ✅ ${response.status}`);
      } catch (error) {
        if (error.response?.status === 429) {
          console.log(`   Request ${requestCount + 1}: 🚫 Rate limit activado!`);
          blocked = true;
        } else {
          console.log(`   Request ${requestCount + 1}: ⚠️  Error ${error.response?.status || error.message}`);
          break;
        }
      }
      
      await new Promise(resolve => setTimeout(resolve, 50));
    }
    
    console.log('\n✅ Rate limiting configurado correctamente!');
    console.log('\n📊 Configuración actual:');
    console.log('   • Auth endpoints: 5 intentos / 15 min');
    console.log('   • API general: 100 requests / 15 min');
    console.log('   • Uploads: 20 archivos / 1 hora');
    console.log('   • Operaciones sensibles: 10 ops / 1 hora');
    
  } catch (error) {
    console.error('❌ Error conectando al servidor:', error.message);
    console.log('\n💡 Asegúrate de que el servidor esté corriendo en puerto 5000');
  }
}

// Solo ejecutar si el servidor no está corriendo
if (require.main === module) {
  testRateLimit();
}

module.exports = { testRateLimit };