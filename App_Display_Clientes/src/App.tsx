import { useState, useEffect, useRef } from 'react';
import { io } from 'socket.io-client';
import { 
  ChefHat, 
  Clock, 
  Sparkles,
  Volume2,
  VolumeX,
  Bell
} from 'lucide-react';

const HOST = window.location.hostname;
const API_BASE = import.meta.env.VITE_API_URL || 
  `http://${HOST}:3006`;
const API_URL = `${API_BASE}/api`;
const socket = io(API_BASE);

interface Pedido {
  id: number;
  numero_pedido: string;
  estado: 'pendiente' | 'preparando' | 'listo' | 'entregado';
  tipo: string;
  hora_pedido: string;
}

const sonidoNotificacion = new Audio('data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2/LDciUFLIHO8tiJNwgZaLvt559NEzxQsfHYiTgGHm7A7+OZSA0+WbTy2YUvBhxqv+zplkcNOVGz8tiHNwcfaLvu5pZIDTxPsfvhhl0JHGm98OubSw0+UrLx2YU2Bhxqv+zplkcNOVGz8tiHNwcfaLvu5pZIDTxPsfvhhl0JHGm98OubSw0+UrLx2YU2Bhxqv+zplkcNOVGz8tiHNwcfaLvu5pZIDTxPsfvhhl0JHGm98OubSw0+UrLx2YU2Bhxqv+zplkcNOVGz8tiHNwcfaLvu5pZIDTxPsfvhhl0JHGm98OubSw0+UrLx2YU2Bhxqv+zplkcNOVGz8tiHNwcfaLvu5pZIDTxPsfvhhl0JHGm98OubSw0+UrLx2YU2Bhxqv+zplkcNOVGz8tiHNwcfaLvu5pZIDTxPsfvhhl0JHGm98OubSw0+UrLx2YU2Bhxqv+zplkcNOVGz8tiHNwcfaLvu5pZIDTxPsfvhhl0JHGm98OubSw0+UrLx2YU2Bhxqv+zplkcNOVGz8tiHNwcfaLvu5pZIDTxPsfvhhl0JHGm98OubSw0+UrLx2YU2Bhxqv+zplkcNOVGz8tiHNwcfaLvu5pZIDTxPsfvhhl0JHGm98OubSw0+UrLx2YU2Bhxqv+zplkcNOVGz8tiHNwcfaLvu5pZIDTxPsfvhhl0JHGm98OubSw0+UrLx2YU2Bhxqv+zplkcNOVGz8tiHNwcfaLvu5pZIDTxPsfvhhl0JHGm98OubSw0+UrLx2YU2Bhxqv+zplkcNOVGz8tiHNwcfaLvu5pZIDTxPsfvhhl0JHGm98OubSw0+UrLx2YU2Bhxqv+zplkcNOVGz8tiHNwcfaLvu5pZIDTxPsfvhhl0JHGm98OubSw0+UrLx2YU2Bhxqv+zplkcNOVGz8tiHNwcfaLvu5pZIDTxPsfvhhl0JHGm98OubSw0+UrLx2YU2Bhxqv+zplkcNOVGz8tiHNwcfaLvu5pZIDTxPsfvhhl0JHGm98OubSw0+UrLx2YU2Bhxqv+zplkcNOVGz8tiHNwcfaLvu5pZIDTxPsfvhhl0JHGm98OubSw0+UrLx2YU2Bhxqv+zplkcNOVGz8tiHNwcfaLvu5pZIDTxPsfvhhl0JHGm98OubSw0+UrLx2YU2Bh');

export default function App() {
  const [pedidos, setPedidos] = useState<Pedido[]>([]);
  const [horaActual, setHoraActual] = useState(new Date());
  const [sonidoActivado, setSonidoActivado] = useState(true);
  const pedidosListosAnterior = useRef<number[]>([]);
  const pedidosOcultos = useRef<Set<number>>(new Set());
  const pedidosListosTimers = useRef<Map<number, ReturnType<typeof setTimeout>>>(new Map());

  // Actualizar hora cada segundo
  useEffect(() => {
    const interval = setInterval(() => setHoraActual(new Date()), 1000);
    return () => clearInterval(interval);
  }, []);

  // Cargar pedidos
  const cargarPedidos = async () => {
    try {
      const r = await fetch(`${API_URL}/pedidos/display`);
      const data = await r.json();
      if (data.success) {
        const pedidosFiltrados = data.data.map((p: any) => ({
          id: p.id,
          numero_pedido: `PED-${String(p.id).padStart(3, '0')}`,
          estado: p.estado,
          tipo: p.tipo,
          hora_pedido: p.created_at
        }));
        setPedidos(pedidosFiltrados);
      }
    } catch (error) {
      console.error('Error cargando pedidos:', error);
    }
  };

  // Detectar nuevos pedidos listos y reproducir sonido 5 veces
  const reproducirSonidoCincoVeces = () => {
    if (!sonidoActivado) return;
    
    let contador = 0;
    const maxRepeticiones = 5;
    const intervalo = 800;
    
    const reproducir = () => {
      if (contador < maxRepeticiones) {
        sonidoNotificacion.currentTime = 0;
        sonidoNotificacion.play().catch(() => {});
        contador++;
        setTimeout(reproducir, intervalo);
      }
    };
    
    reproducir();
  };

  useEffect(() => {
    const pedidosListosActuales = pedidos.filter(p => p.estado === 'listo');
    const nuevosListos = pedidosListosActuales.filter(p => !pedidosListosAnterior.current.includes(p.id));
    
    if (nuevosListos.length > 0 && sonidoActivado) {
      nuevosListos.forEach((_, index) => {
        setTimeout(() => {
          reproducirSonidoCincoVeces();
        }, index * 100);
      });
    }
    
    // Configurar temporizador de 20 segundos para nuevos pedidos listos
    nuevosListos.forEach(pedido => {
      if (!pedidosListosTimers.current.has(pedido.id)) {
        const timer = setTimeout(() => {
          pedidosOcultos.current.add(pedido.id);
          // Forzar re-render para ocultar el pedido
          setPedidos(prev => [...prev]);
        }, 40000); // 40 segundos
        
        pedidosListosTimers.current.set(pedido.id, timer);
      }
    });
    
    // Limpiar timers de pedidos que ya no están en estado listo
    pedidosListosTimers.current.forEach((timer, id) => {
      if (!pedidosListosActuales.find(p => p.id === id)) {
        clearTimeout(timer);
        pedidosListosTimers.current.delete(id);
        pedidosOcultos.current.delete(id);
      }
    });
    
    pedidosListosAnterior.current = pedidosListosActuales.map(p => p.id);
  }, [pedidos, sonidoActivado]);

  // WebSocket y carga inicial
  useEffect(() => {
    cargarPedidos();
    
    socket.on('kitchen:order_updated', () => {
      console.log('Pedido actualizado, recargando...');
      cargarPedidos();
    });
    
    socket.on('kitchen:new_order', () => {
      console.log('Nuevo pedido recibido');
      cargarPedidos();
    });
    
    socket.on('pedidos:changed', () => {
      console.log('Pedido actualizado (pedidos:changed), recargando...');
      cargarPedidos();
    });

    // Refrescar cada 10 segundos como backup
    const interval = setInterval(cargarPedidos, 10000);
    
    return () => {
      socket.off('kitchen:order_updated');
      socket.off('kitchen:new_order');
      socket.off('pedidos:changed');
      clearInterval(interval);
    };
  }, []);

  // Configuración de estados
  const estadosConfig = {
    pendiente: {
      label: 'EN ESPERA',
      sublabel: 'PENDIENTE',
      color: 'bg-amber-500',
      borderColor: 'border-amber-400',
      bgLight: 'bg-[#1f2937]',
      icon: Clock,
      headerBg: 'bg-[#1f2937]',
      circleBg: 'bg-amber-500',
      textColor: 'text-amber-400'
    },
    preparando: {
      label: 'PREPARANDO',
      sublabel: 'EN PROCESO',
      color: 'bg-blue-500',
      borderColor: 'border-blue-400',
      bgLight: 'bg-[#1f2937]',
      icon: ChefHat,
      headerBg: 'bg-[#1f2937]',
      circleBg: 'bg-blue-500',
      textColor: 'text-blue-400'
    },
    listo: {
      label: 'LISTO',
      sublabel: 'COMPLETADO',
      color: 'bg-emerald-500',
      borderColor: 'border-emerald-400',
      bgLight: 'bg-[#1f2937]',
      icon: Bell,
      headerBg: 'bg-[#1f2937]',
      circleBg: 'bg-emerald-500',
      textColor: 'text-emerald-400'
    }
  };

  const pedidosPendientes = pedidos.filter(p => p.estado === 'pendiente');
  const pedidosPreparando = pedidos.filter(p => p.estado === 'preparando');
  // Filtrar pedidos listos para ocultar los que ya pasaron 20 segundos
  // y mostrar solo los 5 más recientes (rotando: el más antiguo sale al llegar el 6to)
  const pedidosListos = pedidos
    .filter(p => p.estado === 'listo' && !pedidosOcultos.current.has(p.id))
    .sort((a, b) => new Date(b.hora_pedido).getTime() - new Date(a.hora_pedido).getTime())
    .slice(0, 5);

  const Columna = ({ titulo, pedidos: listaPedidos, config, tipo }: { 
    titulo: string; 
    pedidos: Pedido[]; 
    config: any;
    tipo: 'pendiente' | 'preparando' | 'listo';
  }) => {
    const Icon = config.icon;
    return (
      <div className="flex-1 flex flex-col min-w-0 bg-[#1f2937] rounded-3xl shadow-lg overflow-hidden border border-amber-500/30">
        {/* Header con círculo de color */}
        <div className={`${config.headerBg} px-6 py-4 border-b border-amber-500/30`}>
          <div className="flex items-center gap-3">
            <div className={`w-12 h-12 ${config.circleBg} rounded-full flex items-center justify-center shadow-lg shadow-amber-500/30`}>
              <Icon className="text-white" size={24} />
            </div>
            <div>
              <h2 className={`text-lg font-bold ${config.textColor} uppercase tracking-wide`}>{titulo}</h2>
              <p className="text-sm text-gray-400">{listaPedidos.length} pedidos</p>
            </div>
          </div>
        </div>
        
        <div className={`flex-1 ${config.bgLight} p-4 overflow-y-auto`}>
          {listaPedidos.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-40 text-gray-500">
              <Icon size={40} className="mb-2 opacity-30" />
              <p className="text-sm">Sin pedidos</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-3">
              {listaPedidos.map(pedido => (
                <TarjetaPedido 
                  key={pedido.id} 
                  pedido={pedido} 
                  config={config}
                  tipo={tipo}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    );
  };

  const TarjetaPedido = ({ pedido, config, tipo }: { 
    pedido: Pedido; 
    config: any; 
    tipo: 'pendiente' | 'preparando' | 'listo';
  }) => {
    const esListo = tipo === 'listo';
    
    return (
      <div className={`
        bg-[#111827] ${config.borderColor} border-2 rounded-2xl p-4 shadow-lg 
        ${esListo ? 'shadow-emerald-500/30 animate-border-pulse' : 'shadow-amber-500/10'}
        transition-shadow
      `}>
        {esListo ? (
          // Diseño especial para pedidos listos - número grande centrado
          <div className="flex flex-col items-center justify-center py-4">
            <div className="text-sm text-gray-400 mb-2 uppercase tracking-wider">Pedido</div>
            <div className="text-7xl font-black text-emerald-400 mb-2 drop-shadow-lg">
              #{pedido.id}
            </div>
            <div className={`text-xl font-bold ${config.textColor} mb-1`}>
              {config.sublabel}
            </div>
          </div>
        ) : (
          // Diseño normal para otros estados
          <>
            {/* Número de pedido */}
            <div className="text-sm text-gray-400 mb-2">
              Pedido #{pedido.id}
              {pedido.tipo === 'delivery' && <span className="text-xs bg-sky-500/20 text-sky-400 px-2 py-1 rounded ml-2">🛵 Delivery</span>}
            </div>
            
            {/* Estado principal */}
            <div className="flex items-center gap-3 mb-3">
              <div className={`w-10 h-10 ${config.color} rounded-full flex items-center justify-center shadow-lg shadow-amber-500/30`}>
                <config.icon className="text-white" size={20} />
              </div>
              <div>
                <div className={`text-lg font-bold ${config.textColor}`}>{config.sublabel}</div>
                {pedido.estado === 'preparando' && (
                  <div className="w-full bg-gray-700 rounded-full h-2 mt-1">
                    <div className="bg-amber-500 h-2 rounded-full animate-pulse shadow-lg shadow-amber-500/50" style={{ width: '65%' }}></div>
                  </div>
                )}
              </div>
            </div>
            
            {/* Información del pedido */}
            <div className="text-sm">
              <div className="flex justify-between">
                <span className="text-gray-500">Recibido:</span>
                <span className="text-amber-400 font-medium">{formatearHora(pedido.hora_pedido)}</span>
              </div>
            </div>
          </>
        )}
      </div>
    );
  };

  const formatearHora = (fecha: string) => {
    return new Date(fecha).toLocaleTimeString('es-ES', { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  };

  return (
    <div className="min-h-screen bg-[#111827] flex flex-col">
      {/* Header */}
      <header className="bg-[#1f2937] border-b border-amber-500/30 px-8 py-4 shadow-lg shadow-amber-500/10">
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 bg-gradient-to-br from-amber-400 to-amber-600 rounded-full flex items-center justify-center shadow-lg shadow-amber-500/50">
              <Sparkles className="text-[#111827]" size={28} />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-amber-400 tracking-tight">
                PACCIOLI
              </h1>
              <p className="text-gray-400 text-sm">Monitor de Pedidos</p>
            </div>
          </div>
          
          <div className="flex items-center gap-6">
            <div className="text-right">
              <div className="text-4xl font-mono font-bold text-amber-400">
                {horaActual.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })}
              </div>
              <div className="text-gray-400 text-sm">
                {horaActual.toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'long' })}
              </div>
            </div>
            
            <button 
              onClick={() => setSonidoActivado(!sonidoActivado)}
              className="p-3 rounded-full bg-[#111827] border border-amber-500/30 hover:border-amber-400 transition"
            >
              {sonidoActivado ? 
                <Volume2 className="text-amber-400" size={22} /> : 
                <VolumeX className="text-gray-500" size={22} />
              }
            </button>
          </div>
        </div>
      </header>

      {/* 3 Columnas - Layout responsivo */}
      <main className="flex-1 p-6 grid grid-cols-1 lg:grid-cols-3 gap-6 overflow-hidden bg-[#111827]">
        <Columna 
          titulo="Pendientes" 
          pedidos={pedidosPendientes} 
          config={estadosConfig.pendiente}
          tipo="pendiente"
        />
        <Columna 
          titulo="En Preparación" 
          pedidos={pedidosPreparando} 
          config={estadosConfig.preparando}
          tipo="preparando"
        />
        <Columna 
          titulo="Listos para Recoger" 
          pedidos={pedidosListos} 
          config={estadosConfig.listo}
          tipo="listo"
        />
      </main>

      {/* Footer */}
      <footer className="bg-[#1f2937] border-t border-amber-500/30 px-8 py-3">
        <div className="flex justify-between items-center text-gray-400 text-sm">
          <p>Pedidos Actualizados en Tiempo Real</p>
          <p className="text-amber-400 font-medium">Sistema PACCIOLI © 2024</p>
        </div>
      </footer>
    </div>
  );
}
