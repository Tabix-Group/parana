import express from 'express';
import { db } from '../index.js';

const router = express.Router();

router.get('/', async (req, res) => {
  // Support pageSize=0 or pageSize='all' to return all records (no LIMIT)
  const { page = 1, pageSize = 10, sortBy = 'id', order = 'desc', nombre } = req.query;
  const pageNum = Number(page) || 1;
  const pageSizeRaw = pageSize === 'all' ? 0 : Number(pageSize);
  const pageSizeNum = Number.isNaN(pageSizeRaw) ? 10 : pageSizeRaw;

  let query = db('vendedores');
  if (nombre) query = query.where('nombre', 'like', `%${nombre}%`);

  const totalResult = await db('vendedores').modify(qb => {
    if (nombre) qb.where('nombre', 'like', `%${nombre}%`);
  }).count({ count: '*' }).first();
  const total = totalResult ? totalResult.count : 0;

  // If pageSizeNum is 0, return all records (no limit/offset)
  let dataQuery = query.orderBy(sortBy, order);
  if (pageSizeNum > 0) {
    dataQuery = dataQuery.limit(pageSizeNum).offset((pageNum - 1) * pageSizeNum);
  }
  const data = await dataQuery;
  res.json({ data, total });
});

router.post('/', async (req, res) => {
  try {
    let id;
    if (db.client.config.client === 'pg') {
      id = (await db('vendedores').insert(req.body).returning('id'))[0].id;
    } else {
      id = await db('vendedores').insert(req.body);
    }
    res.status(200).json({ id });
  } catch (err) {
    console.error('Error POST /vendedores:', err);
    res.status(500).json({ error: err.message });
  }
});

router.get('/:id', async (req, res) => {
  const vendedor = await db('vendedores').where({ id: req.params.id }).first();
  res.json(vendedor);
});

router.put('/:id', async (req, res) => {
  await db('vendedores').where({ id: req.params.id }).update(req.body);
  res.status(200).json({ success: true });
});

router.delete('/:id', async (req, res) => {
  await db('vendedores').where({ id: req.params.id }).del();
  res.status(200).json({ success: true });
});

export default router;
