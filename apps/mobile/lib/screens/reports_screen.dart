import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:intl/intl.dart';
import '../services/database_service.dart';

class ReportsScreen extends StatefulWidget {
  const ReportsScreen({super.key});

  @override
  State<ReportsScreen> createState() => _ReportsScreenState();
}

class _ReportsScreenState extends State<ReportsScreen> {
  bool _isLoading = true;
  double _totalSales = 0;
  double _totalExpenses = 0;
  int _orderCount = 0;

  @override
  void initState() {
    super.initState();
    _loadData();
  }

  Future<void> _loadData() async {
    setState(() => _isLoading = true);
    final db = Provider.of<DatabaseService>(context, listen: false);
    
    // Aggregation logic
    final salesRes = await db.db.rawQuery("SELECT SUM(total_amount) as total, COUNT(*) as count FROM sales WHERE status = 'PAID' OR status = 'COMPLETED'");
    final expensesRes = await db.db.rawQuery("SELECT SUM(amount) as total FROM expenses");

    setState(() {
      _totalSales = (salesRes.first['total'] ?? 0.0) as double;
      _orderCount = (salesRes.first['count'] ?? 0) as int;
      _totalExpenses = (expensesRes.first['total'] ?? 0.0) as double;
      _isLoading = false;
    });
  }

  @override
  Widget build(BuildContext context) {
    if (_isLoading) return const Center(child: CircularProgressIndicator());

    final netProfit = _totalSales - _totalExpenses;

    return Scaffold(
      body: RefreshIndicator(
        onRefresh: _loadData,
        child: ListView(
          padding: const EdgeInsets.all(16),
          children: [
            _buildReportCard('Total Revenue', _totalSales, Icons.trending_up, Colors.green),
            const SizedBox(height: 12),
            _buildReportCard('Total Expenses', _totalExpenses, Icons.trending_down, Colors.red),
            const SizedBox(height: 12),
            _buildReportCard('Net Income', netProfit, Icons.account_balance_wallet, Colors.blue),
            const SizedBox(height: 24),
            const Text('Tax Summary (18% VAT)', style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold)),
            const SizedBox(height: 8),
            Card(
              child: ListTile(
                title: const Text('Output VAT'),
                subtitle: const Text('Estimated from sales'),
                trailing: Text(NumberFormat.simpleCurrency(name: 'TZS').format(_totalSales * 0.18 / 1.18)),
              ),
            ),
            const SizedBox(height: 24),
            const Text('Inventory Insights', style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold)),
            const SizedBox(height: 8),
            _buildInsightTile('Orders Fulfilled', '$_orderCount', Icons.shopping_cart),
          ],
        ),
      ),
    );
  }

  Widget _buildReportCard(String title, double value, IconData icon, Color color) {
    return Card(
      elevation: 0,
      color: color.withOpacity(0.05),
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16), side: BorderSide(color: color.withOpacity(0.1))),
      child: Padding(
        padding: const EdgeInsets.all(20),
        child: Row(
          children: [
            Container(
              padding: const EdgeInsets.all(12),
              decoration: BoxDecoration(color: color.withOpacity(0.1), borderRadius: BorderRadius.circular(12)),
              child: Icon(icon, color: color),
            ),
            const SizedBox(width: 20),
            Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(title, style: TextStyle(color: Colors.grey.shade700, fontSize: 14)),
                Text(NumberFormat.simpleCurrency(name: 'TZS').format(value), style: const TextStyle(fontSize: 22, fontWeight: FontWeight.bold)),
              ],
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildInsightTile(String title, String value, IconData icon) {
    return Card(
      child: ListTile(
        leading: Icon(icon),
        title: Text(title),
        trailing: Text(value, style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 16)),
      ),
    );
  }
}
