import 'package:delivery/models/cart_item_model.dart';
import 'package:delivery/models/product_model.dart';
import 'package:delivery/services/database_service.dart';
import 'package:flutter/material.dart';

class CartProvider extends ChangeNotifier {
  final List<CartItem> _orderItems = [];
  final List<CartItem> _reservationItems = [];
  bool _isLoading = false;
  bool _isReservationMode = false;

  // Getters
  List<CartItem> get items => [..._orderItems, ..._reservationItems];
  List<CartItem> get orderItems => _orderItems;
  List<CartItem> get reservationItems => _reservationItems;
  bool get isLoading => _isLoading;
  bool get isReservationMode => _isReservationMode;
  int get itemCount =>
      _orderItems.fold(0, (sum, item) => sum + item.cantidad) +
      _reservationItems.fold(0, (sum, item) => sum + item.cantidad);
  double get total => orderTotal + reservationTotal;
  double get orderTotal =>
      _orderItems.fold(0, (sum, item) => sum + item.subtotal);
  double get reservationTotal =>
      _reservationItems.fold(0, (sum, item) => sum + item.subtotal);
  bool get isEmpty => _orderItems.isEmpty && _reservationItems.isEmpty;

  void addToCart(
    Product product, {
    int cantidad = 1,
    bool isReservation = false,
  }) {
    final targetList = isReservation ? _reservationItems : _orderItems;
    final existingItem = targetList.firstWhere(
      (item) => item.productoId == product.id,
      orElse:
          () => CartItem(
            productoId: product.id,
            nombre: product.nombre,
            precio: product.precio,
            cantidad: 0,
            imagenUrl: product.imagenUrl,
          ),
    );

    if (existingItem.cantidad == 0) {
      targetList.add(existingItem.copyWith(cantidad: cantidad));
    } else {
      final index = targetList.indexOf(existingItem);
      targetList[index] = existingItem.copyWith(
        cantidad: existingItem.cantidad + cantidad,
      );
    }

    notifyListeners();
  }

  void increaseQuantity(String productoId, {bool isReservation = false}) {
    final targetList = isReservation ? _reservationItems : _orderItems;
    final index = targetList.indexWhere(
      (item) => item.productoId == productoId,
    );
    if (index >= 0) {
      final item = targetList[index];
      targetList[index] = item.copyWith(cantidad: item.cantidad + 1);
      notifyListeners();
    }
  }

  void decreaseQuantity(String productoId, {bool isReservation = false}) {
    final targetList = isReservation ? _reservationItems : _orderItems;
    final index = targetList.indexWhere(
      (item) => item.productoId == productoId,
    );
    if (index >= 0) {
      final item = targetList[index];
      if (item.cantidad > 1) {
        targetList[index] = item.copyWith(cantidad: item.cantidad - 1);
      }
      notifyListeners();
    }
  }

  void removeFromCart(String productoId, {bool isReservation = false}) {
    final targetList = isReservation ? _reservationItems : _orderItems;
    targetList.removeWhere((item) => item.productoId == productoId);
    notifyListeners();
  }

  void setReservationMode(bool value) {
    _isReservationMode = value;
    notifyListeners();
  }

  void clear() {
    _orderItems.clear();
    _reservationItems.clear();
    _isReservationMode = false;
    notifyListeners();
  }

  Future<bool> checkout(
    String clienteId,
    String direccion,
    String metodoPago,
    double lat,
    double lng, {
    bool isReservation = false,
  }) async {
    _isLoading = true;
    notifyListeners();

    try {
      final dbService = DatabaseService();
      final targetList = isReservation ? _reservationItems : _orderItems;

      if (targetList.isEmpty) {
        _isLoading = false;
        notifyListeners();
        return false;
      }

      final items =
          targetList
              .map(
                (item) => {
                  'producto_id': item.productoId,
                  'cantidad': item.cantidad,
                  'precio_unitario': item.precio,
                },
              )
              .toList();

      await dbService.createOrder(
        clienteId: clienteId,
        direccionEntrega: direccion,
        metodoPago: metodoPago,
        latitud: lat,
        longitud: lng,
        items: items,
        estado: isReservation ? 'reserved' : 'pending',
      );

      targetList.clear();
      _isLoading = false;
      notifyListeners();
      return true;
    } catch (e) {
      _isLoading = false;
      notifyListeners();
      return false;
    }
  }
}
