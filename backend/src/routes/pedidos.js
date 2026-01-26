import express from 'express';
import { db } from '../index.js';

const router = express.Router();

// Listar pedidos con paginación, filtros y orden
router.get('/', async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    let pageSize = parseInt(req.query.pageSize) || 10;
    const sortBy = req.query.sortBy || 'id';
    const order = req.query.order || 'desc';
    const { estado, cliente, comprobante, parcial, fecha_entrega, fecha_pedido, armador, vendedor, transporte } = req.query;

    if (req.query.pageSize === '0') pageSize = 100000;

    // Filtros para ambos queries - usar joins para permitir filtros por nombre o id
    let baseQuery = db('pedidos')
    .leftJoin('clientes', 'pedidos.cliente_id', 'clientes.id')
    .leftJoin('armadores', 'pedidos.armador_id', 'armadores.id')
    .leftJoin('transportes', 'pedidos.transporte_id', 'transportes.id')
    .leftJoin('vendedores', 'pedidos.vendedor_id', 'vendedores.id');
  if (parcial === 'true') {
    baseQuery = baseQuery.leftJoin('estados', 'pedidos.estado_id', 'estados.id').whereRaw('lower(estados.nombre) like ?', ['%parcial%']);
  } else if (estado) {
    baseQuery = baseQuery.where('pedidos.estado_id', estado);
  }
  // Cliente: si es numérico asumir id, si no hacer búsqueda por nombre
  if (cliente) {
    if (/^\d+$/.test(String(cliente))) {
      baseQuery = baseQuery.where('pedidos.cliente_id', cliente);
    } else {
      baseQuery = baseQuery.where('clientes.nombre', 'like', `%${cliente}%`);
    }
  }
  // Armador: id o nombre
  if (armador) {
    if (/^\d+$/.test(String(armador))) baseQuery = baseQuery.where('pedidos.armador_id', armador);
    else baseQuery = baseQuery.where('armadores.nombre', 'like', `%${armador}%`);
  }
  // Vendedor: id o nombre
  if (vendedor) {
    if (/^\d+$/.test(String(vendedor))) baseQuery = baseQuery.where('pedidos.vendedor_id', vendedor);
    else baseQuery = baseQuery.where('vendedores.nombre', 'like', `%${vendedor}%`);
  }
  // Transporte: id o nombre
  if (transporte) {
    if (/^\d+$/.test(String(transporte))) baseQuery = baseQuery.where('pedidos.transporte_id', transporte);
    else baseQuery = baseQuery.where('transportes.nombre', 'like', `%${transporte}%`);
  }
  if (comprobante) baseQuery = baseQuery.where('pedidos.comprobante', 'like', `%${comprobante}%`);
  if (fecha_entrega) {
    // Usar comparación directa de fecha sin conversiones UTC problemáticas
    baseQuery = baseQuery.whereRaw('DATE(pedidos.fecha_entrega) = ?', [fecha_entrega]);
  }
  if (fecha_pedido) {
    // Usar comparación directa de fecha sin conversiones UTC problemáticas
    baseQuery = baseQuery.whereRaw('DATE(pedidos.fecha_pedido) = ?', [fecha_pedido]);
  }

  // Consulta de conteo con los mismos joins para evitar discrepancias
  const totalResult = await db('pedidos')
    .leftJoin('clientes', 'pedidos.cliente_id', 'clientes.id')
    .leftJoin('armadores', 'pedidos.armador_id', 'armadores.id')
    .leftJoin('transportes', 'pedidos.transporte_id', 'transportes.id')
    .leftJoin('vendedores', 'pedidos.vendedor_id', 'vendedores.id')
    .modify(qb => {
      if (parcial === 'true') {
        qb.leftJoin('estados', 'pedidos.estado_id', 'estados.id').where('estados.nombre', 'like', '%Parcial%');
      } else if (estado) {
        qb.where('pedidos.estado_id', estado);
      }
      // Aplicar mismos filtros usados arriba
      if (cliente) {
        if (/^\d+$/.test(String(cliente))) qb.where('pedidos.cliente_id', cliente);
        else qb.whereRaw('lower(clientes.nombre) like ?', [`%${String(cliente).toLowerCase()}%`]);
      }
      if (armador) {
        if (/^\d+$/.test(String(armador))) qb.where('pedidos.armador_id', armador);
        else qb.whereRaw('lower(armadores.nombre) like ?', [`%${String(armador).toLowerCase()}%`]);
      }
      if (vendedor) {
        if (/^\d+$/.test(String(vendedor))) qb.where('pedidos.vendedor_id', vendedor);
        else qb.whereRaw('lower(vendedores.nombre) like ?', [`%${String(vendedor).toLowerCase()}%`]);
      }
      if (transporte) {
        if (/^\d+$/.test(String(transporte))) qb.where('pedidos.transporte_id', transporte);
        else qb.whereRaw('lower(transportes.nombre) like ?', [`%${String(transporte).toLowerCase()}%`]);
      }
      if (comprobante) qb.where('pedidos.comprobante', 'like', `%${comprobante}%`);
      if (fecha_entrega) {
        if (db.client.config.client === 'pg') {
          qb.whereRaw('DATE(pedidos.fecha_entrega) = ?', [fecha_entrega]);
        } else {
          const fechaFiltro = new Date(fecha_entrega + 'T00:00:00.000Z').toISOString().split('T')[0];
          qb.where(function () {
            this.whereRaw('DATE(pedidos.fecha_entrega) = ?', [fechaFiltro])
              .orWhereRaw('pedidos.fecha_entrega = ?', [fechaFiltro])
              .orWhereRaw('DATE(pedidos.fecha_entrega) = DATE(?)', [fecha_entrega]);
          });
        }
      }
      if (fecha_pedido) {
        if (db.client.config.client === 'pg') {
          qb.whereRaw('DATE(pedidos.fecha_pedido) = ?', [fecha_pedido]);
        } else {
          const fechaFiltro = new Date(fecha_pedido + 'T00:00:00.000Z').toISOString().split('T')[0];
          qb.where(function () {
            this.whereRaw('DATE(pedidos.fecha_pedido) = ?', [fechaFiltro])
              .orWhereRaw('pedidos.fecha_pedido = ?', [fechaFiltro])
              .orWhereRaw('DATE(pedidos.fecha_pedido) = DATE(?)', [fecha_pedido]);
          });
        }
      }
    }).countDistinct({ count: 'pedidos.id' }).first();
  const total = totalResult ? totalResult.count : 0;

  // Consulta de datos con joins y paginación
  let query = db('pedidos')
    .leftJoin('clientes', 'pedidos.cliente_id', 'clientes.id')
    .leftJoin('armadores', 'pedidos.armador_id', 'armadores.id')
    .leftJoin('tipos_transporte', 'pedidos.tipo_transporte_id', 'tipos_transporte.id')
    .leftJoin('transportes', 'pedidos.transporte_id', 'transportes.id')
    .leftJoin('vendedores', 'pedidos.vendedor_id', 'vendedores.id')
    .leftJoin('estados', 'pedidos.estado_id', 'estados.id')
    .select(
      'pedidos.*',
      'clientes.nombre as cliente_nombre',
      'clientes.nombre as cliente', // para Logistica
      'pedidos.fecha_entrega as fecha', // para Logistica
      'armadores.nombre as armador_nombre',
      'armadores.apellido as armador_apellido',
      'tipos_transporte.nombre as tipo_transporte_nombre',
      'transportes.nombre as transporte_nombre',
      'transportes.nombre as transporte', // para Logistica
      'vendedores.nombre as vendedor_nombre',
      'vendedores.apellido as vendedor_apellido',
      'estados.nombre as estado_nombre',
      'estados.nombre as estado' // para Logistica
    );
  if (parcial === 'true') {
    query = query.whereRaw('lower(estados.nombre) like ?', ['%parcial%']);
  } else if (estado) {
    query = query.where('pedidos.estado_id', estado);
  }
  if (cliente) {
    if (/^\d+$/.test(String(cliente))) query = query.where('pedidos.cliente_id', cliente);
    else query = query.whereRaw('lower(clientes.nombre) like ?', [`%${String(cliente).toLowerCase()}%`]);
  }
  if (armador) {
    if (/^\d+$/.test(String(armador))) query = query.where('pedidos.armador_id', armador);
    else query = query.whereRaw('lower(armadores.nombre) like ?', [`%${String(armador).toLowerCase()}%`]);
  }
  if (vendedor) {
    if (/^\d+$/.test(String(vendedor))) query = query.where('pedidos.vendedor_id', vendedor);
    else query = query.whereRaw('lower(vendedores.nombre) like ?', [`%${String(vendedor).toLowerCase()}%`]);
  }
  if (transporte) {
    if (/^\d+$/.test(String(transporte))) query = query.where('pedidos.transporte_id', transporte);
    else query = query.whereRaw('lower(transportes.nombre) like ?', [`%${String(transporte).toLowerCase()}%`]);
  }
  if (comprobante) query = query.whereRaw('lower(pedidos.comprobante) like ?', [`%${String(comprobante).toLowerCase()}%`]);
  if (fecha_entrega) {
    // Usar comparación directa de fecha sin conversiones UTC problemáticas
    query = query.whereRaw('DATE(pedidos.fecha_entrega) = ?', [fecha_entrega]);
  }
  if (fecha_pedido) {
    // Usar comparación directa de fecha sin conversiones UTC problemáticas
    query = query.whereRaw('DATE(pedidos.fecha_pedido) = ?', [fecha_pedido]);
  }
  const data = await query.orderBy(sortBy, order).limit(pageSize).offset((page - 1) * pageSize);
  res.json({ data, total });
} catch (err) {
  console.error('Error GET /pedidos:', err);
  res.status(500).json({ error: err.message });
}
});

// Crear pedido
router.post('/', async (req, res) => {
  try {
    const pedido = { ...req.body };

    // Procesar fechas para evitar problemas de timezone
    if (pedido.fecha_pedido) {
      // Asegurar que la fecha se guarde exactamente como viene del frontend
      pedido.fecha_pedido = pedido.fecha_pedido.split('T')[0];
    }
    if (pedido.fecha_entrega) {
      // Asegurar que la fecha se guarde exactamente como viene del frontend
      pedido.fecha_entrega = pedido.fecha_entrega.split('T')[0];
    }

    // Asegurar cant_bultos siempre sea número (0 si viene vacío/null)
    if (pedido.cant_bultos === '' || pedido.cant_bultos === null || pedido.cant_bultos === undefined) {
      pedido.cant_bultos = 0;
    } else {
      pedido.cant_bultos = Number(pedido.cant_bultos);
      if (isNaN(pedido.cant_bultos)) pedido.cant_bultos = 0;
    }

    let id;
    if (db.client.config.client === 'pg') {
      id = (await db('pedidos').insert(pedido).returning('id'))[0].id;
    } else {
      id = await db('pedidos').insert(pedido);
    }
    res.status(200).json({ id });
  } catch (err) {
    console.error('Error POST /pedidos:', err);
    res.status(500).json({ error: err.message });
  }
});

// Obtener pedidos para logística (los que están marcados como en_logistica = true)
router.get('/logistica', async (req, res) => {
  try {
    const pedidos = await db('pedidos')
      .select([
        'pedidos.id',
        'pedidos.comprobante',
        'pedidos.direccion',
        'pedidos.fecha_entrega',
        'pedidos.fecha_completado',
        'pedidos.cant_bultos',
        'pedidos.tipo_bultos',
        'pedidos.notas',
        'pedidos.en_logistica',
        'pedidos.completado',
        'pedidos.ok',
        'pedidos.Codigo',
        'pedidos.vendedor_id',
        'pedidos.estado_id',
        'pedidos.armador_id',
        'pedidos.tipo_transporte_id',
        'pedidos.transporte_id',
        'clientes.nombre as cliente_nombre',
        'clientes.Codigo as cliente_codigo',
        'clientes.direccion as cliente_direccion',
        'armadores.nombre as armador_nombre',
        'armadores.apellido as armador_apellido',
        'estados.nombre as estado_nombre',
        'tipos_transporte.nombre as tipo_transporte_nombre',
        'transportes.nombre as transporte_nombre',
        'vendedores.nombre as vendedor_nombre',
        'vendedores.apellido as vendedor_apellido'
      ])
      .leftJoin('clientes', 'pedidos.cliente_id', 'clientes.id')
      .leftJoin('armadores', 'pedidos.armador_id', 'armadores.id')
      .leftJoin('estados', 'pedidos.estado_id', 'estados.id')
      .leftJoin('tipos_transporte', 'pedidos.tipo_transporte_id', 'tipos_transporte.id')
      .leftJoin('transportes', 'pedidos.transporte_id', 'transportes.id')
      .leftJoin('vendedores', 'pedidos.vendedor_id', 'vendedores.id')
      .where('pedidos.en_logistica', true)
      .orderBy('pedidos.fecha_entrega', 'asc');

    res.json(pedidos);
  } catch (error) {
    console.error('Error al obtener pedidos de logística:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// Obtener pedido por id
router.get('/:id', async (req, res) => {
  const pedido = await db('pedidos').where({ id: req.params.id }).first();
  res.json(pedido);
});

// Marcar/desmarcar pedido para logística
router.put('/:id/logistica', async (req, res) => {
  try {
    const { en_logistica } = req.body;
    const pedidoId = req.params.id;

    console.log(`🔄 Actualizando pedido ${pedidoId} - en_logistica: ${en_logistica}`);

    // Actualizar el pedido
    await db('pedidos').where({ id: pedidoId }).update({ en_logistica: !!en_logistica });

    // Si se está quitando de logística, las entregas desaparecerán automáticamente
    // del endpoint /api/entregas/logistica porque filtra por pedidos.en_logistica = true

    console.log(`✅ Pedido ${pedidoId} actualizado correctamente`);
    res.json({ success: true });
  } catch (error) {
    console.error('❌ Error PUT /pedidos/:id/logistica:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// Marcar pedido como completado
router.put('/:id/completado', async (req, res) => {
  try {
    const pedidoId = req.params.id;
    const { completado } = req.body;

    // Si se está marcando como completado, validar entregas parciales
    if (completado !== false) {
      // Verificar si el pedido tiene entregas parciales
      const entregasCount = await db('entregas').where('pedido_id', pedidoId).count('id as count').first();

      if (entregasCount.count > 0) {
        // Si tiene entregas parciales, verificar si todas están completadas
        const entregasCompletadas = await db('entregas')
          .where('pedido_id', pedidoId)
          .where('completado', true)
          .count('id as count')
          .first();

        if (entregasCompletadas.count !== entregasCount.count) {
          return res.status(400).json({
            error: 'No se puede marcar como completado. El pedido tiene entregas parciales pendientes.'
          });
        }
      }
    }

    // Actualizar estado del pedido
    const now = new Date().toISOString().split('T')[0];
    const updateData = { 
      completado: completado !== false 
    };

    if (completado !== false) {
      updateData.fecha_completado = now;
    } else {
      updateData.fecha_completado = null;
    }

    await db('pedidos').where({ id: pedidoId }).update(updateData);
    res.json({ success: true });
  } catch (error) {
    console.error('Error PUT /pedidos/:id/completado:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// Marcar/Desmarcar campo OK
router.put('/:id/ok', async (req, res) => {
  const { ok } = req.body;
  await db('pedidos').where({ id: req.params.id }).update({ ok: !!ok });
  res.json({ success: true });
});

// Editar pedido
router.put('/:id', async (req, res) => {
  try {
    const datos = { ...req.body };

    // Procesar fechas para evitar problemas de timezone
    if (datos.fecha_pedido) {
      // Asegurar que la fecha se guarde exactamente como viene del frontend
      datos.fecha_pedido = datos.fecha_pedido.split('T')[0];
    }
    if (datos.fecha_entrega) {
      // Asegurar que la fecha se guarde exactamente como viene del frontend
      datos.fecha_entrega = datos.fecha_entrega.split('T')[0];
    }

    // Coerce cant_bultos on update as well
    if (datos.cant_bultos === '' || datos.cant_bultos === null || datos.cant_bultos === undefined) {
      datos.cant_bultos = 0;
    } else {
      datos.cant_bultos = Number(datos.cant_bultos);
      if (isNaN(datos.cant_bultos)) datos.cant_bultos = 0;
    }

    await db('pedidos').where({ id: req.params.id }).update(datos);
    res.status(200).json({ success: true });
  } catch (err) {
    console.error('Error PUT /pedidos:', err);
    res.status(500).json({ error: err.message });
  }
});

// Borrar pedido
router.delete('/:id', async (req, res) => {
  await db('pedidos').where({ id: req.params.id }).del();
  res.status(200).json({ success: true });
});

export default router;
