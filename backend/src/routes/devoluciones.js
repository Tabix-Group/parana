import express from 'express';
import { db } from '../index.js';

const router = express.Router();

// Listar devoluciones con paginación y filtro
router.get('/', async (req, res) => {
  const { page = 1, pageSize = 10, sortBy = 'id', order = 'desc', tipo, recibido } = req.query;
  // Para devoluciones, mostrar TODAS (completadas y no completadas)
  let query = db('devoluciones')
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
    .leftJoin('estados', 'pedidos.estado_id', 'estados.id');
    
  if (tipo) query = query.where('devoluciones.tipo', tipo);
  if (recibido !== undefined) query = query.where('devoluciones.recibido', recibido === 'true');
  
  const totalResult = await db('devoluciones').modify(qb => {
    if (tipo) qb.where('tipo', tipo);
    if (recibido !== undefined) qb.where('recibido', recibido === 'true');
  }).count({ count: '*' }).first();
  
  const total = totalResult ? totalResult.count : 0;
  const data = await query.orderBy('devoluciones.' + sortBy, order).limit(pageSize).offset((page - 1) * pageSize);
  res.json({ data, total });
});

// Crear devolucion
router.post('/', async (req, res) => {
  try {
    console.log('Datos recibidos en POST /devoluciones:', req.body);
    
    // Limpiar y validar campos que deben ser números o null
    const cleanData = {
      pedido_id: req.body.pedido_id && req.body.pedido_id !== '' && !isNaN(req.body.pedido_id) ? Number(req.body.pedido_id) : null,
      Codigo: req.body.Codigo && req.body.Codigo !== '' && !isNaN(req.body.Codigo) ? Number(req.body.Codigo) : null,
      cliente_id: req.body.cliente_id && req.body.cliente_id !== '' && !isNaN(req.body.cliente_id) ? Number(req.body.cliente_id) : null,
      transporte_id: req.body.transporte_id && req.body.transporte_id !== '' && !isNaN(req.body.transporte_id) ? Number(req.body.transporte_id) : null,
      tipo: req.body.tipo || null,
      recibido: req.body.recibido === true || req.body.recibido === 'true',
      fecha: req.body.fecha || null,
      fecha_pedido: req.body.fecha_pedido || null,
      texto: req.body.texto || null,
      en_logistica: req.body.en_logistica === true || req.body.en_logistica === 'true',
      completado: req.body.completado === true || req.body.completado === 'true'
    };
    
    console.log('Datos limpiados a insertar en devoluciones:', cleanData);
    
    let id;
    if (db.client.config.client === 'pg') {
      id = (await db('devoluciones').insert(cleanData).returning('id'))[0].id;
    } else {
      id = await db('devoluciones').insert(cleanData);
    }
    
    console.log('Devolución creada con ID:', id);
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

// Marcar/desmarcar devolución como recibida
router.put('/:id/recibido', async (req, res) => {
  const { recibido } = req.body;
  await db('devoluciones').where({ id: req.params.id }).update({ recibido: !!recibido });
  res.json({ success: true });
});

// Marcar devolución como completada
router.put('/:id/completado', async (req, res) => {
  await db('devoluciones').where({ id: req.params.id }).update({ completado: true });
  res.json({ success: true });
});

// Marcar/Desmarcar campo OK
router.put('/:id/ok', async (req, res) => {
  const { ok } = req.body;
  await db('devoluciones').where({ id: req.params.id }).update({ ok: !!ok });
  res.json({ success: true });
});

// Editar devolucion
router.put('/:id', async (req, res) => {
  try {
    console.log('Datos recibidos en PUT /devoluciones/:id', req.body);
    
    // Limpiar y validar campos que deben ser números o null
    const cleanData = {
      pedido_id: req.body.pedido_id && req.body.pedido_id !== '' && !isNaN(req.body.pedido_id) ? Number(req.body.pedido_id) : null,
      Codigo: req.body.Codigo && req.body.Codigo !== '' && !isNaN(req.body.Codigo) ? Number(req.body.Codigo) : null,
      cliente_id: req.body.cliente_id && req.body.cliente_id !== '' && !isNaN(req.body.cliente_id) ? Number(req.body.cliente_id) : null,
      transporte_id: req.body.transporte_id && req.body.transporte_id !== '' && !isNaN(req.body.transporte_id) ? Number(req.body.transporte_id) : null,
      tipo: req.body.tipo || null,
      recibido: req.body.recibido === true || req.body.recibido === 'true',
      fecha: req.body.fecha || null,
      fecha_pedido: req.body.fecha_pedido || null,
      texto: req.body.texto || null,
      en_logistica: req.body.en_logistica === true || req.body.en_logistica === 'true',
      completado: req.body.completado === true || req.body.completado === 'true'
    };
    
    console.log('Datos limpiados a actualizar:', cleanData);
    
    await db('devoluciones').where({ id: req.params.id }).update(cleanData);
    res.status(200).json({ success: true });
  } catch (err) {
    console.error('Error PUT /devoluciones/:id', err);
    res.status(500).json({ error: err.message });
  }
});

// Borrar devolucion
router.delete('/:id', async (req, res) => {
  await db('devoluciones').where({ id: req.params.id }).del();
  res.status(200).json({ success: true });
});

export default router;
