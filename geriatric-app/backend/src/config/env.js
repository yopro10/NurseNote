import 'dotenv/config';

export const env = {
  PORT: Number(process.env.PORT) || 3000,
  NODE_ENV: process.env.NODE_ENV || 'development',
  JWT_SECRET: process.env.JWT_SECRET || 'dev-only-secret-change-me',
  JWT_EXPIRES_IN: process.env.JWT_EXPIRES_IN || '12h',
  FRONTEND_URL: process.env.FRONTEND_URL || 'http://localhost:5173',
  db: {
    host: process.env.DB_HOST || 'localhost',
    port: Number(process.env.DB_PORT) || 5432,
    user: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'geriatric_app',
  },
};

if (env.NODE_ENV === 'production' && env.JWT_SECRET === 'dev-only-secret-change-me') {
  throw new Error('Define JWT_SECRET en el .env antes de ejecutar en producción.');
}
