import express from 'express';
import { db } from '../index.js';

const router = express.Router();

// Listar devoluciones con paginación y filtro
router.get('/', async (req, res) => {
  const { page = 1, pageSize = 10, sortBy = 'id', order = 'desc', tipo, recibido } = req.query;
  let query = db('devoluciones').where('completado', false);
  if (tipo) query = query.where('tipo', tipo);
  if (recibido !== undefined) query = query.where('recibido', recibido === 'true');
  const totalResult = await db('devoluciones').modify(qb => {
    if (tipo) qb.where('tipo', tipo);
    if (recibido !== undefined) qb.where('recibido', recibido === 'true');
  }).count({ count: '*' }).first();
  const total = totalResult ? totalResult.count : 0;
  const data = await query.orderBy(sortBy, order).limit(pageSize).offset((page - 1) * pageSize).select('*');
  res.json({ data, total });
});

// Crear devolucion
router.post('/', async (req, res) => {
  try {
    let id;
    if (db.client.config.client === 'pg') {
      id = (await db('devoluciones').insert(req.body).returning('id'))[0].id;
    } else {
      id = await db('devoluciones').insert(req.body);
    }
    res.status(200).json({ id });
  } catch (err) {
    console.error('Error POST /devoluciones:', err);
    res.status(500).json({ error: err.message });
  }
});

// Obtener devolucion por id
router.get('/:id', async (req, res) => {
  const devolucion = await db('devoluciones').where({ id: req.params.id }).first();
  res.json(devolucion);
});

// Editar devolucion
router.put('/:id', async (req, res) => {
  await db('devoluciones').where({ id: req.params.id }).update(req.body);
  res.status(200).json({ success: true });

// Marcar devolución como completada
router.put('/:id/completado', async (req, res) => {
  await db('devoluciones').where({ id: req.params.id }).update({ completado: true });
  res.json({ success: true });
});
});

// Borrar devolucion
router.delete('/:id', async (req, res) => {
  await db('devoluciones').where({ id: req.params.id }).del();
  res.status(200).json({ success: true });
});

export default router;
