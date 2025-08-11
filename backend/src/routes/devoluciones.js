import express from 'express';
import { db } from '../index.js';

const router = express.Router();

// Listar devoluciones con paginación y filtro
router.get('/', async (req, res) => {
  const { page = 1, pageSize = 10, sortBy = 'id', order = 'desc', tipo, recibido } = req.query;
  // Para devoluciones, mostrar TODAS (completadas y no completadas)
  let query = db('devoluciones');
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
    // Asegurar que completado esté definido como false por defecto
    const devolucionData = {
      ...req.body,
      completado: req.body.completado !== undefined ? req.body.completado : false
    };
    
    let id;
    if (db.client.config.client === 'pg') {
      id = (await db('devoluciones').insert(devolucionData).returning('id'))[0].id;
    } else {
      id = await db('devoluciones').insert(devolucionData);
    }
    res.status(200).json({ id });
  } catch (err) {
    console.error('Error POST /devoluciones:', err);
    res.status(500).json({ error: err.message });
  }
});

// Obtener devoluciones para logística (las que están marcadas como en_logistica = true)
router.get('/logistica', async (req, res) => {
  try {
    const devoluciones = await db('devoluciones')
      .select([
        'devoluciones.*',
        'clientes.nombre as cliente_nombre',
        'clientes.Codigo as cliente_codigo',
        'clientes.direccion as cliente_direccion',
        'transportes.nombre as transporte_nombre',
        'pedidos.comprobante as pedido_comprobante',
        'devoluciones.fecha_pedido as fecha_pedido',
        'devoluciones.fecha as fecha_entrega',
        'armadores.nombre as armador_nombre',
        'armadores.apellido as armador_apellido',
        'estados.nombre as estado_nombre'
      ])
      .leftJoin('clientes', 'devoluciones.cliente_id', 'clientes.id')
      .leftJoin('transportes', 'devoluciones.transporte_id', 'transportes.id')
      .leftJoin('pedidos', 'devoluciones.pedido_id', 'pedidos.id')
      .leftJoin('armadores', 'pedidos.armador_id', 'armadores.id')
      .leftJoin('estados', 'pedidos.estado_id', 'estados.id')
      .where('devoluciones.en_logistica', true)
      .orderBy('devoluciones.fecha', 'asc');

    res.json(devoluciones);
  } catch (error) {
    console.error('Error al obtener devoluciones de logística:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// Obtener devolucion por id
router.get('/:id', async (req, res) => {
  const devolucion = await db('devoluciones').where({ id: req.params.id }).first();
  res.json(devolucion);
});

// Marcar/desmarcar devolución para logística
router.put('/:id/logistica', async (req, res) => {
  const { en_logistica } = req.body;
  await db('devoluciones').where({ id: req.params.id }).update({ en_logistica: !!en_logistica });
  res.json({ success: true });
});

// Marcar devolución como completada
router.put('/:id/completado', async (req, res) => {
  await db('devoluciones').where({ id: req.params.id }).update({ completado: true });
  res.json({ success: true });
});

// Editar devolucion
router.put('/:id', async (req, res) => {
  await db('devoluciones').where({ id: req.params.id }).update(req.body);
  res.status(200).json({ success: true });
});

// Borrar devolucion
router.delete('/:id', async (req, res) => {
  await db('devoluciones').where({ id: req.params.id }).del();
  res.status(200).json({ success: true });
});

export default router;
