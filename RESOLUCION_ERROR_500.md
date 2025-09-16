# Resolución del Error 500 en Producción - Tabla Entregas

## Problema
El endpoint `/api/entregas` está devolviendo error 500 en producción porque la tabla `entregas` no existe en la base de datos de Railway.

## Solución

### Opción 1: Ejecutar script de creación manual (Recomendado)

1. Conecta a tu aplicación en Railway
2. Abre la terminal/shell de Railway
3. Navega al directorio del backend:
   ```bash
   cd backend
   ```
4. Ejecuta el script de creación:
   ```bash
   npm run create-entregas
   ```

### Opción 2: Ejecutar directamente el archivo

1. En la terminal de Railway:
   ```bash
   cd backend/src
   node crear-entregas.js
   ```

### Opción 3: Usar el endpoint de diagnóstico

Antes de crear la tabla, puedes verificar el estado:

1. Visita: `https://tu-app-railway.up.railway.app/api/entregas/diagnostico`
2. Esto te mostrará si la tabla existe y el estado de las tablas relacionadas

### Verificación

Después de ejecutar cualquiera de las opciones anteriores:

1. Visita el endpoint de diagnóstico: `/api/entregas/diagnostico`
2. Deberías ver `"tablaExiste": true`
3. Prueba el endpoint principal: `/api/entregas?pageSize=1000`
4. Debería funcionar sin errores

## Archivos modificados

- `backend/src/routes/entregas.js`: Mejorado manejo de errores y agregado endpoint de diagnóstico
- `backend/src/crear-entregas.js`: Script para crear la tabla entregas manualmente
- `backend/package.json`: Agregado script `create-entregas`

## Notas importantes

- El script es seguro de ejecutar múltiples veces (no recreará la tabla si ya existe)
- Verifica que todas las tablas relacionadas (`pedidos`, `clientes`, etc.) existan antes de crear `entregas`
- En desarrollo local, las migraciones deberían crear la tabla automáticamente
- En producción, Railway no ejecuta las migraciones automáticamente al desplegar