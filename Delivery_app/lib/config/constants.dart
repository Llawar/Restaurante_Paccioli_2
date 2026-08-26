// Enums para Roles
enum UserRole { admin, client, delivery }

enum OrderStatus { pending, assigned, in_transit, delivered, cancelled }

enum VehicleType { motorcycle, car, bicycle }

enum DeliveryPersonStatus { available, busy, offline }

// Constantes de la app
class AppConstants {
  static const String appName = 'Delivery App';
  static const String appVersion = '1.0.0';

  // Timeouts
  static const Duration connectionTimeout = Duration(seconds: 30);
  static const Duration responseTimeout = Duration(seconds: 30);

  // Validaciones
  static const int minPasswordLength = 8;
  static const int maxNameLength = 50;
}

// Tabla names en Supabase
class TableNames {
  static const String users = 'users';
  static const String clientProfiles = 'client_profiles';
  static const String deliveryProfiles = 'delivery_profiles';
  static const String products = 'products';
  static const String orders = 'orders';
  static const String orderItems = 'order_items';
}
