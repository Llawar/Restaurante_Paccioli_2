import { useState, useEffect } from 'react';
import { io } from 'socket.io-client';
import { ChefHat, CheckCircle, Clock } from 'lucide-react';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:3006';
const API_URL = `${API_BASE}/api`;
const socket = io(API_BASE);

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

export default function App() {
  const [puestoSeleccionado, setPuestoSeleccionado] = useState<number | null>(null);
  const [pedidos, setPedidos] = useState<Pedido[]>([]);
  const [puestos, setPuestos] = useState<any[]>([]);

  // Cargar puestos
  useEffect(() => {
    fetch(`${API_URL}/cocina/puestos`).then(r => r.json()).then(data => {
      if (data.success) setPuestos(data.data);
    });
  }, []);

  // Cargar pedidos del puesto
  const cargarPedidos = async () => {
    if (!puestoSeleccionado) return;
    const r = await fetch(`${API_URL}/cocina/pedidos/${puestoSeleccionado}`);
    const data = await r.json();
    if (data.success) setPedidos(data.data);
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
      // Reproducir sonido de notificación
      const audio = new Audio('data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2/LDciUFLIHO8tiJNwgZaLvt559NEzxQsfHYiTgGHm7A7+OZSA0+WbTy2YUvBhxqv+zplkcNOVGz8tiHNwcfaLvu5pZIDTxPsfvhhl0JHGm98OubSw0+UrLx2YU2Bhxqv+zplkcNOVGz8tiHNwcfaLvu5pZIDTxPsfvhhl0JHGm98OubSw0+UrLx2YU2Bhxqv+zplkcNOVGz8tiHNwcfaLvu5pZIDTxPsfvhhl0JHGm98OubSw0+UrLx2YU2Bhxqv+zplkcNOVGz8tiHNwcfaLvu5pZIDTxPsfvhhl0JHGm98OubSw0+UrLx2YU2Bhxqv+zplkcNOVGz8tiHNwcfaLvu5pZIDTxPsfvhhl0JHGm98OubSw0+UrLx2YU2Bhxqv+zplkcNOVGz8tiHNwcfaLvu5pZIDTxPsfvhhl0JHGm98OubSw0+UrLx2YU2Bhxqv+zplkcNOVGz8tiHNwcfaLvu5pZIDTxPsfvhhl0JHGm98OubSw0+UrLx2YU2Bhxqv+zplkcNOVGz8tiHNwcfaLvu5pZIDTxPsfvhhl0JHGm98OubSw0+UrLx2YU2Bhxqv+zplkcNOVGz8tiHNwcfaLvu5pZIDTxPsfvhhl0JHGm98OubSw0+UrLx2YU2Bhxqv+zplkcNOVGz8tiHNwcfaLvu5pZIDTxPsfvhhl0JHGm98OubSw0+UrLx2YU2Bhxqv+zplkcNOVGz8tiHNwcfaLvu5pZIDTxPsfvhhl0JHGm98OubSw0+UrLx2YU2Bh');
      audio.play().catch(() => {});
      cargarPedidos();
    });
    
    return () => { 
      socket.off('kitchen:order_updated');
      socket.off('kitchen:new_order');
    };
  }, [puestoSeleccionado]);

  const cambiarEstado = async (detalleId: number, nuevoEstado: string) => {
    await fetch(`${API_URL}/cocina/item/${detalleId}/estado`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ nuevoEstado, cocineroId: 1 })
    });
    cargarPedidos();
  };

  // Pantalla de selección de puesto
  if (!puestoSeleccionado) {
    return (
      <div className="min-h-screen bg-[#111827] p-4">
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

  return (
    <div className="min-h-screen bg-[#111827]">
      {/* Header */}
      <div className="bg-[#1f2937] text-white p-4 sticky top-0 z-10 border-b border-amber-500/50 shadow-lg shadow-amber-500/10">
        <div className="flex justify-between items-center">
          <h1 className="font-bold text-lg text-amber-400">{puestos.find(p => p.id === puestoSeleccionado)?.nombre}</h1>
          <button onClick={() => setPuestoSeleccionado(null)} className="text-sm bg-amber-500/20 text-amber-400 px-3 py-1 rounded hover:bg-amber-500/30 transition">Cambiar</button>
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
