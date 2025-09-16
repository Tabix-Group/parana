import express from 'express';
import { db } from '../index.js';

const router = express.Router();

// Listar entregas con paginación y filtros
router.get('/', async (req, res) => {
    try {
        console.log('🔍 GET /entregas - Iniciando consulta...');

        const { page = 1, pageSize = 10, pedido_id, completado, fecha_entrega } = req.query;

        // Verificar que la tabla existe intentando una consulta simple
        try {
            const countSimple = await db('entregas').count('id as count').first();
            console.log(`📊 Tabla entregas verificada. Total registros: ${countSimple.count}`);
        } catch (error) {
            console.error('❌ Error accediendo tabla entregas:', error);
            return res.status(500).json({
                error: 'Error accediendo tabla entregas',
                details: 'No se puede acceder a la tabla entregas. Verifique que la base de datos esté correctamente configurada.'
            });
        }

        // Ahora intentar la consulta compleja con JOINs
        console.log('🔍 Ejecutando consulta compleja con JOINs...');
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

        console.log('🔍 Aplicando filtros...');

        // Filtros
        if (pedido_id) {
            query = query.where('entregas.pedido_id', pedido_id);
        }

        if (completado !== undefined) {
            query = query.where('entregas.completado', completado === 'true');
        }

        if (fecha_entrega) {
            // Usar comparación compatible con ambos DB
            if (db.client.config.client === 'pg') {
                query = query.whereRaw('DATE(entregas.fecha_entrega) = ?', [fecha_entrega]);
            } else {
                const fechaFiltro = new Date(fecha_entrega + 'T00:00:00.000Z').toISOString().split('T')[0];
                query = query.where(function () {
                    this.whereRaw('DATE(entregas.fecha_entrega) = ?', [fechaFiltro])
                        .orWhereRaw('entregas.fecha_entrega = ?', [fechaFiltro])
                        .orWhereRaw('DATE(entregas.fecha_entrega) = DATE(?)', [fecha_entrega]);
                });
            }
        }

        console.log('🔍 Ejecutando consulta final...');

        // Obtener total para paginación (compatible con PostgreSQL)
        let total = 0;
        if (db.client.config.client === 'pg') {
            // Para PostgreSQL, contar directamente sin usar countDistinct con JOINs complejos
            let countQuery = db('entregas');

            // Aplicar los mismos filtros a la consulta de total
            if (pedido_id) {
                countQuery = countQuery.where('entregas.pedido_id', pedido_id);
            }
            if (completado !== undefined) {
                countQuery = countQuery.where('entregas.completado', completado === 'true');
            }
            if (fecha_entrega) {
                countQuery = countQuery.whereRaw('DATE(entregas.fecha_entrega) = ?', [fecha_entrega]);
            }

            const totalResult = await countQuery.count('* as count').first();
            total = totalResult ? parseInt(totalResult.count) : 0;
        } else {
            // Para SQLite, usar el método original
            const totalResult = await query.clone().countDistinct({ count: 'entregas.id' }).first();
            total = totalResult ? totalResult.count : 0;
        }

        console.log(`📊 Total de registros con filtros: ${total}`);

        // Aplicar paginación y orden
        const data = await query
            .orderBy('entregas.fecha_creacion', 'desc')
            .limit(pageSize)
            .offset((page - 1) * pageSize);

        console.log(`✅ Consulta completada exitosamente. Registros retornados: ${data.length}`);

        res.json({ data, total });
    } catch (error) {
        console.error('❌ Error GET /entregas:', error);
        console.error('Stack completo:', error.stack);
        console.error('Tipo de BD:', db.client.config.client);
        console.error('Mensaje de error:', error.message);

        res.status(500).json({
            error: 'Error interno del servidor',
            details: process.env.NODE_ENV === 'development' ? error.message : 'Error en consulta de entregas',
            debug: process.env.NODE_ENV === 'development' ? {
                stack: error.stack,
                databaseType: db.client.config.client
            } : undefined
        });
    }
});

// Obtener entregas para logística (solo las de pedidos que están en logística)
router.get('/logistica', async (req, res) => {
    try {
        console.log('🔍 GET /entregas/logistica - Obteniendo entregas para logística...');

        // Primero verificar qué pedidos están en logística
        const pedidosEnLogistica = await db('pedidos')
            .where('en_logistica', true)
            .select('id', 'comprobante', 'en_logistica');

        console.log(`📊 Pedidos en logística encontrados: ${pedidosEnLogistica.length}`);
        if (pedidosEnLogistica.length > 0) {
            console.log('📋 IDs de pedidos en logística:', pedidosEnLogistica.map(p => p.id));
        }

        // Verificar entregas existentes
        const todasEntregas = await db('entregas')
            .select('id', 'pedido_id', 'numero_entrega')
            .orderBy('fecha_creacion', 'desc')
            .limit(10);

        console.log(`📦 Últimas 10 entregas creadas:`, todasEntregas.map(e => ({
            id: e.id,
            pedido_id: e.pedido_id,
            numero_entrega: e.numero_entrega
        })));

        const entregas = await db('entregas')
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
                'pedidos.en_logistica',
                'clientes.nombre as cliente_nombre',
                'armadores.nombre as armador_nombre',
                'armadores.apellido as armador_apellido',
                'tipos_transporte.nombre as tipo_transporte_nombre',
                'transportes.nombre as transporte_nombre',
                'estados.nombre as estado_nombre'
            )
            .where('pedidos.en_logistica', true) // Solo entregas de pedidos en logística
            .orderBy('entregas.fecha_creacion', 'desc');

        console.log(`✅ Encontradas ${entregas.length} entregas en logística`);
        if (entregas.length > 0) {
            console.log('📋 Detalles de entregas encontradas:');
            entregas.forEach(e => {
                console.log(`  - ID: ${e.id}, Pedido: ${e.pedido_id}, Número: ${e.numero_entrega}, En logística: ${e.en_logistica}`);
            });
        }

        res.json(entregas);
    } catch (error) {
        console.error('❌ Error GET /entregas/logistica:', error);
        console.error('Stack completo:', error.stack);
        res.status(500).json({
            error: 'Error interno del servidor',
            details: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
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
        console.error('Stack:', error.stack);
        res.status(500).json({
            error: 'Error interno del servidor',
            details: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
});

// Crear nueva entrega
router.post('/', async (req, res) => {
    try {
        const entrega = { ...req.body };
        console.log('📥 POST /entregas - Creando nueva entrega:', {
            pedido_id: entrega.pedido_id,
            cant_bultos: entrega.cant_bultos,
            fecha_entrega: entrega.fecha_entrega
        });

        // Validaciones
        if (!entrega.pedido_id) {
            return res.status(400).json({ error: 'pedido_id es requerido' });
        }

        // Verificar que el pedido existe
        const pedido = await db('pedidos').where({ id: entrega.pedido_id }).first();
        if (!pedido) {
            return res.status(404).json({ error: 'Pedido no encontrado' });
        }

        console.log('📋 Pedido encontrado:', {
            id: pedido.id,
            comprobante: pedido.comprobante,
            en_logistica: pedido.en_logistica,
            cant_bultos: pedido.cant_bultos
        });

        // Procesar fechas
        if (entrega.fecha_entrega) {
            entrega.fecha_entrega = entrega.fecha_entrega.split('T')[0];
            console.log('📅 Fecha procesada:', entrega.fecha_entrega);
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
        console.log('🔢 Número de entrega asignado:', entrega.numero_entrega);

        // Validar que la cantidad no exceda el total del pedido (advertencia, no bloqueo)
        const entregasExistentes = await db('entregas')
            .where('pedido_id', entrega.pedido_id)
            .sum('cant_bultos as total');

        const totalEntregasExistentes = entregasExistentes[0]?.total || 0;
        const totalPedido = pedido.cant_bultos || 0;

        if (totalEntregasExistentes + entrega.cant_bultos > totalPedido) {
            console.log(`⚠️  Advertencia: La cantidad total de entregas (${totalEntregasExistentes + entrega.cant_bultos}) excede la cantidad del pedido (${totalPedido})`);
            // No bloqueamos la creación, solo registramos la advertencia
        }

        // Insertar la entrega
        let id;
        if (db.client.config.client === 'pg') {
            id = (await db('entregas').insert(entrega).returning('id'))[0].id;
        } else {
            id = await db('entregas').insert(entrega);
        }

        console.log('✅ Entrega creada exitosamente con ID:', id);
        res.status(201).json({ id });
    } catch (error) {
        console.error('❌ Error POST /entregas:', error);
        console.error('Stack:', error.stack);
        res.status(500).json({
            error: 'Error interno del servidor',
            details: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
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
        console.error('Stack:', error.stack);
        res.status(500).json({
            error: 'Error interno del servidor',
            details: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
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

        // Validar cantidad si cambió (advertencia, no bloqueo)
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
                console.log(`⚠️  Advertencia: La cantidad total de entregas (${totalOtrasEntregas + datos.cant_bultos}) excede la cantidad del pedido (${totalPedido})`);
                // No bloqueamos la edición, solo registramos la advertencia
            }
        }

        await db('entregas').where({ id: entregaId }).update(datos);
        res.json({ success: true });
    } catch (error) {
        console.error('Error PUT /entregas/:id:', error);
        console.error('Stack:', error.stack);
        res.status(500).json({
            error: 'Error interno del servidor',
            details: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
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
        console.error('Stack:', error.stack);
        res.status(500).json({
            error: 'Error interno del servidor',
            details: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
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
        console.error('Stack:', error.stack);
        res.status(500).json({
            error: 'Error interno del servidor',
            details: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
});

export default router;