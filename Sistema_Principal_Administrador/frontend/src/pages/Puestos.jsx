import { useState, useEffect } from 'react';
import {
  Plus,
  Search,
  Loader2,
  ChefHat,
  Pencil,
  Trash2,
  Layers
} from 'lucide-react';
import { puestosApi } from '../services/puestos.service';
import socket from '../services/socket';

function KpiCard({ icon: Icon, number, title, color }) {
  const colorClasses = {
    blue: 'bg-blue-100 text-blue-600',
    green: 'bg-green-100 text-green-600',
    purple: 'bg-purple-100 text-purple-600'
  };

  return (
    <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100 flex items-center gap-4">
      <div className={`w-12 h-12 rounded-full ${colorClasses[color]} flex items-center justify-center`}>
        <Icon size={22} />
      </div>
      <div>
        <p className="text-2xl font-bold text-gray-900">{number}</p>
        <p className="text-sm text-gray-500">{title}</p>
      </div>
    </div>
  );
}

function Puestos() {
  const [puestos, setPuestos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [form, setForm] = useState({ nombre: '', descripcion: '' });

  useEffect(() => {
    fetchPuestos();

    socket.on('puestos:changed', () => {
      fetchPuestos();
    });

    return () => {
      socket.off('puestos:changed');
    };
  }, []);

  const fetchPuestos = async () => {
    try {
      const response = await puestosApi.getAll();
      const data = (response.data?.data || []).map(p => ({
        ...p,
        categorias_lista: p.categorias_asignadas ? p.categorias_asignadas.split(',') : []
      }));
      setPuestos(data);
    } catch (err) {
      console.error('Error cargando puestos:', err);
    } finally {
      setLoading(false);
    }
  };

  const openCreate = () => {
    setEditing(null);
    setForm({ nombre: '', descripcion: '' });
    setError('');
    setModalOpen(true);
  };

  const openEdit = (p) => {
    setEditing(p);
    setForm({ nombre: p.nombre || '', descripcion: p.descripcion || '' });
    setError('');
    setModalOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (!form.nombre.trim()) {
      setError('El nombre del puesto es requerido.');
      return;
    }
    setIsSubmitting(true);
    try {
      const payload = {
        nombre: form.nombre.trim(),
        descripcion: form.descripcion.trim() || null
      };
      if (editing) {
        await puestosApi.update(editing.id, payload);
      } else {
        await puestosApi.create(payload);
      }
      setModalOpen(false);
      fetchPuestos();
    } catch (err) {
      setError(err.response?.data?.message || 'Error al guardar el puesto.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (p) => {
    if (!window.confirm(`¿Eliminar el puesto "${p.nombre}"?`)) return;
    try {
      await puestosApi.remove(p.id);
      fetchPuestos();
    } catch (err) {
      alert(err.response?.data?.message || 'Error al eliminar el puesto.');
    }
  };

  const filtered = puestos.filter(p =>
    p.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (p.descripcion || '').toLowerCase().includes(searchTerm.toLowerCase())
  );

  const withCategorias = puestos.filter(p => p.categorias_lista.length > 0).length;

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
          <h1 className="text-2xl font-bold text-gray-900">Puestos de Cocina</h1>
          <p className="text-gray-500 mt-1">
            Organiza la cocina por puestos y asigna las categorías desde Categorías
          </p>
        </div>
        <button
          onClick={openCreate}
          className="inline-flex items-center gap-2 px-4 py-2.5 bg-primary hover:bg-primary-dark text-white font-medium rounded-lg shadow-lg shadow-primary/30 transition-all"
        >
          <Plus size={18} />
          Nuevo Puesto
        </button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <KpiCard icon={ChefHat} color="purple" number={puestos.length} title="Total puestos" />
        <KpiCard icon={Layers} color="blue" number={withCategorias} title="Puestos con categorías" />
      </div>

      {/* Search */}
      <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
          <input
            type="text"
            placeholder="Buscar puesto..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-lg focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all"
          />
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="text-left px-6 py-4 text-xs font-semibold text-gray-600 uppercase tracking-wider">Puesto</th>
                <th className="text-left px-6 py-4 text-xs font-semibold text-gray-600 uppercase tracking-wider">Categorías asociadas</th>
                <th className="text-center px-6 py-4 text-xs font-semibold text-gray-600 uppercase tracking-wider">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filtered.map((p) => (
                <tr key={p.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-gradient-to-br from-primary/20 to-primary/5 rounded-xl flex items-center justify-center">
                        <ChefHat size={18} className="text-primary" />
                      </div>
                      <div>
                        <p className="font-medium text-gray-900">{p.nombre}</p>
                        {p.descripcion && <p className="text-sm text-gray-500">{p.descripcion}</p>}
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    {p.categorias_lista.length > 0 ? (
                      <div className="flex flex-wrap gap-1.5 max-w-md">
                        {p.categorias_lista.map((cat, idx) => (
                          <span key={idx} className="inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-medium bg-blue-50 text-blue-700">
                            {cat}
                          </span>
                        ))}
                      </div>
                    ) : (
                      <span className="text-gray-300">Sin categorías</span>
                    )}
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center justify-center gap-2">
                      <button
                        onClick={() => openEdit(p)}
                        className="p-2 text-gray-400 hover:text-primary hover:bg-primary/10 rounded-lg transition-colors"
                        title="Editar"
                      >
                        <Pencil size={16} />
                      </button>
                      <button
                        onClick={() => handleDelete(p)}
                        className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                        title="Eliminar"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {filtered.length === 0 && (
          <div className="text-center py-12">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <ChefHat size={32} className="text-gray-400" />
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-1">No se encontraron puestos</h3>
            <p className="text-gray-500">Crea un nuevo puesto de cocina</p>
          </div>
        )}
      </div>

      {/* Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setModalOpen(false)} />
          <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-gray-900">
                {editing ? 'Editar Puesto' : 'Nuevo Puesto'}
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
                  placeholder="Ej: Puesto 7 - Ensaladas"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Descripción</label>
                <textarea
                  value={form.descripcion}
                  onChange={(e) => setForm({ ...form, descripcion: e.target.value })}
                  rows="2"
                  className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all"
                  placeholder="Qué prepara este puesto..."
                />
              </div>

              {editing && editing.categorias_lista?.length > 0 && (
                <div className="bg-blue-50 rounded-lg p-3">
                  <p className="text-xs font-medium text-blue-700 mb-2">
                    Categorías que prepara este puesto
                  </p>
                  <div className="flex flex-wrap gap-1.5">
                    {editing.categorias_lista.map((cat, idx) => (
                      <span key={idx} className="inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-medium bg-white text-blue-700 border border-blue-100">
                        {cat}
                      </span>
                    ))}
                  </div>
                  <p className="text-xs text-blue-500 mt-2">
                    Para cambiar qué categorías llegan aquí, edítalas en la página de Categorías.
                  </p>
                </div>
              )}

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
                  {isSubmitting ? 'Guardando...' : editing ? 'Guardar Cambios' : 'Crear Puesto'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default Puestos;