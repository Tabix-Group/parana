import express from 'express';
import { db } from '../index.js';

const router = express.Router();

router.get('/', async (req, res) => {
  const { page = 1, pageSize = 10, sortBy = 'id', order = 'desc', nombre } = req.query;
  let query = db('transportes');
  if (nombre) query = query.where('nombre', 'like', `%${nombre}%`);
  const total = await query.clone().count({ count: '*' }).first();
  const data = await query.orderBy(sortBy, order).limit(pageSize).offset((page - 1) * pageSize);
  res.json({ data, total: total.count });
});

router.post('/', async (req, res) => {
  const [id] = await db('transportes').insert(req.body);
  res.json({ id });
});

router.get('/:id', async (req, res) => {
  const transporte = await db('transportes').where({ id: req.params.id }).first();
  res.json(transporte);
});

router.put('/:id', async (req, res) => {
  await db('transportes').where({ id: req.params.id }).update(req.body);
  res.sendStatus(204);
});

router.delete('/:id', async (req, res) => {
  await db('transportes').where({ id: req.params.id }).del();
  res.sendStatus(204);
});

export default router;
