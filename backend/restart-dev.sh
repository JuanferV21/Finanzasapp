#!/bin/bash

# Script para reiniciar el servidor de desarrollo
echo "🔄 Reiniciando servidor de desarrollo..."

# Buscar y matar procesos de Node.js en puerto 5001
PID=$(lsof -ti:5001)
if [ ! -z "$PID" ]; then
    echo "🛑 Deteniendo servidor anterior (PID: $PID)..."
    kill -9 $PID
    sleep 2
fi

# Iniciar servidor
echo "🚀 Iniciando servidor..."
node server.js