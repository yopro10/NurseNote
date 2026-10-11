#!/bin/bash

echo "========================================"
echo "Configuración de NurseNote"
echo "========================================"
echo ""

# Verificar si Node.js está instalado
if ! command -v node &> /dev/null; then
    echo "❌ Node.js no está instalado. Por favor instala Node.js primero."
    echo "Descarga: https://nodejs.org/"
    exit 1
fi

# Ejecutar script de setup interactivo
node setup.js

if [ $? -ne 0 ]; then
    echo "❌ Error durante la configuración"
    exit 1
fi
