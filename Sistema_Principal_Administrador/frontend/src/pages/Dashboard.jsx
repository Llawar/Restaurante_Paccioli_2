import { useState, useEffect } from 'react';
import { 
  DollarSign, 
  ShoppingCart, 
  ChefHat, 
  Package,
  AlertTriangle,
  Clock,
  CheckCircle,
  XCircle,
  Clock3,
  Loader2
} from 'lucide-react';
import Card from '../components/ui/Card';
import { BarChartComponent, PieChartComponent } from '../components/ui/Chart';
import Table from '../components/ui/Table';
import { pedidosApi } from '../services/pedidos.service';
import { inventarioApi } from '../services/inventario.service';
import { productosApi } from '../services/productos.service';
import socket from '../services/socket';

function Dashboard() {
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    ventasDia: 0,
    pedidosActivos: 0,
    productoTop: '-',
    alertasInventario: 0
  });
  const [salesData, setSalesData] = useState([]);
  const [orderStatusData, setOrderStatusData] = useState([]);
  const [inventoryAlerts, setInventoryAlerts] = useState([]);
  const [recentActivity, setRecentActivity] = useState([]);

  useEffect(() => {
    fetchDashboardData();

    socket.on('pedidos:changed', () => {
      console.log('Pedidos actualizados, recargando dashboard...');
      fetchDashboardData();
    });

    socket.on('inventario:changed', () => {
      console.log('Inventario actualizado, recargando dashboard...');
      fetchDashboardData();
    });

    socket.on('products:changed', () => {
      console.log('Productos actualizados, recargando dashboard...');
      fetchDashboardData();
    });

    return () => {
      socket.off('pedidos:changed');
      socket.off('inventario:changed');
      socket.off('products:changed');
    };
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      
      // Obtener pedidos para estadísticas
      const pedidosRes = await pedidosApi.getAll();
      const pedidos = pedidosRes.data?.data || [];
      
      // Calcular ventas del día
      const hoy = new Date().toISOString().split('T')[0];
      const ventasHoy = pedidos
        .filter(p => p.fecha?.startsWith(hoy))
        .reduce((sum, p) => sum + (parseFloat(p.total) || 0), 0);
      
      // Pedidos activos (no entregados ni cancelados)
      const pedidosActivos = pedidos.filter(p => 
        p.estado !== 'entregado' && p.estado !== 'cancelado'
      ).length;

      // Datos para gráfico de estados
      const estadosCount = {
        'Completados': pedidos.filter(p => p.estado === 'entregado').length,
        'En preparación': pedidos.filter(p => p.estado === 'preparacion').length,
        'Pendientes': pedidos.filter(p => p.estado === 'pendiente').length,
        'Cancelados': pedidos.filter(p => p.estado === 'cancelado').length
      };
      
      setOrderStatusData([
        { name: 'Completados', value: estadosCount['Completados'] },
        { name: 'En preparación', value: estadosCount['En preparación'] },
        { name: 'Pendientes', value: estadosCount['Pendientes'] },
        { name: 'Cancelados', value: estadosCount['Cancelados'] }
      ]);

      // Obtener alertas de inventario
      try {
        const alertasRes = await inventarioApi.getAlertas();
        const alertas = alertasRes.data?.data || [];
        setInventoryAlerts(alertas.slice(0, 4));
      } catch (e) {
        console.log('Alertas no disponibles');
      }

      // Obtener producto top
      try {
        const productosRes = await productosApi.getAll();
        const productos = productosRes.data?.data || [];
        const topProduct = productos.sort((a, b) => (b.vendidos || 0) - (a.vendidos || 0))[0];
        
        setStats({
          ventasDia: ventasHoy,
          pedidosActivos: pedidosActivos,
          productoTop: topProduct?.nombre || 'Hamburguesa Clásica',
          alertasInventario: inventoryAlerts.length
        });
      } catch (e) {
        console.log('Productos no disponibles');
      }

      // Formatear actividad reciente
      const actividadReciente = pedidos
        .slice(0, 5)
        .map(p => ({
          id: `PED-${p.id}`,
          client: p.cliente_nombre || 'Cliente',
          type: p.tipo === 'delivery' ? 'Delivery' : `Mesa ${p.mesa_id}`,
          total: parseFloat(p.total) || 0,
          status: p.estado,
          time: p.fecha ? new Date(p.fecha).toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' }) : '--:--'
        }));
      
      setRecentActivity(actividadReciente);

      // Datos de ventas semanales (placeholder hasta tener endpoint real)
      setSalesData([
        { name: 'Lun', value: 4200 },
        { name: 'Mar', value: 3800 },
        { name: 'Mié', value: 5100 },
        { name: 'Jue', value: 4600 },
        { name: 'Vie', value: 6200 },
        { name: 'Sáb', value: 7800 },
        { name: 'Dom', value: 6500 },
      ]);

    } catch (error) {
      console.error('Error cargando dashboard:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'entregado':
      case 'completado':
        return <CheckCircle size={16} className="text-green-500" />;
      case 'preparacion':
      case 'preparando':
        return <Clock3 size={16} className="text-blue-500" />;
      case 'pendiente':
        return <Clock size={16} className="text-yellow-500" />;
      case 'cancelado':
        return <XCircle size={16} className="text-red-500" />;
      default:
        return null;
    }
  };

  const getStatusClass = (status) => {
    switch (status) {
      case 'entregado':
      case 'completado':
        return 'bg-green-100 text-green-700';
      case 'preparacion':
      case 'preparando':
        return 'bg-blue-100 text-blue-700';
      case 'pendiente':
        return 'bg-yellow-100 text-yellow-700';
      case 'cancelado':
        return 'bg-red-100 text-red-700';
      default:
        return 'bg-gray-100 text-gray-700';
    }
  };

  const getStatusLabel = (status) => {
    const labels = {
      'entregado': 'Completado',
      'completado': 'Completado',
      'preparacion': 'Preparando',
      'preparando': 'Preparando',
      'pendiente': 'Pendiente',
      'cancelado': 'Cancelado'
    };
    return labels[status] || status;
  };

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
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
          <p className="text-gray-500 mt-1">Resumen de tu restaurante hoy</p>
        </div>
        <button className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary-dark transition-colors">
          Nuevo Pedido
        </button>
      </div>

      {/* Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card
          title="Ventas del día"
          value={`Bs ${stats.ventasDia.toFixed(2)}`}
          icon={DollarSign}
          trend="up"
          trendValue="+12% vs ayer"
          color="green"
        />
        <Card
          title="Pedidos activos"
          value={stats.pedidosActivos.toString()}
          icon={ShoppingCart}
          trend="up"
          trendValue="+5 nuevos"
          color="primary"
        />
        <Card
          title="Producto top"
          value={stats.productoTop}
          icon={ChefHat}
          trend="up"
          trendValue="68 vendidas"
          color="purple"
        />
        <Card
          title="Alertas inventario"
          value={`${stats.alertasInventario} productos`}
          icon={Package}
          trend="down"
          trendValue="Revisar stock"
          color="red"
        />
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <BarChartComponent data={salesData} title="Ventas últimos 7 días" />
        <PieChartComponent data={orderStatusData} title="Estado de pedidos" />
      </div>

      {/* Alerts & Table */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Inventory Alerts */}
        <div className="bg-white rounded-xl p-6 card-shadow">
          <div className="flex items-center gap-2 mb-4">
            <AlertTriangle className="text-yellow-500" size={20} />
            <h3 className="text-lg font-semibold text-gray-900">Alertas de Inventario</h3>
          </div>
          
          <div className="space-y-3">
            {inventoryAlerts.length === 0 ? (
              <p className="text-gray-500 text-center py-4">No hay alertas de inventario</p>
            ) : (
              inventoryAlerts.map((item) => (
                <div 
                  key={item.id} 
                  className={`flex items-center justify-between p-3 rounded-lg ${
                    item.stock <= item.minimo ? 'bg-red-50 border border-red-100' : 'bg-yellow-50 border border-yellow-100'
                  }`}
                >
                  <div>
                    <p className="font-medium text-gray-900 text-sm">{item.nombre}</p>
                    <p className="text-xs text-gray-500">Stock: {item.stock} unidades</p>
                  </div>
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                    item.stock <= item.minimo
                      ? 'bg-red-500 text-white' 
                      : 'bg-yellow-500 text-white'
                  }`}>
                    {item.stock <= item.minimo ? 'Crítico' : 'Bajo'}
                  </span>
                </div>
              ))
            )}
          </div>
          
          <button className="w-full mt-4 py-2 text-primary text-sm font-medium hover:bg-primary/5 rounded-lg transition-colors">
            Ver inventario completo
          </button>
        </div>

        {/* Recent Activity */}
        <div className="lg:col-span-2">
          <div className="bg-white rounded-xl p-6 card-shadow">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Actividad Reciente</h3>
              <button className="text-primary text-sm font-medium hover:underline">
                Ver todos
              </button>
            </div>
            
            <Table
              headers={['ID', 'Cliente', 'Tipo', 'Total', 'Estado', 'Hora']}
              data={recentActivity}
              renderRow={(order) => (
                <tr key={order.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-4 text-sm font-medium text-gray-900">{order.id}</td>
                  <td className="px-6 py-4 text-sm text-gray-600">{order.client}</td>
                  <td className="px-6 py-4 text-sm text-gray-600">{order.type}</td>
                  <td className="px-6 py-4 text-sm font-medium text-gray-900">Bs {order.total.toFixed(2)}</td>
                  <td className="px-6 py-4">
                    <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${getStatusClass(order.status)}`}>
                      {getStatusIcon(order.status)}
                      {getStatusLabel(order.status)}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-500">{order.time}</td>
                </tr>
              )}
            />
          </div>
        </div>
      </div>
    </div>
  );
}

export default Dashboard;
