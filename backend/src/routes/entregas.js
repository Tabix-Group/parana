import express from 'express';
import { db } from '../index.js';

const router = express.Router();

// Listar entregas con paginación y filtros
router.get('/', async (req, res) => {
    try {
        const { page = 1, pageSize = 10, pedido_id, completado, fecha_entrega } = req.query;

        let query = db('entregas')
            .leftJoin('pedidos', 'entregas.pedido_id', 'pedidos.id')
            .leftJoin('clientes', 'pedidos.cliente_id', 'clientes.id')
            .leftJoin('armadores', 'entregas.armador_id', 'armadores.id')
            .leftJoin('tipos_transporte', 'entregas.tipo_transporte_id', 'tipos_transporte.id')
            .leftJoin('transportes', 'entregas.transporte_id', 'transportes.id')
            .leftJoin('estados', 'entregas.estado_id', 'estados.id')
            .select(
                'entregas.*',
                'pedidos.comprobante',
                'pedidos.cant_bultos as pedido_total_bultos',
                'clientes.nombre as cliente_nombre',
                'armadores.nombre as armador_nombre',
                'armadores.apellido as armador_apellido',
                'tipos_transporte.nombre as tipo_transporte_nombre',
                'transportes.nombre as transporte_nombre',
                'estados.nombre as estado_nombre'
            );

        // Filtros
        if (pedido_id) {
            query = query.where('entregas.pedido_id', pedido_id);
        }

        if (completado !== undefined) {
            query = query.where('entregas.completado', completado === 'true');
        }

        if (fecha_entrega) {
            query = query.whereRaw('DATE(entregas.fecha_entrega) = ?', [fecha_entrega]);
        }

        // Obtener total para paginación
        const totalResult = await query.clone().countDistinct({ count: 'entregas.id' }).first();
        const total = totalResult ? totalResult.count : 0;

        // Aplicar paginación y orden
        const data = await query
            .orderBy('entregas.fecha_creacion', 'desc')
            .limit(pageSize)
            .offset((page - 1) * pageSize);

        res.json({ data, total });
    } catch (error) {
        console.error('Error GET /entregas:', error);
        res.status(500).json({ error: 'Error interno del servidor' });
    }
});

// Obtener entregas de un pedido específico
router.get('/pedido/:pedidoId', async (req, res) => {
    try {
        const { pedidoId } = req.params;

        const entregas = await db('entregas')
            .leftJoin('armadores', 'entregas.armador_id', 'armadores.id')
            .leftJoin('tipos_transporte', 'entregas.tipo_transporte_id', 'tipos_transporte.id')
            .leftJoin('transportes', 'entregas.transporte_id', 'transportes.id')
            .leftJoin('estados', 'entregas.estado_id', 'estados.id')
            .select(
                'entregas.*',
                'armadores.nombre as armador_nombre',
                'armadores.apellido as armador_apellido',
                'tipos_transporte.nombre as tipo_transporte_nombre',
                'transportes.nombre as transporte_nombre',
                'estados.nombre as estado_nombre'
            )
            .where('entregas.pedido_id', pedidoId)
            .orderBy('entregas.numero_entrega', 'asc');

        res.json(entregas);
    } catch (error) {
        console.error('Error GET /entregas/pedido/:pedidoId:', error);
        res.status(500).json({ error: 'Error interno del servidor' });
    }
});

// Crear nueva entrega
router.post('/', async (req, res) => {
    try {
        const entrega = { ...req.body };

        // Validaciones
        if (!entrega.pedido_id) {
            return res.status(400).json({ error: 'pedido_id es requerido' });
        }

        // Verificar que el pedido existe
        const pedido = await db('pedidos').where({ id: entrega.pedido_id }).first();
        if (!pedido) {
            return res.status(404).json({ error: 'Pedido no encontrado' });
        }

        // Procesar fechas
        if (entrega.fecha_entrega) {
            entrega.fecha_entrega = entrega.fecha_entrega.split('T')[0];
        }

        // Asegurar cant_bultos sea número
        if (entrega.cant_bultos === '' || entrega.cant_bultos === null || entrega.cant_bultos === undefined) {
            entrega.cant_bultos = 0;
        } else {
            entrega.cant_bultos = Number(entrega.cant_bultos);
            if (isNaN(entrega.cant_bultos)) entrega.cant_bultos = 0;
        }

        // Obtener el número de entrega siguiente
        const ultimaEntrega = await db('entregas')
            .where('pedido_id', entrega.pedido_id)
            .orderBy('numero_entrega', 'desc')
            .first();

        entrega.numero_entrega = ultimaEntrega ? ultimaEntrega.numero_entrega + 1 : 1;

        // Validar que la cantidad no exceda el total del pedido
        const entregasExistentes = await db('entregas')
            .where('pedido_id', entrega.pedido_id)
            .sum('cant_bultos as total');

        const totalEntregasExistentes = entregasExistentes[0]?.total || 0;
        const totalPedido = pedido.cant_bultos || 0;

        if (totalEntregasExistentes + entrega.cant_bultos > totalPedido) {
            return res.status(400).json({
                error: `La cantidad total de entregas (${totalEntregasExistentes + entrega.cant_bultos}) no puede exceder la cantidad del pedido (${totalPedido})`
            });
        }

        // Insertar la entrega
        let id;
        if (db.client.config.client === 'pg') {
            id = (await db('entregas').insert(entrega).returning('id'))[0].id;
        } else {
            id = await db('entregas').insert(entrega);
        }

        res.status(201).json({ id });
    } catch (error) {
        console.error('Error POST /entregas:', error);
        res.status(500).json({ error: error.message });
    }
});

// Obtener entrega por id
router.get('/:id', async (req, res) => {
    try {
        const entrega = await db('entregas')
            .leftJoin('pedidos', 'entregas.pedido_id', 'pedidos.id')
            .leftJoin('clientes', 'pedidos.cliente_id', 'clientes.id')
            .leftJoin('armadores', 'entregas.armador_id', 'armadores.id')
            .leftJoin('tipos_transporte', 'entregas.tipo_transporte_id', 'tipos_transporte.id')
            .leftJoin('transportes', 'entregas.transporte_id', 'transportes.id')
            .leftJoin('estados', 'entregas.estado_id', 'estados.id')
            .select(
                'entregas.*',
                'pedidos.comprobante',
                'pedidos.cant_bultos as pedido_total_bultos',
                'clientes.nombre as cliente_nombre',
                'armadores.nombre as armador_nombre',
                'armadores.apellido as armador_apellido',
                'tipos_transporte.nombre as tipo_transporte_nombre',
                'transportes.nombre as transporte_nombre',
                'estados.nombre as estado_nombre'
            )
            .where('entregas.id', req.params.id)
            .first();

        if (!entrega) {
            return res.status(404).json({ error: 'Entrega no encontrada' });
        }

        res.json(entrega);
    } catch (error) {
        console.error('Error GET /entregas/:id:', error);
        res.status(500).json({ error: 'Error interno del servidor' });
    }
});

// Editar entrega
router.put('/:id', async (req, res) => {
    try {
        const datos = { ...req.body };
        const entregaId = req.params.id;

        // Obtener la entrega actual
        const entregaActual = await db('entregas').where({ id: entregaId }).first();
        if (!entregaActual) {
            return res.status(404).json({ error: 'Entrega no encontrada' });
        }

        // Procesar fechas
        if (datos.fecha_entrega) {
            datos.fecha_entrega = datos.fecha_entrega.split('T')[0];
        }

        // Asegurar cant_bultos sea número
        if (datos.cant_bultos === '' || datos.cant_bultos === null || datos.cant_bultos === undefined) {
            datos.cant_bultos = 0;
        } else {
            datos.cant_bultos = Number(datos.cant_bultos);
            if (isNaN(datos.cant_bultos)) datos.cant_bultos = 0;
        }

        // Validar cantidad si cambió
        if (datos.cant_bultos !== entregaActual.cant_bultos) {
            // Obtener el pedido
            const pedido = await db('pedidos').where({ id: entregaActual.pedido_id }).first();

            // Calcular total de otras entregas
            const otrasEntregas = await db('entregas')
                .where('pedido_id', entregaActual.pedido_id)
                .whereNot('id', entregaId)
                .sum('cant_bultos as total');

            const totalOtrasEntregas = otrasEntregas[0]?.total || 0;
            const totalPedido = pedido.cant_bultos || 0;

            if (totalOtrasEntregas + datos.cant_bultos > totalPedido) {
                return res.status(400).json({
                    error: `La cantidad total de entregas (${totalOtrasEntregas + datos.cant_bultos}) no puede exceder la cantidad del pedido (${totalPedido})`
                });
            }
        }

        await db('entregas').where({ id: entregaId }).update(datos);
        res.json({ success: true });
    } catch (error) {
        console.error('Error PUT /entregas/:id:', error);
        res.status(500).json({ error: error.message });
    }
});

// Marcar entrega como completada
router.put('/:id/completado', async (req, res) => {
    try {
        const { completado } = req.body;
        const entregaId = req.params.id;

        // Obtener la entrega actual
        const entrega = await db('entregas').where({ id: entregaId }).first();
        if (!entrega) {
            return res.status(404).json({ error: 'Entrega no encontrada' });
        }

        // Actualizar la entrega
        await db('entregas').where({ id: entregaId }).update({ completado: !!completado });

        // Verificar si todas las entregas del pedido están completadas
        const entregasPedido = await db('entregas')
            .where('pedido_id', entrega.pedido_id)
            .select('completado');

        const todasCompletadas = entregasPedido.length > 0 && entregasPedido.every(e => e.completado);

        // Actualizar el estado del pedido
        if (todasCompletadas) {
            await db('pedidos').where({ id: entrega.pedido_id }).update({ completado: true });
        } else {
            // Si no todas están completadas, asegurarse de que el pedido no esté marcado como completado
            await db('pedidos').where({ id: entrega.pedido_id }).update({ completado: false });
        }

        res.json({ success: true });
    } catch (error) {
        console.error('Error PUT /entregas/:id/completado:', error);
        res.status(500).json({ error: 'Error interno del servidor' });
    }
});

// Marcar/Desmarcar campo OK
router.put('/:id/ok', async (req, res) => {
    try {
        const { ok } = req.body;
        await db('entregas').where({ id: req.params.id }).update({ ok: !!ok });
        res.json({ success: true });
    } catch (error) {
        console.error('Error PUT /entregas/:id/ok:', error);
        res.status(500).json({ error: 'Error interno del servidor' });
    }
});

// Eliminar entrega
router.delete('/:id', async (req, res) => {
    try {
        await db('entregas').where({ id: req.params.id }).del();
        res.json({ success: true });
    } catch (error) {
        console.error('Error DELETE /entregas/:id:', error);
        res.status(500).json({ error: 'Error interno del servidor' });
    }
});

export default router;