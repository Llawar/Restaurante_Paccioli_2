import { useState, useEffect } from 'react';
import { Plus, Pencil, Trash2, Loader2, MapPin } from 'lucide-react';
import Modal from '../components/ui/Modal';
import SectionGuide from '../components/ui/SectionGuide';
import { ubicacionesApi } from '../services/gastro.service';

const tipoColores = {
  'ESTANTERIA': 'bg-blue-100 text-blue-700',
  'REFRIGERADOR': 'bg-cyan-100 text-cyan-700',
  'CONGELADOR': 'bg-indigo-100 text-indigo-700',
};

function Ubicaciones() {
  const [ubicaciones, setUbicaciones] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({ nombre: '', tipo: 'ESTANTERIA' });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => { fetchUbicaciones(); }, []);

  const fetchUbicaciones = async () => {
    try {
      setLoading(true);
      const res = await ubicacionesApi.getAll();
      setUbicaciones(res.data?.data || []);
    } catch (err) {
      console.error('Error:', err);
    } finally {
      setLoading(false);
    }
  };

  const openCreate = () => { setEditing(null); setForm({ nombre: '', tipo: 'ESTANTERIA' }); setError(''); setModalOpen(true); };
  const openEdit = (u) => { setEditing(u); setForm({ nombre: u.nombre, tipo: u.tipo }); setError(''); setModalOpen(true); };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError('');
    try {
      if (editing) await ubicacionesApi.update(editing.id, form);
      else await ubicacionesApi.create(form);
      setModalOpen(false);
      fetchUbicaciones();
    } catch (err) {
      setError(err.response?.data?.message || 'Error al guardar');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('¿Eliminar esta ubicación?')) return;
    try { await ubicacionesApi.remove(id); fetchUbicaciones(); } catch (err) { alert(err.response?.data?.message || 'Error al eliminar'); }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Ubicaciones</h1>
          <p className="text-gray-500 mt-1">Estanterías, refrigeradores y congeladores del almacén</p>
        </div>
        <button onClick={openCreate} className="px-4 py-2 bg-primary text-on-accent rounded-lg hover:bg-primary-dark transition-colors flex items-center gap-2"><Plus size={18} /> Nueva Ubicación</button>
      </div>

      <SectionGuide
        title="¿Qué son las Ubicaciones?"
        steps={[
          'Son los lugares físicos donde se guarda la mercancía: estanterías (A-01), refrigeradores (REF-02) o congeladores (CON-01).',
          'Para registrar una, haz clic en "Nueva Ubicación", escribe un nombre o código fácil de identificar y elige su tipo.',
          'Tener ubicaciones bien nombradas ayuda a encontrar rápido cada producto en el almacén.',
        ]}
        tips={[
          'Usa códigos como A-01 (estantería A, nivel 1) o REF-02. Así cualquier empleado encuentra la mercancía de inmediato.',
        ]}
      />

      {loading ? (
        <div className="flex items-center justify-center h-40"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>
      ) : ubicaciones.length === 0 ? (
        <div className="bg-white rounded-xl p-10 text-center text-gray-500 card-shadow">No hay ubicaciones registradas</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {ubicaciones.map((u) => (
            <div key={u.id} className="bg-white rounded-xl p-6 card-shadow hover-lift">
              <div className="flex items-start justify-between">
                <div className="w-12 h-12 rounded-xl bg-primary/10 text-primary flex items-center justify-center"><MapPin size={24} /></div>
                <div className="flex gap-2">
                  <button onClick={() => openEdit(u)} className="p-2 text-gray-400 hover:text-primary hover:bg-primary/5 rounded-lg transition-colors"><Pencil size={16} /></button>
                  <button onClick={() => handleDelete(u.id)} className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"><Trash2 size={16} /></button>
                </div>
              </div>
              <h3 className="font-semibold text-gray-900 mt-4">{u.nombre}</h3>
              <span className={`inline-block mt-2 px-2 py-1 rounded-full text-xs font-medium ${tipoColores[u.tipo] || 'bg-gray-100 text-gray-600'}`}>{u.tipo}</span>
            </div>
          ))}
        </div>
      )}

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title={editing ? 'Editar Ubicación' : 'Nueva Ubicación'}>
        <form onSubmit={handleSubmit} className="space-y-4">
          {error && <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-sm text-red-600">{error}</div>}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Nombre *</label>
            <input type="text" value={form.nombre} onChange={(e) => setForm({ ...form, nombre: e.target.value })} className="w-full px-3 py-2.5 rounded-lg border border-gray-200 focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none" placeholder="A-01, REF-02, CON-01..." required />
            <p className="text-xs text-gray-500 mt-1">Ej: A-01 (Estantería A), REF-01 (Refrigerador), CON-02 (Congelador)</p>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Tipo *</label>
            <select value={form.tipo} onChange={(e) => setForm({ ...form, tipo: e.target.value })} className="w-full px-3 py-2.5 rounded-lg border border-gray-200 focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none">
              <option value="ESTANTERIA">Estantería</option>
              <option value="REFRIGERADOR">Refrigerador</option>
              <option value="CONGELADOR">Congelador</option>
            </select>
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

export default Ubicaciones;
