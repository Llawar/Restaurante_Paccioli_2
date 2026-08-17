import { useState, useEffect } from 'react';
import { io } from 'socket.io-client';
import { ChefHat, CheckCircle, Clock, LogOut, User as UserIcon, Lock, AlertCircle } from 'lucide-react';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:3006';
const API_URL = `${API_BASE}/api`;
const socket = io(API_BASE);
const TOKEN_KEY = 'cocina_token';
const USER_KEY = 'cocina_user';

interface Pedido {
  detalle_id: number;
  pedido_id: number;
  producto_nombre: string;
  cantidad: number;
  estado_cocina: string;
  notas_item?: string;
  numero_mesa?: number;
  hora_pedido: string;
}

interface Puesto {
  id: number;
  nombre: string;
  descripcion: string;
}

interface Usuario {
  id: number;
  nombre: string;
  usuario: string;
  rol: string;
}

const apiFetch = async (url: string, options: RequestInit = {}) => {
  const token = localStorage.getItem(TOKEN_KEY);
  const headers = new Headers(options.headers || {});
  if (token) headers.set('Authorization', `Bearer ${token}`);
  if (options.body) headers.set('Content-Type', 'application/json');

  const response = await fetch(url, { ...options, headers });

  if (response.status === 401) {
    logout();
    throw new Error('Sesión expirada');
  }
  return response;
};

const logout = () => {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(USER_KEY);
};

function LoginScreen({ onLogin }: { onLogin: (usuario: Usuario, token: string) => void }) {
  const [usuario, setUsuario] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!usuario || !password) {
      setError('Ingresa usuario y contraseña');
      return;
    }

    setLoading(true);
    setError('');
    try {
      const r = await fetch(`${API_URL}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ usuario, password })
      });
      const data = await r.json();

      if (!r.ok || !data.success) {
        setError(data.message || 'Credenciales inválidas');
        return;
      }

      const user = data.data.user;
      const rolesPermitidos = ['admin', 'empleado', 'cocinero'];
      if (!rolesPermitidos.includes(user.rol)) {
        setError('Este usuario no tiene acceso al módulo de cocina');
        return;
      }

      localStorage.setItem(TOKEN_KEY, data.data.token);
      localStorage.setItem(USER_KEY, JSON.stringify(user));
      onLogin(user, data.data.token);
    } catch (err: any) {
      setError(err.message || 'Error de conexión con el servidor');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#111827] flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-[#1f2937] rounded-3xl p-8 border-gold-glow card-gold-glow">
        <div className="flex flex-col items-center mb-8">
          <div className="w-20 h-20 bg-gradient-to-br from-amber-400 to-amber-600 rounded-full flex items-center justify-center mb-4 shadow-lg shadow-amber-500/50">
            <ChefHat className="text-[#111827]" size={40} />
          </div>
          <h1 className="text-2xl font-bold text-amber-400">App Cocina</h1>
          <p className="text-gray-400 text-sm mt-1">Inicia sesión con tu cuenta</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm text-gray-400 mb-1 flex items-center gap-2">
              <UserIcon size={14} /> Usuario
            </label>
            <input
              type="text"
              value={usuario}
              onChange={(e) => setUsuario(e.target.value)}
              placeholder="Tu usuario"
              className="w-full px-4 py-3 bg-[#111827] border border-gray-700 rounded-xl text-white placeholder-gray-500 focus:border-amber-500 focus:outline-none"
            />
          </div>
          <div>
            <label className="block text-sm text-gray-400 mb-1 flex items-center gap-2">
              <Lock size={14} /> Contraseña
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Tu contraseña"
              className="w-full px-4 py-3 bg-[#111827] border border-gray-700 rounded-xl text-white placeholder-gray-500 focus:border-amber-500 focus:outline-none"
            />
          </div>

          {error && (
            <div className="flex items-center gap-2 text-red-400 text-sm bg-red-500/10 border border-red-500/30 rounded-xl px-4 py-3">
              <AlertCircle size={16} /> {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-amber-500 hover:bg-amber-600 disabled:opacity-50 text-[#111827] py-3 rounded-xl font-bold btn-gold-glow transition"
          >
            {loading ? 'Ingresando...' : 'INGRESAR'}
          </button>
        </form>
      </div>
    </div>
  );
}

export default function App() {
  const [usuario, setUsuario] = useState<Usuario | null>(null);
  const [puestoSeleccionado, setPuestoSeleccionado] = useState<number | null>(null);
  const [puestoInfo, setPuestoInfo] = useState<Puesto | null>(null);
  const [puestos, setPuestos] = useState<Puesto[]>([]);
  const [pedidos, setPedidos] = useState<Pedido[]>([]);
  const [esCocinero, setEsCocinero] = useState(false);

  // Recuperar sesión guardada
  useEffect(() => {
    const storedUser = localStorage.getItem(USER_KEY);
    const storedToken = localStorage.getItem(TOKEN_KEY);
    if (storedUser && storedToken) {
      setUsuario(JSON.parse(storedUser));
    }
  }, []);

  // Al haber usuario, cargar su puesto asignado
  useEffect(() => {
    if (!usuario) return;

    (async () => {
      try {
        const r = await apiFetch(`${API_URL}/cocina/mi-puesto`);
        const data = await r.json();
        if (data.success) {
          setEsCocinero(data.data.esCocinero);
          if (data.data.puesto) {
            // Cocinero con puesto fijo
            setPuestoInfo(data.data.puesto);
            setPuestoSeleccionado(data.data.puesto.id);
          } else {
            // Admin/empleado: carga lista de puestos para elegir
            const rPuestos = await apiFetch(`${API_URL}/cocina/puestos`);
            const dataPuestos = await rPuestos.json();
            if (dataPuestos.success) setPuestos(dataPuestos.data);
          }
        }
      } catch (error: any) {
        console.error('Error cargando puesto:', error);
        if (error.message !== 'Sesión expirada') {
          alert('Error al cargar tu puesto. Verifica la conexión.');
        }
      }
    })();
  }, [usuario]);

  // Cargar pedidos del puesto
  const cargarPedidos = async () => {
    if (!puestoSeleccionado) return;
    try {
      const r = await apiFetch(`${API_URL}/cocina/pedidos/${puestoSeleccionado}`);
      const data = await r.json();
      if (data.success) setPedidos(data.data);
    } catch (error: any) {
      console.error('Error cargando pedidos:', error);
      if (error.message === 'Sesión expirada') {
        setUsuario(null);
        setPuestoSeleccionado(null);
      }
    }
  };

  useEffect(() => {
    cargarPedidos();

    // Escuchar actualizaciones de items existentes
    socket.on('kitchen:order_updated', () => {
      console.log('Item actualizado, recargando...');
      cargarPedidos();
    });

    // Escuchar NUEVOS pedidos
    socket.on('kitchen:new_order', (data) => {
      console.log('Nuevo pedido recibido:', data);
      const audio = new Audio('data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2/LDciUFLIHO8tiJNwgZaLvt559NEzxQsfHYiTgGHm7A7+OZSA0+WbTy2YUvBhxqv+zplkcNOVGz8tiHNwcfaLvu5pZIDTxPsfvhhl0JHGm98OubSw0+UrLx2YU2Bhxqv+zplkcNOVGz8tiHNwcfaLvu5pZIDTxPsfvhhl0JHGm98OubSw0+UrLx2YU2Bhxqv+zplkcNOVGz8tiHNwcfaLvu5pZIDTxPsfvhhl0JHGm98OubSw0+UrLx2YU2Bhxqv+zplkcNOVGz8tiHNwcfaLvu5pZIDTxPsfvhhl0JHGm98OubSw0+UrLx2YU2Bhxqv+zplkcNOVGz8tiHNwcfaLvu5pZIDTxPsfvhhl0JHGm98OubSw0+UrLx2YU2Bhxqv+zplkcNOVGz8tiHNwcfaLvu5pZIDTxPsfvhhl0JHGm98OubSw0+UrLx2YU2Bhxqv+zplkcNOVGz8tiHNwcfaLvu5pZIDTxPsfvhhl0JHGm98OubSw0+UrLx2YU2Bhxqv+zplkcNOVGz8tiHNwcfaLvu5pZIDTxPsfvhhl0JHGm98OubSw0+UrLx2YU2Bhxqv+zplkcNOVGz8tiHNwcfaLvu5pZIDTxPsfvhhl0JHGm98OubSw0+UrLx2YU2Bhxqv+zplkcNOVGz8tiHNwcfaLvu5pZIDTxPsfvhhl0JHGm98OubSw0+UrLx2YU2Bhxqv+zplkcNOVGz8tiHNwcfaLvu5pZIDTxPsfvhhl0JHGm98OubSw0+UrLx2YU2Bhxqv+zplkcNOVGz8tiHNwcfaLvu5pZIDTxPsfvhhl0JHGm98OubSw0+UrLx2YU2B');
      audio.play().catch(() => {});
      cargarPedidos();
    });

    return () => {
      socket.off('kitchen:order_updated');
      socket.off('kitchen:new_order');
    };
  }, [puestoSeleccionado]);

  const cambiarEstado = async (detalleId: number, nuevoEstado: string) => {
    try {
      await apiFetch(`${API_URL}/cocina/item/${detalleId}/estado`, {
        method: 'PUT',
        body: JSON.stringify({ nuevoEstado })
      });
      cargarPedidos();
    } catch (error: any) {
      console.error('Error cambiando estado:', error);
      if (error.message === 'Sesión expirada') {
        setUsuario(null);
        setPuestoSeleccionado(null);
      }
    }
  };

  const cerrarSesion = () => {
    logout();
    setUsuario(null);
    setPuestoSeleccionado(null);
    setPuestoInfo(null);
  };

  // Sin sesión → pantalla de login
  if (!usuario) {
    return <LoginScreen onLogin={(u) => setUsuario(u)} />;
  }

  // Cocinero fijo a su puesto pero aún cargando su información
  if (esCocinero && puestoSeleccionado === null) {
    return (
      <div className="min-h-screen bg-[#111827] flex items-center justify-center">
        <div className="text-center text-gray-400">
          <ChefHat size={48} className="mx-auto mb-4 animate-pulse" />
          <p>Cargando tu puesto...</p>
        </div>
      </div>
    );
  }

  // Admin/empleado sin puesto asignado → selección manual
  if (!esCocinero && puestoSeleccionado === null) {
    return (
      <div className="min-h-screen bg-[#111827] p-4">
        <div className="max-w-md mx-auto mb-8 flex justify-end">
          <button onClick={cerrarSesion} className="text-gray-400 hover:text-red-400 text-sm flex items-center gap-1">
            <LogOut size={16} /> {usuario.nombre} · Salir
          </button>
        </div>
        <h1 className="text-2xl font-bold text-center mb-8 pt-8 text-white">Selecciona tu Puesto</h1>
        <div className="grid gap-4 max-w-md mx-auto">
          {puestos.map(p => (
            <button key={p.id} onClick={() => setPuestoSeleccionado(p.id)}
              className="bg-[#1f2937] p-6 rounded-2xl shadow-lg text-left active:scale-95 transition border-gold-glow hover:border-amber-400">
              <div className="flex items-center gap-4">
                <ChefHat className="text-amber-400" size={32} />
                <div>
                  <h2 className="font-bold text-lg text-white">{p.nombre}</h2>
                  <p className="text-gray-400 text-sm">{p.descripcion}</p>
                </div>
              </div>
            </button>
          ))}
        </div>
      </div>
    );
  }

  const nombrePuesto = puestoInfo?.nombre || puestos.find(p => p.id === puestoSeleccionado)?.nombre || '';

  return (
    <div className="min-h-screen bg-[#111827]">
      {/* Header */}
      <div className="bg-[#1f2937] text-white p-4 sticky top-0 z-10 border-b border-amber-500/50 shadow-lg shadow-amber-500/10">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="font-bold text-lg text-amber-400">{nombrePuesto}</h1>
            <p className="text-gray-400 text-xs">{usuario.nombre}{esCocinero ? ' · Cocinero' : ''}</p>
          </div>
          <button onClick={cerrarSesion} className="text-sm bg-amber-500/20 text-amber-400 px-3 py-1 rounded hover:bg-amber-500/30 transition flex items-center gap-1">
            <LogOut size={14} /> Salir
          </button>
        </div>
      </div>

      {/* Lista de pedidos */}
      <div className="p-4 space-y-4 pb-24">
        {pedidos.length === 0 ? (
          <div className="text-center text-gray-500 mt-12">
            <ChefHat size={64} className="mx-auto mb-4 opacity-30" />
            <p>No hay pedidos pendientes</p>
          </div>
        ) : (
          pedidos.map(p => (
            <div key={p.detalle_id} className={`bg-[#1f2937] rounded-2xl p-4 border-gold-glow ${
              p.estado_cocina === 'en_preparacion' ? 'border-l-4 border-l-amber-400 shadow-lg shadow-amber-400/20' : ''
            }`}>
              <div className="flex justify-between items-start mb-3">
                <div>
                  <span className="text-xs font-bold bg-gray-800 text-gray-300 px-2 py-1 rounded">Pedido #{p.pedido_id}</span>
                  {p.numero_mesa && <span className="text-xs bg-amber-500/20 text-amber-400 px-2 py-1 rounded ml-2">Mesa {p.numero_mesa}</span>}
                </div>
                <span className="text-xs text-gray-500">{new Date(p.hora_pedido).toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'})}</span>
              </div>

              <h2 className="font-bold text-xl mb-1 text-white">{p.cantidad}x {p.producto_nombre}</h2>
              {p.notas_item && <p className="text-sm text-gray-400 mb-3">{p.notas_item}</p>}

              {/* Botones de acción */}
              <div className="flex gap-2 mt-4">
                {p.estado_cocina === 'pendiente' && (
                  <button onClick={() => cambiarEstado(p.detalle_id, 'en_preparacion')}
                    className="flex-1 bg-amber-500 hover:bg-amber-600 text-[#111827] py-3 rounded-xl font-bold flex items-center justify-center gap-2 transition btn-gold-glow">
                    <Clock size={20} /> Empezar
                  </button>
                )}
                {p.estado_cocina === 'en_preparacion' && (
                  <button onClick={() => cambiarEstado(p.detalle_id, 'listo')}
                    className="flex-1 bg-emerald-500 hover:bg-emerald-600 text-white py-3 rounded-xl font-bold flex items-center justify-center gap-2 transition">
                    <CheckCircle size={20} /> Listo
                  </button>
                )}
                {p.estado_cocina === 'listo' && (
                  <div className="flex-1 bg-emerald-500/20 text-emerald-400 py-3 rounded-xl font-bold text-center flex items-center justify-center gap-2 border border-emerald-500/30">
                    <CheckCircle size={20} /> Completado
                  </div>
                )}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}