import express from 'express';
import { db } from '../index.js';

const router = express.Router();

// Listar pedidos con paginación, filtros y orden
router.get('/', async (req, res) => {
  const { page = 1, pageSize = 10, sortBy = 'id', order = 'desc', estado, cliente, comprobante, parcial, fecha_entrega, fecha_pedido } = req.query;
  // Filtros para ambos queries - mostrar todos los pedidos en la vista principal
  let baseQuery = db('pedidos');
  if (parcial === 'true') {
    baseQuery = baseQuery.leftJoin('estados', 'pedidos.estado_id', 'estados.id').where('estados.nombre', 'like', '%Parcial%');
  } else if (estado) {
    baseQuery = baseQuery.where('pedidos.estado_id', estado);
  }
  if (cliente) baseQuery = baseQuery.where('pedidos.cliente_id', cliente);
  if (comprobante) baseQuery = baseQuery.where('pedidos.comprobante', 'like', `%${comprobante}%`);
  if (fecha_entrega) {
    // Usar comparación directa de fecha sin conversiones UTC problemáticas
    baseQuery = baseQuery.whereRaw('DATE(pedidos.fecha_entrega) = ?', [fecha_entrega]);
  }
  if (fecha_pedido) {
    // Usar comparación directa de fecha sin conversiones UTC problemáticas
    baseQuery = baseQuery.whereRaw('DATE(pedidos.fecha_pedido) = ?', [fecha_pedido]);
  }

  // Consulta de conteo (sin joins extra)
  const totalResult = await db('pedidos').modify(qb => {
    if (parcial === 'true') {
      qb.leftJoin('estados', 'pedidos.estado_id', 'estados.id').where('estados.nombre', 'like', '%Parcial%');
    } else if (estado) {
      qb.where('pedidos.estado_id', estado);
    }
    if (cliente) qb.where('pedidos.cliente_id', cliente);
    if (comprobante) qb.where('pedidos.comprobante', 'like', `%${comprobante}%`);
    if (fecha_entrega) {
      // Manejo específico para PostgreSQL vs SQLite
      if (db.client.config.client === 'pg') {
        // PostgreSQL: usar comparación directa de fecha
        qb.whereRaw('DATE(pedidos.fecha_entrega) = ?', [fecha_entrega]);
      } else {
        // SQLite: usar método robusto con múltiples comparaciones
        const fechaFiltro = new Date(fecha_entrega + 'T00:00:00.000Z').toISOString().split('T')[0];
        qb.where(function() {
          this.whereRaw('DATE(pedidos.fecha_entrega) = ?', [fechaFiltro])
              .orWhereRaw('pedidos.fecha_entrega = ?', [fechaFiltro])
              .orWhereRaw('DATE(pedidos.fecha_entrega) = DATE(?)', [fecha_entrega]);
        });
      }
    }
    if (fecha_pedido) {
      // Manejo específico para PostgreSQL vs SQLite
      if (db.client.config.client === 'pg') {
        // PostgreSQL: usar comparación directa de fecha
        qb.whereRaw('DATE(pedidos.fecha_pedido) = ?', [fecha_pedido]);
      } else {
        // SQLite: usar método robusto con múltiples comparaciones
        const fechaFiltro = new Date(fecha_pedido + 'T00:00:00.000Z').toISOString().split('T')[0];
        qb.where(function() {
          this.whereRaw('DATE(pedidos.fecha_pedido) = ?', [fechaFiltro])
              .orWhereRaw('pedidos.fecha_pedido = ?', [fechaFiltro])
              .orWhereRaw('DATE(pedidos.fecha_pedido) = DATE(?)', [fecha_pedido]);
        });
      }
    }
  }).count({ count: '*' }).first();
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
    query = query.where('estados.nombre', 'like', '%Parcial%');
  } else if (estado) {
    query = query.where('pedidos.estado_id', estado);
  }
  if (cliente) query = query.where('pedidos.cliente_id', cliente);
  if (comprobante) query = query.where('pedidos.comprobante', 'like', `%${comprobante}%`);
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
        'pedidos.*',
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
  const { en_logistica } = req.body;
  await db('pedidos').where({ id: req.params.id }).update({ en_logistica: !!en_logistica });
  res.json({ success: true });
});

// Marcar pedido como completado
router.put('/:id/completado', async (req, res) => {
  await db('pedidos').where({ id: req.params.id }).update({ completado: true });
  res.json({ success: true });
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
