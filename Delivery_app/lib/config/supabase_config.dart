import 'package:supabase_flutter/supabase_flutter.dart';

class SupabaseConfig {
  // Credenciales de Supabase
  static const String supabaseUrl = 'https://mmtbjwuqlatwlapcmitl.supabase.co';
  static const String supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1tdGJqd3VxbGF0d2xhcGNtaXRsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODgzMDYyNzQsImV4cCI6MjEwMzg4MjI3NH0.nwQEIFCyQHs7cY3tcZmI0NQDS0HoVrfoN8H4WLsylYY';

  static Future<void> initialize() async {
    await Supabase.initialize(
      url: supabaseUrl,
      anonKey: supabaseAnonKey,
    );
  }

  static SupabaseClient get client => Supabase.instance.client;
}
