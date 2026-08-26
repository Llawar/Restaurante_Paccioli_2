import 'package:delivery/config/constants.dart';
import 'package:delivery/models/order_model.dart';
import 'package:delivery/providers/admin_provider.dart';
import 'package:delivery/screens/admin/analytics_screen.dart';
import 'package:delivery/screens/admin/delivery_management_screen.dart';
import 'package:delivery/screens/admin/orders_management_screen.dart';
import 'package:delivery/screens/admin/settings_screen.dart';
import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:intl/intl.dart';
import 'package:fl_chart/fl_chart.dart';

class AdminDashboardScreen extends StatefulWidget {
  const AdminDashboardScreen({super.key});

  @override
  State<AdminDashboardScreen> createState() => _AdminDashboardScreenState();
}

class _AdminDashboardScreenState extends State<AdminDashboardScreen>
    with SingleTickerProviderStateMixin {
  late AnimationController _animationController;
  late Animation<double> _fadeAnimation;
  Map<String, dynamic> _dashboardStats = {};
  List<Order> _recentOrders = [];
  bool _isLoading = true;

  @override
  void initState() {
    super.initState();
    _animationController = AnimationController(
      duration: const Duration(milliseconds: 800),
      vsync: this,
    );
    _fadeAnimation = CurvedAnimation(
      parent: _animationController,
      curve: Curves.easeInOut,
    );
    WidgetsBinding.instance.addPostFrameCallback((_) {
      _loadDashboardData();
    });
    _animationController.forward();
  }

  @override
  void dispose() {
    _animationController.dispose();
    super.dispose();
  }

  Future<void> _loadDashboardData() async {
    setState(() => _isLoading = true);
    final adminProvider = context.read<AdminProvider>();

    await adminProvider.fetchDashboardStats();
    await adminProvider.fetchRecentOrders(limit: 5);

    setState(() {
      _dashboardStats = adminProvider.dashboardStats;
      _recentOrders = adminProvider.recentOrders;
      _isLoading = false;
    });
  }

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);

    return Scaffold(
      body: RefreshIndicator(
        onRefresh: _loadDashboardData,
        child: CustomScrollView(
          slivers: [
            // App Bar Personalizado
            SliverAppBar(
              expandedHeight: 120,
              floating: false,
              pinned: true,
              elevation: 0,
              backgroundColor: theme.colorScheme.primary,
              flexibleSpace: FlexibleSpaceBar(
                title: const Text(
                  'Panel de Administración',
                  style: TextStyle(
                    fontWeight: FontWeight.bold,
                    color: Color(0xFFFFF8E1),
                  ),
                ),
                background: Container(
                  decoration: BoxDecoration(
                    gradient: LinearGradient(
                      begin: Alignment.topLeft,
                      end: Alignment.bottomRight,
                      colors: [
                        theme.colorScheme.primary,
                        theme.colorScheme.primaryContainer,
                      ],
                    ),
                  ),
                ),
              ),
              actions: [
                IconButton(
                  icon: const Icon(Icons.notifications_outlined),
                  onPressed: () {},
                ),
                IconButton(
                  icon: const Icon(Icons.settings_outlined),
                  onPressed:
                      () => Navigator.push(
                        context,
                        MaterialPageRoute(
                          builder: (_) => const SettingsScreen(),
                        ),
                      ),
                ),
              ],
            ),

            // Contenido del Dashboard
            SliverToBoxAdapter(
              child: FadeTransition(
                opacity: _fadeAnimation,
                child:
                    _isLoading
                        ? const Padding(
                          padding: EdgeInsets.all(32),
                          child: Center(child: CircularProgressIndicator()),
                        )
                        : LayoutBuilder(
                          builder: (context, constraints) {
                            final isMobile = constraints.maxWidth < 600;
                            return Padding(
                              padding: EdgeInsets.symmetric(
                                horizontal: isMobile ? 8 : 16,
                              ),
                              child: Column(
                                crossAxisAlignment: CrossAxisAlignment.start,
                                children: [
                                  // KPIs Cards
                                  _buildKPISection(),

                                  // Gráficos
                                  _buildChartsSection(),

                                  // Acciones Rápidas
                                  _buildQuickActions(),

                                  // Pedidos Recientes
                                  _buildRecentOrdersSection(),

                                  const SizedBox(height: 24),
                                ],
                              ),
                            );
                          },
                        ),
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildKPISection() {
    final stats = _dashboardStats;
    final currencyFormat = NumberFormat.currency(
      locale: 'es',
      symbol: 'Bs',
      decimalDigits: 0,
    );
 
    final screenWidth = MediaQuery.of(context).size.width;
    final isMobile = screenWidth < 600;
 
    return Padding(
      padding: EdgeInsets.all(isMobile ? 12 : 16),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Text(
                'Métricas Clave',
                style: TextStyle(
                  fontSize: isMobile ? 18 : 20,
                  fontWeight: FontWeight.bold,
                ),
              ),
              if (!isMobile)
                TextButton.icon(
                  onPressed:
                      () => Navigator.push(
                        context,
                        MaterialPageRoute(
                          builder: (_) => const AnalyticsScreen(),
                        ),
                      ),
                  icon: const Icon(Icons.analytics, size: 18),
                  label: const Text('Ver más'),
                ),
            ],
          ),
          const SizedBox(height: 12),
          GridView.count(
            shrinkWrap: true,
            physics: const NeverScrollableScrollPhysics(),
            crossAxisCount: 2,
            mainAxisSpacing: isMobile ? 8 : 12,
            crossAxisSpacing: isMobile ? 8 : 12,
            childAspectRatio: isMobile ? 1.5 : 1.3,
            children: [
              _KPICard(
                title: isMobile ? 'Ventas' : 'Ventas Hoy',
                value: currencyFormat.format(stats['todayRevenue'] ?? 0),
                subtitle: '${stats['todayOrders'] ?? 0} pedidos',
                icon: Icons.attach_money,
                color: Colors.green,
                trend: stats['revenueTrend'] ?? 0,
                isCompact: isMobile,
                onTap: () {},
              ),
              _KPICard(
                title: isMobile ? 'Activos' : 'Pedidos Activos',
                value: '${stats['activeOrders'] ?? 0}',
                subtitle: '${stats['pendingOrders'] ?? 0} pendientes',
                icon: Icons.local_shipping,
                color: Colors.orange,
                trend: stats['ordersTrend'] ?? 0,
                isCompact: isMobile,
                onTap:
                    () => Navigator.push(
                      context,
                      MaterialPageRoute(
                        builder: (_) => const OrdersManagementScreen(),
                      ),
                    ),
              ),
              _KPICard(
                title: 'Repartidores',
                value:
                    '${stats['availableDelivery'] ?? 0}/${stats['totalDelivery'] ?? 0}',
                subtitle: 'disponibles',
                icon: Icons.people,
                color: Colors.blue,
                trend: 0,
                isCompact: isMobile,
                onTap:
                    () => Navigator.push(
                      context,
                      MaterialPageRoute(
                        builder: (_) => const DeliveryManagementScreen(),
                      ),
                    ),
              ),
              _KPICard(
                title: 'Calificación',
                value: '${stats['avgRating']?.toStringAsFixed(1) ?? '0.0'}',
                subtitle: 'promedio',
                icon: Icons.star,
                color: Colors.purple,
                trend: stats['ratingHTrend'] ?? 0,
                isCompact: isMobile,
                onTap: () {},
              ),
            ],
          ),
        ],
      ),
    );
  }

  Widget _buildChartsSection() {
    final weeklyRevenue =
        _dashboardStats['weeklyRevenue'] as List<dynamic>? ?? [];
 
    final screenWidth = MediaQuery.of(context).size.width;
    final isMobile = screenWidth < 600;
 
    return Padding(
      padding: EdgeInsets.symmetric(horizontal: isMobile ? 12 : 16),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            'Análisis de Rendimiento',
            style: TextStyle(
              fontSize: isMobile ? 18 : 20,
              fontWeight: FontWeight.bold,
            ),
          ),
          const SizedBox(height: 12),
 
          // Gráfico de Ingresos
          Card(
            elevation: 2,
            child: Padding(
              padding: const EdgeInsets.all(16),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      const Text(
                        'Ingresos Semanales',
                        style: TextStyle(
                          fontSize: 16,
                          fontWeight: FontWeight.w600,
                        ),
                      ),
                      Container(
                        padding: const EdgeInsets.symmetric(
                          horizontal: 8,
                          vertical: 4,
                        ),
                        decoration: BoxDecoration(
                           color: Colors.green.withValues(alpha: 0.1),
                          borderRadius: BorderRadius.circular(12),
                        ),
                        child: Text(
                          '+${(_dashboardStats['weeklyGrowth'] ?? 0).toStringAsFixed(1)}%',
                          style: const TextStyle(
                            color: Colors.green,
                            fontWeight: FontWeight.bold,
                            fontSize: 12,
                          ),
                        ),
                      ),
                    ],
                  ),
                  const SizedBox(height: 16),
                  SizedBox(
                    height: 180,
                    child:
                        weeklyRevenue.isEmpty
                            ? const Center(child: Text('Sin datos'))
                            : BarChart(
                                BarChartData(
                                  alignment: BarChartAlignment.spaceAround,
                                  maxY:
                                      (weeklyRevenue
                                              .map((e) => e as num)
                                              .reduce(
                                                (a, b) => a > b ? a : b,
                                              ) *
                                          1.2)
                                          .toDouble(),
                                  barTouchData: BarTouchData(
                                    touchTooltipData: BarTouchTooltipData(
                                      getTooltipColor: (group) => Colors.blueGrey,
                                      getTooltipItem: (
                                        group,
                                        groupIndex,
                                        rod,
                                        rodIndex,
                                      ) {
                                        return BarTooltipItem(
                                          'Bs ${rod.toY.toStringAsFixed(0)}',
                                          const TextStyle(color: Colors.white),
                                        );
                                      },
                                    ),
                                  ),
                                  titlesData: FlTitlesData(
                                    show: true,
                                    bottomTitles: AxisTitles(
                                      sideTitles: SideTitles(
                                        showTitles: true,
                                        getTitlesWidget: (value, meta) {
                                          final days = [
                                            'L',
                                            'M',
                                            'X',
                                            'J',
                                            'V',
                                            'S',
                                            'D',
                                          ];
                                          if (value.toInt() < days.length) {
                                            return Text(
                                              days[value.toInt()],
                                              style: const TextStyle(
                                                fontSize: 10,
                                              ),
                                            );
                                          }
                                          return const Text('');
                                        },
                                      ),
                                    ),
                                    leftTitles: const AxisTitles(
                                      sideTitles: SideTitles(showTitles: false),
                                    ),
                                    topTitles: const AxisTitles(
                                      sideTitles: SideTitles(showTitles: false),
                                    ),
                                    rightTitles: const AxisTitles(
                                      sideTitles: SideTitles(showTitles: false),
                                    ),
                                  ),
                                  borderData: FlBorderData(show: false),
                                  barGroups:
                                      weeklyRevenue.asMap().entries.map((entry) {
                                        return BarChartGroupData(
                                          x: entry.key,
                                          barRods: [
                                            BarChartRodData(
                                              toY:
                                                  (entry.value as num).toDouble(),
                                              color: Colors.orange,
                                              width: 16,
                                              borderRadius: BorderRadius.circular(
                                                4,
                                              ),
                                            ),
                                          ],
                                        );
                                      }).toList(),
                                ),
                              ),
                    ),
                  ],
                ),
              ),
            ),
 
            const SizedBox(height: 12),
 
            // Gráfico Circular de Estados
            Card(
              elevation: 2,
              child: Padding(
                padding: const EdgeInsets.all(16),
                child: isMobile 
                  ? Column(
                      children: [
                        Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Text(
                              'Métricas Clave',
                              style: TextStyle(
                                fontSize: isMobile ? 16 : 20,
                                fontWeight: FontWeight.bold,
                              ),
                            ),
                            const SizedBox(height: 8),
                            ...[
                              _LegendItem(
                                color: Colors.orange,
                                label: 'Pendientes',
                                value: '${_dashboardStats['pendingOrders'] ?? 0}',
                              ),
                              _LegendItem(
                                color: Colors.blue,
                                label: 'Asignados',
                                value: '${_dashboardStats['assignedOrders'] ?? 0}',
                              ),
                              _LegendItem(
                                color: Colors.purple,
                                label: 'En Camino',
                                value: '${_dashboardStats['inTransitOrders'] ?? 0}',
                              ),
                              _LegendItem(
                                color: Colors.green,
                                label: 'Entregados',
                                value: '${_dashboardStats['deliveredToday'] ?? 0}',
                              ),
                              _LegendItem(
                                color: Colors.green,
                                label: 'Entregados',
                                value: '${_dashboardStats['deliveredOrders'] ?? 0}',
                              ),
                            ],
                          ],
                        ),
                        const SizedBox(height: 16),
                        SizedBox(
                          height: 150,
                          child: Center(
                            child: PieChart(
                              PieChartData(
                                sectionsSpace: 2,
                                centerSpaceRadius: 30,
                                sections: [
                                  PieChartSectionData(
                                    value: (_dashboardStats['pendingOrders'] ?? 0).toDouble(),
                                    color: Colors.orange,
                                    radius: 20,
                                    showTitle: false,
                                  ),
                                  PieChartSectionData(
                                    value: (_dashboardStats['assignedOrders'] ?? 0).toDouble(),
                                    color: Colors.blue,
                                    radius: 20,
                                    showTitle: false,
                                  ),
                                  PieChartSectionData(
                                    value: (_dashboardStats['inTransitOrders'] ?? 0).toDouble(),
                                    color: Colors.purple,
                                    radius: 20,
                                    showTitle: false,
                                  ),
                                  PieChartSectionData(
                                    value: (_dashboardStats['deliveredToday'] ?? 0).toDouble(),
                                    color: Colors.green,
                                    radius: 20,
                                    showTitle: false,
                                  ),
                                ],
                              ),
                            ),
                          ),
                        ),
                      ],
                    )
                  : Row(
                      children: [
                        Expanded(
                          flex: 2,
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Text(
                                'Métricas Clave',
                                style: TextStyle(
                                  fontSize: isMobile ? 16 : 20,
                                  fontWeight: FontWeight.bold,
                                ),
                              ),
                              const SizedBox(height: 8),
                              ...[
                                _LegendItem(
                                  color: Colors.orange,
                                  label: 'Pendientes',
                                  value: '${_dashboardStats['pendingOrders'] ?? 0}',
                                ),
                                _LegendItem(
                                  color: Colors.blue,
                                  label: 'Asignados',
                                  value: '${_dashboardStats['assignedOrders'] ?? 0}',
                                ),
                                _LegendItem(
                                  color: Colors.purple,
                                  label: 'En Camino',
                                  value: '${_dashboardStats['inTransitOrders'] ?? 0}',
                                ),
                                _LegendItem(
                                  color: Colors.green,
                                  label: 'Entregados',
                                   value: '${_dashboardStats['deliveredToday'] ?? 0}',
                                 ),
                                 ],
                             ],
                           ),
                         ),
                        Expanded(
                          flex: 1,
                          child: SizedBox(
                            height: 120,
                            child: PieChart(
                              PieChartData(
                                sectionsSpace: 2,
                                centerSpaceRadius: 30,
                                sections: [
                                  PieChartSectionData(
                                    value: (_dashboardStats['pendingOrders'] ?? 0).toDouble(),
                                    color: Colors.orange,
                                    radius: 20,
                                    showTitle: false,
                                  ),
                                  PieChartSectionData(
                                    value: (_dashboardStats['assignedOrders'] ?? 0).toDouble(),
                                    color: Colors.blue,
                                    radius: 20,
                                    showTitle: false,
                                  ),
                                  PieChartSectionData(
                                    value: (_dashboardStats['inTransitOrders'] ?? 0).toDouble(),
                                    color: Colors.purple,
                                    radius: 20,
                                    showTitle: false,
                                  ),
                                  PieChartSectionData(
                                    value: (_dashboardStats['deliveredToday'] ?? 0).toDouble(),
                                    color: Colors.green,
                                    radius: 20,
                                    showTitle: false,
                                  ),
                                ],
                              ),
                            ),
                          ),
                        ),
                      ],
                    ),
                  ),
                ),
              ],
            ),
          );
  }

  Widget _buildQuickActions() {
    final screenWidth = MediaQuery.of(context).size.width;
    final isMobile = screenWidth < 600;

    return Padding(
      padding: EdgeInsets.all(isMobile ? 12 : 16),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            'Acciones Rápidas',
            style: TextStyle(
              fontSize: isMobile ? 18 : 20,
              fontWeight: FontWeight.bold,
            ),
          ),
          const SizedBox(height: 12),
          isMobile
              ? Column(
                children: [
                  _QuickActionButton(
                    icon: Icons.assignment,
                    label: 'Asignar Pedidos',
                    color: Colors.orange,
                    isCompact: true,
                    onTap:
                        () => Navigator.push(
                          context,
                          MaterialPageRoute(
                            builder:
                                (_) =>
                                    const OrdersManagementScreen(initialTab: 0),
                          ),
                        ),
                  ),
                  const SizedBox(height: 8),
                  _QuickActionButton(
                    icon: Icons.people,
                    label: 'Gestionar Repartidores',
                    color: Colors.blue,
                    isCompact: true,
                    onTap:
                        () => Navigator.push(
                          context,
                          MaterialPageRoute(
                            builder: (_) => const DeliveryManagementScreen(),
                          ),
                        ),
                  ),
                  const SizedBox(height: 8),
                  _QuickActionButton(
                    icon: Icons.analytics,
                    label: 'Ver Reportes',
                    color: Colors.purple,
                    isCompact: true,
                    onTap:
                        () => Navigator.push(
                          context,
                          MaterialPageRoute(
                            builder: (_) => const AnalyticsScreen(),
                          ),
                        ),
                  ),
                ],
              )
              : Row(
                children: [
                  Expanded(
                    child: _QuickActionButton(
                      icon: Icons.assignment,
                      label: 'Asignar\nPedidos',
                      color: Colors.orange,
                      isCompact: false,
                      onTap:
                          () => Navigator.push(
                            context,
                            MaterialPageRoute(
                              builder:
                                  (_) => const OrdersManagementScreen(
                                    initialTab: 0,
                                  ),
                            ),
                          ),
                    ),
                  ),
                  const SizedBox(width: 12),
                  Expanded(
                    child: _QuickActionButton(
                      icon: Icons.people,
                      label: 'Gestionar\nRepartidores',
                      color: Colors.blue,
                      isCompact: false,
                      onTap:
                          () => Navigator.push(
                            context,
                            MaterialPageRoute(
                              builder: (_) => const DeliveryManagementScreen(),
                            ),
                          ),
                    ),
                  ),
                  const SizedBox(width: 12),
                  Expanded(
                    child: _QuickActionButton(
                      icon: Icons.analytics,
                      label: 'Ver\nReportes',
                      color: Colors.purple,
                      isCompact: false,
                      onTap:
                          () => Navigator.push(
                            context,
                            MaterialPageRoute(
                              builder: (_) => const AnalyticsScreen(),
                            ),
                          ),
                    ),
                  ),
                ],
              ),
        ],
      ),
    );
  }

  Widget _buildRecentOrdersSection() {
    final screenWidth = MediaQuery.of(context).size.width;
    final isMobile = screenWidth < 600;

    return Padding(
      padding: EdgeInsets.symmetric(horizontal: isMobile ? 12 : 16),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Text(
                'Pedidos Recientes',
                style: TextStyle(
                  fontSize: isMobile ? 18 : 20,
                  fontWeight: FontWeight.bold,
                ),
              ),
              TextButton(
                onPressed:
                    () => Navigator.push(
                      context,
                      MaterialPageRoute(
                        builder: (_) => const OrdersManagementScreen(),
                      ),
                    ),
                child: const Text('Ver todos'),
              ),
            ],
          ),
          const SizedBox(height: 12),
          if (_recentOrders.isEmpty)
            const Card(
              child: Padding(
                padding: EdgeInsets.all(24),
                child: Center(
                  child: Text(
                    'No hay pedidos recientes',
                    style: TextStyle(color: Colors.grey),
                  ),
                ),
              ),
            )
          else
            ListView.separated(
              shrinkWrap: true,
              physics: const NeverScrollableScrollPhysics(),
              itemCount:
                  _recentOrders.length > (isMobile ? 3 : 5)
                      ? (isMobile ? 3 : 5)
                      : _recentOrders.length,
              separatorBuilder: (_, __) => const SizedBox(height: 8),
              itemBuilder: (context, index) {
                final order = _recentOrders[index];
                return _RecentOrderCard(order: order, isCompact: isMobile);
              },
            ),
        ],
      ),
    );
  }
}

// Widgets Auxiliares

class _KPICard extends StatelessWidget {
  final String title;
  final String value;
  final String subtitle;
  final IconData icon;
  final Color color;
  final double trend;
  final bool isCompact;
  final VoidCallback onTap;

  const _KPICard({
    required this.title,
    required this.value,
    required this.subtitle,
    required this.icon,
    required this.color,
    required this.trend,
    this.isCompact = false,
    required this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    return Card(
      elevation: 2,
      child: InkWell(
        onTap: onTap,
        borderRadius: BorderRadius.circular(12),
        child: Padding(
          padding: EdgeInsets.all(isCompact ? 10 : 12),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Container(
                    padding: EdgeInsets.all(isCompact ? 6 : 8),
                    decoration: BoxDecoration(
                       color: color.withValues(alpha: 0.1),
                      borderRadius: BorderRadius.circular(isCompact ? 6 : 8),
                    ),
                    child: Icon(icon, color: color, size: isCompact ? 16 : 20),
                  ),
                  if (trend != 0)
                    Container(
                      padding: const EdgeInsets.symmetric(
                        horizontal: 4,
                        vertical: 2,
                      ),
                      decoration: BoxDecoration(
                        color:
                            trend > 0
                                 ? Colors.green.withValues(alpha: 0.1)
                                 : Colors.red.withValues(alpha: 0.1),
                        borderRadius: BorderRadius.circular(8),
                      ),
                      child: Text(
                        '${trend > 0 ? '+' : ''}${trend.toStringAsFixed(0)}%',
                        style: TextStyle(
                          color: trend > 0 ? Colors.green : Colors.red,
                          fontSize: isCompact ? 8 : 10,
                          fontWeight: FontWeight.bold,
                        ),
                      ),
                    ),
                ],
              ),
              Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                mainAxisSize: MainAxisSize.min,
                children: [
                  FittedBox(
                    fit: BoxFit.scaleDown,
                    child: Text(
                      value,
                      style: TextStyle(
                        fontSize: isCompact ? 16 : 18,
                        fontWeight: FontWeight.bold,
                      ),
                    ),
                  ),
                  FittedBox(
                    fit: BoxFit.scaleDown,
                    child: Text(
                      subtitle,
                      style: TextStyle(
                        fontSize: isCompact ? 10 : 11,
                        color: Colors.grey[600],
                      ),
                      maxLines: 1,
                      overflow: TextOverflow.ellipsis,
                    ),
                  ),
                ],
              ),
            ],
          ),
        ),
      ),
    );
  }
}

class _LegendItem extends StatelessWidget {
  final Color color;
  final String label;
  final String value;

  const _LegendItem({
    required this.color,
    required this.label,
    required this.value,
  });

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 4),
      child: Row(
        children: [
          Container(
            width: 12,
            height: 12,
            decoration: BoxDecoration(
              color: color,
              borderRadius: BorderRadius.circular(3),
            ),
          ),
          const SizedBox(width: 8),
          Expanded(child: Text(label, style: const TextStyle(fontSize: 12))),
          Text(
            value,
            style: const TextStyle(fontSize: 12, fontWeight: FontWeight.bold),
          ),
        ],
      ),
    );
  }
}

class _QuickActionButton extends StatelessWidget {
  final IconData icon;
  final String label;
  final Color color;
  final bool isCompact;
  final VoidCallback onTap;

  const _QuickActionButton({
    required this.icon,
    required this.label,
    required this.color,
    this.isCompact = false,
    required this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    return Card(
      elevation: 2,
      child: InkWell(
        onTap: onTap,
        borderRadius: BorderRadius.circular(12),
        child: Padding(
          padding: EdgeInsets.symmetric(
            vertical: isCompact ? 12 : 16,
            horizontal: isCompact ? 16 : 8,
          ),
          child:
              isCompact
                  ? Row(
                    children: [
                      Container(
                        padding: const EdgeInsets.all(10),
                        decoration: BoxDecoration(
                          color: color.withValues(alpha: 0.1),
                          shape: BoxShape.circle,
                        ),
                        child: Icon(icon, color: color, size: 24),
                      ),
                      const SizedBox(width: 12),
                      Expanded(
                        child: Text(
                          label,
                          style: const TextStyle(
                            fontSize: 14,
                            fontWeight: FontWeight.w500,
                          ),
                          maxLines: 1,
                          overflow: TextOverflow.ellipsis,
                        ),
                      ),
                      Icon(Icons.arrow_forward_ios, size: 16, color: color),
                    ],
                  )
                  : Column(
                    mainAxisSize: MainAxisSize.min,
                    children: [
                      Container(
                        padding: const EdgeInsets.all(12),
                        decoration: BoxDecoration(
                          color: color.withValues(alpha: 0.1),
                          shape: BoxShape.circle,
                        ),
                        child: Icon(icon, color: color, size: 28),
                      ),
                      const SizedBox(height: 8),
                      FittedBox(
                        fit: BoxFit.scaleDown,
                        child: Text(
                          label,
                          textAlign: TextAlign.center,
                          style: const TextStyle(
                            fontSize: 12,
                            fontWeight: FontWeight.w500,
                          ),
                        ),
                      ),
                    ],
                  ),
        ),
      ),
    );
  }
}

class _RecentOrderCard extends StatelessWidget {
  final Order order;
  final bool isCompact;

  const _RecentOrderCard({required this.order, this.isCompact = false});

  @override
  Widget build(BuildContext context) {
    final currencyFormat = NumberFormat.currency(
      locale: 'es',
      symbol: 'Bs',
      decimalDigits: isCompact ? 0 : 2,
    );

    Color statusColor;
    String statusText;

    switch (order.estado) {
      case OrderStatus.pending:
        statusColor = Colors.orange;
        statusText = isCompact ? 'Pend.' : 'Pendiente';
        break;
      case OrderStatus.assigned:
        statusColor = Colors.blue;
        statusText = isCompact ? 'Asig.' : 'Asignado';
        break;
      case OrderStatus.in_transit:
        statusColor = Colors.purple;
        statusText = isCompact ? 'Camino' : 'En Camino';
        break;
      case OrderStatus.delivered:
        statusColor = Colors.green;
        statusText = isCompact ? 'Entreg.' : 'Entregado';
        break;
      default:
        statusColor = Colors.grey;
        statusText = 'Descon.';
    }

    return Card(
      elevation: 1,
      margin: EdgeInsets.zero,
      child: ListTile(
        dense: isCompact,
        leading: Container(
          width: isCompact ? 40 : 48,
          height: isCompact ? 40 : 48,
          decoration: BoxDecoration(
             color: statusColor.withValues(alpha: 0.1),
            borderRadius: BorderRadius.circular(isCompact ? 6 : 8),
          ),
          child: Icon(
            Icons.shopping_bag,
            color: statusColor,
            size: isCompact ? 20 : 24,
          ),
        ),
        title: Text(
          '#${order.id.substring(0, 6).toUpperCase()}',
          style: TextStyle(
            fontWeight: FontWeight.bold,
            fontSize: isCompact ? 12 : 14,
          ),
          maxLines: 1,
          overflow: TextOverflow.ellipsis,
        ),
        subtitle:
            isCompact
                ? Text(
                  order.direccionEntrega,
                  maxLines: 1,
                  overflow: TextOverflow.ellipsis,
                  style: const TextStyle(fontSize: 11),
                )
                : Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    Text(
                      order.direccionEntrega,
                      maxLines: 1,
                      overflow: TextOverflow.ellipsis,
                      style: const TextStyle(fontSize: 12),
                    ),
                    Text(
                      DateFormat('dd/MM HH:mm').format(order.fechaCreacion),
                      style: TextStyle(fontSize: 10, color: Colors.grey[600]),
                    ),
                  ],
                ),
        trailing: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          crossAxisAlignment: CrossAxisAlignment.end,
          children: [
            Text(
              currencyFormat.format(order.total),
              style: TextStyle(
                fontWeight: FontWeight.bold,
                fontSize: isCompact ? 12 : 14,
              ),
            ),
            Container(
              padding: EdgeInsets.symmetric(
                horizontal: isCompact ? 6 : 8,
                vertical: 1,
              ),
              decoration: BoxDecoration(
                color: statusColor.withValues(alpha: 0.1),
                borderRadius: BorderRadius.circular(8),
              ),
              child: Text(
                statusText,
                style: TextStyle(
                  color: statusColor,
                  fontSize: isCompact ? 8 : 10,
                  fontWeight: FontWeight.w600,
                ),
                maxLines: 1,
                overflow: TextOverflow.ellipsis,
              ),
            ),
          ],
        ),
      ),
    );
  }
}
