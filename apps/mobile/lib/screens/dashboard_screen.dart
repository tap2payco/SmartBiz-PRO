import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:intl/intl.dart';
import 'dart:ui' as ui;
import 'dart:math' as math;
import '../services/auth_service.dart';
import '../services/database_service.dart';
import '../services/sync_service.dart';
import '../services/connectivity_service.dart';
import 'sales_screen.dart';
import 'scanner_screen.dart';
import 'add_product_screen.dart';
import 'payslips_list_screen.dart';
import 'placeholder_screen.dart';

import '../widgets/skeleton_loader.dart';

class DashboardScreen extends StatefulWidget {
  const DashboardScreen({super.key});

  @override
  State<DashboardScreen> createState() => _DashboardScreenState();
}

class _DashboardScreenState extends State<DashboardScreen> {
  bool _syncing = false;
  bool _isLoading = true;
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
    // Auto-sync on dashboard load if online
    WidgetsBinding.instance.addPostFrameCallback((_) {
      final conn = context.read<ConnectivityService>();
      if (conn.isOnline) conn.autoSync().then((_) => _loadStats());
    });
  }

  Future<void> _loadStats() async {
    setState(() => _isLoading = true);
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
        _isLoading = false;
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
    
    // Perform bilateral sync
    final pushSuccess = await syncService.pushData(token);
    final pullSuccess = await syncService.pullData(token);
    final success = pushSuccess && pullSuccess;

    if (mounted) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text(success 
            ? '✅ Complete sync successful' 
            : (!pushSuccess ? '❌ Push failed' : '❌ Pull failed')),
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
    final theme = Theme.of(context);
    return Scaffold(
      backgroundColor: theme.colorScheme.background,
      body: RefreshIndicator(
        onRefresh: _loadStats,
        child: SingleChildScrollView(
          padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 24),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              _buildAppBar(),
              const SizedBox(height: 24),
              _buildHeader(),
              const SizedBox(height: 32),
              _isLoading ? _buildStatsSkeleton() : _buildStatsGrid(),
              const SizedBox(height: 32),
              _isLoading ? _buildChartSkeleton() : _buildChartSection(),
              const SizedBox(height: 32),
              _buildQuickActions(),
              const SizedBox(height: 32),
              _buildSyncCard(),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildStatsSkeleton() {
    return GridView.count(
      shrinkWrap: true,
      physics: const NeverScrollableScrollPhysics(),
      crossAxisCount: 2,
      mainAxisSpacing: 16,
      crossAxisSpacing: 16,
      childAspectRatio: 1.4,
      children: const [
        SkeletonCard(),
        SkeletonCard(),
        SkeletonCard(),
        SkeletonCard(),
      ],
    );
  }

  Widget _buildChartSkeleton() {
    return const SkeletonLoader(width: double.infinity, height: 260, borderRadius: 24);
  }

  Widget _buildAppBar() {
    final profile = context.read<AuthService>().profile;
    return Row(
      mainAxisAlignment: MainAxisAlignment.spaceBetween,
      children: [
        Container(
          padding: const EdgeInsets.all(8),
          decoration: BoxDecoration(
            color: Colors.white,
            shape: BoxShape.circle,
            boxShadow: [BoxShadow(color: Colors.black.withOpacity(0.05), blurRadius: 10)],
          ),
          child: const Icon(Icons.grid_view_rounded, size: 20),
        ),
        Row(
          children: [
            const Icon(Icons.notifications_outlined, color: Colors.grey),
            const SizedBox(width: 16),
            Container(
              width: 40,
              height: 40,
              decoration: BoxDecoration(
                gradient: const LinearGradient(colors: [Color(0xFF6366F1), Color(0xFF4F46E5)]),
                borderRadius: BorderRadius.circular(12),
                boxShadow: [BoxShadow(color: const Color(0xFF6366F1).withOpacity(0.3), blurRadius: 8, offset: const Offset(0, 4))],
              ),
              child: Center(
                child: Text(
                  (profile?['firstName'] ?? 'U')[0].toUpperCase(),
                  style: const TextStyle(color: Colors.white, fontWeight: FontWeight.bold),
                ),
              ),
            ),
          ],
        ),
      ],
    );
  }

  Widget _buildHeader() {
    final profile = context.read<AuthService>().profile;
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(
          'Good morning, ${profile?['firstName'] ?? 'Partner'}!',
          style: const TextStyle(fontSize: 28, fontWeight: FontWeight.w900, color: Color(0xFF1E293B), letterSpacing: -1),
        ),
        const SizedBox(height: 4),
        Row(
          children: [
            Icon(Icons.calendar_today_outlined, size: 14, color: Colors.grey.shade500),
            const SizedBox(width: 6),
            Text(DateFormat('EEEE, MMM dd').format(DateTime.now()),
                style: TextStyle(color: Colors.grey.shade500, fontSize: 13, fontWeight: FontWeight.w500)),
          ],
        ),
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
            'TZS ${NumberFormat("#,##0").format(_todayRevenue)}',
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
    final isDark = Theme.of(context).brightness == Brightness.dark;
    return Container(
      padding: const EdgeInsets.all(20),
      decoration: BoxDecoration(
        gradient: LinearGradient(
          begin: Alignment.topLeft,
          end: Alignment.bottomRight,
          colors: isDark 
            ? [color.withOpacity(0.15), color.withOpacity(0.05)]
            : [Colors.white, color.withOpacity(0.05)],
        ),
        borderRadius: BorderRadius.circular(24),
        border: Border.all(color: color.withOpacity(0.1)),
        boxShadow: [
          BoxShadow(
            color: color.withOpacity(0.05),
            blurRadius: 20,
            offset: const Offset(0, 10),
          ),
        ],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        mainAxisAlignment: MainAxisAlignment.spaceBetween,
        children: [
          Container(
            padding: const EdgeInsets.all(10),
            decoration: BoxDecoration(
              color: color.withOpacity(0.1),
              borderRadius: BorderRadius.circular(12),
            ),
            child: Icon(icon, color: color, size: 22),
          ),
          Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              FittedBox(
                fit: BoxFit.scaleDown,
                child: Text(value, 
                  style: const TextStyle(fontSize: 20, fontWeight: FontWeight.bold, letterSpacing: -0.5)
                ),
              ),
              const SizedBox(height: 2),
              Text(label, style: TextStyle(fontSize: 12, color: isDark ? Colors.grey.shade400 : Colors.grey.shade600, fontWeight: FontWeight.w500)),
            ],
          ),
        ],
      ),
    );
  }

  Widget _buildChartSection() {
    final theme = Theme.of(context);
    final isDark = theme.brightness == Brightness.dark;
    return ClipRRect(
      borderRadius: BorderRadius.circular(28),
      child: BackdropFilter(
        filter: ui.ImageFilter.blur(sigmaX: 10, sigmaY: 10),
        child: Container(
          height: 280,
          padding: const EdgeInsets.all(24),
          decoration: BoxDecoration(
            color: isDark ? Colors.white.withOpacity(0.03) : Colors.white.withOpacity(0.8),
            borderRadius: BorderRadius.circular(28),
            border: Border.all(color: isDark ? Colors.white.withOpacity(0.05) : theme.dividerColor.withOpacity(0.1)),
          ),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  const Text('Sales Performance', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 18, letterSpacing: -0.5)),
                  Container(
                    padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
                    decoration: BoxDecoration(
                      color: theme.colorScheme.primary.withOpacity(0.1),
                      borderRadius: BorderRadius.circular(14),
                    ),
                    child: Text('Last 7 Days', style: TextStyle(fontSize: 12, color: theme.colorScheme.primary, fontWeight: FontWeight.bold)),
                  ),
                ],
              ),
              const SizedBox(height: 24),
              Expanded(
                child: CustomPaint(
                  size: Size.infinite,
                  painter: _SimpleChartPainter(
                    data: _salesTrend,
                    labels: _dayLabels,
                    lineColor: theme.colorScheme.primary,
                    fillColor: theme.colorScheme.primary.withOpacity(0.1),
                  ),
                ),
              ),
            ],
          ),
        ),
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
              _buildActionChip('New Sale', Icons.point_of_sale, const Color(0xFF2563EB), 17),
              const SizedBox(width: 8),
              _buildActionChip('Add Item', Icons.add_box_outlined, Colors.orange, 2),
              const SizedBox(width: 8),
              _buildActionChip('Payslips', Icons.receipt_long, Colors.blue, 14),
            ],
          ),
        ],
      ),
    );
  }

  Widget _buildActionChip(String label, IconData icon, Color color, int drawerIndex) {
    return Expanded(
      child: InkWell(
        onTap: () async {
          if (drawerIndex == -1) {
            // Scanner action
            final result = await Navigator.push<String>(
              context,
              MaterialPageRoute(builder: (_) => const ScannerScreen()),
            );
            if (result != null && mounted) {
              ScaffoldMessenger.of(context).showSnackBar(
                SnackBar(content: Text('Scanned: $result'), behavior: SnackBarBehavior.floating),
              );
            }
          } else {
            // Navigate via HomeShell using a callback or direct route
            // For now, since it's a shell, we can push the screen directly for quick access
            Widget screen;
            switch (drawerIndex) {
              case 17:
                screen = const SalesScreen();
                break;
              case 14:
                screen = const PayslipsListScreen();
                break;
              case 2:
                screen = const AddProductScreen();
                break;
              default:
                screen = const PlaceholderScreen(title: 'Feature');
            }
            
            Navigator.push(context, MaterialPageRoute(builder: (_) => screen));
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
    final conn = context.watch<ConnectivityService>();
    return Card(
      elevation: 0,
      color: Colors.white,
      shape: RoundedRectangleBorder(
        borderRadius: BorderRadius.circular(16),
        side: BorderSide(color: conn.isOnline ? Colors.green.shade200 : Colors.grey.shade200),
      ),
      child: Column(
        children: [
          ListTile(
            leading: CircleAvatar(
              backgroundColor: conn.isOnline ? Colors.green.shade50 : Colors.grey.shade100,
              child: Icon(
                conn.isOnline ? Icons.cloud_done : Icons.cloud_off,
                color: conn.isOnline ? Colors.green.shade700 : Colors.grey.shade500,
              ),
            ),
            title: Text(
              conn.isOnline ? 'Online' : 'Offline',
              style: TextStyle(
                fontWeight: FontWeight.w600,
                color: conn.isOnline ? Colors.green.shade700 : Colors.grey.shade700,
              ),
            ),
            subtitle: Text(
              conn.isSyncing
                ? 'Sync in progress...'
                : conn.isOnline
                  ? 'Data syncs automatically'
                  : 'Changes saved locally',
            ),
            trailing: conn.isSyncing
              ? const SizedBox(width: 20, height: 20, child: CircularProgressIndicator(strokeWidth: 2))
              : conn.isOnline
                ? IconButton(
                    icon: const Icon(Icons.sync),
                    onPressed: _syncing ? null : _handleSync,
                    tooltip: 'Manual sync',
                  )
                : const Icon(Icons.chevron_right, color: Colors.grey),
          ),
        ],
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

