import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:intl/intl.dart';
import '../services/database_service.dart';
import '../services/auth_service.dart';

class PayslipsListScreen extends StatefulWidget {
  const PayslipsListScreen({super.key});

  @override
  State<PayslipsListScreen> createState() => _PayslipsListScreenState();
}

class _PayslipsListScreenState extends State<PayslipsListScreen> {
  List<Map<String, dynamic>> _slips = [];
  bool _isLoading = true;

  @override
  void initState() {
    super.initState();
    _loadSlips();
  }

  Future<void> _loadSlips() async {
    final db = context.read<DatabaseService>();
    final auth = context.read<AuthService>();
    
    if (auth.employeeId == null) return;

    final data = await db.query(
      'payroll_payslips',
      where: 'employee_id = ?',
      whereArgs: [auth.employeeId],
      orderBy: 'period_end DESC',
    );

    if (mounted) {
      setState(() {
        _slips = data;
        _isLoading = false;
      });
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('My Payslips')),
      body: _isLoading
          ? const Center(child: CircularProgressIndicator())
          : _slips.isEmpty
              ? _buildEmptyState()
              : ListView.builder(
                  padding: const EdgeInsets.all(16),
                  itemCount: _slips.length,
                  itemBuilder: (context, index) {
                    final slip = _slips[index];
                    final start = DateTime.fromMillisecondsSinceEpoch(slip['period_start']);
                    final end = DateTime.fromMillisecondsSinceEpoch(slip['period_end']);
                    
                    return Card(
                      margin: const EdgeInsets.only(bottom: 12),
                      child: ListTile(
                        leading: const CircleAvatar(
                          backgroundColor: Color(0xFFEFF6FF),
                          child: Icon(Icons.description, color: Color(0xFF2563EB)),
                        ),
                        title: Text(DateFormat('MMMM yyyy').format(end), style: const TextStyle(fontWeight: FontWeight.bold)),
                        subtitle: Text('${DateFormat('MMM dd').format(start)} - ${DateFormat('MMM dd').format(end)}'),
                        trailing: Column(
                          mainAxisAlignment: MainAxisAlignment.center,
                          crossAxisAlignment: CrossAxisAlignment.end,
                          children: [
                            Text(
                              'TZS ${NumberFormat("#,##0").format(slip['net_pay'])}',
                              style: const TextStyle(fontWeight: FontWeight.bold, color: Colors.green),
                            ),
                            const Text('View PDF', style: TextStyle(fontSize: 10, color: Color(0xFF2563EB))),
                          ],
                        ),
                        onTap: () {
                          // TODO: Implement PDF viewer
                          ScaffoldMessenger.of(context).showSnackBar(
                            const SnackBar(content: Text('Downloading Payslip PDF...')),
                          );
                        },
                      ),
                    );
                  },
                ),
    );
  }

  Widget _buildEmptyState() {
    return const Center(
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          Icon(Icons.payment, size: 64, color: Colors.grey),
          SizedBox(height: 16),
          Text('No payslips found.', style: TextStyle(color: Colors.grey)),
        ],
      ),
    );
  }
}
