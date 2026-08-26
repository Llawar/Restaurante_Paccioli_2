import 'package:delivery/config/constants.dart';

class DeliveryPerson {
  final String id;
  final String userId;
  final String numeroVehiculo;
  final VehicleType tipoVehiculo;
  final String documento;
  final DeliveryPersonStatus estadoDisponibilidad;
  final double calificacionPromedio;
  final int entregasCompletadas;
  final double? latitudActual;
  final double? longitudActual;

  DeliveryPerson({
    required this.id,
    required this.userId,
    required this.numeroVehiculo,
    required this.tipoVehiculo,
    required this.documento,
    required this.estadoDisponibilidad,
    required this.calificacionPromedio,
    required this.entregasCompletadas,
    this.latitudActual,
    this.longitudActual,
  });

  factory DeliveryPerson.fromJson(Map<String, dynamic> json) {
    return DeliveryPerson(
      id: json['id'] ?? '',
      userId: json['user_id'] ?? '',
      numeroVehiculo: json['numero_vehiculo'] ?? '',
      tipoVehiculo: _parseVehicleType(json['tipo_vehiculo']),
      documento: json['documento'] ?? '',
      estadoDisponibilidad: _parseStatus(json['estado_disponibilidad']),
      calificacionPromedio: (json['calificacion_promedio'] ?? 0).toDouble(),
      entregasCompletadas: json['entregas_completadas'] ?? 0,
      latitudActual:
          json['ubicacion_actual'] != null
              ? (json['ubicacion_actual']['latitude']).toDouble()
              : null,
      longitudActual:
          json['ubicacion_actual'] != null
              ? (json['ubicacion_actual']['longitude']).toDouble()
              : null,
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'user_id': userId,
      'numero_vehiculo': numeroVehiculo,
      'tipo_vehiculo': tipoVehiculo.name,
      'documento': documento,
      'estado_disponibilidad': estadoDisponibilidad.name,
      'calificacion_promedio': calificacionPromedio,
      'entregas_completadas': entregasCompletadas,
    };
  }

  static VehicleType _parseVehicleType(String? type) {
    switch (type) {
      case 'motorcycle':
        return VehicleType.motorcycle;
      case 'car':
        return VehicleType.car;
      case 'bicycle':
        return VehicleType.bicycle;
      default:
        return VehicleType.motorcycle;
    }
  }

  static DeliveryPersonStatus _parseStatus(String? status) {
    switch (status) {
      case 'available':
        return DeliveryPersonStatus.available;
      case 'busy':
        return DeliveryPersonStatus.busy;
      case 'offline':
        return DeliveryPersonStatus.offline;
      default:
        return DeliveryPersonStatus.offline;
    }
  }
}
