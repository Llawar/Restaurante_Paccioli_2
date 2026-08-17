import React, { useState, useEffect, useMemo } from 'react';
import { io } from 'socket.io-client';
import { motion, AnimatePresence } from 'motion/react';
import { 
  ShoppingCart, 
  Search, 
  Plus, 
  Minus, 
  X, 
  ChevronRight, 
  CheckCircle2, 
  Wifi, 
  WifiOff, 
  Clock, 
  ArrowLeft,
  QrCode,
  AlertCircle,
  Loader2
} from 'lucide-react';
import { Product, CartItem, Screen } from './types';
import { apiService, ApiProduct } from './api';

// Conexión WebSocket al backend
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3006/api';
const socket = io(API_URL.replace('/api', ''), {
  transports: ['websocket', 'polling'],
  reconnection: true,
  reconnectionAttempts: Infinity,
  reconnectionDelay: 1000,
  reconnectionDelayMax: 5000,
  timeout: 10000
});

// Placeholder local para productos sin imagen (no depende de servicios externos)
const PLACEHOLDER_IMAGE = 'data:image/svg+xml,' + encodeURIComponent(
  '<svg xmlns="http://www.w3.org/2000/svg" width="500" height="400" viewBox="0 0 500 400"><rect width="500" height="400" fill="#f3e9dc"/><text x="250" y="195" font-family="Arial, sans-serif" font-size="28" fill="#b08968" text-anchor="middle">Sin imagen</text></svg>'
);

const handleImageError = (e: React.SyntheticEvent<HTMLImageElement>) => {
  e.currentTarget.src = PLACEHOLDER_IMAGE;
};

// Mapeo de categorías de API a categorías de la app
const mapCategory = (catName: string): 'platos' | 'bebidas' | 'postres' => {
  const cat = catName.toLowerCase();
  if (cat.includes('bebida') && !cat.includes('alcohol')) return 'bebidas';
  if (cat.includes('postre') || cat.includes('dulce')) return 'postres';
  return 'platos';
};

// Transformar producto de API a formato de la app
const mapApiProduct = (p: ApiProduct): Product => ({
  id: p.id.toString(),
  name: p.nombre,
  description: p.descripcion || '',
  price: parseFloat(p.precio.toString()),
  category: mapCategory(p.categoria_nombre),
  image: p.imagen ? `${API_URL.replace('/api', '')}${p.imagen}` : PLACEHOLDER_IMAGE,
  available: p.disponible === 1
});

export default function App() {
  const [screen, setScreen] = useState<Screen>('home');
  const [category, setCategory] = useState<'platos' | 'bebidas' | 'postres'>('platos');
  const [cart, setCart] = useState<CartItem[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [modalQuantity, setModalQuantity] = useState(1);
  const [isOnline, setIsOnline] = useState(true);
  const [qrTimer, setQrTimer] = useState(600);
  const [isProcessing, setIsProcessing] = useState(false);
  const [orderNumber] = useState(() => Math.floor(Math.random() * 9000) + 1000);
  
  // Productos desde la API
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  // Cargar productos desde la API
  useEffect(() => {
    const loadProducts = async () => {
      try {
        setLoading(true);
        const apiProducts = await apiService.getProducts();
        const mapped = apiProducts.map(mapApiProduct);
        setProducts(mapped);
        setIsOnline(true);
        setError(null);
        setLastUpdated(new Date());
      } catch (err) {
        setError('No se pudieron cargar los productos');
        setIsOnline(false);
      } finally {
        setLoading(false);
      }
    };

    const handleProductsChanged = () => {
      console.log('Productos actualizados desde el servidor, recargando...');
      loadProducts();
    };

    const handleSocketConnect = () => {
      console.log('Socket conectado, sincronizando productos...');
      setIsOnline(true);
      loadProducts();
    };

    const handleSocketDisconnect = () => {
      console.log('Socket desconectado');
      setIsOnline(false);
    };

    loadProducts();
    
    // Escuchar eventos WebSocket para actualizaciones en tiempo real
    socket.on('products:changed', handleProductsChanged);
    socket.on('connect', handleSocketConnect);
    socket.on('disconnect', handleSocketDisconnect);

    // Respaldo: refresco periódico silencioso por si el socket falla
    const refreshInterval = setInterval(() => {
      loadProducts();
    }, 60000);

    // Cleanup
    return () => {
      socket.off('products:changed', handleProductsChanged);
      socket.off('connect', handleSocketConnect);
      socket.off('disconnect', handleSocketDisconnect);
      clearInterval(refreshInterval);
    };
  }, []);

  // QR Timer
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (screen === 'payment' && qrTimer > 0) {
      interval = setInterval(() => setQrTimer(t => t - 1), 1000);
    }
    return () => clearInterval(interval);
  }, [screen, qrTimer]);

  // Auto-reset after success
  useEffect(() => {
    if (screen === 'success') {
      const timer = setTimeout(() => {
        setScreen('home');
        setCart([]);
        setQrTimer(600);
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [screen]);

  const filteredProducts = useMemo(() => {
    return products.filter(p => 
      p.category === category && 
      p.name.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [products, category, searchQuery]);

  const subtotal = cart.reduce((acc, item) => acc + (item.price * item.quantity), 0);

  const addToCart = (product: Product, quantity: number) => {
    setCart(prev => {
      const existing = prev.find(item => item.id === product.id);
      if (existing) {
        return prev.map(item => 
          item.id === product.id ? { ...item, quantity: item.quantity + quantity } : item
        );
      }
      return [...prev, { ...product, quantity }];
    });
    setSelectedProduct(null);
  };

  const removeFromCart = (id: string) => {
    setCart(prev => prev.filter(item => item.id !== id));
  };

  const updateQuantity = (id: string, delta: number) => {
    setCart(prev => prev.map(item => {
      if (item.id === id) {
        const newQty = Math.max(1, Math.min(99, item.quantity + delta));
        return { ...item, quantity: newQty };
      }
      return item;
    }));
  };

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s.toString().padStart(2, '0')}`;
  };

  const handlePayment = async () => {
    setIsProcessing(true);
    
    try {
      // Preparar items para el pedido
      const items = cart.map(item => ({
        producto_id: parseInt(item.id),
        cantidad: item.quantity,
        precio_unitario: item.price,
        notas: null
      }));
      
      // Crear el pedido en el backend
      const response = await apiService.createOrder({
        items,
        total: subtotal * 1.1, // con impuestos
        tipo: 'mesa',
        mesa: undefined // Pedido desde kiosk, sin mesa asignada
      });
      
      console.log('Pedido creado:', response);
      
      if (response.success) {
        setIsProcessing(false);
        setScreen('success');
      } else {
        alert('Error al crear pedido: ' + response.message);
        setIsProcessing(false);
      }
    } catch (error) {
      console.error('Error en pago:', error);
      alert('Error al procesar el pedido. Intenta nuevamente.');
      setIsProcessing(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-stone-50 text-stone-900 font-sans overflow-hidden select-none">
      {/* Offline Banner */}
      <AnimatePresence>
        {!isOnline && (
          <motion.div 
            initial={{ y: -50 }}
            animate={{ y: 0 }}
            exit={{ y: -50 }}
            className="absolute top-0 inset-x-0 bg-red-600 text-white py-2 px-4 flex items-center justify-center gap-2 z-50 text-sm font-medium"
          >
            <WifiOff size={16} />
            Sin conexión a internet. Algunas funciones pueden no estar disponibles.
          </motion.div>
        )}
      </AnimatePresence>

      {/* Processing Overlay */}
      <AnimatePresence>
        {isProcessing && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-white/80 backdrop-blur-sm z-[100] flex flex-col items-center justify-center gap-4"
          >
            <div className="w-16 h-16 border-4 border-orange-500 border-t-transparent rounded-full animate-spin" />
            <p className="text-xl font-semibold text-stone-700">Procesando...</p>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main Screens */}
      <AnimatePresence mode="wait">
        {screen === 'home' && (
          <motion.div 
            key="home"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="h-full flex flex-col items-center justify-center text-center p-8 bg-gradient-to-br from-orange-50 to-stone-50"
            onClick={() => setScreen('menu')}
          >
            <motion.img 
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: 0.2 }}
              src="https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=800&q=80" 
              alt="Hero" 
              className="w-96 h-96 object-cover rounded-full shadow-2xl mb-12 border-8 border-white"
              referrerPolicy="no-referrer"
            />
            <h1 className="text-6xl font-black text-stone-900 mb-4 tracking-tight uppercase">BIENVENIDO</h1>
            <p className="text-2xl text-stone-500 mb-12">Toca en cualquier lugar para comenzar tu pedido</p>
            <motion.div 
              animate={{ scale: [1, 1.05, 1] }}
              transition={{ repeat: Infinity, duration: 2 }}
              className="bg-orange-500 text-white px-12 py-6 rounded-full text-3xl font-bold shadow-xl flex items-center gap-4"
            >
              ORDENAR AHORA <ChevronRight size={32} />
            </motion.div>
          </motion.div>
        )}

        {screen === 'menu' && (
          <motion.div 
            key="menu"
            initial={{ x: 100, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: -100, opacity: 0 }}
            className="h-full flex"
          >
            {/* Sidebar Navigation */}
            <div className="w-32 bg-white border-r border-stone-200 flex flex-col items-center py-8 gap-8">
              {(['platos', 'bebidas', 'postres'] as const).map((cat) => (
                <button
                  key={cat}
                  onClick={() => setCategory(cat)}
                  className={`w-24 h-24 rounded-2xl flex flex-col items-center justify-center gap-1 transition-all ${
                    category === cat 
                      ? 'bg-orange-500 text-white shadow-lg shadow-orange-200' 
                      : 'text-stone-400 hover:bg-stone-50'
                  }`}
                >
                  <span className="text-xs font-bold uppercase tracking-wider">{cat}</span>
                </button>
              ))}
              <div className="mt-auto">
                <button 
                  onClick={() => setScreen('home')}
                  className="w-16 h-16 rounded-full flex items-center justify-center text-stone-400 hover:text-red-500 transition-colors"
                >
                  <ArrowLeft size={32} />
                </button>
              </div>
            </div>

            {/* Main Content Area */}
            <div className="flex-1 flex flex-col">
              {/* Header */}
              <div className="h-20 bg-white border-b border-stone-200 px-8 flex items-center justify-between">
                <div className="relative w-96">
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-stone-400" size={20} />
                  <input 
                    type="text" 
                    placeholder="Buscar plato, bebida..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-12 pr-4 py-3 bg-stone-100 rounded-xl border-none focus:ring-2 focus:ring-orange-500 text-lg"
                  />
                </div>
                <div className="flex items-center gap-6 text-stone-500">
                  {/* Oculto pero mantengo el estado lastUpdated para uso futuro */}
                  {isOnline ? <Wifi size={20} className="text-green-500" /> : <WifiOff size={20} className="text-red-500" />}
                </div>
              </div>

              {/* Product Grid */}
              <div className="flex-1 overflow-y-auto p-8">
                {loading ? (
                  <div className="h-full flex flex-col items-center justify-center text-stone-400">
                    <Loader2 size={64} className="animate-spin mb-4" />
                    <p className="text-xl">Cargando productos...</p>
                  </div>
                ) : error ? (
                  <div className="h-full flex flex-col items-center justify-center text-red-500">
                    <AlertCircle size={64} className="mb-4" />
                    <p className="text-xl">{error}</p>
                    <p className="text-sm text-stone-400 mt-2">Verifica que el backend esté corriendo en puerto 3006</p>
                  </div>
                ) : filteredProducts.length === 0 ? (
                  <div className="h-full flex flex-col items-center justify-center text-stone-400">
                    <Search size={64} className="mb-4" />
                    <p className="text-xl">No se encontraron productos</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-3 gap-6">
                    {filteredProducts.map((product) => (
                      <motion.div
                        layoutId={product.id}
                        key={product.id}
                        onClick={() => {
                          if (product.available) {
                            setSelectedProduct(product);
                            setModalQuantity(1);
                          }
                        }}
                        className={`bg-white rounded-3xl overflow-hidden shadow-sm border border-stone-100 flex flex-col h-[320px] ${
                          !product.available ? 'opacity-60 grayscale' : 'cursor-pointer hover:shadow-xl'
                        }`}
                      >
                        {/* Imagen */}
                        <div className="relative h-40 flex-shrink-0">
                          <img 
                            src={product.image} 
                            alt={product.name} 
                            className="w-full h-full object-cover"
                            referrerPolicy="no-referrer"
                            onError={handleImageError}
                          />
                          {!product.available && (
                            <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                              <span className="bg-red-600 text-white px-4 py-1 rounded-full text-sm font-bold uppercase tracking-widest">Agotado</span>
                            </div>
                          )}
                        </div>
                        {/* Título, precio y botón */}
                        <div className="p-5 flex-1 flex flex-col justify-between">
                          <h3 className="text-xl font-bold">{product.name}</h3>
                          <div className="flex items-center justify-between">
                            <span className="text-2xl font-black text-orange-600">Bs {product.price.toFixed(2)}</span>
                            <div className="w-10 h-10 bg-orange-100 text-orange-600 rounded-full flex items-center justify-center">
                              <Plus size={24} />
                            </div>
                          </div>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                )}
              </div>
            </div>


            

            {/* Cart Sidebar */}
            <div className="w-96 bg-white border-l border-stone-200 flex flex-col">
              <div className="p-6 border-b border-stone-100 flex items-center justify-between">
                <h2 className="text-2xl font-bold flex items-center gap-3">
                  <ShoppingCart className="text-orange-500" /> Mi Pedido
                </h2>
                <span className="bg-stone-100 text-stone-600 px-3 py-1 rounded-full text-sm font-bold">
                  {cart.reduce((a, b) => a + b.quantity, 0)} items
                </span>
              </div>

              <div className="flex-1 overflow-y-auto p-6 space-y-6">
                {cart.length === 0 ? (
                  <div className="h-full flex flex-col items-center justify-center text-center text-stone-400">
                    <ShoppingCart size={64} strokeWidth={1} className="mb-4" />
                    <p className="text-lg">Tu carrito está vacío</p>
                    <p className="text-sm">¡Agrega algo delicioso!</p>
                  </div>
                ) : (
                  cart.map((item) => (
                    <div key={item.id} className="flex gap-4">
                      <img src={item.image} className="w-20 h-20 rounded-2xl object-cover" alt={item.name} referrerPolicy="no-referrer" onError={handleImageError} />
                      <div className="flex-1">
                        <div className="flex justify-between items-start mb-2">
                          <h4 className="font-bold leading-tight">{item.name}</h4>
                          <button onClick={() => removeFromCart(item.id)} className="text-stone-300 hover:text-red-500">
                            <X size={18} />
                          </button>
                        </div>
                        <div className="flex items-center justify-between">
                          <div className="flex items-center bg-stone-100 rounded-lg p-1">
                            <button onClick={() => updateQuantity(item.id, -1)} className="w-8 h-8 flex items-center justify-center text-stone-500"><Minus size={16} /></button>
                            <span className="w-8 text-center font-bold">{item.quantity}</span>
                            <button onClick={() => updateQuantity(item.id, 1)} className="w-8 h-8 flex items-center justify-center text-stone-500"><Plus size={16} /></button>
                          </div>
                          <span className="font-bold text-stone-700">Bs {(item.price * item.quantity).toFixed(2)}</span>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>

              <div className="p-6 bg-stone-50 border-t border-stone-200">
                <div className="flex justify-between items-center mb-6">
                  <span className="text-stone-500 font-medium">Subtotal</span>
                  <span className="text-3xl font-black text-stone-900">Bs {subtotal.toFixed(2)}</span>
                </div>
                <button 
                  disabled={cart.length === 0}
                  onClick={() => setScreen('checkout')}
                  className="w-full bg-orange-500 disabled:bg-stone-300 text-white py-5 rounded-2xl text-xl font-bold shadow-lg shadow-orange-200 flex items-center justify-center gap-3 active:scale-95 transition-transform"
                >
                  PAGAR AHORA <ChevronRight size={24} />
                </button>
              </div>
            </div>
          </motion.div>
        )}

        {screen === 'checkout' && (
          <motion.div 
            key="checkout"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 1.05 }}
            className="h-full flex flex-col items-center justify-center p-12 bg-stone-50"
          >
            <div className="w-full max-w-4xl bg-white rounded-[40px] shadow-2xl overflow-hidden flex">
              <div className="flex-1 p-12">
                <button onClick={() => setScreen('menu')} className="flex items-center gap-2 text-stone-400 font-bold mb-8 hover:text-stone-600">
                  <ArrowLeft size={20} /> VOLVER AL MENÚ
                </button>
                <h2 className="text-4xl font-black mb-8">Resumen de tu Pedido</h2>
                <div className="space-y-6 max-h-[400px] overflow-y-auto pr-4">
                  {cart.map(item => (
                    <div key={item.id} className="flex items-center justify-between py-4 border-b border-stone-100 last:border-0">
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-orange-100 text-orange-600 rounded-xl flex items-center justify-center font-bold">
                          {item.quantity}x
                        </div>
                        <div>
                          <h4 className="font-bold text-lg">{item.name}</h4>
                          <p className="text-stone-400 text-sm">Bs {item.price.toFixed(2)} c/u</p>
                        </div>
                      </div>
                      <span className="text-xl font-bold">Bs {(item.price * item.quantity).toFixed(2)}</span>
                    </div>
                  ))}
                </div>
              </div>
              <div className="w-[400px] bg-stone-900 text-white p-12 flex flex-col">
                <h3 className="text-2xl font-bold mb-12 text-stone-400">Total a Pagar</h3>
                <div className="space-y-4 mb-auto">
                  <div className="flex justify-between text-stone-400">
                    <span>Subtotal</span>
                    <span>Bs {subtotal.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-stone-400">
                    <span>Impuestos (10%)</span>
                    <span>Bs {(subtotal * 0.1).toFixed(2)}</span>
                  </div>
                  <div className="h-px bg-stone-800 my-6" />
                  <div className="flex justify-between items-center">
                    <span className="text-xl font-bold">TOTAL</span>
                    <span className="text-5xl font-black text-orange-500">Bs {(subtotal * 1.1).toFixed(2)}</span>
                  </div>
                </div>
                <button 
                  onClick={() => setScreen('payment')}
                  className="w-full bg-orange-500 text-white py-6 rounded-2xl text-2xl font-bold shadow-xl flex items-center justify-center gap-4 active:scale-95 transition-transform"
                >
                  CONFIRMAR Y PAGAR
                </button>
              </div>
            </div>
          </motion.div>
        )}

        {screen === 'payment' && (
          <motion.div 
            key="payment"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="h-full flex flex-col items-center justify-center p-12 bg-white"
          >
            <div className="text-center max-w-2xl">
              <h2 className="text-4xl font-black mb-4">Escanea para Pagar</h2>
              <p className="text-xl text-stone-500 mb-12">Usa tu aplicación de banco favorita para completar el pago</p>
              
              <div className="relative inline-block p-8 bg-stone-50 rounded-[40px] mb-12">
                <div className="w-64 h-64 bg-white p-4 rounded-3xl shadow-inner flex items-center justify-center">
                  <QrCode size={200} strokeWidth={1.5} className="text-stone-900" />
                </div>
                {qrTimer === 0 && (
                  <div className="absolute inset-0 bg-white/90 backdrop-blur-sm rounded-[40px] flex flex-col items-center justify-center p-8">
                    <AlertCircle size={64} className="text-red-500 mb-4" />
                    <h3 className="text-2xl font-bold text-red-600 mb-2">QR EXPIRADO</h3>
                    <button onClick={() => setQrTimer(600)} className="bg-stone-900 text-white px-6 py-3 rounded-xl font-bold">REINTENTAR</button>
                  </div>
                )}
              </div>

              <div className="flex items-center justify-center gap-8 mb-12">
                <div className="text-center">
                  <p className="text-stone-400 text-sm font-bold uppercase tracking-widest mb-1">Monto Exacto</p>
                  <p className="text-4xl font-black text-orange-600">Bs {(subtotal * 1.1).toFixed(2)}</p>
                </div>
                <div className="w-px h-16 bg-stone-200" />
                <div className="text-center">
                  <p className="text-stone-400 text-sm font-bold uppercase tracking-widest mb-1">Expira en</p>
                  <p className={`text-4xl font-black ${qrTimer < 60 ? 'text-red-500 animate-pulse' : 'text-stone-900'}`}>
                    {formatTime(qrTimer)}
                  </p>
                </div>
              </div>

              <div className="flex gap-4">
                <button 
                  onClick={() => setScreen('checkout')}
                  className="px-12 py-5 rounded-2xl text-xl font-bold text-stone-400 hover:text-stone-600 transition-colors"
                >
                  CANCELAR
                </button>
                <button 
                  onClick={handlePayment}
                  className="bg-stone-900 text-white px-12 py-5 rounded-2xl text-xl font-bold shadow-xl active:scale-95 transition-transform"
                >
                  SIMULAR PAGO EXITOSO
                </button>
              </div>
            </div>
          </motion.div>
        )}

        {screen === 'success' && (
          <motion.div 
            key="success"
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="h-full flex flex-col items-center justify-center text-center p-12 bg-green-50"
          >
            <motion.div 
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: "spring", damping: 12, stiffness: 200, delay: 0.2 }}
              className="w-40 h-40 bg-green-500 text-white rounded-full flex items-center justify-center mb-12 shadow-2xl shadow-green-200"
            >
              <CheckCircle2 size={80} />
            </motion.div>
            <h2 className="text-6xl font-black text-stone-900 mb-4 uppercase">¡PAGO EXITOSO! 🎉</h2>
            <p className="text-2xl text-stone-600 mb-12">Tu pedido ha sido enviado a la cocina</p>
            
            <div className="bg-white p-12 rounded-[40px] shadow-xl mb-12">
              <p className="text-stone-400 font-bold uppercase tracking-widest mb-2">Número de Orden</p>
              <p className="text-8xl font-black text-stone-900">#{orderNumber}</p>
            </div>

            <p className="text-xl text-stone-400 animate-pulse">
              Volviendo al inicio en 5 segundos...
            </p>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Product Detail Modal */}
      <AnimatePresence>
        {selectedProduct && (
          <div className="fixed inset-0 z-[110] flex items-center justify-center p-12">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setSelectedProduct(null)}
              className="absolute inset-0 bg-stone-900/60 backdrop-blur-md"
            />
            <motion.div 
              layoutId={selectedProduct.id}
              className="relative w-full max-w-5xl bg-white rounded-[40px] shadow-2xl overflow-hidden flex h-[600px]"
            >
              <div className="flex-1 relative">
                <img 
                  src={selectedProduct.image} 
                  alt={selectedProduct.name} 
                  className="w-full h-full object-cover"
                  referrerPolicy="no-referrer"
                  onError={handleImageError}
                />
                <button 
                  onClick={() => setSelectedProduct(null)}
                  className="absolute top-8 left-8 w-14 h-14 bg-white/20 backdrop-blur-md text-white rounded-full flex items-center justify-center hover:bg-white/40 transition-colors"
                >
                  <X size={32} />
                </button>
              </div>
              <div className="w-[500px] p-12 flex flex-col">
                <div className="mb-auto">
                  <div className="flex justify-between items-start mb-4">
                    <h2 className="text-4xl font-black leading-tight">{selectedProduct.name}</h2>
                    <span className="text-3xl font-black text-orange-600">Bs {selectedProduct.price.toFixed(2)}</span>
                  </div>
                  <p className="text-xl text-stone-500 leading-relaxed">{selectedProduct.description}</p>
                </div>

                <div className="space-y-8">
                  <div className="flex items-center justify-between bg-stone-100 p-4 rounded-3xl">
                    <span className="text-xl font-bold text-stone-500 ml-4">Cantidad</span>
                    <div className="flex items-center gap-8">
                      <button 
                        onClick={() => setModalQuantity(q => Math.max(1, q - 1))}
                        className="w-16 h-16 bg-white rounded-2xl flex items-center justify-center text-stone-900 shadow-sm active:scale-90 transition-transform"
                      >
                        <Minus size={32} />
                      </button>
                      <span className="text-4xl font-black w-12 text-center">{modalQuantity}</span>
                      <button 
                        onClick={() => setModalQuantity(q => Math.min(99, q + 1))}
                        className="w-16 h-16 bg-white rounded-2xl flex items-center justify-center text-stone-900 shadow-sm active:scale-90 transition-transform"
                      >
                        <Plus size={32} />
                      </button>
                    </div>
                  </div>

                  <button 
                    onClick={() => addToCart(selectedProduct, modalQuantity)}
                    className="w-full bg-orange-500 text-white py-6 rounded-3xl text-2xl font-bold shadow-xl shadow-orange-200 active:scale-95 transition-transform"
                  >
                    AÑADIR AL PEDIDO
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
