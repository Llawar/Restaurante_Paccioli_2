# GASTROSTOCK — Sistema de Gestión de Inventario

Especificación consolidada del sistema web de inventario para el almacén de un **restaurante gourmet**.
Documento vivo: guarda lo ya definido y lo pendiente de decidir.

---

## 1. Concepto general

- **Sistema Web de Gestión de Inventario** para restaurante gourmet.
- Enfocado **exclusivamente en el almacén**: NO gestiona mesas, pedidos, cocina, ventas ni POS.
- Base: documento de requisitos del usuario (productos, entradas, salidas, stock, proveedores, órdenes de compra, usuarios, reportes, auditoría, Kardex, etc.).

## 2. Contexto

| Campo | Valor |
|-------|-------|
| Establecimiento | Restaurante gourmet |
| Sucursales | Una sola |
| Proyecto | Académico |
| Área | Almacén |
| Tipo de sistema | Aplicación web |
| Arquitectura | MVC |
| Operaciones | CRUD + movimientos de inventario |

## 3. Nombre

**GastroStock** (Gastro → gastronomía · Stock → inventario). Propuesta inicial, puede cambiar.

## 4. Artículos que administrará

| Grupo | Ejemplos |
|-------|----------|
| **Ingredientes** | Carnes, lácteos, verduras, frutas, cereales, especias, aceites, etc. |
| **Bebidas** | Vinos, gaseosas, agua, jugos, etc. |
| **Limpieza** | Detergentes, desinfectantes, cloro, jabones, etc. |
| **Desechables** | Servilletas, bolsas, envases, vasos desechables, etc. |
| **Utensilios** | Cuchillos, ollas, sartenes, cucharones, etc. |
| **Vajilla** | Platos, vasos, copas, tazas, etc. |
| **Mantelería** | Manteles, servilletas de tela, etc. |
| **Decoración** | Floreros, centros de mesa, adornos, etc. |

Nota: utensilios, vajilla, mantelería y decoración **sí** forman parte del inventario.

## 5. Categorías y subcategorías

Clasificación jerárquica (Categoría → Subcategoría). Ejemplos:

```
INGREDIENTES
 ├── Carnes
 ├── Lácteos
 ├── Frutas
 ├── Verduras
 └── Cereales

BEBIDAS
 ├── Vinos
 ├── Gaseosas
 └── Aguas

UTENSILIOS
 ├── Cuchillos
 ├── Ollas
 └── Sartenes
```

**Código de producto** con formato (definido, aprobado):

```
ING-CAR-0001
ING-LAC-0001
BEB-VIN-0001
UTE-CUC-0001
```

## 6. Unidad de medida

Cada producto tiene una **UnidadMedida**. Ejemplos:

| Producto | Unidad |
|----------|--------|
| Carne | Kg |
| Arroz | Kg |
| Aceite | Litro |
| Leche | Caja |
| Huevo | Unidad |
| Cuchillo | Unidad |
| Plato | Unidad |
| Mantel | Unidad |

Entidad/módulo: **UnidadMedida**.

## 7. Fecha de vencimiento

- Registrable pero **no obligatoria**.
- Carne → controla vencimiento: Sí, fecha `15/08/2026`.
- Cuchillo/Platos/Manteles/Ollas/Decoración → controla: No, fecha `NULL`.

## 8. Almacén

- **Un único almacén**, dividido internamente por **ubicaciones/estanterías**.

```
ALMACÉN
 Estantería A → A-01, A-02, A-03
 Estantería B → B-01, B-02, B-03
 Refrigerador → REF-01, REF-02
 Congelador  → CON-01, CON-02
```

- Ejemplo: Arroz → `A-03`; Carne de res → `CON-02`.
- Mejor que crear varios almacenes (solo hay una sucursal).

## 9. Proveedores

Campos: **Nombre, NIT, Teléfono, Correo, Dirección, Persona de contacto**.
Relacionados con las compras realizadas.

## 10. Usuarios y roles

| Rol | Accesos |
|-----|---------|
| **Administrador** | Acceso total |
| **Encargado de Inventario** | Operativo principal: registrar productos, proveedores, compras, entradas, salidas, inventarios físicos, consultar Kardex, gestionar stock |
| **Usuario de Consulta** | Solo consulta información y reportes (ej. gerente, propietario). NO modifica inventario |

- Se eliminó el rol "Comprador" independiente.

## 11. Entradas (aumenta stock)

Tipos de entrada: **Compra · Donación · Devolución · Ajuste positivo**.
Ej.: Entrada Compra — Arroz, 50 Kg. El movimiento queda registrado en Kardex.

## 12. Salidas (disminuye stock)

Tipos de salida: **Consumo · Merma · Producto vencido · Ajuste negativo**.
Ej.: Salida Merma — Carne 2 Kg, motivo Deterioro.

## 13. Compras

El Encargado registra la compra. Flujo:

```
Proveedor → Compra/Orden de compra → Recepción → Registro de entrada
→ Generación de lote → Actualización de stock → Kardex
```

Pendiente: definir si se usa Orden de compra → Recepción → Entrada, o solo Compra → Entrada.

## 14. Lotes

- Cada recepción de mercancía genera un **lote**.
- Formato: `LT-YYYYMMDD-NNNN` → ej. `LT-20260708-0001`.
- Ej.: Leche — Lácteos del Valle — 20 cajas — Bs 18 — ingreso 08/07/2026 — vence 10/09/2026 → `LT-20260708-0001`.
- **mismo producto + mismo día + diferentes proveedores = diferentes lotes** (`LT-20260708-0001` y `LT-20260708-0002`).
- Incluso mismo proveedor con dos recepciones el mismo día → lotes distintos.

## 15. Relación lote-proveedor

```
Proveedor → Compra → Detalle de compra → Lote → Producto
```

Permite saber: proveedor de origen, costo, fecha de ingreso, vencimiento, saldo restante y movimientos. **Trazabilidad**.

## 16. Kardex

Completo (no solo tabla de entradas/salidas). Registra:

**Fecha · Tipo de movimiento · Producto · Lote · Entrada · Salida · Saldo · Costo · Usuario · Referencia/motivo**

Ejemplo:

| Fecha | Lote | Movimiento | Entrada | Salida | Saldo |
|-------|------|-----------|---------|--------|-------|
| 08/07 | LT-20260708-0001 | Compra | 20 | | 20 |
| 12/07 | LT-20260712-0001 | Compra | 30 | | 50 |
| 15/07 | LT-20260708-0001 | Consumo | | 15 | 35 |

## 17. Método PEPS (FIFO)

**Primero en Entrar, Primero en Salir** — apropiado para productos con vencimiento.

```
Lote 1: 20 cajas, ingreso 08/07
Lote 2: 30 cajas, ingreso 12/07
Si salen 25: 20 → Lote 1, 5 → Lote 2
```

Cálculo automático.

## 18. Inventario físico

```
Sistema: 100 litros
Conteo real: 96 litros
Diferencia: -4
```

- El encargado selecciona motivo: **Derrame · Error de registro · Pérdida · Otro**.
- El sistema: actualiza stock, genera ajuste, registra en Kardex, registra quién y cuándo.
- Mejor que modificar stock manualmente.

## 19. Alertas

- 🔔 Stock mínimo.
- 🔔 Producto agotado.
- 🔔 Producto próximo a vencer.

## 20. Reportes (mínimos)

- Existencias actuales.
- Productos con stock bajo.
- Productos próximos a vencer.
- Entradas.
- Salidas.
- Kardex por producto.
- Inventario valorizado mediante PEPS.
- Compras por proveedor.
- Auditoría.

## 21. Auditoría (independiente del Kardex)

- **Kardex**: ¿qué pasó con el producto?
- **Auditoría**: ¿quién hizo la operación?
- Ej.: Usuario Juan — Acción "Registró entrada" — 08/07/2026 10:32 — Producto Leche.

## 22. Tecnologías

> **Actualizado:** GastroStock es solo referente. La implementación usará el stack actual de Paccioli.
> Ver sección 24.

| Capa | Tecnología (referente) | Tecnología (real) |
|------|------------------------|-------------------|
| Backend | Laravel / PHP | **Express (Node.js + TypeScript)** |
| Base de datos | MySQL | **MySQL** |
| Arquitectura | MVC | **MVC (rutas → controladores → servicios)** |
| Frontend | Blade + Bootstrap/Tailwind | **React + Vite** |

---

## 23. Decisiones cerradas (Opción A)

### A. Compras ✅
- **Compra → Entrada directa**: el Encargado registra la compra (proveedor + items) y eso genera directamente lotes, entrada y Kardex.
- Sin Orden de Compra por ahora. La OC queda solo como extensión futura.

### B. PEPS — comportamiento definido ✅
- **Lote agotado**: el sistema lo marca sin stock disponible; las salidas siguientes no lo tocan.
- **Salida que necesita varios lotes**: **descuento automático en cascada** — si salen 25 y el lote 1 tiene 20, descuenta 20 del L1 y 5 del L2 (más antiguo primero).
- **Dos lotes con la misma fecha**: el orden lo define el **consecutivo del día** (`LT-...-0001` sale antes que `-0002`; el primero creado primero).
- **Producto sin vencimiento** (cuchillos, platos, manteles): **entra a PEPS sin fecha** — igual genera lote, solo con vencimiento `NULL`; el campo vencimiento no bloquea nada.
- **Devolución**: se registra como **salida contra lote específico**, descontando de ESE lote (no del stock global).

### C. Productos no consumibles ✅
- Tratados igual que los consumibles en el modelo: tienen producto, unidad, ubicación y lote.
- Solo difieren en que **no controlan vencimiento** (fecha `NULL`). El stock y el Kardex aplican igual.

### D. Costos ✅
- **Costo del lote = precio de compra unitario de ese lote** (Bs).
- **Valor del inventario = Σ (saldo_lote × costo_lote)**.
- **Costo de las salidas** = calculado por PEPS (sale primero lo del lote más antiguo).

### E. Estructura de la base de datos (siguiente paso)
- Entidades previstas: Producto, Categoría, Subcategoría, UnidadMedida, Proveedor, Compra, DetalleCompra, Lote, Ubicación, MovimientoKardex, Inventario, InventarioFisico, Usuario, Rol, Auditoria.
- Diseñar modelo entidad-relación ahora que las reglas están cerradas.

---

## 24. Aclaración de tecnologías (IMPORTANTE) ✅

- GastroStock es **solo un referente de requisitos** (especificación funcional de otro proyecto).
- **NO se usará Laravel ni Blade**.
- La implementación usará **el mismo stack del proyecto Paccioli actual**:
  - Backend: **Express (Node.js + TypeScript)**.
  - Base de datos: **MySQL**.
  - Frontend: **React** (con Vite).
- La arquitectura MVC se respeta dentro de Express (rutas → controladores → modelos/servicios).

---

## 25. Esquema SQL propuesto (borrador, para validar en siguiente paso)

```
categorias          (id, nombre, descripcion)
unidades_medida     (id, nombre, abreviatura)
productos           (id, codigo, nombre, subcategoria_id, unidad_id,
                     controla_vencimiento, stock_minimo, activo)
proveedores         (id, nombre, nit, telefono, correo, direccion, contacto)
compras             (id, proveedor_id, usuario_id, fecha, total, estado)
detalle_compras     (id, compra_id, producto_id, cantidad, costo_unitario, vencimiento)
lotes               (id, producto_id, detalle_compra_id, numero_lote, cantidad_ingreso,
                     cantidad_disponible, costo_unitario, fecha_ingreso, vencimiento)
ubicaciones         (id, nombre, tipo)              -- A-01, CON-02...
producto_ubicacion  (id, producto_id, ubicacion_id)
movimientos_kardex  (id, fecha, tipo, producto_id, lote_id, entrada, salida,
                     saldo, costo, usuario_id, referencia)
inventario_fisico   (id, fecha, usuario_id, estado)
inventario_fisico_detalle (id, inventario_id, producto_id, stock_sistema,
                     stock_real, diferencia, motivo)
roles               (id, nombre)                    -- admin, encargado, consulta
usuarios            (id, rol_id, nombre, usuario, password, activo)
auditoria           (id, usuario_id, accion, entidad, fecha, detalle)
```

Nota: al implementar se decidirá si el módulo **extiende** las tablas existentes de Paccioli (`productos`, `categorias`, `usuarios`, `inventario`) o crea esquema separado para no mezclar inventario de cocina con el de almacén.

---

## 24. Resumen ejecutivo

Sistema web de inventario para almacén de restaurante gourmet, con: clasificación por categoría/subcategoría (código ING-CAR-0001), unidades de medida, vencimiento opcional, un almacén con ubicaciones, proveedores, entradas/salidas, compras con generación de lotes `LT-YYYYMMDD-NNNN`, Kardex con PEPS, inventario físico con motivos de ajuste, alertas, reportes y auditoría. Tecnología: Laravel/PHP + MySQL, MVC. Pendiente: reglas finas de compras/PEPS/no consumibles/costos y luego el diseño de BD.
