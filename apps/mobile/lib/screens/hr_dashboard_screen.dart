import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:intl/intl.dart';
import '../services/auth_service.dart';
import '../services/database_service.dart';
import 'leave_request_screen.dart';
import 'payslips_list_screen.dart';

class HRDashboardScreen extends StatefulWidget {
  const HRDashboardScreen({super.key});

  @override
  State<HRDashboardScreen> createState() => _HRDashboardScreenState();
}

class _HRDashboardScreenState extends State<HRDashboardScreen> {
  int _pendingLeaves = 0;
  double _lastNetPay = 0;
  bool _isLoading = true;

  @override
  void initState() {
    super.initState();
    _loadData();
  }

  Future<void> _loadData() async {
    final db = context.read<DatabaseService>();
    final auth = context.read<AuthService>();
    
    if (auth.employeeId == null) {
      setState(() => _isLoading = false);
      return;
    }

    final leaves = await db.query('hr_leaves', where: 'employee_id = ? AND status = ?', whereArgs: [auth.employeeId, 'PENDING']);
    final payslips = await db.query('payroll_payslips', where: 'employee_id = ?', orderBy: 'period_end DESC', whereArgs: [auth.employeeId]);

    if (mounted) {
      setState(() {
        _pendingLeaves = leaves.length;
        _lastNetPay = payslips.isNotEmpty ? (payslips.first['net_pay'] as num).toDouble() : 0.0;
        _isLoading = false;
      });
    }
  }

  @override
  Widget build(BuildContext context) {
    final auth = context.watch<AuthService>();

    if (auth.employeeId == null && !_isLoading) {
      return _buildNoEmployeeAccess();
    }

    return Scaffold(
      body: _isLoading 
        ? const Center(child: CircularProgressIndicator())
        : RefreshIndicator(
            onRefresh: _loadData,
            child: ListView(
              padding: const EdgeInsets.all(20),
              children: [
                _buildWelcomeHeader(auth),
                const SizedBox(height: 24),
                _buildStatsGrid(),
                const SizedBox(height: 32),
                const Text('Self Service', style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold)),
                const SizedBox(height: 16),
                _buildActionCard(
                  'Payslips',
                  'View and download your monthly salary slips',
                  Icons.receipt_long,
                  Colors.blue,
                  () => Navigator.push(context, MaterialPageRoute(builder: (_) => const PayslipsListScreen())),
                ),
                const SizedBox(height: 16),
                _buildActionCard(
                  'Leave Requests',
                  'Apply for time off and track approval status',
                  Icons.event_available,
                  Colors.orange,
                  () => Navigator.push(context, MaterialPageRoute(builder: (_) => const LeaveRequestScreen())),
                ),
                const SizedBox(height: 16),
                _buildActionCard(
                  'Employee Profile',
                  'View your contract and personal details',
                  Icons.badge_outlined,
                  Colors.purple,
                  () {},
                ),
              ],
            ),
          ),
    );
  }

  Widget _buildWelcomeHeader(AuthService auth) {
    return Row(
      children: [
        CircleAvatar(
          radius: 30,
          backgroundColor: const Color(0xFF2563EB).withOpacity(0.1),
          child: const Icon(Icons.person, size: 30, color: Color(0xFF2563EB)),
        ),
        const SizedBox(width: 16),
        Expanded(
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              const Text('Staff Portal', style: TextStyle(color: Colors.grey, fontSize: 14)),
              Text('Welcome back!', style: Theme.of(context).textTheme.headlineSmall?.copyWith(fontWeight: FontWeight.bold)),
            ],
          ),
        ),
      ],
    );
  }

  Widget _buildStatsGrid() {
    return Row(
      children: [
        _buildMiniStat('Pending Leaves', _pendingLeaves.toString(), Icons.timer_outlined, Colors.orange),
        const SizedBox(width: 16),
        _buildMiniStat('Last Salary', 'TZS ${NumberFormat("#,##0").format(_lastNetPay)}', Icons.payments_outlined, Colors.green),
      ],
    );
  }

  Widget _buildMiniStat(String label, String value, IconData icon, Color color) {
    return Expanded(
      child: Container(
        padding: const EdgeInsets.all(16),
        decoration: BoxDecoration(
          color: Colors.white,
          borderRadius: BorderRadius.circular(16),
          boxShadow: [BoxShadow(color: Colors.black.withOpacity(0.04), blurRadius: 10, offset: const Offset(0, 4))],
        ),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Icon(icon, color: color, size: 24),
            const SizedBox(height: 12),
            Text(value, style: const TextStyle(fontSize: 16, fontWeight: FontWeight.bold)),
            Text(label, style: TextStyle(fontSize: 11, color: Colors.grey.shade500)),
          ],
        ),
      ),
    );
  }

  Widget _buildActionCard(String title, String subtitle, IconData icon, Color color, VoidCallback onTap) {
    return InkWell(
      onTap: onTap,
      child: Container(
        padding: const EdgeInsets.all(16),
        decoration: BoxDecoration(
          color: Colors.white,
          borderRadius: BorderRadius.circular(16),
          border: Border.all(color: Colors.grey.shade100),
        ),
        child: Row(
          children: [
            Container(
              padding: const EdgeInsets.all(12),
              decoration: BoxDecoration(color: color.withOpacity(0.1), borderRadius: BorderRadius.circular(12)),
              child: Icon(icon, color: color),
            ),
            const SizedBox(width: 16),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(title, style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 16)),
                  Text(subtitle, style: TextStyle(fontSize: 12, color: Colors.grey.shade500)),
                ],
              ),
            ),
            const Icon(Icons.chevron_right, color: Colors.grey),
          ],
        ),
      ),
    );
  }

  Widget _buildNoEmployeeAccess() {
    return Center(
      child: Padding(
        padding: const EdgeInsets.all(40.0),
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            const Icon(Icons.lock_person_outlined, size: 80, color: Colors.grey),
            const SizedBox(height: 24),
            const Text('Access Restricted', style: TextStyle(fontSize: 20, fontWeight: FontWeight.bold)),
            const SizedBox(height: 12),
            const Text(
              'Your account is not linked as an Employee in this organization. Please contact HR to enable self-service features.',
              textAlign: TextAlign.center,
              style: TextStyle(color: Colors.grey),
            ),
            const SizedBox(height: 32),
            ElevatedButton(onPressed: () => Navigator.pop(context), child: const Text('Go Back')),
          ],
        ),
      ),
    );
  }
}
