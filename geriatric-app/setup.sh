#!/bin/bash

echo "========================================"
echo "Configuración de NurseNote"
echo "========================================"
echo ""

# Crear .env para el backend
echo "Creando archivo .env para el backend..."
cd backend
if [ ! -f .env ]; then
    cat > .env << EOF
DB_HOST=localhost
DB_PORT=5432
DB_NAME=geriatric_app
DB_USER=postgres
DB_PASSWORD=yopro1015
PORT=3000
NODE_ENV=development
JWT_SECRET=geriatric-app-secret-key-2024
JWT_EXPIRES_IN=24h
FRONTEND_URL=http://localhost:5173
EOF
    echo "✅ Archivo .env creado en backend"
else
    echo "ℹ️  El archivo .env ya existe en backend"
fi

cd ..

# Crear .env para el frontend
echo "Creando archivo .env para el frontend..."
if [ ! -f .env ]; then
    cat > .env << EOF
VITE_API_URL=http://localhost:3000
EOF
    echo "✅ Archivo .env creado en frontend"
else
    echo "ℹ️  El archivo .env ya existe en frontend"
fi

echo ""
echo "========================================"
echo "Instalando dependencias..."
echo "========================================"
echo ""

# Instalar dependencias del backend
echo "Instalando dependencias del backend..."
cd backend
npm install
if [ $? -ne 0 ]; then
    echo "❌ Error al instalar dependencias del backend"
    exit 1
fi
echo "✅ Dependencias del backend instaladas"
cd ..

# Instalar dependencias del frontend
echo "Instalando dependencias del frontend..."
npm install
if [ $? -ne 0 ]; then
    echo "❌ Error al instalar dependencias del frontend"
    exit 1
fi
echo "✅ Dependencias del frontend instaladas"

echo ""
echo "========================================"
echo "✅ Configuración completada!"
echo "========================================"
echo ""
echo "Siguientes pasos:"
echo "1. Asegúrate de que PostgreSQL esté corriendo"
echo "2. Verifica que la contraseña en backend/.env sea correcta"
echo "3. Inicia el backend: cd backend && npm run dev"
echo "4. Inicia el frontend: npm run dev"
echo ""
echo "Usuarios de prueba:"
echo "- Admin: admin@geriatric.com / admin123"
echo "- Enfermera: maria.garcia@geriatric.com / enfermera123"
echo "- Jefe: carlos.rodriguez@geriatric.com / jefe123"
echo ""
