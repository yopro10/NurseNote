import express from 'express';
import cors from 'cors';
import { env } from './config/env.js';
import authRoutes from './routes/authRoutes.js';
import userRoutes from './routes/userRoutes.js';
import pacienteRoutes from './routes/pacienteRoutes.js';
import notaRoutes from './routes/notaRoutes.js';
import medicamentoRoutes from './routes/medicamentoRoutes.js';
import prescripcionRoutes from './routes/prescripcionRoutes.js';
import administracionRoutes from './routes/administracionRoutes.js';
import signosVitalesRoutes from './routes/signosVitalesRoutes.js';
import turnoRoutes from './routes/turnoRoutes.js';
import dashboardRoutes from './routes/dashboardRoutes.js';
import estadisticasRoutes from './routes/estadisticasRoutes.js';
import notificacionRoutes from './routes/notificacionRoutes.js';
import reporteRoutes from './routes/reporteRoutes.js';
import initializeDatabase from '../scripts/initDatabase.js';

const app = express();

app.use(cors({ origin: [env.FRONTEND_URL, 'http://localhost:5173', 'http://127.0.0.1:5173'], exposedHeaders: ['Content-Disposition'] }));
app.use(express.json({ limit: '1mb' }));

if (env.NODE_ENV !== 'test') {
  app.use((req, _res, next) => { console.log(`${new Date().toISOString()} ${req.method} ${req.path}`); next(); });
}

app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/pacientes', pacienteRoutes);
app.use('/api/notas', notaRoutes);
app.use('/api/medicamentos', medicamentoRoutes);
app.use('/api/prescripciones', prescripcionRoutes);
app.use('/api/administraciones', administracionRoutes);
app.use('/api/signos-vitales', signosVitalesRoutes);
app.use('/api/turnos', turnoRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/estadisticas', estadisticasRoutes);
app.use('/api/notificaciones', notificacionRoutes);
app.use('/api/reportes', reporteRoutes);

app.get('/health', (_req, res) => res.json({ status: 'OK', timestamp: new Date().toISOString() }));
app.use((_req, res) => res.status(404).json({ error: 'Ruta no encontrada' }));

// eslint-disable-next-line no-unused-vars
app.use((err, _req, res, _next) => {
  if (err.type === 'entity.parse.failed') return res.status(400).json({ error: 'JSON inválido en la solicitud' });
  const status = err.status || 500;
  if (status >= 500) console.error('Error:', err);
  res.status(status).json({ error: status >= 500 && env.NODE_ENV === 'production' ? 'Error interno del servidor' : err.message || 'Error interno', ...(err.extra || {}) });
});

async function start() {
  try {
    await initializeDatabase();
    app.listen(env.PORT, () => console.log(`🚀 API lista en http://localhost:${env.PORT}`));
  } catch (error) {
    console.error('❌ No se pudo iniciar el servidor:', error.message);
    console.error('   Revisa DB_HOST, DB_USER y DB_PASSWORD en backend/.env y que PostgreSQL esté encendido.');
    process.exit(1);
  }
}
start();
