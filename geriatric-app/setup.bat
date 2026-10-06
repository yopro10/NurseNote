@echo off
echo ========================================
echo Configuracion de NurseNote
echo ========================================
echo.

REM Crear .env para el backend
echo Creando archivo .env para el backend...
cd backend
if not exist .env (
    (
        echo DB_HOST=localhost
        echo DB_PORT=5432
        echo DB_NAME=geriatric_app
        echo DB_USER=postgres
        echo DB_PASSWORD=yopro1015
        echo PORT=3000
        echo NODE_ENV=development
        echo JWT_SECRET=geriatric-app-secret-key-2024
        echo JWT_EXPIRES_IN=24h
        echo FRONTEND_URL=http://localhost:5173
    ) > .env
    echo ✅ Archivo .env creado en backend
) else (
    echo ℹ️  El archivo .env ya existe en backend
)

cd ..

REM Crear .env para el frontend
echo Creando archivo .env para el frontend...
if not exist .env (
    (
        echo VITE_API_URL=http://localhost:3000
    ) > .env
    echo ✅ Archivo .env creado en frontend
) else (
    echo ℹ️  El archivo .env ya existe en frontend
)

echo.
echo ========================================
echo Instalando dependencias...
echo ========================================
echo.

REM Instalar dependencias del backend
echo Instalando dependencias del backend...
cd backend
call npm install
if %errorlevel% neq 0 (
    echo ❌ Error al instalar dependencias del backend
    pause
    exit /b 1
)
echo ✅ Dependencias del backend instaladas
cd ..

REM Instalar dependencias del frontend
echo Instalando dependencias del frontend...
call npm install
if %errorlevel% neq 0 (
    echo ❌ Error al instalar dependencias del frontend
    pause
    exit /b 1
)
echo ✅ Dependencias del frontend instaladas

echo.
echo ========================================
echo ✅ Configuracion completada!
echo ========================================
echo.
echo Siguientes pasos:
echo 1. Asegurate de que PostgreSQL este corriendo
echo 2. Verifica que la contraseña en backend/.env sea correcta
echo 3. Inicia el backend: cd backend ^&^& npm run dev
echo 4. Inicia el frontend: npm run dev
echo.
echo Usuarios de prueba:
echo - Admin: admin@geriatric.com / admin123
echo - Enfermera: maria.garcia@geriatric.com / enfermera123
echo - Jefe: carlos.rodriguez@geriatric.com / jefe123
echo.
pause
