import { useState, useEffect } from 'react';
import { 
  Search,
  MapPin,
  Phone,
  User,
  Clock,
  ChevronDown,
  Plus,
  CheckCircle2,
  Loader2
} from 'lucide-react';
import { deliveryApi } from '../services/delivery.service';
import { pedidosApi } from '../services/pedidos.service';

// Componente DeliveryCard
function DeliveryCard({ order, onStatusChange }) {
  const getStatusColor = (status) => {
    switch (status) {
      case 'pendiente': return 'border-t-gray-400';
      case 'en_camino': return 'border-t-purple-500';
      case 'entregado': return 'border-t-green-500';
      default: return 'border-t-gray-400';
    }
  };

  const getStatusBadge = (status) => {
    const styles = {
      pendiente: 'bg-gray-100 text-gray-600',
      en_camino: 'bg-purple-100 text-purple-700',
      entregado: 'bg-green-100 text-green-700'
    };
    const labels = {
      pendiente: 'Pendiente',
      en_camino: 'En camino',
      entregado: 'Entregado'
    };
    const dots = {
      pendiente: 'bg-gray-400',
      en_camino: 'bg-purple-500',
      entregado: 'bg-green-500'
    };

    return (
      <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${styles[status]}`}>
        <span className={`w-1.5 h-1.5 rounded-full ${dots[status]}`}></span>
        {labels[status]}
      </span>
    );
  };

  const getActionButton = () => {
    switch (order.status) {
      case 'pendiente':
        return (
          <button 
            onClick={() => onStatusChange(order.id, 'en_camino')}
            className="flex-1 py-2.5 px-4 bg-primary hover:bg-primary-dark text-white font-medium rounded-lg transition-colors shadow-sm"
          >
            Asignar
          </button>
        );
      case 'en_camino':
        return (
          <button 
            onClick={() => onStatusChange(order.id, 'entregado')}
            className="flex-1 py-2.5 px-4 bg-green-500 hover:bg-green-600 text-white font-medium rounded-lg transition-colors shadow-sm"
          >
            Entregar
          </button>
        );
      case 'entregado':
        return null;
      default:
        return null;
    }
  };

  return (
    <div className={`bg-white rounded-xl shadow-sm border border-gray-100 border-t-4 ${getStatusColor(order.status)} overflow-hidden hover:shadow-md transition-shadow`}>
      {/* Header */}
      <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
        <div className="flex items-center gap-2 text-sm text-gray-500">
          <span className="font-medium text-gray-700">{order.id}</span>
          <span>·</span>
          <span>{order.deliveryId}</span>
        </div>
        {getStatusBadge(order.status)}
      </div>

      {/* Body */}
      <div className="p-5 space-y-3">
        {/* Client Name */}
        <div>
          <h3 className="font-bold text-gray-900 text-lg">{order.client}</h3>
        </div>

        {/* Address */}
        <div className="flex items-start gap-2.5">
          <MapPin size={18} className="text-gray-400 mt-0.5 flex-shrink-0" />
          <p className="text-sm text-gray-600 leading-relaxed">{order.address}</p>
        </div>

        {/* Phone */}
        <div className="flex items-center gap-2.5">
          <Phone size={18} className="text-gray-400 flex-shrink-0" />
          <p className="text-sm text-gray-600">{order.phone}</p>
        </div>

        {/* Delivery Person */}
        <div className="flex items-center gap-2.5">
          <User size={18} className="text-gray-400 flex-shrink-0" />
          {order.deliveryPerson ? (
            <div className="flex items-center gap-2">
              <span className="w-6 h-6 rounded-full bg-primary/20 text-primary flex items-center justify-center text-xs font-bold">
                {order.deliveryPerson.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase()}
              </span>
              <span className="text-sm text-gray-700 font-medium">{order.deliveryPerson}</span>
            </div>
          ) : (
            <span className="text-sm text-gray-400 italic">Sin repartidor asignado</span>
          )}
        </div>

        {/* Time / ETA */}
        <div className="flex items-center gap-2.5">
          <Clock size={18} className="text-gray-400 flex-shrink-0" />
          <span className="text-sm text-gray-600">
            {order.status === 'entregado' ? (
              <span className="text-green-600 font-medium">Entregado a las {order.deliveredTime}</span>
            ) : order.status === 'en_camino' ? (
              <span>Est. llegada: <span className="font-medium text-gray-900">{order.estimatedTime}</span></span>
            ) : (
              <span className="text-gray-400">Esperando asignación</span>
            )}
          </span>
        </div>

        {/* Note (if exists) */}
        {order.note && (
          <div className="bg-gray-50 rounded-lg p-3 flex items-start gap-2.5 mt-3">
            <div className="w-5 h-5 rounded-full bg-yellow-100 flex items-center justify-center flex-shrink-0 mt-0.5">
              <span className="text-yellow-600 text-xs">!</span>
            </div>
            <p className="text-xs text-gray-600 leading-relaxed">{order.note}</p>
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="px-5 py-4 border-t border-gray-100 bg-gray-50/50">
        <div className="flex items-center justify-between gap-3">
          {/* Price */}
          <div className="text-xl font-bold text-primary">
            ${order.price.toFixed(2)}
          </div>

          {/* Buttons */}
          <div className="flex items-center gap-2 flex-1 justify-end">
            <button className="px-4 py-2.5 border border-gray-200 text-gray-600 text-sm font-medium rounded-lg hover:bg-gray-100 transition-colors">
              Ver detalle
            </button>
            {getActionButton()}
          </div>
        </div>
      </div>
    </div>
  );
}

// Componente KpiCard minimalista
function KpiCard({ number, label, dotColor }) {
  const colors = {
    gray: 'bg-gray-400',
    purple: 'bg-purple-500',
    green: 'bg-green-500'
  };

  return (
    <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100">
      <p className="text-3xl font-bold text-gray-900 mb-1">{number}</p>
      <div className="flex items-center gap-2">
        <span className={`w-2 h-2 rounded-full ${colors[dotColor]}`}></span>
        <span className="text-sm text-gray-500">{label}</span>
      </div>
    </div>
  );
}

function Delivery() {
  const [statusFilter, setStatusFilter] = useState('todos');
  const [searchTerm, setSearchTerm] = useState('');
  const [deliveryOrders, setDeliveryOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDeliveryOrders();
  }, []);

  const fetchDeliveryOrders = async () => {
    try {
      setLoading(true);
      // Obtener pedidos de tipo delivery
      const response = await pedidosApi.getAll();
      const allOrders = response.data?.data || [];
      
      // Filtrar solo pedidos delivery
      const deliveryOnly = allOrders.filter(o => o.tipo === 'delivery');
      
      // Transformar datos
      const formattedOrders = deliveryOnly.map((o, index) => ({
        id: `PED-${String(o.id).padStart(3, '0')}`,
        deliveryId: `DEL-${String(index + 1).padStart(3, '0')}`,
        client: o.cliente_nombre || 'Cliente',
        address: o.direccion_entrega || 'Dirección no especificada',
        phone: o.cliente_telefono || '+53 5XXXXXXX',
        status: o.estado === 'entregado' ? 'entregado' : 
                o.estado === 'en_camino' ? 'en_camino' : 'pendiente',
        deliveryPerson: o.repartidor_nombre || null,
        price: parseFloat(o.total) || 0,
        estimatedTime: o.hora_estimada || null,
        deliveredTime: o.hora_entrega || null,
        note: o.notas || null
      }));
      
      setDeliveryOrders(formattedOrders);
    } catch (error) {
      console.error('Error cargando delivery:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleStatusChange = async (orderId, newStatus) => {
    try {
      const id = orderId.replace('PED-', '');
      await pedidosApi.updateEstado(id, newStatus);
      fetchDeliveryOrders();
    } catch (error) {
      console.error('Error actualizando estado:', error);
    }
  };

  // Fecha actual
  const today = new Date().toLocaleDateString('es-ES', {
    day: 'numeric',
    month: 'long',
    year: 'numeric'
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  // Calcular KPIs
  const kpiData = {
    pendiente: deliveryOrders.filter(o => o.status === 'pendiente').length,
    en_camino: deliveryOrders.filter(o => o.status === 'en_camino').length,
    entregado: deliveryOrders.filter(o => o.status === 'entregado').length
  };

  // Filtrar pedidos
  const filteredOrders = deliveryOrders.filter(order => {
    const matchesSearch = 
      order.client.toLowerCase().includes(searchTerm.toLowerCase()) ||
      order.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      order.address.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'todos' || order.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const filterOptions = [
    { id: 'todos', label: 'Todos los estados' },
    { id: 'pendiente', label: 'Pendiente' },
    { id: 'en_camino', label: 'En camino' },
    { id: 'entregado', label: 'Entregado' }
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">Delivery</h1>
          <p className="text-gray-400 text-sm mt-1">{today}</p>
        </div>
        <button className="inline-flex items-center gap-2 px-4 py-2.5 bg-primary hover:bg-primary-dark text-white font-medium rounded-xl shadow-lg shadow-primary/30 transition-all">
          <Plus size={18} />
          Nuevo Delivery
        </button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <KpiCard 
          number={kpiData.pendiente} 
          label="Pendiente" 
          dotColor="gray" 
        />
        <KpiCard 
          number={kpiData.en_camino} 
          label="En Camino" 
          dotColor="purple" 
        />
        <KpiCard 
          number={kpiData.entregado} 
          label="Entregado" 
          dotColor="green" 
        />
      </div>

      {/* Toolbar */}
      <div className="flex flex-col lg:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
          <input
            type="text"
            placeholder="Buscar cliente, pedido o dirección..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-12 pr-4 py-3 bg-white border border-gray-200 rounded-xl focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all"
          />
        </div>
        <div className="relative min-w-[200px]">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="w-full px-4 py-3 pr-10 bg-white border border-gray-200 rounded-xl focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none appearance-none cursor-pointer"
          >
            {filterOptions.map(option => (
              <option key={option.id} value={option.id}>{option.label}</option>
            ))}
          </select>
          <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" size={18} />
        </div>
      </div>

      {/* Delivery Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredOrders.map((order) => (
          <DeliveryCard 
            key={order.id} 
            order={order} 
            onStatusChange={handleStatusChange}
          />
        ))}
      </div>

      {/* Empty State */}
      {filteredOrders.length === 0 && (
        <div className="text-center py-12 bg-white rounded-xl border border-gray-100">
          <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <CheckCircle2 size={32} className="text-gray-400" />
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-1">No hay pedidos</h3>
          <p className="text-gray-500">No se encontraron pedidos con los filtros seleccionados</p>
        </div>
      )}
    </div>
  );
}

export default Delivery;
