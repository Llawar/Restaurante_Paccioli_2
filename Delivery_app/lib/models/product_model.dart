class Product {
  final String id;
  final String nombre;
  final String descripcion;
  final double precio;
  final String categoria;
  final String? imagenUrl;
  final int stock;
  final bool estado;
  final DateTime createdAt;

  Product({
    required this.id,
    required this.nombre,
    required this.descripcion,
    required this.precio,
    required this.categoria,
    this.imagenUrl,
    required this.stock,
    required this.estado,
    required this.createdAt,
  });

  factory Product.fromJson(Map<String, dynamic> json) {
    return Product(
      id: json['id'] ?? '',
      nombre: json['nombre'] ?? '',
      descripcion: json['descripcion'] ?? '',
      precio: (json['precio'] ?? 0).toDouble(),
      categoria: json['categoria'] ?? '',
      imagenUrl: json['imagen_url'],
      stock: json['stock'] ?? 0,
      estado: json['estado'] ?? true,
      createdAt: DateTime.parse(json['created_at'] ?? DateTime.now().toString()),
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'nombre': nombre,
      'descripcion': descripcion,
      'precio': precio,
      'categoria': categoria,
      'imagen_url': imagenUrl,
      'stock': stock,
      'estado': estado,
      'created_at': createdAt.toIso8601String(),
    };
  }
}
