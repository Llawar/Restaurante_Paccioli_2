import 'dart:async';

import 'package:delivery/providers/auth_provider.dart';
import 'package:delivery/providers/cart_provider.dart';
import 'package:delivery/providers/user_provider.dart';
import 'package:delivery/widgets/custom_widgets.dart';
import 'package:delivery/widgets/product_widgets.dart';
import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:geolocator/geolocator.dart';
import 'package:geocoding/geocoding.dart';

class CartScreen extends StatefulWidget {
  const CartScreen({super.key});

  @override
  State<CartScreen> createState() => _CartScreenState();
}

class _CartScreenState extends State<CartScreen> {
  final _formKey = GlobalKey<FormState>();
  final _paymentFormKey = GlobalKey<FormState>();
  final _cardHolderController = TextEditingController();
  final _cardNumberController = TextEditingController();
  final _cardExpiryController = TextEditingController();
  final _cardCvvController = TextEditingController();
  String _selectedPaymentMethod = 'Efectivo';
  String _selectedReservationPaymentMethod = 'Tarjeta';
  String _selectedSection = 'orders';
  bool _isProcessing = false;

  List<String> _paymentMethodsFor({required bool isReservation}) {
    if (isReservation) {
      return const ['Tarjeta', 'QR'];
    }
    return const ['Efectivo', 'Tarjeta', 'QR'];
  }

  @override
  void dispose() {
    _cardHolderController.dispose();
    _cardNumberController.dispose();
    _cardExpiryController.dispose();
    _cardCvvController.dispose();
    super.dispose();
  }

  Future<Position?> _getCurrentLocation() async {
    bool serviceEnabled;
    LocationPermission permission;

    try {
      serviceEnabled = await Geolocator.isLocationServiceEnabled();
      if (!serviceEnabled) {
        if (mounted) {
          ScaffoldMessenger.of(context).showSnackBar(
            const SnackBar(
              content: Text('El servicio de ubicación está desactivado'),
            ),
          );
        }
        return null;
      }

      permission = await Geolocator.checkPermission();
      if (permission == LocationPermission.denied) {
        permission = await Geolocator.requestPermission();
        if (permission == LocationPermission.denied) {
          if (mounted) {
            ScaffoldMessenger.of(context).showSnackBar(
              const SnackBar(content: Text('Permiso de ubicación denegado')),
            );
          }
          return null;
        }
      }

      if (permission == LocationPermission.deniedForever) {
        if (mounted) {
          ScaffoldMessenger.of(context).showSnackBar(
            const SnackBar(
              content: Text('Permisos de ubicación denegados permanentemente'),
            ),
          );
        }
        return null;
      }

      try {
        return await Geolocator.getCurrentPosition().timeout(
          const Duration(seconds: 15),
        );
      } on TimeoutException {
        if (mounted) {
          ScaffoldMessenger.of(context).showSnackBar(
            const SnackBar(
              content: Text(
                'No se pudo obtener tu ubicación a tiempo. Intenta de nuevo.',
              ),
            ),
          );
        }
        return null;
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Error al obtener ubicación: $e')),
        );
      }
      return null;
    }
  }

  Future<void> _checkoutOrder() async {
    if (_formKey.currentState!.validate()) {
      if (_paymentFormKey.currentState != null &&
          !_paymentFormKey.currentState!.validate()) {
        return;
      }
      if (_selectedPaymentMethod == 'Tarjeta') {
        if (_cardNumberController.text.length < 16 ||
            _cardExpiryController.text.isEmpty ||
            _cardCvvController.text.length != 3) {
          ScaffoldMessenger.of(context).showSnackBar(
            const SnackBar(
              content: Text('Por favor, completa los datos de la tarjeta'),
            ),
          );
          return;
        }
      }

      setState(() => _isProcessing = true);

      final cartProvider = context.read<CartProvider>();
      final authProvider = context.read<AuthProvider>();
      final userProvider = context.read<UserProvider>();

      Position? position = await _getCurrentLocation();
      double lat = position?.latitude ?? 0.0;
      double lng = position?.longitude ?? 0.0;

      if (position == null || (lat == 0.0 && lng == 0.0)) {
        setState(() => _isProcessing = false);
        if (mounted) {
          ScaffoldMessenger.of(context).showSnackBar(
            const SnackBar(
              content: Text(
                'Necesitamos tu ubicación para el envío. Activa los permisos y vuelve a intentar.',
              ),
              backgroundColor: Colors.orange,
            ),
          );
        }
        return;
      }

      String address = 'Ubicación automática';
      try {
        List<Placemark> placemarks = await placemarkFromCoordinates(
          lat,
          lng,
        ).timeout(const Duration(seconds: 8));
        if (placemarks.isNotEmpty) {
          Placemark place = placemarks[0];
          address = '${place.street}, ${place.locality}, ${place.country}';
        }
      } catch (e) {
        debugPrint('Error reverse geocoding: $e');
      }

      final success = await cartProvider.checkout(
        authProvider.currentUser!.id,
        address,
        _selectedPaymentMethod,
        lat,
        lng,
        isReservation: false,
      );

      setState(() => _isProcessing = false);

      if (mounted) {
        if (success) {
          await userProvider.fetchClientOrders(authProvider.currentUser!.id);
          ScaffoldMessenger.of(context).showSnackBar(
            const SnackBar(
              content: Text('¡Pedido realizado exitosamente!'),
              backgroundColor: Colors.green,
            ),
          );
          Navigator.pop(context);
        } else {
          ScaffoldMessenger.of(context).showSnackBar(
            const SnackBar(
              content: Text('Error al crear el pedido'),
              backgroundColor: Colors.red,
            ),
          );
        }
      }
    }
  }

  Future<void> _checkoutReservation() async {
    if (_formKey.currentState!.validate()) {
      if (_paymentFormKey.currentState != null &&
          !_paymentFormKey.currentState!.validate()) {
        return;
      }
      if (_selectedReservationPaymentMethod == 'Tarjeta') {
        if (_cardNumberController.text.length < 16 ||
            _cardExpiryController.text.isEmpty ||
            _cardCvvController.text.length != 3) {
          ScaffoldMessenger.of(context).showSnackBar(
            const SnackBar(
              content: Text('Por favor, completa los datos de la tarjeta'),
            ),
          );
          return;
        }
      }

      setState(() => _isProcessing = true);

      final cartProvider = context.read<CartProvider>();
      final authProvider = context.read<AuthProvider>();
      final userProvider = context.read<UserProvider>();

      final success = await cartProvider.checkout(
        authProvider.currentUser!.id,
        'Reserva en local',
        _selectedReservationPaymentMethod,
        0.0,
        0.0,
        isReservation: true,
      );

      setState(() => _isProcessing = false);

      if (mounted) {
        if (success) {
          await userProvider.fetchClientOrders(authProvider.currentUser!.id);
          ScaffoldMessenger.of(context).showSnackBar(
            const SnackBar(
              content: Text(
                '¡Reserva confirmada! Tu pedido estará listo al llegar.',
              ),
              backgroundColor: Colors.green,
            ),
          );
          Navigator.pop(context);
        } else {
          ScaffoldMessenger.of(context).showSnackBar(
            const SnackBar(
              content: Text('No hay productos en reserva para confirmar'),
              backgroundColor: Colors.red,
            ),
          );
        }
      }
    }
  }

  Widget _buildPaymentDetails() {
    switch (_selectedPaymentMethod) {
      case 'Tarjeta':
        return Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            const Text(
              'Datos de la Tarjeta',
              style: TextStyle(fontSize: 14, fontWeight: FontWeight.bold),
            ),
            const SizedBox(height: 12),
            CustomTextField(
              label: 'Nombre del Titular',
              controller: _cardHolderController,
              hintText: 'Nombre completo',
              prefixIcon: const Icon(Icons.person),
              validator:
                  (value) =>
                      (value == null || value.isEmpty) ? 'Requerido' : null,
            ),
            const SizedBox(height: 12),
            CustomTextField(
              label: 'Número de Tarjeta',
              controller: _cardNumberController,
              hintText: '0000 0000 0000 0000',
              prefixIcon: const Icon(Icons.credit_card),
              keyboardType: TextInputType.number,
              validator:
                  (value) =>
                      (value == null || value.length < 16)
                          ? 'Número inválido'
                          : null,
            ),
            const SizedBox(height: 12),
            Row(
              children: [
                Expanded(
                  child: CustomTextField(
                    label: 'MM/AA',
                    controller: _cardExpiryController,
                    hintText: 'MM/AA',
                    prefixIcon: const Icon(Icons.calendar_today),
                    keyboardType: TextInputType.number,
                    validator:
                        (value) =>
                            (value == null || value.isEmpty)
                                ? 'Requerido'
                                : null,
                  ),
                ),
                const SizedBox(width: 12),
                Expanded(
                  child: CustomTextField(
                    label: 'CVV',
                    controller: _cardCvvController,
                    hintText: '123',
                    prefixIcon: const Icon(Icons.lock),
                    keyboardType: TextInputType.number,
                    validator:
                        (value) =>
                            (value == null || value.length != 3)
                                ? 'Inválido'
                                : null,
                  ),
                ),
              ],
            ),
          ],
        );
      case 'QR':
        return Column(
          children: [
            const Text(
              'Escanea el código QR para pagar',
              style: TextStyle(fontSize: 14, fontWeight: FontWeight.bold),
              textAlign: TextAlign.center,
            ),
            const SizedBox(height: 12),
            Center(
              child: Container(
                padding: const EdgeInsets.all(12),
                decoration: BoxDecoration(
                  color: Colors.white,
                  borderRadius: BorderRadius.circular(12),
                  border: Border.all(color: Colors.grey.shade300),
                ),
                child: Image.network(
                  'https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=PAGO_DELIVERY_PRO',
                  width: 150,
                  height: 150,
                  errorBuilder:
                      (context, error, stackTrace) =>
                          const Icon(Icons.qr_code, size: 150),
                ),
              ),
            ),
            const SizedBox(height: 8),
            const Text(
              'Utiliza tu App Bancaria para escanear',
              style: TextStyle(fontSize: 12, color: Colors.grey),
              textAlign: TextAlign.center,
            ),
          ],
        );
      case 'Efectivo':
      default:
        return Container(
          padding: const EdgeInsets.all(12),
          decoration: BoxDecoration(
            color: Colors.orange.withValues(alpha: 0.1),
            borderRadius: BorderRadius.circular(12),
            border: Border.all(color: Colors.orange.withValues(alpha: 0.3)),
          ),
          child: Row(
            children: [
              const Icon(Icons.money, color: Colors.orange),
              const SizedBox(width: 12),
              const Expanded(
                child: Text(
                  'Pagarás en efectivo al recibir tu entrega.',
                  style: TextStyle(fontSize: 13, color: Colors.orange),
                ),
              ),
            ],
          ),
        );
    }
  }

  Widget _buildReservationPaymentDetails() {
    switch (_selectedReservationPaymentMethod) {
      case 'Tarjeta':
        return Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            const Text(
              'Datos de la tarjeta para reserva',
              style: TextStyle(fontSize: 14, fontWeight: FontWeight.bold),
            ),
            const SizedBox(height: 12),
            CustomTextField(
              label: 'Nombre del Titular',
              controller: _cardHolderController,
              hintText: 'Nombre completo',
              prefixIcon: const Icon(Icons.person),
              validator:
                  (value) =>
                      (value == null || value.isEmpty) ? 'Requerido' : null,
            ),
            const SizedBox(height: 12),
            CustomTextField(
              label: 'Número de Tarjeta',
              controller: _cardNumberController,
              hintText: '0000 0000 0000 0000',
              prefixIcon: const Icon(Icons.credit_card),
              keyboardType: TextInputType.number,
              validator:
                  (value) =>
                      (value == null || value.length < 16)
                          ? 'Número inválido'
                          : null,
            ),
            const SizedBox(height: 12),
            Row(
              children: [
                Expanded(
                  child: CustomTextField(
                    label: 'MM/AA',
                    controller: _cardExpiryController,
                    hintText: 'MM/AA',
                    prefixIcon: const Icon(Icons.calendar_today),
                    keyboardType: TextInputType.number,
                    validator:
                        (value) =>
                            (value == null || value.isEmpty)
                                ? 'Requerido'
                                : null,
                  ),
                ),
                const SizedBox(width: 12),
                Expanded(
                  child: CustomTextField(
                    label: 'CVV',
                    controller: _cardCvvController,
                    hintText: '123',
                    prefixIcon: const Icon(Icons.lock),
                    keyboardType: TextInputType.number,
                    validator:
                        (value) =>
                            (value == null || value.length != 3)
                                ? 'Inválido'
                                : null,
                  ),
                ),
              ],
            ),
          ],
        );
      case 'QR':
      default:
        return Column(
          children: [
            const Text(
              'Escanea el código QR para confirmar tu reserva',
              style: TextStyle(fontSize: 14, fontWeight: FontWeight.bold),
              textAlign: TextAlign.center,
            ),
            const SizedBox(height: 12),
            Center(
              child: Container(
                padding: const EdgeInsets.all(12),
                decoration: BoxDecoration(
                  color: Colors.white,
                  borderRadius: BorderRadius.circular(12),
                  border: Border.all(color: Colors.grey.shade300),
                ),
                child: Image.network(
                  'https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=RESERVA_DELIVERY_PRO',
                  width: 150,
                  height: 150,
                  errorBuilder:
                      (context, error, stackTrace) =>
                          const Icon(Icons.qr_code, size: 150),
                ),
              ),
            ),
            const SizedBox(height: 8),
            const Text(
              'Usa tu banca móvil para escanear la reserva',
              style: TextStyle(fontSize: 12, color: Colors.grey),
              textAlign: TextAlign.center,
            ),
          ],
        );
    }
  }

  Widget _buildOrderPaymentStep() {
    if (_selectedPaymentMethod == 'Efectivo') {
      return _buildPaymentDetails();
    }

    return _buildNextPaymentButton(
      onPressed: () => _showPaymentConfirmationDialog(isReservation: false),
    );
  }

  Widget _buildReservationPaymentStep() {
    return _buildNextPaymentButton(
      onPressed: () => _showPaymentConfirmationDialog(isReservation: true),
    );
  }

  Widget _buildNextPaymentButton({required VoidCallback onPressed}) {
    return Align(
      alignment: Alignment.centerRight,
      child: ElevatedButton.icon(
        onPressed: onPressed,
        icon: const Icon(Icons.arrow_forward),
        label: const Text('Siguiente'),
      ),
    );
  }

  Future<void> _showPaymentConfirmationDialog({
    required bool isReservation,
  }) async {
    await showDialog<void>(
      context: context,
      builder: (dialogContext) {
        return AlertDialog(
          title: Text(isReservation ? 'Confirmar Reserva' : 'Confirmar Pedido'),
          content: SingleChildScrollView(
            child: Form(
              key: _paymentFormKey,
              child:
                  isReservation
                      ? _buildReservationPaymentDetails()
                      : _buildPaymentDetails(),
            ),
          ),
          actions: [
            TextButton(
              onPressed: () => Navigator.pop(dialogContext),
              child: const Text('Volver'),
            ),
            ElevatedButton(
              onPressed: () async {
                if (!(_paymentFormKey.currentState?.validate() ?? true)) {
                  return;
                }
                if (isReservation) {
                  Navigator.pop(dialogContext);
                  await _checkoutReservation();
                } else {
                  Navigator.pop(dialogContext);
                  await _checkoutOrder();
                }
              },
              child: Text(
                isReservation ? 'Confirmar Reserva' : 'Confirmar Pedido',
              ),
            ),
          ],
        );
      },
    );
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('Mi Carrito'), elevation: 0),
      body: Consumer<CartProvider>(
        builder: (context, cartProvider, _) {
          if (cartProvider.isEmpty) {
            return Center(
              child: Column(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  const Icon(
                    Icons.shopping_cart_outlined,
                    size: 64,
                    color: Colors.grey,
                  ),
                  const SizedBox(height: 16),
                  const Text(
                    'Tu carrito está vacío',
                    style: TextStyle(fontSize: 16, color: Colors.grey),
                  ),
                  const SizedBox(height: 24),
                  ElevatedButton(
                    onPressed: () => Navigator.pop(context),
                    child: const Text('Volver a comprar'),
                  ),
                ],
              ),
            );
          }

          final showOrders = cartProvider.orderItems.isNotEmpty;
          final showReservations = cartProvider.reservationItems.isNotEmpty;
          final activeSection =
              _selectedSection == 'orders' && showOrders || !showReservations
                  ? 'orders'
                  : 'reservations';

          return SingleChildScrollView(
            child: Padding(
              padding: const EdgeInsets.all(16),
              child: Form(
                key: _formKey,
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Row(
                      children: [
                        Expanded(
                          child: _buildSectionTab(
                            title: 'Pedidos',
                            count: cartProvider.orderItems.length,
                            total: cartProvider.orderTotal,
                            isSelected: activeSection == 'orders',
                            color: Colors.orange,
                            onTap:
                                showOrders
                                    ? () => setState(
                                      () => _selectedSection = 'orders',
                                    )
                                    : null,
                          ),
                        ),
                        const SizedBox(width: 12),
                        Expanded(
                          child: _buildSectionTab(
                            title: 'Reservas',
                            count: cartProvider.reservationItems.length,
                            total: cartProvider.reservationTotal,
                            isSelected: activeSection == 'reservations',
                            color: Colors.green,
                            onTap:
                                showReservations
                                    ? () => setState(
                                      () => _selectedSection = 'reservations',
                                    )
                                    : null,
                          ),
                        ),
                      ],
                    ),
                    const SizedBox(height: 20),
                    if (activeSection == 'orders' && showOrders) ...[
                      Container(
                        padding: const EdgeInsets.symmetric(
                          horizontal: 12,
                          vertical: 10,
                        ),
                        decoration: BoxDecoration(
                          color: Colors.orange.withValues(alpha: 0.08),
                          borderRadius: BorderRadius.circular(12),
                          border: Border.all(
                            color: Colors.orange.withValues(alpha: 0.25),
                          ),
                        ),
                        child: Row(
                          children: const [
                            Icon(
                              Icons.shopping_bag_outlined,
                              color: Colors.orange,
                            ),
                            SizedBox(width: 8),
                            Text(
                              'Pedido',
                              style: TextStyle(
                                fontWeight: FontWeight.bold,
                                color: Colors.orange,
                                fontSize: 16,
                              ),
                            ),
                          ],
                        ),
                      ),
                      const SizedBox(height: 12),
                      ...cartProvider.orderItems.map(
                        (item) =>
                            CartItemWidget(item: item, isReservation: false),
                      ),
                      const SizedBox(height: 8),
                      Row(
                        mainAxisAlignment: MainAxisAlignment.spaceBetween,
                        children: [
                          const Text('Subtotal pedido:'),
                          Text(
                            'Bs ${cartProvider.orderTotal.toStringAsFixed(2)}',
                            style: const TextStyle(fontWeight: FontWeight.bold),
                          ),
                        ],
                      ),
                      const SizedBox(height: 16),
                      const Text(
                        'Método de Pago del Pedido',
                        style: TextStyle(
                          fontSize: 14,
                          fontWeight: FontWeight.bold,
                        ),
                      ),
                      const SizedBox(height: 12),
                      DropdownButtonFormField<String>(
                        value: _selectedPaymentMethod,
                        decoration: InputDecoration(
                          border: OutlineInputBorder(
                            borderRadius: BorderRadius.circular(12),
                          ),
                          prefixIcon: const Icon(Icons.payment),
                          contentPadding: const EdgeInsets.symmetric(
                            horizontal: 12,
                            vertical: 8,
                          ),
                        ),
                        items:
                            _paymentMethodsFor(isReservation: false)
                                .map(
                                  (value) => DropdownMenuItem(
                                    value: value,
                                    child: Text(value),
                                  ),
                                )
                                .toList(),
                        onChanged: (value) {
                          setState(() {
                            _selectedPaymentMethod = value!;
                          });
                        },
                      ),
                      const SizedBox(height: 16),
                      _buildOrderPaymentStep(),
                      const SizedBox(height: 16),
                      CustomButton(
                        label: 'Confirmar Pedido',
                        onPressed: _checkoutOrder,
                        isLoading: _isProcessing,
                      ),
                      const SizedBox(height: 24),
                    ],
                    if (activeSection == 'reservations' &&
                        showReservations) ...[
                      Container(
                        padding: const EdgeInsets.symmetric(
                          horizontal: 12,
                          vertical: 10,
                        ),
                        decoration: BoxDecoration(
                          color: Colors.green.withValues(alpha: 0.08),
                          borderRadius: BorderRadius.circular(12),
                          border: Border.all(
                            color: Colors.green.withValues(alpha: 0.25),
                          ),
                        ),
                        child: Row(
                          children: const [
                            Icon(Icons.event_available, color: Colors.green),
                            SizedBox(width: 8),
                            Text(
                              'Reserva',
                              style: TextStyle(
                                fontWeight: FontWeight.bold,
                                color: Colors.green,
                                fontSize: 16,
                              ),
                            ),
                          ],
                        ),
                      ),
                      const SizedBox(height: 12),
                      ...cartProvider.reservationItems.map(
                        (item) =>
                            CartItemWidget(item: item, isReservation: true),
                      ),
                      const SizedBox(height: 8),
                      Row(
                        mainAxisAlignment: MainAxisAlignment.spaceBetween,
                        children: [
                          const Text('Subtotal reserva:'),
                          Text(
                            'Bs ${cartProvider.reservationTotal.toStringAsFixed(2)}',
                            style: const TextStyle(fontWeight: FontWeight.bold),
                          ),
                        ],
                      ),
                      const SizedBox(height: 16),
                      const Text(
                        'Método de Pago de la Reserva',
                        style: TextStyle(
                          fontSize: 14,
                          fontWeight: FontWeight.bold,
                        ),
                      ),
                      const SizedBox(height: 12),
                      DropdownButtonFormField<String>(
                        value: _selectedReservationPaymentMethod,
                        decoration: InputDecoration(
                          border: OutlineInputBorder(
                            borderRadius: BorderRadius.circular(12),
                          ),
                          prefixIcon: const Icon(Icons.payment),
                          contentPadding: const EdgeInsets.symmetric(
                            horizontal: 12,
                            vertical: 8,
                          ),
                        ),
                        items:
                            _paymentMethodsFor(isReservation: true)
                                .map(
                                  (value) => DropdownMenuItem(
                                    value: value,
                                    child: Text(value),
                                  ),
                                )
                                .toList(),
                        onChanged: (value) {
                          setState(() {
                            _selectedReservationPaymentMethod = value!;
                          });
                        },
                      ),
                      const SizedBox(height: 16),
                      _buildReservationPaymentStep(),
                      const SizedBox(height: 16),
                    ],
                    Row(
                      children: [
                        Expanded(
                          child: OutlinedButton(
                            onPressed: () => Navigator.pop(context),
                            child: const Text('Cancelar'),
                          ),
                        ),
                        const SizedBox(width: 12),
                        Expanded(
                          child: ElevatedButton(
                            onPressed: () => Navigator.pop(context),
                            child: const Text('Seguir comprando'),
                          ),
                        ),
                      ],
                    ),
                  ],
                ),
              ),
            ),
          );
        },
      ),
    );
  }

  Widget _buildSectionTab({
    required String title,
    required int count,
    required double total,
    required bool isSelected,
    required Color color,
    required VoidCallback? onTap,
  }) {
    final backgroundColor =
        isSelected ? color.withValues(alpha: 0.14) : Colors.grey.shade100;
    final borderColor = isSelected ? color : Colors.grey.shade300;
    final textColor = isSelected ? color : Colors.grey.shade600;

    return InkWell(
      onTap: onTap,
      borderRadius: BorderRadius.circular(12),
      child: Container(
        padding: const EdgeInsets.all(12),
        decoration: BoxDecoration(
          color: backgroundColor,
          borderRadius: BorderRadius.circular(12),
          border: Border.all(color: borderColor, width: isSelected ? 2 : 1),
        ),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(
              title,
              style: TextStyle(
                fontWeight: FontWeight.bold,
                color: textColor,
                fontSize: 16,
              ),
            ),
            const SizedBox(height: 4),
            Text('$count productos', style: TextStyle(color: textColor)),
            const SizedBox(height: 4),
            Text(
              'Bs ${total.toStringAsFixed(2)}',
              style: TextStyle(fontWeight: FontWeight.bold, color: textColor),
            ),
          ],
        ),
      ),
    );
  }
}
