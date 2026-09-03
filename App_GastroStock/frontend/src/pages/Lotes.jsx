import { useState, useEffect } from 'react';
import { Search, Loader2, Boxes } from 'lucide-react';
import Table from '../components/ui/Table';
import SectionGuide from '../components/ui/SectionGuide';
import { lotesApi } from '../services/gastro.service';
import { formatQuantity } from '../utils/format';

function Lotes() {
  const [lotes, setLotes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  useEffect(() => { fetchLotes(); }, []);

  const fetchLotes = async () => {
    try {
      setLoading(true);
      const res = await lotesApi.getAll();
      setLotes(res.data?.data || []);
    } catch (err) {
      console.error('Error:', err);
    } finally {
      setLoading(false);
    }
  };

  const filtered = lotes.filter(l =>
    l.numero_lote.toLowerCase().includes(search.toLowerCase()) ||
    (l.producto_nombre || '').toLowerCase().includes(search.toLowerCase())
  );

  const getVencimientoClass = (vencimiento, disponible) => {
    if (!vencimiento || disponible <= 0) return 'text-gray-500';
    const today = new Date();
    const exp = new Date(vencimiento);
    const days = (exp - today) / (1000 * 60 * 60 * 24);
    if (days < 0) return 'text-red-600 font-medium';
    if (days <= 30) return 'text-amber-600 font-medium';
    return 'text-gray-500';
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Lotes</h1>
          <p className="text-gray-500 mt-1">Lotes de mercancía por recepción (PEPS/FIFO)</p>
        </div>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
        <input type="text" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Buscar por lote o producto..." className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-gray-200 focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none" />
      </div>

      <SectionGuide
        title="¿Qué son los Lotes?"
        steps={[
          'Un lote agrupa la mercancía que llegó en una misma compra, con su propia fecha de ingreso, costo y vencimiento.',
          'Cada lote tiene un código como LT-20260831-0001 que lo identifica de manera única.',
          'Usa esta pantalla para saber cuánto queda de cada lote y, sobre todo, revisa la columna de "Vencimiento".',
          'Si ves una fecha en rojo o ámbar, ese lote está vencido o por vencer: hay que usarlo primero o retirarlo.',
        ]}
        tips={[
          'Regla PEPS: usa siempre primero el lote más antiguo para que nada se eche a perder.',
          'La "Disponible" verde indica cuánto queda de ese lote todavía.',
        ]}
      />

      <div className="bg-white rounded-xl p-6 card-shadow">
        {loading ? (
          <div className="flex items-center justify-center h-40"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>
        ) : (
          <Table
            headers={['Lote', 'Producto', 'Proveedor', 'Ingreso', 'Disponible', 'Costo', 'Vencimiento']}
            data={filtered}
            emptyMessage="No hay lotes registrados"
            renderRow={(item) => (
              <tr key={item.id} className="hover:bg-gray-50 transition-colors">
                <td className="px-6 py-4 text-sm font-mono text-primary font-medium">{item.numero_lote}</td>
                <td className="px-6 py-4 text-sm font-medium text-gray-900">{item.producto_nombre}</td>
                <td className="px-6 py-4 text-sm text-gray-600">{item.proveedor_nombre || '—'}</td>
                <td className="px-6 py-4 text-sm text-gray-500">{new Date(item.fecha_ingreso).toLocaleDateString('es-ES')}</td>
                <td className="px-6 py-4">
                  <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${item.cantidad_disponible > 0 ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                    {formatQuantity(item.cantidad_disponible)}
                  </span>
                </td>
                <td className="px-6 py-4 text-sm">Bs {Number(item.costo_unitario).toFixed(2)}</td>
                <td className={`px-6 py-4 text-sm ${getVencimientoClass(item.vencimiento, item.cantidad_disponible)}`}>
                  {item.vencimiento ? new Date(item.vencimiento).toLocaleDateString('es-ES') : 'N/A'}
                </td>
              </tr>
            )}
          />
        )}
      </div>
    </div>
  );
}

export default Lotes;
