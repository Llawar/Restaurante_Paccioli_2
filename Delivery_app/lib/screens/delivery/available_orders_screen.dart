import 'package:delivery/providers/auth_provider.dart';
import 'package:delivery/providers/delivery_provider.dart';
import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'delivery_destination_screen.dart';

class AvailableOrdersScreen extends StatelessWidget {
  const AvailableOrdersScreen({super.key});

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final isMobile = MediaQuery.of(context).size.width < 600;

    return Scaffold(
      appBar: AppBar(
        title: const Text('Pedidos Disponibles'),
        backgroundColor: theme.colorScheme.primary,
        foregroundColor: Colors.white,
      ),
      body: Consumer<DeliveryProvider>(
        builder: (context, deliveryProvider, _) {
          if (deliveryProvider.isLoading) {
            return const Center(child: CircularProgressIndicator());
          }

          final status = deliveryProvider.profile['estado_disponibilidad'];
          final userId = context.read<AuthProvider>().currentUser?.id;

          if (status != 'available') {
            return Center(
              child: Padding(
                padding: const EdgeInsets.all(24),
                child: Column(
                  mainAxisAlignment: MainAxisAlignment.center,
                  children: [
                    const Icon(Icons.no_sim, size: 64, color: Colors.grey),
                    const SizedBox(height: 16),
                    Text(
                      status == 'busy' 
                          ? 'Estás ocupado actualmente' 
                          : 'Estás desconectado',
                      style: const TextStyle(fontSize: 18, fontWeight: FontWeight.bold),
                      textAlign: TextAlign.center,
                    ),
                    const SizedBox(height: 8),
                    const Text(
                      'Para ver y aceptar pedidos, debes cambiar tu estado a Disponible.',
                      textAlign: TextAlign.center,
                      style: TextStyle(fontSize: 14, color: Colors.grey),
                    ),
                    const SizedBox(height: 24),
                    ElevatedButton.icon(
                      onPressed: deliveryProvider.isLoading
                          ? null
                          : () async {
                               final userId = context.read<AuthProvider>().currentUser?.id;
                               if (userId == null) return;

                               final success = await deliveryProvider.setAvailability(
                                 userId,
                                 'available',
                               );

                               if (!success && context.mounted) {
                                 ScaffoldMessenger.of(context).showSnackBar(
                                   SnackBar(
                                     content: Text(deliveryProvider.errorMessage ?? 'Error al cambiar estado'),
                                     backgroundColor: Colors.red,
                                   ),
                                 );
                               }
                             },
                      icon: deliveryProvider.isLoading
                          ? const SizedBox(
                               height: 20,
                               width: 20,
                               child: CircularProgressIndicator(
                                 strokeWidth: 2,
                                 color: Colors.white,
                               ),
                             )
                          : const Icon(Icons.power_settings_new),
                      label: Text(deliveryProvider.isLoading ? 'Cargando...' : 'Ponerme Disponible'),

                      style: ElevatedButton.styleFrom(
                        backgroundColor: Colors.green,
                        foregroundColor: Colors.white,
                        padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 12),
                      ),
                    ),

                  ],
                ),
              ),
            );
          }

          final orders = deliveryProvider.availableOrders;


          if (orders.isEmpty) {
            return Center(
              child: Column(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  const Icon(Icons.delivery_dining, size: 64, color: Colors.grey),
                  const SizedBox(height: 16),
                  const Text(
                    'No hay pedidos pendientes',
                    style: TextStyle(fontSize: 18, color: Colors.grey),
                  ),
                  const SizedBox(height: 24),
                  ElevatedButton(
                    onPressed: () => deliveryProvider.fetchAvailableOrders(),
                    child: const Text('Actualizar'),
                  ),
                ],
              ),
            );
          }

          return ListView.builder(
            padding: const EdgeInsets.all(16),
            itemCount: orders.length,
            itemBuilder: (context, index) {
              final order = orders[index];
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
                          Text(
                            'Bs ${order.total.toStringAsFixed(2)}',
                            style: const TextStyle(
                              fontSize: 18,
                              fontWeight: FontWeight.bold,
                              color: Colors.orange,
                            ),
                          ),
                        ],
                      ),
                      const Divider(height: 24),
                      Row(
                        children: [
                          const Icon(Icons.location_on, size: 18, color: Colors.grey),
                          const SizedBox(width: 8),
                          Expanded(
                            child: Text(
                              order.direccionEntrega,
                              style: const TextStyle(fontSize: 14),
                            ),
                          ),
                        ],
                      ),
                      const SizedBox(height: 16),
                      SizedBox(
                        width: double.infinity,
                        child: ElevatedButton(
                          onPressed: () async {
                            final userId = context.read<AuthProvider>().currentUser?.id;
                            if (userId == null) return;

                            final success = await deliveryProvider.acceptOrder(
                              order.id,
                              userId,
                            );

                            if (success && context.mounted) {
                              ScaffoldMessenger.of(context).showSnackBar(
                                const SnackBar(
                                  content: Text('¡Pedido aceptado! Ya puedes entregarlo'),
                                  backgroundColor: Colors.green,
                                ),
                              );
                              Navigator.push(
                                context,
                                MaterialPageRoute(
                                  builder: (_) => DeliveryDestinationScreen(order: order),
                                ),
                              );
                            } else if (context.mounted) {
                              ScaffoldMessenger.of(context).showSnackBar(
                                SnackBar(
                                  content: Text(deliveryProvider.errorMessage ?? 'Error al aceptar pedido'),
                                  backgroundColor: Colors.red,
                                ),
                              );
                            }
                          },
                          style: ElevatedButton.styleFrom(
                            backgroundColor: Colors.orange,
                            foregroundColor: Colors.white,
                            shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                          ),
                          child: const Text('Aceptar Pedido'),
                        ),
                      ),
                    ],
                  ),
                ),
              );
            },
          );
        },
      ),
    );
  }
}

