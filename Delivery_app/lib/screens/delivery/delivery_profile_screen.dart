import 'package:delivery/providers/auth_provider.dart';
import 'package:delivery/providers/delivery_provider.dart';
import 'package:flutter/material.dart';
import 'package:provider/provider.dart';

class DeliveryProfileScreen extends StatelessWidget {
  const DeliveryProfileScreen({super.key});

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final auth = context.read<AuthProvider>();

    return Scaffold(
      appBar: AppBar(title: const Text('Mi Perfil')),
      body: Consumer<DeliveryProvider>(
        builder: (context, deliveryProvider, _) {
          return SingleChildScrollView(
            padding: const EdgeInsets.all(20),
            child: Column(
              children: [
                const Center(
                  child: CircleAvatar(
                    radius: 50,
                    backgroundColor: Colors.orange,
                    child: Icon(Icons.person, size: 64, color: Colors.white),
                  ),
                ),
                const SizedBox(height: 16),
                Text(
                  auth.currentUser?.nombre ?? 'Repartidor',
                  style: const TextStyle(fontSize: 22, fontWeight: FontWeight.bold),
                ),
                Text(
                  auth.currentUser?.email ?? '',
                  style: const TextStyle(color: Colors.grey),
                ),
                const SizedBox(height: 32),
                Card(
                  shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
                  child: Padding(
                    padding: const EdgeInsets.all(16),
                    child: Column(
                      children: [
                        const Text(
                          'Estado de Trabajo',
                          style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold),
                        ),
                        const Divider(),
                        SwitchListTile(
                          title: const Text('Disponible para Pedidos'),
                          subtitle: Text(
                            deliveryProvider.profile['estado_disponibilidad'] == 'available'
                                ? 'Estás recibiendo pedidos'
                                : 'No estás recibiendo pedidos',
                          ),
                          value: deliveryProvider.profile['estado_disponibilidad'] == 'available',
                          activeColor: Colors.green,
                          onChanged: (bool value) async {
                            final userId = auth.currentUser?.id;
                            if (userId != null) {
                              await deliveryProvider.setAvailability(
                                userId,
                                value ? 'available' : 'offline',
                              );
                            }
                          },
                        ),
                        const Divider(),
                        const Text(
                          'Información de Cuenta',
                          style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold),
                        ),
                        const Divider(),
                        _buildProfileItem(Icons.phone, 'Teléfono', auth.currentUser?.telefono ?? 'No registrado'),
                        _buildProfileItem(Icons.verified, 'Rol', 'Repartidor Oficial'),
                        _buildProfileItem(
                          Icons.star, 
                          'Calificación', 
                          '${deliveryProvider.profile['calificacion_promedio'] ?? '0.0'} / 5.0'
                        ),
                        _buildProfileItem(
                          Icons.inventory, 
                          'Entregas', 
                          '${deliveryProvider.profile['entregas_completadas'] ?? '0'}'
                        ),
                      ],
                    ),
                  ),
                ),
                const SizedBox(height: 32),
                SizedBox(
                  width: double.infinity,
                  child: ElevatedButton.icon(
                    onPressed: () => auth.logout(),
                    icon: const Icon(Icons.logout),
                    label: const Text('Cerrar Sesión'),
                    style: ElevatedButton.styleFrom(
                      backgroundColor: Colors.red,
                      foregroundColor: Colors.white,
                      padding: const EdgeInsets.symmetric(vertical: 16),
                      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                    ),
                  ),
                ),
              ],
            ),
          );
        },
      ),
    );
  }

  Widget _buildProfileItem(IconData icon, String label, String value) {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 8),
      child: Row(
        children: [
          Icon(icon, size: 20, color: Colors.grey),
          const SizedBox(width: 12),
          Text(label, style: const TextStyle(color: Colors.grey)),
          const Spacer(),
          Text(value, style: const TextStyle(fontWeight: FontWeight.w600)),
        ],
      ),
    );
  }
}
