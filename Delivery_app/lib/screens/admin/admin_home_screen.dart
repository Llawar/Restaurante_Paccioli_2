import 'package:delivery/providers/auth_provider.dart';
import 'package:delivery/screens/admin/admin_dashboard_screen.dart';
import 'package:delivery/screens/admin/analytics_screen.dart';
import 'package:delivery/screens/admin/delivery_management_screen.dart';
import 'package:delivery/screens/admin/orders_management_screen.dart';
import 'package:delivery/screens/admin/products_management_screen.dart';
import 'package:flutter/material.dart';
import 'package:provider/provider.dart';

class AdminHomeScreen extends StatefulWidget {
  const AdminHomeScreen({super.key});

  @override
  State<AdminHomeScreen> createState() => _AdminHomeScreenState();
}

class _AdminHomeScreenState extends State<AdminHomeScreen> {
  int _selectedIndex = 0;

  final List<Widget> _screens = const [
    AdminDashboardScreen(),
    OrdersManagementScreen(),
    ProductsManagementScreen(),
    DeliveryManagementScreen(),
    AnalyticsScreen(),
  ];

  final List<_NavItem> _navItems = const [
    _NavItem(icon: Icons.dashboard, label: 'Dashboard', title: 'Panel Principal'),
    _NavItem(icon: Icons.shopping_bag, label: 'Pedidos', title: 'Gestión de Pedidos'),
    _NavItem(icon: Icons.inventory_2, label: 'Productos', title: 'Gestión de Productos'),
    _NavItem(icon: Icons.delivery_dining, label: 'Repartidor', title: 'Gestión de Repartidores'),
    _NavItem(icon: Icons.analytics, label: 'Análisis', title: 'Reportes y Análisis'),
  ];

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final screenWidth = MediaQuery.of(context).size.width;
    final isDesktop = screenWidth >= 800;

    return Scaffold(
      body: isDesktop
        ? Row(
            children: [
              // Navigation Rail solo para desktop - MÁS ANCHO Y CON COLOR
              Container(
                color: theme.colorScheme.primaryContainer.withValues(alpha: 0.3),
                child: NavigationRail(
                  extended: screenWidth > 1000,
                  minWidth: 90,
                  minExtendedWidth: 220,
                  selectedIndex: _selectedIndex,
                  onDestinationSelected: (index) {
                    setState(() => _selectedIndex = index);
                  },
                  backgroundColor: Colors.transparent,
                  selectedIconTheme: IconThemeData(
                    color: theme.colorScheme.primary,
                    size: 32,
                  ),
                  unselectedIconTheme: IconThemeData(
                    color: theme.colorScheme.onSurfaceVariant,
                    size: 26,
                  ),
                  selectedLabelTextStyle: TextStyle(
                    color: theme.colorScheme.primary,
                    fontWeight: FontWeight.bold,
                    fontSize: 14,
                  ),
                  unselectedLabelTextStyle: TextStyle(
                    color: theme.colorScheme.onSurfaceVariant,
                    fontSize: 13,
                  ),
                  leading: Padding(
                    padding: const EdgeInsets.all(20),
                    child: Column(
                      children: [
                        Container(
                          width: 60,
                          height: 60,
                          decoration: BoxDecoration(
                            gradient: LinearGradient(
                              begin: Alignment.topLeft,
                              end: Alignment.bottomRight,
                              colors: [
                                theme.colorScheme.primary,
                                theme.colorScheme.tertiary,
                              ],
                            ),
                            borderRadius: BorderRadius.circular(16),
                            boxShadow: [
                              BoxShadow(
                                 color: theme.colorScheme.primary.withValues(alpha: 0.3),
                                blurRadius: 8,
                                offset: const Offset(0, 4),
                              ),
                            ],
                          ),
                           child: Image.asset(
                             'assets/images/iconico.png',
                             width: 32,
                             height: 32,
                             fit: BoxFit.contain,
                           ),
                        ),
                        if (screenWidth > 1000) ...[
                          const SizedBox(height: 16),
                          Text(
                            'Admin Pro',
                            style: TextStyle(
                              fontWeight: FontWeight.bold,
                              fontSize: 18,
                              color: theme.colorScheme.onSurface,
                            ),
                          ),
                          const SizedBox(height: 4),
                          Text(
                            'Panel Admin',
                            style: TextStyle(
                              fontSize: 12,
                              color: theme.colorScheme.onSurfaceVariant,
                            ),
                          ),
                        ],
                      ],
                    ),
                  ),
                  destinations: _navItems.map((item) {
                    return NavigationRailDestination(
                      icon: Padding(
                        padding: const EdgeInsets.symmetric(vertical: 4),
                        child: Icon(item.icon),
                      ),
                      selectedIcon: Padding(
                        padding: const EdgeInsets.symmetric(vertical: 4),
                        child: Container(
                          padding: const EdgeInsets.all(8),
                          decoration: BoxDecoration(
                            color: theme.colorScheme.primaryContainer,
                            borderRadius: BorderRadius.circular(12),
                          ),
                          child: Icon(item.icon, color: theme.colorScheme.primary),
                        ),
                      ),
                      label: Text(item.label),
                      padding: const EdgeInsets.symmetric(vertical: 8),
                    );
                  }).toList(),
                  trailing: Padding(
                    padding: const EdgeInsets.all(20),
                    child: Column(
                      mainAxisSize: MainAxisSize.min,
                      children: [
                        const Divider(),
                        const SizedBox(height: 12),
                        IconButton(
                          onPressed: () {
                            context.read<AuthProvider>().logout();
                          },
                          icon: Container(
                            padding: const EdgeInsets.all(10),
                            decoration: BoxDecoration(
                              color: theme.colorScheme.errorContainer,
                              borderRadius: BorderRadius.circular(10),
                            ),
                            child: Icon(
                              Icons.logout,
                              color: theme.colorScheme.error,
                            ),
                          ),
                          tooltip: 'Cerrar sesión',
                        ),
                      ],
                    ),
                  ),
                ),
              ),
              // Contenido principal
              Expanded(
                child: _screens[_selectedIndex],
              ),
            ],
          )
        : _screens[_selectedIndex],
      // Bottom Navigation solo para móviles - CON COLOR DISTINTIVO
      bottomNavigationBar: isDesktop
        ? null
        : Container(
            decoration: BoxDecoration(
              color: theme.colorScheme.surface,
              boxShadow: [
                BoxShadow(
                   color: theme.colorScheme.shadow.withValues(alpha: 0.1),
                  blurRadius: 8,
                  offset: const Offset(0, -4),
                ),
              ],
            ),
            child: SafeArea(
              child: NavigationBar(
                selectedIndex: _selectedIndex,
                onDestinationSelected: (index) {
                  setState(() => _selectedIndex = index);
                },
                backgroundColor: theme.colorScheme.primaryContainer.withValues(alpha: 0.2),
                elevation: 0,
                indicatorColor: theme.colorScheme.primaryContainer,
                indicatorShape: RoundedRectangleBorder(
                  borderRadius: BorderRadius.circular(12),
                ),
                labelBehavior: NavigationDestinationLabelBehavior.alwaysShow,
                destinations: _navItems.map((item) {
                  return NavigationDestination(
                    icon: Icon(
                      item.icon,
                      color: theme.colorScheme.onSurfaceVariant,
                    ),
                    selectedIcon: Icon(
                      item.icon,
                      color: theme.colorScheme.primary,
                    ),
                    label: item.label,
                  );
                }).toList(),
              ),
            ),
          ),
    );
  }
}

class _NavItem {
  final IconData icon;
  final String label;
  final String title;

  const _NavItem({
    required this.icon,
    required this.label,
    required this.title,
  });
}
