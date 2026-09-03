import { useState, useEffect } from 'react';
import { Plus, Pencil, Trash2, Search, Loader2, Truck } from 'lucide-react';
import Modal from '../components/ui/Modal';
import SectionGuide from '../components/ui/SectionGuide';
import { proveedoresApi } from '../services/gastro.service';

function Proveedores() {
  const [proveedores, setProveedores] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({ nombre: '', nit: '', telefono: '', correo: '', direccion: '', contacto: '' });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => { fetchProveedores(); }, []);

  const fetchProveedores = async () => {
    try {
      setLoading(true);
      const res = await proveedoresApi.getAll();
      setProveedores(res.data?.data || []);
    } catch (err) {
      console.error('Error:', err);
    } finally {
      setLoading(false);
    }
  };

  const openCreate = () => { setEditing(null); setForm({ nombre: '', nit: '', telefono: '', correo: '', direccion: '', contacto: '' }); setError(''); setModalOpen(true); };
  const openEdit = (p) => { setEditing(p); setForm({ nombre: p.nombre, nit: p.nit || '', telefono: p.telefono || '', correo: p.correo || '', direccion: p.direccion || '', contacto: p.contacto || '' }); setError(''); setModalOpen(true); };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError('');
    try {
      if (editing) await proveedoresApi.update(editing.id, form);
      else await proveedoresApi.create(form);
      setModalOpen(false);
      fetchProveedores();
    } catch (err) {
      setError(err.response?.data?.message || 'Error al guardar');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('¿Eliminar este proveedor?')) return;
    try { await proveedoresApi.remove(id); fetchProveedores(); } catch (err) { alert(err.response?.data?.message || 'Error al eliminar'); }
  };

  const filtered = proveedores.filter(p => p.nombre.toLowerCase().includes(search.toLowerCase()));

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Proveedores</h1>
          <p className="text-gray-500 mt-1">Proveedores de insumos del restaurante</p>
        </div>
        <button onClick={openCreate} className="px-4 py-2 bg-primary text-on-accent rounded-lg hover:bg-primary-dark transition-colors flex items-center gap-2"><Plus size={18} /> Nuevo Proveedor</button>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
        <input type="text" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Buscar proveedor..." className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-gray-200 focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none" />
      </div>

      <SectionGuide
        title="¿Qué son los Proveedores?"
        steps={[
          'Son las empresas o personas a quienes el restaurante le compra insumos.',
          'Para registrar uno, haz clic en "Nuevo Proveedor" y llena nombre, teléfono, correo y, si quieres, el NIT y la persona de contacto.',
          'Una vez registrado, lo podrás elegir al momento de hacer una compra, lo que agiliza todo el proceso.',
        ]}
        tips={[
          'Ten los proveedores cargados antes de registrar compras con ellos, para que el formulario de compra sea más rápido.',
        ]}
      />

      {loading ? (
        <div className="flex items-center justify-center h-40"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>
      ) : filtered.length === 0 ? (
        <div className="bg-white rounded-xl p-10 text-center text-gray-500 card-shadow">No hay proveedores registrados</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filtered.map((p) => (
            <div key={p.id} className="bg-white rounded-xl p-6 card-shadow hover-lift">
              <div className="flex items-start justify-between">
                <div className="w-12 h-12 rounded-xl bg-primary/10 text-primary flex items-center justify-center"><Truck size={24} /></div>
                <div className="flex gap-2">
                  <button onClick={() => openEdit(p)} className="p-2 text-gray-400 hover:text-primary hover:bg-primary/5 rounded-lg transition-colors"><Pencil size={16} /></button>
                  <button onClick={() => handleDelete(p.id)} className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"><Trash2 size={16} /></button>
                </div>
              </div>
              <h3 className="font-semibold text-gray-900 mt-4">{p.nombre}</h3>
              <div className="mt-3 space-y-1 text-sm text-gray-600">
                {p.nit && <p><span className="text-gray-400">NIT:</span> {p.nit}</p>}
                {p.telefono && <p><span className="text-gray-400">Tel:</span> {p.telefono}</p>}
                {p.correo && <p><span className="text-gray-400">Email:</span> {p.correo}</p>}
                {p.contacto && <p><span className="text-gray-400">Contacto:</span> {p.contacto}</p>}
              </div>
            </div>
          ))}
        </div>
      )}

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title={editing ? 'Editar Proveedor' : 'Nuevo Proveedor'}>
        <form onSubmit={handleSubmit} className="space-y-4">
          {error && <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-sm text-red-600">{error}</div>}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Nombre *</label>
            <input type="text" value={form.nombre} onChange={(e) => setForm({ ...form, nombre: e.target.value })} className="w-full px-3 py-2.5 rounded-lg border border-gray-200 focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none" required />
            <p className="text-xs text-gray-500 mt-1">Ej: Distribuidora El Valle SRL, Mercado Central Ltda.</p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">NIT</label>
              <input type="text" value={form.nit} onChange={(e) => setForm({ ...form, nit: e.target.value })} className="w-full px-3 py-2.5 rounded-lg border border-gray-200 focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none" />
              <p className="text-xs text-gray-500 mt-1">Ej: 1023456789</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Teléfono</label>
              <input type="text" value={form.telefono} onChange={(e) => setForm({ ...form, telefono: e.target.value })} className="w-full px-3 py-2.5 rounded-lg border border-gray-200 focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none" />
              <p className="text-xs text-gray-500 mt-1">Ej: 76543210</p>
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Correo</label>
            <input type="email" value={form.correo} onChange={(e) => setForm({ ...form, correo: e.target.value })} className="w-full px-3 py-2.5 rounded-lg border border-gray-200 focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none" />
            <p className="text-xs text-gray-500 mt-1">Ej: ventas@distribuidoradelvalle.com</p>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Dirección</label>
            <input type="text" value={form.direccion} onChange={(e) => setForm({ ...form, direccion: e.target.value })} className="w-full px-3 py-2.5 rounded-lg border border-gray-200 focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none" />
            <p className="text-xs text-gray-500 mt-1">Ej: Av. 6 de Agosto #123, zona Central</p>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Persona de contacto</label>
            <input type="text" value={form.contacto} onChange={(e) => setForm({ ...form, contacto: e.target.value })} className="w-full px-3 py-2.5 rounded-lg border border-gray-200 focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none" />
            <p className="text-xs text-gray-500 mt-1">Ej: María López (encargada de ventas)</p>
          </div>
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

export default Proveedores;
