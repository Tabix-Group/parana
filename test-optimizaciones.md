# Checklist de Validación - Optimizaciones Logística

## ✅ Funcionalidades a Validar en Producción

### 1. Checkboxes
- [ ] Checkbox "Ok" responde instantáneamente al click
- [ ] Checkbox "Completado" responde instantáneamente al click
- [ ] Al desmarcar un pedido como completado, sus entregas también se desmarcan
- [ ] Los cambios persisten correctamente en la base de datos
- [ ] Si hay error de red, el checkbox vuelve a su estado anterior

### 2. Filtros de Texto (con debounce de 300ms)
- [ ] Filtro por Vendedor funciona correctamente
- [ ] Filtro por Cliente funciona correctamente
- [ ] Filtro por Comprobante funciona correctamente
- [ ] Filtro por Armador funciona correctamente
- [ ] Filtro por Tipo de Transporte funciona correctamente
- [ ] Filtro por Transporte funciona correctamente
- [ ] Los filtros tienen un pequeño delay (300ms) al escribir - ESTO ES NORMAL

### 3. Filtros de Select (sin debounce)
- [ ] Filtro por Estado funciona inmediatamente
- [ ] Filtro por Completado funciona inmediatamente
- [ ] Filtro por Ok funciona inmediatamente
- [ ] Filtro por Fecha Entrega funciona inmediatamente

### 4. Tabla y Visualización
- [ ] La tabla muestra correctamente todos los datos
- [ ] Vendedor, Estado y Armador se muestran correctamente en cada fila
- [ ] Las entregas parciales se visualizan correctamente
- [ ] Los pedidos completados se ven con estilo atenuado
- [ ] La paginación funciona correctamente

### 5. Operaciones CRUD
- [ ] Editar pedido/entrega funciona correctamente
- [ ] Crear entrega parcial funciona correctamente
- [ ] Los cambios se reflejan inmediatamente en la tabla

### 6. Exportaciones
- [ ] Exportar a Excel funciona y muestra datos correctos
- [ ] Exportar a PDF funciona y muestra datos correctos
- [ ] Los datos exportados incluyen correctamente vendedor, estado, armador

### 7. Rendimiento Percibido
- [ ] Los checkboxes responden MUCHO más rápido que antes
- [ ] Los filtros no causan lag al escribir rápido
- [ ] La tabla carga más rápido
- [ ] Cambiar de página es más fluido

## 🔍 Qué Observar

### Comportamientos Normales (NO son bugs):
1. **Delay de 300ms en filtros de texto:** Es intencional para optimizar rendimiento
2. **Optimistic updates:** Los checkboxes cambian antes de que el servidor responda
3. **Revert automático:** Si hay error de red, el checkbox vuelve al estado anterior

### Posibles Problemas a Reportar:
1. Checkbox que no cambia de estado
2. Filtros que no funcionan
3. Datos que no se muestran correctamente
4. Errores en consola del navegador (F12)
5. Exportaciones con datos incorrectos

## 📊 Comparación Esperada

| Acción | Antes | Después |
|--------|-------|---------|
| Click en checkbox | Tarda 1-2 segundos | Instantáneo (< 0.1s) |
| Filtrar al escribir | Lag en cada letra | Fluido con debounce |
| Cargar tabla inicial | ~1 segundo | ~0.3 segundos |

## 🚀 Rollback (si es necesario)

Si algo no funciona correctamente, ejecutar:
```bash
cd /home/hernan/proyectos/parana
git checkout HEAD -- frontend/src/components/Logistica.jsx
```

Esto restaurará la versión anterior del archivo.
