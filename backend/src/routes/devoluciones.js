import express from 'express';
import { db } from '../index.js';

const router = express.Router();

// Listar devoluciones con paginación y filtro
router.get('/', async (req, res) => {
  try {
    const { page = 1, pageSize = 10, sortBy = 'id', order = 'desc', tipo, recibido, cliente, comprobante, filter } = req.query;
    
    // Para devoluciones, mostrar TODAS (completadas y no completadas)
    let query = db('devoluciones')
      .select([
        'devoluciones.*',
        'clientes.nombre as cliente_nombre',
        'clientes.Codigo as cliente_codigo',
        'clientes.direccion as cliente_direccion_default',
        'transportes.nombre as transporte_nombre',
        'pedidos.comprobante as pedido_comprobante',
        'devoluciones.fecha_pedido as fecha_pedido',
        'devoluciones.fecha as fecha_entrega',
        'armadores.nombre as armador_nombre',
        'armadores.apellido as armador_apellido',
        'estados.nombre as estado_nombre',
        'tipos_transporte.nombre as tipo_transporte_nombre'
      ])
      .leftJoin('clientes', 'devoluciones.cliente_id', 'clientes.id')
      .leftJoin('transportes', 'devoluciones.transporte_id', 'transportes.id')
      .leftJoin('pedidos', 'devoluciones.pedido_id', 'pedidos.id')
      .leftJoin('armadores', 'pedidos.armador_id', 'armadores.id')
      .leftJoin('estados', 'pedidos.estado_id', 'estados.id')
      .leftJoin('tipos_transporte', 'devoluciones.tipo_transporte_id', 'tipos_transporte.id');
      
    if (tipo) query = query.where('devoluciones.tipo', tipo);
    if (recibido !== undefined) query = query.where('devoluciones.recibido', recibido === 'true');
    
    if (cliente) {
      if (/^\d+$/.test(String(cliente))) {
        query = query.where('devoluciones.cliente_id', cliente);
      } else {
        query = query.where('clientes.nombre', 'like', `%${cliente}%`);
      }
    }
    
    if (comprobante) {
      query = query.where('devoluciones.comprobante', 'like', `%${comprobante}%`);
    }
    
    if (filter) {
      query = query.where(function() {
        this.where('clientes.nombre', 'like', `%${filter}%`)
          .orWhere('devoluciones.comprobante', 'like', `%${filter}%`)
          .orWhere('devoluciones.texto', 'like', `%${filter}%`)
          .orWhere('transportes.nombre', 'like', `%${filter}%`);
      });
    }
    
    const countQuery = db('devoluciones')
      .leftJoin('clientes', 'devoluciones.cliente_id', 'clientes.id')
      .leftJoin('transportes', 'devoluciones.transporte_id', 'transportes.id');
    
    if (tipo) countQuery.where('devoluciones.tipo', tipo);
    if (recibido !== undefined) countQuery.where('devoluciones.recibido', recibido === 'true');
    if (cliente) {
      if (/^\d+$/.test(String(cliente))) {
        countQuery.where('devoluciones.cliente_id', cliente);
      } else {
        countQuery.where('clientes.nombre', 'like', `%${cliente}%`);
      }
    }
    if (comprobante) {
      countQuery.where('devoluciones.comprobante', 'like', `%${comprobante}%`);
    }
    if (filter) {
      countQuery.where(function() {
        this.where('clientes.nombre', 'like', `%${filter}%`)
          .orWhere('devoluciones.comprobante', 'like', `%${filter}%`)
          .orWhere('devoluciones.texto', 'like', `%${filter}%`)
          .orWhere('transportes.nombre', 'like', `%${filter}%`);
      });
    }

    const totalResult = await countQuery.count({ count: '*' }).first();
    const total = totalResult ? (parseInt(totalResult.count) || 0) : 0;
    
    const data = await query.orderBy('devoluciones.' + sortBy, order).limit(pageSize).offset((page - 1) * pageSize);
    res.json({ data, total });
  } catch (error) {
    console.error('Error GET /devoluciones:', error);
    res.status(500).json({ error: error.message });
  }
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
      tipo_transporte_id: req.body.tipo_transporte_id && req.body.tipo_transporte_id !== '' && !isNaN(req.body.tipo_transporte_id) ? Number(req.body.tipo_transporte_id) : null,
      comprobante: req.body.comprobante || null,
      direccion: req.body.direccion || null,
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
        'clientes.direccion as cliente_direccion_default',
        'transportes.nombre as transporte_nombre',
        'pedidos.comprobante as pedido_comprobante',
        'devoluciones.fecha_pedido as fecha_pedido',
        'devoluciones.fecha as fecha_entrega',
        'armadores.nombre as armador_nombre',
        'armadores.apellido as armador_apellido',
        'estados.nombre as estado_nombre',
        'tipos_transporte.nombre as tipo_transporte_nombre'
      ])
      .leftJoin('clientes', 'devoluciones.cliente_id', 'clientes.id')
      .leftJoin('transportes', 'devoluciones.transporte_id', 'transportes.id')
      .leftJoin('pedidos', 'devoluciones.pedido_id', 'pedidos.id')
      .leftJoin('armadores', 'pedidos.armador_id', 'armadores.id')
      .leftJoin('estados', 'pedidos.estado_id', 'estados.id')
      .leftJoin('tipos_transporte', 'devoluciones.tipo_transporte_id', 'tipos_transporte.id')
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
  const { completado } = req.body;
  const now = new Date().toISOString().split('T')[0];
  const updateData = { completado: completado !== false };
  
  if (completado !== false) {
    updateData.fecha_completado = now;
    updateData.recibido = true;
  } else {
    updateData.fecha_completado = null;
    updateData.recibido = false;
  }
  
  await db('devoluciones').where({ id: req.params.id }).update(updateData);
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
    
    // Solo actualizar los campos que vienen en el body
    const updateData = {};
    
    // Campos numéricos/IDs
    const numericFields = ['pedido_id', 'Codigo', 'cliente_id', 'transporte_id', 'tipo_transporte_id'];
    numericFields.forEach(field => {
      if (req.body.hasOwnProperty(field)) {
        updateData[field] = req.body[field] && req.body[field] !== '' && !isNaN(req.body[field]) ? Number(req.body[field]) : null;
      }
    });

    // Campos de texto
    const textFields = ['comprobante', 'direccion', 'tipo', 'texto'];
    textFields.forEach(field => {
      if (req.body.hasOwnProperty(field)) {
        updateData[field] = req.body[field] || null;
      }
    });

    // Campos de fecha (manejar tanto fecha como fecha_entrega para compatibilidad con Logística)
    if (req.body.hasOwnProperty('fecha')) {
      updateData.fecha = req.body.fecha || null;
    } else if (req.body.hasOwnProperty('fecha_entrega')) {
      updateData.fecha = req.body.fecha_entrega || null;
    }

    if (req.body.hasOwnProperty('fecha_pedido')) {
      updateData.fecha_pedido = req.body.fecha_pedido || null;
    }

    // Campos booleanos
    if (req.body.hasOwnProperty('recibido')) {
      updateData.recibido = req.body.recibido === true || req.body.recibido === 'true';
    }
    
    if (req.body.hasOwnProperty('en_logistica')) {
      updateData.en_logistica = req.body.en_logistica === true || req.body.en_logistica === 'true';
    }
    
    if (req.body.hasOwnProperty('completado')) {
      updateData.completado = req.body.completado === true || req.body.completado === 'true';
    }

    if (req.body.hasOwnProperty('ok')) {
      updateData.ok = req.body.ok === true || req.body.ok === 'true';
    }
    
    console.log('Datos limpiados a actualizar:', updateData);
    
    if (Object.keys(updateData).length > 0) {
      await db('devoluciones').where({ id: req.params.id }).update(updateData);
    }
    
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
