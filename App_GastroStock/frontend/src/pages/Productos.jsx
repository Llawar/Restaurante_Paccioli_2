import { useState, useEffect } from 'react';
import { Plus, Pencil, Trash2, Search, Loader2, Package } from 'lucide-react';
import Modal from '../components/ui/Modal';
import SectionGuide from '../components/ui/SectionGuide';
import { productosApi, subcategoriasApi, unidadesApi } from '../services/gastro.service';
import { formatQuantity } from '../utils/format';

function Productos() {
  const [productos, setProductos] = useState([]);
  const [subcategorias, setSubcategorias] = useState([]);
  const [unidades, setUnidades] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({ nombre: '', subcategoria_id: '', unidad_id: '', controla_vencimiento: false, stock_minimo: 0 });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => { fetchAll(); }, []);

  const fetchAll = async () => {
    try {
      setLoading(true);
      const [prod, sub, uni] = await Promise.all([
        productosApi.getAll(),
        subcategoriasApi.getAll(),
        unidadesApi.getAll()
      ]);
      setProductos(prod.data?.data || []);
      setSubcategorias(sub.data?.data || []);
      setUnidades(uni.data?.data || []);
    } catch (err) {
      console.error('Error:', err);
    } finally {
      setLoading(false);
    }
  };

  const openCreate = () => { setEditing(null); setForm({ nombre: '', subcategoria_id: '', unidad_id: '', controla_vencimiento: false, stock_minimo: 0 }); setError(''); setModalOpen(true); };
  const openEdit = (p) => { setEditing(p); setForm({ nombre: p.nombre, subcategoria_id: String(p.subcategoria_id || ''), unidad_id: String(p.unidad_id || ''), controla_vencimiento: !!p.controla_vencimiento, stock_minimo: p.stock_minimo || 0 }); setError(''); setModalOpen(true); };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError('');
    try {
      const data = {
        ...form,
        subcategoria_id: Number(form.subcategoria_id),
        unidad_id: form.unidad_id ? Number(form.unidad_id) : null,
        stock_minimo: Number(form.stock_minimo)
      };
      if (editing) await productosApi.update(editing.id, data);
      else await productosApi.create(data);
      setModalOpen(false);
      fetchAll();
    } catch (err) {
      setError(err.response?.data?.message || 'Error al guardar');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('¿Eliminar este producto?')) return;
    try { await productosApi.remove(id); fetchAll(); } catch (err) { alert(err.response?.data?.message || 'Error al eliminar'); }
  };

  const filtered = productos.filter(p =>
    p.nombre.toLowerCase().includes(search.toLowerCase()) ||
    p.codigo.toLowerCase().includes(search.toLowerCase())
  );

  const getStockColor = (p) => {
    if (p.stock_actual <= 0) return 'bg-red-100 text-red-700';
    if (p.stock_actual <= p.stock_minimo) return 'bg-yellow-100 text-yellow-700';
    return 'bg-green-100 text-green-700';
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Productos</h1>
          <p className="text-gray-500 mt-1">Artículos del almacén con código automático</p>
        </div>
        <button onClick={openCreate} className="px-4 py-2 bg-primary text-on-accent rounded-lg hover:bg-primary-dark transition-colors flex items-center gap-2"><Plus size={18} /> Nuevo Producto</button>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
        <input type="text" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Buscar por nombre o código..." className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-gray-200 focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none" />
      </div>

      <SectionGuide
        title="¿Qué son los Productos?"
        steps={[
          'Son los artículos concretos del almacén (Ej. Carne de res, Leche entera, Papel film).',
          'Para crear uno, haz clic en "Nuevo Producto". El código se genera solo según su subcategoría (ej. ING-CAR-0001), así que solo elige la subcategoría correcta.',
          'Selecciona su unidad de medida (Kg, L, Unidad) y define un stock mínimo: el nivel al que quieres recibir una alerta.',
          'Marca "Controla fecha de vencimiento" si el producto se puede echar a perder, para llevar un mejor control.',
        ]}
        tips={[
          'Define un stock mínimo razonable, así el sistema te avisa antes de que se acabe y nunca te quedas sin insumos.',
          'Si un producto tiene vencimiento (lácteos, carnes), siempre actívalo para controlar sus fechas.',
        ]}
      />

      {loading ? (
        <div className="flex items-center justify-center h-40"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>
      ) : filtered.length === 0 ? (
        <div className="bg-white rounded-xl p-10 text-center text-gray-500 card-shadow">No hay productos registrados</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filtered.map((p) => (
            <div key={p.id} className="bg-white rounded-xl p-6 card-shadow hover-lift">
              <div className="flex items-start justify-between">
                <div className="w-12 h-12 rounded-xl bg-primary/10 text-primary flex items-center justify-center"><Package size={24} /></div>
                <div className="flex gap-2">
                  <button onClick={() => openEdit(p)} className="p-2 text-gray-400 hover:text-primary hover:bg-primary/5 rounded-lg transition-colors"><Pencil size={16} /></button>
                  <button onClick={() => handleDelete(p.id)} className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"><Trash2 size={16} /></button>
                </div>
              </div>
              <h3 className="font-semibold text-gray-900 mt-4">{p.nombre}</h3>
              <p className="text-sm text-primary font-mono mt-1">{p.codigo}</p>
              <div className="mt-3 flex items-center justify-between">
                <span className="text-xs text-gray-500">{p.categoria_nombre ? `${p.categoria_nombre} / ${p.subcategoria_nombre || ''}` : p.subcategoria_nombre || '—'}</span>
                <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStockColor(p)}`}>
                  {formatQuantity(p.stock_actual)} {p.unidad_abreviatura || ''}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title={editing ? 'Editar Producto' : 'Nuevo Producto'}>
        <form onSubmit={handleSubmit} className="space-y-4">
          {error && <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-sm text-red-600">{error}</div>}
          {!editing && (
            <div className="bg-primary/5 border border-primary/20 rounded-lg p-3 text-sm text-primary">
              El código se generará automáticamente: <b>CAT-SUB-0001</b> según la subcategoría elegida.
            </div>
          )}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Nombre *</label>
            <input type="text" value={form.nombre} onChange={(e) => setForm({ ...form, nombre: e.target.value })} className="w-full px-3 py-2.5 rounded-lg border border-gray-200 focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none" required />
            <p className="text-xs text-gray-500 mt-1">Ej: Carne de res molida, Leche entera 1L, Papel film</p>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Subcategoría *</label>
            <select
              value={form.subcategoria_id}
              onChange={(e) => setForm({ ...form, subcategoria_id: e.target.value })}
              className="w-full px-3 py-2.5 rounded-lg border border-gray-200 focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none"
              required
              disabled={!!editing}
            >
              <option value="">Seleccionar subcategoría</option>
              {subcategorias.map(sub => <option key={sub.id} value={sub.id}>{sub.categoria_nombre} / {sub.nombre} ({sub.codigo})</option>)}
            </select>
            <p className="text-xs text-gray-500 mt-1">Define el código automático del producto (ej. ING-CAR-0001)</p>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Unidad de medida</label>
            <select value={form.unidad_id} onChange={(e) => setForm({ ...form, unidad_id: e.target.value })} className="w-full px-3 py-2.5 rounded-lg border border-gray-200 focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none">
              <option value="">Seleccionar unidad</option>
              {unidades.map(u => <option key={u.id} value={u.id}>{u.nombre} ({u.abreviatura})</option>)}
            </select>
            <p className="text-xs text-gray-500 mt-1">Ej: Kilogramo (Kg), Litro (L), Unidad (U)</p>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Stock mínimo</label>
            <input type="number" value={form.stock_minimo} onChange={(e) => setForm({ ...form, stock_minimo: e.target.value })} className="w-full px-3 py-2.5 rounded-lg border border-gray-200 focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none" min="0" step="0.001" />
            <p className="text-xs text-gray-500 mt-1">Ej: 10 (si baja de 10, el sistema te avisará). Se usa para la alerta de stock.</p>
          </div>
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={form.controla_vencimiento}
              onChange={(e) => setForm({ ...form, controla_vencimiento: e.target.checked })}
              className="rounded border-gray-300 text-primary focus:ring-primary"
            />
            <span className="text-sm text-gray-700">Controla fecha de vencimiento</span>
          </label>
          <p className="text-xs text-gray-500 -mt-2">Actívalo para productos que se echan a perder: lácteos, carnes, quesos, jugos</p>
          <div className="flex justify-end gap-3 pt-2">
            <button type="button" onClick={() => setModalOpen(false)} className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors">Cancelar</button>
            <button type="submit" disabled={saving} className="px-4 py-2 bg-primary text-on-accent rounded-lg hover:bg-primary-dark transition-colors disabled:opacity-50 flex items-center gap-2">
              {saving && <Loader2 size={16} className="animate-spin" />}
              {editing ? 'Actualizar' : 'Crear'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}

export default Productos;
