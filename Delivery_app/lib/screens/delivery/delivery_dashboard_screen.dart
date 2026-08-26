import 'package:delivery/config/constants.dart';
import 'package:delivery/models/order_model.dart';
import 'package:delivery/providers/auth_provider.dart';
import 'package:delivery/providers/delivery_provider.dart';
import 'package:flutter/material.dart';
import 'package:provider/provider.dart';

class DeliveryDashboardScreen extends StatefulWidget {
  const DeliveryDashboardScreen({super.key});

  @override
  State<DeliveryDashboardScreen> createState() => _DeliveryDashboardScreenState();
}

class _DeliveryDashboardScreenState extends State<DeliveryDashboardScreen> {
  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) {
      final auth = context.read<AuthProvider>();
      context.read<DeliveryProvider>().fetchDeliveryData(auth.currentUser!.id);
    });
  }

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    
    return Scaffold(
      appBar: AppBar(
        title: const Text('Panel del Repartidor'),
        actions: [
          IconButton(
            icon: const Icon(Icons.logout),
            onPressed: () => context.read<AuthProvider>().logout(),
          ),
        ],
      ),
      body: Consumer<DeliveryProvider>(
        builder: (context, provider, _) {
          if (provider.isLoading) {
            return const Center(child: CircularProgressIndicator());
          }

          return SingleChildScrollView(
            padding: const EdgeInsets.all(16),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                _buildStatusCard(theme, provider),
                const SizedBox(height: 24),
                const Text(
                  'Mis Entregas Activas',
                  style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold),
                ),
                const SizedBox(height: 12),
                provider.activeOrders.isEmpty
                    ? _buildEmptyState('No tienes entregas asignadas en este momento.')
                    : ListView.builder(
                        shrinkWrap: true,
                        physics: const NeverScrollableScrollPhysics(),
                        itemCount: provider.activeOrders.length,
                        itemBuilder: (context, index) {
                          final order = provider.activeOrders[index];
                          return _OrderDeliveryCard(
                            order: order,
                            onStatusUpdate: (newStatus) async {
                              final success = await provider.updateOrderStatus(order.id, newStatus);
                              if (!success) {
                                ScaffoldMessenger.of(context).showSnackBar(
                                  SnackBar(content: Text(provider.errorMessage ?? 'Error al actualizar')),
                                );
                              }
                            },
                          );
                        },
                      ),
              ],
            ),
          );
        },
      ),
    );
  }

  Widget _buildStatusCard(ThemeData theme, DeliveryProvider provider) {
    final status = provider.profile['estado_disponibilidad'] ?? 'offline';
    final isOnline = status == 'available';

    return Container(
      padding: const EdgeInsets.all(20),
      decoration: BoxDecoration(
        gradient: LinearGradient(
          colors: isOnline 
              ? [theme.colorScheme.primary, theme.colorScheme.primaryContainer]
              : [Colors.grey, Colors.grey.shade300],
        ),
        borderRadius: BorderRadius.circular(20),
      ),
      child: Row(
        children: [
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                const Text(
                  'Estado Actual',
                  style: TextStyle(color: Colors.white, fontSize: 16),
                ),
                Text(
                  isOnline ? 'Disponible' : 'Fuera de Servicio',
                  style: const TextStyle(
                    color: Colors.white,
                    fontSize: 22,
                    fontWeight: FontWeight.bold,
                  ),
                ),
              ],
            ),
          ),
          Switch(
            value: isOnline,
            onChanged: (value) {
              final auth = context.read<AuthProvider>();
              provider.setAvailability(
                auth.currentUser!.id, 
                value ? 'available' : 'offline'
              );
            },
            activeColor: Colors.white,
          ),
        ],
      ),
    );
  }

  Widget _buildEmptyState(String message) {
    return Center(
      child: Column(
        children: [
          const SizedBox(height: 40),
          const Icon(Icons.delivery_dining, size: 64, color: Colors.grey),
          const SizedBox(height: 16),
          Text(message, textAlign: TextAlign.center, style: const TextStyle(color: Colors.grey)),
        ],
      ),
    );
  }
}

class _OrderDeliveryCard extends StatelessWidget {
  final Order order;
  final Function(String) onStatusUpdate;

  const _OrderDeliveryCard({required this.order, required this.onStatusUpdate});

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    
    return Card(
      margin: const EdgeInsets.only(bottom: 16),
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                Text(
                  'Pedido #${order.id.substring(0, 8).toUpperCase()}',
                  style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 16),
                ),
                _buildStatusBadge(order.estado),
              ],
            ),
            const Divider(height: 24),
            Row(
              children: [
                const Icon(Icons.location_on, color: Colors.orange, size: 20),
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
            const SizedBox(height: 16),
            Row(
              mainAxisAlignment: MainAxisAlignment.end,
              children: [
                if (order.estado == OrderStatus.assigned)
                  ElevatedButton.icon(
                    onPressed: () => onStatusUpdate('in_transit'),
                    icon: const Icon(Icons.navigation),
                    label: const Text('Iniciar Entrega'),
                    style: ElevatedButton.styleFrom(backgroundColor: theme.colorScheme.primary, foregroundColor: Colors.white),
                  ),
                if (order.estado == OrderStatus.in_transit)
                  ElevatedButton.icon(
                    onPressed: () => onStatusUpdate('delivered'),
                    icon: const Icon(Icons.check_circle),
                    label: const Text('Marcar como Entregado'),
                    style: ElevatedButton.styleFrom(backgroundColor: Colors.green, foregroundColor: Colors.white),
                  ),
              ],
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildStatusBadge(OrderStatus status) {
    Color color;
    String text;
    switch (status) {
      case OrderStatus.assigned:
        color = Colors.blue;
        text = 'Asignado';
        break;
      case OrderStatus.in_transit:
        color = Colors.purple;
        text = 'En Camino';
        break;
      case OrderStatus.delivered:
        color = Colors.green;
        text = 'Entregado';
        break;
      default:
        color = Colors.grey;
        text = status.name;
    }
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
      decoration: BoxDecoration(
        color: color.withValues(alpha: 0.1),
        borderRadius: BorderRadius.circular(12),
      ),
      child: Text(text, style: TextStyle(color: color, fontSize: 12, fontWeight: FontWeight.bold)),
    );
  }
}
