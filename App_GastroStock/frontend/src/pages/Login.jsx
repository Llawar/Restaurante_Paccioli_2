import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Eye, 
  EyeOff, 
  Warehouse,
  Boxes,
  Truck,
  ClipboardList,
  AlertTriangle,
  Loader2
} from 'lucide-react';
import { authApi } from '../services/auth.service';

function Login() {
  const navigate = useNavigate();
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [formData, setFormData] = useState({
    usuario: '',
    password: ''
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    
    try {
      const response = await authApi.login({
        usuario: formData.usuario,
        password: formData.password
      });
      
      if (response.data?.success) {
        localStorage.setItem('token', response.data.data?.token);
        localStorage.setItem('user', JSON.stringify(response.data.data?.user));
        navigate('/dashboard');
      } else {
        setError(response.data?.message || 'Error al iniciar sesión');
      }
    } catch (err) {
      console.error('Login error:', err);
      setError(err.response?.data?.message || 'Error de conexión');
    } finally {
      setLoading(false);
    }
  };

  const fillDemoData = () => {
    setFormData({ usuario: 'admin', password: 'admin123' });
  };

  return (
    <div className="min-h-screen flex">
      {/* Lado Izquierdo - Oscuro verde */}
      <div className="hidden lg:flex lg:w-1/2 gradient-login text-on-accent flex-col justify-between p-12 relative overflow-hidden">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-20 left-20 w-64 h-64 bg-[#ffffff] rounded-full blur-3xl"></div>
          <div className="absolute bottom-20 right-20 w-96 h-96 bg-primary rounded-full blur-3xl"></div>
        </div>

        <div className="relative z-10 flex items-center gap-3">
          <div className="w-12 h-12 bg-primary rounded-xl flex items-center justify-center">
            <Warehouse size={28} className="text-on-accent" />
          </div>
          <span className="text-2xl font-bold">GASTROSTOCK</span>
        </div>

        <div className="relative z-10 max-w-lg">
          <h1 className="text-4xl md:text-5xl font-bold mb-6 leading-tight">
            Gestión de inventario del almacén
          </h1>
          <p className="text-lg text-[#d1d5db] mb-12">
            Control total de entradas, salidas, lotes y stock
          </p>

          <div className="grid grid-cols-2 gap-4">
            <div className="bg-[#ffffff]/10 backdrop-blur-sm rounded-xl p-4 border border-[#ffffff]/20 hover:bg-[#ffffff]/20 transition-colors">
              <Boxes className="w-8 h-8 text-primary mb-2" />
              <h3 className="font-semibold text-sm">Lotes y PEPS</h3>
            </div>
            <div className="bg-[#ffffff]/10 backdrop-blur-sm rounded-xl p-4 border border-[#ffffff]/20 hover:bg-[#ffffff]/20 transition-colors">
              <Truck className="w-8 h-8 text-primary mb-2" />
              <h3 className="font-semibold text-sm">Proveedores</h3>
            </div>
            <div className="bg-[#ffffff]/10 backdrop-blur-sm rounded-xl p-4 border border-[#ffffff]/20 hover:bg-[#ffffff]/20 transition-colors">
              <ClipboardList className="w-8 h-8 text-primary mb-2" />
              <h3 className="font-semibold text-sm">Kardex completo</h3>
            </div>
            <div className="bg-[#ffffff]/10 backdrop-blur-sm rounded-xl p-4 border border-[#ffffff]/20 hover:bg-[#ffffff]/20 transition-colors">
              <AlertTriangle className="w-8 h-8 text-primary mb-2" />
              <h3 className="font-semibold text-sm">Alertas de stock</h3>
            </div>
          </div>
        </div>

        <div className="relative z-10 text-sm text-[#9ca3af]">
          © 2026 GASTROSTOCK. Sistema de inventario del almacén.
        </div>
      </div>

      {/* Lado Derecho - Claro */}
      <div className="w-full lg:w-1/2 bg-app flex items-center justify-center p-8">
        <div className="w-full max-w-md">
          <div className="lg:hidden flex items-center justify-center gap-3 mb-8">
            <div className="w-10 h-10 bg-primary rounded-lg flex items-center justify-center">
              <Warehouse size={20} className="text-on-accent" />
            </div>
            <span className="text-xl font-bold text-gray-900">GASTROSTOCK</span>
          </div>

          <div className="bg-white rounded-2xl shadow-xl p-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Iniciar Sesión</h2>
            <p className="text-gray-500 mb-6">Accede al sistema de inventario del almacén</p>

            <form onSubmit={handleSubmit} className="space-y-5">
              {error && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-3 flex items-center gap-2">
                  <span className="text-red-600 text-sm">{error}</span>
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Usuario
                </label>
                <input
                  type="text"
                  value={formData.usuario}
                  onChange={(e) => setFormData({ ...formData, usuario: e.target.value })}
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all"
                  placeholder="admin"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Contraseña
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all pr-12"
                    placeholder="••••••••"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-4 bg-primary hover:bg-primary-dark text-on-accent font-semibold rounded-xl shadow-lg shadow-primary/30 transition-all hover:shadow-xl hover:shadow-primary/40 active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {loading ? (
                  <>
                    <Loader2 size={20} className="animate-spin" />
                    Iniciando sesión...
                  </>
                ) : (
                  'Iniciar Sesión'
                )}
              </button>
            </form>

            <div className="mt-6 pt-6 border-t border-gray-100">
              <p className="text-sm text-gray-500 text-center mb-4">Acceso rápido (demo)</p>
              <button
                type="button"
                onClick={fillDemoData}
                className="w-full py-2 px-4 border border-gray-200 rounded-lg text-sm font-medium text-gray-700 hover:border-primary hover:text-primary transition-colors"
              >
                Admin
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Login;
