import 'package:delivery/config/constants.dart';
import 'package:delivery/models/order_model.dart';
import 'package:delivery/models/product_model.dart';
import 'package:delivery/providers/cart_provider.dart';
import 'package:flutter_test/flutter_test.dart';

void main() {
  test('parsea estado reservado', () {
    final order = Order.fromJson({
      'id': '1',
      'cliente_id': 'cliente-1',
      'direccion_entrega': 'Calle 123',
      'metodo_pago': 'Efectivo',
      'latitud': 0.0,
      'longitud': 0.0,
      'total': 50.0,
      'fecha_creacion': '2026-01-01T10:00:00.000Z',
      'estado': 'reserved',
      'order_items': const [],
    });

    expect(order.estado, OrderStatus.reserved);
  });

  test('parsea estado listo para recoger', () {
    final order = Order.fromJson({
      'id': '2',
      'cliente_id': 'cliente-1',
      'direccion_entrega': 'Calle 456',
      'metodo_pago': 'Efectivo',
      'latitud': 0.0,
      'longitud': 0.0,
      'total': 75.0,
      'fecha_creacion': '2026-01-01T10:00:00.000Z',
      'estado': 'ready_for_pickup',
      'order_items': const [],
    });

    expect(order.estado, OrderStatus.readyForPickup);
  });

  test('separa pedido y reserva en listas distintas', () {
    final provider = CartProvider();
    final product = Product(
      id: 'prod-1',
      nombre: 'Empanada',
      descripcion: 'Empanada de queso',
      precio: 12.5,
      categoria: 'Snacks',
      imagenUrl: 'https://example.com/empanada.jpg',
      stock: 5,
      estado: true,
      createdAt: DateTime.now(),
    );

    provider.addToCart(product, isReservation: false);
    provider.addToCart(product, isReservation: true);

    expect(provider.orderItems.length, 1);
    expect(provider.reservationItems.length, 1);
    expect(provider.orderTotal, 12.5);
    expect(provider.reservationTotal, 12.5);
  });

  test('suma y resta cantidades sin bajar de uno', () {
    final provider = CartProvider();
    final product = Product(
      id: 'prod-2',
      nombre: 'Hamburguesa',
      descripcion: 'Hamburguesa clásica',
      precio: 25.0,
      categoria: 'Comida',
      imagenUrl: null,
      stock: 10,
      estado: true,
      createdAt: DateTime.now(),
    );

    provider.addToCart(product, cantidad: 1, isReservation: true);
    provider.increaseQuantity(product.id, isReservation: true);
    expect(provider.reservationItems.single.cantidad, 2);

    provider.decreaseQuantity(product.id, isReservation: true);
    expect(provider.reservationItems.single.cantidad, 1);

    provider.decreaseQuantity(product.id, isReservation: true);
    expect(provider.reservationItems.single.cantidad, 1);
    expect(provider.orderItems, isEmpty);
  });
}
