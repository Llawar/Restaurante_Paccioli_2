import 'package:delivery/config/constants.dart';
import 'package:delivery/config/supabase_config.dart';
import 'package:delivery/models/order_model.dart';
import 'package:delivery/models/product_model.dart';
import 'package:delivery/models/user_model.dart' as app_user;

class DatabaseService {
  final supabase = SupabaseConfig.client;

  // ==================== PRODUCTOS ====================

  // Obtener todos los productos
  Future<List<Product>> getAllProducts() async {
    try {
      final response = await supabase
          .from(TableNames.products)
          .select()
          .eq('estado', true);

      return (response as List).map((json) => Product.fromJson(json)).toList();
    } catch (e) {
      throw Exception('Error al obtener productos: $e');
    }
  }

  // Obtener productos por categoría
  Future<List<Product>> getProductsByCategory(String category) async {
    try {
      final response = await supabase
          .from(TableNames.products)
          .select()
          .eq('categoria', category)
          .eq('estado', true);

      return (response as List).map((json) => Product.fromJson(json)).toList();
    } catch (e) {
      throw Exception('Error al obtener productos: $e');
    }
  }

  // ==================== PEDIDOS ====================

  // Crear nuevo pedido
  Future<Order> createOrder({
    required String clienteId,
    required String direccionEntrega,
    required String metodoPago,
    required double latitud,
    required double longitud,
    required List<Map<String, dynamic>> items,
    String estado = 'pending',
  }) async {
    try {
      // Calcular total
      double total = 0;
      for (var item in items) {
        total += (item['precio_unitario'] as num) * (item['cantidad'] as num);
      }

      final orderData = {
        'cliente_id': clienteId,
        'estado': 'pending',
        'direccion_entrega': direccionEntrega,
        'latitud': latitud,
        'longitud': longitud,
        'total': total,
        'fecha_creacion': DateTime.now().toIso8601String(),
      };

      final response =
          await supabase
              .from(TableNames.orders)
              .insert(orderData)
              .select()
              .single();

      // Insertar items del pedido
      final orderId = response['id'];
      for (var item in items) {
        await supabase.from(TableNames.orderItems).insert({
          'pedido_id': orderId,
          'producto_id': item['producto_id'],
          'cantidad': item['cantidad'],
          'precio_unitario': item['precio_unitario'],
          'subtotal':
              (item['precio_unitario'] as num) * (item['cantidad'] as num),
        });
      }

      // Obtener el pedido completo
      return getOrderById(orderId);
    } catch (e) {
      throw Exception('Error al crear pedido: $e');
    }
  }

  // Obtener pedido por ID
  Future<Order> getOrderById(String orderId) async {
    try {
      final response =
          await supabase
              .from(TableNames.orders)
              .select('''
            *,
            order_items(*)
          ''')
              .eq('id', orderId)
              .single();

      return Order.fromJson(response);
    } catch (e) {
      throw Exception('Error al obtener pedido: $e');
    }
  }

  // Obtener pedidos del cliente
  Future<List<Order>> getClientOrders(String clienteId) async {
    try {
      final response = await supabase
          .from(TableNames.orders)
          .select('''
            *,
            order_items(*)
          ''')
          .eq('cliente_id', clienteId)
          .order('fecha_creacion', ascending: false);

      return (response as List).map((json) => Order.fromJson(json)).toList();
    } catch (e) {
      throw Exception('Error al obtener pedidos: $e');
    }
  }

  // Obtener pedidos sin asignar (para admin)

  // Asignar repartidor a pedido
  Future<void> assignDeliveryToPerson(
    String orderId,
    String repartidorId,
  ) async {
    try {
      await supabase
          .from(TableNames.orders)
          .update({'repartidor_id': repartidorId, 'estado': 'assigned'})
          .eq('id', orderId);
    } catch (e) {
      throw Exception('Error al asignar repartidor: $e');
    }
  }

  // Obtener pedidos sin asignar (para admin)
  Future<List<Order>> getUnassignedOrders() async {
    try {
      final response = await supabase
          .from(TableNames.orders)
          .select('''
            *,
            order_items(*)
          ''')
          .eq('estado', 'pending')
          .order('fecha_creacion', ascending: true);

      return (response as List).map((json) => Order.fromJson(json)).toList();
    } catch (e) {
      throw Exception('Error al obtener pedidos: $e');
    }
  }

  // Obtener pedidos asignados a un repartidor
  Future<List<Order>> getDeliveryOrders(String repartidorId) async {
    try {
      final response = await supabase
          .from(TableNames.orders)
          .select('''
            *,
            order_items(*)
          ''')
          .eq('repartidor_id', repartidorId)
          .inFilter('estado', ['assigned', 'in_transit'])
          .order('fecha_creacion', ascending: true);

      return (response as List).map((json) => Order.fromJson(json)).toList();
    } catch (e) {
      throw Exception('Error al obtener pedidos: $e');
    }
  }

  // ==================== DELIVERY ====================

  // Actualizar estado del pedido (asignado -> en camino -> entregado)
  Future<void> updateOrderStatus(String orderId, String status) async {
    try {
      await supabase
          .from(TableNames.orders)
          .update({'estado': status})
          .eq('id', orderId);
    } catch (e) {
      throw Exception('Error al actualizar estado del pedido: $e');
    }
  }

  // Actualizar disponibilidad del repartidor
  Future<void> updateDeliveryAvailability(String userId, String status) async {
    try {
      await supabase
          .from(TableNames.deliveryProfiles)
          .update({'estado_disponibilidad': status})
          .eq('user_id', userId);
    } catch (e) {
      throw Exception('Error al actualizar disponibilidad: $e');
    }
  }

  // Actualizar ubicación del repartidor en tiempo real
  Future<void> updateDeliveryLocation(
    String userId,
    double lat,
    double lng,
  ) async {
    try {
      await supabase
          .from(TableNames.deliveryProfiles)
          .update({
            'ubicacion_actual': {'latitude': lat, 'longitude': lng},
          })
          .eq('user_id', userId);
    } catch (e) {
      // We don't throw here to avoid crashing the stream
      print('Error updating location: $e');
    }
  }

  // Obtener perfil del repartidor

  Future<Map<String, dynamic>> getDeliveryProfile(String userId) async {
    try {
      final response =
          await supabase
              .from(TableNames.deliveryProfiles)
              .select()
              .eq('user_id', userId)
              .single();
      return response;
    } catch (e) {
      throw Exception('Error al obtener perfil de repartidor: $e');
    }
  }

  // Obtener historial de pedidos entregados por un repartidor
  Future<List<Order>> getDeliveryHistory(String repartidorId) async {
    try {
      final response = await supabase
          .from(TableNames.orders)
          .select('''
            *,
            order_items(*)
          ''')
          .eq('repartidor_id', repartidorId)
          .eq('estado', 'delivered')
          .order('fecha_creacion', ascending: false);

      return (response as List).map((json) => Order.fromJson(json)).toList();
    } catch (e) {
      throw Exception('Error al obtener historial de entregas: $e');
    }
  }

  // ==================== ADMIN ====================

  // Promover un usuario a repartidor
  Future<void> promoteToDelivery(String userId) async {
    try {
      // 1. Cambiar el rol en la tabla users
      await supabase
          .from(TableNames.users)
          .update({'rol': 'delivery'})
          .eq('id', userId);

      // 2. Crear el perfil de repartidor (si no existe)
      await supabase.from(TableNames.deliveryProfiles).upsert({
        'user_id': userId,
        'estado_disponibilidad': 'offline',
        'calificacion_promedio': 0.0,
        'entregas_completadas': 0,
      });
    } catch (e) {
      throw Exception('Error al promover usuario a repartidor: $e');
    }
  }

  // Obtener usuario por email (para buscar clientes que promover)
  Future<app_user.User?> getUserByEmail(String email) async {
    try {
      final response =
          await supabase
              .from(TableNames.users)
              .select()
              .eq('email', email)
              .single();
      return app_user.User.fromJson(response);
    } catch (e) {
      return null;
    }
  }

  // Obtener repartidores disponibles
  Future<List<app_user.User>> getAvailableDeliveryPersons() async {
    try {
      final response = await supabase
          .from(TableNames.users)
          .select()
          .eq('rol', 'delivery');

      return (response as List)
          .map((json) => app_user.User.fromJson(json))
          .toList();
    } catch (e) {
      throw Exception('Error al obtener repartidores: $e');
    }
  }

  // Obtener pedidos por estado
  Future<List<Order>> getOrdersByStatus(String status) async {
    try {
      final response = await supabase
          .from(TableNames.orders)
          .select('''
            *,
            order_items(*)
          ''')
          .eq('estado', status)
          .order('fecha_creacion', ascending: false);

      return (response as List).map((json) => Order.fromJson(json)).toList();
    } catch (e) {
      throw Exception('Error al obtener pedidos: $e');
    }
  }
}
