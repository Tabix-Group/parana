#!/usr/bin/env node

// Script de diagnóstico para verificar configuración de Railway
console.log('🔍 DIAGNÓSTICO DE CONFIGURACIÓN RAILWAY');
console.log('=====================================');

// Verificar variables de entorno
console.log('\n📋 Variables de Entorno:');
console.log('VITE_API_URL:', process.env.VITE_API_URL || '❌ NO CONFIGURADA');
console.log('DATABASE_URL:', process.env.DATABASE_URL ? '✅ CONFIGURADA' : '❌ NO CONFIGURADA');
console.log('PGHOST:', process.env.PGHOST || '❌ NO CONFIGURADA');
console.log('NODE_ENV:', process.env.NODE_ENV || 'development');

// Verificar URLs de servicios
console.log('\n🌐 URLs de Servicios:');
if (process.env.VITE_API_URL) {
    console.log('Frontend apunta a:', process.env.VITE_API_URL);
    console.log('Backend esperado en:', process.env.VITE_API_URL.replace('/api', ''));
} else {
    console.log('❌ VITE_API_URL no configurada - frontend usará localhost:4000');
}

// Verificar conectividad
console.log('\n🔗 Verificación de Conectividad:');
if (process.env.VITE_API_URL) {
    const healthUrl = process.env.VITE_API_URL.replace('/api', '/health');
    console.log('Health check URL:', healthUrl);
    console.log('API base URL:', process.env.VITE_API_URL);
} else {
    console.log('❌ No se puede verificar conectividad sin VITE_API_URL');
}

console.log('\n📝 Instrucciones para Railway:');
console.log('1. Ve a tu proyecto en Railway');
console.log('2. Selecciona el servicio del FRONTEND');
console.log('3. Ve a Variables > Add Variable');
console.log('4. Agrega: VITE_API_URL = https://[nombre-del-backend].up.railway.app');
console.log('5. Reemplaza [nombre-del-backend] con el nombre real de tu servicio backend');
console.log('6. Haz deploy del frontend');

console.log('\n✅ Diagnóstico completado');