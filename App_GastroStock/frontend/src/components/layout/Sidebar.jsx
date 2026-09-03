import { useState } from 'react';
import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  Package,
  Tag,
  Layers,
  Ruler,
  Truck,
  Boxes,
  ShoppingCart,
  ClipboardList,
  Database,
  AlertTriangle,
  MapPin,
  Warehouse,
  LogOut,
  ChevronDown,
  ChevronRight,
  BookOpen,
} from 'lucide-react';

const navItems = [
  { path: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
];

const inventarioItems = [
  { path: '/productos', label: 'Productos', icon: Package },
  { path: '/categorias', label: 'Categorías', icon: Tag },
  { path: '/subcategorias', label: 'Subcategorías', icon: Layers },
  { path: '/unidades', label: 'Unidades de Medida', icon: Ruler },
  { path: '/ubicaciones', label: 'Ubicaciones', icon: MapPin },
];

const operacionesItems = [
  { path: '/proveedores', label: 'Proveedores', icon: Truck },
  { path: '/compras', label: 'Compras', icon: ShoppingCart },
  { path: '/lotes', label: 'Lotes', icon: Boxes },
  { path: '/kardex', label: 'Kardex', icon: ClipboardList },
  { path: '/inventario-fisico', label: 'Inventario Físico', icon: Database },
  { path: '/alertas', label: 'Alertas', icon: AlertTriangle },
];

function Sidebar({ open = false, onClose }) {
  const [inventarioOpen, setInventarioOpen] = useState(true);
  const [operacionesOpen, setOperacionesOpen] = useState(true);

  const user = JSON.parse(localStorage.getItem('user') || '{}');
  const initials = (user.nombre || 'GS').split(' ').map(p => p[0]).join('').slice(0, 2).toUpperCase();

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    window.location.href = '/login';
  };

  const Section = ({ title, icon: Icon, open, setOpen, items }) => (
    <div className="mb-1">
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between px-4 py-2.5 text-sm font-semibold text-[#d1d5db] hover:bg-sidebar-light/50 rounded-lg transition-colors"
      >
        <span className="flex items-center gap-3">
          <Icon size={18} />
          {title}
        </span>
        {open ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
      </button>
      {open && (
        <div className="ml-4">
          {items.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              onClick={onClose}
              className={({ isActive }) =>
                `flex items-center gap-3 px-4 py-2.5 text-sm rounded-lg transition-colors ${
                  isActive
                    ? 'bg-primary text-on-accent font-medium'
                    : 'text-[#9ca3af] hover:bg-sidebar-light/50 hover:text-on-accent'
                }`
              }
            >
              <item.icon size={17} />
              {item.label}
            </NavLink>
          ))}
        </div>
      )}
    </div>
  );

  return (
    <>
      {/* Sidebar móvil: deslizante (off-canvas) */}
      <aside
        className={`fixed inset-y-0 left-0 z-40 w-72 gradient-sidebar text-on-accent transform transition-transform duration-300 ease-in-out lg:hidden ${
          open ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="flex items-center gap-3 px-6 py-5 border-b border-white/10">
          <div className="w-10 h-10 bg-primary rounded-xl flex items-center justify-center">
            <Warehouse size={22} className="text-on-accent" />
          </div>
          <div>
            <span className="text-lg font-bold">GASTROSTOCK</span>
            <p className="text-xs text-[#9ca3af]">Gestión de Inventario</p>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto py-4 h-[calc(100vh-5rem)]">
          <NavLink
            to="/dashboard"
            onClick={onClose}
            className={({ isActive }) =>
              `flex items-center gap-3 px-4 py-2.5 text-sm rounded-lg mx-2 transition-colors ${
                isActive ? 'bg-primary text-on-accent font-medium' : 'text-[#d1d5db] hover:bg-sidebar-light/50'
              }`
            }
          >
            <LayoutDashboard size={18} />
            Dashboard
          </NavLink>

          <NavLink
            to="/manual"
            onClick={onClose}
            className={({ isActive }) =>
              `flex items-center gap-3 px-4 py-2.5 text-sm rounded-lg mx-2 transition-colors ${
                isActive ? 'bg-primary text-on-accent font-medium' : 'text-[#d1d5db] hover:bg-sidebar-light/50'
              }`
            }
          >
            <BookOpen size={18} />
            Manual
          </NavLink>

          <div className="px-4 pt-5 pb-2 text-xs font-semibold text-[#8b95a0] uppercase tracking-wider">
            Catálogo
          </div>
          <Section
            title="Inventario"
            icon={Warehouse}
            open={inventarioOpen}
            setOpen={setInventarioOpen}
            items={inventarioItems}
          />

          <div className="px-4 pt-5 pb-2 text-xs font-semibold text-[#8b95a0] uppercase tracking-wider">
            Operaciones
          </div>
          <Section
            title="Movimientos"
            icon={ClipboardList}
            open={operacionesOpen}
            setOpen={setOperacionesOpen}
            items={operacionesItems}
          />
        </div>

        <div className="p-4 border-t border-white/10">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-full bg-primary flex items-center justify-center font-bold text-sm">
              {initials}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate">{user.nombre || 'Usuario'}</p>
              <p className="text-xs text-[#9ca3af] capitalize">{user.rol || ''}</p>
            </div>
            <button onClick={handleLogout} className="text-[#9ca3af] hover:text-on-accent p-1" title="Cerrar sesión">
              <LogOut size={18} />
            </button>
          </div>
        </div>
      </aside>

      {/* Sidebar desktop: fijo, solo en pantallas grandes */}
      <aside className="w-64 gradient-sidebar text-on-accent flex flex-col flex-shrink-0 hidden lg:flex">
        <div className="flex items-center gap-3 px-6 py-5 border-b border-white/10">
          <div className="w-10 h-10 bg-primary rounded-xl flex items-center justify-center">
            <Warehouse size={22} className="text-on-accent" />
          </div>
          <div>
            <span className="text-lg font-bold">GASTROSTOCK</span>
            <p className="text-xs text-[#9ca3af]">Gestión de Inventario</p>
          </div>
        </div>

        <nav className="flex-1 overflow-y-auto py-4">
          <NavLink
            to="/dashboard"
            className={({ isActive }) =>
              `flex items-center gap-3 px-4 py-2.5 text-sm rounded-lg mx-2 transition-colors ${
                isActive ? 'bg-primary text-on-accent font-medium' : 'text-[#d1d5db] hover:bg-sidebar-light/50'
              }`
            }
          >
            <LayoutDashboard size={18} />
            Dashboard
          </NavLink>

          <NavLink
            to="/manual"
            className={({ isActive }) =>
              `flex items-center gap-3 px-4 py-2.5 text-sm rounded-lg mx-2 transition-colors ${
                isActive ? 'bg-primary text-on-accent font-medium' : 'text-[#d1d5db] hover:bg-sidebar-light/50'
              }`
            }
          >
            <BookOpen size={18} />
            Manual
          </NavLink>

          <div className="px-4 pt-5 pb-2 text-xs font-semibold text-[#8b95a0] uppercase tracking-wider">
            Catálogo
          </div>
          <Section
            title="Inventario"
            icon={Warehouse}
            open={inventarioOpen}
            setOpen={setInventarioOpen}
            items={inventarioItems}
          />

          <div className="px-4 pt-5 pb-2 text-xs font-semibold text-[#8b95a0] uppercase tracking-wider">
            Operaciones
          </div>
          <Section
            title="Movimientos"
            icon={ClipboardList}
            open={operacionesOpen}
            setOpen={setOperacionesOpen}
            items={operacionesItems}
          />
        </nav>

        <div className="p-4 border-t border-white/10">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-full bg-primary flex items-center justify-center font-bold text-sm">
              {initials}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate">{user.nombre || 'Usuario'}</p>
              <p className="text-xs text-[#9ca3af] capitalize">{user.rol || ''}</p>
            </div>
            <button onClick={handleLogout} className="text-[#9ca3af] hover:text-on-accent p-1" title="Cerrar sesión">
              <LogOut size={18} />
            </button>
          </div>
        </div>
      </aside>
    </>
  );
}

export default Sidebar;

