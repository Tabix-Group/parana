#!/usr/bin/env node

import knex from 'knex';
import { createTables } from './migrations.js';
import { crearTablaEntregas } from './crear-entregas.js';

// Detectar si estamos en Railway/Postgres
const isPostgres = process.env.DATABASE_URL || (process.env.PGHOST && process.env.PGUSER && process.env.PGPASSWORD && process.env.PGDATABASE && process.env.PGPORT);

const db = isPostgres
    ? knex({
        client: 'pg',
        connection: process.env.DATABASE_URL
            ? process.env.DATABASE_URL
            : {
                host: process.env.PGHOST,
                user: process.env.PGUSER,
                password: process.env.PGPASSWORD,
                database: process.env.PGDATABASE,
                port: process.env.PGPORT
            },
        ssl: process.env.DATABASE_URL ? { rejectUnauthorized: false } : false
    })
    : knex({
        client: 'sqlite3',
        connection: {
            filename: './data.sqlite3'
        },
        useNullAsDefault: true
    });

async function initializeDatabase() {
    try {
        console.log('🚀 Iniciando inicialización completa de base de datos...');
        console.log(`📊 Tipo de BD: ${isPostgres ? 'PostgreSQL (Railway)' : 'SQLite (Local)'}`);

        // Mostrar configuración de conexión (sin credenciales sensibles)
        if (isPostgres) {
            console.log('🔧 Configuración PostgreSQL:');
            console.log(`   - Host: ${process.env.PGHOST || 'DATABASE_URL'}`);
            console.log(`   - Database: ${process.env.PGDATABASE || 'from DATABASE_URL'}`);
            console.log(`   - SSL: ${process.env.DATABASE_URL ? 'true' : 'false'}`);
        } else {
            console.log('🔧 Configuración SQLite:');
            console.log('   - Archivo: ./data.sqlite3');
        }

        // Paso 1: Verificar conexión
        console.log('🔍 Verificando conexión a base de datos...');
        await db.raw('SELECT 1 as test');
        console.log('✅ Conexión a base de datos exitosa');

        // Paso 2: Crear tablas base
        console.log('🏗️  Creando tablas base...');
        await createTables(db);
        console.log('✅ Tablas base creadas/verficadas');

        // Paso 3: Crear tabla entregas específicamente
        console.log('📦 Creando/verficando tabla entregas...');
        await crearTablaEntregas(db);
        console.log('✅ Tabla entregas creada/verificada');

        // Paso 4: Verificaciones finales específicas para PostgreSQL
        console.log('🔍 Realizando verificaciones finales...');

        if (isPostgres) {
            console.log('🔧 Verificando secuencias PostgreSQL...');
            try {
                // Verificar que las secuencias existen para tablas con auto-incremento
                const tablasConSecuencia = ['usuarios', 'clientes', 'armadores', 'transportes', 'tipos_transporte', 'vendedores', 'estados', 'pedidos', 'entregas', 'devoluciones'];

                for (const tabla of tablasConSecuencia) {
                    try {
                        const sequenceName = `${tabla}_id_seq`;
                        const sequenceExists = await db.raw(`
              SELECT EXISTS (
                SELECT 1 FROM information_schema.sequences
                WHERE sequence_name = ?
              )
            `, [sequenceName]);

                        if (sequenceExists.rows[0].exists) {
                            console.log(`✅ Secuencia ${sequenceName} existe`);
                        } else {
                            console.log(`⚠️  Secuencia ${sequenceName} no encontrada`);
                        }
                    } catch (seqError) {
                        console.log(`⚠️  Error verificando secuencia ${tabla}: ${seqError.message}`);
                    }
                }
            } catch (error) {
                console.log('⚠️  Error verificando secuencias:', error.message);
            }
        }

        // Verificar que todas las tablas existen
        const tablasRequeridas = ['usuarios', 'clientes', 'armadores', 'transportes', 'tipos_transporte', 'vendedores', 'estados', 'pedidos', 'entregas', 'devoluciones'];

        for (const tabla of tablasRequeridas) {
            const existe = await db.schema.hasTable(tabla);
            if (!existe) {
                throw new Error(`Tabla '${tabla}' no existe después de la inicialización`);
            }
            console.log(`✅ Tabla '${tabla}' verificada`);
        }

        // Verificar que podemos hacer consultas básicas
        const countEntregas = await db('entregas').count('id as count').first();
        console.log(`📊 Registros en entregas: ${countEntregas.count}`);

        // Verificar consultas complejas que usa la API
        console.log('🔍 Probando consulta compleja de entregas...');
        const testQuery = await db('entregas')
            .leftJoin('pedidos', 'entregas.pedido_id', 'pedidos.id')
            .leftJoin('clientes', 'pedidos.cliente_id', 'clientes.id')
            .select('entregas.id', 'pedidos.comprobante', 'clientes.nombre as cliente_nombre')
            .limit(1);

        console.log('✅ Consulta compleja funciona correctamente');

        console.log('🎉 Inicialización de base de datos completada exitosamente');
        console.log('✅ El servidor puede iniciarse ahora');

    } catch (error) {
        console.error('❌ Error durante la inicialización:', error);
        console.error('Stack completo:', error.stack);
        console.error('Tipo de BD detectado:', isPostgres ? 'PostgreSQL' : 'SQLite');
        process.exit(1);
    } finally {
        // Cerrar conexión
        await db.destroy();
    }
}

// Ejecutar inicialización
initializeDatabase().catch((error) => {
    console.error('💥 Error fatal:', error);
    process.exit(1);
});