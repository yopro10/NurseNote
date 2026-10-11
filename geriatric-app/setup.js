#!/usr/bin/env node

import fs from 'fs';
import path from 'path';
import readline from 'readline';
import { execSync } from 'child_process';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

function question(prompt) {
  return new Promise((resolve) => {
    rl.question(prompt, resolve);
  });
}

function createBackendEnv(config) {
  const envContent = `DB_HOST=${config.dbHost}
DB_PORT=${config.dbPort}
DB_NAME=${config.dbName}
DB_USER=${config.dbUser}
DB_PASSWORD=${config.dbPassword}
PORT=${config.port}
NODE_ENV=development
JWT_SECRET=${config.jwtSecret}
JWT_EXPIRES_IN=24h
FRONTEND_URL=${config.frontendUrl}
`;
  return envContent;
}

function createFrontendEnv(config) {
  return `VITE_API_URL=${config.apiUrl}
`;
}

async function main() {
  console.log('========================================');
  console.log('Configuración de NurseNote');
  console.log('========================================');
  console.log('');

  // Preguntar credenciales de PostgreSQL
  console.log('Configuración de PostgreSQL:');
  const dbHost = await question('Host de PostgreSQL [localhost]: ') || 'localhost';
  const dbPort = await question('Puerto de PostgreSQL [5432]: ') || '5432';
  const dbName = await question('Nombre de la base de datos [geriatric_app]: ') || 'geriatric_app';
  const dbUser = await question('Usuario de PostgreSQL [postgres]: ') || 'postgres';
  const dbPassword = await question('Contraseña de PostgreSQL: ');

  if (!dbPassword) {
    console.log('');
    console.log('❌ La contraseña de PostgreSQL es obligatoria');
    rl.close();
    process.exit(1);
  }

  console.log('');
  console.log('Configuración del servidor:');
  const port = await question('Puerto del servidor [3000]: ') || '3000';
  const jwtSecret = await question('JWT Secret [presiona Enter para generar uno]: ') ||
    'geriatric-app-secret-' + Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
  const frontendUrl = await question('URL del Frontend [http://localhost:5173]: ') || 'http://localhost:5173';
  const apiUrl = await question('URL del Backend [http://localhost:3000]: ') || 'http://localhost:3000';

  const config = {
    dbHost,
    dbPort,
    dbName,
    dbUser,
    dbPassword,
    port,
    jwtSecret,
    frontendUrl,
    apiUrl
  };

  console.log('');
  console.log('========================================');
  console.log('Creando archivos de configuración...');
  console.log('========================================');
  console.log('');

  // Crear .env del backend
  const backendEnvPath = path.join(__dirname, 'backend', '.env');
  if (!fs.existsSync(backendEnvPath)) {
    fs.writeFileSync(backendEnvPath, createBackendEnv(config));
    console.log('✅ Archivo .env creado en backend/');
  } else {
    console.log('ℹ️  El archivo backend/.env ya existe (no se sobrescribe)');
  }

  // Crear .env del frontend
  const frontendEnvPath = path.join(__dirname, '.env');
  if (!fs.existsSync(frontendEnvPath)) {
    fs.writeFileSync(frontendEnvPath, createFrontendEnv(config));
    console.log('✅ Archivo .env creado en la raíz');
  } else {
    console.log('ℹ️  El archivo .env ya existe en la raíz (no se sobrescribe)');
  }

  console.log('');
  console.log('========================================');
  console.log('Instalando dependencias...');
  console.log('========================================');
  console.log('');

  // Instalar dependencias del backend
  console.log('Instalando dependencias del backend...');
  try {
    execSync('cd backend && npm install', { stdio: 'inherit' });
    console.log('✅ Dependencias del backend instaladas');
  } catch (error) {
    console.log('❌ Error al instalar dependencias del backend');
    rl.close();
    process.exit(1);
  }

  // Instalar dependencias del frontend
  console.log('');
  console.log('Instalando dependencias del frontend...');
  try {
    execSync('npm install', { stdio: 'inherit' });
    console.log('✅ Dependencias del frontend instaladas');
  } catch (error) {
    console.log('❌ Error al instalar dependencias del frontend');
    rl.close();
    process.exit(1);
  }

  console.log('');
  console.log('========================================');
  console.log('✅ Configuración completada!');
  console.log('========================================');
  console.log('');
  console.log('Siguientes pasos:');
  console.log('1. Asegúrate de que PostgreSQL esté corriendo');
  console.log('2. Inicia el backend: cd backend && npm run dev');
  console.log('3. Inicia el frontend: npm run dev');
  console.log('');
  console.log('Usuarios de prueba:');
  console.log('- Admin: admin@geriatric.com / admin123');
  console.log('- Enfermera: maria.garcia@geriatric.com / enfermera123');
  console.log('- Jefe: carlos.rodriguez@geriatric.com / jefe123');
  console.log('');

  rl.close();
}

main();
