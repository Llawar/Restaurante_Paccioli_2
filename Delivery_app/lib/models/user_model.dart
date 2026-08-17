import 'package:delivery/config/constants.dart';

class User {
  final String id;
  final String email;
  final String nombre;
  final String? telefono;
  final String? direccion;
  final UserRole rol;
  final String? fotoPerfil;
  final bool estado;
  final DateTime fechaCreacion;
  final DateTime? updatedAt;

  User({
    required this.id,
    required this.email,
    required this.nombre,
    this.telefono,
    this.direccion,
    required this.rol,
    this.fotoPerfil,
    required this.estado,
    required this.fechaCreacion,
    this.updatedAt,
  });

  // Convertir JSON a User
  factory User.fromJson(Map<String, dynamic> json) {
    return User(
      id: json['id'] ?? '',
      email: json['email'] ?? '',
      nombre: json['nombre'] ?? '',
      telefono: json['telefono'],
      direccion: json['direccion'],
      rol: _parseRole(json['rol']),
      fotoPerfil: json['foto_perfil'],
      estado: json['estado'] ?? true,
      fechaCreacion: DateTime.parse(json['fecha_creacion'] ?? DateTime.now().toString()),
      updatedAt: json['updated_at'] != null ? DateTime.parse(json['updated_at']) : null,
    );
  }

  // Convertir User a JSON
  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'email': email,
      'nombre': nombre,
      'telefono': telefono,
      'direccion': direccion,
      'rol': rol.name,
      'foto_perfil': fotoPerfil,
      'estado': estado,
      'fecha_creacion': fechaCreacion.toIso8601String(),
      'updated_at': updatedAt?.toIso8601String(),
    };
  }

  // Parsear rol desde string
  static UserRole _parseRole(String? role) {
    switch (role) {
      case 'admin':
        return UserRole.admin;
      case 'client':
        return UserRole.client;
      case 'delivery':
        return UserRole.delivery;
      default:
        return UserRole.client;
    }
  }

  // Copy with
  User copyWith({
    String? id,
    String? email,
    String? nombre,
    String? telefono,
    String? direccion,
    UserRole? rol,
    String? fotoPerfil,
    bool? estado,
    DateTime? fechaCreacion,
    DateTime? updatedAt,
  }) {
    return User(
      id: id ?? this.id,
      email: email ?? this.email,
      nombre: nombre ?? this.nombre,
      telefono: telefono ?? this.telefono,
      direccion: direccion ?? this.direccion,
      rol: rol ?? this.rol,
      fotoPerfil: fotoPerfil ?? this.fotoPerfil,
      estado: estado ?? this.estado,
      fechaCreacion: fechaCreacion ?? this.fechaCreacion,
      updatedAt: updatedAt ?? this.updatedAt,
    );
  }
}
