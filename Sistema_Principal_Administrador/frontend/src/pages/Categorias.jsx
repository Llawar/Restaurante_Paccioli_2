import { useState, useEffect } from 'react';
import {
  Plus,
  Search,
  Loader2,
  Tag,
  Pencil,
  Trash2,
  ChefHat
} from 'lucide-react';
import { categoriasApi } from '../services/categorias.service';
import { puestosApi } from '../services/puestos.service';
import socket from '../services/socket';

const ICON_OPTIONS = [
  { value: 'utensils', label: 'Cubiertos', emoji: '🍴' },
  { value: 'glass-water', label: 'Vaso', emoji: '🥤' },
  { value: 'ice-cream', label: 'Helado', emoji: '🍦' },
  { value: 'wine-glass', label: 'Copa', emoji: '🍷' },
  { value: 'hamburger', label: 'Hamburguesa', emoji: '🍔' },
  { value: 'pizza', label: 'Pizza', emoji: '🍕' },
  { value: 'salad', label: 'Ensalada', emoji: '🥗' },
  { value: 'cake', label: 'Pastel', emoji: '🍰' },
  { value: 'coffee', label: 'Café', emoji: '☕' },
  { value: 'beer', label: 'Cerveza', emoji: '🍺' }
];

const COLOR_OPTIONS = [
  { value: '#FF6B6B', label: 'Rojo' },
  { value: '#4ECDC4', label: 'Turquesa' },
  { value: '#45B7D1', label: 'Azul' },
  { value: '#F7DC6F', label: 'Amarillo' },
  { value: '#BB8FCE', label: 'Lila' },
  { value: '#82E0AA', label: 'Verde' },
  { value: '#F0B27A', label: 'Naranja' },
  { value: '#85C1E9', label: 'Celeste' }
];

const getIconEmoji = (icono) => {
  const icon = (icono || '').toLowerCase();
  const found = ICON_OPTIONS.find(i => i.value === icon);
  return found ? found.emoji : '🏷️';
};

function Categorias() {
  const [categories, setCategories] = useState([]);
  const [puestos, setPuestos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [form, setForm] = useState({
    nombre: '',
    descripcion: '',
    icono: 'utensils',
    color: '#FF6B6B',
    puesto_cocina_id: ''
  });

  useEffect(() => {
    fetchCategories();
    fetchPuestos();

    socket.on('categories:changed', () => {
      fetchCategories();
      fetchPuestos();
    });
    socket.on('puestos:changed', () => {
      fetchPuestos();
    });

    return () => {
      socket.off('categories:changed');
      socket.off('puestos:changed');
    };
  }, []);

  const fetchCategories = async () => {
    try {
      const response = await categoriasApi.getAll();
      setCategories(response.data?.data || []);
    } catch (err) {
      console.error('Error cargando categorías:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchPuestos = async () => {
    try {
      const response = await puestosApi.getAll();
      setPuestos(response.data?.data || []);
    } catch (err) {
      console.error('Error cargando puestos:', err);
    }
  };

  const openCreate = () => {
    setEditing(null);
    setForm({ nombre: '', descripcion: '', icono: 'utensils', color: '#FF6B6B', puesto_cocina_id: '' });
    setError('');
    setModalOpen(true);
  };

  const openEdit = (cat) => {
    setEditing(cat);
    setForm({
      nombre: cat.nombre || '',
      descripcion: cat.descripcion || '',
      icono: cat.icono || 'utensils',
      color: cat.color || '#FF6B6B',
      puesto_cocina_id: cat.puesto_cocina_id != null ? String(cat.puesto_cocina_id) : ''
    });
    setError('');
    setModalOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (!form.nombre.trim()) {
      setError('El nombre de la categoría es requerido.');
      return;
    }
    setIsSubmitting(true);
    try {
      const payload = {
        nombre: form.nombre.trim(),
        descripcion: form.descripcion.trim() || null,
        icono: form.icono || null,
        color: form.color || null,
        puesto_cocina_id: form.puesto_cocina_id ? Number(form.puesto_cocina_id) : null
      };
      if (editing) {
        await categoriasApi.update(editing.id, payload);
      } else {
        await categoriasApi.create(payload);
      }
      setModalOpen(false);
      fetchCategories();
    } catch (err) {
      setError(err.response?.data?.message || 'Error al guardar la categoría.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (cat) => {
    if (!window.confirm(`¿Eliminar la categoría "${cat.nombre}"?`)) return;
    try {
      await categoriasApi.remove(cat.id);
      fetchCategories();
    } catch (err) {
      alert(err.response?.data?.message || 'Error al eliminar la categoría.');
    }
  };

  const filtered = categories.filter(c =>
    c.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (c.descripcion || '').toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Categorías</h1>
          <p className="text-gray-500 mt-1">
            {categories.length} categorías · {puestos.length} puestos de cocina
          </p>
        </div>
        <button
          onClick={openCreate}
          className="inline-flex items-center gap-2 px-4 py-2.5 bg-primary hover:bg-primary-dark text-white font-medium rounded-lg shadow-lg shadow-primary/30 transition-all"
        >
          <Plus size={18} />
          Nueva Categoría
        </button>
      </div>

      {/* Search */}
      <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
          <input
            type="text"
            placeholder="Buscar categoría..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-lg focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all"
          />
        </div>
      </div>

      {/* Grid cards */}
      {filtered.length === 0 ? (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 text-center py-12">
          <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Tag size={32} className="text-gray-400" />
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-1">No se encontraron categorías</h3>
          <p className="text-gray-500">Crea una nueva categoría para agrupar tus productos</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {filtered.map((cat) => (
            <div key={cat.id} className="bg-white rounded-xl shadow-sm border border-gray-100 p-5 hover:shadow-md transition-shadow">
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div
                    className="w-11 h-11 rounded-xl flex items-center justify-center text-xl"
                    style={{ backgroundColor: cat.color || '#f3f4f6' }}
                  >
                    {getIconEmoji(cat.icono)}
                  </div>
                  <div>
                    <p className="font-semibold text-gray-900">{cat.nombre}</p>
                    <p className="text-xs text-gray-400 mt-0.5">
                      {cat.puesto_nombre ? <><ChefHat size={12} className="inline mr-1 -mt-0.5 text-primary" />{cat.puesto_nombre}</> : <span className="text-amber-500">Sin puesto</span>}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-1 flex-shrink-0">
                  <button
                    onClick={() => openEdit(cat)}
                    className="p-2 text-gray-400 hover:text-primary hover:bg-primary/10 rounded-lg transition-colors"
                    title="Editar"
                  >
                    <Pencil size={16} />
                  </button>
                  <button
                    onClick={() => handleDelete(cat)}
                    className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                    title="Eliminar"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
              <p className="text-sm text-gray-500 mt-3 line-clamp-2 min-h-[2.5rem]">
                {cat.descripcion || <span className="text-gray-300">Sin descripción</span>}
              </p>
            </div>
          ))}
        </div>
      )}

      {/* Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setModalOpen(false)} />
          <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-gray-900">
                {editing ? 'Editar Categoría' : 'Nueva Categoría'}
              </h2>
              <button onClick={() => setModalOpen(false)} className="text-gray-400 hover:text-gray-600 text-2xl leading-none">&times;</button>
            </div>

            {error && (
              <div className="mb-4 bg-red-50 text-red-600 text-sm px-4 py-3 rounded-lg">{error}</div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Nombre</label>
                <input
                  type="text"
                  value={form.nombre}
                  onChange={(e) => setForm({ ...form, nombre: e.target.value })}
                  className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all"
                  placeholder="Ej: Entradas"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Descripción</label>
                <textarea
                  value={form.descripcion}
                  onChange={(e) => setForm({ ...form, descripcion: e.target.value })}
                  rows="2"
                  className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all"
                  placeholder="Descripción de la categoría..."
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Icono</label>
                  <select
                    value={form.icono}
                    onChange={(e) => setForm({ ...form, icono: e.target.value })}
                    className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none bg-white"
                  >
                    {ICON_OPTIONS.map(opt => (
                      <option key={opt.value} value={opt.value}>{opt.emoji} {opt.label}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Color</label>
                  <div className="flex flex-wrap gap-2 pt-1">
                    {COLOR_OPTIONS.map(opt => (
                      <button
                        key={opt.value}
                        type="button"
                        title={opt.label}
                        onClick={() => setForm({ ...form, color: opt.value })}
                        className={`w-8 h-8 rounded-lg border-2 transition-all ${form.color === opt.value ? 'scale-110 border-gray-900' : 'border-transparent'}`}
                        style={{ backgroundColor: opt.value }}
                      />
                    ))}
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Puesto de cocina <span className="text-xs text-gray-400">(cómo llega a la cocina)</span>
                </label>
                <select
                  value={form.puesto_cocina_id}
                  onChange={(e) => setForm({ ...form, puesto_cocina_id: e.target.value })}
                  className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none bg-white"
                >
                  <option value="">Sin puesto asignado</option>
                  {puestos.map(p => (
                    <option key={p.id} value={p.id}>{p.nombre}</option>
                  ))}
                </select>
                <p className="text-xs text-gray-400 mt-1">
                  Los productos de esta categoría se enviarán automáticamente a ese puesto.
                </p>
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="flex-1 px-4 py-2.5 border border-gray-200 text-gray-700 font-medium rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="flex-1 px-4 py-2.5 bg-primary text-white font-medium rounded-lg hover:bg-primary-dark transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isSubmitting ? 'Guardando...' : editing ? 'Guardar Cambios' : 'Crear Categoría'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default Categorias;