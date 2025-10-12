# Fix - Edición en Vista Logística

## Problema Identificado
Al intentar editar items desde el modal (icono del lapicito), se producía un error porque los datos combinados no incluían los IDs necesarios para los selects del formulario.

## Causa Raíz
Los objetos en `combinedData` solo tenían los **nombres** de transporte, tipo de transporte y estado, pero no los **IDs** necesarios para pre-llenar los selects en el modal de edición.

### Antes:
```javascript
// combinedData solo tenía:
{
  tipo_transporte: 'Flete',        // ✅ nombre
  transporte: 'Transporte ABC',    // ✅ nombre
  // ❌ Faltaban los IDs:
  // tipo_transporte_id: undefined
  // transporte_id: undefined
  // estado_id: undefined
}
```

### Después:
```javascript
// Ahora incluye tanto nombres como IDs:
{
  tipo_transporte: 'Flete',        // ✅ nombre
  tipo_transporte_id: 3,           // ✅ ID
  transporte: 'Transporte ABC',    // ✅ nombre
  transporte_id: 5,                // ✅ ID
  estado_id: 2                     // ✅ ID
}
```

## Cambios Implementados

### 1. Agregados IDs en Pedidos (combinedData)
```javascript
.map(p => ({
  ...p,
  tipo_transporte: p.tipo_transporte_nombre || 'No disponible',
  tipo_transporte_id: p.tipo_transporte_id || null,  // ← NUEVO
  transporte: p.transporte_nombre || 'No disponible',
  transporte_id: p.transporte_id || null,            // ← NUEVO
  estado_id: p.estado_id || null,                    // ← NUEVO
  // ... resto de campos
}))
```

### 2. Agregados IDs en Devoluciones (combinedData)
```javascript
.map(d => ({
  ...d,
  tipo_transporte: d.tipo_transporte_nombre || 'No disponible',
  tipo_transporte_id: d.tipo_transporte_id || null,  // ← NUEVO
  transporte: d.transporte_nombre || 'No disponible',
  transporte_id: d.transporte_id || null,            // ← NUEVO
  estado_id: d.estado_id || null,                    // ← NUEVO
  // ... resto de campos
}))
```

### 3. Agregados IDs en Entregas (combinedData)
```javascript
.map(e => ({
  ...e,
  tipo_transporte: e.tipo_transporte_nombre || 'No disponible',
  tipo_transporte_id: e.tipo_transporte_id || null,  // ← NUEVO
  transporte: e.transporte_nombre || 'No disponible',
  transporte_id: e.transporte_id || null,            // ← NUEVO
  estado_id: e.estado_id || null,                    // ← NUEVO
  // ... resto de campos
}))
```

### 4. Mejorada función handleEdit
Ahora maneja correctamente el campo `texto` vs `notas` según el tipo:

```javascript
const handleEdit = (item) => {
  setEditingItem(item);
  setEditingTransporte(item.transporte_id || '');      // ✅ Ahora existe
  setEditingTipoTransporte(item.tipo_transporte_id || ''); // ✅ Ahora existe
  
  // Manejar correctamente notas/texto según el tipo
  if (item.tipo === 'Pedido') {
    setEditingNotas(item.notas || '');
  } else if (item.tipo === 'Entrega') {
    setEditingNotas(item.notas || '');
  } else if (item.tipo === 'Devolución') {
    setEditingNotas(item.texto || '');               // ← Campo correcto
  }
  
  setEditingEstado(item.estado_id || '');             // ✅ Ahora existe
  // ... resto de campos
};
```

### 5. Mejor manejo de errores en handleSaveEdit
Agregado logging y alertas para debugging:

```javascript
const handleSaveEdit = async () => {
  try {
    // ... preparar body
    
    console.log('Enviando actualización:', { endpoint, id: editingItem.id, body });
    
    await api.put(`${endpoint}/${editingItem.id}`, body);
    
    // ... éxito
  } catch (error) {
    console.error('Error updating item:', error);
    console.error('Error details:', error.response?.data);
    alert(`Error al actualizar: ${error.response?.data?.message || error.message}`);
  }
};
```

## Flujo Corregido

### Antes (❌ Error):
1. Usuario hace click en el lapicito
2. `handleEdit(item)` intenta acceder a `item.transporte_id`
3. `item.transporte_id` es `undefined` (no existe en combinedData)
4. El select del modal se queda vacío o con valor inválido
5. Al guardar, se envía `null` o valor incorrecto al backend
6. Backend devuelve error

### Ahora (✅ Funciona):
1. Usuario hace click en el lapicito
2. `handleEdit(item)` accede a `item.transporte_id` → valor correcto
3. El select del modal se pre-llena correctamente
4. Usuario modifica campos (o no)
5. Al guardar, se envían valores correctos al backend
6. Backend actualiza correctamente

## Testing Recomendado

### 1. Abrir Modal de Edición
- [ ] Click en lapicito de un Pedido
- [ ] Verificar que todos los selects muestran valores correctos:
  - Tipo de Transporte
  - Transporte
  - Armador
  - Estado
- [ ] Verificar que campos de texto muestran valores correctos:
  - Dirección
  - Cantidad
  - Fecha Entrega
  - Notas

### 2. Repetir para Devolución
- [ ] Click en lapicito de una Devolución
- [ ] Verificar campos igual que arriba
- [ ] Verificar que el campo "Observaciones" muestra el texto correcto

### 3. Repetir para Entrega Parcial
- [ ] Click en lapicito de una Entrega
- [ ] Verificar campos igual que arriba
- [ ] Verificar que "Notas de la Entrega" muestra el valor correcto

### 4. Guardar Cambios
- [ ] Modificar un campo (ej: cambiar tipo de transporte)
- [ ] Click en "Guardar"
- [ ] Verificar en consola el log: "Enviando actualización: ..."
- [ ] Verificar que la tabla se actualiza correctamente
- [ ] Verificar que no hay errores en consola

### 5. Guardar Sin Cambios
- [ ] Abrir modal
- [ ] No cambiar nada
- [ ] Click en "Guardar"
- [ ] Verificar que todo funciona correctamente

## Rollback (si es necesario)

```bash
cd /home/hernan/proyectos/parana
git diff frontend/src/components/Logistica.jsx
# Si hay problemas:
git checkout HEAD -- frontend/src/components/Logistica.jsx
```

## Notas Adicionales

- El error en consola debería desaparecer completamente
- Los selects ahora se pre-llenan correctamente
- El campo de notas/observaciones maneja correctamente cada tipo
- Mejor logging para debugging futuro
