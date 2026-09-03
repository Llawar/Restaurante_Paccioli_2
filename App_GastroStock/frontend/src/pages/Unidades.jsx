import { useState, useEffect } from 'react';
import { Plus, Pencil, Trash2, Loader2, Ruler } from 'lucide-react';
import Modal from '../components/ui/Modal';
import SectionGuide from '../components/ui/SectionGuide';
import { unidadesApi } from '../services/gastro.service';

function Unidades() {
  const [unidades, setUnidades] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({ nombre: '', abreviatura: '' });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => { fetchUnidades(); }, []);

  const fetchUnidades = async () => {
    try {
      setLoading(true);
      const res = await unidadesApi.getAll();
      setUnidades(res.data?.data || []);
    } catch (err) {
      console.error('Error:', err);
    } finally {
      setLoading(false);
    }
  };

  const openCreate = () => { setEditing(null); setForm({ nombre: '', abreviatura: '' }); setError(''); setModalOpen(true); };
  const openEdit = (u) => { setEditing(u); setForm({ nombre: u.nombre, abreviatura: u.abreviatura }); setError(''); setModalOpen(true); };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError('');
    try {
      if (editing) await unidadesApi.update(editing.id, form);
      else await unidadesApi.create(form);
      setModalOpen(false);
      fetchUnidades();
    } catch (err) {
      setError(err.response?.data?.message || 'Error al guardar');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('¿Eliminar esta unidad?')) return;
    try { await unidadesApi.remove(id); fetchUnidades(); } catch (err) { alert(err.response?.data?.message || 'Error al eliminar'); }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Unidades de Medida</h1>
          <p className="text-gray-500 mt-1">Kg, Litro, Unidad, Caja...</p>
        </div>
        <button onClick={openCreate} className="px-4 py-2 bg-primary text-on-accent rounded-lg hover:bg-primary-dark transition-colors flex items-center gap-2"><Plus size={18} /> Nueva Unidad</button>
      </div>

      <SectionGuide
        title="¿Qué son las Unidades de Medida?"
        steps={[
          'Indican cómo se mide cada producto: por Kilogramo (Kg), Litro (L), Unidad (U), Caja, etc.',
          'Para crear una, haz clic en "Nueva Unidad", escribe el nombre (Ej. Kilogramo) y su abreviatura (Ej. Kg).',
          'Luego, al crear un producto, podrás elegir su unidad de medida para saber si el stock es en kilos, litros o unidades.',
        ]}
        tips={[
          'Sé consistente: usa siempre la misma unidad para un mismo producto (por ejemplo, siempre Kg, no mezclar con gramos).',
        ]}
      />

      {loading ? (
        <div className="flex items-center justify-center h-40"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>
      ) : unidades.length === 0 ? (
        <div className="bg-white rounded-xl p-10 text-center text-gray-500 card-shadow">No hay unidades registradas</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {unidades.map((u) => (
            <div key={u.id} className="bg-white rounded-xl p-6 card-shadow hover-lift">
              <div className="flex items-start justify-between">
                <div className="w-12 h-12 rounded-xl bg-primary/10 text-primary flex items-center justify-center"><Ruler size={24} /></div>
                <div className="flex gap-2">
                  <button onClick={() => openEdit(u)} className="p-2 text-gray-400 hover:text-primary hover:bg-primary/5 rounded-lg transition-colors"><Pencil size={16} /></button>
                  <button onClick={() => handleDelete(u.id)} className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"><Trash2 size={16} /></button>
                </div>
              </div>
              <h3 className="font-semibold text-gray-900 mt-4">{u.nombre}</h3>
              <p className="text-sm text-primary font-mono mt-1">{u.abreviatura}</p>
            </div>
          ))}
        </div>
      )}

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title={editing ? 'Editar Unidad' : 'Nueva Unidad'}>
        <form onSubmit={handleSubmit} className="space-y-4">
          {error && <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-sm text-red-600">{error}</div>}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Nombre *</label>
            <input type="text" value={form.nombre} onChange={(e) => setForm({ ...form, nombre: e.target.value })} className="w-full px-3 py-2.5 rounded-lg border border-gray-200 focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none" required />
            <p className="text-xs text-gray-500 mt-1">Ej: Kilogramo, Litro, Unidad, Caja, Paquete</p>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Abreviatura *</label>
            <input type="text" value={form.abreviatura} onChange={(e) => setForm({ ...form, abreviatura: e.target.value })} className="w-full px-3 py-2.5 rounded-lg border border-gray-200 focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none" placeholder="Kg, L, U, Caja" required />
            <p className="text-xs text-gray-500 mt-1">Ej: Kg para Kilogramo, L para Litro, U para Unidad</p>
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

export default Unidades;
