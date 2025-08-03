exports.up = function(knex) {
  return knex.schema.table('pedidos', function(table) {
    table.integer('Codigo').nullable().comment('Código del cliente asociado al pedido');
  });
};

exports.down = function(knex) {
  return knex.schema.table('pedidos', function(table) {
    table.dropColumn('Codigo');
  });
};
