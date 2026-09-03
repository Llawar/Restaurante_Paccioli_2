import { useState, useEffect } from 'react';
import {
  Package,
  AlertTriangle,
  Boxes,
  ShoppingCart,
  ClipboardList,
  Loader2,
  TrendingDown,
  CalendarClock
} from 'lucide-react';
import Card from '../components/ui/Card';
import { formatQuantity } from '../utils/format';
import Table from '../components/ui/Table';
import SectionGuide from '../components/ui/SectionGuide';
import { dashboardApi } from '../services/gastro.service';

function Dashboard() {
  const [loading, setLoading] = useState(true);
  const [resumen, setResumen] = useState({});
  const [compras, setCompras] = useState([]);
  const [movimientos, setMovimientos] = useState([]);
  const [stockBajo, setStockBajo] = useState([]);

  useEffect(() => {
    fetchDashboard();
  }, []);

  const fetchDashboard = async () => {
    try {
      setLoading(true);
      const [res1, res2, res3, res4] = await Promise.all([
        dashboardApi.resumen(),
        dashboardApi.comprasRecientes(),
        dashboardApi.movimientosRecientes(),
        dashboardApi.stockBajo()
      ]);
      setResumen(res1.data?.data || {});
      setCompras(res2.data?.data || []);
      setMovimientos(res3.data?.data || []);
      setStockBajo(res4.data?.data || []);
    } catch (error) {
      console.error('Error cargando dashboard:', error);
    } finally {
      setLoading(false);
    }
  };

  const getConceptoLabel = (concepto) => {
    const labels = {
      'COMPRA': 'Compra',
      'DONACION': 'Donación',
      'DEVOLUCION': 'Devolución',
      'CONSUMO': 'Consumo',
      'MERMA': 'Merma',
      'VENCIDO': 'Vencido',
      'AJUSTE_POSITIVO': 'Ajuste +',
      'AJUSTE_NEGATIVO': 'Ajuste -',
      'INVENTARIO_FISICO': 'Inv. Físico'
    };
    return labels[concepto] || concepto;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  const prod = resumen.productos || {};

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
          <p className="text-gray-500 mt-1">Resumen del inventario del almacén</p>
        </div>
      </div>

      <SectionGuide
        title="¿Qué es este panel?"
        steps={[
          'Muestra un resumen general: cuántos productos hay, el valor total del inventario y cuántos movimientos hubo hoy.',
          'La franja amarilla "Atención requerida" avisa si hay productos agotados, con stock bajo o por vencer.',
          'Revisa las tarjetas de "Stock Bajo", "Compras Recientes" y "Movimientos Recientes" para estar al día de un vistazo.',
        ]}
        tips={[
          'Si en el menú "Manual" tienes dudas del flujo completo, ábrelo desde la barra lateral con el ícono de libro.',
        ]}
      />

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card
          title="Productos registrados"
          value={prod.total || 0}
          icon={Package}
          color="primary"
        />
        <Card
          title="Valor del inventario"
          value={`Bs ${(resumen.valor_inventario || 0).toLocaleString('es-BO', { minimumFractionDigits: 2 })}`}
          icon={Boxes}
          color="green"
        />
        <Card
          title="Proveedores"
          value={resumen.proveedores || 0}
          icon={ShoppingCart}
          color="blue"
        />
        <Card
          title="Movimientos hoy"
          value={resumen.movimientos_hoy || 0}
          icon={ClipboardList}
          color="purple"
        />
      </div>

      {/* Alertas críticas */}
      {((prod.stock_bajo || 0) > 0 || (prod.agotados || 0) > 0 || (resumen.proximo_vencer || 0) > 0) && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex items-start gap-3">
          <AlertTriangle className="text-amber-500 w-5 h-5 mt-0.5 flex-shrink-0" />
          <div>
            <h3 className="font-semibold text-amber-800">Atención requerida en inventario</h3>
            <p className="text-sm text-amber-700 mt-1">
              {prod.agotados || 0} producto(s) agotado(s), {prod.stock_bajo || 0} con stock bajo, {resumen.proximo_vencer || 0} próximo(s) a vencer.
            </p>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Stock bajo */}
        <div className="bg-white rounded-xl p-6 card-shadow">
          <div className="flex items-center gap-2 mb-4">
            <TrendingDown className="text-red-500" size={20} />
            <h3 className="text-lg font-semibold text-gray-900">Stock Bajo</h3>
          </div>

          <div className="space-y-3">
            {stockBajo.length === 0 ? (
              <p className="text-gray-500 text-center py-4">No hay productos con stock bajo</p>
            ) : (
              stockBajo.map((item) => (
                <div key={item.id} className="flex items-center justify-between p-3 rounded-lg bg-red-50 border border-red-100">
                  <div>
                    <p className="font-medium text-gray-900 text-sm">{item.nombre}</p>
                    <p className="text-xs text-gray-500">{item.codigo}</p>
                  </div>
                  <span className="px-2 py-1 rounded-full text-xs font-medium bg-red-500 text-on-accent">
                    {formatQuantity(item.stock_actual)} {item.unidad || ''}
                  </span>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Compras recientes */}
        <div>
          <div className="bg-white rounded-xl p-6 card-shadow h-full">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Compras Recientes</h3>
            </div>
            <Table
              headers={['#', 'Proveedor', 'Total', 'Fecha']}
              data={compras}
              emptyMessage="No hay compras registradas"
              renderRow={(item) => (
                <tr key={item.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-4 py-3 text-sm font-medium text-gray-900">#{item.id}</td>
                  <td className="px-4 py-3 text-sm text-gray-600">{item.proveedor_nombre}</td>
                  <td className="px-4 py-3 text-sm font-medium text-gray-900">Bs {Number(item.total).toFixed(2)}</td>
                  <td className="px-4 py-3 text-sm text-gray-500">
                    {new Date(item.fecha).toLocaleDateString('es-ES')}
                  </td>
                </tr>
              )}
            />
          </div>
        </div>

        {/* Próximo a vencer */}
        <div className="bg-white rounded-xl p-6 card-shadow">
          <div className="flex items-center gap-2 mb-4">
            <CalendarClock className="text-amber-500" size={20} />
            <h3 className="text-lg font-semibold text-gray-900">Próximo a Vencer</h3>
          </div>
          <p className="text-gray-500 text-center py-4">
            {resumen.proximo_vencer || 0} producto(s) vencen en los próximos 30 días.
          </p>
        </div>
      </div>

      {/* Movimientos recientes */}
      <div className="bg-white rounded-xl p-6 card-shadow">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900">Movimientos Recientes</h3>
        </div>
        <Table
          headers={['Fecha', 'Concepto', 'Producto', 'Entrada', 'Salida', 'Usuario']}
          data={movimientos}
          emptyMessage="No hay movimientos registrados"
          renderRow={(item) => (
            <tr key={item.id} className="hover:bg-gray-50 transition-colors">
              <td className="px-6 py-4 text-sm text-gray-500">
                {new Date(item.fecha).toLocaleString('es-ES', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })}
              </td>
              <td className="px-6 py-4">
                <span className={`inline-flex px-2 py-1 rounded-full text-xs font-medium ${
                  item.tipo === 'ENTRADA' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                }`}>
                  {getConceptoLabel(item.concepto)}
                </span>
              </td>
              <td className="px-6 py-4 text-sm text-gray-900">{item.producto_nombre}</td>
              <td className="px-6 py-4 text-sm font-medium text-green-600">{item.entrada > 0 ? item.entrada : '-'}</td>
              <td className="px-6 py-4 text-sm font-medium text-red-600">{item.salida > 0 ? item.salida : '-'}</td>
              <td className="px-6 py-4 text-sm text-gray-500">{item.usuario_nombre || '-'}</td>
            </tr>
          )}
        />
      </div>
    </div>
  );
}

export default Dashboard;
