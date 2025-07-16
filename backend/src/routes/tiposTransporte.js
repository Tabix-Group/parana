import express from 'express';
import { db } from '../index.js';

const router = express.Router();

router.get('/', async (req, res) => {
  const { page = 1, pageSize = 10, sortBy = 'id', order = 'desc', nombre } = req.query;
  let query = db('tipos_transporte');
  if (nombre) query = query.where('nombre', 'like', `%${nombre}%`);
  const total = await query.clone().count({ count: '*' }).first();
  const data = await query.orderBy(sortBy, order).limit(pageSize).offset((page - 1) * pageSize);
  res.json({ data, total: total.count });
});

router.post('/', async (req, res) => {
  try {
    let id;
    if (db.client.config.client === 'pg') {
      id = (await db('tipos_transporte').insert(req.body).returning('id'))[0].id;
    } else {
      id = await db('tipos_transporte').insert(req.body);
    }
    res.status(200).json({ id });
  } catch (err) {
    console.error('Error POST /tipos-transporte:', err);
    res.status(500).json({ error: err.message });
  }
});

router.get('/:id', async (req, res) => {
  const tipo = await db('tipos_transporte').where({ id: req.params.id }).first();
  res.json(tipo);
});

router.put('/:id', async (req, res) => {
  await db('tipos_transporte').where({ id: req.params.id }).update(req.body);
  res.status(200).json({ success: true });
});

router.delete('/:id', async (req, res) => {
  await db('tipos_transporte').where({ id: req.params.id }).del();
  res.status(200).json({ success: true });
});

export default router;
