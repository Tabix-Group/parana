import express from 'express';
import { db } from '../index.js';

const router = express.Router();

// Listar pedidos con paginación, filtros y orden
router.get('/', async (req, res) => {
  const { page = 1, pageSize = 10, sortBy = 'id', order = 'desc', estado, cliente, comprobante } = req.query;
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
      'armadores.nombre as armador_nombre',
      'armadores.apellido as armador_apellido',
      'tipos_transporte.nombre as tipo_transporte_nombre',
      'transportes.nombre as transporte_nombre',
      'vendedores.nombre as vendedor_nombre',
      'vendedores.apellido as vendedor_apellido',
      'estados.nombre as estado_nombre'
    );
  if (estado) query = query.where('pedidos.estado_id', estado);
  if (cliente) query = query.where('pedidos.cliente_id', cliente);
  if (comprobante) query = query.where('pedidos.comprobante', 'like', `%${comprobante}%`);
  const total = await query.clone().count({ count: '*' }).first();
  const data = await query.orderBy(sortBy, order).limit(pageSize).offset((page - 1) * pageSize);
  res.json({ data, total: total.count });
});

// Crear pedido
router.post('/', async (req, res) => {
  const pedido = req.body;
  const [id] = await db('pedidos').insert(pedido);
  res.json({ id });
});

// Obtener pedido por id
router.get('/:id', async (req, res) => {
  const pedido = await db('pedidos').where({ id: req.params.id }).first();
  res.json(pedido);
});

// Editar pedido
router.put('/:id', async (req, res) => {
  await db('pedidos').where({ id: req.params.id }).update(req.body);
  res.sendStatus(204);
});

// Borrar pedido
router.delete('/:id', async (req, res) => {
  await db('pedidos').where({ id: req.params.id }).del();
  res.sendStatus(204);
});

export default router;
