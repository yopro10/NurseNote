import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import authRoutes from './routes/authRoutes.js';
import userRoutes from './routes/userRoutes.js';
import pacienteRoutes from './routes/pacienteRoutes.js';
import notaRoutes from './routes/notaRoutes.js';
import medicamentoRoutes from './routes/medicamentoRoutes.js';
import medicamentoPacienteRoutes from './routes/medicamentoPacienteRoutes.js';
import signosVitalesRoutes from './routes/signosVitalesRoutes.js';
import dashboardRoutes from './routes/dashboardRoutes.js';
import metricasRoutes from './routes/metricasRoutes.js';
import initializeDatabase from '../scripts/initDatabase.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Request logging middleware
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
  next();
});

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/pacientes', pacienteRoutes);
app.use('/api/notas', notaRoutes);
app.use('/api/medicamentos', medicamentoRoutes);
app.use('/api/medicamentos-pacientes', medicamentoPacienteRoutes);
app.use('/api/signos-vitales', signosVitalesRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/metricas', metricasRoutes);

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'OK', message: 'Server is running', timestamp: new Date().toISOString() });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Error:', err);
  res.status(err.status || 500).json({
    error: err.message || 'Something went wrong!',
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

// Inicializar base de datos y luego iniciar el servidor
async function startServer() {
  try {
    console.log('🔍 Verificando base de datos...');
    await initializeDatabase();
    console.log('✅ Base de datos lista');

    app.listen(PORT, () => {
      console.log(`🚀 Server running on port ${PORT}`);
      console.log(`📊 Environment: ${process.env.NODE_ENV || 'development'}`);
      console.log(`🌐 API disponible en: http://localhost:${PORT}`);
    });
  } catch (error) {
    console.error('❌ Error al iniciar el servidor:', error);
    process.exit(1);
  }
}

startServer();