import { useState, useEffect } from 'react';
import { Plus, Pencil, Trash2, Search, Loader2, Tag } from 'lucide-react';
import Modal from '../components/ui/Modal';
import SectionGuide from '../components/ui/SectionGuide';
import { categoriasApi } from '../services/gastro.service';

function Categorias() {
  const [categorias, setCategorias] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({ nombre: '', codigo: '', descripcion: '' });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchCategorias();
  }, []);

  const fetchCategorias = async () => {
    try {
      setLoading(true);
      const res = await categoriasApi.getAll();
      setCategorias(res.data?.data || []);
    } catch (err) {
      console.error('Error:', err);
    } finally {
      setLoading(false);
    }
  };

  const openCreate = () => {
    setEditing(null);
    setForm({ nombre: '', codigo: '', descripcion: '' });
    setError('');
    setModalOpen(true);
  };

  const openEdit = (cat) => {
    setEditing(cat);
    setForm({ nombre: cat.nombre, codigo: cat.codigo, descripcion: cat.descripcion || '' });
    setError('');
    setModalOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError('');
    try {
      if (editing) {
        await categoriasApi.update(editing.id, form);
      } else {
        await categoriasApi.create(form);
      }
      setModalOpen(false);
      fetchCategorias();
    } catch (err) {
      setError(err.response?.data?.message || 'Error al guardar');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('¿Eliminar esta categoría?')) return;
    try {
      await categoriasApi.remove(id);
      fetchCategorias();
    } catch (err) {
      alert(err.response?.data?.message || 'Error al eliminar');
    }
  };

  const filtered = categorias.filter(c =>
    c.nombre.toLowerCase().includes(search.toLowerCase()) ||
    c.codigo.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Categorías</h1>
          <p className="text-gray-500 mt-1">Clasificación principal del inventario</p>
        </div>
        <button
          onClick={openCreate}
          className="px-4 py-2 bg-primary text-on-accent rounded-lg hover:bg-primary-dark transition-colors flex items-center gap-2"
        >
          <Plus size={18} />
          Nueva Categoría
        </button>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Buscar por nombre o código..."
          className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-gray-200 focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none"
        />
      </div>

      <SectionGuide
        title="¿Qué son las Categorías?"
        steps={[
          'Las categorías son el primer nivel para clasificar todo lo que hay en el almacén, por ejemplo: Ingredientes, Bebidas o Utensilios.',
          'Para crear una, haz clic en "Nueva Categoría", escribe el nombre y un código corto (ej. ING = Ingredientes, BEB = Bebidas).',
          'Elige un código fácil de recordar: con él se arman después los códigos de los productos (ej. ING-CAR-0001).',
        ]}
        tips={[
          'Usa códigos de 3 letras, cortos y claros. Esto hace que el código de cada producto sea fácil de reconocer.',
        ]}
      />

      {loading ? (
        <div className="flex items-center justify-center h-40">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="bg-white rounded-xl p-10 text-center text-gray-500 card-shadow">
          No hay categorías registradas
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filtered.map((cat) => (
            <div key={cat.id} className="bg-white rounded-xl p-6 card-shadow hover-lift">
              <div className="flex items-start justify-between">
                <div className="w-12 h-12 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
                  <Tag size={24} />
                </div>
                <div className="flex gap-2">
                  <button onClick={() => openEdit(cat)} className="p-2 text-gray-400 hover:text-primary hover:bg-primary/5 rounded-lg transition-colors">
                    <Pencil size={16} />
                  </button>
                  <button onClick={() => handleDelete(cat.id)} className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors">
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
              <h3 className="font-semibold text-gray-900 mt-4">{cat.nombre}</h3>
              <p className="text-sm text-primary font-mono mt-1">{cat.codigo}</p>
              {cat.descripcion && <p className="text-sm text-gray-500 mt-2">{cat.descripcion}</p>}
              <div className="mt-3 text-xs text-gray-500">
                {cat.subcategorias_count || 0} subcategoría(s)
              </div>
            </div>
          ))}
        </div>
      )}

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title={editing ? 'Editar Categoría' : 'Nueva Categoría'}>
        <form onSubmit={handleSubmit} className="space-y-4">
          {error && <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-sm text-red-600">{error}</div>}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Nombre *</label>
            <input
              type="text"
              value={form.nombre}
              onChange={(e) => setForm({ ...form, nombre: e.target.value })}
              className="w-full px-3 py-2.5 rounded-lg border border-gray-200 focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none"
              required
            />
            <p className="text-xs text-gray-500 mt-1">Ej: Ingredientes, Bebidas, Utensilios</p>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Código *</label>
            <input
              type="text"
              value={form.codigo}
              onChange={(e) => setForm({ ...form, codigo: e.target.value.toUpperCase() })}
              className="w-full px-3 py-2.5 rounded-lg border border-gray-200 focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none uppercase"
              placeholder="ING, BEB, UTE..."
              required
            />
            <p className="text-xs text-gray-500 mt-1">Ej: ING para Ingredientes, BEB para Bebidas, UTE para Utensilios</p>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Descripción</label>
            <textarea
              value={form.descripcion}
              onChange={(e) => setForm({ ...form, descripcion: e.target.value })}
              className="w-full px-3 py-2.5 rounded-lg border border-gray-200 focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none"
              rows={3}
            />
            <p className="text-xs text-gray-500 mt-1">Ej: Todo lo que se usa para preparar los platos del menú</p>
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <button type="button" onClick={() => setModalOpen(false)} className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors">
              Cancelar
            </button>
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

export default Categorias;
