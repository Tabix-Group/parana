import express from 'express';
import { db } from '../index.js';

const router = express.Router();

router.get('/', async (req, res) => {
  const { page = 1, pageSize = 10, sortBy = 'id', order = 'desc', nombre, Codigo } = req.query;
  let query = db('clientes');

  // Filtro por nombre (búsqueda parcial case-insensitive)
  if (nombre) query = query.where(db.raw('LOWER(nombre)'), 'like', `%${nombre.toLowerCase()}%`);

  // Filtro por código (búsqueda exacta)
  if (Codigo) query = query.where('Codigo', Codigo);

  const totalResult = await db('clientes').modify(qb => {
    if (nombre) qb.where(db.raw('LOWER(nombre)'), 'like', `%${nombre.toLowerCase()}%`);
    if (Codigo) qb.where('Codigo', Codigo);
  }).count({ count: '*' }).first();

  const total = totalResult ? totalResult.count : 0;
  const data = await query.orderBy(sortBy, order).limit(pageSize).offset((page - 1) * pageSize);
  res.json({ data, total });
});

router.post('/', async (req, res) => {
  try {
    // Preparar los datos convirtiendo campos vacíos a null para enteros
    // IMPORTANTE: Excluir el campo 'id' para evitar conflictos de clave primaria
    const { id, ...bodyWithoutId } = req.body;
    const clienteData = {
      ...bodyWithoutId,
      Codigo: req.body.Codigo === '' || req.body.Codigo === undefined ? null : parseInt(req.body.Codigo, 10) || null
    };

    console.log('Datos a insertar en clientes:', clienteData);

    let newId;
    if (db.client.config.client === 'pg') {
      newId = (await db('clientes').insert(clienteData).returning('id'))[0].id;
    } else {
      newId = await db('clientes').insert(clienteData);
    }
    console.log('Cliente creado exitosamente con ID:', newId);
    res.status(200).json({ id: newId });
  } catch (err) {
    console.error('Error POST /clientes:', err);

    // Si es un error de clave primaria duplicada, intentar solucionarlo
    if (err.code === '23505' && err.constraint === 'clientes_pkey') {
      console.log('Error de clave primaria duplicada. Intentando reiniciar secuencia...');
      try {
        // Reiniciar la secuencia
        const maxIdResult = await db('clientes').max('id as max_id').first();
        const maxId = maxIdResult?.max_id || 0;
        const nextId = maxId + 1;
        await db.raw(`SELECT setval(pg_get_serial_sequence('clientes', 'id'), ${nextId}, false)`);
        console.log(`Secuencia reiniciada. Próximo ID: ${nextId}`);

        // Intentar insertar nuevamente
        const { id, ...bodyWithoutId } = req.body;
        const clienteData = {
          ...bodyWithoutId,
          Codigo: req.body.Codigo === '' || req.body.Codigo === undefined ? null : parseInt(req.body.Codigo, 10) || null
        };

        const newId = (await db('clientes').insert(clienteData).returning('id'))[0].id;
        console.log('Cliente creado exitosamente después de reiniciar secuencia con ID:', newId);
        res.status(200).json({ id: newId });
      } catch (retryErr) {
        console.error('Error al intentar reiniciar secuencia:', retryErr);
        res.status(500).json({ error: 'Error al crear cliente. La secuencia de ID está desactualizada.' });
      }
    } else {
      res.status(500).json({ error: err.message });
    }
  }
});

router.get('/:id', async (req, res) => {
  const cliente = await db('clientes').where({ id: req.params.id }).first();
  res.json(cliente);
});

router.put('/:id', async (req, res) => {
  try {
    // Preparar los datos convirtiendo campos vacíos a null para enteros
    const clienteData = {
      ...req.body,
      Codigo: req.body.Codigo === '' || req.body.Codigo === undefined ? null : parseInt(req.body.Codigo, 10) || null
    };

    await db('clientes').where({ id: req.params.id }).update(clienteData);
    res.status(200).json({ success: true });
  } catch (err) {
    console.error('Error PUT /clientes:', err);
    res.status(500).json({ error: err.message });
  }
});

router.delete('/:id', async (req, res) => {
  await db('clientes').where({ id: req.params.id }).del();
  res.status(200).json({ success: true });
});

export default router;
