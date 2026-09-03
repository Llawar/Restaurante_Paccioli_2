import { useState, useEffect } from 'react';
import { Plus, Pencil, Trash2, Search, Loader2, Layers } from 'lucide-react';
import Modal from '../components/ui/Modal';
import SectionGuide from '../components/ui/SectionGuide';
import { subcategoriasApi, categoriasApi } from '../services/gastro.service';

function Subcategorias() {
  const [subcategorias, setSubcategorias] = useState([]);
  const [categorias, setCategorias] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({ categoria_id: '', nombre: '', codigo: '' });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    Promise.all([fetchSubcategorias(), fetchCategorias()]);
  }, []);

  const fetchSubcategorias = async () => {
    try {
      const res = await subcategoriasApi.getAll();
      setSubcategorias(res.data?.data || []);
    } catch (err) {
      console.error('Error:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchCategorias = async () => {
    try {
      const res = await categoriasApi.getAll();
      setCategorias(res.data?.data || []);
    } catch (err) {
      console.error('Error:', err);
    }
  };

  const openCreate = () => {
    setEditing(null);
    setForm({ categoria_id: '', nombre: '', codigo: '' });
    setError('');
    setModalOpen(true);
  };

  const openEdit = (sub) => {
    setEditing(sub);
    setForm({ categoria_id: String(sub.categoria_id), nombre: sub.nombre, codigo: sub.codigo });
    setError('');
    setModalOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError('');
    try {
      const data = { ...form, categoria_id: Number(form.categoria_id) };
      if (editing) {
        await subcategoriasApi.update(editing.id, data);
      } else {
        await subcategoriasApi.create(data);
      }
      setModalOpen(false);
      fetchSubcategorias();
    } catch (err) {
      setError(err.response?.data?.message || 'Error al guardar');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('¿Eliminar esta subcategoría?')) return;
    try {
      await subcategoriasApi.remove(id);
      fetchSubcategorias();
    } catch (err) {
      alert(err.response?.data?.message || 'Error al eliminar');
    }
  };

  const filtered = subcategorias.filter(s =>
    s.nombre.toLowerCase().includes(search.toLowerCase()) ||
    s.codigo.toLowerCase().includes(search.toLowerCase()) ||
    (s.categoria_nombre || '').toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Subcategorías</h1>
          <p className="text-gray-500 mt-1">Subdivisiones dentro de cada categoría</p>
        </div>
        <button onClick={openCreate} className="px-4 py-2 bg-primary text-on-accent rounded-lg hover:bg-primary-dark transition-colors flex items-center gap-2">
          <Plus size={18} />
          Nueva Subcategoría
        </button>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Buscar..."
          className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-gray-200 focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none"
        />
      </div>

      <SectionGuide
        title="¿Qué son las Subcategorías?"
        steps={[
          'Son la división dentro de una categoría. Por ejemplo, dentro de Ingredientes puedes tener Carnes (CAR), Lácteos (LAC) o Verduras (VER).',
          'Para crear una, haz clic en "Nueva Subcategoría", elige a qué categoría pertenece y asigna un código corto.',
          'Primero deben existir las categorías, porque cada subcategoría se coloca dentro de una de ellas.',
        ]}
        tips={[
          'El código de la subcategoría forma parte del código del producto (ej. ING-CAR-0001: ING es la categoría, CAR la subcategoría).',
        ]}
      />

      {loading ? (
        <div className="flex items-center justify-center h-40">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="bg-white rounded-xl p-10 text-center text-gray-500 card-shadow">No hay subcategorías registradas</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filtered.map((sub) => (
            <div key={sub.id} className="bg-white rounded-xl p-6 card-shadow hover-lift">
              <div className="flex items-start justify-between">
                <div className="w-12 h-12 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
                  <Layers size={24} />
                </div>
                <div className="flex gap-2">
                  <button onClick={() => openEdit(sub)} className="p-2 text-gray-400 hover:text-primary hover:bg-primary/5 rounded-lg transition-colors"><Pencil size={16} /></button>
                  <button onClick={() => handleDelete(sub.id)} className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"><Trash2 size={16} /></button>
                </div>
              </div>
              <h3 className="font-semibold text-gray-900 mt-4">{sub.nombre}</h3>
              <p className="text-sm text-primary font-mono mt-1">{sub.codigo}</p>
              <span className="inline-block mt-2 px-2 py-1 bg-gray-100 text-gray-600 rounded-lg text-xs">{sub.categoria_nombre}</span>
            </div>
          ))}
        </div>
      )}

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title={editing ? 'Editar Subcategoría' : 'Nueva Subcategoría'}>
        <form onSubmit={handleSubmit} className="space-y-4">
          {error && <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-sm text-red-600">{error}</div>}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Categoría *</label>
            <select
              value={form.categoria_id}
              onChange={(e) => setForm({ ...form, categoria_id: e.target.value })}
              className="w-full px-3 py-2.5 rounded-lg border border-gray-200 focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none"
              required
            >
              <option value="">Seleccionar categoría</option>
              {categorias.map(cat => <option key={cat.id} value={cat.id}>{cat.nombre} ({cat.codigo})</option>)}
            </select>
            <p className="text-xs text-gray-500 mt-1">Elige a qué categoría pertenece esta subcategoría</p>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Nombre *</label>
            <input type="text" value={form.nombre} onChange={(e) => setForm({ ...form, nombre: e.target.value })} className="w-full px-3 py-2.5 rounded-lg border border-gray-200 focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none" required />
            <p className="text-xs text-gray-500 mt-1">Ej: Carnes, Lácteos, Verduras, Legumbres</p>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Código *</label>
            <input type="text" value={form.codigo} onChange={(e) => setForm({ ...form, codigo: e.target.value.toUpperCase() })} className="w-full px-3 py-2.5 rounded-lg border border-gray-200 focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none uppercase" placeholder="CAR, LAC..." required />
            <p className="text-xs text-gray-500 mt-1">Ej: CAR para Carnes, LAC para Lácteos, VER para Verduras</p>
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

export default Subcategorias;
