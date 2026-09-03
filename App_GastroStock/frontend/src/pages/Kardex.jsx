import { useState, useEffect, useMemo } from 'react';
import { Loader2, Package, Filter, X, CalendarDays, Layers } from 'lucide-react';
import Modal from '../components/ui/Modal';
import SectionGuide from '../components/ui/SectionGuide';
import { kardexApi, lotesApi, productosApi } from '../services/gastro.service';
import { formatQuantity, formatBs } from '../utils/format';

const CONCEPTOS = [
  ['COMPRA', 'Compra'],
  ['DONACION', 'Donación'],
  ['DEVOLUCION', 'Devolución'],
  ['CONSUMO', 'Consumo'],
  ['MERMA', 'Merma'],
  ['VENCIDO', 'Vencido'],
  ['AJUSTE_POSITIVO', 'Ajuste +'],
  ['AJUSTE_NEGATIVO', 'Ajuste -'],
  ['INVENTARIO_FISICO', 'Inv. Físico'],
];

const PERIODOS = [
  ['hoy', 'Hoy'],
  ['semana', 'Semana'],
  ['mes', 'Mes'],
  ['3m', '3 meses'],
  ['todo', 'Todo'],
];

function inicioDePeriodo(periodo) {
  const now = new Date();
  const d = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  if (periodo === 'hoy') return d;
  if (periodo === 'semana') {
    const day = (d.getDay() + 6) % 7;
    return new Date(d.getFullYear(), d.getMonth(), d.getDate() - day);
  }
  if (periodo === 'mes') return new Date(d.getFullYear(), d.getMonth(), 1);
  if (periodo === '3m') return new Date(d.getFullYear(), d.getMonth() - 2, 1);
  return null;
}

function toDateInput(d) {
  return d ? `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}` : '';
}

function Kardex() {
  const [productos, setProductos] = useState([]);
  const [productoId, setProductoId] = useState('');
  const [kardex, setKardex] = useState([]);
  const [producto, setProducto] = useState(null);
  const [lotes, setLotes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadingKardex, setLoadingKardex] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [form, setForm] = useState({ cantidad: '', concepto: 'CONSUMO', referencia: '' });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [periodo, setPeriodo] = useState('todo');
  const [fechaDesde, setFechaDesde] = useState('');
  const [fechaHasta, setFechaHasta] = useState('');
  const [loteId, setLoteId] = useState('');
  const [conceptosSel, setConceptosSel] = useState([]);

  useEffect(() => { fetchProductos(); }, []);

  const fetchProductos = async () => {
    try {
      setLoading(true);
      const res = await productosApi.getAll();
      setProductos(res.data?.data || []);
    } catch (err) {
      console.error('Error:', err);
    } finally {
      setLoading(false);
    }
  };

  const loadKardex = async (id, filters = {}) => {
    try {
      setLoadingKardex(true);
      const res = await kardexApi.getByProducto(id, filters);
      setKardex(res.data?.data || []);
      setProducto(res.data?.producto || null);
    } catch (err) {
      console.error('Error:', err);
    } finally {
      setLoadingKardex(false);
    }
  };

  const buildFilters = (overrides = {}) => {
    const f = {};
    if (fechaDesde) f.fecha_desde = fechaDesde;
    if (fechaHasta) f.fecha_hasta = fechaHasta;
    if (loteId) f.lote_id = loteId;
    if (conceptosSel.length > 0) f.conceptos = conceptosSel.join(',');
    return { ...f, ...overrides };
  };

  const reloadWith = (overrides = {}) => {
    if (productoId) loadKardex(productoId, buildFilters(overrides));
  };

  const handleSelect = (e) => {
    const id = e.target.value;
    setProductoId(id);
    if (id) {
      loadKardex(id);
      lotesApi.getByProducto(id).then((res) => {
        setLotes(res.data?.data || []);
      }).catch(() => setLotes([]));
    } else {
      setKardex([]);
      setProducto(null);
      setLotes([]);
    }
  };

  const selectPeriodo = (p) => {
    setPeriodo(p);
    if (p === 'todo') {
      setFechaDesde('');
      setFechaHasta('');
      reloadWith({ fecha_desde: undefined, fecha_hasta: undefined });
    } else {
      const d = inicioDePeriodo(p);
      setFechaDesde(toDateInput(d));
      setFechaHasta(toDateInput(new Date()));
      reloadWith({ fecha_desde: toDateInput(d), fecha_hasta: toDateInput(new Date()) });
    }
  };

  const toggleConcepto = (c) => {
    setConceptosSel((prev) => {
      const next = prev.includes(c) ? prev.filter((x) => x !== c) : [...prev, c];
      reloadWith({ conceptos: next.join(',') });
      return next;
    });
  };

  const limpiarFiltros = () => {
    setPeriodo('todo');
    setFechaDesde('');
    setFechaHasta('');
    setLoteId('');
    setConceptosSel([]);
    reloadWith({ fecha_desde: undefined, fecha_hasta: undefined, lote_id: undefined, conceptos: undefined });
  };

  const hayFiltros = Boolean(fechaDesde || fechaHasta || loteId || conceptosSel.length > 0);

  const openSalida = () => {
    setForm({ cantidad: '', concepto: 'CONSUMO', referencia: '' });
    setError('');
    setModalOpen(true);
  };

  const handleSalida = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError('');
    try {
      await kardexApi.registrarSalida({
        producto_id: Number(productoId),
        cantidad: Number(form.cantidad),
        concepto: form.concepto,
        referencia: form.referencia || null
      });
      setModalOpen(false);
      alert('Salida registrada exitosamente (descuento PEPS automático)');
      loadKardex(productoId);
    } catch (err) {
      setError(err.response?.data?.message || err.response?.data?.error || 'Error al registrar salida');
    } finally {
      setSaving(false);
    }
  };

  const getConceptoClass = (concepto) => {
    const entradas = ['COMPRA', 'DONACION', 'DEVOLUCION', 'AJUSTE_POSITIVO', 'INVENTARIO_FISICO'];
    return entradas.includes(concepto) ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700';
  };

  const getConceptoLabel = (concepto) => {
    const labels = {
      'COMPRA': 'Compra', 'DONACION': 'Donación', 'DEVOLUCION': 'Devolución',
      'CONSUMO': 'Consumo', 'MERMA': 'Merma', 'VENCIDO': 'Vencido',
      'AJUSTE_POSITIVO': 'Ajuste +', 'AJUSTE_NEGATIVO': 'Ajuste -', 'INVENTARIO_FISICO': 'Inv. Físico'
    };
    return labels[concepto] || concepto;
  };

  const filasKardex = useMemo(() => {
    let contadorEntradas = 0;
    let contadorSalidas = 0;
    let saldoCantidad = 0;
    let saldoBs = 0;
    return kardex.map((item) => {
      const entrada = Number(item.entrada) || 0;
      const salida = Number(item.salida) || 0;
      const costo = Number(item.costo_unitario) || 0;
      const debe = entrada * costo;
      const haber = salida * costo;
      saldoCantidad += entrada - salida;
      saldoBs += debe - haber;
      const esEntrada = entrada > 0;
      const ns = esEntrada ? `NI-${++contadorEntradas}` : `NS-${++contadorSalidas}`;
      return { item, entrada, salida, costo, debe, haber, saldoCantidad, saldoBs, ns };
    });
  }, [kardex]);

  const totales = useMemo(() => {
    const totalEntradas = filasKardex.reduce((sum, f) => sum + f.entrada, 0);
    const totalSalidas = filasKardex.reduce((sum, f) => sum + f.salida, 0);
    const totalIngresos = filasKardex.reduce((sum, f) => sum + f.debe, 0);
    const totalEgresos = filasKardex.reduce((sum, f) => sum + f.haber, 0);
    return { totalEntradas, totalSalidas, totalIngresos, totalEgresos, saldoCantidad: totalEntradas - totalSalidas, saldoBs: totalIngresos - totalEgresos };
  }, [filasKardex]);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Kardex</h1>
          <p className="text-gray-500 mt-1">Historial de movimientos por producto</p>
        </div>
        {productoId && (
          <button onClick={openSalida} className="px-4 py-2 bg-primary text-on-accent rounded-lg hover:bg-primary-dark transition-colors flex items-center gap-2">
            <Package size={18} />
            Registrar Salida
          </button>
        )}
      </div>

      <SectionGuide
        title="¿Qué es el Kardex?"
        steps={[
          'Es la tarjeta física valorada de cada producto: muestra Control Físico (Entrada, Salida, Saldo), el Precio Unitario y el Control Valorado (Ingreso, Egreso, Saldo en Bs).',
          'Para verlo, elige un producto en el selector. Verás sus entradas (en verde), salidas (en rojo) y los saldos.',
          'La fila de Totales al final verifica que todo cuadre: Σ Entradas − Σ Salidas = Saldo final.',
          'Usa los filtros (periodo, rango de fechas, lote o concepto) para ver solo los movimientos que te interesan.',
          'Cuando saques mercancía del almacén (consumo, merma o producto vencido), haz clic en "Registrar Salida", indica la cantidad y el concepto.',
          'El sistema descuenta el stock automáticamente usando PEPS: primero quita del lote más antiguo.',
        ]}
        tips={[
          'Registra cada consumo o merma aquí para que el inventario siempre refleje la realidad.',
          'Revisa la fila de totales para confirmar que las sumas son correctas.',
        ]}
      />

      <div className="bg-white rounded-xl p-6 card-shadow">
        <label className="block text-sm font-medium text-gray-700 mb-2">Seleccionar producto</label>
        <select
          value={productoId}
          onChange={handleSelect}
          className="w-full px-3 py-2.5 rounded-lg border border-gray-200 focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none"
        >
          <option value="">Seleccionar producto...</option>
          {productos.map(p => <option key={p.id} value={p.id}>{p.nombre} ({p.codigo})</option>)}
        </select>

        {producto && (
          <div className="mt-4 bg-white rounded-xl p-4 border border-gray-200">
            <div className="flex flex-wrap items-center justify-between gap-3 mb-3">
              <h3 className="text-sm font-bold text-gray-700 uppercase tracking-wider flex items-center gap-2"><Filter size={16} /> Filtros</h3>
              {hayFiltros && (
                <div className="flex gap-2">
                  <button onClick={limpiarFiltros} className="px-3 py-1.5 text-xs font-medium text-gray-600 hover:bg-gray-100 rounded-lg transition-colors flex items-center gap-1"><X size={14} /> Limpiar</button>
                </div>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="flex items-center gap-1 text-xs font-medium text-gray-500 mb-1"><CalendarDays size={14} /> Periodo</label>
                <div className="flex flex-wrap gap-1.5">
                  {PERIODOS.map(([val, label]) => (
                    <button
                      key={val}
                      type="button"
                      onClick={() => selectPeriodo(val)}
                      className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-colors ${periodo === val ? 'bg-primary text-on-accent' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
                    >
                      {label}
                    </button>
                  ))}
                </div>
                <div className="flex gap-2 mt-2">
                  <input type="date" value={fechaDesde} onChange={(e) => { setFechaDesde(e.target.value); reloadWith({ fecha_desde: e.target.value || undefined }); }} className="w-full px-2.5 py-1.5 rounded-lg border border-gray-200 text-xs focus:border-primary outline-none" />
                  <span className="text-gray-400 self-center text-xs">→</span>
                  <input type="date" value={fechaHasta} onChange={(e) => { setFechaHasta(e.target.value); reloadWith({ fecha_hasta: e.target.value || undefined }); }} className="w-full px-2.5 py-1.5 rounded-lg border border-gray-200 text-xs focus:border-primary outline-none" />
                </div>
              </div>

              <div>
                <label className="flex items-center gap-1 text-xs font-medium text-gray-500 mb-1"><Layers size={14} /> Lote</label>
                <select value={loteId} onChange={(e) => { setLoteId(e.target.value); reloadWith({ lote_id: e.target.value || undefined }); }} className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm focus:border-primary outline-none">
                  <option value="">Todos los lotes</option>
                  {lotes.map((l) => <option key={l.id} value={l.id}>{l.numero_lote}</option>)}
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">Concepto</label>
                <div className="flex flex-wrap gap-x-3 gap-y-1.5">
                  {CONCEPTOS.map(([val, label]) => (
                    <label key={val} className="inline-flex items-center gap-1.5 text-xs text-gray-700 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={conceptosSel.includes(val)}
                        onChange={() => toggleConcepto(val)}
                        className="rounded border-gray-300 text-primary focus:ring-primary"
                      />
                      {label}
                    </label>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {producto && (
          <div className="mt-4 bg-white rounded-xl overflow-hidden card-shadow border border-gray-300">
            <div className="grid grid-cols-3 border-b-2 border-gray-700">
              <div className="p-4 border-r-2 border-gray-700">
                <p className="text-sm text-gray-700"><span className="font-bold">PRODUCTO:</span> <span className="font-medium">{producto.nombre}</span></p>
                <p className="mt-1 text-sm text-gray-700"><span className="font-bold">CÓDIGO:</span> <span className="font-mono">{producto.codigo}</span></p>
                <p className="mt-1 text-sm text-gray-700"><span className="font-bold">UNIDAD MEDIDA:</span> <span className="font-medium uppercase">{producto.unidad || producto.unidad_abreviatura || '—'}</span></p>
              </div>
              <div className="flex items-center justify-center p-4 border-r-2 border-gray-700">
                <h2 className="text-3xl font-black text-gray-900 tracking-tight">KARDEX</h2>
              </div>
              <div className="flex flex-col items-center justify-center p-4">
                <p className="text-xs font-bold text-gray-700 uppercase tracking-wider">Técnica de valuación:</p>
                <span className="mt-2 px-4 py-1 bg-amber-100 border-2 border-amber-300 text-amber-900 font-black text-lg">PEPS</span>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full border-collapse">
                <thead>
                  <tr className="bg-blue-100">
                    <th rowSpan={2} className="border border-gray-700 px-4 py-3 text-center text-sm font-bold text-gray-800 uppercase">Fecha</th>
                    <th rowSpan={2} className="border border-gray-700 px-4 py-3 text-center text-sm font-bold text-gray-800 uppercase">NI / NS</th>
                    <th rowSpan={2} className="border border-gray-700 px-4 py-3 text-center text-sm font-bold text-gray-800 uppercase">Concepto</th>
                    <th colSpan={3} className="border border-gray-700 px-4 py-2 text-center text-sm font-bold text-gray-800 uppercase">Control Físico</th>
                    <th rowSpan={2} className="border border-gray-700 px-4 py-3 text-center text-sm font-bold text-gray-800 uppercase">P/U</th>
                    <th colSpan={3} className="border border-gray-700 px-4 py-2 text-center text-sm font-bold text-gray-800 uppercase">Control Valorado</th>
                  </tr>
                  <tr className="bg-blue-100">
                    <th className="border border-gray-700 px-4 py-2 text-center text-xs font-bold text-gray-700 uppercase">Entrada</th>
                    <th className="border border-gray-700 px-4 py-2 text-center text-xs font-bold text-gray-700 uppercase">Salida</th>
                    <th className="border border-gray-700 px-4 py-2 text-center text-xs font-bold text-gray-700 uppercase">Saldo</th>
                    <th className="border border-gray-700 px-4 py-2 text-center text-xs font-bold text-gray-700 uppercase">Ingreso</th>
                    <th className="border border-gray-700 px-4 py-2 text-center text-xs font-bold text-gray-700 uppercase">Egreso</th>
                    <th className="border border-gray-700 px-4 py-2 text-center text-xs font-bold text-gray-700 uppercase">Saldo</th>
                  </tr>
                </thead>
                <tbody>
                  {loadingKardex ? (
                    <tr>
                      <td colSpan={11} className="border border-gray-700">
                        <div className="flex items-center justify-center h-40"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>
                      </td>
                    </tr>
                  ) : filasKardex.length === 0 ? (
                    <tr>
                      <td colSpan={11} className="border border-gray-700 px-4 py-8 text-center text-sm text-gray-500">Sin movimientos para este producto</td>
                    </tr>
                  ) : filasKardex.map(({ item, entrada, salida, costo, debe, haber, saldoCantidad, saldoBs, ns }, index) => (
                    <tr key={item.id} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                      <td className="border border-gray-700 px-4 py-2 text-sm whitespace-nowrap">{new Date(item.fecha).toLocaleString('es-ES', { day: '2-digit', month: '2-digit', year: '2-digit', hour: '2-digit', minute: '2-digit' })}</td>
                      <td className="border border-gray-700 px-4 py-2 text-sm font-bold text-center">{ns}</td>
                      <td className="border border-gray-700 px-4 py-2 text-sm">
                        <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium ${getConceptoClass(item.concepto)}`}>{getConceptoLabel(item.concepto)}</span>
                        {item.referencia ? <span className="block text-xs text-gray-400 mt-0.5 truncate max-w-[160px]">{item.referencia}</span> : null}
                      </td>
                      <td className="border border-gray-700 px-4 py-2 text-sm font-medium text-green-700 text-right">{entrada > 0 ? formatQuantity(entrada) : '—'}</td>
                      <td className="border border-gray-700 px-4 py-2 text-sm font-medium text-red-700 text-right">{salida > 0 ? formatQuantity(salida) : '—'}</td>
                      <td className="border border-gray-700 px-4 py-2 text-sm font-bold text-right">{formatQuantity(saldoCantidad)}</td>
                      <td className="border border-gray-700 px-4 py-2 text-sm text-right">{costo > 0 ? formatBs(costo) : '—'}</td>
                      <td className="border border-gray-700 px-4 py-2 text-sm text-right">{debe > 0 ? formatBs(debe) : '—'}</td>
                      <td className="border border-gray-700 px-4 py-2 text-sm text-right">{haber > 0 ? formatBs(haber) : '—'}</td>
                      <td className="border border-gray-700 px-4 py-2 text-sm font-bold text-right">{formatBs(saldoBs)}</td>
                    </tr>
                  ))}
                </tbody>
                {filasKardex.length > 0 && (
                  <tfoot>
                    <tr className="bg-amber-50 text-amber-900 font-bold">
                      <td colSpan={3} className="border border-gray-700 px-4 py-3 text-sm text-center uppercase">Totales</td>
                      <td className="border border-gray-700 px-4 py-3 text-sm text-right">{formatQuantity(totales.totalEntradas)}</td>
                      <td className="border border-gray-700 px-4 py-3 text-sm text-right">{formatQuantity(totales.totalSalidas)}</td>
                      <td className="border border-gray-700 px-4 py-3 text-sm text-right">{formatQuantity(totales.saldoCantidad)}</td>
                      <td className="border border-gray-700 px-4 py-3 text-sm text-center">—</td>
                      <td className="border border-gray-700 px-4 py-3 text-sm text-right">{formatBs(totales.totalIngresos)}</td>
                      <td className="border border-gray-700 px-4 py-3 text-sm text-right">{formatBs(totales.totalEgresos)}</td>
                      <td className="border border-gray-700 px-4 py-3 text-sm text-right">{formatBs(totales.saldoBs)}</td>
                    </tr>
                  </tfoot>
                )}
              </table>
            </div>
          </div>
        )}
      </div>

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title="Registrar Salida (PEPS)" >
        <form onSubmit={handleSalida} className="space-y-4">
          {error && <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-sm text-red-600">{error}</div>}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Producto</label>
            <input type="text" value={producto?.nombre || ''} disabled className="w-full px-3 py-2.5 rounded-lg border border-gray-200 bg-gray-50" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Cantidad *</label>
            <input type="number" step="0.001" value={form.cantidad} onChange={(e) => setForm({ ...form, cantidad: e.target.value })} className="w-full px-3 py-2.5 rounded-lg border border-gray-200 focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none" required min="0" />
            <p className="text-xs text-gray-500 mt-1">Ej: 3 · Stock disponible: {producto?.stock_actual || 0}</p>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Concepto *</label>
            <select value={form.concepto} onChange={(e) => setForm({ ...form, concepto: e.target.value })} className="w-full px-3 py-2.5 rounded-lg border border-gray-200 focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none">
              <option value="CONSUMO">Consumo</option>
              <option value="MERMA">Merma</option>
              <option value="VENCIDO">Producto vencido</option>
              <option value="AJUSTE_NEGATIVO">Ajuste negativo</option>
            </select>
            <p className="text-xs text-gray-500 mt-1">Ej: Consumo = se usó en cocina · Merma = se dañó · Vencido = caducó</p>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Referencia / Motivo</label>
            <input type="text" value={form.referencia} onChange={(e) => setForm({ ...form, referencia: e.target.value })} className="w-full px-3 py-2.5 rounded-lg border border-gray-200 focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none" placeholder="Ej: Preparación menú del día" />
            <p className="text-xs text-gray-500 mt-1">Ej: Preparación del menú del día, lote vencido en refrigerador</p>
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <button type="button" onClick={() => setModalOpen(false)} className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors">Cancelar</button>
            <button type="submit" disabled={saving} className="px-4 py-2 bg-primary text-on-accent rounded-lg hover:bg-primary-dark transition-colors disabled:opacity-50 flex items-center gap-2">
              {saving && <Loader2 size={16} className="animate-spin" />}
              Registrar
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}

export default Kardex;
