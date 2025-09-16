import { db } from './index.js';

// Script para crear la tabla entregas manualmente en producción
export async function crearTablaEntregas() {
    try {
        console.log('Verificando tabla entregas...');

        const tablaExiste = await db.schema.hasTable('entregas');

        if (!tablaExiste) {
            console.log('Creando tabla entregas...');

            await db.schema.createTable('entregas', t => {
                t.increments('id').primary();
                t.integer('pedido_id').notNullable().references('id').inTable('pedidos').onDelete('CASCADE');
                t.integer('cant_bultos').notNullable().defaultTo(0);
                t.string('direccion', 255);
                t.integer('armador_id').nullable().references('id').inTable('armadores').onDelete('SET NULL');
                t.integer('tipo_transporte_id').nullable().references('id').inTable('tipos_transporte').onDelete('SET NULL');
                t.integer('transporte_id').nullable().references('id').inTable('transportes').onDelete('SET NULL');
                t.integer('estado_id').nullable().references('id').inTable('estados').onDelete('SET NULL');
                t.date('fecha_entrega');
                t.text('notas');
                t.boolean('completado').defaultTo(false).comment('Si la entrega parcial está completada');
                t.boolean('ok').defaultTo(false).comment('Marca si la entrega fue verificada OK');
                t.timestamp('fecha_creacion').defaultTo(db.fn.now());
                t.integer('numero_entrega').comment('Número secuencial de la entrega dentro del pedido');
            });

            console.log('Tabla entregas creada exitosamente');
        } else {
            console.log('La tabla entregas ya existe');

            // Verificar columnas faltantes
            const columnasFaltantes = [];

            const columnasRequeridas = [
                'cant_bultos', 'direccion', 'armador_id', 'tipo_transporte_id',
                'transporte_id', 'estado_id', 'fecha_entrega', 'notas',
                'completado', 'ok', 'fecha_creacion', 'numero_entrega'
            ];

            for (const columna of columnasRequeridas) {
                const existe = await db.schema.hasColumn('entregas', columna);
                if (!existe) {
                    columnasFaltantes.push(columna);
                }
            }

            if (columnasFaltantes.length > 0) {
                console.log('Agregando columnas faltantes:', columnasFaltantes);

                for (const columna of columnasFaltantes) {
                    await db.schema.table('entregas', table => {
                        switch (columna) {
                            case 'cant_bultos':
                                table.integer('cant_bultos').notNullable().defaultTo(0);
                                break;
                            case 'direccion':
                                table.string('direccion', 255);
                                break;
                            case 'armador_id':
                                table.integer('armador_id').nullable().references('id').inTable('armadores').onDelete('SET NULL');
                                break;
                            case 'tipo_transporte_id':
                                table.integer('tipo_transporte_id').nullable().references('id').inTable('tipos_transporte').onDelete('SET NULL');
                                break;
                            case 'transporte_id':
                                table.integer('transporte_id').nullable().references('id').inTable('transportes').onDelete('SET NULL');
                                break;
                            case 'estado_id':
                                table.integer('estado_id').nullable().references('id').inTable('estados').onDelete('SET NULL');
                                break;
                            case 'fecha_entrega':
                                table.date('fecha_entrega');
                                break;
                            case 'notas':
                                table.text('notas');
                                break;
                            case 'completado':
                                table.boolean('completado').defaultTo(false);
                                break;
                            case 'ok':
                                table.boolean('ok').defaultTo(false);
                                break;
                            case 'fecha_creacion':
                                table.timestamp('fecha_creacion').defaultTo(db.fn.now());
                                break;
                            case 'numero_entrega':
                                table.integer('numero_entrega');
                                break;
                        }
                    });
                }

                console.log('Columnas faltantes agregadas');
            }
        }

        // Verificar que la tabla se creó correctamente
        const count = await db('entregas').count('id as count').first();
        console.log(`Tabla entregas verificada. Registros actuales: ${count.count}`);

    } catch (error) {
        console.error('Error creando/verificando tabla entregas:', error);
        throw error;
    }
}

// Ejecutar si se llama directamente
if (import.meta.url === `file://${process.argv[1]}`) {
    crearTablaEntregas()
        .then(() => {
            console.log('Script completado exitosamente');
            process.exit(0);
        })
        .catch((error) => {
            console.error('Error en el script:', error);
            process.exit(1);
        });
}