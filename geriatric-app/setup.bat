@echo off
echo ========================================
echo Configuracion de NurseNote
echo ========================================
echo.

REM Verificar si Node.js está instalado
node --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ❌ Node.js no está instalado. Por favor instala Node.js primero.
    echo Descarga: https://nodejs.org/
    pause
    exit /b 1
)

REM Ejecutar script de setup interactivo
node setup.js

if %errorlevel% neq 0 (
    echo ❌ Error durante la configuración
    pause
    exit /b 1
)

pause
