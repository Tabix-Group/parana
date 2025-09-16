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
import usuariosRoutes from './routes/usuarios.js';
import loginRoutes from './routes/login.js';
import reportesRoutes from './routes/reportes.js';
import entregasRoutes from './routes/entregas.js';

// Detectar si estamos en Railway/Postgres
const isPostgres = process.env.DATABASE_URL || (process.env.PGHOST && process.env.PGUSER && process.env.PGPASSWORD && process.env.PGDATABASE && process.env.PGPORT);

const app = express();
const port = process.env.PORT || 4000;

export const db = isPostgres
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
    // Para Railway, forzar SSL si es necesario
    ...(process.env.DATABASE_URL ? { ssl: { rejectUnauthorized: false } } : {})
  })
  : knex({
    client: 'sqlite3',
    connection: {
      filename: './data.sqlite3'
    },
    useNullAsDefault: true
  });

app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(express.json());

// Función para inicializar la base de datos
async function initializeDatabase() {
  try {
    console.log('🚀 Iniciando inicialización de base de datos...');

    // Crear tablas base si no existen
    await createTables(db);
    console.log('✅ Tablas base creadas/verficadas');

    // Crear/verificar tabla entregas específicamente
    const { crearTablaEntregas } = await import('./crear-entregas.js');
    await crearTablaEntregas(db);
    console.log('✅ Tabla entregas creada/verificada');

    console.log('🎉 Base de datos inicializada correctamente');
  } catch (error) {
    console.error('❌ Error inicializando base de datos:', error);
    // No salir del proceso, continuar con el servidor
    console.log('⚠️  Continuando con el servidor a pesar del error de BD');
  }
}

// Inicializar base de datos y luego iniciar servidor
initializeDatabase().then(() => {
  // Rutas
  app.use('/api/pedidos', pedidosRoutes);
  app.use('/api/clientes', clientesRoutes);
  app.use('/api/armadores', armadoresRoutes);
  app.use('/api/transportes', transportesRoutes);
  app.use('/api/tipos-transporte', tiposTransporteRoutes);
  app.use('/api/vendedores', vendedoresRoutes);
  app.use('/api/estados', estadosRoutes);
  app.use('/api/devoluciones', devolucionesRoutes);
  app.use('/api/usuarios', usuariosRoutes);
  app.use('/api/login', loginRoutes);
  app.use('/api/reportes', reportesRoutes);
  app.use('/api/entregas', entregasRoutes);

  app.listen(port, () => {
    console.log(`🚀 Backend escuchando en http://localhost:${port}`);
    console.log(`📊 Base de datos: ${isPostgres ? 'PostgreSQL (Railway)' : 'SQLite (Local)'}`);
  });
}).catch((error) => {
  console.error('❌ Error fatal al inicializar:', error);
  process.exit(1);
});
