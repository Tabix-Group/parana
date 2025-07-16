import express from 'express';
import { db } from '../index.js';

const router = express.Router();

// Listar usuarios con paginación
router.get('/', async (req, res) => {
  const { page = 1, pageSize = 10 } = req.query;
  const total = await db('usuarios').count({ count: '*' }).first();
  const data = await db('usuarios')
    .select('id', 'nombre', 'mail', 'clave', 'rol')
    .orderBy('id', 'desc')
    .limit(pageSize)
    .offset((page - 1) * pageSize);
  res.json({ data, total: total.count });
});

// Crear usuario
router.post('/', async (req, res) => {
  try {
    const { nombre, mail, clave, rol } = req.body;
    let id;
    if (db.client.config.client === 'pg') {
      id = (await db('usuarios').insert({ nombre, mail, clave, rol }).returning('id'))[0].id;
    } else {
      id = await db('usuarios').insert({ nombre, mail, clave, rol });
    }
    res.status(200).json({ id });
  } catch (err) {
    console.error('Error POST /usuarios:', err);
    res.status(500).json({ error: err.message });
  }
});

// Editar usuario
router.put('/:id', async (req, res) => {
  const { nombre, mail, clave, rol } = req.body;
  await db('usuarios').where({ id: req.params.id }).update({ nombre, mail, clave, rol });
  res.status(200).json({ success: true });
});

// Eliminar usuario
router.delete('/:id', async (req, res) => {
  await db('usuarios').where({ id: req.params.id }).del();
  res.status(200).json({ success: true });
});

export default router;
