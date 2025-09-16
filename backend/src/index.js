import express from 'express';
import cors from 'cors';
import knex from 'knex';
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

// Middleware de logging para todas las peticiones
app.use((req, res, next) => {
  console.log(`📨 ${req.method} ${req.path} - IP: ${req.ip} - User-Agent: ${req.get('User-Agent')}`);
  next();
});

// Función para inicializar la base de datos con reintentos
async function initializeDatabase(maxRetries = 3) {
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      console.log(`🚀 Intento ${attempt}/${maxRetries} - Verificando conexión a base de datos...`);

      // Verificar conexión a la base de datos
      await db.raw('SELECT 1');
      console.log('✅ Conexión a base de datos verificada');

      // Verificar que la tabla entregas existe
      const tablaExiste = await db.schema.hasTable('entregas');
      if (!tablaExiste) {
        console.log('⚠️  Tabla entregas no encontrada, intentando crear...');
        const { crearTablaEntregas } = await import('./crear-entregas.js');
        await crearTablaEntregas(db);
        console.log('✅ Tabla entregas creada');
      } else {
        console.log('✅ Tabla entregas ya existe');
      }

      // Verificación final
      const count = await db('entregas').count('id as count').first();
      console.log(`📊 Registros en entregas: ${count.count}`);

      return; // Éxito

    } catch (error) {
      console.error(`❌ Error en intento ${attempt}/${maxRetries}:`, error.message);

      if (attempt === maxRetries) {
        console.error('💥 No se pudo verificar la base de datos después de varios intentos');
        throw error;
      }

      // Esperar antes del siguiente intento
      console.log(`⏳ Esperando 2 segundos antes del siguiente intento...`);
      await new Promise(resolve => setTimeout(resolve, 2000));
    }
  }
}

// Inicializar base de datos y luego iniciar servidor
console.log('🔄 Iniciando servidor...');
console.log(`📊 Base de datos: ${isPostgres ? 'PostgreSQL (Railway)' : 'SQLite (Local)'}`);
console.log(`🌐 Puerto: ${port}`);

initializeDatabase().then(() => {
  console.log('✅ Base de datos verificada, iniciando rutas...');

  // Health check endpoint
  app.get('/health', async (req, res) => {
    try {
      // Verificar conexión a BD
      await db.raw('SELECT 1');
      const entregasCount = await db('entregas').count('id as count').first();

      res.json({
        status: 'OK',
        timestamp: new Date().toISOString(),
        database: isPostgres ? 'PostgreSQL' : 'SQLite',
        entregasCount: entregasCount.count,
        uptime: process.uptime()
      });
    } catch (error) {
      res.status(500).json({
        status: 'ERROR',
        error: error.message,
        timestamp: new Date().toISOString()
      });
    }
  });

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
    console.log('🎉 Servidor completamente operativo');
    console.log(`🔗 Health check: http://localhost:${port}/health`);
  });
}).catch((error) => {
  console.error('❌ Error fatal durante la inicialización:', error);
  console.error('Stack completo:', error.stack);
  process.exit(1);
});
