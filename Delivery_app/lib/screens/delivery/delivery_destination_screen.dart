import 'dart:async';
import 'dart:convert';
import 'package:flutter/material.dart';
import 'package:flutter_map/flutter_map.dart';
import 'package:latlong2/latlong.dart';
import 'package:delivery/models/order_model.dart';
import 'package:delivery/providers/delivery_provider.dart';
import 'package:provider/provider.dart';
import 'package:geolocator/geolocator.dart';
import 'package:http/http.dart' as http;

class DeliveryDestinationScreen extends StatefulWidget {
  final Order order;

  const DeliveryDestinationScreen({super.key, required this.order});

  @override
  State<DeliveryDestinationScreen> createState() => _DeliveryDestinationScreenState();
}

class _DeliveryDestinationScreenState extends State<DeliveryDestinationScreen> {
  late LatLng destination;
  LatLng? currentPosition;
  List<LatLng> routePoints = [];
  StreamSubscription<Position>? _positionStream;
  bool _isLoadingRoute = true;

  @override
  void initState() {
    super.initState();
    destination = LatLng(widget.order.latitud ?? -16.500, widget.order.longitud ?? -68.150);
    _startTracking();
  }

  @override
  void dispose() {
    _positionStream?.cancel();
    super.dispose();
  }

  void _startTracking() {
    _positionStream = Geolocator.getPositionStream(
      locationSettings: const LocationSettings(
        accuracy: LocationAccuracy.high,
        distanceFilter: 10,
      ),
    ).listen((Position position) {
      setState(() {
        currentPosition = LatLng(position.latitude, position.longitude);
      });
      _fetchRoute();
    });
  }

  Future<void> _fetchRoute() async {
    if (currentPosition == null) return;

    try {
      final url = Uri.parse(
        'https://router.project-osrm.org/route/v1/driving/${currentPosition!.longitude},${currentPosition!.latitude};${destination.longitude},${destination.latitude}?overview=full&geometries=geojson',
      );
      final response = await http.get(url);

      if (response.statusCode == 200) {
        final data = json.decode(response.body);
        final List coordinates = data['routes'][0]['geometry']['coordinates'];
        
        setState(() {
          routePoints = coordinates
              .map((coord) => LatLng(coord[1] as double, coord[0] as double))
              .toList();
          _isLoadingRoute = false;
        });
      }
    } catch (e) {
      debugPrint('Error fetching route: $e');
    }
  }

  Future<void> _markAsDelivered() async {
    final deliveryProvider = context.read<DeliveryProvider>();
    await deliveryProvider.updateOrderStatus(widget.order.id, 'delivered');
    
    if (mounted) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Pedido entregado exitosamente')),
      );
      Navigator.pop(context);
    }
  }

  @override
  Widget build(BuildContext context) {
    return PopScope(
      canPop: false, // Prevent back navigation
      onPopInvokedWithResult: (didPop, result) {
        if (didPop) return;
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('Debes marcar el pedido como entregado para salir')),
        );
      },
      child: Scaffold(
        appBar: AppBar(
          title: const Text('Ruta de Entrega'),
          backgroundColor: Colors.orange,
          foregroundColor: Colors.white,
          automaticallyImplyLeading: false, // Remove back button
        ),
        body: Stack(
          children: [
            FlutterMap(
              options: MapOptions(
                initialCenter: destination,
                initialZoom: 15.0,
              ),
              children: [
                TileLayer(
                  urlTemplate: 'https://tile.openstreetmap.org/{z}/{x}/{y}.png',
                  userAgentPackageName: 'com.delivery.app',
                ),
                PolylineLayer(
                  polylines: [
                    Polyline(
                      points: routePoints,
                      color: Colors.blue,
                      strokeWidth: 5.0,
                    ),
                  ],
                ),
                MarkerLayer(
                  markers: [
                    // Destination Marker
                    Marker(
                      point: destination,
                      width: 40,
                      height: 40,
                      child: const Icon(Icons.location_on, color: Colors.red, size: 40),
                    ),
                    // Current Position Marker
                    if (currentPosition != null)
                      Marker(
                        point: currentPosition!,
                        width: 40,
                        height: 40,
                        child: const Icon(Icons.navigation, color: Colors.blue, size: 40),
                      ),
                  ],
                ),
              ],
            ),
            if (_isLoadingRoute)
              const Center(child: CircularProgressIndicator()),
            Positioned(
              bottom: 20,
              left: 20,
              right: 20,
              child: Card(
                shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(20)),
                child: Padding(
                  padding: const EdgeInsets.all(16),
                  child: Column(
                    mainAxisSize: MainAxisSize.min,
                    children: [
                      Row(
                        children: [
                          const Icon(Icons.home, color: Colors.orange),
                          const SizedBox(width: 12),
                          Expanded(
                            child: Text(
                              'Destino: ${widget.order.direccionEntrega}',
                              style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 16),
                            ),
                          ),
                        ],
                      ),
                      const SizedBox(height: 16),
                      SizedBox(
                        width: double.infinity,
                        child: ElevatedButton.icon(
                          onPressed: _markAsDelivered,
                          icon: const Icon(Icons.check_circle),
                          label: const Text('Marcar como Entregado'),
                          style: ElevatedButton.styleFrom(
                            backgroundColor: Colors.orange,
                            foregroundColor: Colors.white,
                            padding: const EdgeInsets.symmetric(vertical: 12),
                            shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                          ),
                        ),
                      ),
                    ],
                  ),
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }
}
