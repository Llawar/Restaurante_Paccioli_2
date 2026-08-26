
import 'package:delivery/config/constants.dart';
import 'package:delivery/models/order_model.dart';
import 'package:delivery/providers/admin_provider.dart';
import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:intl/intl.dart';

class OrdersManagementScreen extends StatefulWidget {
  final int initialTab;
  
  const OrdersManagementScreen({super.key, this.initialTab = 0});

  @override
  State<OrdersManagementScreen> createState() => _OrdersManagementScreenState();
}

class _OrdersManagementScreenState extends State<OrdersManagementScreen>
    with TickerProviderStateMixin {
  late TabController _tabController;
  final TextEditingController _searchController = TextEditingController();
  
  @override
  void initState() {
    super.initState();
    _tabController = TabController(
      length: 5,
      vsync: this,
      initialIndex: widget.initialTab < 5 ? widget.initialTab : 0,
    );
    WidgetsBinding.instance.addPostFrameCallback((_) {
      _loadOrders();
    });
  }

  @override
  void dispose() {
    _tabController.dispose();
    _searchController.dispose();
    super.dispose();
  }

  Future<void> _loadOrders() async {
    await context.read<AdminProvider>().fetchAllOrders(
      status: null,
      dateFrom: null,
      dateTo: null,
      searchQuery: _searchController.text.isEmpty ? null : _searchController.text,
    );
  }

  List<Order> _getFilteredOrders(List<Order> orders, int tabIndex) {
    switch (tabIndex) {
      case 0: // Todos
        return orders;
      case 1: // Pendientes
        return orders.where((o) => o.estado == OrderStatus.pending).toList();
      case 2: // Asignados/En Camino
        return orders.where((o) => 
          o.estado == OrderStatus.assigned || o.estado == OrderStatus.in_transit
        ).toList();
      case 3: // Entregados (Límite de 10 más recientes)
        return orders
            .where((o) => o.estado == OrderStatus.delivered)
            .take(10)
            .toList();
      case 4: // Cancelados
        return orders.where((o) => o.estado == OrderStatus.cancelled).toList();
      default:
        return orders;
    }
  }


  void _showOrderDetails(Order order) {
    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.transparent,
      builder: (context) => _OrderDetailsSheet(order: order),
    );
  }

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    
    final screenWidth = MediaQuery.of(context).size.width;
    final isMobile = screenWidth < 600;

    return Scaffold(
      body: NestedScrollView(
        headerSliverBuilder: (context, innerBoxIsScrolled) => [
          SliverAppBar(
            title: const Text('Gestión de Pedidos'),
            floating: true,
            snap: true,
            bottom: TabBar(
              controller: _tabController,
              isScrollable: true,
              tabAlignment: TabAlignment.start,
              labelPadding: const EdgeInsets.symmetric(horizontal: 16),
               tabs: const [
                 Tab(text: 'Todos'),
                 Tab(text: 'Pend.'),
                 Tab(text: 'Proceso'),
                 Tab(text: 'Entreg.'),
                 Tab(text: 'Cancel.'),
               ],
            ),
          ),
        ],
        body: Column(
          children: [
            // Barra de búsqueda y filtros
            Container(
              padding: EdgeInsets.all(isMobile ? 8 : 12),
              decoration: BoxDecoration(
                color: theme.colorScheme.surface,
                border: Border(
                  bottom: BorderSide(color: theme.dividerColor),
                ),
              ),
              child: Column(
                children: [
                   // Búsqueda
                   Row(
                     children: [
                       Expanded(
                         child: TextField(
                           controller: _searchController,
                           decoration: InputDecoration(
                             hintText: isMobile ? 'Buscar...' : 'Buscar por ID o dirección...',
                             prefixIcon: const Icon(Icons.search, size: 20),
                             suffixIcon: _searchController.text.isNotEmpty
                                 ? IconButton(
                                     icon: const Icon(Icons.clear, size: 18),
                                     onPressed: () {
                                       _searchController.clear();
                                       _loadOrders();
                                     },
                                   )
                                 : null,
                             border: OutlineInputBorder(
                               borderRadius: BorderRadius.circular(10),
                             ),
                             filled: true,
                             fillColor: theme.colorScheme.surfaceContainerHighest,
                             contentPadding: EdgeInsets.symmetric(
                               vertical: isMobile ? 12 : 16,
                             ),
                           ),
                           onSubmitted: (_) => _loadOrders(),
                         ),
                       ),
                       const SizedBox(width: 8),
                       ElevatedButton.icon(
                         onPressed: () async {
                           final confirm = await showDialog<bool>(
                             context: context,
                             builder: (context) => AlertDialog(
                               title: const Text('Eliminar todos los pedidos'),
                               content: const Text('¿Estás seguro de que deseas eliminar permanentemente TODOS los pedidos del sistema? Esta acción no se puede deshacer.'),
                               actions: [
                                 TextButton(
                                   onPressed: () => Navigator.pop(context, false),
                                   child: const Text('Cancelar'),
                                 ),
                                 ElevatedButton(
                                   onPressed: () => Navigator.pop(context, true),
                                   style: ElevatedButton.styleFrom(backgroundColor: Colors.red, foregroundColor: Colors.white),
                                   child: const Text('Eliminar Todo'),
                                 ),
                               ],
                             ),
                           );
                           if (confirm == true) {
                             await context.read<AdminProvider>().clearAllOrders();
                             _loadOrders();
                             ScaffoldMessenger.of(context).showSnackBar(
                               const SnackBar(content: Text('✅ Todos los pedidos han sido eliminados')),
                             );
                           }
                         },
                         icon: const Icon(Icons.delete_sweep, size: 18),
                         label: isMobile ? const SizedBox.shrink() : const Text('Limpiar Todo'),
                         style: ElevatedButton.styleFrom(
                           backgroundColor: Colors.red,
                           foregroundColor: Colors.white,
                           padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 12),
                         ),
                       ),
                     ],
                   ),
                  const SizedBox(height: 8),
                  // Filtros
                   isMobile
                     ? Column(
                         children: [
                           // Espacio para mantener la estructura si es necesario o simplemente quitar
                           const SizedBox(height: 8),
                         ],
                       )
                     : Row(
                         children: [
                           // El selector de periodo ha sido eliminado
                         ],
                       ),
                ],
              ),
            ),
            // Lista de pedidos
            Expanded(
              child: Consumer<AdminProvider>(
                builder: (context, adminProvider, _) {
                  if (adminProvider.isLoading) {
                    return const Center(child: CircularProgressIndicator());
                  }
                  
                    return TabBarView(
                      controller: _tabController,
                      children: List.generate(5, (index) {
                        final orders = _getFilteredOrders(adminProvider.allOrders, index);
                        
                        if (orders.isEmpty) {
                          return _EmptyState(
                            icon: _getEmptyIcon(index),
                            message: _getEmptyMessage(index),
                          );
                        }
                        
                        return ListView.builder(
                          padding: const EdgeInsets.all(12),
                          itemCount: orders.length,
                          itemBuilder: (context, i) => _OrderCard(
                            order: orders[i],
                            onTap: () => _showOrderDetails(orders[i]),
                          ),
                        );
                      }),
                    );
                },
              ),
            ),
          ],
        ),
      ),
    );
  }

  IconData _getEmptyIcon(int index) {
    switch (index) {
      case 1: return Icons.schedule;
      case 2: return Icons.local_shipping;
      case 3: return Icons.check_circle;
      case 4: return Icons.cancel;
      default: return Icons.inbox;
    }
  }

  String _getEmptyMessage(int index) {
    switch (index) {
      case 1: return 'No hay pedidos pendientes';
      case 2: return 'No hay pedidos en proceso';
      case 3: return 'No hay pedidos entregados';
      case 4: return 'No hay pedidos cancelados';
      default: return 'No hay pedidos';
    }
  }
}

class _OrderCard extends StatelessWidget {
  final Order order;
  final VoidCallback onTap;
  
  const _OrderCard({
    required this.order,
    required this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    final currencyFormat = NumberFormat.currency(locale: 'es', symbol: 'Bs');
    final theme = Theme.of(context);
    
    Color statusColor;
    String statusText;
    IconData statusIcon;
    
    switch (order.estado) {
      case OrderStatus.pending:
        statusColor = Colors.orange;
        statusText = 'Pendiente';
        statusIcon = Icons.schedule;
        break;
      case OrderStatus.assigned:
        statusColor = Colors.blue;
        statusText = 'Asignado';
        statusIcon = Icons.person_add;
        break;
      case OrderStatus.in_transit:
        statusColor = Colors.purple;
        statusText = 'En Camino';
        statusIcon = Icons.local_shipping;
        break;
      case OrderStatus.delivered:
        statusColor = Colors.green;
        statusText = 'Entregado';
        statusIcon = Icons.check_circle;
        break;
      case OrderStatus.cancelled:
        statusColor = Colors.red;
        statusText = 'Cancelado';
        statusIcon = Icons.cancel;
        break;
    }
    
    return Card(
      elevation: 2,
      margin: const EdgeInsets.only(bottom: 12),
      child: InkWell(
        onTap: onTap,
        borderRadius: BorderRadius.circular(12),
        child: Padding(
          padding: const EdgeInsets.all(16),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Row(
                children: [
                  Container(
                    padding: const EdgeInsets.all(10),
                    decoration: BoxDecoration(
                      color: statusColor.withOpacity(0.1),
                      borderRadius: BorderRadius.circular(10),
                    ),
                    child: Icon(statusIcon, color: statusColor, size: 24),
                  ),
                  const SizedBox(width: 12),
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          'Pedido #${order.id.substring(0, 8).toUpperCase()}',
                          style: const TextStyle(
                            fontWeight: FontWeight.bold,
                            fontSize: 16,
                          ),
                        ),
                        Text(
                          DateFormat('dd/MM/yyyy HH:mm').format(order.fechaCreacion),
                          style: TextStyle(
                            fontSize: 12,
                            color: theme.colorScheme.onSurfaceVariant,
                          ),
                        ),
                      ],
                    ),
                  ),
                  Container(
                    padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                    decoration: BoxDecoration(
                      color: statusColor.withOpacity(0.1),
                      borderRadius: BorderRadius.circular(20),
                    ),
                    child: Text(
                      statusText,
                      style: TextStyle(
                        color: statusColor,
                        fontSize: 12,
                        fontWeight: FontWeight.w600,
                      ),
                      maxLines: 1,
                      overflow: TextOverflow.ellipsis,
                    ),
                  ),
                ],
              ),
              const Divider(height: 24),
              Row(
                children: [
                  Icon(Icons.location_on_outlined, 
                    size: 18, 
                    color: theme.colorScheme.onSurfaceVariant,
                  ),
                  const SizedBox(width: 8),
                  Expanded(
                    child: Text(
                      order.direccionEntrega,
                      style: const TextStyle(fontSize: 14),
                      maxLines: 2,
                      overflow: TextOverflow.ellipsis,
                    ),
                  ),
                ],
              ),
              const SizedBox(height: 12),
              LayoutBuilder(
                builder: (context, constraints) {
                  final isSmallScreen = constraints.maxWidth < 350;
                  return Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      Flexible(
                        child: Text(
                          '${order.items.length} ${order.items.length == 1 ? 'prod.' : 'prods.'}',
                          style: TextStyle(
                            fontSize: isSmallScreen ? 11 : 12,
                            color: theme.colorScheme.onSurfaceVariant,
                          ),
                          overflow: TextOverflow.ellipsis,
                        ),
                      ),
                      Row(
                        mainAxisSize: MainAxisSize.min,
                        children: [
                          Text(
                            currencyFormat.format(order.total),
                            style: TextStyle(
                              fontSize: isSmallScreen ? 14 : 18,
                              fontWeight: FontWeight.bold,
                              color: theme.colorScheme.primary,
                            ),
                          ),
                        ],
                      ),
                    ],
                  );
                },
              ),
            ],
          ),
        ),
      ),
    );
  }
}

class _OrderDetailsSheet extends StatelessWidget {
  final Order order;

  const _OrderDetailsSheet({required this.order});

  @override
  Widget build(BuildContext context) {
    final currencyFormat = NumberFormat.currency(locale: 'es', symbol: 'Bs');
    final theme = Theme.of(context);
    
    Color statusColor;
    String statusText;
    
    switch (order.estado) {
      case OrderStatus.pending:
        statusColor = Colors.orange;
        statusText = 'Pendiente';
        break;
      case OrderStatus.assigned:
        statusColor = Colors.blue;
        statusText = 'Asignado';
        break;
      case OrderStatus.in_transit:
        statusColor = Colors.purple;
        statusText = 'En Camino';
        break;
      case OrderStatus.delivered:
        statusColor = Colors.green;
        statusText = 'Entregado';
        break;
      case OrderStatus.cancelled:
        statusColor = Colors.red;
        statusText = 'Cancelado';
        break;
    }
    
    return DraggableScrollableSheet(
      initialChildSize: 0.7,
      minChildSize: 0.5,
      maxChildSize: 0.95,
      builder: (context, scrollController) {
        return Container(
          decoration: BoxDecoration(
            color: theme.colorScheme.surface,
            borderRadius: const BorderRadius.vertical(top: Radius.circular(20)),
          ),
          child: Column(
            children: [
              // Handle
              Container(
                margin: const EdgeInsets.symmetric(vertical: 12),
                width: 40,
                height: 4,
                decoration: BoxDecoration(
                   color: theme.colorScheme.onSurfaceVariant.withValues(alpha: 0.3),
                  borderRadius: BorderRadius.circular(2),
                ),
              ),
              // Header
              Padding(
                padding: const EdgeInsets.symmetric(horizontal: 20),
                child: Row(
                  children: [
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(
                            'Pedido #${order.id.substring(0, 8).toUpperCase()}',
                            style: const TextStyle(
                              fontSize: 20,
                              fontWeight: FontWeight.bold,
                            ),
                          ),
                          const SizedBox(height: 4),
                          Container(
                            padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                            decoration: BoxDecoration(
                              color: statusColor.withValues(alpha: 0.1),
                              borderRadius: BorderRadius.circular(20),
                            ),
                            child: Text(
                              statusText,
                              style: TextStyle(
                                color: statusColor,
                                fontSize: 12,
                                fontWeight: FontWeight.w600,
                              ),
                            ),
                          ),
                        ],
                      ),
                    ),
                    IconButton(
                      onPressed: () => Navigator.pop(context),
                      icon: const Icon(Icons.close),
                    ),
                  ],
                ),
              ),
              const Divider(height: 32),
              // Contenido scrollable
              Expanded(
                child: ListView(
                  controller: scrollController,
                  padding: const EdgeInsets.symmetric(horizontal: 20),
                  children: [
                    // Timeline
                    _OrderTimeline(order: order),
                    const Divider(height: 32),
                    // Productos
                    const Text(
                      'Productos',
                      style: TextStyle(
                        fontSize: 16,
                        fontWeight: FontWeight.bold,
                      ),
                    ),
                    const SizedBox(height: 12),
                    ...order.items.map((item) => _OrderItemRow(item: item)),
                    const Divider(height: 32),
                    // Dirección
                    const Text(
                      'Dirección de Entrega',
                      style: TextStyle(
                        fontSize: 16,
                        fontWeight: FontWeight.bold,
                      ),
                    ),
                    const SizedBox(height: 8),
                    Row(
                      children: [
                        Icon(Icons.location_on, color: theme.colorScheme.primary),
                        const SizedBox(width: 12),
                        Expanded(
                          child: Text(order.direccionEntrega),
                        ),
                      ],
                    ),
                    const SizedBox(height: 8),
                    // Mapa placeholder
                    Container(
                      height: 150,
                      decoration: BoxDecoration(
                        color: theme.colorScheme.surfaceContainerHighest,
                        borderRadius: BorderRadius.circular(12),
                      ),
                      child: Center(
                        child: Column(
                          mainAxisAlignment: MainAxisAlignment.center,
                          children: [
                            Icon(
                              Icons.map_outlined,
                              size: 48,
                              color: theme.colorScheme.onSurfaceVariant,
                            ),
                            const SizedBox(height: 8),
                            Text(
                              'Mapa no disponible',
                              style: TextStyle(color: theme.colorScheme.onSurfaceVariant),
                            ),
                          ],
                        ),
                      ),
                    ),
                    const SizedBox(height: 24),
                    // Total
                    Container(
                      padding: const EdgeInsets.all(16),
                      decoration: BoxDecoration(
                        color: theme.colorScheme.primaryContainer,
                        borderRadius: BorderRadius.circular(12),
                      ),
                      child: Row(
                        mainAxisAlignment: MainAxisAlignment.spaceBetween,
                        children: [
                          const Text(
                            'Total del Pedido',
                            style: TextStyle(
                              fontSize: 16,
                              fontWeight: FontWeight.w600,
                            ),
                          ),
                          Text(
                            currencyFormat.format(order.total),
                            style: TextStyle(
                              fontSize: 20,
                              fontWeight: FontWeight.bold,
                              color: theme.colorScheme.primary,
                            ),
                          ),
                        ],
                      ),
                    ),
                    const SizedBox(height: 32),
                  ],
                ),
              ),
            ],
          ),
        );
      },
    );
  }
}

class _OrderTimeline extends StatelessWidget {
  final Order order;

  const _OrderTimeline({required this.order});

  @override
  Widget build(BuildContext context) {
    final steps = [
      _TimelineStep(
        title: 'Pedido Creado',
        subtitle: DateFormat('dd/MM/yyyy HH:mm').format(order.fechaCreacion),
        icon: Icons.shopping_bag,
        isCompleted: true,
        isActive: order.estado == OrderStatus.pending,
      ),
      _TimelineStep(
        title: 'Asignado a Repartidor',
        subtitle: order.repartidorId != null ? 'Repartidor asignado' : 'Pendiente',
        icon: Icons.person_add,
        isCompleted: order.estado.index >= OrderStatus.assigned.index,
        isActive: order.estado == OrderStatus.assigned,
      ),
      _TimelineStep(
        title: 'En Camino',
        subtitle: order.estado.index >= OrderStatus.in_transit.index 
            ? 'El repartidor está en camino' 
            : 'Pendiente',
        icon: Icons.local_shipping,
        isCompleted: order.estado.index >= OrderStatus.in_transit.index,
        isActive: order.estado == OrderStatus.in_transit,
      ),
      _TimelineStep(
        title: 'Entregado',
        subtitle: order.estado == OrderStatus.delivered 
            ? 'Pedido entregado exitosamente' 
            : 'Pendiente',
        icon: Icons.check_circle,
        isCompleted: order.estado == OrderStatus.delivered,
        isActive: order.estado == OrderStatus.delivered,
      ),
    ];
    
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        const Text(
          'Estado del Pedido',
          style: TextStyle(
            fontSize: 16,
            fontWeight: FontWeight.bold,
          ),
        ),
        const SizedBox(height: 16),
        ...steps.asMap().entries.map((entry) {
          final isLast = entry.key == steps.length - 1;
          return _TimelineItem(
            step: entry.value,
            isLast: isLast,
          );
        }),
      ],
    );
  }
}

class _TimelineStep {
  final String title;
  final String subtitle;
  final IconData icon;
  final bool isCompleted;
  final bool isActive;

  _TimelineStep({
    required this.title,
    required this.subtitle,
    required this.icon,
    required this.isCompleted,
    required this.isActive,
  });
}

class _TimelineItem extends StatelessWidget {
  final _TimelineStep step;
  final bool isLast;

  const _TimelineItem({required this.step, required this.isLast});

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    
    Color iconColor;
    if (step.isActive) {
      iconColor = theme.colorScheme.primary;
    } else if (step.isCompleted) {
      iconColor = Colors.green;
    } else {
      iconColor = theme.colorScheme.onSurfaceVariant.withOpacity(0.3);
    }
    
    return IntrinsicHeight(
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Column(
            children: [
              Container(
                width: 36,
                height: 36,
                decoration: BoxDecoration(
                  color: step.isCompleted || step.isActive
                                 ? iconColor.withValues(alpha: 0.1)
                      : theme.colorScheme.surfaceContainerHighest,
                  shape: BoxShape.circle,
                  border: step.isActive
                      ? Border.all(color: iconColor, width: 2)
                      : null,
                ),
                child: Icon(
                  step.isCompleted ? Icons.check : step.icon,
                  color: iconColor,
                  size: 18,
                ),
              ),
              if (!isLast)
                Expanded(
                  child: Container(
                    width: 2,
                    color: step.isCompleted
                                 ? Colors.green.withValues(alpha: 0.5)
                                 : theme.colorScheme.onSurfaceVariant.withValues(alpha: 0.1),
                  ),
                ),
            ],
          ),
          const SizedBox(width: 12),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  step.title,
                  style: TextStyle(
                    fontWeight: step.isActive ? FontWeight.bold : FontWeight.normal,
                    color: step.isCompleted || step.isActive
                        ? theme.colorScheme.onSurface
                        : theme.colorScheme.onSurfaceVariant,
                  ),
                ),
                const SizedBox(height: 4),
                Text(
                  step.subtitle,
                  style: TextStyle(
                    fontSize: 12,
                    color: theme.colorScheme.onSurfaceVariant,
                  ),
                ),
                SizedBox(height: isLast ? 0 : 20),
              ],
            ),
          ),
        ],
      ),
    );
  }
}

class _OrderItemRow extends StatelessWidget {
  final OrderItem item;

  const _OrderItemRow({required this.item});

  @override
  Widget build(BuildContext context) {
    final currencyFormat = NumberFormat.currency(locale: 'es', symbol: 'Bs');
    
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 8),
      child: Row(
        children: [
          Container(
            width: 48,
            height: 48,
            decoration: BoxDecoration(
              color: Colors.grey.shade200,
              borderRadius: BorderRadius.circular(8),
            ),
            child: const Icon(Icons.fastfood, color: Colors.grey),
          ),
          const SizedBox(width: 12),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  'Producto ${item.productoId.substring(0, 8)}',
                  style: const TextStyle(fontWeight: FontWeight.w500),
                ),
                Text(
                  '${item.cantidad} x ${currencyFormat.format(item.precioUnitario)}',
                  style: TextStyle(
                    fontSize: 12,
                    color: Colors.grey[600],
                  ),
                ),
              ],
            ),
          ),
          Text(
            currencyFormat.format(item.subtotal),
            style: const TextStyle(fontWeight: FontWeight.bold),
          ),
        ],
      ),
    );
  }
}

class _EmptyState extends StatelessWidget {
  final IconData icon;
  final String message;

  const _EmptyState({required this.icon, required this.message});

  @override
  Widget build(BuildContext context) {
    return Center(
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          Icon(icon, size: 64, color: Colors.grey[400]),
          const SizedBox(height: 16),
          Text(
            message,
            style: TextStyle(
              fontSize: 16,
              color: Colors.grey[600],
            ),
          ),
        ],
      ),
    );
  }
}
