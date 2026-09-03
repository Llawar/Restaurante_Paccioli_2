# Configuración de Servidor Linux Debian para Restaurante Paccioli

> Sistema: Restaurante Paccioli POS
> Servidor: **Linux Debian 12 (Bookworm) o superior**
> IP fija del servidor: **192.168.137.50** (ejemplo, ajustar a tu red)
> Red del restaurante: 192.168.137.1/24 (Wi-Fi del router)

---

## Arquitectura objetivo

```
Router WiFi del restaurante (192.168.137.1 / 255.255.255.0)
  │
  ├─ PC Host / Laptop Admin          → Wi-Fi 192.168.137.xxx
  └─ Servidor Linux Debian           → IP FIJA 192.168.137.50  ← TODO el sistema
       ├─ MySQL 8        (local, puerto 3306)
       ├─ Backend Express :3006 (API + Socket.IO)
       ├─ Admin  (POS)   http://192.168.137.50:5173
       ├─ Kiosko (autoservicio)    http://192.168.137.50:3000
       ├─ Cocina                   http://192.168.137.50:5175
       └─ Display clientes         http://192.168.137.50:5176
```

Dispositivos del local (kiosko táctil, tablets de cocina, TV display, PC del POS)
entran al navegador con `http://192.168.137.50:PUERTO` y todo funciona contra el server.

---

## Fase 1 — Configurar IP fija en Debian

### Identificar la interfaz de red

```bash
ip link show
# Busca la interfaz activa (ej: eth0, enp3s0, wlan0)
```

### Configurar IP estática (Netplan - Debian 12+)

```bash
sudo nano /etc/netplan/01-network-manager-all.yaml
```

Contenido (ajusta `enp3s0` a tu interfaz):

```yaml
network:
  version: 2
  renderer: networkd
  ethernets:
    enp3s0:
      dhcp4: false
      addresses:
        - 192.168.137.50/24
      routes:
        - to: default
          via: 192.168.137.1
      nameservers:
        addresses: [192.168.137.1, 8.8.8.8]
```

Aplicar cambios:

```bash
sudo netplan apply
```

### Verificar

```bash
ip addr show enp3s0
ping 192.168.137.1    # gateway
ping 192.168.137.50   # propia IP
ping 8.8.8.8          # internet
```

> ⚠️ Si usas Wi-Fi en el servidor, cambia `ethernets:` por `wifis:` y añade `access-points:` con tu SSID y password.

### Checklist
- [ ] Interfaz identificada
- [ ] Netplan configurado con IP fija
- [ ] `netplan apply` sin errores
- [ ] Conectividad verificada (gateway + internet)

---

## Fase 2 — Software instalado en el servidor

| Software | Versión | Instalación |
|---|---|---|
| **Node.js LTS** | v20.x o v22.x | `curl -fsSL https://deb.nodesource.com/setup_22.x | sudo -E bash - && sudo apt install -y nodejs` |
| **MySQL Server 8.0** | 8.x | `sudo apt install -y mysql-server` |
| **Git** | — | `sudo apt install -y git` |
| **PM2** | Latest | `sudo npm install -g pm2` |
| **serve** | Latest | `sudo npm install -g serve` |
| **build-essential** | — | `sudo apt install -y build-essential python3` (para compilación nativa) |

> **MySQL**: Durante la instalación se pedirá contraseña root. Usa **nano123** para coincidir con el `.env` por defecto, o actualiza el `.env` después.

### Checklist
- [ ] Node.js LTS instalado (`node --version` → v22.x)
- [ ] MySQL 8.0 instalado y servicio activo (`sudo systemctl status mysql`)
- [ ] Git instalado
- [ ] PM2 y serve instalados globalmente

---

## Fase 3 — Configurar MySQL y crear la base de datos

### Asegurar MySQL

```bash
sudo mysql_secure_installation
# Responde: Y (validar password), Y (cambiar root), Y (remover anon), Y (deshabilitar root remoto), Y (remover test), Y (recargar)
```

### Crear base de datos e importar schema limpio

```bash
# Crear BD
sudo mysql -u root -p -e "CREATE DATABASE IF NOT EXISTS restaurant_system_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;"

# Importar estructura + datos base (puestos_cocina, unidades_medida, usuario admin)
sudo mysql -u root -p restaurant_system_db < /home/mister-t/Documentos/Paccioli\ Restaurante/Restaurante_Paccioli/Sistema_Principal_Administrador/backend/database/schema_limpio.sql
```

### Verificar (debe quedar limpia)

```bash
sudo mysql -u root -p restaurant_system_db -e "SHOW TABLES;"
sudo mysql -u root -p restaurant_system_db -e "SELECT COUNT(*) as puestos FROM puestos_cocina; SELECT COUNT(*) as usuarios FROM usuarios; SELECT COUNT(*) as categorias FROM categorias; SELECT COUNT(*) as productos FROM productos; SELECT COUNT(*) as mesas FROM mesas;"
# Esperado: puestos=6, usuarios=1, categorias=0, productos=0, mesas=0
```

### Checklist
- [ ] MySQL asegurado
- [ ] BD `restaurant_system_db` creada
- [ ] `schema_limpio.sql` importado
- [ ] Verificación: 22 tablas, puestos=6, usuarios=1, resto=0

---

## Fase 4 — Copiar el código al servidor

El proyecto ya está en `/home/mister-t/Documentos/Paccioli Restaurante/Restaurante_Paccioli/`. 

Verificar estructura:

```bash
ls -la /home/mister-t/Documentos/Paccioli\ Restaurante/Restaurante_Paccioli/
# Debe mostrar:
# Sistema_Principal_Administrador/
# Sistema_Pedidos_Automatico/
# App_Cocina/
# App_Display_Clientes/
# App_GastroStock/ (opcional)
# INICIAR_SISTEMA.sh
```

### Instalar dependencias en todos los módulos

```bash
# Backend
cd /home/mister-t/Documentos/Paccioli\ Restaurante/Restaurante_Paccioli/Sistema_Principal_Administrador/backend
npm install

# Frontend Admin
cd /home/mister-t/Documentos/Paccioli\ Restaurante/Restaurante_Paccioli/Sistema_Principal_Administrador/frontend
npm install

# Kiosco
cd /home/mister-t/Documentos/Paccioli\ Restaurante/Restaurante_Paccioli/Sistema_Pedidos_Automatico
npm install

# Cocina
cd /home/mister-t/Documentos/Paccioli\ Restaurante/Restaurante_Paccioli/App_Cocina
npm install

# Display
cd /home/mister-t/Documentos/Paccioli\ Restaurante/Restaurante_Paccioli/App_Display_Clientes
npm install
```

> Verificar que `.env` del backend existe y apunta a `DB_HOST=localhost` (MySQL en el mismo servidor).

### Checklist
- [ ] `npm install` completado en backend y 4 frontends
- [ ] `.env` del backend configurado correctamente

---

## Fase 5 — Cambios de código necesarios (importantes)

### 5a. Frontend Admin (POS) — URLs dinámicas

Los frontends ya detectan automáticamente la IP/hostname con `window.location.hostname`. 
**Solo necesitas configurar `.env` si el backend está en OTRO equipo/IP distinto al frontend.**

Si backend y frontends están en el **mismo servidor** (este caso), **no hace falta tocar nada**.

### 5b. Variables de entorno de los frontends (opcional)

Solo crea `.env` en cada frontend si el backend está en otra IP:

```bash
# Sistema_Principal_Administrador/frontend/.env (opcional)
VITE_API_URL=http://192.168.137.50:3006

# App_Cocina/.env (opcional)
VITE_API_URL=http://192.168.137.50:3006

# App_Display_Clientes/.env (opcional)
VITE_API_URL=http://192.168.137.50:3006

# Sistema_Pedidos_Automatico/.env (opcional)
VITE_API_URL=http://192.168.137.50:3006
```

### 5c. CORS del backend — permitir orígenes de la LAN

Editar `Sistema_Principal_Administrador/backend/config/cors.ts`:

```typescript
origin: [
  'http://192.168.137.50:3000',
  'http://192.168.137.50:5173',
  'http://192.168.137.50:5175',
  'http://192.168.137.50:5176',
  // En desarrollo local también puede servir:
  'http://localhost:3000',
  'http://localhost:5173',
  'http://localhost:5175',
  'http://localhost:5176',
  'http://127.0.0.1:3000',
  'http://127.0.0.1:5173',
  'http://127.0.0.1:5175',
  'http://127.0.0.1:5176',
],
// O para LAN local sin restricciones (más simple):
// origin: true,
```

Editar `Sistema_Principal_Administrador/backend/bootstrap/app.ts` (Socket.IO):
```typescript
// Buscar la configuración de Socket.IO y agregar los mismos orígenes
origin: [
  'http://192.168.137.50:3000',
  'http://192.168.137.50:5173',
  'http://192.168.137.50:5175',
  'http://192.168.137.50:5176',
],
```

### Checklist
- [ ] `cors.ts` actualizado con IPs de la LAN
- [ ] `bootstrap/app.ts` (Socket.IO) actualizado
- [ ] (Opcional) `.env` de frontends creados si backend en otra IP

---

## Fase 6 — Compilar los 4 frontends (estático)

```bash
# Frontend Admin (puerto 5173)
cd /home/mister-t/Documentos/Paccioli\ Restaurante/Restaurante_Paccioli/Sistema_Principal_Administrador/frontend
npm run build            # genera dist/

# Kiosco Autoservicio (puerto 3000)
cd /home/mister-t/Documentos/Paccioli\ Restaurante/Restaurante_Paccioli/Sistema_Pedidos_Automatico
npm run build            # genera dist/

# App Cocina (puerto 5175)
cd /home/mister-t/Documentos/Paccioli\ Restaurante/Restaurante_Paccioli/App_Cocina
npm run build            # genera dist/

# Display Clientes (puerto 5176)
cd /home/mister-t/Documentos/Paccioli\ Restaurante/Restaurante_Paccioli/App_Display_Clientes
npm run build            # genera dist/
```

Verificar que la IP del servidor aparece en los builds:

```bash
grep -r "192.168.137.50" /home/mister-t/Documentos/Paccioli\ Restaurante/Restaurante_Paccioli/*/dist/assets/*.js 2>/dev/null | head -5
```

### Checklist
- [ ] Build de frontend admin (dist/)
- [ ] Build de kiosko (dist/)
- [ ] Build de cocina (dist/)
- [ ] Build de display (dist/)

---

## Fase 7 — Firewall (UFW) — Abrir puertos

```bash
# Habilitar UFW si no lo está
sudo ufw enable

# API + Socket.IO
sudo ufw allow 3006/tcp comment "POS API + Socket.IO"

# Frontends
sudo ufw allow 5173/tcp comment "POS Frontend Admin"
sudo ufw allow 3000/tcp comment "POS Frontend Kiosko"
sudo ufw allow 5175/tcp comment "POS Frontend Cocina"
sudo ufw allow 5176/tcp comment "POS Frontend Display"

# SSH (importante no bloquearse)
sudo ufw allow 22/tcp comment "SSH"

# Verificar
sudo ufw status numbered
```

> MySQL (3306) **NO se expone** hacia fuera: solo lo usa el backend local con `localhost`.

### Checklist
- [ ] UFW activo
- [ ] Puertos 3006, 5173, 3000, 5175, 5176 abiertos
- [ ] Puerto 22 (SSH) abierto
- [ ] Puerto 3306 (MySQL) cerrado hacia fuera

---

## Fase 8 — Arranque automático con PM2

### Iniciar servicios con PM2

```bash
# Opción A: Usar el script incluido
cd /home/mister-t/Documentos/Paccioli\ Restaurante/Restaurante_Paccioli
chmod +x INICIAR_SISTEMA.sh
./INICIAR_SISTEMA.sh

# Opción B: Manual (lo que hace el script)
cd /home/mister-t/Documentos/Paccioli\ Restaurante/Restaurante_Paccioli/Sistema_Principal_Administrador/backend
pm2 start "npm run start" --name pos-backend

cd /home/mister-t/Documentos/Paccioli\ Restaurante/Restaurante_Paccioli/Sistema_Principal_Administrador/frontend
pm2 start "serve -s dist -l 5173" --name pos-admin

cd /home/mister-t/Documentos/Paccioli\ Restaurante/Restaurante_Paccioli/Sistema_Pedidos_Automatico
pm2 start "serve -s dist -l 3000" --name pos-kiosko

cd /home/mister-t/Documentos/Paccioli\ Restaurante/Restaurante_Paccioli/App_Cocina
pm2 start "serve -s dist -l 5175" --name pos-cocina

cd /home/mister-t/Documentos/Paccioli\ Restaurante/Restaurante_Paccioli/App_Display_Clientes
pm2 start "serve -s dist -l 5176" --name pos-display
```

### Configurar auto-arranque al encender el servidor

```bash
# Generar script de inicio para systemd
pm2 startup systemd -u $USER --hp $HOME
# Ejecuta el comando que te muestre (sudo env PATH=... pm2 startup systemd...)

# Guardar lista actual de procesos
pm2 save
```

Verificar:
```bash
pm2 list
pm2 logs --lines 50
```

### Checklist
- [ ] 5 procesos PM2 corriendo (backend + 4 frontends)
- [ ] `pm2 startup` ejecutado y comando sudo aplicado
- [ ] `pm2 save` ejecutado
- [ ] Servicios sobreviven a `sudo reboot` (probar reinicio)

---

## Fase 9 — Verificación final (desde otros dispositivos)

1. Desde el **servidor**: `curl http://localhost:3006/api/health` → debe responder JSON.
2. Desde **otro dispositivo en la red** (laptop, celular):
   - `ping 192.168.137.50`
   - Abrir `http://192.168.137.50:3006/api/health` → JSON
   - Abrir los 4 frontends: `:5173` (admin), `:3000` (kiosko), `:5175` (cocina), `:5176` (display)
3. Login en admin: `admin` / `admin123`
4. Verificar 6 puestos de cocina activos en el admin
5. Hacer pedido de prueba desde kiosko/POS → debe aparecer en Display y Cocina en tiempo real (Socket.IO)

### Checklist
- [ ] `curl localhost:3006/api/health` OK
- [ ] `ping 192.168.137.50` desde otro dispositivo OK
- [ ] Los 4 frontends abren desde otro dispositivo
- [ ] Login admin funciona
- [ ] Pedido de prueba viaja a Display y Cocina en tiempo real

---

## Fase 10 — Backup y mantenimiento

### Backup inicial de la BD

```bash
mkdir -p /home/mister-t/backups
mysqldump -u root -p restaurant_system_db > /home/mister-t/backups/restaurant_system_db_$(date +%Y%m%d).sql
```

### Cron para backup diario (opcional)

```bash
sudo crontab -e
# Agregar:
0 3 * * * /usr/bin/mysqldump -u root -p'nano123' restaurant_system_db | gzip > /home/mister-t/backups/restaurant_system_db_$(date +\%Y\%m\%d).sql.gz
```

### Logs PM2

```bash
pm2 logs --lines 100        # Ver logs recientes
pm2 flush                   # Limpiar logs
pm2 install pm2-logrotate   # Rotación automática de logs
```

---

## Trampas / NO hacer

- ❌ No dejar la IP en DHCP → si cambia, todo el sistema deja de responder.
- ❌ No arrancar los frontends solo con `npm run dev` en producción → usa `npm run build` + `serve -s dist`.
- ❌ No olvidar la carpeta `backend/uploads/` al migrar → se perderían las fotos de productos.
- ❌ No exponer MySQL (puerto 3306) al exterior → solo localhost.
- ❌ No usar `origin: true` en CORS en redes no confiables (solo LAN local de confianza).
- ❌ No olvidar `pm2 save` tras cambios → los procesos no revivirán tras reboot.
- ❌ No ejecutar `npm install` como root → usa tu usuario normal, solo `pm2 startup` necesita sudo.

---

## Comandos de referencia rápida

```bash
# Estado de todo
pm2 list
pm2 monit

# Logs
pm2 logs
pm2 logs pos-backend --lines 100

# Reiniciar
pm2 restart all
pm2 restart pos-backend

# Detener
pm2 stop all

# Actualizar código y recompilar
cd /ruta/al/proyecto
git pull
cd Sistema_Principal_Administrador/backend && npm install
cd ../frontend && npm install && npm run build
cd ../../Sistema_Pedidos_Automatico && npm install && npm run build
cd ../App_Cocina && npm install && npm run build
cd ../App_Display_Clientes && npm install && npm run build
pm2 restart all

# Ver puertos escuchando
ss -tlnp | grep -E '3006|5173|3000|5175|5176'

# Ver firewall
sudo ufw status verbose
```