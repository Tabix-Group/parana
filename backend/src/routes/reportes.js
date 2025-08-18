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
        db.raw("TRIM(COALESCE(armadores.nombre,'') || ' ' || COALESCE(armadores.apellido,'')) as nombre"),
        db.raw('SUM(COALESCE(pedidos.cant_bultos,0)) as totalBultos'),
        db.raw('COUNT(pedidos.id) as pedidos')
      )
      .groupBy('armadores.nombre', 'armadores.apellido')
      .orderBy('totalBultos', 'desc');

    applyDateFilter(query, from, to);
    const rows = await query;
    const norm = rows.map(r => ({ nombre: r.nombre || 'Sin armador', totalBultos: r.totalBultos, pedidos: r.pedidos }));
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
        db.raw("TRIM(COALESCE(vendedores.nombre,'') || ' ' || COALESCE(vendedores.apellido,'')) as nombre"),
        db.raw('SUM(COALESCE(pedidos.cant_bultos,0)) as totalBultos'),
        db.raw('COUNT(pedidos.id) as pedidos')
      )
      .groupBy('vendedores.nombre', 'vendedores.apellido')
      .orderBy('totalBultos', 'desc');

    applyDateFilter(query, from, to);
    const rows = await query;
    const norm = rows.map(r => ({ nombre: r.nombre || 'Sin vendedor', totalBultos: r.totalBultos, pedidos: r.pedidos }));
    res.json(norm);
  } catch (err) {
    console.error('Error GET /reportes/por-vendedor', err);
    res.status(500).json({ error: err.message });
  }
});

export default router;
