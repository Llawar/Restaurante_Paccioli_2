import 'package:delivery/config/constants.dart';
import 'package:delivery/models/order_model.dart';
import 'package:delivery/services/database_service.dart';
import 'package:flutter/material.dart';
import 'package:geolocator/geolocator.dart';
import 'dart:async';

class DeliveryProvider extends ChangeNotifier {
  final _dbService = DatabaseService();
  
  List<Order> _activeOrders = [];
  List<Order> _historyOrders = [];
  List<Order> _availableOrders = [];
  Map<String, dynamic> _profile = {};
  bool _isLoading = false;
  String? _errorMessage;
  StreamSubscription<Position>? _positionSubscription;

  List<Order> get activeOrders => _activeOrders;
  List<Order> get historyOrders => _historyOrders;
  List<Order> get availableOrders => _availableOrders;
  Map<String, dynamic> get profile => _profile;
  bool get isLoading => _isLoading;
  String? get errorMessage => _errorMessage;

  // Cargar datos del repartidor


  Future<void> fetchDeliveryData(String userId) async {
    _isLoading = true;
    _errorMessage = null;
    notifyListeners();

    try {
      await Future.wait([
        _loadActiveOrders(userId),
        _loadHistory(userId),
        _loadProfile(userId),
        fetchAvailableOrders(),
      ]);
      _isLoading = false;
    } catch (e) {
      _errorMessage = e.toString();
      _isLoading = false;
    }
    notifyListeners();
  }

  Future<void> fetchAvailableOrders() async {
    try {
      _availableOrders = await _dbService.getUnassignedOrders();
      notifyListeners();
    } catch (e) {
      _errorMessage = e.toString();
      notifyListeners();
    }
  }

  Future<bool> acceptOrder(String orderId, String userId) async {
    try {
      await _dbService.assignDeliveryToPerson(orderId, userId);
      
      // Actualizar listas
      await _loadActiveOrders(userId);
      await fetchAvailableOrders();
      
      notifyListeners();
      return true;
    } catch (e) {
      _errorMessage = e.toString();
      notifyListeners();
      return false;
    }
  }

  Future<void> _loadActiveOrders(String userId) async {

    _activeOrders = await _dbService.getDeliveryOrders(userId);
  }

  Future<void> _loadHistory(String userId) async {
    _historyOrders = await _dbService.getDeliveryHistory(userId);
  }

  Future<void> _loadProfile(String userId) async {
    _profile = await _dbService.getDeliveryProfile(userId);
  }

  // Actualizar estado del pedido
  Future<bool> updateOrderStatus(String orderId, String status) async {
    try {
      await _dbService.updateOrderStatus(orderId, status);
      // Recargar pedidos activos e historial
      final userId = _profile['user_id'] ?? ''; 
      // Nota: En un entorno real, el userId vendría del AuthProvider
      // pero aquí lo manejamos vía perfil cargado.
      
      // Para simplificar, refrescamos todo
      await _loadActiveOrders(userId);
      await _loadHistory(userId);
      
      notifyListeners();
      return true;
    } catch (e) {
      _errorMessage = e.toString();
      notifyListeners();
      return false;
    }
  }

  // Actualizar disponibilidad
  Future<bool> setAvailability(String userId, String status) async {
    try {
      await _dbService.updateDeliveryAvailability(userId, status);
      if (_profile.containsKey('estado_disponibilidad')) {
        _profile['estado_disponibilidad'] = status;
      }

      
      // If becoming available, start tracking location
      if (status == 'available') {
        _startLocationTracking(userId);
      } else {
        _stopLocationTracking();
      }
      
      notifyListeners();
      return true;
    } catch (e) {
      _errorMessage = e.toString();
      notifyListeners();
      return false;
    }
  }

  void _startLocationTracking(String userId) async {
    _positionSubscription?.cancel();
    
    try {
      LocationPermission permission = await Geolocator.checkPermission();
      if (permission == LocationPermission.denied) {
        permission = await Geolocator.requestPermission();
        if (permission == LocationPermission.denied) return;
      }

      _positionSubscription = Geolocator.getPositionStream(
        locationSettings: const LocationSettings(
          accuracy: LocationAccuracy.high,
          distanceFilter: 10, // Update every 10 meters
        ),
      ).listen((Position position) async {
        await _dbService.updateDeliveryLocation(
          userId, 
          position.latitude, 
          position.longitude
        );
      });
    } catch (e) {
      _errorMessage = 'Error iniciando rastreo: $e';
      notifyListeners();
    }
  }

  void _stopLocationTracking() {
    _positionSubscription?.cancel();
    _positionSubscription = null;
  }

  @override
  void dispose() {
    _stopLocationTracking();
    super.dispose();
  }

}
