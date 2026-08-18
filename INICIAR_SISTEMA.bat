@echo off
title Sistema Paccioli - Lanzador
echo Iniciando los 5 servicios del restaurante...
echo.
start "Backend :3006"  cmd /k "cd /d C:\pos_system\Restaurante_Paccioli\Sistema_Principal_Administrador\backend && npm start"
start "Admin :5173"    cmd /k "serve -s C:\pos_system\Restaurante_Paccioli\Sistema_Principal_Administrador\frontend\dist -l 5173"
start "Kiosco :3000"   cmd /k "serve -s C:\pos_system\Restaurante_Paccioli\Sistema_Pedidos_Automatico\dist -l 3000"
start "Cocina :5175"   cmd /k "serve -s C:\pos_system\Restaurante_Paccioli\App_Cocina\dist -l 5175"
start "Display :5176"  cmd /k "serve -s C:\pos_system\Restaurante_Paccioli\App_Display_Clientes\dist -l 5176"
echo.
echo Todos los servicios se estan abriendo en ventanas separadas.
echo Cierra cada ventana para detener su servicio.
pause
