import { useState, useEffect } from 'react';
import { 
  Plus, 
  Search, 
  AlertTriangle, 
  AlertCircle,
  ChevronLeft,
  ChevronRight,
  History,
  Edit3,
  Package,
  MoreVertical,
  Loader2
} from 'lucide-react';
import { inventarioApi } from '../services/inventario.service';

function Inventario() {
  const [currentPage, setCurrentPage] = useState(1);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('todos');
  const [inventory, setInventory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    nombre: '',
    proveedor: '',
    stock_actual: '',
    stock_minimo: '10',
    stock_maximo: '100',
    unidad_medida: 'unidades'
  });

  useEffect(() => {
    fetchInventory();
  }, []);

  const fetchInventory = async () => {
    try {
      setLoading(true);
      const response = await inventarioApi.getAll();
      const items = response.data?.data || [];
      
      // Transformar datos de la API
      const formattedItems = items.map(item => {
        const stock = parseInt(item.stock_actual) || parseInt(item.cantidad) || 0;
        const min = parseInt(item.stock_minimo) || 10;
        const max = parseInt(item.stock_maximo) || 100;
        let status = 'normal';
        if (stock <= min * 0.5) status = 'critico';
        else if (stock <= min) status = 'bajo';
        
        return {
          id: item.id || item.producto_id,
          name: item.nombre || item.producto_nombre || 'Sin nombre',
          supplier: item.proveedor || 'Sin proveedor',
          stock: stock,
          min: min,
          max: max,
          lastUpdate: item.updated_at ? new Date(item.updated_at).toLocaleString('es-ES') : 'Hace tiempo',
          status: status,
          unidad: item.unidad_medida || 'unidades'
        };
      });
      
      setInventory(formattedItems);
    } catch (error) {
      console.error('Error cargando inventario:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      await inventarioApi.create(formData);
      setIsModalOpen(false);
      setFormData({
        nombre: '',
        proveedor: '',
        stock_actual: '',
        stock_minimo: '10',
        stock_maximo: '100',
        unidad_medida: 'unidades'
      });
      await fetchInventory();
    } catch (error) {
      console.error('Error creando insumo:', error);
      alert('Error al crear el insumo: ' + (error.response?.data?.message || error.message));
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleUpdateStock = async (id, newStock) => {
    try {
      await inventarioApi.updateStock(id, newStock);
      fetchInventory();
    } catch (error) {
      console.error('Error actualizando stock:', error);
    }
  };

  const today = new Date().toLocaleDateString('es-ES', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });

  // Calcular alertas
  const criticalCount = inventory.filter(item => item.status === 'critico').length;
  const lowCount = inventory.filter(item => item.status === 'bajo').length;

  // Filtrar datos
  const filteredData = inventory.filter(item => {
    const name = item.name || '';
    const supplier = item.supplier || '';
    const matchesSearch = name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         supplier.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'todos' || item.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const getStatusBadge = (status) => {
    switch (status) {
      case 'normal':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-green-100 text-green-700">
            <span className="w-1.5 h-1.5 rounded-full bg-green-500"></span>
            Normal
          </span>
        );
      case 'bajo':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-700">
            <AlertCircle size={12} />
            Bajo
          </span>
        );
      case 'critico':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-red-100 text-red-700">
            <AlertTriangle size={12} />
            Crítico
          </span>
        );
      default:
        return null;
    }
  };

  const getProgressBar = (stock, min, max) => {
    const percentage = Math.min((stock / max) * 100, 100);
    let colorClass = 'bg-green-500';
    if (stock <= min) colorClass = 'bg-red-500';
    else if (stock <= min * 1.5) colorClass = 'bg-yellow-500';

    return (
      <div className="w-full">
        <div className="flex items-center justify-between text-xs mb-1">
          <span className="font-medium text-gray-900">{stock} unidades</span>
          <span className="text-gray-500">Mín: {min}</span>
        </div>
        <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
          <div 
            className={`h-full ${colorClass} transition-all duration-500`}
            style={{ width: `${percentage}%` }}
          ></div>
        </div>
      </div>
    );
  };

  const totalPages = Math.ceil(filteredData.length / 10);

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
          <h1 className="text-2xl font-bold text-gray-900">Inventario</h1>
          <p className="text-gray-500 mt-1 capitalize">{today}</p>
        </div>
        <button 
          onClick={() => setIsModalOpen(true)}
          className="inline-flex items-center gap-2 px-4 py-2.5 bg-primary hover:bg-primary-dark text-white font-medium rounded-lg shadow-lg shadow-primary/30 transition-all"
        >
          <Plus size={18} />
          Nuevo Insumo
        </button>
      </div>

      {/* Alert Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Critical Alert */}
        <div className="bg-red-50 border border-red-100 rounded-xl p-4 flex items-start gap-4">
          <div className="w-10 h-10 bg-red-100 rounded-lg flex items-center justify-center flex-shrink-0">
            <AlertTriangle className="text-red-600" size={20} />
          </div>
          <div>
            <h3 className="font-semibold text-red-900">{criticalCount} insumo{criticalCount !== 1 ? 's' : ''} crítico{criticalCount !== 1 ? 's' : ''}</h3>
            <p className="text-sm text-red-600 mt-0.5">Requiere reposición inmediata</p>
          </div>
        </div>

        {/* Low Stock Alert */}
        <div className="bg-yellow-50 border border-yellow-100 rounded-xl p-4 flex items-start gap-4">
          <div className="w-10 h-10 bg-yellow-100 rounded-lg flex items-center justify-center flex-shrink-0">
            <AlertCircle className="text-yellow-600" size={20} />
          </div>
          <div>
            <h3 className="font-semibold text-yellow-900">{lowCount} insumo{lowCount !== 1 ? 's' : ''} con stock bajo</h3>
            <p className="text-sm text-yellow-600 mt-0.5">Considera hacer un pedido pronto</p>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
            <input
              type="text"
              placeholder="Buscar insumo o proveedor..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-lg focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all"
            />
          </div>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-4 py-2.5 border border-gray-200 rounded-lg focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none bg-white min-w-[160px]"
          >
            <option value="todos">Todos los estados</option>
            <option value="normal">Normal</option>
            <option value="bajo">Stock bajo</option>
            <option value="critico">Crítico</option>
          </select>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="text-left px-6 py-4 text-xs font-semibold text-gray-600 uppercase tracking-wider">Insumo</th>
                <th className="text-left px-6 py-4 text-xs font-semibold text-gray-600 uppercase tracking-wider">Proveedor</th>
                <th className="text-left px-6 py-4 text-xs font-semibold text-gray-600 uppercase tracking-wider">Stock Actual</th>
                <th className="text-left px-6 py-4 text-xs font-semibold text-gray-600 uppercase tracking-wider">Mínimo</th>
                <th className="text-left px-6 py-4 text-xs font-semibold text-gray-600 uppercase tracking-wider">Estado</th>
                <th className="text-left px-6 py-4 text-xs font-semibold text-gray-600 uppercase tracking-wider">Última actualización</th>
                <th className="text-center px-6 py-4 text-xs font-semibold text-gray-600 uppercase tracking-wider">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filteredData.map((item) => (
                <tr 
                  key={item.id} 
                  className={`hover:bg-gray-50 transition-colors ${
                    item.status === 'critico' ? 'bg-red-50/50' : item.status === 'bajo' ? 'bg-yellow-50/50' : ''
                  }`}
                >
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center">
                        <Package size={18} className="text-gray-500" />
                      </div>
                      <div>
                        <p className="font-medium text-gray-900">{item.name}</p>
                        {item.status !== 'normal' && (
                          <span className="inline-flex items-center gap-1 text-xs text-red-600 mt-0.5">
                            <AlertTriangle size={12} />
                            {item.status === 'critico' ? 'Stock crítico' : 'Stock bajo'}
                          </span>
                        )}
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-600">{item.supplier}</td>
                  <td className="px-6 py-4">
                    {getProgressBar(item.stock, item.min, item.max)}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-600">{item.min} unidades</td>
                  <td className="px-6 py-4">{getStatusBadge(item.status)}</td>
                  <td className="px-6 py-4 text-sm text-gray-500">{item.lastUpdate}</td>
                  <td className="px-6 py-4">
                    <div className="flex items-center justify-center gap-2">
                      <button className="p-2 text-gray-500 hover:text-primary hover:bg-primary/10 rounded-lg transition-colors" title="Actualizar stock">
                        <Edit3 size={16} />
                      </button>
                      <button className="p-2 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors" title="Ver historial">
                        <History size={16} />
                      </button>
                      <button className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors">
                        <MoreVertical size={16} />
                      </button>
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
            Mostrando <span className="font-medium">{filteredData.length}</span> de <span className="font-medium">{inventory.length}</span> insumos
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

      {/* Modal - Nuevo Insumo */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl w-full max-w-md max-h-[90vh] overflow-y-auto">
            <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
              <h3 className="text-lg font-semibold text-gray-900">Nuevo Insumo</h3>
              <button 
                onClick={() => setIsModalOpen(false)}
                className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <span className="text-2xl leading-none">&times;</span>
              </button>
            </div>
            
            <form onSubmit={handleCreate} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Nombre del insumo</label>
                <input
                  type="text"
                  required
                  value={formData.nombre}
                  onChange={(e) => setFormData({...formData, nombre: e.target.value})}
                  className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all"
                  placeholder="Ej: Carne de res premium"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Proveedor</label>
                <input
                  type="text"
                  value={formData.proveedor}
                  onChange={(e) => setFormData({...formData, proveedor: e.target.value})}
                  className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all"
                  placeholder="Ej: Carnes del Norte"
                />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Stock actual</label>
                  <input
                    type="number"
                    required
                    min="0"
                    value={formData.stock_actual}
                    onChange={(e) => setFormData({...formData, stock_actual: e.target.value})}
                    className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all"
                    placeholder="0"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Unidad</label>
                  <select
                    value={formData.unidad_medida}
                    onChange={(e) => setFormData({...formData, unidad_medida: e.target.value})}
                    className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none bg-white"
                  >
                    <option value="unidades">Unidades</option>
                    <option value="kg">Kilogramos</option>
                    <option value="g">Gramos</option>
                    <option value="l">Litros</option>
                    <option value="ml">Mililitros</option>
                    <option value="cajas">Cajas</option>
                    <option value="botellas">Botellas</option>
                  </select>
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Stock mínimo</label>
                  <input
                    type="number"
                    min="0"
                    value={formData.stock_minimo}
                    onChange={(e) => setFormData({...formData, stock_minimo: e.target.value})}
                    className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Stock máximo</label>
                  <input
                    type="number"
                    min="0"
                    value={formData.stock_maximo}
                    onChange={(e) => setFormData({...formData, stock_maximo: e.target.value})}
                    className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all"
                  />
                </div>
              </div>
              
              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="flex-1 px-4 py-2.5 border border-gray-200 text-gray-700 font-medium rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="flex-1 px-4 py-2.5 bg-primary text-white font-medium rounded-lg hover:bg-primary-dark transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isSubmitting ? 'Creando...' : 'Crear Insumo'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default Inventario;
