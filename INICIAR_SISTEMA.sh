#!/bin/bash
# Sistema Paccioli - Lanzador para Linux Debian
# Uso: ./INICIAR_SISTEMA.sh
# Requiere: PM2 instalado globalmente (npm install -g pm2)

echo "=========================================="
echo "  Iniciando Sistema Paccioli Restaurante"
echo "=========================================="
echo ""

# Verificar que PM2 está instalado
if ! command -v pm2 &> /dev/null; then
    echo "❌ PM2 no está instalado. Instalando..."
    npm install -g pm2
fi

# Directorio base del proyecto
BASE_DIR="/home/mister-t/Documentos/Paccioli Restaurante/Restaurante_Paccioli"

echo "📁 Directorio base: $BASE_DIR"
echo ""

# 1. Backend API (puerto 3006)
echo "🚀 Iniciando Backend API en puerto 3006..."
cd "$BASE_DIR/Sistema_Principal_Administrador/backend"
pm2 start "npm run start" --name "pos-backend" --watch

# 2. Frontend Admin (puerto 5173) - SPA con fallback
echo "🚀 Iniciando Frontend Admin en puerto 5173..."
cd "$BASE_DIR/Sistema_Principal_Administrador/frontend"
pm2 start "serve -s dist -l 5173" --name "pos-admin"

# 3. Kiosco Autoservicio (puerto 3000) - SPA con fallback
echo "🚀 Iniciando Kiosco Autoservicio en puerto 3000..."
cd "$BASE_DIR/Sistema_Pedidos_Automatico"
pm2 start "serve -s dist -l 3000" --name "pos-kiosko"

# 4. App Cocina (puerto 5175)
echo "🚀 Iniciando App Cocina en puerto 5175..."
cd "$BASE_DIR/App_Cocina"
pm2 start "serve -s dist -l 5175" --name "pos-cocina"

# 5. Display Clientes (puerto 5176)
echo "🚀 Iniciando Display Clientes en puerto 5176..."
cd "$BASE_DIR/App_Display_Clientes"
pm2 start "serve -s dist -l 5176" --name "pos-display"

echo ""
echo "=========================================="
echo "  ✅ Todos los servicios iniciados"
echo "=========================================="
echo ""
pm2 list
echo ""
echo "📋 Comandos útiles:"
echo "   pm2 list              - Ver estado de todos los procesos"
echo "   pm2 logs              - Ver logs de todos los procesos"
echo "   pm2 logs pos-backend  - Ver logs solo del backend"
echo "   pm2 stop all          - Detener todos los servicios"
echo "   pm2 restart all       - Reiniciar todos los servicios"
echo "   pm2 monit             - Monitor interactivo"
echo ""
echo "🌐 URLs de acceso (reemplaza IP_SERVIDOR con la IP de este equipo):"
echo "   Backend API:       http://IP_SERVIDOR:3006/api"
echo "   Admin (POS):       http://IP_SERVIDOR:5173"
echo "   Kiosco:            http://IP_SERVIDOR:3000"
echo "   Cocina:            http://IP_SERVIDOR:5175"
echo "   Display Clientes:  http://IP_SERVIDOR:5176"
echo ""
echo "💡 Para que los servicios inicien automáticamente al arrancar el sistema:"
echo "   pm2 startup"
echo "   pm2 save"
echo ""