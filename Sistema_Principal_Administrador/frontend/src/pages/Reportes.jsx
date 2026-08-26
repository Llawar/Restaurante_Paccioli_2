import { useState, useEffect } from 'react';
import { 
  DollarSign,
  ShoppingBag,
  TrendingUp,
  Package,
  Calendar,
  Download,
  RefreshCw,
  ChevronDown,
  ArrowUp,
  ArrowDown,
  Loader2
} from 'lucide-react';
import { 
  AreaChart, 
  Area, 
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  Legend
} from 'recharts';
import { pedidosApi } from '../services/pedidos.service';
import { productosApi } from '../services/productos.service';

// Componente TrendBadge
function TrendBadge({ value }) {
  const isPositive = value >= 0;
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${
      isPositive ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
    }`}>
      {isPositive ? <ArrowUp size={12} /> : <ArrowDown size={12} />}
      {isPositive ? '+' : ''}{value}%
    </span>
  );
}

// Componente KpiReportCard
function KpiReportCard({ icon: Icon, title, value, subtitle, color }) {
  const colors = {
    orange: 'bg-orange-100 text-orange-600',
    blue: 'bg-blue-100 text-blue-600',
    green: 'bg-green-100 text-green-600',
    purple: 'bg-purple-100 text-purple-600'
  };

  return (
    <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
      <div className={`w-12 h-12 rounded-xl ${colors[color]} flex items-center justify-center mb-4`}>
        <Icon size={24} />
      </div>
      <h3 className="text-2xl font-bold text-gray-900 mb-1">{value}</h3>
      <p className="text-sm font-medium text-gray-700 mb-1">{title}</p>
      <p className="text-xs text-gray-500">{subtitle}</p>
    </div>
  );
}

// Componente ChartContainer
function ChartContainer({ title, children, badge }) {
  return (
    <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
        {badge && (
          <span className="inline-flex items-center gap-1 px-2 py-1 bg-green-100 text-green-700 rounded-full text-xs font-medium">
            <ArrowUp size={12} />
            {badge}
          </span>
        )}
      </div>
      {children}
    </div>
  );
}

function Reportes() {
  const [timeFilter, setTimeFilter] = useState('7d');
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalRevenue: 0,
    totalOrders: 0,
    avgTicket: 0,
    topProduct: '-'
  });
  const [dailyRevenueData, setDailyRevenueData] = useState([]);
  const [dailyOrdersData, setDailyOrdersData] = useState([]);
  const [topProductsData, setTopProductsData] = useState([]);
  const [orderStatusData, setOrderStatusData] = useState([]);

  useEffect(() => {
    fetchReportData();
  }, []);

  const fetchReportData = async () => {
    try {
      setLoading(true);
      
      // Obtener pedidos
      const pedidosRes = await pedidosApi.getAll();
      const pedidos = pedidosRes.data?.data || [];
      
      // Calcular estadísticas
      const totalRev = pedidos.reduce((sum, p) => sum + (parseFloat(p.total) || 0), 0);
      const totalOrd = pedidos.length;
      const avgTick = totalOrd > 0 ? totalRev / totalOrd : 0;
      
      // Contar estados
      const estadosCount = {
        entregado: pedidos.filter(p => p.estado === 'entregado').length,
        preparacion: pedidos.filter(p => p.estado === 'preparacion').length,
        listo: pedidos.filter(p => p.estado === 'listo').length,
        pendiente: pedidos.filter(p => p.estado === 'pendiente').length
      };
      const totalEstados = Object.values(estadosCount).reduce((a, b) => a + b, 0) || 1;
      
      setOrderStatusData([
        { name: 'Entregado', value: Math.round((estadosCount.entregado / totalEstados) * 100), color: '#10B981' },
        { name: 'En Preparación', value: Math.round((estadosCount.preparacion / totalEstados) * 100), color: '#F97316' },
        { name: 'Listo', value: Math.round((estadosCount.listo / totalEstados) * 100), color: '#3B82F6' },
        { name: 'Pendiente', value: Math.round((estadosCount.pendiente / totalEstados) * 100), color: '#9CA3AF' }
      ]);
      
      // Obtener productos top
      try {
        const productosRes = await productosApi.getAll();
        const productos = productosRes.data?.data || [];
        const sorted = productos.sort((a, b) => (b.vendidos || 0) - (a.vendidos || 0)).slice(0, 5);
        setTopProductsData(sorted.map(p => ({ name: p.nombre, value: p.vendidos || 0 })));
        setStats(prev => ({ ...prev, topProduct: sorted[0]?.nombre || 'N/A' }));
      } catch (e) {
        console.log('Productos no disponibles');
      }
      
      setStats(prev => ({
        ...prev,
        totalRevenue: totalRev,
        totalOrders: totalOrd,
        avgTicket: avgTick
      }));
      
      // Datos placeholder para gráficos (hasta tener endpoint real)
      setDailyRevenueData([
        { name: 'Lun', value: Math.round(totalRev / 7) },
        { name: 'Mar', value: Math.round(totalRev / 7 * 0.9) },
        { name: 'Mié', value: Math.round(totalRev / 7 * 1.1) },
        { name: 'Jue', value: Math.round(totalRev / 7 * 1.2) },
        { name: 'Vie', value: Math.round(totalRev / 7 * 1.3) },
        { name: 'Sáb', value: Math.round(totalRev / 7 * 1.5) },
        { name: 'Dom', value: Math.round(totalRev / 7 * 1.2) },
      ]);
      
      setDailyOrdersData([
        { name: 'Lun', value: Math.round(totalOrd / 7) },
        { name: 'Mar', value: Math.round(totalOrd / 7 * 0.9) },
        { name: 'Mié', value: Math.round(totalOrd / 7 * 1.1) },
        { name: 'Jue', value: Math.round(totalOrd / 7 * 1.2) },
        { name: 'Vie', value: Math.round(totalOrd / 7 * 1.3) },
        { name: 'Sáb', value: Math.round(totalOrd / 7 * 1.5) },
        { name: 'Dom', value: Math.round(totalOrd / 7 * 1.2) },
      ]);
      
    } catch (error) {
      console.error('Error cargando reportes:', error);
    } finally {
      setLoading(false);
    }
  };

  // Fecha actual
  const today = new Date().toLocaleDateString('es-ES', {
    day: 'numeric',
    month: 'long',
    year: 'numeric'
  });

  // Filtros de tiempo
  const timeFilters = [
    { id: '7d', label: 'Últimos 7 días' },
    { id: '30d', label: '30 días' },
    { id: '3m', label: '3 meses' },
    { id: '6m', label: '6 meses' },
    { id: 'year', label: 'Este año' }
  ];


  // Datos de tabla mensual
  const monthlyData = [
    { period: 'Sep 2025', orders: 320, revenue: 142500, daily: 4750, change: 15.3 },
    { period: 'Oct 2025', orders: 345, revenue: 158200, daily: 5260, change: 12.1 },
    { period: 'Nov 2025', orders: 298, revenue: 136800, daily: 4560, change: -20.4 },
    { period: 'Dic 2025', orders: 412, revenue: 189500, daily: 6316, change: 38.6 },
    { period: 'Ene 2025', orders: 356, revenue: 164200, daily: 5473, change: 8.2 },
    { period: 'Feb 2025', orders: 287, revenue: 131800, daily: 4393, change: -37.9 },
    { period: 'Mar 2025', orders: 398, revenue: 165300, daily: 5510, change: 25.4 },
  ];

  const totalRevenue = stats.totalRevenue;
  const totalOrders = stats.totalOrders;

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
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">Reportes</h1>
          <p className="text-gray-400 text-sm mt-1">{today}</p>
        </div>
      </div>

      {/* Toolbar */}
      <div className="flex flex-col xl:flex-row gap-4 items-start xl:items-center justify-between">
        {/* Time Filters */}
        <div className="flex flex-wrap gap-2">
          {timeFilters.map((filter) => (
            <button
              key={filter.id}
              onClick={() => setTimeFilter(filter.id)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                timeFilter === filter.id
                  ? 'bg-primary text-white shadow-md'
                  : 'bg-white text-gray-600 border border-gray-200 hover:border-primary hover:text-primary'
              }`}
            >
              {filter.label}
            </button>
          ))}
          <button className="inline-flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 rounded-lg text-sm font-medium text-gray-600 hover:border-primary hover:text-primary transition-all">
            <Calendar size={16} />
            Personalizado
          </button>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-3">
          <button 
            onClick={fetchReportData}
            className="inline-flex items-center gap-2 px-4 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium rounded-lg transition-all"
          >
            <RefreshCw size={16} />
            Actualizar
          </button>
          <button className="inline-flex items-center gap-2 px-4 py-2.5 bg-primary hover:bg-primary-dark text-white font-medium rounded-lg shadow-md transition-all">
            <Download size={16} />
            Exportar PDF
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiReportCard 
          icon={DollarSign}
          title="Ingresos Totales"
          value={`Bs ${stats.totalRevenue.toLocaleString()}`}
          subtitle="Últimos 7 meses"
          color="orange"
        />
        <KpiReportCard 
          icon={ShoppingBag}
          title="Total Pedidos"
          value={stats.totalOrders.toString()}
          subtitle="Últimos 7 días"
          color="blue"
        />
        <KpiReportCard 
          icon={TrendingUp}
          title="Ticket Promedio"
          value={`Bs ${stats.avgTicket.toFixed(2)}`}
          subtitle="Por pedido"
          color="green"
        />
        <KpiReportCard 
          icon={Package}
          title="Producto Top"
          value={stats.topProduct}
          subtitle="Más vendido"
          color="purple"
        />
      </div>

      {/* Charts Grid - Main */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Daily Revenue - Area Chart */}
        <ChartContainer title="Ingresos Diarios" badge="+12.4% vs sem. ant.">
          <ResponsiveContainer width="100%" height={280}>
            <AreaChart data={dailyRevenueData}>
              <defs>
                <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#ff6b00" stopOpacity={0.3}/>
                  <stop offset="95%" stopColor="#ff6b00" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" vertical={false} />
              <XAxis 
                dataKey="name" 
                tick={{ fill: '#6b7280', fontSize: 12 }}
                axisLine={{ stroke: '#e5e7eb' }}
              />
              <YAxis 
                tick={{ fill: '#6b7280', fontSize: 12 }}
                axisLine={{ stroke: '#e5e7eb' }}
                tickFormatter={(value) => `Bs ${value / 1000}k`}
              />
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: '#fff', 
                  border: '1px solid #e5e7eb',
                  borderRadius: '8px',
                  boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                }}
                formatter={(value) => [`Bs ${value.toLocaleString()}`, 'Ingresos']}
              />
              <Area 
                type="monotone" 
                dataKey="value" 
                stroke="#ff6b00" 
                strokeWidth={3}
                fillOpacity={1} 
                fill="url(#colorRevenue)" 
              />
            </AreaChart>
          </ResponsiveContainer>
        </ChartContainer>

        {/* Daily Orders - Line Chart */}
        <ChartContainer title="Pedidos por Día">
          <ResponsiveContainer width="100%" height={280}>
            <LineChart data={dailyOrdersData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" vertical={false} />
              <XAxis 
                dataKey="name" 
                tick={{ fill: '#6b7280', fontSize: 12 }}
                axisLine={{ stroke: '#e5e7eb' }}
              />
              <YAxis 
                tick={{ fill: '#6b7280', fontSize: 12 }}
                axisLine={{ stroke: '#e5e7eb' }}
              />
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: '#fff', 
                  border: '1px solid #e5e7eb',
                  borderRadius: '8px',
                  boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                }}
                formatter={(value) => [`${value} pedidos`, 'Total']}
              />
              <Line 
                type="monotone" 
                dataKey="value" 
                stroke="#3B82F6" 
                strokeWidth={3}
                dot={{ fill: '#3B82F6', strokeWidth: 2, r: 5 }}
                activeDot={{ r: 7, stroke: '#3B82F6', strokeWidth: 2 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </ChartContainer>
      </div>

      {/* Distribution & Sales Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Top Products - Horizontal Bar Chart */}
        <div className="lg:col-span-2 bg-white rounded-xl p-6 shadow-sm border border-gray-100">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold text-gray-900">Productos Más Vendidos</h3>
            <button className="px-3 py-1.5 border border-gray-200 rounded-lg text-sm font-medium text-gray-600 hover:border-primary hover:text-primary transition-colors">
              CSV
            </button>
          </div>
          <div className="space-y-4">
            {topProductsData.map((product, index) => (
              <div key={index} className="flex items-center gap-4">
                <span className="w-6 text-sm font-medium text-gray-500">{index + 1}</span>
                <div className="flex-1">
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-sm font-medium text-gray-700">{product.name}</span>
                    <span className="text-sm font-semibold text-gray-900">{product.value}</span>
                  </div>
                  <div className="h-2.5 bg-gray-100 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-primary rounded-full"
                      style={{ width: `${(product.value / 310) * 100}%` }}
                    ></div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Order Status - Donut Chart */}
        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
          <h3 className="text-lg font-semibold text-gray-900 mb-6">Estado de Pedidos</h3>
          <ResponsiveContainer width="100%" height={200}>
            <PieChart>
              <Pie
                data={orderStatusData}
                cx="50%"
                cy="50%"
                innerRadius={50}
                outerRadius={70}
                paddingAngle={3}
                dataKey="value"
              >
                {orderStatusData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
          
          {/* Legend */}
          <div className="mt-4 space-y-2">
            {orderStatusData.map((item, index) => (
              <div key={index} className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="w-3 h-3 rounded-full" style={{ backgroundColor: item.color }}></span>
                  <span className="text-sm text-gray-600">{item.name}</span>
                </div>
                <span className="text-sm font-semibold text-gray-900">{item.value}%</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Monthly Summary Table */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <h2 className="text-lg font-semibold text-gray-900">Resumen de Ventas Mensual</h2>
          <div className="flex gap-2">
            <button className="px-3 py-1.5 border border-gray-200 rounded-lg text-sm font-medium text-gray-600 hover:border-primary hover:text-primary transition-colors">
              CSV
            </button>
            <button className="px-3 py-1.5 border border-gray-200 rounded-lg text-sm font-medium text-gray-600 hover:border-primary hover:text-primary transition-colors">
              Excel
            </button>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="text-left px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Período</th>
                <th className="text-center px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Pedidos</th>
                <th className="text-left px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Ingresos</th>
                <th className="text-left px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Prom./Día</th>
                <th className="text-left px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">% vs Anterior</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {monthlyData.map((row, index) => (
                <tr key={index} className="hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-4 text-sm font-medium text-gray-900">{row.period}</td>
                  <td className="px-6 py-4 text-sm text-gray-600 text-center">{row.orders}</td>
                  <td className="px-6 py-4 text-sm font-medium text-gray-900">Bs {row.revenue.toLocaleString()}</td>
                  <td className="px-6 py-4 text-sm text-gray-600">Bs {row.daily.toLocaleString()}</td>
                  <td className="px-6 py-4">
                    <TrendBadge value={row.change} />
                  </td>
                </tr>
              ))}
            </tbody>
            <tfoot className="bg-gray-50 border-t-2 border-gray-200">
              <tr>
                <td className="px-6 py-4 text-sm font-bold text-gray-900">Total</td>
                <td className="px-6 py-4 text-sm font-bold text-gray-900 text-center">{totalOrders}</td>
                <td className="px-6 py-4 text-lg font-bold text-primary">Bs {totalRevenue.toLocaleString()}</td>
                <td className="px-6 py-4 text-sm font-bold text-gray-900">Bs {Math.round(totalRevenue / 210).toLocaleString()}</td>
                <td className="px-6 py-4">
                  <span className="inline-flex items-center gap-1 px-2 py-1 bg-green-100 text-green-700 rounded-full text-xs font-medium">
                    <ArrowUp size={12} />
                    +18.2%
                  </span>
                </td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>
    </div>
  );
}

export default Reportes;
