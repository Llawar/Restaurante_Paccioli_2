import { useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { 
  LayoutDashboard, 
  UtensilsCrossed, 
  Package, 
  ShoppingCart, 
  Truck, 
  Users, 
  FileText,
  Tag,
  ChefHat,
  Settings,
  LogOut,
  ChevronLeft,
  ChevronRight,
  Menu,
  X
} from 'lucide-react';

const navItems = [
  { path: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { path: '/productos', label: 'Productos', icon: UtensilsCrossed },
  { path: '/inventario', label: 'Inventario', icon: Package },
  { path: '/pedidos', label: 'Pedidos', icon: ShoppingCart },
  { path: '/delivery', label: 'Delivery', icon: Truck },
  { path: '/usuarios', label: 'Usuarios', icon: Users },
  { path: '/reportes', label: 'Reportes', icon: FileText },
];

const configItems = [
  { path: '/categorias', label: 'Categorías', icon: Tag },
  { path: '/puestos', label: 'Puestos de Cocina', icon: ChefHat },
];

function Sidebar() {
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const navigate = useNavigate();
  const storedUser = localStorage.getItem('user');
  const user = storedUser ? JSON.parse(storedUser) : null;
  const isAdmin = user?.rol === 'admin';

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    navigate('/login');
  };

  return (
    <>
      {/* Mobile Menu Button */}
      <button
        onClick={() => setMobileOpen(!mobileOpen)}
        className="lg:hidden fixed top-4 left-4 z-50 w-10 h-10 bg-primary rounded-lg flex items-center justify-center text-white shadow-lg"
      >
        {mobileOpen ? <X size={20} /> : <Menu size={20} />}
      </button>

      {/* Mobile Overlay */}
      {mobileOpen && (
        <div 
          className="lg:hidden fixed inset-0 bg-black/50 z-30"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside 
        className={`gradient-sidebar text-white flex flex-col transition-all duration-300 fixed lg:static inset-y-0 left-0 z-40 ${
          collapsed ? 'w-20' : 'w-64'
        } ${mobileOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}`}
      >
        {/* Logo */}
        <div className="h-16 flex items-center justify-center border-b border-sidebar-light">
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 bg-primary rounded-lg flex items-center justify-center flex-shrink-0">
              <UtensilsCrossed size={24} className="text-white" />
            </div>
            {!collapsed && (
              <span className="text-xl font-bold">PACCIOLI</span>
            )}
          </div>
        </div>

        {/* Toggle Button - Desktop only */}
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="hidden lg:flex absolute top-16 -right-3 w-6 h-6 bg-primary rounded-full items-center justify-center text-white shadow-lg hover:bg-primary-dark transition-colors"
        >
          {collapsed ? <ChevronRight size={14} /> : <ChevronLeft size={14} />}
        </button>

        {/* Navigation */}
        <nav className="flex-1 py-6 px-3 overflow-y-auto">
          <ul className="space-y-1">
            {navItems.map((item) => (
              <li key={item.path}>
                <NavLink
                  to={item.path}
                  onClick={() => setMobileOpen(false)}
                  className={({ isActive }) =>
                    `flex items-center gap-3 px-3 py-3 rounded-lg transition-all duration-200 ${
                      isActive
                        ? 'bg-primary text-white'
                        : 'text-gray-300 hover:bg-sidebar-light hover:text-white'
                    }`
                  }
                >
                  <item.icon size={20} className="flex-shrink-0" />
                  {!collapsed && (
                    <span className="font-medium whitespace-nowrap">{item.label}</span>
                  )}
                </NavLink>
              </li>
            ))}

            {isAdmin && (
              <>
                <li className="pt-4 pb-1">
                  {!collapsed && (
                    <div className="flex items-center gap-2 px-3 text-xs font-semibold text-gray-400 uppercase tracking-wider">
                      <Settings size={13} />
                      Configuración
                    </div>
                  )}
                  {collapsed && <div className="border-t border-sidebar-light mx-3 my-3" />}
                </li>
                {configItems.map((item) => (
                  <li key={item.path}>
                    <NavLink
                      to={item.path}
                      onClick={() => setMobileOpen(false)}
                      className={({ isActive }) =>
                        `flex items-center gap-3 px-3 py-3 rounded-lg transition-all duration-200 ${
                          isActive
                            ? 'bg-primary text-white'
                            : 'text-gray-300 hover:bg-sidebar-light hover:text-white'
                        }`
                      }
                    >
                      <item.icon size={20} className="flex-shrink-0" />
                      {!collapsed && (
                        <span className="font-medium whitespace-nowrap">{item.label}</span>
                      )}
                    </NavLink>
                  </li>
                ))}
              </>
            )}
          </ul>
        </nav>

        {/* User Section */}
        <div className="border-t border-sidebar-light p-4">
          <div className={`flex items-center gap-3 ${collapsed ? 'justify-center' : ''}`}>
            <div className="w-10 h-10 rounded-full bg-primary flex items-center justify-center flex-shrink-0">
              <span className="text-sm font-bold">AD</span>
            </div>
            {!collapsed && (
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">Admin Demo</p>
                <p className="text-xs text-gray-400">Administrador</p>
              </div>
            )}
          </div>
          <button
            onClick={handleLogout}
            className={`mt-3 flex items-center gap-2 text-gray-400 hover:text-white transition-colors ${
              collapsed ? 'justify-center w-full' : ''
            }`}
          >
            <LogOut size={18} />
            {!collapsed && <span className="text-sm">Cerrar sesión</span>}
          </button>
        </div>
      </aside>
    </>
  );
}

export default Sidebar;
