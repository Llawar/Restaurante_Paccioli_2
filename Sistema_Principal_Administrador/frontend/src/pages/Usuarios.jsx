import { useState, useEffect } from 'react';
import { 
  Plus, 
  Search, 
  Filter,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Edit3,
  Trash2,
  Clock,
  Shield,
  User,
  UserCheck,
  Loader2
} from 'lucide-react';
import { usuariosApi } from '../services/usuarios.service';
import api from '../services/api';
import socket from '../services/socket';

// Componente KpiCard
function KpiCard({ icon: Icon, color, number, title }) {
  const colorClasses = {
    blue: 'bg-blue-100 text-blue-600',
    orange: 'bg-orange-100 text-orange-600',
    green: 'bg-green-100 text-green-600'
  };

  return (
    <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100 flex items-center gap-4">
      <div className={`w-12 h-12 rounded-full ${colorClasses[color]} flex items-center justify-center`}>
        <Icon size={22} />
      </div>
      <div>
        <p className="text-2xl font-bold text-gray-900">{number}</p>
        <p className="text-sm text-gray-500">{title}</p>
      </div>
    </div>
  );
}

// Componente StatusBadge
function StatusBadge({ text, variant }) {
  const variants = {
    admin: {
      bg: 'bg-orange-100',
      text: 'text-orange-700',
      dot: 'bg-orange-500'
    },
    empleado: {
      bg: 'bg-blue-100',
      text: 'text-blue-700',
      dot: 'bg-blue-500'
    },
    cocinero: {
      bg: 'bg-purple-100',
      text: 'text-purple-700',
      dot: 'bg-purple-500'
    },
    activo: {
      bg: 'bg-green-100',
      text: 'text-green-700',
      dot: 'bg-green-500'
    },
    inactivo: {
      bg: 'bg-gray-100',
      text: 'text-gray-600',
      dot: 'bg-gray-400'
    }
  };

  const style = variants[variant];

  return (
    <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium ${style.bg} ${style.text}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${style.dot}`}></span>
      {text}
    </span>
  );
}

// Componente ActionButton
function ActionButton({ icon: Icon, text, variant = 'default', onClick }) {
  const baseClasses = "inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors";
  const variants = {
    default: "border-gray-200 text-gray-600 hover:bg-gray-50",
    edit: "border-gray-200 text-gray-600 hover:bg-blue-50 hover:text-blue-600",
    delete: "border-gray-200 text-gray-600 hover:bg-red-50 hover:text-red-600"
  };

  return (
    <button onClick={onClick} className={`${baseClasses} ${variants[variant]}`}>
      <Icon size={14} />
      {text}
    </button>
  );
}

function Usuarios() {
  const [currentPage, setCurrentPage] = useState(1);
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState('todos');
  const [statusFilter, setStatusFilter] = useState('todos');
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [puestos, setPuestos] = useState([]);
  const [modalOpen, setModalOpen] = useState(false);
  const [form, setForm] = useState({ nombre: '', usuario: '', email: '', password: '', rol: 'empleado', puesto_cocina_id: '', activo: 1 });
  const [saveError, setSaveError] = useState('');

  useEffect(() => {
    fetchUsers();
    fetchPuestos();

    socket.on('usuarios:changed', () => {
      console.log('Usuarios actualizados, recargando...');
      fetchUsers();
    });

    return () => {
      socket.off('usuarios:changed');
    };
  }, []);

  const fetchPuestos = async () => {
    try {
      const r = await api.get('/cocina/puestos');
      if (r.data?.success) setPuestos(r.data.data);
    } catch (error) {
      console.error('Error cargando puestos:', error);
    }
  };

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const response = await usuariosApi.getAll();
      const usersData = response.data?.data || [];
      
      // Transformar datos de la API
      const formattedUsers = usersData.map(u => ({
        id: u.id,
        name: `${u.nombre} ${u.apellido}`,
        email: u.email,
        role: u.rol,
        puesto: u.puesto_nombre,
        puestoId: u.puesto_cocina_id,
        status: u.activo ? 'activo' : 'inactivo',
        joined: u.created_at ? new Date(u.created_at).toISOString().split('T')[0] : '2024-01-01',
        lastAccess: u.last_login ? new Date(u.last_login).toLocaleString('es-ES') : 'Nunca'
      }));
      
      setUsers(formattedUsers);
    } catch (error) {
      console.error('Error cargando usuarios:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('¿Estás seguro de eliminar este usuario?')) {
      try {
        await usuariosApi.delete(id);
        fetchUsers();
      } catch (error) {
        console.error('Error eliminando usuario:', error);
      }
    }
  };

  const handleToggleStatus = async (id) => {
    try {
      await usuariosApi.toggleStatus(id);
      fetchUsers();
    } catch (error) {
      console.error('Error cambiando estado:', error);
    }
  };

  const handleCreateUser = async () => {
    setSaveError('');
    if (!form.nombre || !form.usuario || !form.password) {
      setSaveError('Nombre, usuario y contraseña son requeridos.');
      return;
    }
    if (form.rol === 'cocinero' && !form.puesto_cocina_id) {
      setSaveError('El cocinero debe tener un puesto de cocina asignado.');
      return;
    }
    try {
      await usuariosApi.create({
        nombre: form.nombre,
        usuario: form.usuario,
        email: form.email || null,
        password: form.password,
        rol: form.rol,
        activo: form.activo,
        puesto_cocina_id: form.rol === 'cocinero' ? Number(form.puesto_cocina_id) : null
      });
      setModalOpen(false);
      fetchUsers();
    } catch (error) {
      console.error('Error creando usuario:', error);
      setSaveError(error.response?.data?.message || 'Error al crear el usuario.');
    }
  };

  // Fecha actual
  const today = new Date().toLocaleDateString('es-ES', {
    day: 'numeric',
    month: 'long',
    year: 'numeric'
  });

  // Cálculos para KPIs
  const totalUsers = users.length;
  const adminCount = users.filter(u => u.role === 'admin').length;
  const cocineroCount = users.filter(u => u.role === 'cocinero').length;
  const activeCount = users.filter(u => u.status === 'activo').length;

  // Filtrar usuarios
  const filteredUsers = users.filter(user => {
    const matchesSearch = user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         user.email.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesRole = roleFilter === 'todos' || user.role === roleFilter;
    const matchesStatus = statusFilter === 'todos' || user.status === statusFilter;
    return matchesSearch && matchesRole && matchesStatus;
  });

  const getInitials = (name) => {
    return name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();
  };

  const getAvatarColor = (name) => {
    const colors = ['bg-orange-500', 'bg-blue-500', 'bg-green-500', 'bg-purple-500'];
    let hash = 0;
    for (let i = 0; i < name.length; i++) {
      hash = name.charCodeAt(i) + ((hash << 5) - hash);
    }
    return colors[Math.abs(hash) % colors.length];
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
      <div>
        <h1 className="text-2xl font-semibold text-gray-900">Usuarios</h1>
        <p className="text-gray-400 text-sm mt-1">{today}</p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <KpiCard 
          icon={User} 
          color="blue" 
          number={totalUsers} 
          title="Total usuarios" 
        />
        <KpiCard 
          icon={Shield} 
          color="orange" 
          number={adminCount} 
          title="Administradores" 
        />
        <KpiCard 
          icon={UserCheck} 
          color="green" 
          number={activeCount} 
          title="Usuarios activos" 
        />
      </div>

      {/* Actions Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <p className="text-sm text-gray-500">
          {filteredUsers.length} usuarios · <span className="text-purple-600">{cocineroCount} cocineros</span>
        </p>
        <button 
          className="inline-flex items-center gap-2 px-4 py-2.5 bg-primary hover:bg-primary-dark text-white font-medium rounded-xl shadow-lg shadow-primary/30 transition-all"
          onClick={() => { setForm({ nombre: '', usuario: '', email: '', password: '', rol: 'empleado', puesto_cocina_id: '', activo: 1 }); setSaveError(''); setModalOpen(true); }}
        >
          <Plus size={18} />
          Nuevo Usuario
        </button>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
        <div className="flex flex-col lg:flex-row gap-4">
          {/* Search */}
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
            <input
              type="text"
              placeholder="Buscar por nombre o correo..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-lg focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all"
            />
          </div>
          
          {/* Filter Dropdowns */}
          <div className="flex gap-3">
            <select
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value)}
              className="inline-flex items-center px-4 py-2.5 border border-gray-200 rounded-lg text-sm text-gray-600 hover:border-primary focus:border-primary outline-none bg-white cursor-pointer"
            >
              <option value="todos">Todos los roles</option>
              <option value="admin">Administrador</option>
              <option value="empleado">Empleado</option>
              <option value="cocinero">Cocinero</option>
              <option value="delivery">Delivery</option>
            </select>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="inline-flex items-center px-4 py-2.5 border border-gray-200 rounded-lg text-sm text-gray-600 hover:border-primary focus:border-primary outline-none bg-white cursor-pointer"
            >
              <option value="todos">Todos los estados</option>
              <option value="activo">Activo</option>
              <option value="inactivo">Inactivo</option>
            </select>
          </div>
        </div>
      </div>

      {/* Users Table */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="text-left px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Usuario</th>
                <th className="text-left px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Correo</th>
                <th className="text-left px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Rol</th>
                <th className="text-left px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Puesto</th>
                <th className="text-left px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Estado</th>
                <th className="text-left px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Ingreso</th>
                <th className="text-left px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Último acceso</th>
                <th className="text-center px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filteredUsers.map((user) => (
                <tr key={user.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className={`w-10 h-10 rounded-full ${getAvatarColor(user.name)} flex items-center justify-center text-white text-sm font-bold`}>
                        {getInitials(user.name)}
                      </div>
                      <span className="font-medium text-gray-900">{user.name}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-500">{user.email}</td>
                  <td className="px-6 py-4">
                    <StatusBadge 
                      text={user.role === 'admin' ? 'Administrador' : user.role === 'cocinero' ? 'Cocinero' : user.role === 'delivery' ? 'Delivery' : 'Empleado'} 
                      variant={user.role === 'admin' ? 'admin' : user.role === 'cocinero' ? 'cocinero' : user.role === 'delivery' ? 'empleado' : 'empleado'}
                    />
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-500">
                    {user.puesto || <span className="text-gray-300">—</span>}
                  </td>
                  <td className="px-6 py-4">
                    <StatusBadge 
                      text={user.status === 'activo' ? 'Activo' : 'Inactivo'} 
                      variant={user.status === 'activo' ? 'activo' : 'inactivo'}
                    />
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-500">{user.joined}</td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2 text-sm text-gray-500">
                      <Clock size={14} />
                      {user.lastAccess}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center justify-center gap-2">
                      <ActionButton 
                        icon={Edit3} 
                        text="Editar" 
                        variant="edit"
                        onClick={() => handleToggleStatus(user.id)}
                      />
                      <ActionButton 
                        icon={Trash2} 
                        text="Eliminar" 
                        variant="delete"
                        onClick={() => handleDelete(user.id)}
                      />
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
            Mostrando <span className="font-medium">{filteredUsers.length}</span> de <span className="font-medium">{users.length}</span> usuarios
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
              Página {currentPage} de 1
            </span>
            <button
              onClick={() => setCurrentPage(2)}
              disabled={true}
              className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <ChevronRight size={18} />
            </button>
          </div>
        </div>
      </div>

      {/* Modal crear usuario */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setModalOpen(false)} />
          <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-gray-900">Nuevo Usuario</h2>
              <button onClick={() => setModalOpen(false)} className="text-gray-400 hover:text-gray-600 text-2xl leading-none">&times;</button>
            </div>

            {saveError && (
              <div className="mb-4 bg-red-50 text-red-600 text-sm px-4 py-3 rounded-lg">{saveError}</div>
            )}

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Nombre completo</label>
                <input
                  type="text"
                  value={form.nombre}
                  onChange={(e) => setForm({ ...form, nombre: e.target.value })}
                  className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Usuario</label>
                <input
                  type="text"
                  value={form.usuario}
                  onChange={(e) => setForm({ ...form, usuario: e.target.value })}
                  className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Correo</label>
                <input
                  type="email"
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                  className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Contraseña</label>
                <input
                  type="password"
                  value={form.password}
                  onChange={(e) => setForm({ ...form, password: e.target.value })}
                  className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Rol</label>
                  <select
                    value={form.rol}
                    onChange={(e) => setForm({ ...form, rol: e.target.value, puesto_cocina_id: '' })}
                    className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all"
                  >
                    <option value="empleado">Empleado</option>
                    <option value="cocinero">Cocinero</option>
                    <option value="delivery">Delivery</option>
                    <option value="admin">Administrador</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Estado</label>
                  <select
                    value={form.activo}
                    onChange={(e) => setForm({ ...form, activo: Number(e.target.value) })}
                    className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all"
                  >
                    <option value={1}>Activo</option>
                    <option value={0}>Inactivo</option>
                  </select>
                </div>
              </div>
              {form.rol === 'cocinero' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Puesto de cocina fijo</label>
                  <select
                    value={form.puesto_cocina_id}
                    onChange={(e) => setForm({ ...form, puesto_cocina_id: e.target.value })}
                    className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all"
                  >
                    <option value="">Seleccionar puesto...</option>
                    {puestos.map(p => (
                      <option key={p.id} value={p.id}>{p.nombre}</option>
                    ))}
                  </select>
                  {!form.puesto_cocina_id && (
                    <p className="text-xs text-amber-600 mt-1">Requiere un puesto: el cocinero verá solo ese puesto en su app.</p>
                  )}
                </div>
              )}
            </div>

            <div className="flex gap-3 mt-8">
              <button
                onClick={() => setModalOpen(false)}
                className="flex-1 px-4 py-3 border border-gray-200 text-gray-600 rounded-xl font-medium hover:bg-gray-50 transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={handleCreateUser}
                className="flex-1 px-4 py-3 bg-primary hover:bg-primary-dark text-white rounded-xl font-medium shadow-lg shadow-primary/30 transition-all"
              >
                Crear Usuario
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default Usuarios;
