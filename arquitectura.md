# Arquitectura - Restaurante Paccioli POS

> Documento vivo — se modifica y amplía a medida que avanza el proyecto.

---

## Servidor

| Aspecto | Decisión |
|---------|----------|
| Ubicación | PC local dentro del restaurante (mini PC o similar) |
| Acceso remoto | Cloudflare Tunnel para delivery (repartidores desde 4G/5G) |
| Costo mensual | $0 (solo electricidad de la PC) |
| Backend | Node.js + Express + MySQL (puerto 3006) |
| Tiempo real | Socket.IO |

## Frontends (proyectos separados)

| App | Puerto | Login | Quién usa |
|-----|--------|-------|-----------|
| **Admin** | 5173 | Sí (admin, cajero) | Cajero + administrador |
| **App_Cocina** | 5175 | Sí (por puesto de cocina) | Cada cocinero con su propio login |
| **Display** | 5176 | No (público) | Clientes viendo pantalla |
| **Kiosco** | 3000 | No (público) | Clientes autoservicio |
| **Delivery** | (app nativa Android) | Sí (admin_delivery, repartidor, cliente) | Repartidores y clientes |

## Roles por módulo

### Admin / Cajero
- `admin` — acceso total al sistema
- `cajero` — tomar pedidos, cobrar, ver dashboard

### Cocina (KDS)
- Login individual, cada empleado tiene su propio usuario y contraseña
- Cada puesto de cocina tiene su propia sesión
- No se puede acceder a puestos ajenos

### Delivery (app nativa Android)
- `admin_delivery` — gestiona repartos, asigna repartidores
- `repartidor` — ve pedidos asignados, actualiza estado (en_camino, entregado)
- `cliente` — rastrea su pedido en tiempo real

### Display Clientes (público)
- Sin autenticación
- Solo muestra estado de pedidos en columnas
- Ideal para TV o monitor grande

### Kiosco Autoservicio (público)
- Sin autenticación
- Clientes navegan menú, arman pedido y pagan

## Arquitectura de red

```
                  ┌───────────────────────────┐
                  │    INTERNET (Cloudflare)   │
                  │    tunel.paccioli.com      │
                  └─────────┬─────────────────┘
                            │
              ┌─────────────┴─────────────┐
              │    PC LOCAL (Servidor)     │
              │    Backend :3006           │
              │    MySQL                   │
              └───────────────────────────┘
              │     │     │     │
    ┌─────────┘     │     │     └──────────┐
    ▼               ▼     ▼                ▼
 ┌──────┐  ┌────────┐  ┌─────┐  ┌───────────┐
 │Admin │  │Cocina  │  │Kiosc│  │ Display   │
 │:5173 │  │:5175   │  │:3000│  │ :5176     │
 └──────┘  └────────┘  └─────┘  └───────────┘
                        LAN del restaurante

  Delivery (4G) ──► Cloudflare ──► PC Local
```

## Prioridad actual

1. **Servidor + nube** — Poner backend en PC servidor local + Cloudflare Tunnel

## Notas

- Este archivo se actualiza a medida que avanzamos
- Cualquier cambio en la arquitectura se discute y se refleja aquí
