#!/bin/bash
cd "$(dirname "$0")"

if ! command -v node &> /dev/null; then
  echo ""
  echo "No encontré Node.js instalado en esta computadora."
  echo "Descargalo e instalalo desde https://nodejs.org (versión LTS) y volvé a correr este archivo."
  echo ""
  read -p "Presioná Enter para cerrar..."
  exit 1
fi

if [ ! -d "node_modules" ]; then
  echo "Primera vez que lo abrís: instalando dependencias, puede tardar 1-2 minutos..."
  npm install
fi

echo ""
echo "Iniciando el sitio Rios Dent en http://localhost:3000"
echo "Para el panel de administración, agregá #admin-riosdent al final de la dirección."
echo "Para detener el servidor, apretá Ctrl+C en esta ventana."
echo ""

( sleep 2 && open http://localhost:3000 2>/dev/null || xdg-open http://localhost:3000 2>/dev/null ) &
npm start
