// Servicio API para conectar con el backend principal
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3006/api';

export interface ApiProduct {
  id: number;
  nombre: string;
  descripcion: string;
  precio: number;
  categoria_id: number;
  categoria_nombre: string;
  imagen: string | null;
  disponible: number;
  activo: number;
}

export interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
}

export const apiService = {
  // Obtener productos activos y disponibles
  async getProducts(): Promise<ApiProduct[]> {
    try {
      console.log('Fetching products from:', `${API_URL}/productos`);
      const response = await fetch(`${API_URL}/productos`);
      console.log('Response status:', response.status);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const result: ApiResponse<ApiProduct[]> = await response.json();
      console.log('API Response:', result);
      
      if (result.success && Array.isArray(result.data)) {
        console.log('Total products:', result.data.length);
        console.log('First product sample:', result.data[0]); // Para debuggear valores reales
        
        const filtered = result.data.filter(p => {
          const isActive = p.activo === 1;
          const isAvailable = p.disponible === 1;
          return isActive && isAvailable;
        });
        
        console.log('Filtered products (activo + disponible):', filtered.length);
        return filtered;
      }
      
      console.warn('API returned no data or success=false:', result);
      return [];
    } catch (error) {
      console.error('Error fetching products:', error);
      throw error; // Re-throw para que el componente lo capture
    }
  },

  // Crear un pedido (ruta pública para kiosk)
  async createOrder(orderData: {
    items: { producto_id: number; cantidad: number; precio_unitario: number }[];
    total: number;
    tipo: 'mesa' | 'delivery' | 'para_llevar';
    mesa?: number;
  }) {
    try {
      // Usar ruta pública sin autenticación
      const response = await fetch(`${API_URL}/pedidos/publico`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(orderData)
      });
      return await response.json();
    } catch (error) {
      console.error('Error creating order:', error);
      throw error;
    }
  },

  // Health check
  async healthCheck(): Promise<boolean> {
    try {
      const response = await fetch(`${API_URL}/health`);
      return response.ok;
    } catch {
      return false;
    }
  }
};
