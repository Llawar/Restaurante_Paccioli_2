import 'package:delivery/config/constants.dart';

class Order {
  final String id;
  final String clienteId;
  final String? repartidorId;
  final OrderStatus estado;
  final String direccionEntrega;
  final String metodoPago;
  final double latitud;
  final double longitud;
  final double total;
  final DateTime fechaCreacion;
  final DateTime? fechaEntregaEstimada;
  final int? calificacion;
  final List<OrderItem> items;

  Order({
    required this.id,
    required this.clienteId,
    this.repartidorId,
    required this.estado,
    required this.direccionEntrega,
    required this.metodoPago,
    required this.latitud,
    required this.longitud,
    required this.total,
    required this.fechaCreacion,
    this.fechaEntregaEstimada,
    this.calificacion,
    required this.items,
  });

  factory Order.fromJson(Map<String, dynamic> json) {
    return Order(
      id: json['id'] ?? '',
      clienteId: json['cliente_id'] ?? '',
      repartidorId: json['repartidor_id'],
      estado: _parseStatus(json['estado']),
      direccionEntrega: json['direccion_entrega'] ?? '',
      metodoPago: json['metodo_pago'] ?? 'Efectivo',
      latitud: (json['latitud'] ?? 0).toDouble(),
      longitud: (json['longitud'] ?? 0).toDouble(),
      total: (json['total'] ?? 0).toDouble(),
      fechaCreacion: DateTime.parse(
        json['fecha_creacion'] ?? DateTime.now().toString(),
      ),
      fechaEntregaEstimada:
          json['fecha_entrega_estimada'] != null
              ? DateTime.parse(json['fecha_entrega_estimada'])
              : null,
      calificacion: json['calificacion'],
      items:
          json['order_items'] != null
              ? (json['order_items'] as List)
                  .map((item) => OrderItem.fromJson(item))
                  .toList()
              : [],
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'cliente_id': clienteId,
      'repartidor_id': repartidorId,
      'estado': estado.name,
      'direccion_entrega': direccionEntrega,
      'metodo_pago': metodoPago,
      'latitud': latitud,
      'longitud': longitud,
      'total': total,
      'fecha_creacion': fechaCreacion.toIso8601String(),
      'fecha_entrega_estimada': fechaEntregaEstimada?.toIso8601String(),
      'calificacion': calificacion,
    };
  }

  static OrderStatus _parseStatus(String? status) {
    switch (status) {
      case 'pending':
        return OrderStatus.pending;
      case 'reserved':
        return OrderStatus.reserved;
      case 'ready_for_pickup':
        return OrderStatus.readyForPickup;
      case 'assigned':
        return OrderStatus.assigned;
      case 'in_transit':
        return OrderStatus.in_transit;
      case 'delivered':
        return OrderStatus.delivered;
      case 'cancelled':
        return OrderStatus.cancelled;
      default:
        return OrderStatus.pending;
    }
  }
}

class OrderItem {
  final String id;
  final String pedidoId;
  final String productoId;
  final String? nombreProducto;
  final int cantidad;
  final double precioUnitario;
  final double subtotal;

  OrderItem({
    required this.id,
    required this.pedidoId,
    required this.productoId,
    this.nombreProducto,
    required this.cantidad,
    required this.precioUnitario,
    required this.subtotal,
  });

  factory OrderItem.fromJson(Map<String, dynamic> json) {
    return OrderItem(
      id: json['id'] ?? '',
      pedidoId: json['pedido_id'] ?? '',
      productoId: json['producto_id'] ?? '',
      nombreProducto:
          json['nombre_producto'] ?? json['productos']?['nombre'] ?? 'Producto',
      cantidad: json['cantidad'] ?? 0,
      precioUnitario: (json['precio_unitario'] ?? 0).toDouble(),
      subtotal: (json['subtotal'] ?? 0).toDouble(),
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'pedido_id': pedidoId,
      'producto_id': productoId,
      'nombre_producto': nombreProducto,
      'cantidad': cantidad,
      'precio_unitario': precioUnitario,
      'subtotal': subtotal,
    };
  }
}
