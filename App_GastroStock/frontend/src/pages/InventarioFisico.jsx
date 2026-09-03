import { useState, useEffect } from 'react';
import { Loader2, ClipboardList, Plus, Search, Check, Trash2 } from 'lucide-react';
import Modal from '../components/ui/Modal';
import Table from '../components/ui/Table';
import SectionGuide from '../components/ui/SectionGuide';
import { inventarioFisicoApi, productosApi } from '../services/gastro.service';
import { formatQuantity } from '../utils/format';

function InventarioFisico() {
  const [inventarios, setInventarios] = useState([]);
  const [productos, setProductos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [nuevoId, setNuevoId] = useState(null);
  const [items, setItems] = useState([{ producto_id: '', stock_real: '' }]);

  useEffect(() => { fetchAll(); }, []);

  const fetchAll = async () => {
    try {
      setLoading(true);
      const [inv, prod] = await Promise.all([
        inventarioFisicoApi.getAll(),
        productosApi.getAll()
      ]);
      setInventarios(inv.data?.data || []);
      setProductos(prod.data?.data || []);
    } catch (err) {
      console.error('Error:', err);
    } finally {
      setLoading(false);
    }
  };

  const openCreate = async () => {
    setError('');
    setItems([{ producto_id: '', stock_real: '' }]);
    try {
      const res = await inventarioFisicoApi.iniciar();
      setNuevoId(res.data?.data?.id);
      setModalOpen(true);
    } catch (err) {
      setError(err.response?.data?.message || 'Error al iniciar el inventario');
      setModalOpen(true);
    }
  };

  const addItem = () => setItems([...items, { producto_id: '', stock_real: '' }]);

  const updateItem = (idx, field, value) => {
    const newItems = [...items];
    newItems[idx][field] = value;
    setItems(newItems);
  };

  const removeItem = (idx) => {
    if (items.length === 1) return;
    setItems(items.filter((_, i) => i !== idx));
  };

  const handleConteo = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError('');
    try {
      await inventarioFisicoApi.registrarConteo(nuevoId, items.map(i => ({
        producto_id: Number(i.producto_id),
        stock_real: Number(i.stock_real)
      })));
      await inventarioFisicoApi.completar(nuevoId);
      setModalOpen(false);
      alert('Inventario físico aplicado y completado. Las diferencias se ajustaron automáticamente.');
      fetchAll();
    } catch (err) {
      setError(err.response?.data?.message || err.response?.data?.error || 'Error al guardar el conteo');
    } finally {
      setSaving(false);
    }
  };

  const filtered = inventarios.filter(i =>
    String(i.id).includes(search) ||
    (i.usuario_nombre || '').toLowerCase().includes(search.toLowerCase())
  );

  const getStatus = (i) => {
    if (i.estado === 'EN_PROGRESO') return 'bg-yellow-100 text-yellow-700';
    return 'bg-green-100 text-green-700';
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Inventario Físico</h1>
          <p className="text-gray-500 mt-1">Conteo real del almacén con ajuste automático de stock</p>
        </div>
        <button onClick={openCreate} className="px-4 py-2 bg-primary text-on-accent rounded-lg hover:bg-primary-dark transition-colors flex items-center gap-2"><Plus size={18} /> Nuevo Conteo</button>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
        <input type="text" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Buscar inventario..." className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-gray-200 focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none" />
      </div>

      <SectionGuide
        title="¿Qué es el Inventario Físico?"
        steps={[
          'Es el conteo real de lo que hay físicamente en el almacén, para verificar que coincida con lo que dice el sistema.',
          'Cada producto muestra su "Stock en sistema" (lo que el sistema cree) y la "Diferencia" contra lo que cuentas.',
          'Proceso: haz clic en "Nuevo Conteo", elige los productos y escribe la cantidad REAL que hay, luego "Aplicar y Completar".',
          'Si hay diferencias, el sistema ajusta el stock automáticamente y lo registra en el historial.',
        ]}
        tips={[
          'Haz el conteo con constancia (por ejemplo, 1 vez al mes) para detectar robos, pérdidas o errores a tiempo.',
          'Cuenta solo lo que realmente está en el almacén, aunque no coincida con el sistema: la diferencia se ajustará sola.',
        ]}
      />

      <div className="bg-white rounded-xl p-6 card-shadow">
        {loading ? (
          <div className="flex items-center justify-center h-40"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>
        ) : (
          <Table
            headers={['#', 'Fecha', 'Estado', 'Registrado por']}
            data={filtered}
            emptyMessage="No hay inventarios registrados"
            renderRow={(item) => (
              <tr key={item.id} className="hover:bg-gray-50 transition-colors">
                <td className="px-6 py-4 text-sm font-medium text-gray-900">#{item.id}</td>
                <td className="px-6 py-4 text-sm text-gray-500">{new Date(item.fecha).toLocaleString('es-ES')}</td>
                <td className="px-6 py-4">
                  <span className={`inline-flex px-2 py-1 rounded-full text-xs font-medium ${getStatus(item)}`}>{item.estado === 'EN_PROGRESO' ? 'En progreso' : 'Completado'}</span>
                </td>
                <td className="px-6 py-4 text-sm text-gray-600">{item.usuario_nombre || '—'}</td>
              </tr>
            )}
          />
        )}
      </div>

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title="Nuevo Conteo Físico" size="xl">
        <form onSubmit={handleConteo} className="space-y-4">
          {nuevoId && (
            <div className="bg-primary/5 border border-primary/20 rounded-lg p-3 text-sm text-primary font-medium">
              Inventario #<b>{nuevoId}</b> iniciado · Ingresa el conteo real de cada producto
            </div>
          )}
          {error && <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-sm text-red-600">{error}</div>}

          {!nuevoId && (
            <div className="text-center py-4 text-gray-500">
              No se pudo iniciar el conteo. Intenta de nuevo.
            </div>
          )}

          {nuevoId && (
            <>
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-sm font-medium text-gray-700">Productos a contar</label>
                  <button type="button" onClick={addItem} className="text-sm text-primary hover:underline font-medium">+ Agregar producto</button>
                </div>
                <p className="text-xs text-gray-500 mb-3 -mt-1">Escribe la cantidad que realmente cuentas en el almacén (no lo que diga el sistema)</p>
                <div className="space-y-3">
                  {items.map((item, idx) => {
                    const prod = productos.find(p => String(p.id) === String(item.producto_id));
                    return (
                      <div key={idx} className="grid grid-cols-1 sm:grid-cols-12 gap-2 items-end p-3 bg-gray-50 rounded-lg">
                        <div className="sm:col-span-7">
                          <label className="block text-xs font-medium text-gray-500 mb-1">Producto *</label>
                          <select value={item.producto_id} onChange={(e) => updateItem(idx, 'producto_id', e.target.value)} className="w-full px-2.5 py-2 rounded-lg border border-gray-200 focus:border-primary outline-none" required>
                            <option value="">Seleccionar</option>
                            {productos.map(p => <option key={p.id} value={p.id}>{p.nombre} ({p.codigo})</option>)}
                          </select>
                        </div>
                        <div className="sm:col-span-4">
                          <label className="block text-xs font-medium text-gray-500 mb-1">Cant. real *</label>
                          <input type="number" step="0.001" value={item.stock_real} onChange={(e) => updateItem(idx, 'stock_real', e.target.value)} className="w-full px-2.5 py-2 rounded-lg border border-gray-200 focus:border-primary outline-none" required min="0" />
                          <p className="text-xs text-gray-400 mt-0.5">Ej: 12</p>
                        </div>
                        <div className="sm:col-span-1 flex sm:block items-end justify-end">
                          <button type="button" onClick={() => removeItem(idx)} className="p-2 text-gray-400 hover:text-red-500 rounded-lg"><Trash2 size={16} /></button>
                        </div>
                        {prod && (
                          <div className="col-span-12 text-xs text-gray-500 -mt-1">
                            Stock en sistema: <b>{formatQuantity(prod.stock_actual)}</b> {prod.unidad_abreviatura || ''} · Diferencia: <b className={item.stock_real !== '' && Number(item.stock_real) !== prod.stock_actual ? 'text-amber-600' : 'text-green-600'}>
                              {item.stock_real !== '' ? formatQuantity(Number(item.stock_real) - prod.stock_actual) : 0}
                            </b>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-2 border-t border-gray-100">
                <button type="button" onClick={() => setModalOpen(false)} className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors">Cancelar</button>
                <button type="submit" disabled={saving} className="px-4 py-2 bg-primary text-on-accent rounded-lg hover:bg-primary-dark transition-colors disabled:opacity-50 flex items-center gap-2">
                  {saving && <Loader2 size={16} className="animate-spin" />}
                  Aplicar y Completar
                </button>
              </div>
            </>
          )}
        </form>
      </Modal>
    </div>
  );
}

export default InventarioFisico;
