import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:intl/intl.dart';
import 'dart:ui' as ui;
import 'dart:math' as math;
import '../services/auth_service.dart';
import '../services/database_service.dart';
import '../services/sync_service.dart';

class DashboardScreen extends StatefulWidget {
  const DashboardScreen({super.key});

  @override
  State<DashboardScreen> createState() => _DashboardScreenState();
}

class _DashboardScreenState extends State<DashboardScreen> {
  bool _syncing = false;
  double _todayRevenue = 0;
  int _orderCount = 0;
  int _lowStockCount = 0;
  int _customerCount = 0;
  List<double> _salesTrend = [];
  List<String> _dayLabels = [];

  @override
  void initState() {
    super.initState();
    _loadStats();
  }

  Future<void> _loadStats() async {
    final db = context.read<DatabaseService>();

    final items = await db.getItems();
    final sales = await db.getSales();
    final customers = await db.getCustomers();

    final now = DateTime.now();
    final todayStart = DateTime(now.year, now.month, now.day).millisecondsSinceEpoch;
    final todaySales = sales.where((s) => (s['created_at'] as int) >= todayStart).toList();

    final List<double> trend = [];
    final List<String> labels = [];
    for (int i = 6; i >= 0; i--) {
      final day = now.subtract(Duration(days: i));
      final dayStart = DateTime(day.year, day.month, day.day).millisecondsSinceEpoch;
      final dayEnd = dayStart + 86400000;
      final dayTotal = sales
          .where((s) => (s['created_at'] as int) >= dayStart && (s['created_at'] as int) < dayEnd)
          .fold(0.0, (sum, s) => sum + (s['total_amount'] as num));
      trend.add(dayTotal);
      labels.add(DateFormat('E').format(day));
    }

    if (mounted) {
      setState(() {
        _todayRevenue = todaySales.fold(0.0, (sum, s) => sum + (s['total_amount'] as num));
        _orderCount = sales.length;
        _customerCount = customers.length;
        _lowStockCount = items.where((i) => ((i['stock_level'] as int?) ?? 0) <= 5).length;
        _salesTrend = trend;
        _dayLabels = labels;
      });
    }
  }

  Future<void> _handleSync() async {
    setState(() => _syncing = true);
    final auth = context.read<AuthService>();
    final db = context.read<DatabaseService>();
    final token = auth.accessToken;

    if (token == null) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('Not authenticated')),
        );
      }
      setState(() => _syncing = false);
      return;
    }

    final syncService = SyncService(db);
    final success = await syncService.pullData(token);

    if (mounted) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text(success ? '✅ Data synced successfully' : '❌ Sync failed'),
          backgroundColor: success ? Colors.green.shade600 : Colors.red.shade600,
          behavior: SnackBarBehavior.floating,
          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
        ),
      );
      await _loadStats();
    }
    setState(() => _syncing = false);
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: Colors.grey.shade50,
      body: RefreshIndicator(
        onRefresh: _loadStats,
        child: SingleChildScrollView(
          padding: const EdgeInsets.all(20),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              _buildHeader(),
              const SizedBox(height: 24),
              _buildStatsGrid(),
              const SizedBox(height: 24),
              _buildChartSection(),
              const SizedBox(height: 24),
              _buildQuickActions(),
              const SizedBox(height: 24),
              _buildSyncCard(),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildHeader() {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        const Text('Business Overview',
            style: TextStyle(fontSize: 26, fontWeight: FontWeight.bold, color: Colors.black87)),
        const SizedBox(height: 4),
        Text(DateFormat('EEEE, MMMM dd, yyyy').format(DateTime.now()),
            style: TextStyle(color: Colors.grey.shade600, fontSize: 14)),
      ],
    );
  }

  Widget _buildStatsGrid() {
    return GridView.count(
      shrinkWrap: true,
      physics: const NeverScrollableScrollPhysics(),
      crossAxisCount: 2,
      mainAxisSpacing: 16,
      crossAxisSpacing: 16,
      childAspectRatio: 1.4,
      children: [
        _buildStatCard("Today's Revenue",
            'KES ${NumberFormat("#,##0").format(_todayRevenue)}',
            Icons.payments_outlined, Colors.green),
        _buildStatCard('Total Orders', _orderCount.toString(),
            Icons.shopping_basket_outlined, const Color(0xFF2563EB)),
        _buildStatCard('Low Stock Items', _lowStockCount.toString(),
            Icons.warning_amber_rounded, Colors.orange),
        _buildStatCard('Customers', _customerCount.toString(),
            Icons.people_outline, Colors.purple),
      ],
    );
  }

  Widget _buildStatCard(String label, String value, IconData icon, Color color) {
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(16),
        boxShadow: [
          BoxShadow(color: color.withOpacity(0.08), blurRadius: 12, offset: const Offset(0, 4)),
        ],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        mainAxisAlignment: MainAxisAlignment.spaceBetween,
        children: [
          Container(
            padding: const EdgeInsets.all(8),
            decoration: BoxDecoration(
              color: color.withOpacity(0.1),
              borderRadius: BorderRadius.circular(8),
            ),
            child: Icon(icon, color: color, size: 20),
          ),
          Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(value, style: const TextStyle(fontSize: 18, fontWeight: FontWeight.bold, color: Colors.black87)),
              Text(label, style: TextStyle(fontSize: 11, color: Colors.grey.shade500)),
            ],
          ),
        ],
      ),
    );
  }

  Widget _buildChartSection() {
    return Container(
      height: 260,
      padding: const EdgeInsets.all(20),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(20),
        boxShadow: [BoxShadow(color: Colors.black.withOpacity(0.04), blurRadius: 15, offset: const Offset(0, 5))],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              const Text('Sales Trend', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 16)),
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                decoration: BoxDecoration(
                  color: const Color(0xFF2563EB).withOpacity(0.1),
                  borderRadius: BorderRadius.circular(12),
                ),
                child: const Text('Last 7 Days', style: TextStyle(fontSize: 11, color: Color(0xFF2563EB), fontWeight: FontWeight.w600)),
              ),
            ],
          ),
          const SizedBox(height: 16),
          Expanded(
            child: CustomPaint(
              size: Size.infinite,
              painter: _SimpleChartPainter(
                data: _salesTrend,
                labels: _dayLabels,
                lineColor: const Color(0xFF2563EB),
                fillColor: const Color(0xFF2563EB).withOpacity(0.08),
              ),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildQuickActions() {
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(16),
        boxShadow: [BoxShadow(color: Colors.black.withOpacity(0.03), blurRadius: 10, offset: const Offset(0, 4))],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          const Text('Quick Actions', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 16)),
          const SizedBox(height: 12),
          Row(
            children: [
              _buildActionChip('New Sale', Icons.point_of_sale, const Color(0xFF2563EB), 14),
              const SizedBox(width: 12),
              _buildActionChip('Scan Item', Icons.qr_code_scanner, Colors.teal, -1),
              const SizedBox(width: 12),
              _buildActionChip('Add Item', Icons.add_box_outlined, Colors.orange, 2),
            ],
          ),
        ],
      ),
    );
  }

  Widget _buildActionChip(String label, IconData icon, Color color, int drawerIndex) {
    return Expanded(
      child: InkWell(
        onTap: () {
          if (drawerIndex == -1) {
            // Scanner action — use POS scanner
            Navigator.push(context, MaterialPageRoute(builder: (_) => const _ScannerRedirect()));
          } else {
            // Navigate via drawer index
            final homeState = context.findAncestorStateOfType<State>();
            // For now, just show a message
            ScaffoldMessenger.of(context).showSnackBar(
              SnackBar(content: Text('Navigate to $label via the drawer menu.'), behavior: SnackBarBehavior.floating),
            );
          }
        },
        borderRadius: BorderRadius.circular(12),
        child: Container(
          padding: const EdgeInsets.symmetric(vertical: 14),
          decoration: BoxDecoration(
            color: color.withOpacity(0.08),
            borderRadius: BorderRadius.circular(12),
          ),
          child: Column(
            children: [
              Icon(icon, color: color, size: 24),
              const SizedBox(height: 6),
              Text(label, style: TextStyle(fontSize: 11, fontWeight: FontWeight.w600, color: color)),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildSyncCard() {
    return Card(
      elevation: 0,
      color: Colors.white,
      shape: RoundedRectangleBorder(
        borderRadius: BorderRadius.circular(16),
        side: BorderSide(color: Colors.grey.shade200),
      ),
      child: ListTile(
        onTap: _syncing ? null : _handleSync,
        leading: CircleAvatar(
          backgroundColor: Colors.blue.shade50,
          child: Icon(Icons.sync, color: Colors.blue.shade700),
        ),
        title: const Text('Synchronize Cloud Data', style: TextStyle(fontWeight: FontWeight.w600)),
        subtitle: Text(_syncing ? 'Sync in progress...' : 'Tap to sync with server'),
        trailing: _syncing
            ? const SizedBox(width: 20, height: 20, child: CircularProgressIndicator(strokeWidth: 2))
            : const Icon(Icons.chevron_right),
      ),
    );
  }
}

// Lightweight custom chart painter (no external dependency)
class _SimpleChartPainter extends CustomPainter {
  final List<double> data;
  final List<String> labels;
  final Color lineColor;
  final Color fillColor;

  _SimpleChartPainter({
    required this.data,
    required this.labels,
    required this.lineColor,
    required this.fillColor,
  });

  @override
  void paint(Canvas canvas, Size size) {
    if (data.isEmpty) return;

    final maxVal = data.reduce(math.max);
    final minVal = 0.0;
    final range = maxVal - minVal == 0 ? 1.0 : maxVal - minVal;

    final points = <Offset>[];
    for (int i = 0; i < data.length; i++) {
      final x = (i / (data.length - 1)) * size.width;
      final y = size.height - 20 - ((data[i] - minVal) / range) * (size.height - 40);
      points.add(Offset(x, y));
    }

    // Draw fill
    final fillPath = ui.Path()
      ..moveTo(points.first.dx, size.height - 20);
    for (int i = 0; i < points.length - 1; i++) {
      final cp1 = Offset((points[i].dx + points[i + 1].dx) / 2, points[i].dy);
      final cp2 = Offset((points[i].dx + points[i + 1].dx) / 2, points[i + 1].dy);
      fillPath.cubicTo(cp1.dx, cp1.dy, cp2.dx, cp2.dy, points[i + 1].dx, points[i + 1].dy);
    }
    fillPath
      ..lineTo(points.last.dx, size.height - 20)
      ..close();
    canvas.drawPath(fillPath, Paint()..color = fillColor);

    // Draw line
    final linePath = ui.Path()..moveTo(points.first.dx, points.first.dy);
    for (int i = 0; i < points.length - 1; i++) {
      final cp1 = Offset((points[i].dx + points[i + 1].dx) / 2, points[i].dy);
      final cp2 = Offset((points[i].dx + points[i + 1].dx) / 2, points[i + 1].dy);
      linePath.cubicTo(cp1.dx, cp1.dy, cp2.dx, cp2.dy, points[i + 1].dx, points[i + 1].dy);
    }
    canvas.drawPath(
      linePath,
      Paint()
        ..color = lineColor
        ..strokeWidth = 3
        ..style = PaintingStyle.stroke
        ..strokeCap = StrokeCap.round,
    );

    // Draw dots
    for (final p in points) {
      canvas.drawCircle(p, 4, Paint()..color = lineColor);
      canvas.drawCircle(p, 2, Paint()..color = Colors.white);
    }

    // Draw labels
    final labelPainter = TextPainter(textDirection: ui.TextDirection.ltr);
    for (int i = 0; i < labels.length; i++) {
      labelPainter.text = TextSpan(
        text: labels[i],
        style: TextStyle(color: Colors.grey.shade500, fontSize: 10),
      );
      labelPainter.layout();
      labelPainter.paint(canvas, Offset(points[i].dx - labelPainter.width / 2, size.height - 14));
    }
  }

  @override
  bool shouldRepaint(covariant CustomPainter oldDelegate) => true;
}

// Simple redirect widget for the scanner quick action
class _ScannerRedirect extends StatelessWidget {
  const _ScannerRedirect();

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('Scanner')),
      body: const Center(
        child: Text('Use the scanner from POS Terminal or Inventory for best results.'),
      ),
    );
  }
}
