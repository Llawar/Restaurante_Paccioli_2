import 'package:delivery/models/order_model.dart';
import 'package:flutter/material.dart';
import 'package:flutter_map/flutter_map.dart';
import 'package:latlong2/latlong.dart';
import 'package:provider/provider.dart';
import 'package:delivery/providers/delivery_provider.dart';

class OrderTrackingScreen extends StatefulWidget {
  final String orderId;
  const OrderTrackingScreen({super.key, required this.orderId});

  @override
  State<OrderTrackingScreen> createState() => _OrderTrackingScreenState();
}

class _OrderTrackingScreenState extends State<OrderTrackingScreen> {
  late MapController _mapController;

  @override
  void initState() {
    super.initState();
    _mapController = MapController();
  }

  @override
  void dispose() {
    _mapController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Rastreo de Pedido'),
        backgroundColor: Colors.orange,
        foregroundColor: Colors.white,
      ),
      body: Consumer<DeliveryProvider>(
        builder: (context, deliveryProvider, _) {
          // En un entorno real, buscaríamos el repartidor asignado a este pedido
          // Para el ejemplo, buscaremos cualquier repartidor activo o el asignado
          final driverProfile = deliveryProvider.profile;
          final lat = driverProfile['ubicacion_actual']?['latitude'] as double?;
          final lng = driverProfile['ubicacion_actual']?['longitude'] as double?;

          return Stack(
            children: [
              FlutterMap(
                options: MapOptions(
                  initialCenter: lat != null && lng != null 
                      ? LatLng(lat, lng) 
                      : const LatLng(-16.500, -68.150), // Default coordinates
                  initialZoom: 15.0,
                ),
                children: [
                  TileLayer(
                    urlTemplate: 'https://tile.openstreetmap.org/{z}/{x}/{y}.png',
                    userAgentPackageName: 'com.delivery.app',
                  ),
                  MarkerLayer(
                    markers: [
                      if (lat != null && lng != null)
                        Marker(
                          point: LatLng(lat, lng),
                          width: 40,
                          height: 40,
                          child: const Icon(
                            Icons.delivery_dining,
                            color: Colors.orange,
                            size: 30,
                          ),
                        ),
                    ],
                  ),
                ],
              ),
              Positioned(
                bottom: 20,
                left: 20,
                right: 20,
                child: Card(
                  shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(20)),
                  child: Padding(
                    padding: const EdgeInsets.all(16),
                    child: Row(
                      children: [
                        const Icon(Icons.info, color: Colors.orange),
                        const SizedBox(width: 12),
                        Expanded(
                          child: Text(
                            lat != null && lng != null
                                ? 'Tu repartidor está en camino'
                                : 'Esperando que el repartidor inicie el viaje',
                            style: const TextStyle(fontWeight: FontWeight.bold),
                          ),
                        ),
                      ],
                    ),
                  ),
                ),
              ),
            ],
          );
        },
      ),
    );
  }
}
