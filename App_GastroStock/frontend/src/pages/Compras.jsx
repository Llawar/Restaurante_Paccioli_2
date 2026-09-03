import { useState, useEffect } from 'react';
import { Plus, Search, Loader2, ShoppingCart, Trash2, XCircle } from 'lucide-react';
import Modal from '../components/ui/Modal';
import Table from '../components/ui/Table';
import SectionGuide from '../components/ui/SectionGuide';
import { comprasApi, proveedoresApi, productosApi } from '../services/gastro.service';
import { formatQuantity } from '../utils/format';

function Compras() {
  const [compras, setCompras] = useState([]);
  const [proveedores, setProveedores] = useState([]);
  const [productos, setProductos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [detalleOpen, setDetalleOpen] = useState(false);
  const [compraDetalle, setCompraDetalle] = useState(null);
  const [form, setForm] = useState({ proveedor_id: '', fecha: '', items: [{ producto_id: '', cantidad: '', costo_unitario: '', vencimiento: '' }] });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => { fetchAll(); }, []);

  const fetchAll = async () => {
    try {
      setLoading(true);
      const [comp, prov, prod] = await Promise.all([
        comprasApi.getAll(),
        proveedoresApi.getAll(),
        productosApi.getAll()
      ]);
      setCompras(comp.data?.data || []);
      setProveedores(prov.data?.data || []);
      setProductos(prod.data?.data || []);
    } catch (err) {
      console.error('Error:', err);
    } finally {
      setLoading(false);
    }
  };

  const openCreate = () => {
    setForm({ proveedor_id: '', fecha: '', items: [{ producto_id: '', cantidad: '', costo_unitario: '', vencimiento: '' }] });
    setError('');
    setModalOpen(true);
  };

  const addItem = () => {
    setForm({
      ...form,
      items: [...form.items, { producto_id: '', cantidad: '', costo_unitario: '', vencimiento: '' }]
    });
  };

  const removeItem = (idx) => {
    if (form.items.length === 1) return;
    setForm({ ...form, items: form.items.filter((_, i) => i !== idx) });
  };

  const updateItem = (idx, field, value) => {
    const items = [...form.items];
    items[idx][field] = value;
    setForm({ ...form, items });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError('');
    try {
      const data = {
        proveedor_id: Number(form.proveedor_id),
        fecha: form.fecha || null,
        detalles: form.items.map(i => ({
          producto_id: Number(i.producto_id),
          cantidad: Number(i.cantidad),
          costo_unitario: Number(i.costo_unitario),
          vencimiento: i.vencimiento || null
        }))
      };
      await comprasApi.create(data);
      setModalOpen(false);
      alert('Compra registrada exitosamente. Se generaron lotes automáticamente.');
      fetchAll();
    } catch (err) {
      setError(err.response?.data?.message || 'Error al registrar la compra');
    } finally {
      setSaving(false);
    }
  };

  const handleCancelar = async (id) => {
    if (!window.confirm('¿Cancelar esta compra?')) return;
    try { await comprasApi.cancelar(id); fetchAll(); } catch (err) { alert(err.response?.data?.message || 'Error al cancelar'); }
  };

  const viewDetalle = async (id) => {
    try {
      const res = await comprasApi.getById(id);
      setCompraDetalle(res.data?.data);
      setDetalleOpen(true);
    } catch (err) {
      alert('Error al cargar el detalle');
    }
  };

  const filtered = compras.filter(c =>
    (c.proveedor_nombre || '').toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Compras</h1>
          <p className="text-gray-500 mt-1">Registro de compras con generación automática de lotes</p>
        </div>
        <button onClick={openCreate} className="px-4 py-2 bg-primary text-on-accent rounded-lg hover:bg-primary-dark transition-colors flex items-center gap-2"><Plus size={18} /> Nueva Compra</button>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
        <input type="text" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Buscar por proveedor..." className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-gray-200 focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none" />
      </div>

      <SectionGuide
        title="¿Cómo registrar una Compra?"
        steps={[
          'Sirve para registrar la mercancía que llega al almacén y así aumentar el inventario.',
          'Haz clic en "Nueva Compra", elige el proveedor y la fecha.',
          'Agrega cada producto con su cantidad y costo. Si el producto controla vencimiento, pon su fecha de vencimiento.',
          'Al guardar, el sistema genera automáticamente un lote y suma la cantidad al stock del producto.',
        ]}
        tips={[
          'Registra la compra el mismo día que llega la mercancía para que el inventario siempre sea real.',
          'Puedes ver el detalle de cualquier compra (y su lote) con el botón "Ver" y cancelarla si hubo un error.',
        ]}
      />

      <div className="bg-white rounded-xl p-6 card-shadow">
        {loading ? (
          <div className="flex items-center justify-center h-40"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>
        ) : (
          <Table
            headers={['#', 'Proveedor', 'Total', 'Fecha', 'Estado', 'Acciones']}
            data={filtered}
            emptyMessage="No hay compras registradas"
            renderRow={(item) => (
              <tr key={item.id} className="hover:bg-gray-50 transition-colors">
                <td className="px-6 py-4 text-sm font-medium text-gray-900">#{item.id}</td>
                <td className="px-6 py-4 text-sm text-gray-600">{item.proveedor_nombre}</td>
                <td className="px-6 py-4 text-sm font-medium text-gray-900">Bs {Number(item.total).toFixed(2)}</td>
                <td className="px-6 py-4 text-sm text-gray-500">{new Date(item.fecha).toLocaleDateString('es-ES')}</td>
                <td className="px-6 py-4">
                  <span className={`inline-flex px-2 py-1 rounded-full text-xs font-medium ${item.estado === 'REGISTRADA' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>{item.estado}</span>
                </td>
                <td className="px-6 py-4">
                  <div className="flex gap-2">
                    <button onClick={() => viewDetalle(item.id)} className="px-3 py-1 text-xs font-medium text-primary hover:bg-primary/5 rounded-lg transition-colors">Ver</button>
                    {item.estado === 'REGISTRADA' && (
                      <button onClick={() => handleCancelar(item.id)} className="px-3 py-1 text-xs font-medium text-red-500 hover:bg-red-50 rounded-lg transition-colors">Cancelar</button>
                    )}
                  </div>
                </td>
              </tr>
            )}
          />
        )}
      </div>

      {/* Modal Nueva Compra */}
      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title="Registrar Compra" size="xl">
        <form onSubmit={handleSubmit} className="space-y-4">
          {error && <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-sm text-red-600">{error}</div>}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Proveedor *</label>
              <select value={form.proveedor_id} onChange={(e) => setForm({ ...form, proveedor_id: e.target.value })} className="w-full px-3 py-2.5 rounded-lg border border-gray-200 focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none" required>
                <option value="">Seleccionar proveedor</option>
                {proveedores.map(p => <option key={p.id} value={p.id}>{p.nombre}</option>)}
              </select>
              <p className="text-xs text-gray-500 mt-1">Elige quién te vendió la mercancía (debes tenerlo registrado en Proveedores)</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Fecha</label>
              <input type="date" value={form.fecha} onChange={(e) => setForm({ ...form, fecha: e.target.value })} className="w-full px-3 py-2.5 rounded-lg border border-gray-200 focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none" />
              <p className="text-xs text-gray-500 mt-1">Si no eliges fecha, usará la de hoy</p>
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-sm font-medium text-gray-700">Detalle de la compra</label>
              <button type="button" onClick={addItem} className="text-sm text-primary hover:underline font-medium">+ Agregar item</button>
            </div>
            <div className="space-y-3">
              {form.items.map((item, idx) => (
                <div key={idx} className="grid grid-cols-1 sm:grid-cols-12 gap-2 items-end p-3 bg-gray-50 rounded-lg">
                  <div className="sm:col-span-5">
                    <label className="block text-xs font-medium text-gray-500 mb-1">Producto *</label>
                    <select value={item.producto_id} onChange={(e) => updateItem(idx, 'producto_id', e.target.value)} className="w-full px-2.5 py-2 rounded-lg border border-gray-200 focus:border-primary outline-none" required>
                      <option value="">Seleccionar</option>
                      {productos.map(p => <option key={p.id} value={p.id}>{p.nombre} ({p.codigo})</option>)}
                    </select>
                  </div>
                  <div className="sm:col-span-2">
                    <label className="block text-xs font-medium text-gray-500 mb-1">Cant. *</label>
                    <input type="number" step="0.001" value={item.cantidad} onChange={(e) => updateItem(idx, 'cantidad', e.target.value)} className="w-full px-2.5 py-2 rounded-lg border border-gray-200 focus:border-primary outline-none" required min="0" />
                    <p className="text-xs text-gray-400 mt-0.5">Ej: 5</p>
                  </div>
                  <div className="sm:col-span-2">
                    <label className="block text-xs font-medium text-gray-500 mb-1">Costo *</label>
                    <input type="number" step="0.01" value={item.costo_unitario} onChange={(e) => updateItem(idx, 'costo_unitario', e.target.value)} className="w-full px-2.5 py-2 rounded-lg border border-gray-200 focus:border-primary outline-none" required min="0" />
                    <p className="text-xs text-gray-400 mt-0.5">Ej: 25.50 (Bs)</p>
                  </div>
                  <div className="sm:col-span-2">
                    <label className="block text-xs font-medium text-gray-500 mb-1">Venc.</label>
                    <input type="date" value={item.vencimiento} onChange={(e) => updateItem(idx, 'vencimiento', e.target.value)} className="w-full px-2.5 py-2 rounded-lg border border-gray-200 focus:border-primary outline-none" />
                    <p className="text-xs text-gray-400 mt-0.5">Ej: 30/09/2026</p>
                  </div>
                  <div className="sm:col-span-1 flex sm:block items-end justify-end">
                    <button type="button" onClick={() => removeItem(idx)} className="p-2 text-gray-400 hover:text-red-500 rounded-lg"><Trash2 size={16} /></button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-2 border-t border-gray-100">
            <button type="button" onClick={() => setModalOpen(false)} className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors">Cancelar</button>
            <button type="submit" disabled={saving} className="px-4 py-2 bg-primary text-on-accent rounded-lg hover:bg-primary-dark transition-colors disabled:opacity-50 flex items-center gap-2">
              {saving && <Loader2 size={16} className="animate-spin" />}
              Registrar Compra
            </button>
          </div>
        </form>
      </Modal>

      {/* Modal Detalle */}
      <Modal open={detalleOpen} onClose={() => setDetalleOpen(false)} title={`Compra #${compraDetalle?.id || ''}`} size="lg">
        {compraDetalle && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 bg-gray-50 p-4 rounded-lg">
              <div>
                <p className="text-xs text-gray-500">Proveedor</p>
                <p className="font-medium">{compraDetalle.proveedor_nombre}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500">Total</p>
                <p className="font-medium text-primary">Bs {Number(compraDetalle.total).toFixed(2)}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500">Fecha</p>
                <p className="font-medium">{new Date(compraDetalle.fecha).toLocaleString('es-ES')}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500">Estado</p>
                <p className="font-medium">{compraDetalle.estado}</p>
              </div>
            </div>
            <Table
              headers={['Producto', 'Cantidad', 'Costo Unit.', 'Subtotal', 'Lote']}
              data={compraDetalle.detalles || []}
              emptyMessage="Sin detalles"
              renderRow={(item) => (
                <tr key={item.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 text-sm">
                    <div>
                      <p className="font-medium text-gray-900">{item.producto_nombre}</p>
                      <p className="text-xs text-gray-500 font-mono">{item.producto_codigo}</p>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-sm">{formatQuantity(item.cantidad)}</td>
                  <td className="px-4 py-3 text-sm">Bs {Number(item.costo_unitario).toFixed(2)}</td>
                  <td className="px-4 py-3 text-sm font-medium">Bs {Number(item.subtotal).toFixed(2)}</td>
                  <td className="px-4 py-3 text-sm font-mono text-primary">{item.numero_lote || '—'}</td>
                </tr>
              )}
            />
          </div>
        )}
      </Modal>
    </div>
  );
}

export default Compras;
