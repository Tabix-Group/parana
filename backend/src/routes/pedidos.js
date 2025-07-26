import express from 'express';
import { db } from '../index.js';

const router = express.Router();

// Listar pedidos con paginación, filtros y orden
router.get('/', async (req, res) => {
  const { page = 1, pageSize = 10, sortBy = 'id', order = 'desc', estado, cliente, comprobante, parcial, fecha_entrega } = req.query;
  // Filtros para ambos queries
  let baseQuery = db('pedidos');
  if (parcial === 'true') {
    baseQuery = baseQuery.leftJoin('estados', 'pedidos.estado_id', 'estados.id').where('estados.nombre', 'like', '%Parcial%');
  } else if (estado) {
    baseQuery = baseQuery.where('pedidos.estado_id', estado);
  }
  if (cliente) baseQuery = baseQuery.where('pedidos.cliente_id', cliente);
  if (comprobante) baseQuery = baseQuery.where('pedidos.comprobante', 'like', `%${comprobante}%`);
  if (fecha_entrega) baseQuery = baseQuery.where('pedidos.fecha_entrega', fecha_entrega);

  // Consulta de conteo (sin joins extra)
  const totalResult = await db('pedidos').modify(qb => {
    if (parcial === 'true') {
      qb.leftJoin('estados', 'pedidos.estado_id', 'estados.id').where('estados.nombre', 'like', '%Parcial%');
    } else if (estado) {
      qb.where('pedidos.estado_id', estado);
    }
    if (cliente) qb.where('pedidos.cliente_id', cliente);
    if (comprobante) qb.where('pedidos.comprobante', 'like', `%${comprobante}%`);
    if (fecha_entrega) qb.where('pedidos.fecha_entrega', fecha_entrega);
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
  if (fecha_entrega) query = query.where('pedidos.fecha_entrega', fecha_entrega);
  const data = await query.orderBy(sortBy, order).limit(pageSize).offset((page - 1) * pageSize);
  res.json({ data, total });
});

// Crear pedido
router.post('/', async (req, res) => {
  try {
    const pedido = req.body;
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

// Obtener pedido por id
router.get('/:id', async (req, res) => {
  const pedido = await db('pedidos').where({ id: req.params.id }).first();
  res.json(pedido);
});

// Editar pedido
router.put('/:id', async (req, res) => {
  await db('pedidos').where({ id: req.params.id }).update(req.body);
  res.status(200).json({ success: true });
});

// Borrar pedido
router.delete('/:id', async (req, res) => {
  await db('pedidos').where({ id: req.params.id }).del();
  res.status(200).json({ success: true });
});

export default router;
