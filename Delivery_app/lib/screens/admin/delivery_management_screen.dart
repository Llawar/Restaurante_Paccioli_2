import 'package:delivery/config/constants.dart';
import 'package:delivery/models/delivery_person_model.dart';
import 'package:delivery/models/user_model.dart';
import 'package:delivery/providers/admin_provider.dart';
import 'package:flutter/material.dart';
import 'package:provider/provider.dart';

class DeliveryManagementScreen extends StatefulWidget {
  const DeliveryManagementScreen({super.key});

  @override
  State<DeliveryManagementScreen> createState() =>
      _DeliveryManagementScreenState();
}

class _DeliveryManagementScreenState extends State<DeliveryManagementScreen> {
  final TextEditingController _searchController = TextEditingController();
  DeliveryPersonStatus? _filterStatus;
  String _sortBy = 'name';

  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) {
      _loadDeliveryPersons();
    });
  }

  @override
  void dispose() {
    _searchController.dispose();
    super.dispose();
  }

  Future<void> _loadDeliveryPersons() async {
    await context.read<AdminProvider>().fetchAllDeliveryPersons();
  }

  List<DeliveryPerson> _getFilteredAndSorted(List<DeliveryPerson> persons) {
    var filtered = persons;

    // Filtrar por estado
    if (_filterStatus != null) {
      filtered =
          filtered
              .where((p) => p.estadoDisponibilidad == _filterStatus)
              .toList();
    }

    // Ordenar
    switch (_sortBy) {
      case 'name':
        filtered.sort(
          (a, b) => a.id.compareTo(b.id),
        ); // Ordenar por ID como proxy
        break;
      case 'rating':
        filtered.sort(
          (a, b) => b.calificacionPromedio.compareTo(a.calificacionPromedio),
        );
        break;
      case 'deliveries':
        filtered.sort(
          (a, b) => b.entregasCompletadas.compareTo(a.entregasCompletadas),
        );
        break;
    }

    return filtered;
  }

  void _showDeliveryProfile(DeliveryPerson person) {
    showModalBottomSheet(

      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.transparent,
      builder:
          (context) => _DeliveryProfileSheet(
            person: person,
            onStatusChange: (status) async {
              final success = await context
                  .read<AdminProvider>()
                  .updateDeliveryPersonStatus(person.id, status);
              if (success && mounted) {
                Navigator.pop(context);
                ScaffoldMessenger.of(context).showSnackBar(
                  const SnackBar(
                    content: Text('Estado actualizado exitosamente'),
                    backgroundColor: Colors.green,
                  ),
                );
              }
            },
          ),
    );
  }

  void _showPromoteUserDialog(BuildContext context) {
    final emailController = TextEditingController();
    User? foundUser;

    showDialog(
      context: context,
      builder: (context) => StatefulBuilder(
        builder: (context, setStateDialog) => AlertDialog(
          title: const Text('Promover a Repartidor'),
          content: Column(
            mainAxisSize: MainAxisSize.min,
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              const Text('Ingrese el email del cliente para promoverlo:'),
              const SizedBox(height: 12),
              TextField(
                controller: emailController,
                decoration: InputDecoration(
                  hintText: 'email@ejemplo.com',
                  suffixIcon: IconButton(
                    icon: const Icon(Icons.search),
                    onPressed: () async {
                      final user = await context.read<AdminProvider>().searchUserByEmail(
                            emailController.text.trim(),
                          );
                      setStateDialog(() => foundUser = user);
                      if (user == null) {
                        ScaffoldMessenger.of(context).showSnackBar(
                          const SnackBar(content: Text('Usuario no encontrado')),
                        );
                      }
                    },
                  ),
                  border: OutlineInputBorder(
                    borderRadius: BorderRadius.circular(10),
                  ),
                ),
              ),
              if (foundUser != null) ...[
                const SizedBox(height: 20),
                Container(
                  padding: const EdgeInsets.all(12),
                  decoration: BoxDecoration(
                    color: Colors.grey[200],
                    borderRadius: BorderRadius.circular(10),
                  ),
                  child: Row(
                    children: [
                      const Icon(Icons.person, size: 40),
                      const SizedBox(width: 12),
                      Expanded(
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Text(
                              foundUser!.nombre,
                              style: const TextStyle(
                                fontWeight: FontWeight.bold,
                                fontSize: 16,
                              ),
                            ),
                            Text(foundUser!.email),
                          ],
                        ),
                      ),
                    ],
                  ),
                ),
              ],
            ],
          ),
          actions: [
            TextButton(
              onPressed: () => Navigator.pop(context),
              child: const Text('Cancelar'),
            ),
            if (foundUser != null)
              ElevatedButton(
                onPressed: () async {
                  final success = await context
                      .read<AdminProvider>()
                      .promoteUserToDelivery(foundUser!.id);
                  if (success) {
                    Navigator.pop(context);
                    _loadDeliveryPersons();
                    ScaffoldMessenger.of(context).showSnackBar(
                      const SnackBar(
                        content: Text('Usuario promovido exitosamente'),
                        backgroundColor: Colors.green,
                      ),
                    );
                  } else {
                    ScaffoldMessenger.of(context).showSnackBar(
                      const SnackBar(
                        content: Text('Error al promover usuario'),
                        backgroundColor: Colors.red,
                      ),
                    );
                  }
                },
                child: const Text('Promover Ahora'),
              ),
          ],
        ),
      ),
    );
  }

  Widget _buildFiltersSection(ThemeData theme, bool isMobile) {

    return Container(
      padding: EdgeInsets.all(isMobile ? 12 : 16),
      decoration: BoxDecoration(
        color: theme.colorScheme.surface,
        border: Border(bottom: BorderSide(color: theme.dividerColor)),
      ),
      child: Column(
        children: [
          // Búsqueda
          TextField(
            controller: _searchController,
            decoration: InputDecoration(
              hintText: 'Buscar repartidor...',
              prefixIcon: const Icon(Icons.search, size: 20),
              suffixIcon:
                  _searchController.text.isNotEmpty
                      ? IconButton(
                        icon: const Icon(Icons.clear, size: 18),
                        onPressed: () {
                          _searchController.clear();
                          _loadDeliveryPersons();
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
              isDense: isMobile,
            ),
          ),
          const SizedBox(height: 8),
          // Filtros y ordenamiento
          isMobile
              ? Column(
                children: [
                  DropdownButtonFormField<DeliveryPersonStatus?>(
                    value: _filterStatus,
                    isExpanded: true,
                    decoration: InputDecoration(
                      labelText: 'Estado',
                      border: OutlineInputBorder(
                        borderRadius: BorderRadius.circular(10),
                      ),
                      contentPadding: const EdgeInsets.symmetric(
                        horizontal: 12,
                        vertical: 8,
                      ),
                      isDense: true,
                    ),
                    items: [
                      const DropdownMenuItem(value: null, child: Text('Todos')),
                      ...DeliveryPersonStatus.values.map((status) {
                        String label;
                        switch (status) {
                          case DeliveryPersonStatus.available:
                            label = 'Disponible';
                            break;
                          case DeliveryPersonStatus.busy:
                            label = 'Ocupado';
                            break;
                          case DeliveryPersonStatus.offline:
                            label = 'Desconectado';
                            break;
                        }
                        return DropdownMenuItem(
                          value: status,
                          child: Text(label),
                        );
                      }),
                    ],
                    onChanged: (value) {
                      setState(() => _filterStatus = value);
                    },
                  ),
                  const SizedBox(height: 8),
                  DropdownButtonFormField<String>(
                    value: _sortBy,
                    isExpanded: true,
                    decoration: InputDecoration(
                      labelText: 'Ordenar',
                      border: OutlineInputBorder(
                        borderRadius: BorderRadius.circular(10),
                      ),
                      contentPadding: const EdgeInsets.symmetric(
                        horizontal: 12,
                        vertical: 8,
                      ),
                      isDense: true,
                    ),
                    items: const [
                      DropdownMenuItem(value: 'name', child: Text('Nombre')),
                      DropdownMenuItem(value: 'rating', child: Text('Rating')),
                      DropdownMenuItem(
                        value: 'deliveries',
                        child: Text('Entregas'),
                      ),
                    ],
                    onChanged: (value) {
                      setState(() => _sortBy = value!);
                    },
                  ),
                ],
              )
              : Row(
                children: [
                  Expanded(
                    child: DropdownButtonFormField<DeliveryPersonStatus?>(
                      value: _filterStatus,
                      decoration: InputDecoration(
                        labelText: 'Estado',
                        border: OutlineInputBorder(
                          borderRadius: BorderRadius.circular(12),
                        ),
                        contentPadding: const EdgeInsets.symmetric(
                          horizontal: 12,
                        ),
                      ),
                      items: [
                        const DropdownMenuItem(
                          value: null,
                          child: Text('Todos'),
                        ),
                        ...DeliveryPersonStatus.values.map((status) {
                          String label;
                          switch (status) {
                            case DeliveryPersonStatus.available:
                              label = 'Disponible';
                              break;
                            case DeliveryPersonStatus.busy:
                              label = 'Ocupado';
                              break;
                            case DeliveryPersonStatus.offline:
                              label = 'Desconectado';
                              break;
                          }
                          return DropdownMenuItem(
                            value: status,
                            child: Text(label),
                          );
                        }),
                      ],
                      onChanged: (value) {
                        setState(() => _filterStatus = value);
                      },
                    ),
                  ),
                  const SizedBox(width: 12),
                  Expanded(
                    child: DropdownButtonFormField<String>(
                      value: _sortBy,
                      decoration: InputDecoration(
                        labelText: 'Ordenar por',
                        border: OutlineInputBorder(
                          borderRadius: BorderRadius.circular(12),
                        ),
                        contentPadding: const EdgeInsets.symmetric(
                          horizontal: 12,
                        ),
                      ),
                      items: const [
                        DropdownMenuItem(value: 'name', child: Text('Nombre')),
                        DropdownMenuItem(
                          value: 'rating',
                          child: Text('Calificación'),
                        ),
                        DropdownMenuItem(
                          value: 'deliveries',
                          child: Text('Entregas'),
                        ),
                      ],
                      onChanged: (value) {
                        setState(() => _sortBy = value!);
                      },
                    ),
                  ),
                ],
              ),
        ],
      ),
    );
  }

  Widget _buildStatusSummary(bool isMobile) {
    return Consumer<AdminProvider>(
      builder: (context, adminProvider, _) {
        final persons = adminProvider.deliveryPersons;
        final available =
            persons
                .where(
                  (p) =>
                      p.estadoDisponibilidad == DeliveryPersonStatus.available,
                )
                .length;
        final busy =
            persons
                .where(
                  (p) => p.estadoDisponibilidad == DeliveryPersonStatus.busy,
                )
                .length;
        final offline =
            persons
                .where(
                  (p) => p.estadoDisponibilidad == DeliveryPersonStatus.offline,
                )
                .length;

        return Padding(
          padding: EdgeInsets.all(isMobile ? 12 : 16),
          child:
              isMobile
                  ? Row(
                    children: [
                      Expanded(
                        child: _StatusBadge(
                          count: available,
                          label: 'Disp.',
                          color: Colors.green,
                          isCompact: true,
                        ),
                      ),
                      const SizedBox(width: 8),
                      Expanded(
                        child: _StatusBadge(
                          count: busy,
                          label: 'Ocup.',
                          color: Colors.orange,
                          isCompact: true,
                        ),
                      ),
                      const SizedBox(width: 8),
                      Expanded(
                        child: _StatusBadge(
                          count: offline,
                          label: 'Off.',
                          color: Colors.grey,
                          isCompact: true,
                        ),
                      ),
                    ],
                  )
                  : Row(
                    children: [
                      _StatusBadge(
                        count: available,
                        label: 'Disponibles',
                        color: Colors.green,
                      ),
                      const SizedBox(width: 8),
                      _StatusBadge(
                        count: busy,
                        label: 'Ocupados',
                        color: Colors.orange,
                      ),
                      const SizedBox(width: 8),
                      _StatusBadge(
                        count: offline,
                        label: 'Offline',
                        color: Colors.grey,
                      ),
                    ],
                  ),
        );
      },
    );
  }

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final size = MediaQuery.sizeOf(context);
    final isMobile = size.width < 600;

    return Scaffold(
      floatingActionButton: FloatingActionButton.extended(
        onPressed: () => _showPromoteUserDialog(context),
        label: const Text('Promover Repartidor'),
        icon: const Icon(Icons.person_add),
        backgroundColor: theme.colorScheme.primary,
        foregroundColor: theme.colorScheme.onPrimary,
      ),
      body: CustomScrollView(

        slivers: [
          SliverAppBar(
            expandedHeight: isMobile ? 120 : 140,
            floating: false,
            pinned: true,
            flexibleSpace: FlexibleSpaceBar(
              title: const Text('Gestión de Repartidores'),
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
          ),
          // Filtros
          SliverToBoxAdapter(child: _buildFiltersSection(theme, isMobile)),
          // Resumen de repartidores
          SliverToBoxAdapter(child: _buildStatusSummary(isMobile)),
          // Lista de repartidores
          Consumer<AdminProvider>(
            builder: (context, adminProvider, _) {
              if (adminProvider.isLoading) {
                return const SliverFillRemaining(
                  child: Center(child: CircularProgressIndicator()),
                );
              }

              final persons = _getFilteredAndSorted(
                adminProvider.deliveryPersons,
              );

              if (persons.isEmpty) {
                return const SliverFillRemaining(
                  child: Center(
                    child: Column(
                      mainAxisAlignment: MainAxisAlignment.center,
                      children: [
                        Icon(
                          Icons.people_outline,
                          size: 64,
                          color: Colors.grey,
                        ),
                        SizedBox(height: 16),
                        Text(
                          'No hay repartidores',
                          style: TextStyle(color: Colors.grey),
                        ),
                      ],
                    ),
                  ),
                );
              }

              return SliverList(
                delegate: SliverChildBuilderDelegate((context, index) {
                  final person = persons[index];
                  return _DeliveryPersonCard(
                    person: person,
                    onTap: () => _showDeliveryProfile(person),
                  );
                }, childCount: persons.length),
              );
            },
          ),
          const SliverPadding(padding: EdgeInsets.only(bottom: 24)),
        ],
      ),
    );
  }
}

class _StatusBadge extends StatelessWidget {
  final int count;
  final String label;
  final Color color;
  final bool isCompact;

  const _StatusBadge({
    required this.count,
    required this.label,
    required this.color,
    this.isCompact = false,
  });

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: EdgeInsets.symmetric(
        vertical: isCompact ? 8 : 12,
        horizontal: isCompact ? 4 : 8,
      ),
      decoration: BoxDecoration(
        color: color.withValues(alpha: 0.1),
        borderRadius: BorderRadius.circular(isCompact ? 8 : 12),
        border: Border.all(color: color.withValues(alpha: 0.3)),
      ),
      child: Column(
        mainAxisSize: MainAxisSize.min,
        children: [
          Text(
            count.toString(),
            style: TextStyle(
              fontSize: isCompact ? 16 : 20,
              fontWeight: FontWeight.bold,
              color: color,
            ),
          ),
          Text(
            label,
            style: TextStyle(
              fontSize: isCompact ? 10 : 11,
              color: color.withValues(alpha: 0.8),
            ),
            maxLines: 1,
            overflow: TextOverflow.ellipsis,
          ),
        ],
      ),
    );
  }
}

class _DeliveryPersonCard extends StatelessWidget {
  final DeliveryPerson person;
  final VoidCallback onTap;

  const _DeliveryPersonCard({required this.person, required this.onTap});

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);

    Color statusColor;
    String statusText;
    IconData statusIcon;

    switch (person.estadoDisponibilidad) {
      case DeliveryPersonStatus.available:
        statusColor = Colors.green;
        statusText = 'Disponible';
        statusIcon = Icons.check_circle;
        break;
      case DeliveryPersonStatus.busy:
        statusColor = Colors.orange;
        statusText = 'Ocupado';
        statusIcon = Icons.local_shipping;
        break;
      case DeliveryPersonStatus.offline:
        statusColor = Colors.grey;
        statusText = 'Desconectado';
        statusIcon = Icons.offline_bolt;
        break;
    }

    IconData vehicleIcon;
    switch (person.tipoVehiculo) {
      case VehicleType.motorcycle:
        vehicleIcon = Icons.motorcycle;
        break;
      case VehicleType.car:
        vehicleIcon = Icons.directions_car;
        break;
      case VehicleType.bicycle:
        vehicleIcon = Icons.pedal_bike;
        break;
    }

    return Card(
      elevation: 2,
      margin: const EdgeInsets.symmetric(horizontal: 16, vertical: 6),
      child: InkWell(
        onTap: onTap,
        borderRadius: BorderRadius.circular(12),
        child: Padding(
          padding: const EdgeInsets.all(16),
          child: Row(
            children: [
              // Avatar
              Container(
                width: 56,
                height: 56,
                decoration: BoxDecoration(
                  gradient: LinearGradient(
                    colors: [
                      theme.colorScheme.primary,
                      theme.colorScheme.primaryContainer,
                    ],
                  ),
                  shape: BoxShape.circle,
                ),
                child: const Icon(Icons.person, color: Colors.white, size: 28),
              ),
              const SizedBox(width: 16),
              // Info
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      'Repartidor ${person.id.substring(0, 6).toUpperCase()}',
                      style: const TextStyle(
                        fontWeight: FontWeight.bold,
                        fontSize: 16,
                      ),
                      maxLines: 1,
                      overflow: TextOverflow.ellipsis,
                    ),
                    const SizedBox(height: 4),
                    Row(
                      children: [
                        Icon(vehicleIcon, size: 14, color: Colors.grey),
                        const SizedBox(width: 4),
                        Flexible(
                          child: Text(
                            person.numeroVehiculo,
                            style: TextStyle(
                              fontSize: 12,
                              color: Colors.grey[600],
                            ),
                            maxLines: 1,
                            overflow: TextOverflow.ellipsis,
                          ),
                        ),
                      ],
                    ),
                    const SizedBox(height: 8),
                    Row(
                      children: [
                        // Rating
                        Container(
                          padding: const EdgeInsets.symmetric(
                            horizontal: 8,
                            vertical: 2,
                          ),
                          decoration: BoxDecoration(
                            color: Colors.amber.withValues(alpha: 0.1),
                            borderRadius: BorderRadius.circular(12),
                          ),
                          child: Row(
                            mainAxisSize: MainAxisSize.min,
                            children: [
                              const Icon(
                                Icons.star,
                                size: 14,
                                color: Colors.amber,
                              ),
                              const SizedBox(width: 2),
                              Text(
                                person.calificacionPromedio.toStringAsFixed(1),
                                style: const TextStyle(
                                  fontSize: 12,
                                  fontWeight: FontWeight.bold,
                                ),
                              ),
                            ],
                          ),
                        ),
                        const SizedBox(width: 8),
                        // Entregas
                        Container(
                          padding: const EdgeInsets.symmetric(
                            horizontal: 8,
                            vertical: 2,
                          ),
                          decoration: BoxDecoration(
                            color: theme.colorScheme.primaryContainer,
                            borderRadius: BorderRadius.circular(12),
                          ),
                          child: Row(
                            mainAxisSize: MainAxisSize.min,
                            children: [
                              Icon(
                                Icons.check_circle,
                                size: 14,
                                color: theme.colorScheme.primary,
                              ),
                              const SizedBox(width: 2),
                              Text(
                                '${person.entregasCompletadas}',
                                style: TextStyle(
                                  fontSize: 12,
                                  fontWeight: FontWeight.bold,
                                  color: theme.colorScheme.primary,
                                ),
                              ),
                            ],
                          ),
                        ),
                      ],
                    ),
                  ],
                ),
              ),
              // Status
              Container(
                padding: const EdgeInsets.symmetric(
                  horizontal: 10,
                  vertical: 6,
                ),
                decoration: BoxDecoration(
                  color: statusColor.withValues(alpha: 0.1),
                  borderRadius: BorderRadius.circular(20),
                ),
                child: Row(
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    Icon(statusIcon, size: 14, color: statusColor),
                    const SizedBox(width: 4),
                    Flexible(
                      child: Text(
                        statusText,
                        style: TextStyle(
                          fontSize: 12,
                          fontWeight: FontWeight.w600,
                          color: statusColor,
                        ),
                        maxLines: 1,
                        overflow: TextOverflow.ellipsis,
                      ),
                    ),
                  ],
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}

class _DeliveryProfileSheet extends StatelessWidget {
  final DeliveryPerson person;
  final Function(DeliveryPersonStatus) onStatusChange;

  const _DeliveryProfileSheet({
    required this.person,
    required this.onStatusChange,
  });

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);

    Color statusColor;
    String statusText;

    switch (person.estadoDisponibilidad) {
      case DeliveryPersonStatus.available:
        statusColor = Colors.green;
        statusText = 'Disponible';
        break;
      case DeliveryPersonStatus.busy:
        statusColor = Colors.orange;
        statusText = 'Ocupado';
        break;
      case DeliveryPersonStatus.offline:
        statusColor = Colors.grey;
        statusText = 'Desconectado';
        break;
    }

    return DraggableScrollableSheet(
      initialChildSize: 0.8,
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
                    Container(
                      width: 80,
                      height: 80,
                      decoration: BoxDecoration(
                        gradient: LinearGradient(
                          colors: [
                            theme.colorScheme.primary,
                            theme.colorScheme.primaryContainer,
                          ],
                        ),
                        shape: BoxShape.circle,
                      ),
                      child: const Icon(
                        Icons.person,
                        color: Colors.white,
                        size: 40,
                      ),
                    ),
                    const SizedBox(width: 16),
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(
                            'Repartidor',
                            style: TextStyle(
                              fontSize: 14,
                              color: theme.colorScheme.onSurfaceVariant,
                            ),
                          ),
                          Text(
                            person.id.substring(0, 8).toUpperCase(),
                            style: const TextStyle(
                              fontSize: 22,
                              fontWeight: FontWeight.bold,
                            ),
                          ),
                          const SizedBox(height: 4),
                          Container(
                            padding: const EdgeInsets.symmetric(
                              horizontal: 10,
                              vertical: 4,
                            ),
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
              // Contenido
              Expanded(
                child: ListView(
                  controller: scrollController,
                  padding: const EdgeInsets.symmetric(horizontal: 20),
                  children: [
                    // Estadísticas principales
                    Row(
                      children: [
                        Expanded(
                          child: _StatCard(
                            icon: Icons.star,
                            value: person.calificacionPromedio.toStringAsFixed(
                              1,
                            ),
                            label: 'Calificación',
                            color: Colors.amber,
                          ),
                        ),
                        const SizedBox(width: 12),
                        Expanded(
                          child: _StatCard(
                            icon: Icons.check_circle,
                            value: person.entregasCompletadas.toString(),
                            label: 'Entregas',
                            color: theme.colorScheme.primary,
                          ),
                        ),
                        const SizedBox(width: 12),
                        Expanded(
                          child: _StatCard(
                            icon: _getVehicleIcon(person.tipoVehiculo),
                            value: _getVehicleName(person.tipoVehiculo),
                            label: 'Vehículo',
                            color: Colors.blue,
                          ),
                        ),
                      ],
                    ),
                    const SizedBox(height: 24),
                    // Información del vehículo
                    const Text(
                      'Información del Vehículo',
                      style: TextStyle(
                        fontSize: 16,
                        fontWeight: FontWeight.bold,
                      ),
                    ),
                    const SizedBox(height: 12),
                    Card(
                      child: Padding(
                        padding: const EdgeInsets.all(16),
                        child: Column(
                          children: [
                            _InfoRow(
                              icon: Icons.confirmation_number,
                              label: 'Placa/Número',
                              value: person.numeroVehiculo,
                            ),
                            const Divider(),
                            _InfoRow(
                              icon: Icons.badge,
                              label: 'Documento',
                              value: person.documento,
                            ),
                          ],
                        ),
                      ),
                    ),
                    const SizedBox(height: 24),
                    // Cambiar estado
                    const Text(
                      'Cambiar Estado',
                      style: TextStyle(
                        fontSize: 16,
                        fontWeight: FontWeight.bold,
                      ),
                    ),
                    const SizedBox(height: 12),
                    Row(
                      children: [
                        Expanded(
                          child: _StatusButton(
                            icon: Icons.check_circle,
                            label: 'Disponible',
                            color: Colors.green,
                            isSelected:
                                person.estadoDisponibilidad ==
                                DeliveryPersonStatus.available,
                            onTap:
                                () => onStatusChange(
                                  DeliveryPersonStatus.available,
                                ),
                          ),
                        ),
                        const SizedBox(width: 8),
                        Expanded(
                          child: _StatusButton(
                            icon: Icons.local_shipping,
                            label: 'Ocupado',
                            color: Colors.orange,
                            isSelected:
                                person.estadoDisponibilidad ==
                                DeliveryPersonStatus.busy,
                            onTap:
                                () => onStatusChange(DeliveryPersonStatus.busy),
                          ),
                        ),
                        const SizedBox(width: 8),
                        Expanded(
                          child: _StatusButton(
                            icon: Icons.offline_bolt,
                            label: 'Offline',
                            color: Colors.grey,
                            isSelected:
                                person.estadoDisponibilidad ==
                                DeliveryPersonStatus.offline,
                            onTap:
                                () => onStatusChange(
                                  DeliveryPersonStatus.offline,
                                ),
                          ),
                        ),
                      ],
                    ),
                    const SizedBox(height: 32),
                    // Ubicación (si está disponible)
                    if (person.latitudActual != null &&
                        person.longitudActual != null) ...[
                      const Text(
                        'Ubicación Actual',
                        style: TextStyle(
                          fontSize: 16,
                          fontWeight: FontWeight.bold,
                        ),
                      ),
                      const SizedBox(height: 12),
                      Container(
                        height: 200,
                        decoration: BoxDecoration(
                          color: theme.colorScheme.surfaceContainerHighest,
                          borderRadius: BorderRadius.circular(12),
                        ),
                        child: Center(
                          child: Column(
                            mainAxisAlignment: MainAxisAlignment.center,
                            children: [
                              Icon(
                                Icons.location_on,
                                size: 48,
                                color: theme.colorScheme.primary,
                              ),
                              const SizedBox(height: 8),
                              Text(
                                'Lat: ${person.latitudActual!.toStringAsFixed(4)}',
                                style: TextStyle(
                                  color: theme.colorScheme.onSurfaceVariant,
                                ),
                              ),
                              Text(
                                'Lng: ${person.longitudActual!.toStringAsFixed(4)}',
                                style: TextStyle(
                                  color: theme.colorScheme.onSurfaceVariant,
                                ),
                              ),
                            ],
                          ),
                        ),
                      ),
                      const SizedBox(height: 24),
                    ],
                  ],
                ),
              ),
            ],
          ),
        );
      },
    );
  }

  IconData _getVehicleIcon(VehicleType type) {
    switch (type) {
      case VehicleType.motorcycle:
        return Icons.motorcycle;
      case VehicleType.car:
        return Icons.directions_car;
      case VehicleType.bicycle:
        return Icons.pedal_bike;
    }
  }

  String _getVehicleName(VehicleType type) {
    switch (type) {
      case VehicleType.motorcycle:
        return 'Moto';
      case VehicleType.car:
        return 'Auto';
      case VehicleType.bicycle:
        return 'Bici';
    }
  }
}

class _StatCard extends StatelessWidget {
  final IconData icon;
  final String value;
  final String label;
  final Color color;

  const _StatCard({
    required this.icon,
    required this.value,
    required this.label,
    required this.color,
  });

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: color.withValues(alpha: 0.1),
        borderRadius: BorderRadius.circular(12),
      ),
      child: Column(
        children: [
          Icon(icon, color: color, size: 28),
          const SizedBox(height: 8),
          Text(
            value,
            style: TextStyle(
              fontSize: 18,
              fontWeight: FontWeight.bold,
              color: color,
            ),
          ),
          Text(
            label,
            style: TextStyle(fontSize: 11, color: color.withValues(alpha: 0.8)),
          ),
        ],
      ),
    );
  }
}

class _InfoRow extends StatelessWidget {
  final IconData icon;
  final String label;
  final String value;

  const _InfoRow({
    required this.icon,
    required this.label,
    required this.value,
  });

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 8),
      child: Row(
        children: [
          Icon(icon, size: 20, color: Colors.grey),
          const SizedBox(width: 12),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  label,
                  style: TextStyle(fontSize: 12, color: Colors.grey[600]),
                ),
                Text(
                  value,
                  style: const TextStyle(
                    fontSize: 14,
                    fontWeight: FontWeight.w500,
                  ),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }
}

class _StatusButton extends StatelessWidget {
  final IconData icon;
  final String label;
  final Color color;
  final bool isSelected;
  final VoidCallback onTap;

  const _StatusButton({
    required this.icon,
    required this.label,
    required this.color,
    required this.isSelected,
    required this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    return InkWell(
      onTap: onTap,
      borderRadius: BorderRadius.circular(12),
      child: Container(
        padding: const EdgeInsets.symmetric(vertical: 16, horizontal: 8),
        decoration: BoxDecoration(
          color: isSelected ? color.withValues(alpha: 0.2) : color.withValues(alpha: 0.05),
          borderRadius: BorderRadius.circular(12),
          border: Border.all(
            color: isSelected ? color : color.withValues(alpha: 0.3),
            width: isSelected ? 2 : 1,
          ),
        ),
        child: Column(
          children: [
            Icon(icon, color: color, size: 24),
            const SizedBox(height: 4),
            Text(
              label,
              style: TextStyle(
                color: color,
                fontSize: 12,
                fontWeight: isSelected ? FontWeight.bold : FontWeight.normal,
              ),
            ),
          ],
        ),
      ),
    );
  }
}
