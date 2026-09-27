@echo off
setlocal
title Rios Dent - Servidor local
cd /d "%~dp0"

where node >nul 2>nul
if errorlevel 1 (
  echo.
  echo No encontre Node.js instalado en esta computadora.
  echo Descargalo e instalalo desde https://nodejs.org ^(version LTS^) y despues volve a hacer doble clic en este archivo.
  echo.
  pause
  exit /b 1
)

if not exist node_modules (
  echo Primera vez que lo abris: instalando dependencias, puede tardar 1-2 minutos...
  call npm install
  if errorlevel 1 (
    echo.
    echo Hubo un error instalando las dependencias. Revisa el mensaje de arriba.
    pause
    exit /b 1
  )
)

echo.
echo Iniciando el sitio Rios Dent...
echo Se va a abrir solo en tu navegador en unos segundos.
echo Para el panel de administracion, agrega #admin-riosdent al final de la direccion.
echo Para detener el servidor, cerra esta ventana o apreta Ctrl+C.
echo.

start "" http://localhost:3000
call npm start

pause
