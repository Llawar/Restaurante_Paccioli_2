import 'package:delivery/providers/auth_provider.dart';
import 'package:delivery/providers/delivery_provider.dart';
import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'delivery_orders_screen.dart';
import 'delivery_profile_screen.dart';
import 'available_orders_screen.dart';


class DeliveryHomeScreen extends StatefulWidget {
  const DeliveryHomeScreen({super.key});

  @override
  State<DeliveryHomeScreen> createState() => _DeliveryHomeScreenState();
}

class _DeliveryHomeScreenState extends State<DeliveryHomeScreen> {
  int _selectedIndex = 0;

  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) {
      final userId = context.read<AuthProvider>().currentUser?.id;
      if (userId != null) {
        context.read<DeliveryProvider>().fetchDeliveryData(userId);
      }
    });
  }

  final List<Widget> _screens = [

    const AvailableOrdersScreen(),
    const DeliveryOrdersScreen(),
    const DeliveryProfileScreen(),
  ];


  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);

    return Scaffold(
      body: _screens[_selectedIndex],
      bottomNavigationBar: NavigationBar(
        selectedIndex: _selectedIndex,
        onDestinationSelected: (index) {
          setState(() => _selectedIndex = index);
        },
        backgroundColor: theme.colorScheme.surface,
         destinations: const [
           NavigationDestination(
             icon: Icon(Icons.assignment_outlined),
             selectedIcon: Icon(Icons.assignment),
             label: 'Disponibles',
           ),
           NavigationDestination(
             icon: Icon(Icons.list_alt),
             selectedIcon: Icon(Icons.list_alt),
             label: 'Mis Entregas',
           ),
           NavigationDestination(
             icon: Icon(Icons.person_outline),
             selectedIcon: Icon(Icons.person),
             label: 'Perfil',
           ),
         ],
      ),
    );
  }
}
