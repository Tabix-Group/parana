// backend/src/migrations.js
export async function createTables(db) {
  // Usuarios
  await db.schema.hasTable('usuarios').then(exists => {
    if (!exists) {
      return db.schema.createTable('usuarios', t => {
        t.increments('id').primary();
        t.string('nombre').notNullable();
        t.string('mail').notNullable();
        t.string('clave').notNullable();
        t.string('rol').notNullable(); // admin, ventas, logistica
      });
    }
  });
  // Clientes
  await db.schema.hasTable('clientes').then(exists => {
    if (!exists) {
      return db.schema.createTable('clientes', t => {
        t.increments('id').primary();
        t.string('nombre').notNullable();
        t.string('direccion');
        t.string('localidad');
        t.string('telefono');
      });
    }
  });
  // Armadores
  await db.schema.hasTable('armadores').then(exists => {
    if (!exists) {
      return db.schema.createTable('armadores', t => {
        t.increments('id').primary();
        t.string('nombre').notNullable();
        t.string('apellido').notNullable();
      });
    }
  });
  // Transportes
  await db.schema.hasTable('transportes').then(exists => {
    if (!exists) {
      return db.schema.createTable('transportes', t => {
        t.increments('id').primary();
        t.string('nombre').notNullable();
        t.string('telefono');
      });
    }
  });
  // Tipos de transporte
  await db.schema.hasTable('tipos_transporte').then(exists => {
    if (!exists) {
      return db.schema.createTable('tipos_transporte', t => {
        t.increments('id').primary();
        t.string('nombre').notNullable();
      });
    }
  });
  // Vendedores
  await db.schema.hasTable('vendedores').then(exists => {
    if (!exists) {
      return db.schema.createTable('vendedores', t => {
        t.increments('id').primary();
        t.string('nombre').notNullable();
        t.string('apellido').notNullable();
        t.string('telefono');
      });
    }
  });
  // Estados
  await db.schema.hasTable('estados').then(exists => {
    if (!exists) {
      return db.schema.createTable('estados', t => {
        t.increments('id').primary();
        t.string('nombre').notNullable();
      });
    }
  });
  // Pedidos
  await db.schema.hasTable('pedidos').then(exists => {
    if (!exists) {
      return db.schema.createTable('pedidos', t => {
        t.increments('id').primary();
        t.string('comprobante').notNullable();
        t.integer('cliente_id').references('id').inTable('clientes');
        t.string('direccion');
        t.integer('armador_id').references('id').inTable('armadores');
        t.integer('tipo_transporte_id').references('id').inTable('tipos_transporte');
        t.integer('transporte_id').references('id').inTable('transportes');
        t.integer('vendedor_id').references('id').inTable('vendedores');
        t.date('fecha_entrega');
        t.integer('estado_id').references('id').inTable('estados');
        t.text('notas');
      });
    }
  });
  // Devoluciones
  await db.schema.hasTable('devoluciones').then(exists => {
    if (!exists) {
      return db.schema.createTable('devoluciones', t => {
        t.increments('id').primary();
        t.integer('pedido_id').references('id').inTable('pedidos');
        t.string('tipo'); // efectivo o material
        t.boolean('recibido');
        t.date('fecha');
      });
    }
  });
}
