import 'package:flutter/material.dart';
import 'package:intl/intl.dart';
import 'package:fl_chart/fl_chart.dart';

class AnalyticsScreen extends StatefulWidget {
  const AnalyticsScreen({super.key});

  @override
  State<AnalyticsScreen> createState() => _AnalyticsScreenState();
}

class _AnalyticsScreenState extends State<AnalyticsScreen> {
  String _selectedPeriod = 'week';

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);

    return DefaultTabController(
      length: 3,
      child: Scaffold(
        body: NestedScrollView(
          headerSliverBuilder:
              (context, innerBoxIsScrolled) => [
                SliverAppBar(
                  title: const Text('Análisis y Reportes'),
                  floating: true,
                  snap: true,
                  bottom: const TabBar(
                    tabs: [
                      Tab(icon: Icon(Icons.trending_up), text: 'Ingresos'),
                      Tab(icon: Icon(Icons.shopping_bag), text: 'Pedidos'),
                      Tab(icon: Icon(Icons.people), text: 'Repartidores'),
                    ],
                  ),
                ),
              ],
          body: Column(
            children: [
              // Selector de período
              Container(
                padding: const EdgeInsets.all(16),
                decoration: BoxDecoration(
                  color: theme.colorScheme.surface,
                  border: Border(bottom: BorderSide(color: theme.dividerColor)),
                ),
                child: LayoutBuilder(
                  builder: (context, constraints) {
                    final isSmall = constraints.maxWidth < 380;
                    return isSmall
                        ? Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          mainAxisSize: MainAxisSize.min,
                          children: [
                            const Text(
                              'Período:',
                              style: TextStyle(fontWeight: FontWeight.w600),
                            ),
                            const SizedBox(height: 8),
                            SegmentedButton<String>(
                              segments: const [
                                ButtonSegment(
                                  value: 'today',
                                  label: Text('Hoy'),
                                ),
                                ButtonSegment(
                                  value: 'week',
                                  label: Text('Semana'),
                                ),
                                ButtonSegment(
                                  value: 'month',
                                  label: Text('Mes'),
                                ),
                              ],
                              selected: {_selectedPeriod},
                              onSelectionChanged: (value) {
                                setState(() => _selectedPeriod = value.first);
                              },
                            ),
                          ],
                        )
                        : Row(
                          children: [
                            const Text(
                              'Período:',
                              style: TextStyle(fontWeight: FontWeight.w600),
                            ),
                            const SizedBox(width: 12),
                            SegmentedButton<String>(
                              segments: const [
                                ButtonSegment(
                                  value: 'today',
                                  label: Text('Hoy'),
                                ),
                                ButtonSegment(
                                  value: 'week',
                                  label: Text('Semana'),
                                ),
                                ButtonSegment(
                                  value: 'month',
                                  label: Text('Mes'),
                                ),
                              ],
                              selected: {_selectedPeriod},
                              onSelectionChanged: (value) {
                                setState(() => _selectedPeriod = value.first);
                              },
                            ),
                          ],
                        );
                  },
                ),
              ),
              // Contenido
              Expanded(
                child: TabBarView(
                  children: [
                    _RevenueTab(period: _selectedPeriod),
                    _OrdersTab(period: _selectedPeriod),
                    _DeliveryPersonTab(period: _selectedPeriod),
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

class _RevenueTab extends StatelessWidget {
  final String period;

  const _RevenueTab({required this.period});

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final currencyFormat = NumberFormat.currency(locale: 'es', symbol: 'Bs');

    // Datos de ejemplo - en producción vendrían del provider
    final revenueData = [
      1200.0,
      1850.0,
      2100.0,
      1650.0,
      2300.0,
      2800.0,
      1950.0,
    ];

    return ListView(
      padding: const EdgeInsets.all(16),
      children: [
        // KPIs de ingresos
        Row(
          children: [
            Expanded(
              child: _AnalyticsCard(
                title: 'Ingresos Totales',
                value: currencyFormat.format(15850),
                subtitle: '+12% vs período anterior',
                icon: Icons.attach_money,
                color: Colors.green,
              ),
            ),
            const SizedBox(width: 12),
            Expanded(
              child: _AnalyticsCard(
                title: 'Ticket Promedio',
                value: currencyFormat.format(45.50),
                subtitle: '+5% vs período anterior',
                icon: Icons.receipt,
                color: Colors.blue,
              ),
            ),
          ],
        ),
        const SizedBox(height: 24),

        // Gráfico de línea - Tendencia de ingresos
        Card(
          elevation: 2,
          child: Padding(
            padding: const EdgeInsets.all(16),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                const Text(
                  'Tendencia de Ingresos',
                  style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold),
                ),
                const SizedBox(height: 24),
                SizedBox(
                  height: 200,
                  child: LineChart(
                    LineChartData(
                      gridData: FlGridData(
                        show: true,
                        drawVerticalLine: false,
                        getDrawingHorizontalLine: (value) {
                          return FlLine(
                            color: theme.dividerColor,
                            strokeWidth: 1,
                          );
                        },
                      ),
                      titlesData: FlTitlesData(
                        show: true,
                        bottomTitles: AxisTitles(
                          sideTitles: SideTitles(
                            showTitles: true,
                            getTitlesWidget: (value, meta) {
                              final days = ['L', 'M', 'X', 'J', 'V', 'S', 'D'];
                              if (value.toInt() < days.length) {
                                return Text(
                                  days[value.toInt()],
                                  style: const TextStyle(fontSize: 10),
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
                      lineBarsData: [
                        LineChartBarData(
                          spots:
                              revenueData.asMap().entries.map((e) {
                                return FlSpot(e.key.toDouble(), e.value);
                              }).toList(),
                          isCurved: true,
                          color: theme.colorScheme.primary,
                          barWidth: 3,
                          dotData: const FlDotData(show: true),
                          belowBarData: BarAreaData(
                            show: true,
                             color: theme.colorScheme.primary.withValues(alpha: 0.1),
                          ),
                        ),
                      ],
                    ),
                  ),
                ),
              ],
            ),
          ),
        ),

        const SizedBox(height: 16),

        // Ingresos por categoría
        Card(
          elevation: 2,
          child: Padding(
            padding: const EdgeInsets.all(16),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                const Text(
                  'Ingresos por Categoría',
                  style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold),
                ),
                const SizedBox(height: 16),
                ...[
                  _CategoryBar(
                    label: 'Comida Rápida',
                    value: 6500,
                    total: 15850,
                    color: Colors.orange,
                  ),
                  _CategoryBar(
                    label: 'Bebidas',
                    value: 3200,
                    total: 15850,
                    color: Colors.blue,
                  ),
                  _CategoryBar(
                    label: 'Postres',
                    value: 2800,
                    total: 15850,
                    color: Colors.pink,
                  ),
                  _CategoryBar(
                    label: 'Otros',
                    value: 3350,
                    total: 15850,
                    color: Colors.grey,
                  ),
                ],
              ],
            ),
          ),
        ),
      ],
    );
  }
}

class _OrdersTab extends StatelessWidget {
  final String period;

  const _OrdersTab({required this.period});

  @override
  Widget build(BuildContext context) {
    return ListView(
      padding: const EdgeInsets.all(16),
      children: [
        // KPIs de pedidos
        Row(
          children: [
            Expanded(
              child: _AnalyticsCard(
                title: 'Total Pedidos',
                value: '348',
                subtitle: '+8% vs período anterior',
                icon: Icons.shopping_bag,
                color: Colors.orange,
              ),
            ),
            const SizedBox(width: 12),
            Expanded(
              child: _AnalyticsCard(
                title: 'Tiempo Promedio',
                value: '32 min',
                subtitle: '-15% más rápido',
                icon: Icons.timer,
                color: Colors.purple,
              ),
            ),
          ],
        ),
        const SizedBox(height: 24),

        // Gráfico de barras - Pedidos por hora
        Card(
          elevation: 2,
          child: Padding(
            padding: const EdgeInsets.all(16),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                const Text(
                  'Pedidos por Hora',
                  style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold),
                ),
                const SizedBox(height: 24),
                SizedBox(
                  height: 200,
                  child: BarChart(
                    BarChartData(
                      alignment: BarChartAlignment.spaceAround,
                      maxY: 50,
                      barTouchData: BarTouchData(
                        touchTooltipData: BarTouchTooltipData(
                          getTooltipColor: (group) => Colors.blueGrey,
                          getTooltipItem: (group, groupIndex, rod, rodIndex) {
                            return BarTooltipItem(
                              '${rod.toY.toInt()} pedidos',
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
                              final hours = [
                                '12PM',
                                '1PM',
                                '2PM',
                                '3PM',
                                '4PM',
                                '5PM',
                                '6PM',
                                '7PM',
                              ];
                              if (value.toInt() < hours.length) {
                                return Text(
                                  hours[value.toInt()],
                                  style: const TextStyle(fontSize: 9),
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
                      barGroups: [
                        _makeBarGroup(0, 15, Colors.orange),
                        _makeBarGroup(1, 25, Colors.orange),
                        _makeBarGroup(2, 35, Colors.orange),
                        _makeBarGroup(3, 20, Colors.orange),
                        _makeBarGroup(4, 18, Colors.orange),
                        _makeBarGroup(5, 40, Colors.orange),
                        _makeBarGroup(6, 45, Colors.orange),
                        _makeBarGroup(7, 30, Colors.orange),
                      ],
                    ),
                  ),
                ),
              ],
            ),
          ),
        ),

        const SizedBox(height: 16),

        // Estados de pedidos
        Card(
          elevation: 2,
          child: Padding(
            padding: const EdgeInsets.all(16),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                const Text(
                  'Distribución de Estados',
                  style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold),
                ),
                const SizedBox(height: 16),
                Row(
                  children: [
                    Expanded(
                      flex: 2,
                      child: SizedBox(
                        height: 150,
                        child: PieChart(
                          PieChartData(
                            sectionsSpace: 2,
                            centerSpaceRadius: 40,
                            sections: [
                              PieChartSectionData(
                                value: 45,
                                color: Colors.green,
                                radius: 25,
                                title: '45%',
                                titleStyle: const TextStyle(
                                  fontSize: 10,
                                  fontWeight: FontWeight.bold,
                                  color: Colors.white,
                                ),
                              ),
                              PieChartSectionData(
                                value: 20,
                                color: Colors.orange,
                                radius: 25,
                                title: '20%',
                                titleStyle: const TextStyle(
                                  fontSize: 10,
                                  fontWeight: FontWeight.bold,
                                  color: Colors.white,
                                ),
                              ),
                              PieChartSectionData(
                                value: 15,
                                color: Colors.blue,
                                radius: 25,
                                title: '15%',
                                titleStyle: const TextStyle(
                                  fontSize: 10,
                                  fontWeight: FontWeight.bold,
                                  color: Colors.white,
                                ),
                              ),
                              PieChartSectionData(
                                value: 20,
                                color: Colors.purple,
                                radius: 25,
                                title: '20%',
                                titleStyle: const TextStyle(
                                  fontSize: 10,
                                  fontWeight: FontWeight.bold,
                                  color: Colors.white,
                                ),
                              ),
                            ],
                          ),
                        ),
                      ),
                    ),
                    Expanded(
                      flex: 2,
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          _PieLegend(
                            color: Colors.green,
                            label: 'Entregados',
                            value: '45%',
                          ),
                          _PieLegend(
                            color: Colors.orange,
                            label: 'Pendientes',
                            value: '20%',
                          ),
                          _PieLegend(
                            color: Colors.blue,
                            label: 'Asignados',
                            value: '15%',
                          ),
                          _PieLegend(
                            color: Colors.purple,
                            label: 'En Camino',
                            value: '20%',
                          ),
                        ],
                      ),
                    ),
                  ],
                ),
              ],
            ),
          ),
        ),
      ],
    );
  }

  BarChartGroupData _makeBarGroup(int x, double y, Color color) {
    return BarChartGroupData(
      x: x,
      barRods: [
        BarChartRodData(
          toY: y,
          color: color,
          width: 16,
          borderRadius: BorderRadius.circular(4),
        ),
      ],
    );
  }
}

class _DeliveryPersonTab extends StatelessWidget {
  final String period;

  const _DeliveryPersonTab({required this.period});

  @override
  Widget build(BuildContext context) {
    return ListView(
      padding: const EdgeInsets.all(16),
      children: [
        // KPIs de repartidores
        Row(
          children: [
            Expanded(
              child: _AnalyticsCard(
                title: 'Repartidores Activos',
                value: '12',
                subtitle: '8 disponibles',
                icon: Icons.people,
                color: Colors.blue,
              ),
            ),
            const SizedBox(width: 12),
            Expanded(
              child: _AnalyticsCard(
                title: 'Calificación Prom.',
                value: '4.7',
                subtitle: '+0.2 vs mes pasado',
                icon: Icons.star,
                color: Colors.amber,
              ),
            ),
          ],
        ),
        const SizedBox(height: 24),

        // Top Repartidores
        Card(
          elevation: 2,
          child: Padding(
            padding: const EdgeInsets.all(16),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                const Text(
                  'Top Repartidores',
                  style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold),
                ),
                const SizedBox(height: 16),
                ...[
                  _TopDeliveryPerson(
                    rank: 1,
                    name: 'Juan Pérez',
                    deliveries: 45,
                    rating: 4.9,
                    color: Colors.amber,
                  ),
                  _TopDeliveryPerson(
                    rank: 2,
                    name: 'María García',
                    deliveries: 38,
                    rating: 4.8,
                    color: Colors.grey,
                  ),
                  _TopDeliveryPerson(
                    rank: 3,
                    name: 'Carlos López',
                    deliveries: 32,
                    rating: 4.7,
                    color: Colors.brown.shade300,
                  ),
                ],
              ],
            ),
          ),
        ),

        const SizedBox(height: 16),

        // Eficiencia por repartidor
        Card(
          elevation: 2,
          child: Padding(
            padding: const EdgeInsets.all(16),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                const Text(
                  'Eficiencia de Entregas',
                  style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold),
                ),
                const SizedBox(height: 24),
                ...[
                  _EfficiencyBar(
                    name: 'Juan P.',
                    efficiency: 95,
                    avgTime: '28 min',
                  ),
                  _EfficiencyBar(
                    name: 'María G.',
                    efficiency: 92,
                    avgTime: '30 min',
                  ),
                  _EfficiencyBar(
                    name: 'Carlos L.',
                    efficiency: 88,
                    avgTime: '32 min',
                  ),
                  _EfficiencyBar(
                    name: 'Ana R.',
                    efficiency: 85,
                    avgTime: '35 min',
                  ),
                  _EfficiencyBar(
                    name: 'Pedro M.',
                    efficiency: 82,
                    avgTime: '38 min',
                  ),
                ],
              ],
            ),
          ),
        ),
      ],
    );
  }
}

class _AnalyticsCard extends StatelessWidget {
  final String title;
  final String value;
  final String subtitle;
  final IconData icon;
  final Color color;

  const _AnalyticsCard({
    required this.title,
    required this.value,
    required this.subtitle,
    required this.icon,
    required this.color,
  });

  @override
  Widget build(BuildContext context) {
    return Card(
      elevation: 2,
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                Container(
                  padding: const EdgeInsets.all(8),
                  decoration: BoxDecoration(
                    color: color.withValues(alpha: 0.1),
                    borderRadius: BorderRadius.circular(8),
                  ),
                  child: Icon(icon, color: color, size: 20),
                ),
                Icon(
                  Icons.arrow_forward_ios,
                  size: 14,
                  color: Colors.grey[400],
                ),
              ],
            ),
            const SizedBox(height: 12),
            Text(
              value,
              style: const TextStyle(fontSize: 22, fontWeight: FontWeight.bold),
            ),
            Text(
              title,
              style: TextStyle(fontSize: 12, color: Colors.grey[600]),
            ),
            const SizedBox(height: 4),
            Text(
              subtitle,
              style: TextStyle(
                fontSize: 11,
                color: subtitle.contains('+') ? Colors.green : Colors.red,
              ),
            ),
          ],
        ),
      ),
    );
  }
}

class _CategoryBar extends StatelessWidget {
  final String label;
  final double value;
  final double total;
  final Color color;

  const _CategoryBar({
    required this.label,
    required this.value,
    required this.total,
    required this.color,
  });

  @override
  Widget build(BuildContext context) {
    final percentage = (value / total * 100).toStringAsFixed(1);
    final currencyFormat = NumberFormat.currency(locale: 'es', symbol: 'Bs');

    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 8),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Text(label, style: const TextStyle(fontWeight: FontWeight.w500)),
              Text(
                '${currencyFormat.format(value)} ($percentage%)',
                style: TextStyle(fontSize: 12, color: Colors.grey[600]),
              ),
            ],
          ),
          const SizedBox(height: 6),
          LinearProgressIndicator(
            value: value / total,
             backgroundColor: color.withValues(alpha: 0.1),
            valueColor: AlwaysStoppedAnimation<Color>(color),
            minHeight: 8,
            borderRadius: BorderRadius.circular(4),
          ),
        ],
      ),
    );
  }
}

class _PieLegend extends StatelessWidget {
  final Color color;
  final String label;
  final String value;

  const _PieLegend({
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

class _TopDeliveryPerson extends StatelessWidget {
  final int rank;
  final String name;
  final int deliveries;
  final double rating;
  final Color color;

  const _TopDeliveryPerson({
    required this.rank,
    required this.name,
    required this.deliveries,
    required this.rating,
    required this.color,
  });

  @override
  Widget build(BuildContext context) {
    return ListTile(
      leading: Container(
        width: 36,
        height: 36,
        decoration: BoxDecoration(color: color, shape: BoxShape.circle),
        child: Center(
          child: Text(
            '#$rank',
            style: const TextStyle(
              color: Colors.white,
              fontWeight: FontWeight.bold,
            ),
          ),
        ),
      ),
      title: Text(name, style: const TextStyle(fontWeight: FontWeight.w500)),
      subtitle: Text('$deliveries entregas'),
      trailing: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          const Icon(Icons.star, size: 16, color: Colors.amber),
          const SizedBox(width: 4),
          Text(
            rating.toStringAsFixed(1),
            style: const TextStyle(fontWeight: FontWeight.bold),
          ),
        ],
      ),
    );
  }
}

class _EfficiencyBar extends StatelessWidget {
  final String name;
  final int efficiency;
  final String avgTime;

  const _EfficiencyBar({
    required this.name,
    required this.efficiency,
    required this.avgTime,
  });

  @override
  Widget build(BuildContext context) {
    Color barColor;
    if (efficiency >= 90) {
      barColor = Colors.green;
    } else if (efficiency >= 80) {
      barColor = Colors.orange;
    } else {
      barColor = Colors.red;
    }

    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 8),
      child: Row(
        children: [
          SizedBox(
            width: 70,
            child: Text(name, style: const TextStyle(fontSize: 12)),
          ),
          Expanded(
            child: LinearProgressIndicator(
              value: efficiency / 100,
               backgroundColor: barColor.withValues(alpha: 0.1),
              valueColor: AlwaysStoppedAnimation<Color>(barColor),
              minHeight: 8,
              borderRadius: BorderRadius.circular(4),
            ),
          ),
          const SizedBox(width: 12),
          SizedBox(
            width: 50,
            child: Text(
              '$efficiency%',
              style: const TextStyle(fontSize: 12, fontWeight: FontWeight.bold),
            ),
          ),
          SizedBox(
            width: 50,
            child: Text(
              avgTime,
              style: TextStyle(fontSize: 11, color: Colors.grey[600]),
            ),
          ),
        ],
      ),
    );
  }
}
