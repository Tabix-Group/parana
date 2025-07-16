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
  await db.schema.hasTable('clientes').then(exists => {
    if (!exists) {
      return db.schema.createTable('clientes', t => {
        t.increments('id').primary();
        t.string('nombre', 255).notNullable();
        t.string('direccion', 255);
        t.string('localidad', 100);
        t.string('telefono', 50);
      });
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
        t.date('fecha_entrega');
        t.integer('estado_id').nullable().references('id').inTable('estados').onDelete('SET NULL');
        t.text('notas');
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
    }
  });
  // Devoluciones
  await db.schema.hasTable('devoluciones').then(exists => {
    if (!exists) {
      return db.schema.createTable('devoluciones', t => {
        t.increments('id').primary();
        t.integer('pedido_id').nullable().references('id').inTable('pedidos').onDelete('SET NULL');
        t.string('tipo', 50); // efectivo o material
        t.boolean('recibido');
        t.date('fecha');
        t.text('texto'); // Observaciones
      });
    } else {
      // Si la columna no existe, agregarla
      return db.schema.hasColumn('devoluciones', 'texto').then(hasCol => {
        if (!hasCol) {
          return db.schema.table('devoluciones', t => {
            t.text('texto');
          });
        }
      });
    }
  });
}
