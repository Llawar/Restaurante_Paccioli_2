import 'package:delivery/models/cart_item_model.dart';
import 'package:delivery/models/product_model.dart';
import 'package:delivery/services/database_service.dart';
import 'package:flutter/material.dart';

class CartProvider extends ChangeNotifier {
  final List<CartItem> _items = [];
  bool _isLoading = false;

  // Getters
  List<CartItem> get items => _items;
  bool get isLoading => _isLoading;
  int get itemCount => _items.fold(0, (sum, item) => sum + item.cantidad);
  double get total => _items.fold(0, (sum, item) => sum + item.subtotal);
  bool get isEmpty => _items.isEmpty;

  // Agregar producto al carrito
  void addToCart(Product product, {int cantidad = 1}) {
    final existingItem = _items.firstWhere(
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
      _items.add(existingItem.copyWith(cantidad: cantidad));
    } else {
      final index = _items.indexOf(existingItem);
      _items[index] = existingItem.copyWith(
        cantidad: existingItem.cantidad + cantidad,
      );
    }

    notifyListeners();
  }

  // Incrementar cantidad
  void increaseQuantity(String productoId) {
    final index = _items.indexWhere((item) => item.productoId == productoId);
    if (index >= 0) {
      final item = _items[index];
      _items[index] = item.copyWith(cantidad: item.cantidad + 1);
      notifyListeners();
    }
  }

  // Decrementar cantidad
  void decreaseQuantity(String productoId) {
    final index = _items.indexWhere((item) => item.productoId == productoId);
    if (index >= 0) {
      final item = _items[index];
      if (item.cantidad > 1) {
        _items[index] = item.copyWith(cantidad: item.cantidad - 1);
      } else {
        _items.removeAt(index);
      }
      notifyListeners();
    }
  }

  // Remover producto
  void removeFromCart(String productoId) {
    _items.removeWhere((item) => item.productoId == productoId);
    notifyListeners();
  }

  // Limpiar carrito
  void clear() {
    _items.clear();
    notifyListeners();
  }

  // Crear orden
  Future<bool> checkout(
    String clienteId,
    String direccion,
    String metodoPago,
    double lat,
    double lng,
  ) async {
    _isLoading = true;
    notifyListeners();

    try {
      final dbService = DatabaseService();

      final items =
          _items
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
       );

      clear();
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
