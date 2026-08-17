import 'package:delivery/models/order_model.dart';
import 'package:delivery/models/product_model.dart';
import 'package:delivery/services/database_service.dart';
import 'package:flutter/material.dart';

class UserProvider extends ChangeNotifier {
  final DatabaseService _dbService = DatabaseService();

  List<Product> _products = [];
  List<Order> _orders = [];
  bool _isLoading = false;
  String? _errorMessage;

  // Getters
  List<Product> get products => _products;
  List<Order> get orders => _orders;
  bool get isLoading => _isLoading;
  String? get errorMessage => _errorMessage;

  // Obtener todos los productos
  Future<void> fetchProducts() async {
    _isLoading = true;
    _errorMessage = null;
    notifyListeners();

    try {
      _products = await _dbService.getAllProducts();
      _isLoading = false;
      notifyListeners();
    } catch (e) {
      _errorMessage = e.toString();
      _isLoading = false;
      notifyListeners();
    }
  }

  // Obtener productos por categoría
  Future<void> fetchProductsByCategory(String category) async {
    _isLoading = true;
    _errorMessage = null;
    notifyListeners();

    try {
      _products = await _dbService.getProductsByCategory(category);
      _isLoading = false;
      notifyListeners();
    } catch (e) {
      _errorMessage = e.toString();
      _isLoading = false;
      notifyListeners();
    }
  }

  // Obtener pedidos del cliente
  Future<void> fetchClientOrders(String clienteId) async {
    _isLoading = true;
    _errorMessage = null;
    notifyListeners();

    try {
      _orders = await _dbService.getClientOrders(clienteId);
      _isLoading = false;
      notifyListeners();
    } catch (e) {
      _errorMessage = e.toString();
      _isLoading = false;
      notifyListeners();
    }
  }

  // Crear pedido
  Future<Order?> createOrder({
    required String clienteId,
    required String direccionEntrega,
    required String metodoPago,
    required double latitud,
    required double longitud,
    required List<Map<String, dynamic>> items,
  }) async {
    _isLoading = true;
    _errorMessage = null;
    notifyListeners();

    try {
      final order = await _dbService.createOrder(
        clienteId: clienteId,
        direccionEntrega: direccionEntrega,
        metodoPago: metodoPago,
        latitud: latitud,
        longitud: longitud,
        items: items,
      );

      _orders.add(order);
      _isLoading = false;
      notifyListeners();
      return order;
    } catch (e) {
      _errorMessage = e.toString();
      _isLoading = false;
      notifyListeners();
      return null;
    }
  }

  // Limpiar error
  void clearError() {
    _errorMessage = null;
    notifyListeners();
  }
}
