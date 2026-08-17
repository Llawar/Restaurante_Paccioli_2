class CartItem {
  final String productoId;
  final String nombre;
  final double precio;
  int cantidad;
  final String? imagenUrl;

  CartItem({
    required this.productoId,
    required this.nombre,
    required this.precio,
    required this.cantidad,
    this.imagenUrl,
  });

  double get subtotal => precio * cantidad;

  CartItem copyWith({
    String? productoId,
    String? nombre,
    double? precio,
    int? cantidad,
    String? imagenUrl,
  }) {
    return CartItem(
      productoId: productoId ?? this.productoId,
      nombre: nombre ?? this.nombre,
      precio: precio ?? this.precio,
      cantidad: cantidad ?? this.cantidad,
      imagenUrl: imagenUrl ?? this.imagenUrl,
    );
  }
}
