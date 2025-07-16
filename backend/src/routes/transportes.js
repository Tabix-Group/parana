import express from 'express';
import { db } from '../index.js';

const router = express.Router();

router.get('/', async (req, res) => {
  const { page = 1, pageSize = 10, sortBy = 'id', order = 'desc', nombre } = req.query;
  let query = db('transportes');
  if (nombre) query = query.where('nombre', 'like', `%${nombre}%`);
  const totalResult = await db('transportes').modify(qb => {
    if (nombre) qb.where('nombre', 'like', `%${nombre}%`);
  }).count({ count: '*' }).first();
  const total = totalResult ? totalResult.count : 0;
  const data = await query.orderBy(sortBy, order).limit(pageSize).offset((page - 1) * pageSize);
  res.json({ data, total });
});

router.post('/', async (req, res) => {
  try {
    let id;
    if (db.client.config.client === 'pg') {
      id = (await db('transportes').insert(req.body).returning('id'))[0].id;
    } else {
      id = await db('transportes').insert(req.body);
    }
    res.status(200).json({ id });
  } catch (err) {
    console.error('Error POST /transportes:', err);
    res.status(500).json({ error: err.message });
  }
});

router.get('/:id', async (req, res) => {
  const transporte = await db('transportes').where({ id: req.params.id }).first();
  res.json(transporte);
});

router.put('/:id', async (req, res) => {
  await db('transportes').where({ id: req.params.id }).update(req.body);
  res.status(200).json({ success: true });
});

router.delete('/:id', async (req, res) => {
  await db('transportes').where({ id: req.params.id }).del();
  res.status(200).json({ success: true });
});

export default router;
