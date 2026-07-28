import { useState, useEffect } from 'react';
import { io } from 'socket.io-client';
import { 
  Search, 
  ChevronLeft,
  ChevronRight,
  Eye,
  ArrowRight,
  Home,
  Truck,
  Clock,
  Loader2
} from 'lucide-react';
import { pedidosApi } from '../services/pedidos.service';

// Conexión WebSocket
const socket = io('http://localhost:3006');

// Componente MiniKpiCard (minimalista)
function MiniKpiCard({ number, label, dotColor }) {
  const dotColors = {
    gray: 'bg-gray-400',
    orange: 'bg-orange-500',
    blue: 'bg-blue-500',
    green: 'bg-green-500'
  };

  return (
    <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
      <p className="text-3xl font-bold text-gray-900 mb-1">{number}</p>
      <div className="flex items-center gap-2">
        <span className={`w-2 h-2 rounded-full ${dotColors[dotColor]}`}></span>
        <span className="text-sm text-gray-500">{label}</span>
      </div>
    </div>
  );
}

// Componente StatusBadge para pedidos
function OrderStatusBadge({ status }) {
  const variants = {
    pendiente: {
      bg: 'bg-gray-100',
      text: 'text-gray-600',
      dot: 'bg-gray-400',
      label: 'Pendiente'
    },
    preparacion: {
      bg: 'bg-orange-100',
      text: 'text-orange-700',
      dot: 'bg-orange-500',
      label: 'En preparación'
    },
    preparando: {
      bg: 'bg-orange-100',
      text: 'text-orange-700',
      dot: 'bg-orange-500',
      label: 'Preparando'
    },
    listo: {
      bg: 'bg-blue-100',
      text: 'text-blue-700',
      dot: 'bg-blue-500',
      label: 'Listo'
    },
    entregado: {
      bg: 'bg-green-100',
      text: 'text-green-700',
      dot: 'bg-green-500',
      label: 'Entregado'
    }
  };

  const style = variants[status] || variants.pendiente;

  return (
    <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium ${style.bg} ${style.text}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${style.dot}`}></span>
      {style.label}
    </span>
  );
}

// Componente TypeBadge para tipo de pedido
function TypeBadge({ type, detail }) {
  if (type === 'mesa') {
    return (
      <div className="flex items-center gap-1.5">
        <Home size={16} className="text-blue-500" />
        <span className="text-sm font-medium text-blue-600">Mesa {detail}</span>
      </div>
    );
  }
  return (
    <div className="flex items-center gap-1.5">
      <Truck size={16} className="text-purple-500" />
      <span className="text-sm font-medium text-purple-600">Delivery</span>
    </div>
  );
}

// Componente ActionButton
function ActionButton({ icon: Icon, text, variant = 'default', onClick }) {
  const baseClasses = "inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors";
  const variants = {
    default: "border-gray-200 text-gray-600 hover:bg-gray-50",
    primary: "bg-primary text-white border-primary hover:bg-primary-dark shadow-sm"
  };

  return (
    <button onClick={onClick} className={`${baseClasses} ${variants[variant]}`}>
      <Icon size={14} />
      {text}
    </button>
  );
}

function Pedidos() {
  const [activeTab, setActiveTab] = useState('todos');
  const [currentPage, setCurrentPage] = useState(1);
  const [searchTerm, setSearchTerm] = useState('');
  const [orders, setOrders] = useState([]);
  const [isInitialLoading, setIsInitialLoading] = useState(true);
  const [isUpdating, setIsUpdating] = useState(false);

  useEffect(() => {
    fetchOrders(true); // true = initial load
    // Refrescar cada 10 segundos
    const interval = setInterval(() => fetchOrders(false), 10000);
    
    // Escuchar eventos WebSocket de la cocina
    socket.on('kitchen:order_updated', () => {
      console.log('Pedido actualizado desde cocina, recargando...');
      fetchOrders(false);
    });
    
    socket.on('kitchen:new_order', () => {
      console.log('Nuevo pedido desde cocina, recargando...');
      fetchOrders(false);
    });
    
    return () => {
      clearInterval(interval);
      socket.off('kitchen:order_updated');
      socket.off('kitchen:new_order');
    };
  }, []);

  const fetchOrders = async (isInitial = false) => {
    try {
      if (isInitial) {
        setIsInitialLoading(true);
      } else {
        setIsUpdating(true);
      }
      
      const response = await pedidosApi.getAll();
      const ordersData = response.data?.data || [];
      
      // Transformar datos de la API
      const formattedOrders = ordersData.map((o, index) => ({
        id: `PED-${String(o.id).padStart(3, '0')}`,
        client: o.cliente_nombre || 'Cliente',
        phone: o.cliente_telefono || '+53 5XXXXXXX',
        type: o.tipo === 'delivery' ? 'delivery' : 'mesa',
        detail: o.mesa_id || '',
        items: o.items || o.total_items || 0,
        total: parseFloat(o.total) || 0,
        status: o.estado || 'pendiente',
        date: o.fecha ? new Date(o.fecha).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
        time: o.fecha ? new Date(o.fecha).toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' }) : '--:--'
      }));
      
      setOrders(formattedOrders);
    } catch (error) {
      console.error('Error cargando pedidos:', error);
    } finally {
      setIsInitialLoading(false);
      setIsUpdating(false);
    }
  };

  const handleUpdateStatus = async (orderId, newStatus) => {
    try {
      const id = orderId.replace('PED-', '');
      await pedidosApi.updateEstado(id, newStatus);
      fetchOrders(false);
    } catch (error) {
      console.error('Error actualizando estado:', error);
    }
  };

  // Paginación
  const itemsPerPage = 10;
  const totalPages = Math.ceil(filteredOrders.length / itemsPerPage);
  const paginatedOrders = filteredOrders.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  // Fecha actual
  const today = new Date().toLocaleDateString('es-ES', {
    day: 'numeric',
    month: 'long',
    year: 'numeric'
  });

  // Calcular KPIs
  const kpis = {
    pendiente: orders.filter(o => o.status === 'pendiente').length,
    preparacion: orders.filter(o => o.status === 'preparacion').length,
    listo: orders.filter(o => o.status === 'listo').length,
    entregado: orders.filter(o => o.status === 'entregado').length
  };

  // Tabs configuración
  const tabs = [
    { id: 'todos', label: 'Todos', count: orders.length, activeColor: 'bg-orange-100 text-orange-700' },
    { id: 'pendiente', label: 'Pendiente', count: kpis.pendiente },
    { id: 'preparacion', label: 'En Preparación', count: kpis.preparacion },
    { id: 'listo', label: 'Listo', count: kpis.listo },
    { id: 'entregado', label: 'Entregado', count: kpis.entregado }
  ];

  // Filtrar pedidos
  const filteredOrders = orders.filter(order => {
    const matchesSearch = order.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         order.client.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesTab = activeTab === 'todos' || order.status === activeTab;
    return matchesSearch && matchesTab;
  });

  const getInitials = (name) => {
    return name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();
  };

  const getAvatarColor = (name) => {
    const colors = ['bg-orange-500', 'bg-blue-500', 'bg-green-500', 'bg-purple-500', 'bg-pink-500'];
    let hash = 0;
    for (let i = 0; i < name.length; i++) {
      hash = name.charCodeAt(i) + ((hash << 5) - hash);
    }
    return colors[Math.abs(hash) % colors.length];
  };

  // Función para avanzar estado
  const advanceStatus = (currentStatus) => {
    const flow = ['pendiente', 'preparando', 'listo', 'entregado'];
    const currentIndex = flow.indexOf(currentStatus);
    return currentIndex < flow.length - 1 ? flow[currentIndex + 1] : currentStatus;
  };

  if (isInitialLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-semibold text-gray-900">Pedidos</h1>
        <p className="text-gray-400 text-sm mt-1">{today}</p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <MiniKpiCard number={kpis.pendiente} label="Pendiente" dotColor="gray" />
        <MiniKpiCard number={kpis.preparacion} label="En Preparación" dotColor="orange" />
        <MiniKpiCard number={kpis.listo} label="Listo" dotColor="blue" />
        <MiniKpiCard number={kpis.entregado} label="Entregado" dotColor="green" />
      </div>

      {/* Tabs and Search Container */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100">
        {/* Tabs */}
        <div className="border-b border-gray-100">
          <div className="flex flex-wrap">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`relative px-6 py-4 text-sm font-medium transition-colors flex items-center gap-2 ${
                  activeTab === tab.id 
                    ? 'text-gray-900' 
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                {tab.label}
                <span className={`px-2 py-0.5 rounded-full text-xs ${
                  activeTab === tab.id 
                    ? (tab.activeColor || 'bg-gray-100 text-gray-600')
                    : 'bg-gray-100 text-gray-600'
                }`}>
                  {tab.count}
                </span>
                {activeTab === tab.id && (
                  <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary"></span>
                )}
              </button>
            ))}
          </div>
        </div>

        {/* Search Bar */}
        <div className="p-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
            <input
              type="text"
              placeholder="Buscar por ID o cliente..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-gray-50 rounded-lg focus:bg-white focus:ring-2 focus:ring-primary/20 outline-none transition-all"
            />
          </div>
        </div>
      </div>

      {/* Orders Table */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="text-left px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">ID</th>
                <th className="text-left px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Cliente</th>
                <th className="text-left px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Tipo</th>
                <th className="text-left px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Items</th>
                <th className="text-left px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Total</th>
                <th className="text-left px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Estado</th>
                <th className="text-left px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Fecha</th>
                <th className="text-center px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {paginatedOrders.map((order) => (
                <tr key={order.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-4">
                    <span className="font-bold text-gray-900">{order.id}</span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className={`w-10 h-10 rounded-full ${getAvatarColor(order.client)} flex items-center justify-center text-white text-sm font-bold`}>
                        {getInitials(order.client)}
                      </div>
                      <div>
                        <p className="font-medium text-gray-900">{order.client}</p>
                        <p className="text-xs text-gray-500">{order.phone}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <TypeBadge type={order.type} detail={order.detail} />
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-600">{order.items}</td>
                  <td className="px-6 py-4">
                    <span className="font-bold text-gray-900">${order.total.toFixed(2)}</span>
                  </td>
                  <td className="px-6 py-4">
                    <OrderStatusBadge status={order.status} />
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-1.5 text-sm text-gray-600">
                      <Clock size={14} className="text-gray-400" />
                      <div>
                        <p>{order.date}</p>
                        <p className="text-xs text-gray-400">{order.time}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center justify-center gap-2">
                      <ActionButton icon={Eye} text="Ver" variant="default" />
                      {order.status !== 'entregado' && (
                        <ActionButton 
                          icon={ArrowRight} 
                          text="Avanzar" 
                          variant="primary"
                          onClick={() => handleUpdateStatus(order.id, advanceStatus(order.status))}
                        />
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className="px-6 py-4 border-t border-gray-100 flex items-center justify-between">
          <p className="text-sm text-gray-500">
            Mostrando <span className="font-medium">{Math.min(itemsPerPage, filteredOrders.length)}</span> de <span className="font-medium">{orders.length}</span> pedidos
          </p>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
              disabled={currentPage === 1}
              className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <ChevronLeft size={18} />
            </button>
            <span className="text-sm text-gray-600">
              Página {currentPage} de {totalPages || 1}
            </span>
            <button
              onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
              disabled={currentPage === totalPages || totalPages === 0}
              className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <ChevronRight size={18} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Pedidos;
