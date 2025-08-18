import express from 'express';
import { db } from '../index.js';

const router = express.Router();

function applyDateFilter(qb, from, to) {
  if (from) qb.whereRaw("DATE(pedidos.fecha_pedido) >= ?", [from]);
  if (to) qb.whereRaw("DATE(pedidos.fecha_pedido) <= ?", [to]);
}

router.get('/por-transporte', async (req, res) => {
  try {
    const { from, to } = req.query;
    const query = db('pedidos')
      .leftJoin('transportes', 'pedidos.transporte_id', 'transportes.id')
      .select(
        db.raw("COALESCE(transportes.nombre, 'Sin transporte') as nombre"),
        db.raw('SUM(COALESCE(pedidos.cant_bultos,0)) as totalBultos'),
        db.raw('COUNT(pedidos.id) as pedidos')
      )
      .groupBy('transportes.nombre')
      .orderBy('totalBultos', 'desc');

    applyDateFilter(query, from, to);
    const rows = await query;
    res.json(rows);
  } catch (err) {
    console.error('Error GET /reportes/por-transporte', err);
    res.status(500).json({ error: err.message });
  }
});

router.get('/por-armador', async (req, res) => {
  try {
    const { from, to } = req.query;
    const query = db('pedidos')
      .leftJoin('armadores', 'pedidos.armador_id', 'armadores.id')
      .select(
        'armadores.id as armador_id',
        db.raw("COALESCE(TRIM(COALESCE(armadores.nombre,'') || ' ' || COALESCE(armadores.apellido,'')), 'Sin armador') as nombre"),
        db.raw('SUM(COALESCE(pedidos.cant_bultos,0)) as totalBultos'),
        db.raw('COUNT(pedidos.id) as pedidos')
      )
      .groupBy('armadores.id')
      .orderBy('totalBultos', 'desc');

    applyDateFilter(query, from, to);
    const rows = await query;
  const norm = rows.map(r => ({ nombre: r.nombre || 'Sin armador', totalBultos: r.totalBultos, pedidos: r.pedidos, armador_id: r.armador_id }));
  res.json(norm);
  } catch (err) {
    console.error('Error GET /reportes/por-armador', err);
    res.status(500).json({ error: err.message });
  }
});

router.get('/por-vendedor', async (req, res) => {
  try {
    const { from, to } = req.query;
    const query = db('pedidos')
      .leftJoin('vendedores', 'pedidos.vendedor_id', 'vendedores.id')
      .select(
        'vendedores.id as vendedor_id',
        db.raw("COALESCE(TRIM(COALESCE(vendedores.nombre,'') || ' ' || COALESCE(vendedores.apellido,'')), 'Sin vendedor') as nombre"),
        db.raw('SUM(COALESCE(pedidos.cant_bultos,0)) as totalBultos'),
        db.raw('COUNT(pedidos.id) as pedidos')
      )
      .groupBy('vendedores.id')
      .orderBy('totalBultos', 'desc');

    applyDateFilter(query, from, to);
    const rows = await query;
  const norm = rows.map(r => ({ nombre: r.nombre || 'Sin vendedor', totalBultos: r.totalBultos, pedidos: r.pedidos, vendedor_id: r.vendedor_id }));
  res.json(norm);
  } catch (err) {
    console.error('Error GET /reportes/por-vendedor', err);
    res.status(500).json({ error: err.message });
  }
});

export default router;
