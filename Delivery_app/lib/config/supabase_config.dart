import 'package:supabase_flutter/supabase_flutter.dart';

class SupabaseConfig {
  // Credenciales de Supabase
  static const String supabaseUrl = 'https://oywjtoventqgzcotqpny.supabase.co';
  static const String supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im95d2p0b3ZlbnRxZ3pjb3RxcG55Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODU2OTA0MTIsImV4cCI6MjEwMTI2NjQxMn0.v3nRbYvidxeJ5K_izbjIMZvVsIcpzpIgXcz6VWp6R5g';

  static Future<void> initialize() async {
    await Supabase.initialize(
      url: supabaseUrl,
      anonKey: supabaseAnonKey,
    );
  }

  static SupabaseClient get client => Supabase.instance.client;
}
