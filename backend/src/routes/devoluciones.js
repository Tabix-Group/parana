import express from 'express';
import { db } from '../index.js';

const router = express.Router();

// Listar devoluciones con paginación y filtro
router.get('/', async (req, res) => {
  const { page = 1, pageSize = 10, sortBy = 'id', order = 'desc', tipo, recibido } = req.query;
  let query = db('devoluciones');
  if (tipo) query = query.where('tipo', tipo);
  if (recibido !== undefined) query = query.where('recibido', recibido === 'true');
  const total = await query.clone().count({ count: '*' }).first();
  const data = await query.orderBy(sortBy, order).limit(pageSize).offset((page - 1) * pageSize);
  res.json({ data, total: total.count });
});

// Crear devolucion
router.post('/', async (req, res) => {
  const [id] = await db('devoluciones').insert(req.body);
  res.json({ id });
});

// Obtener devolucion por id
router.get('/:id', async (req, res) => {
  const devolucion = await db('devoluciones').where({ id: req.params.id }).first();
  res.json(devolucion);
});

// Editar devolucion
router.put('/:id', async (req, res) => {
  await db('devoluciones').where({ id: req.params.id }).update(req.body);
  res.sendStatus(204);
});

// Borrar devolucion
router.delete('/:id', async (req, res) => {
  await db('devoluciones').where({ id: req.params.id }).del();
  res.sendStatus(204);
});

export default router;
