import express from 'express';
import cors from 'cors';
import knex from 'knex';
import { createTables } from './migrations.js';
import pedidosRoutes from './routes/pedidos.js';
import clientesRoutes from './routes/clientes.js';
import armadoresRoutes from './routes/armadores.js';
import transportesRoutes from './routes/transportes.js';
import tiposTransporteRoutes from './routes/tiposTransporte.js';
import vendedoresRoutes from './routes/vendedores.js';
import estadosRoutes from './routes/estados.js';
import devolucionesRoutes from './routes/devoluciones.js';

const app = express();
const port = process.env.PORT || 4000;

export const db = knex({
  client: 'sqlite3',
  connection: {
    filename: './data.sqlite3'
  },
  useNullAsDefault: true
});

app.use(cors());
app.use(express.json());

// Crear tablas si no existen
createTables(db);

// Rutas
app.use('/api/pedidos', pedidosRoutes);
app.use('/api/clientes', clientesRoutes);
app.use('/api/armadores', armadoresRoutes);
app.use('/api/transportes', transportesRoutes);
app.use('/api/tipos-transporte', tiposTransporteRoutes);
app.use('/api/vendedores', vendedoresRoutes);
app.use('/api/estados', estadosRoutes);
app.use('/api/devoluciones', devolucionesRoutes);

app.listen(port, () => {
  console.log(`Backend escuchando en http://localhost:${port}`);
});
