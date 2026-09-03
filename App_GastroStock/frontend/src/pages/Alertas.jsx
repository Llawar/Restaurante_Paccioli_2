import { useState, useEffect } from 'react';
import { Loader2, AlertTriangle, Package, CalendarClock } from 'lucide-react';
import Table from '../components/ui/Table';
import SectionGuide from '../components/ui/SectionGuide';
import { alertasApi } from '../services/gastro.service';
import { formatQuantity } from '../utils/format';

function Alertas() {
  const [alertas, setAlertas] = useState([]);
  const [stockBajo, setStockBajo] = useState([]);
  const [proximoVencer, setProximoVencer] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => { fetchAll(); }, []);

  const fetchAll = async () => {
    try {
      setLoading(true);
      const [alertas, stock, venc] = await Promise.all([
        alertasApi.getAll(),
        alertasApi.getStockBajo(),
        alertasApi.getProximoVencer()
      ]);
      setAlertas(alertas.data?.data || []);
      setStockBajo(stock.data?.data || []);
      setProximoVencer(venc.data?.data || []);
    } catch (err) {
      console.error('Error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleMarcarLeidas = async () => {
    try { await alertasApi.marcarLeidas(); fetchAll(); } catch (err) { alert('Error'); }
  };

  const getTipoLabel = (tipo) => tipo === 'STOCK_MINIMO' ? 'Stock Mínimo' : 'Vencimiento';

  if (loading) {
    return <div className="flex items-center justify-center h-40"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Alertas</h1>
          <p className="text-gray-500 mt-1">Alertas de stock mínimo y productos por vencer</p>
        </div>
        {alertas.length > 0 && (
          <button onClick={handleMarcarLeidas} className="px-4 py-2 bg-primary text-on-accent rounded-lg hover:bg-primary-dark transition-colors text-sm">Marcar todas como leídas</button>
        )}
      </div>

      <SectionGuide
        title="¿Qué son las Alertas?"
        steps={[
          'Son avisos automáticos para que nunca te falten insumos ni se te pierda mercancía.',
          '"Stock bajo" te avisa cuando un producto llegó a su stock mínimo: hay que comprar o reponer.',
          '"Próximos a vencer" te muestra los lotes que se vencen en los próximos 30 días para usar la mercancía a tiempo.',
          'Para limpiar las notificaciones ya revisadas, usa el botón "Marcar todas como leídas".',
        ]}
        tips={[
          'Revisa esta pantalla al inicio de tu turno para actuar antes de que falte algo o se venza un producto.',
          'Cuando veas un vencimiento próximo, sácalo primero del almacén o mueve esa mercancía a la vista de la cocina.',
        ]}
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-white rounded-xl p-6 card-shadow">
          <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2"><AlertTriangle size={18} className="text-amber-500" /> Notificaciones pendientes</h2>
          <Table
            headers={['Producto', 'Tipo', 'Mensaje', 'Creada']}
            data={alertas}
            emptyMessage="Sin notificaciones pendientes. ¡Todo en orden!"
            renderRow={(item) => (
              <tr key={item.id} className="hover:bg-gray-50 transition-colors">
                <td className="px-6 py-4 text-sm font-medium text-gray-900">{item.producto_nombre} <span className="text-xs font-mono text-gray-400">({item.producto_codigo})</span></td>
                <td className="px-6 py-4">
                  <span className={`inline-flex px-2 py-1 rounded-full text-xs font-medium ${item.tipo === 'STOCK_MINIMO' ? 'bg-amber-100 text-amber-700' : 'bg-red-100 text-red-700'}`}>{getTipoLabel(item.tipo)}</span>
                </td>
                <td className="px-6 py-4 text-sm text-gray-600">{item.mensaje}</td>
                <td className="px-6 py-4 text-sm text-gray-500">{new Date(item.created_at).toLocaleString('es-ES')}</td>
              </tr>
            )}
          />
        </div>

        <div className="space-y-6">
          <div className="bg-white rounded-xl p-6 card-shadow">
            <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2"><Package size={18} className="text-amber-500" /> Stock bajo</h2>
            <div className="space-y-3">
              {stockBajo.length === 0 ? (
                <p className="text-sm text-gray-500">Sin productos bajo stock mínimo</p>
              ) : stockBajo.map((p) => (
                <div key={p.id} className="flex items-center justify-between p-3 bg-amber-50 rounded-lg">
                  <div>
                    <p className="text-sm font-medium text-gray-900">{p.nombre}</p>
                    <p className="text-xs text-gray-500">{p.categoria_nombre} / {p.subcategoria_nombre}</p>
                  </div>
                  <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${p.stock_actual > 0 ? 'bg-amber-200 text-amber-800' : 'bg-red-200 text-red-800'}`}>
                    {formatQuantity(p.stock_actual)} / mín {formatQuantity(p.stock_minimo)}
                  </span>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-white rounded-xl p-6 card-shadow">
            <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2"><CalendarClock size={18} className="text-red-500" /> Próximos a vencer (30 días)</h2>
            <div className="space-y-3">
              {proximoVencer.length === 0 ? (
                <p className="text-sm text-gray-500">Sin productos por vencer en los próximos 30 días</p>
              ) : proximoVencer.map((l) => (
                <div key={l.id} className="flex items-center justify-between p-3 bg-red-50 rounded-lg">
                  <div>
                    <p className="text-sm font-medium text-gray-900">{l.producto_nombre}</p>
                    <p className="text-xs text-gray-500 font-mono">{l.numero_lote}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-xs font-semibold text-red-600">Vence: {new Date(l.vencimiento).toLocaleDateString('es-ES')}</p>
                    <p className="text-xs text-gray-500">{formatQuantity(l.cantidad_disponible)} {l.unidad || ''}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Alertas;
