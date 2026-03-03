import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:intl/intl.dart';
import '../services/database_service.dart';
import 'record_payment_screen.dart';

class PaymentsReceivedListScreen extends StatefulWidget {
  const PaymentsReceivedListScreen({super.key});

  @override
  State<PaymentsReceivedListScreen> createState() => _PaymentsReceivedListScreenState();
}

class _PaymentsReceivedListScreenState extends State<PaymentsReceivedListScreen> {
  List<Map<String, dynamic>> _payments = [];
  bool _isLoading = true;

  @override
  void initState() {
    super.initState();
    _loadPayments();
  }

  Future<void> _loadPayments() async {
    setState(() => _isLoading = true);
    final db = Provider.of<DatabaseService>(context, listen: false);
    // Join with sales/customers to get info
    final data = await db.db.rawQuery('''
      SELECT p.*, s.customer_id, c.full_name as customer_name
      FROM invoice_payments p
      JOIN sales s ON p.invoice_id = s.id
      LEFT JOIN customers c ON s.customer_id = c.id
      ORDER BY p.created_at DESC
    ''');
    setState(() {
      _payments = data;
      _isLoading = false;
    });
  }

  @override
  Widget build(BuildContext context) {
    Widget body;
    if (_isLoading) {
      body = const Center(child: CircularProgressIndicator());
    } else if (_payments.isEmpty) {
      body = const Center(
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Icon(Icons.account_balance_wallet_outlined, size: 64, color: Colors.grey),
            SizedBox(height: 16),
            Text('No payments received.', style: TextStyle(color: Colors.grey, fontSize: 16)),
            SizedBox(height: 8),
            Text('Tap + to record a payment', style: TextStyle(color: Colors.grey)),
          ],
        ),
      );
    } else {
      body = RefreshIndicator(
        onRefresh: _loadPayments,
        child: ListView.separated(
          padding: const EdgeInsets.all(16),
          itemCount: _payments.length,
          separatorBuilder: (_, __) => const SizedBox(height: 12),
          itemBuilder: (context, index) {
            final payment = _payments[index];
            final date = DateTime.fromMillisecondsSinceEpoch(payment['created_at']);
            final amount = (payment['amount'] as num).toDouble();

            return Card(
              child: ListTile(
                leading: Container(
                  padding: const EdgeInsets.all(8),
                  decoration: BoxDecoration(
                    color: Colors.blue.withOpacity(0.1),
                    borderRadius: BorderRadius.circular(8),
                  ),
                  child: const Icon(Icons.arrow_downward, color: Colors.blue),
                ),
                title: Text(
                  'Payment - ${payment['customer_name'] ?? 'Cash Customer'}',
                  style: const TextStyle(fontWeight: FontWeight.bold),
                ),
                subtitle: Text(
                  DateFormat('MMM dd, yyyy').format(date),
                ),
                trailing: Text(
                  NumberFormat.currency(symbol: 'TZS ').format(amount),
                  style: const TextStyle(fontWeight: FontWeight.bold, color: Colors.blue),
                ),
              ),
            );
          },
        ),
      );
    }

    return Scaffold(
      body: body,
      floatingActionButton: FloatingActionButton.extended(
        onPressed: () {
          Navigator.push(
            context,
            MaterialPageRoute(builder: (_) => const RecordPaymentScreen()),
          ).then((_) => _loadPayments());
        },
        label: const Text('Add Payment'),
        icon: const Icon(Icons.add),
      ),
    );
  }
}
