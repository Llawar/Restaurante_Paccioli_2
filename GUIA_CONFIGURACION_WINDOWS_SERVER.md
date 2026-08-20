# Configuración de Windows Server 2022 como servidor local del restaurante

> Sistema: Restaurante Paccioli POS
> VM: "WindowsServer" (VirtualBox, Windows Server 2022)
> IP fija del server: **192.168.137.50**
> Red del restaurante: 192.168.137.1/24 (Wi-Fi del router)

---

## Arquitectura objetivo

```
Router WiFi del restaurante (192.168.137.1 / 255.255.255.0)
  │
  ├─ Host PC (VirtualBox)          → Wi-Fi 192.168.137.155 (ok hoy)
  └─ VM "WindowsServer 2022"       → IP FIJA 192.168.137.50  ← TODO el sistema
       ├─ MySQL 8        (solo local, puerto 3306)
       ├─ Backend Express :3006 (API + Socket.IO)
       ├─ Admin  (POS)   http://192.168.137.50:5173
       ├─ Kiosko (autoservicio)    http://192.168.137.50:3000
       ├─ Cocina                   http://192.168.137.50:5175
       └─ Display clientes         http://192.168.137.50:5176
```

Dispositivos del local (kiosko táctil, tablets de cocina, TV display, PC del POS)
entran al navegador con `http://192.168.137.50:PUERTO` y todo funciona contra el server.

---

## Fase 1 — VirtualBox: pasar la VM a red "puente" (Bridged)

Hoy la VM tiene `nic1="intnet"` (red interna) → por eso no se alcanza desde el router.

### Pasos

1. Apagar la VM:
   ```powershell
   & "C:\Program Files\Oracle\VirtualBox\VBoxManage.exe" controlvm "WindowsServer" acpipowerbutton
   ```
   (o desde el GUI de VirtualBox: apagar).

2. Cambiar el adaptador a modo puente sobre la **Wi-Fi del host**:
   ```powershell
   & "C:\Program Files\Oracle\VirtualBox\VBoxManage.exe" modifyvm "WindowsServer" --nic1 bridged --bridgeadapter1 "Intel(R) Wi-Fi 6E AX210 160MHz"
   ```
   Alternativa GUI: Configuración → Red → Adaptador 1 → Conectado a: "Adaptador puente" → Nombre: Intel Wi-Fi 6E AX210.

3. Encender la VM de nuevo.

> ⚠️ El modo puente sobre Wi-Fi puede bajar la velocidad de la WiFi del host.
> Si hay cable ethernet disponible, conectar la PC host por cable y poner el puente sobre esa NIC.

### Checklist

- [ ] VM apagada
- [ ] `--nic1 bridged` aplicado sobre la Wi-Fi del host
- [ ] VM encendida

---

## Fase 2 — IP FIJA dentro de Windows Server 2022 (192.168.137.50)

Dentro de la VM, como Administrador, en PowerShell:

```powershell
# Ajustar la interfaz de red activa (normalmente "Ethernet")
Get-NetIPConfiguration   # identificar el InterfaceIndex de la NIC activa

# IP fija: 192.168.137.50, máscara /24, gateway del router WiFi
New-NetIPAddress -InterfaceAlias "Ethernet" -IPAddress 192.168.137.50 -PrefixLength 24 -DefaultGateway 192.168.137.1

# DNS: el router (o Google 8.8.8.8)
Set-DnsClientServerAddress -InterfaceAlias "Ethernet" -ServerAddresses ("192.168.137.1","8.8.8.8")
```

Eliminar la configuración DHCP previa (IP automática) y verificar:

```powershell
# Si quedó una IP DHCP previa
Remove-NetIPAddress -IPAddress (Get-NetIPAddress -InterfaceAlias "Ethernet").IPAddress -Confirm:$false

ipconfig /all
ping 192.168.137.1    # comprobar gateway
ping 192.168.137.50   # comprobar la propia IP
```

> La IP fija es clave: los 4 frontends apuntan a `http://192.168.137.50:3006`.
> Si la IP cambia, todo deja de funcionar.
>
> ✅ **Actualizado (2026-08-20):** los 4 frontends ahora detectan la **IP/hostname con el que se abrió la página** (`window.location.hostname`) y el backend auto-detecta su IP para `PUBLIC_BASE_URL`. La IP fija sigue recomendada para estabilidad, pero **ya no es obligatorio** editar el `.env` de cada dispositivo: si la IP cambia, basta abrir la página por la IP nueva.

### Checklist

- [ ] `New-NetIPAddress` con 192.168.137.50 aplicado
- [ ] DNS configurado
- [ ] DHCP eliminado
- [ ] `ping 192.168.137.50` responde desde la propia VM

---

## Fase 3 — Software instalado en el server

| Software | Versión | Nota |
|---|---|---|
| Node.js LTS | v20.x o v22.x | El backend usa `tsx` (ESM+TS). `node --version` |
| MySQL Server 8.0 | 8.x | Misma que el host (ya tienes MySQL Server 8.0.46). Instalar con `root` + contraseña **nano123** para que el `.env` no cambie de password |
| Git | — | Opcional, para clonar el repo en la VM |

Descarga:
- Node.js: https://nodejs.org (LTS)
- MySQL: https://dev.mysql.com/downloads/installer/ (MySQL Community Server 8.0)

> No instalar XAMPP. El backend solo usa `mysql2` (pool de conexiones).

### Checklist

- [x] Node.js LTS instalado (`node --version` → v24.17.0 ok)
- [x] MySQL Server 8.0 instalado (root / nano123) — servicio MySQL80 Running
- [ ] (Opcional) Git instalado

---

## Fase 4 — Crear la base de datos LIMPIA en el server

La base del server arranca **vacía**: solo estructura + datos base mínimos, SIN datos de ejemplo.
Se usa el archivo `backend\database\schema_limpio.sql` (creado para este propósito).

### Qué incluye `schema_limpio.sql`

- **Sí:** las 22 tablas con su estructura y claves foráneas.
- **Sí (datos base mínimos):** usuario `admin`/`admin123`, los 6 `puestos_cocina`, y las 7 `unidades_medida`.
- **NO (datos de ejemplo):** categorías, subcategorías, productos, mesas, clientes, proveedores, ubicaciones, pedidos, etc. Todo eso se crea desde el panel de administración.

### Copiar `schema_limpio.sql` a la VM

Carpeta compartida de VirtualBox, USB, o SMB. Se copia junto con el proyecto en la Fase 5
(a `C:\pos_system\`). Puede importarse en esta fase o justo después de la Fase 5.

### Importar en la VM

```powershell
# Agregar MySQL al PATH solo para esta sesión
$env:Path += ";C:\Program Files\MySQL\MySQL Server 8.0\bin"

# Crear BD
mysql -u root -pnano123 -e "CREATE DATABASE IF NOT EXISTS restaurant_system_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;"

# Importar la estructura + datos base
mysql -u root -pnano123 restaurant_system_db < "C:\pos_system\Sistema_Principal_Administrador\backend\database\schema_limpio.sql"
```

### Verificar (debe quedar limpia)

```powershell
mysql -u root -pnano123 restaurant_system_db -e "SHOW TABLES;"          # las 22 tablas
mysql -u root -pnano123 restaurant_system_db -e "SELECT COUNT(*) puestos FROM puestos_cocina; SELECT COUNT(*) usuarios FROM usuarios; SELECT COUNT(*) categorias FROM categorias; SELECT COUNT(*) productos FROM productos; SELECT COUNT(*) mesas FROM mesas;"
# Esperado: puestos=6, usuarios=1, categorias=0, productos=0, mesas=0
```

> La BD real del host (`restaurant_system_db` con pedidos/productos) NO se migra: queda como
> referencia local. Si algún día se necesita, se exporta con `mysqldump`.

### Checklist

- [ ] `schema_limpio.sql` copiado a la VM
- [ ] BD creada e importada en la VM
- [ ] `SHOW TABLES` muestra las 22 tablas
- [ ] puestos=6, usuarios=1, categorias=0, productos=0, mesas=0

---

## Fase 5 — Copiar el código a la VM

Crear `C:\pos_system\` en la VM y copiar **todo el proyecto** (incluye `.env` y la carpeta `uploads/` con las fotos de productos):

```
C:\pos_system\
  Sistema_Principal_Administrador\backend\   (con .env y uploads\)
  Sistema_Principal_Administrador\frontend\
  Sistema_Pedidos_Automatico\
  App_Cocina\
  App_Display_Clientes\
```

Transferencia: carpeta compartida VirtualBox (con Guest Additions) o USB.

Una vez copiado, en la VM:

```powershell
# Backend
cd C:\pos_system\Sistema_Principal_Administrador\backend
npm install

# frontends
cd ..\frontend && npm install
cd C:\pos_system\Sistema_Pedidos_Automatico && npm install
cd C:\pos_system\App_Cocina && npm install
cd C:\pos_system\App_Display_Clientes && npm install
```

> Verificar que `.env` del backend apunta a localhost (MySQL queda en la misma VM → DB_HOST=localhost correcto).

### Checklist

- [ ] `C:\pos_system\` creado en la VM
- [ ] Proyecto completo copiado (incl. `backend\uploads\`)
- [ ] `npm install` en backend y los 4 frontends

---

## Fase 6 — Cambios de código necesarios (importantes)

### 6a. Frontend Admin (POS) — hardcodeado a localhost

- `Sistema_Principal_Administrador\frontend\src\services\api.js:3`
  ```js
  const API_URL = 'http://192.168.137.50:3006/api';
  ```
- `Sistema_Principal_Administrador\frontend\src\services\socket.js:3`
  ```js
  const socket = io('http://192.168.137.50:3006', {
  ```

### 6b. Los 3 frontends con `VITE_API_URL`

- `Sistema_Pedidos_Automatico\.env.local` → `VITE_API_URL=http://192.168.137.50:3006/api`
- `App_Cocina\.env` → `VITE_API_URL=http://192.168.137.50:3006`
- `App_Display_Clientes\.env` → `VITE_API_URL=http://192.168.137.50:3006`

(Verificado: Cocina `App.tsx:5` y Display `App.tsx:12` usan `VITE_API_URL`; Kiosko `api.ts:2` usa `.replace('/api','')` para el socket.)

### 6c. CORS del backend — hoy solo permite `localhost`

- `Sistema_Principal_Administrador\backend\config\cors.ts:2`
  Agregar orígenes del server:
  ```ts
  origin: [
    'http://192.168.137.50:3000',
    'http://192.168.137.50:5173',
    'http://192.168.137.50:5175',
    'http://192.168.137.50:5176'
  ],
  ```
- `Sistema_Principal_Administrador\backend\bootstrap\app.ts:13` (Socket.IO)
  Ídem. O cambiar ambos `origin` por `true` (acepta cualquiera, apto para LAN local).

### Checklist

- [ ] `api.js` apunta a la IP fija
- [ ] `socket.js` apunta a la IP fija
- [ ] `.env` / `.env.local` de kiosko, cocina y display con la IP
- [ ] `cors.ts` y `bootstrap/app.ts` permiten orígenes del server

---

## Fase 7 — Compilar los 4 frontends (estático)

En la VM, dentro de cada carpeta:

```powershell
cd C:\pos_system\Sistema_Principal_Administrador\frontend
npm run build            # dist\ (SPA: admin usa BrowserRouter)

cd ..\..\Sistema_Pedidos_Automatico
npm run build            # dist\ kiosko (http://IP:3000)

cd ..\App_Cocina
npm run build            # dist\ cocina (http://IP:5175)

cd ..\App_Display_Clientes
npm run build            # dist\ display (http://IP:5176)
```

El build solo tendrá las URL correctas si en Fase 6b quedaron los `.env` con la IP **antes** de `npm run build`.

Verificar tras build:
```powershell
Select-String -Path "dist\assets\*.js" -Pattern "192.168.137.50" -SimpleMatch
```

### Checklist

- [ ] Build de frontend admin (5173)
- [ ] Build de kiosko (3000)
- [ ] Build de cocina (5175)
- [ ] Build de display (5176)
- [ ] La IP fija aparece en los `dist\assets\*.js`

---

## Fase 8 — Servir los estáticos desde Windows Server

Instalar `serve` (módulo npm) con fallback SPA (el admin usa `BrowserRouter`):

```powershell
npm install -g serve
```

```powershell
# Admin POS  (fallback SPA imprescindible)
serve -s "C:\pos_system\Sistema_Principal_Administrador\frontend\dist" -l 5173

# Kiosko     (SPA fallback)
serve -s "C:\pos_system\Sistema_Pedidos_Automatico\dist" -l 3000

# Cocina
serve -s "C:\pos_system\App_Cocina\dist" -l 5175

# Display clientes
serve -s "C:\pos_system\App_Display_Clientes\dist" -l 5176
```

El backend arranca con `npm start` dentro de `backend\` (usa `tsx public/index.ts`, puerto 3006).

### Checklist

- [ ] `serve` instalado global
- [ ] Los 4 estáticos responden por IP (5173, 3000, 5175, 5176)
- [ ] Backend corriendo en :3006

---

## Fase 9 — Firewall de Windows Server (abrir puertos)

Como Administrador:

```powershell
# API + Socket.IO
netsh advfirewall firewall add rule name="POS API 3006" dir=in action=allow protocol=TCP localport=3006
# Frontends
netsh advfirewall firewall add rule name="POS Frontend Admin 5173" dir=in action=allow protocol=TCP localport=5173
netsh advfirewall firewall add rule name="POS Frontend Kiosko 3000" dir=in action=allow protocol=TCP localport=3000
netsh advfirewall firewall add rule name="POS Frontend Cocina 5175" dir=in action=allow protocol=TCP localport=5175
netsh advfirewall firewall add rule name="POS Frontend Display 5176" dir=in action=allow protocol=TCP localport=5176
# ping de prueba
netsh advfirewall firewall add rule name="POS ICMP" dir=in action=allow protocol=icmpv4
```

> MySQL NO se expone (puerto 3306 cerrado hacia fuera): solo lo usa el backend local con `localhost`.
> Si luego se gestiona la BD desde la PC host con Workbench, abrir 3306 aparte.

### Checklist

- [ ] Puertos 3006, 5173, 3000, 5175, 5176 abiertos
- [ ] ICMP permitido
- [ ] 3306 cerrado (seguridad)

---

## Fase 10 — Arranque automático (opcional pero recomendado)

**PM2** (simple):

```powershell
npm install -g pm2

# dentro de backend
cd C:\pos_system\Sistema_Principal_Administrador\backend
pm2 start "npm -- start" --name pos-backend

# cada frontend estático
pm2 start serve --name pos-admin -- serve -s "C:\pos_system\Sistema_Principal_Administrador\frontend\dist" -l 5173
pm2 start serve --name pos-kiosko -- serve -s "C:\pos_system\Sistema_Pedidos_Automatico\dist" -l 3000
pm2 start serve --name pos-cocina -- serve -s "C:\pos_system\App_Cocina\dist" -l 5175
pm2 start serve --name pos-display -- serve -s "C:\pos_system\App_Display_Clientes\dist" -l 5176

pm2 save
pm2 startup   # crea servicio que se inicia con Windows
```

**MySQL** → ya se instala como servicio con arranque automático (comprobar en `services.msc`).

### Checklist

- [ ] PM2 instalado
- [ ] 5 procesos registrados (backend + 4 frontends)
- [ ] `pm2 save` y `pm2 startup` ejecutados
- [ ] MySQL en arranque automático

---

## Fase 11 — Verificación final (desde otros dispositivos)

1. Desde el **host**: `ping 192.168.137.50` y abrir `http://192.168.137.50:3006/api/health` → debe responder JSON.
2. Desde un **browser del host**: abrir los 4 frontends por IP (5173 admin, 3000 kiosko, 5175 cocina, 5176 display).
3. Desde un **celular/tablet conectado al WiFi del restaurante**: repetir el paso 2 (prueba real).
4. Login como `admin/admin123` en el admin; e2e de puestos (6 puestos activos visibles).
5. Hacer un pedido desde kiosko/POS → debe aparecer en Display y en Cocina por Socket.IO en tiempo real.

### Checklist

- [ ] `ping 192.168.137.50` responde
- [ ] `http://192.168.137.50:3006/api/health` devuelve JSON
- [ ] Los 4 frontends abren desde otro dispositivo
- [ ] Login admin funciona
- [ ] Pedido de prueba viaja a Display y Cocina en tiempo real

---

## Limpieza (después de validar)

- Cuando el server quede operativo, borrar/archivar la instalación MySQL del host (o dejarla como respaldo).
- Rehacer un backup inicial de la BD en la VM y guardarlo fuera:
  `Backup\restaurant_system_db_YYYYMMDD.sql`

---

## Trampas / NO hacer

- ❌ No dejar la VM en red interna (`intnet`) → no se alcanza por IP.
- ❌ No arrancar los frontends solo con `npm run dev` sin configurar `.env` → seguirían apuntando a `localhost` del propio dispositivo.
- ❌ No olvidar la carpeta `backend\uploads\` al copiar → se perderían las fotos de productos (se sirven desde `/uploads`).
- ❌ No romper la IP fija: si la NIC vuelve a DHCP, todo el sistema deja de responder.