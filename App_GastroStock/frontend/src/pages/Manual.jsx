import { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  BookOpen, Tag, Layers, Ruler, MapPin, Truck, Package,
  ShoppingCart, Boxes, ClipboardList, Database, AlertTriangle,
  ArrowRight, Lightbulb, ChevronDown, ChevronRight, CheckCircle2
} from 'lucide-react';

const terminos = [
  {
    termino: 'Lote',
    definicion: 'Un grupo de mercancía que llega en la misma compra y con su propia fecha de ingreso y vencimiento. Se identifica con un código tipo LT-20260831-0001.',
  },
  {
    termino: 'Kardex',
    definicion: 'Tarjeta física valorada que muestra el historial de movimientos de un producto: Control Físico (Entrada, Salida, Saldo), Precio Unitario y Control Valorado (Ingreso, Egreso, Saldo en Bs) con método PEPS. Incluye fila de totales para verificar que todo cuadra.',
  },
  {
    termino: 'PEPS / FIFO',
    definicion: 'Significa "Primero en Entrar, Primero en Salir": cuando vendes o consumes, el sistema descuenta primero el lote más antiguo para que nada se quede vencido.',
  },
  {
    termino: 'Stock mínimo',
    definicion: 'El nivel de existencia con el que quieres que el sistema te avise. Si el stock baja de ahí, se genera una alerta para que compres de nuevo.',
  },
  {
    termino: 'Código de producto',
    definicion: 'Clave única de cada artículo, se genera automáticamente según su categoría y subcategoría, por ejemplo ING-CAR-0001 (ING = Ingredientes, CAR = Carnes).',
  },
];

const pasos = [
  { icon: Tag, titulo: '1. Categorías', color: 'text-primary', desc: 'Clasificación principal del inventario (Ingredientes, Bebidas, Utensilios...).', path: '/categorias' },
  { icon: Layers, titulo: '2. Subcategorías', color: 'text-primary', desc: 'Subdivisiones dentro de cada categoría (Carnes, Lácteos, Verduras...).', path: '/subcategorias' },
  { icon: Ruler, titulo: '3. Unidades de medida', color: 'text-blue-500', desc: 'Cómo se mide cada producto: Kilogramo, Litro, Unidad, Caja...', path: '/unidades' },
  { icon: MapPin, titulo: '4. Ubicaciones', color: 'text-indigo-500', desc: 'Dónde se guarda: estanterías, refrigeradores y congeladores.', path: '/ubicaciones' },
  { icon: Truck, titulo: '5. Proveedores', color: 'text-emerald-500', desc: 'Registra a quién le compras, para agilizar las próximas compras.', path: '/proveedores' },
  { icon: Package, titulo: '6. Productos', color: 'text-amber-500', desc: 'Da de alta cada artículo. El código se genera solo con su categoría y subcategoría.', path: '/productos' },
  { icon: ShoppingCart, titulo: '7. Compras', color: 'text-cyan-500', desc: 'Registra la mercancía que llega. El sistema crea el lote y suma al inventario automáticamente.', path: '/compras' },
  { icon: Boxes, titulo: '8. Lotes', color: 'text-violet-500', desc: 'Revisa los lotes y sus fechas de vencimiento para usar primero lo más antiguo.', path: '/lotes' },
  { icon: ClipboardList, titulo: '9. Kardex', color: 'text-rose-500', desc: 'Tarjeta física valorada con Control Físico, P/U y Control Valorado. Filtra por periodo, lote o concepto y registra salidas con descuento PEPS.', path: '/kardex' },
  { icon: Database, titulo: '10. Inventario físico', color: 'text-teal-500', desc: 'Conteo real del almacén: inicia, cuenta lo que hay y completa. Las diferencias se ajustan solas.', path: '/inventario-fisico' },
  { icon: AlertTriangle, titulo: '11. Alertas', color: 'text-red-500', desc: 'Revisa avisos de stock bajo y productos por vencer para actuar a tiempo.', path: '/alertas' },
];

const modulos = [
  {
    titulo: '1. Categorías',
    path: '/categorias',
    campos: [
      { campo: 'Nombre', queEs: 'El tipo general de productos.', llenar: 'Ej: Ingredientes, Bebidas, Utensilios', mostraras: 'La etiqueta que verás en listas y filtros.' },
      { campo: 'Código', queEs: 'Clave corta única de la categoría.', llenar: 'Ej: ING para Ingredientes, BEB para Bebidas', mostraras: 'Forma parte del código de los productos (ING-CAR-0001).' },
      { campo: 'Descripción', queEs: 'Nota opcional para aclarar qué agrupa.', llenar: 'Ej: Todo lo que se usa para preparar los platos', mostraras: 'Información de apoyo en la lista de categorías.' },
    ],
    resultado: 'Al guardar, la categoría aparecerá en la lista y podrás usarla al crear subcategorías y productos.',
  },
  {
    titulo: '2. Subcategorías',
    path: '/subcategorias',
    campos: [
      { campo: 'Categoría', queEs: 'A qué clasificación principal pertenece.', llenar: 'Elige de la lista, ej. Ingredientes (ING)', mostraras: 'El grupo padre al que se asocia la subcategoría.' },
      { campo: 'Nombre', queEs: 'La división dentro de la categoría.', llenar: 'Ej: Carnes, Lácteos, Verduras, Legumbres', mostraras: 'La subdivisión que usarás en los productos.' },
      { campo: 'Código', queEs: 'Clave corta única de la subcategoría.', llenar: 'Ej: CAR para Carnes, LAC para Lácteos', mostraras: 'Segunda parte del código del producto (ING-CAR-0001).' },
    ],
    resultado: 'Quedará lista para asignar productos dentro de esa subcategoría.',
  },
  {
    titulo: '3. Unidades de medida',
    path: '/unidades',
    campos: [
      { campo: 'Nombre', queEs: 'Cómo se mide el producto.', llenar: 'Ej: Kilogramo, Litro, Unidad, Caja', mostraras: 'La unidad que elegirás para cada producto.' },
      { campo: 'Abreviatura', queEs: 'Código corto de la unidad.', llenar: 'Ej: Kg para Kilogramo, L para Litro, U para Unidad', mostraras: 'La abreviación que se muestra junto al stock.' },
    ],
    resultado: 'La unidad quedará disponible al registrar productos y en las listas de stock.',
  },
  {
    titulo: '4. Ubicaciones',
    path: '/ubicaciones',
    campos: [
      { campo: 'Nombre', queEs: 'Identificación del lugar de almacenamiento.', llenar: 'Ej: Refrigerador 1, Estantería A-01, Congelador 2', mostraras: 'Dónde se guarda cada producto.' },
      { campo: 'Tipo', queEs: 'Qué tipo de espacio es.', llenar: 'Elige: Estantería, Refrigerador o Congelador', mostraras: 'Filtro útil para saber la zona donde buscar.' },
      { campo: 'Descripción', queEs: 'Detalle opcional de la ubicación.', llenar: 'Ej: Estante de la derecha junto a la puerta', mostraras: 'Notas de apoyo al momento de ubicar productos.' },
    ],
    resultado: 'La ubicación quedará disponible para organizar los productos.',
  },
  {
    titulo: '5. Proveedores',
    path: '/proveedores',
    campos: [
      { campo: 'Nombre', queEs: 'Quién te vende la mercancía.', llenar: 'Ej: Distribuidora El Valle SRL', mostraras: 'A quién le compras, para registrarlo en cada compra.' },
      { campo: 'NIT', queEs: 'Identificación fiscal (opcional).', llenar: 'Ej: 1023456789', mostraras: 'Referencia para facturas y pagos.' },
      { campo: 'Teléfono', queEs: 'Número de contacto (opcional).', llenar: 'Ej: 76543210', mostraras: 'Para llamar y pedir o consultar pedidos.' },
      { campo: 'Correo', queEs: 'Email del proveedor (opcional).', llenar: 'Ej: ventas@distribuidoradelvalle.com', mostraras: 'Para enviar pedidos o recibir facturas.' },
      { campo: 'Dirección', queEs: 'Dónde está o cómo ubicarlo (opcional).', llenar: 'Ej: Av. 6 de Agosto #123', mostraras: 'Dirección para retirar o recibir mercancía.' },
      { campo: 'Persona de contacto', queEs: 'Con quién hablar (opcional).', llenar: 'Ej: María López', mostraras: 'A quién dirigirte al comprar.' },
    ],
    resultado: 'El proveedor quedará para seleccionarlo al registrar una compra.',
  },
  {
    titulo: '6. Productos',
    path: '/productos',
    campos: [
      { campo: 'Nombre', queEs: 'Nombre del artículo.', llenar: 'Ej: Carne de res molida, Leche entera 1L', mostraras: 'El artículo que manejarás en compras y kardex.' },
      { campo: 'Subcategoría', queEs: 'Grupo al que pertenece.', llenar: 'Elige, ej. Ingredientes / Carnes (ING-CAR)', mostraras: 'El código del producto se genera automático, ej. ING-CAR-0001.' },
      { campo: 'Unidad de medida', queEs: 'Cómo se mide.', llenar: 'Ej: Kilogramo (Kg), Litro (L), Unidad (U)', mostraras: 'La unidad con la que verás el stock.' },
      { campo: 'Stock mínimo', queEs: 'El nivel mínimo antes de avisarte.', llenar: 'Ej: 10 unidades', mostraras: 'Si baja de ahí, se activa la alerta de stock bajo.' },
      { campo: 'Controla vencimiento', queEs: 'Si el producto se echa a perder.', llenar: 'Actívalo para lácteos, carnes, quesos, jugos', mostraras: 'Se controlará su fecha de vencimiento y aparecerá en alertas de vencimiento.' },
    ],
    resultado: 'El producto quedará registrado con su código único y podrá recibir compras.',
  },
  {
    titulo: '7. Compras',
    path: '/compras',
    campos: [
      { campo: 'Proveedor', queEs: 'A quién le compraste.', llenar: 'Elige de la lista de proveedores', mostraras: 'Referencia de origen de la mercancía.' },
      { campo: 'Fecha', queEs: 'Día de la compra.', llenar: 'Si no eliges, usa la de hoy', mostraras: 'La fecha que tendrá el lote.' },
      { campo: 'Producto', queEs: 'Qué artículo llega.', llenar: 'Elige el producto de la lista', mostraras: 'A qué producto se suma el inventario.' },
      { campo: 'Cantidad', queEs: 'Cuánto llegó.', llenar: 'Ej: 5', mostraras: 'Cantidad que se suma al stock en el lote.' },
      { campo: 'Costo unitario', queEs: 'Cuánto costó cada unidad.', llenar: 'Ej: 25.50 (en Bs)', mostraras: 'El costo contra el que se valora el kardex.' },
      { campo: 'Vencimiento', queEs: 'Fecha de caducidad (opcional).', llenar: 'Ej: 30/09/2026', mostraras: 'Se usa para alertas de próximo a vencer.' },
    ],
    resultado: 'Al guardar, el sistema crea el lote automático, suma al stock y deja registrada la entrada en el kardex.',
  },
  {
    titulo: '8. Lotes',
    path: '/lotes',
    campos: [
      { campo: 'Código', queEs: 'Identificador automático del lote.', llenar: 'Se genera solo, ej. LT-20260831-0001', mostraras: 'Con qué lote se rastrea la mercancía.' },
      { campo: 'Producto', queEs: 'A qué artículo pertenece.', llenar: 'Automático al registrar la compra', mostraras: 'Qué producto agrupa cada lote.' },
      { campo: 'Cantidad', queEs: 'Cuánto queda de ese lote.', llenar: 'Automático según compras y salidas', mostraras: 'Cuánto queda antes de gastarse por PEPS.' },
      { campo: 'Vencimiento', queEs: 'Cuándo caduca.', llenar: 'Automático desde la compra', mostraras: 'Para sacar primero los más antiguos.' },
    ],
    resultado: 'En esta pantalla solo revisas los lotes; no se llenan datos, se consultan y se usan para la salida PEPS.',
  },
  {
    titulo: '9. Kardex',
    path: '/kardex',
    campos: [
      { campo: 'Producto', queEs: 'De qué artículo vamos a ver el historial.', llenar: 'Selecciona en el selector', mostraras: 'La tarjeta física valorada del producto elegido.' },
      { campo: 'Control Físico', queEs: 'Columnas de cantidad: Entrada, Salida y Saldo.', llenar: 'Se llena automáticamente con cada movimiento', mostraras: 'Lo que entra, sale y queda en unidades del producto.' },
      { campo: 'P/U', queEs: 'Precio Unitario del movimiento.', llenar: 'Sale del costo del lote (PEPS)', mostraras: 'El costo unitario contra el que se valora cada movimiento.' },
      { campo: 'Control Valorado', queEs: 'Columnas en Bs: Ingreso, Egreso y Saldo.', llenar: 'Se calcula: cantidad × P/U', mostraras: 'El valor monetario de cada movimiento y el saldo en Bolivianos.' },
      { campo: 'Filtros', queEs: 'Acotar el historial del producto.', llenar: 'Elige periodo (Hoy, Semana, Mes, 3 meses, Todo), rango de fechas, lote o concepto', mostraras: 'Solo los movimientos que cumplen el filtro, recalculando los saldos y totales.' },
      { campo: 'Fila Totales', queEs: 'Verificación al final de la tabla.', llenar: 'Se calcula solo (suma de entradas − salidas = saldo)', mostraras: 'Si cuadra, todo está bien ajustado.' },
    ],
    resultado: 'El stock baja con la salida registrada. Los filtros permiten ver periodos específicos y la fila de totales verifica que las sumas coinciden con los saldos finales.',
  },
  {
    titulo: '10. Inventario físico',
    path: '/inventario-fisico',
    campos: [
      { campo: 'Producto', queEs: 'Qué artículo vas a contar.', llenar: 'Elige el producto a verificar', mostraras: 'Quién participa en el conteo.' },
      { campo: 'Cant. real', queEs: 'Lo que realmente cuentas en el almacén.', llenar: 'Ej: 12', mostraras: 'Al completar, se compara con el sistema y se ajusta la diferencia.' },
    ],
    resultado: 'La diferencia entre lo contado y el sistema se ajusta automáticamente y queda registrada en el kardex.',
  },
  {
    titulo: '11. Alertas',
    path: '/alertas',
    campos: [
      { campo: 'Tipo', queEs: 'Qué tipo de aviso es.', llenar: 'Stock bajo o Próximo a vencer (automático)', mostraras: 'Qué revisar: comprar o usar antes del vencimiento.' },
      { campo: 'Producto / Mensaje', queEs: 'Cuál es el aviso.', llenar: 'Se genera sola según el stock y las fechas', mostraras: 'El producto y la acción recomendada.' },
      { campo: 'Marcar leídas', queEs: 'Confirmar que viste el aviso.', llenar: 'Pulsa el botón de la alerta', mostraras: 'La alerta deja de mostrarse como pendiente.' },
    ],
    resultado: 'Revisas las alertas al iniciar el turno para comprar a tiempo o retirar productos por vencer. No se llenan datos, solo se consultan y se marcan como leídas.',
  },
];

function CampoAcordeon({ mod }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="border border-gray-200 rounded-xl overflow-hidden">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between gap-3 px-4 py-3 bg-gray-50 hover:bg-gray-100 transition-colors text-left"
      >
        <span className="font-semibold text-sm text-gray-900">{mod.titulo}</span>
        {open ? <ChevronDown size={18} className="text-primary shrink-0" /> : <ChevronRight size={18} className="text-gray-400 shrink-0" />}
      </button>
      {open && (
        <div className="p-4">
          <div className="overflow-x-auto">
            <table className="w-full text-sm min-w-[560px]">
              <thead>
                <tr className="text-left text-xs uppercase tracking-wide text-gray-500 border-b border-gray-200">
                  <th className="py-2 pr-3 font-semibold">Campo</th>
                  <th className="py-2 pr-3 font-semibold">Qué es</th>
                  <th className="py-2 pr-3 font-semibold">Qué llenar (Ej:)</th>
                  <th className="py-2 font-semibold">Qué mostrarás</th>
                </tr>
              </thead>
              <tbody>
                {mod.campos.map((c, i) => (
                  <tr key={i} className="border-b border-gray-100 align-top">
                    <td className="py-2 pr-3 font-medium text-gray-900 whitespace-nowrap">{c.campo}</td>
                    <td className="py-2 pr-3 text-gray-600">{c.queEs}</td>
                    <td className="py-2 pr-3 text-gray-600"><span className="text-gray-500">{c.llenar}</span></td>
                    <td className="py-2 text-gray-600">{c.mostraras}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="text-xs text-primary mt-3 flex items-center gap-1.5">
            <CheckCircle2 size={14} /> Al final: {mod.resultado}
          </p>
        </div>
      )}
    </div>
  );
}

function Manual() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
          <BookOpen size={24} className="text-primary" />
          Manual del Inventario
        </h1>
        <p className="text-gray-500 mt-1">Guía completa de principio a fin para que el empleado se oriente: cómo se organiza y se usa cada parte del almacén.</p>
      </div>

      {/* Concepto general */}
      <div className="bg-primary/5 border border-primary/20 rounded-xl p-6 card-shadow">
        <h2 className="text-lg font-semibold text-gray-900 mb-2">¿Qué es esto?</h2>
        <p className="text-sm text-gray-700 leading-relaxed">
          GastroStock es la gestión del inventario del restaurante. Aquí se registra <b>todo lo que entra y sale del almacén</b>,
          se controla cuánto hay de cada producto y cuándo se vence, y se generan alertas para que nunca falte ni se desperdicie mercancía.
        </p>
        <p className="text-sm text-gray-700 leading-relaxed mt-2">
          Lo importante es seguir el orden del flujo: primero se organiza el <b>catálogo</b>, luego se registran las <b>compras</b> y
          finalmente se controla con <b>kardex</b> y <b>inventario físico</b>.
        </p>
      </div>

      {/* Flujo paso a paso */}
      <div className="bg-white rounded-xl p-6 card-shadow">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Flujo paso a paso</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {pasos.map((p) => (
            <Link
              key={p.titulo}
              to={p.path}
              className="group border border-gray-200 rounded-xl p-4 hover:border-primary hover:shadow-md transition-all"
            >
              <div className="flex items-center gap-3">
                <p.icon size={22} className={p.color} />
                <h3 className="font-semibold text-gray-900 text-sm">{p.titulo}</h3>
              </div>
              <p className="text-xs text-gray-500 mt-2 leading-relaxed">{p.desc}</p>
              <span className="inline-flex items-center gap-1 text-xs text-primary font-medium mt-2 group-hover:underline">
                Ir a la sección <ArrowRight size={12} />
              </span>
            </Link>
          ))}
        </div>
      </div>

      {/* Detalle de cada formulario */}
      <div className="bg-white rounded-xl p-6 card-shadow">
        <h2 className="text-lg font-semibold text-gray-900 mb-1">Detalle de cada formulario</h2>
        <p className="text-sm text-gray-500 mb-4">Toca cada sección para ver campo por campo qué es, qué llenar (con ejemplos) y qué verás al guardar.</p>
        <div className="space-y-2">
          {modulos.map((m, i) => <CampoAcordeon key={i} mod={m} />)}
        </div>
      </div>

      {/* Términos */}
      <div className="bg-white rounded-xl p-6 card-shadow">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Términos que debes conocer</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {terminos.map((t) => (
            <div key={t.termino} className="border border-gray-100 rounded-lg p-4 bg-gray-50">
              <h3 className="font-semibold text-primary text-sm">{t.termino}</h3>
              <p className="text-xs text-gray-600 mt-1 leading-relaxed">{t.definicion}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Consejos generales */}
      <div className="bg-amber-50 border border-amber-200 rounded-xl p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-3 flex items-center gap-2">
          <Lightbulb size={18} className="text-amber-600" />
          Buenas prácticas
        </h2>
        <ul className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm text-gray-700">
          <li className="flex gap-2"><span className="text-amber-600">•</span> Registra la compra apenas llegue la mercancía, para que el stock siempre esté al día.</li>
          <li className="flex gap-2"><span className="text-amber-600">•</span> Usa el stock mínimo en cada producto para que el sistema te avise a tiempo.</li>
          <li className="flex gap-2"><span className="text-amber-600">•</span> Carga el inventario físico con constancia (por ejemplo, 1 vez al mes) para detectar diferencias.</li>
          <li className="flex gap-2"><span className="text-amber-600">•</span> Saca primero los lotes más antiguos (PEPS) y revisa las fechas de vencimiento.</li>
          <li className="flex gap-2"><span className="text-amber-600">•</span> Registra todo consumo o merma en el Kardex; así el inventario refleja la realidad.</li>
          <li className="flex gap-2"><span className="text-amber-600">•</span> Revisa las alertas al inicio de tu turno para no quedarte sin productos clave.</li>
        </ul>
      </div>
    </div>
  );
}

export default Manual;
