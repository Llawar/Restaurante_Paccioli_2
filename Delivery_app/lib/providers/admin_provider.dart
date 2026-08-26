import 'package:delivery/config/constants.dart';
import 'package:delivery/models/order_model.dart';
import 'package:delivery/models/delivery_person_model.dart';
import 'package:delivery/models/user_model.dart';
import 'package:delivery/services/database_service.dart';
import 'package:flutter/material.dart';
import 'package:supabase_flutter/supabase_flutter.dart' hide User;

class AdminProvider extends ChangeNotifier {
  final _dbService = DatabaseService();
  final supabase = Supabase.instance.client;

  List<Order> _unassignedOrders = [];
  List<User> _availableDeliveryPersons = [];
  List<Order> _allOrders = [];
  List<DeliveryPerson> _deliveryPersons = [];
  Map<String, dynamic> _dashboardStats = {};
  List<Order> _recentOrders = [];
  bool _isLoading = false;
  String? _errorMessage;
  String _selectedPeriod = 'today';

  // Getters
  List<Order> get unassignedOrders => _unassignedOrders;
  List<User> get availableDeliveryPersons => _availableDeliveryPersons;
  List<Order> get allOrders => _allOrders;
  List<DeliveryPerson> get deliveryPersons => _deliveryPersons;
  Map<String, dynamic> get dashboardStats => _dashboardStats;
  List<Order> get recentOrders => _recentOrders;
  bool get isLoading => _isLoading;
  String? get errorMessage => _errorMessage;
  String get selectedPeriod => _selectedPeriod;

  // Buscar usuario por email
  Future<User?> searchUserByEmail(String email) async {
    try {
      return await _dbService.getUserByEmail(email);
    } catch (e) {
      _errorMessage = 'Error al buscar usuario: $e';
      notifyListeners();
      return null;
    }
  }

  // Promover usuario a repartidor

  Future<bool> promoteUserToDelivery(String userId) async {
    _isLoading = true;
    _errorMessage = null;
    notifyListeners();

    try {
      await _dbService.promoteToDelivery(userId);
      await fetchAvailableDeliveryPersons();
      _isLoading = false;
      notifyListeners();
      return true;
    } catch (e) {
      _errorMessage = 'Error al promover usuario: $e';
      _isLoading = false;
      notifyListeners();
      return false;
    }
  }

  // Obtener pedidos sin asignar

  Future<void> fetchUnassignedOrders() async {
    _isLoading = true;
    _errorMessage = null;
    notifyListeners();

    try {
      _unassignedOrders = await _dbService.getUnassignedOrders();
      _isLoading = false;
      notifyListeners();
    } catch (e) {
      _errorMessage = 'Error: $e';
      _isLoading = false;
      notifyListeners();
    }
  }

  // Obtener repartidores disponibles
  Future<void> fetchAvailableDeliveryPersons() async {
    _isLoading = true;
    _errorMessage = null;
    notifyListeners();

    try {
      _availableDeliveryPersons =
          await _dbService.getAvailableDeliveryPersons();
      _isLoading = false;
      notifyListeners();
    } catch (e) {
      _errorMessage = 'Error: $e';
      _isLoading = false;
      notifyListeners();
    }
  }

  // Asignar repartidor a pedido
  Future<bool> assignOrderToDelivery(
    String orderId,
    String deliveryPersonId,
  ) async {
    _isLoading = true;
    notifyListeners();

    try {
      await _dbService.assignDeliveryToPerson(orderId, deliveryPersonId);

      // Actualizar listas locales
      _unassignedOrders.removeWhere((order) => order.id == orderId);

      _isLoading = false;
      notifyListeners();
      return true;
    } catch (e) {
      _errorMessage = 'Error al asignar: $e';
      _isLoading = false;
      notifyListeners();
      return false;
    }
  }

  // Obtener estadísticas
  Future<Map<String, int>> getOrderStats() async {
    try {
      final pending = await _dbService.getOrdersByStatus('pending');
      final assigned = await _dbService.getOrdersByStatus('assigned');
      final inTransit = await _dbService.getOrdersByStatus('in_transit');
      final delivered = await _dbService.getOrdersByStatus('delivered');

      return {
        'pending': pending.length,
        'assigned': assigned.length,
        'inTransit': inTransit.length,
        'delivered': delivered.length,
        'total':
            pending.length +
            assigned.length +
            inTransit.length +
            delivered.length,
      };
    } catch (e) {
      return {};
    }
  }

  // ==================== MÉTODOS AVANZADOS DEL DASHBOARD ====================

  // Estadísticas completas del dashboard
  Future<void> fetchDashboardStats() async {
    try {
      final today = DateTime.now();
      final todayStart = DateTime(today.year, today.month, today.day);
      final weekAgo = today.subtract(const Duration(days: 7));
      
      // Obtener todos los pedidos
      final allOrders = await supabase
          .from('orders')
          .select('*, order_items(*)')
          .order('fecha_creacion', ascending: false);
      
      final orders = (allOrders as List).map((o) => Order.fromJson(o)).toList();
      
      // Pedidos de hoy
      final todayOrders = orders.where((o) => 
        o.fechaCreacion.isAfter(todayStart)
      ).toList();
      
      // Ingresos de hoy
      final todayRevenue = todayOrders.fold<double>(0, (sum, o) => sum + o.total);
      
      // Pedidos por estado
      final pendingOrders = orders.where((o) => o.estado == OrderStatus.pending).length;
      final assignedOrders = orders.where((o) => o.estado == OrderStatus.assigned).length;
      final inTransitOrders = orders.where((o) => o.estado == OrderStatus.in_transit).length;
      final deliveredOrders = orders.where((o) => o.estado == OrderStatus.delivered).length;
      final activeOrders = pendingOrders + assignedOrders + inTransitOrders;
      
      // Entregados hoy
      final deliveredToday = orders.where((o) => 
        o.estado == OrderStatus.delivered && 
        o.fechaCreacion.isAfter(todayStart)
      ).length;
      
      // Repartidores
      final deliveryResponse = await supabase
          .from('delivery_profiles')
          .select('*, users(*)');
      
      final deliveryPersons = (deliveryResponse as List)
          .map((d) => DeliveryPerson.fromJson(d))
          .toList();
      
      final availableDelivery = deliveryPersons
          .where((d) => d.estadoDisponibilidad == DeliveryPersonStatus.available)
          .length;
      
      // Calificación promedio
      final avgRating = deliveryPersons.isEmpty 
          ? 0.0 
          : deliveryPersons.map((d) => d.calificacionPromedio).reduce((a, b) => a + b) / deliveryPersons.length;
      
      // Ingresos semanales (últimos 7 días)
      final weeklyRevenue = List<double>.generate(7, (index) {
        final day = today.subtract(Duration(days: 6 - index));
        final dayStart = DateTime(day.year, day.month, day.day);
        final dayEnd = dayStart.add(const Duration(days: 1));
        return orders
            .where((o) => 
              o.fechaCreacion.isAfter(dayStart) && 
              o.fechaCreacion.isBefore(dayEnd) &&
              (o.estado == OrderStatus.delivered || o.estado == OrderStatus.in_transit)
            )
            .fold<double>(0, (sum, o) => sum + o.total);
      });
      
      // Calcular tendencias (comparación con semana anterior)
      final lastWeekRevenue = orders
          .where((o) => 
            o.fechaCreacion.isAfter(weekAgo.subtract(const Duration(days: 7))) &&
            o.fechaCreacion.isBefore(weekAgo) &&
            o.estado == OrderStatus.delivered
          )
          .fold<double>(0, (sum, o) => sum + o.total);
      
      final thisWeekRevenue = weeklyRevenue.reduce((a, b) => a + b);
      final revenueTrend = lastWeekRevenue > 0 
          ? ((thisWeekRevenue - lastWeekRevenue) / lastWeekRevenue) * 100 
          : 0.0;
      
      _dashboardStats = {
        'todayOrders': todayOrders.length,
        'todayRevenue': todayRevenue,
        'pendingOrders': pendingOrders,
        'assignedOrders': assignedOrders,
        'inTransitOrders': inTransitOrders,
        'deliveredOrders': deliveredOrders,
        'deliveredToday': deliveredToday,
        'activeOrders': activeOrders,
        'totalOrders': orders.length,
        'availableDelivery': availableDelivery,
        'totalDelivery': deliveryPersons.length,
        'avgRating': avgRating,
        'weeklyRevenue': weeklyRevenue,
        'weeklyGrowth': revenueTrend,
        'revenueTrend': revenueTrend,
      };
      
      notifyListeners();
    } catch (e) {
      _errorMessage = 'Error al cargar estadísticas: $e';
    }
  }

  // Pedidos recientes
  Future<void> fetchRecentOrders({int limit = 10}) async {
    try {
      final response = await supabase
          .from('orders')
          .select('*, order_items(*)')
          .order('fecha_creacion', ascending: false)
          .limit(limit);
      
      _recentOrders = (response as List)
          .map((o) => Order.fromJson(o))
          .toList();
      
      notifyListeners();
    } catch (e) {
      _errorMessage = 'Error al cargar pedidos recientes: $e';
    }
  }

  // Obtener todos los pedidos con filtros
  Future<void> fetchAllOrders({
    String? status,
    DateTime? dateFrom,
    DateTime? dateTo,
    String? searchQuery,
  }) async {
    _isLoading = true;
    notifyListeners();
    
    try {
      var query = supabase.from('orders').select('*, order_items(*)');
      
      if (status != null && status != 'all') {
        query = query.eq('estado', status);
      }
      
      if (dateFrom != null) {
        query = query.gte('fecha_creacion', dateFrom.toIso8601String());
      }
      
      if (dateTo != null) {
        query = query.lte('fecha_creacion', dateTo.toIso8601String());
      }
      
      final response = await query.order('fecha_creacion', ascending: false);
      
      var orders = (response as List).map((o) => Order.fromJson(o)).toList();
      
      if (searchQuery != null && searchQuery.isNotEmpty) {
        orders = orders.where((o) => 
          o.id.toLowerCase().contains(searchQuery.toLowerCase()) ||
          o.direccionEntrega.toLowerCase().contains(searchQuery.toLowerCase())
        ).toList();
      }
      
      _allOrders = orders;
      _isLoading = false;
      notifyListeners();
    } catch (e) {
      _errorMessage = 'Error al cargar pedidos: $e';
      _isLoading = false;
      notifyListeners();
    }
  }

  // Obtener repartidores completos con sus estadísticas
  Future<void> fetchAllDeliveryPersons() async {
    _isLoading = true;
    notifyListeners();
    
    try {
      final response = await supabase
          .from('delivery_profiles')
          .select('*, users(*)');
      
      _deliveryPersons = (response as List)
          .map((d) => DeliveryPerson.fromJson(d))
          .toList();
      
      _isLoading = false;
      notifyListeners();
    } catch (e) {
      _errorMessage = 'Error al cargar repartidores: $e';
      _isLoading = false;
      notifyListeners();
    }
  }

  // Actualizar disponibilidad del repartidor
  Future<bool> updateDeliveryPersonStatus(
    String deliveryId,
    DeliveryPersonStatus status,
  ) async {
    try {
      await supabase
          .from('delivery_profiles')
          .update({'estado_disponibilidad': status.name})
          .eq('id', deliveryId);
      
      await fetchAllDeliveryPersons();
      return true;
    } catch (e) {
      _errorMessage = 'Error al actualizar estado: $e';
      notifyListeners();
      return false;
    }
  }

  // Estadísticas para el período seleccionado
  Future<Map<String, dynamic>> fetchPeriodStats(String period) async {
    final now = DateTime.now();
    DateTime startDate;
    
    switch (period) {
      case 'today':
        startDate = DateTime(now.year, now.month, now.day);
        break;
      case 'week':
        startDate = now.subtract(const Duration(days: 7));
        break;
      case 'month':
        startDate = DateTime(now.year, now.month, 1);
        break;
      default:
        startDate = DateTime(now.year, now.month, now.day);
    }
    
    try {
      final response = await supabase
          .from('orders')
          .select('*, order_items(*)')
          .gte('fecha_creacion', startDate.toIso8601String());
      
      final orders = (response as List).map((o) => Order.fromJson(o)).toList();
      
      return {
        'totalOrders': orders.length,
        'totalRevenue': orders.fold<double>(0, (sum, o) => sum + o.total),
        'avgOrderValue': orders.isEmpty ? 0 : orders.fold<double>(0, (sum, o) => sum + o.total) / orders.length,
      };
    } catch (e) {
      return {};
    }
  }

  void setSelectedPeriod(String period) {
    _selectedPeriod = period;
    notifyListeners();
  }

  // Eliminar todos los pedidos
  Future<void> clearAllOrders() async {
    _isLoading = true;
    _errorMessage = null;
    notifyListeners();

    try {
      // 1. Eliminar primero los items de los pedidos para evitar errores de llave foránea
      await supabase.from('order_items').delete().neq('id', '00000000-0000-0000-0000-000000000000');
      
      // 2. Eliminar todos los pedidos
      await supabase.from('orders').delete().neq('id', '00000000-0000-0000-0000-000000000000');
      
      _isLoading = false;
      notifyListeners();
    } catch (e) {
      _errorMessage = 'Error al eliminar pedidos: $e';
      _isLoading = false;
      notifyListeners();
    }
  }
}
