import 'package:delivery/config/constants.dart';
import 'package:delivery/config/supabase_config.dart';
import 'package:delivery/models/user_model.dart' as app_user;
import 'package:supabase_flutter/supabase_flutter.dart';

class AuthService {
  final supabase = SupabaseConfig.client;

  // Registrar nuevo usuario
  Future<app_user.User?> register({
    required String email,
    required String password,
    required String nombre,
    required String telefono,
    required UserRole rol,
  }) async {
    try {
      // 1. Registrar en Supabase Auth
      final AuthResponse response = await supabase.auth.signUp(
        email: email,
        password: password,
      );

      if (response.user == null) {
        throw Exception('Error en el registro');
      }

      // 2. Actualizar el usuario en tabla users (el trigger ya creó la fila)
      final userData = {
        'id': response.user!.id,
        'email': email,
        'nombre': nombre,
        'telefono': telefono,
        'rol': rol.name,
        'estado': true,
      };

      await supabase
          .from(TableNames.users)
          .upsert(userData);

      // 3. Crear perfil según rol
      if (rol == UserRole.client) {
        await supabase
            .from(TableNames.clientProfiles)
            .insert({
              'user_id': response.user!.id,
              'calificacion_promedio': 0.0,
            });
      } else if (rol == UserRole.delivery) {
        await supabase
            .from(TableNames.deliveryProfiles)
            .insert({
              'user_id': response.user!.id,
              'estado_disponibilidad': 'offline',
              'calificacion_promedio': 0.0,
              'entregas_completadas': 0,
            });
      }

      // 4. Retornar usuario
      return app_user.User.fromJson(userData);
    } on AuthException catch (e) {
      throw Exception('Error de autenticación: ${e.message}');
    } catch (e) {
      throw Exception('Error en registro: $e');
    }
  }

  // Login
  Future<app_user.User?> login({
    required String email,
    required String password,
  }) async {
    try {
      final AuthResponse response = await supabase.auth.signInWithPassword(
        email: email,
        password: password,
      );

      if (response.user == null) {
        throw Exception('Email o contraseña incorrectos');
      }

      // Obtener datos del usuario desde la tabla users
      final userData = await supabase
          .from(TableNames.users)
          .select()
          .eq('id', response.user!.id)
          .single();

      return app_user.User.fromJson(userData);
    } on AuthException catch (e) {
      throw Exception('Error de autenticación: ${e.message}');
    } catch (e) {
      throw Exception('Error en login: $e');
    }
  }

  // Logout
  Future<void> logout() async {
    try {
      await supabase.auth.signOut();
    } catch (e) {
      throw Exception('Error al cerrar sesión: $e');
    }
  }

  // Obtener usuario actual
  Future<app_user.User?> getCurrentUser() async {
    try {
      final session = supabase.auth.currentSession;
      if (session == null) return null;

      final userData = await supabase
          .from(TableNames.users)
          .select()
          .eq('id', session.user.id)
          .single();

      return app_user.User.fromJson(userData);
    } catch (e) {
      return null;
    }
  }

  // Verificar si hay sesión activa
  bool isUserLoggedIn() {
    return supabase.auth.currentSession != null;
  }

  // Eliminar cuenta permanentemente
  Future<void> deleteAccount(String password) async {
    try {
      // 1. Verificar contraseña intentando hacer login
      await supabase.auth.signInWithPassword(
        email: supabase.auth.currentUser!.email!,
        password: password,
      );

      // 2. Llamar a función RPC para eliminar usuario de auth.users y tablas públicas
      // Nota: Esta función debe existir en Supabase SQL Editor
      await supabase.rpc('delete_user');

      // 3. Cerrar sesión
      await logout();
    } on AuthException catch (e) {
      throw Exception('Contraseña incorrecta: ${e.message}');
    } catch (e) {
      throw Exception('Error al eliminar cuenta: $e');
    }
  }
}
