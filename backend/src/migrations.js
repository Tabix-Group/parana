// backend/src/migrations.js
export async function createTables(db) {
  // Usuarios
  await db.schema.hasTable('usuarios').then(exists => {
    if (!exists) {
      return db.schema.createTable('usuarios', t => {
        t.increments('id').primary();
        t.string('nombre', 255).notNullable();
        t.string('mail', 255).notNullable();
        t.string('clave', 255).notNullable();
        t.string('rol', 50).notNullable(); // admin, ventas, logistica
      });
    }
  });
  // Clientes
  await db.schema.hasTable('clientes').then(async exists => {
    if (!exists) {
      return db.schema.createTable('clientes', t => {
        t.increments('id').primary();
        t.string('nombre', 255).notNullable();
        t.string('direccion', 255);
        t.string('localidad', 100);
        t.string('telefono', 50);
        t.integer('Codigo'); // Nueva columna Codigo
      });
    } else {
      // Si la columna Codigo no existe, agregarla
      const hasCodigo = await db.schema.hasColumn('clientes', 'Codigo');
      if (!hasCodigo) {
        await db.schema.table('clientes', t => {
          t.integer('Codigo');
        });
      }
      
      // Reiniciar la secuencia de auto-incremento para PostgreSQL
      if (db.client.config.client === 'pg') {
        try {
          const maxIdResult = await db('clientes').max('id as max_id').first();
          const maxId = maxIdResult?.max_id || 0;
          const nextId = maxId + 1;
          await db.raw(`SELECT setval(pg_get_serial_sequence('clientes', 'id'), ${nextId}, false)`);
          console.log(`Secuencia de clientes reiniciada. Próximo ID: ${nextId}`);
        } catch (err) {
          console.log('Error al reiniciar secuencia de clientes:', err.message);
        }
      }
    }
  });
  // Armadores
  await db.schema.hasTable('armadores').then(exists => {
    if (!exists) {
      return db.schema.createTable('armadores', t => {
        t.increments('id').primary();
        t.string('nombre', 255).notNullable();
        t.string('apellido', 255).notNullable();
      });
    }
  });
  // Transportes
  await db.schema.hasTable('transportes').then(exists => {
    if (!exists) {
      return db.schema.createTable('transportes', t => {
        t.increments('id').primary();
        t.string('nombre', 255).notNullable();
        t.string('telefono', 50);
      });
    }
  });
  // Tipos de transporte
  await db.schema.hasTable('tipos_transporte').then(exists => {
    if (!exists) {
      return db.schema.createTable('tipos_transporte', t => {
        t.increments('id').primary();
        t.string('nombre', 255).notNullable();
      });
    }
  });
  // Vendedores
  await db.schema.hasTable('vendedores').then(exists => {
    if (!exists) {
      return db.schema.createTable('vendedores', t => {
        t.increments('id').primary();
        t.string('nombre', 255).notNullable();
        t.string('apellido', 255).notNullable();
        t.string('telefono', 50);
      });
    }
  });
  console.log('Iniciando creación de tablas en DB:', db.client.config.connection);
  // Estados
  await db.schema.hasTable('estados').then(exists => {
    if (!exists) {
      return db.schema.createTable('estados', t => {
        t.increments('id').primary();
        t.string('nombre', 255).notNullable();
      });
    }
  });
  // Pedidos
  await db.schema.hasTable('pedidos').then(async exists => {
    if (!exists) {
      return db.schema.createTable('pedidos', t => {
        t.increments('id').primary();
        t.string('comprobante', 255).notNullable();
        t.integer('cliente_id').nullable().references('id').inTable('clientes').onDelete('SET NULL');
        t.string('direccion', 255);
        t.integer('armador_id').nullable().references('id').inTable('armadores').onDelete('SET NULL');
        t.integer('tipo_transporte_id').nullable().references('id').inTable('tipos_transporte').onDelete('SET NULL');
        t.integer('transporte_id').nullable().references('id').inTable('transportes').onDelete('SET NULL');
        t.integer('vendedor_id').nullable().references('id').inTable('vendedores').onDelete('SET NULL');
        t.integer('cant_bultos');
        t.string('tipo_bultos', 100);
        t.date('fecha_pedido').nullable().comment('Fecha en que se realizó el pedido');
        t.date('fecha_entrega');
        t.integer('estado_id').nullable().references('id').inTable('estados').onDelete('SET NULL');
        t.text('notas');
        t.integer('Codigo').nullable().comment('Código del cliente asociado al pedido');
      });
    } else {
      // Si las columnas no existen, agregarlas
      const hasCant = await db.schema.hasColumn('pedidos', 'cant_bultos');
      if (!hasCant) {
        await db.schema.table('pedidos', t => {
          t.integer('cant_bultos');
        });
      }
      const hasTipo = await db.schema.hasColumn('pedidos', 'tipo_bultos');
      if (!hasTipo) {
        await db.schema.table('pedidos', t => {
          t.string('tipo_bultos', 100);
        });
      }
      const hasCodigo = await db.schema.hasColumn('pedidos', 'Codigo');
      if (!hasCodigo) {
        await db.schema.table('pedidos', t => {
          t.integer('Codigo').nullable().comment('Código del cliente asociado al pedido');
        });
      }
      
      const hasFechaPedido = await db.schema.hasColumn('pedidos', 'fecha_pedido');
      if (!hasFechaPedido) {
        await db.schema.table('pedidos', t => {
          t.date('fecha_pedido').nullable().comment('Fecha en que se realizó el pedido');
        });
      }
      
      const hasEnLogistica = await db.schema.hasColumn('pedidos', 'en_logistica');
      if (!hasEnLogistica) {
        await db.schema.table('pedidos', t => {
          t.boolean('en_logistica').defaultTo(false).comment('Si el pedido está enviado a logística');
        });
      }
      
      const hasCompletado = await db.schema.hasColumn('pedidos', 'completado');
      if (!hasCompletado) {
        await db.schema.table('pedidos', t => {
          t.boolean('completado').defaultTo(false).comment('Si el pedido está completado/entregado');
        });
      }
      // Agregar columna 'ok' para marcar pedidos OK/No OK
      const hasOk = await db.schema.hasColumn('pedidos', 'ok');
      if (!hasOk) {
        await db.schema.table('pedidos', t => {
          t.boolean('ok').defaultTo(false).comment('Marca si el pedido fue verificado OK');
        });
      }
      
      // Reiniciar la secuencia de auto-incremento para PostgreSQL
      if (db.client.config.client === 'pg') {
        try {
          const maxIdResult = await db('pedidos').max('id as max_id').first();
          const maxId = maxIdResult?.max_id || 0;
          const nextId = maxId + 1;
          await db.raw(`SELECT setval(pg_get_serial_sequence('pedidos', 'id'), ${nextId}, false)`);
          console.log(`Secuencia de pedidos reiniciada. Próximo ID: ${nextId}`);
        } catch (err) {
          console.log('Error al reiniciar secuencia de pedidos:', err.message);
        }
      }
    }
  });
  // Devoluciones
  await db.schema.hasTable('devoluciones').then(async exists => {
    if (!exists) {
      return db.schema.createTable('devoluciones', t => {
        t.increments('id').primary();
        t.integer('pedido_id').nullable().references('id').inTable('pedidos').onDelete('SET NULL');
        t.integer('cliente_id').nullable().references('id').inTable('clientes').onDelete('SET NULL');
        t.integer('transporte_id').nullable().references('id').inTable('transportes').onDelete('SET NULL');
        t.string('tipo', 50); // cobro, pago, entrega_material, retiro_material
        t.boolean('recibido');
        t.date('fecha');
        t.text('texto'); // Observaciones
        t.integer('Codigo').nullable().comment('Código del cliente asociado a la devolución');
      });
    } else {
      // Si las columnas no existen, agregarlas
      return Promise.all([
        db.schema.hasColumn('devoluciones', 'texto').then(hasCol => {
          if (!hasCol) {
            return db.schema.table('devoluciones', t => {
              t.text('texto');
            });
          }
        }),
        db.schema.hasColumn('devoluciones', 'cliente_id').then(hasCol => {
          if (!hasCol) {
            return db.schema.table('devoluciones', t => {
              t.integer('cliente_id').nullable().references('id').inTable('clientes').onDelete('SET NULL');
            });
          }
        }),
        db.schema.hasColumn('devoluciones', 'transporte_id').then(hasCol => {
          if (!hasCol) {
            return db.schema.table('devoluciones', t => {
              t.integer('transporte_id').nullable().references('id').inTable('transportes').onDelete('SET NULL');
            });
          }
        }),
        db.schema.hasColumn('devoluciones', 'Codigo').then(hasCol => {
          if (!hasCol) {
            return db.schema.table('devoluciones', t => {
              t.integer('Codigo').nullable().comment('Código del cliente asociado a la devolución');
            });
          }
        }),
        db.schema.hasColumn('devoluciones', 'en_logistica').then(hasCol => {
          if (!hasCol) {
            return db.schema.table('devoluciones', t => {
              t.boolean('en_logistica').defaultTo(false).comment('Si la devolución está enviada a logística');
            });
          }
        }),
        db.schema.hasColumn('devoluciones', 'completado').then(hasCol => {
          if (!hasCol) {
            return db.schema.table('devoluciones', t => {
              t.boolean('completado').defaultTo(false).comment('Si la devolución está completada');
            });
          }
        }),
        db.schema.hasColumn('devoluciones', 'ok').then(hasCol => {
          if (!hasCol) {
            return db.schema.table('devoluciones', t => {
              t.boolean('ok').defaultTo(false).comment('Marca si la devolución fue verificada OK');
            });
          }
        }),
        db.schema.hasColumn('devoluciones', 'fecha_pedido').then(hasCol => {
          if (!hasCol) {
            return db.schema.table('devoluciones', t => {
              t.date('fecha_pedido').nullable().comment('Fecha en que se realizó el pedido asociado a la devolución');
            });
          }
        })
      ]);
    }
  });
  console.log('Tablas creadas (o ya existen)');
}
