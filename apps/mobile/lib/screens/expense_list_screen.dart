import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:intl/intl.dart';
import '../services/database_service.dart';
import 'expense_edit_screen.dart';

class ExpenseListScreen extends StatefulWidget {
  const ExpenseListScreen({super.key});

  @override
  State<ExpenseListScreen> createState() => _ExpenseListScreenState();
}

class _ExpenseListScreenState extends State<ExpenseListScreen> {
  List<Map<String, dynamic>> _expenses = [];
  bool _isLoading = true;

  @override
  void initState() {
    super.initState();
    _loadExpenses();
  }

  Future<void> _loadExpenses() async {
    setState(() => _isLoading = true);
    final db = Provider.of<DatabaseService>(context, listen: false);
    final data = await db.getExpenses();
    setState(() {
      _expenses = data;
      _isLoading = false;
    });
  }

  @override
  Widget build(BuildContext context) {
    Widget body;
    if (_isLoading) {
      body = const Center(child: CircularProgressIndicator());
    } else if (_expenses.isEmpty) {
      body = const Center(
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Icon(Icons.money_off, size: 64, color: Colors.grey),
            SizedBox(height: 16),
            Text('No expenses recorded.', style: TextStyle(color: Colors.grey, fontSize: 16)),
            SizedBox(height: 8),
            Text('Tap + to add your first expense', style: TextStyle(color: Colors.grey)),
          ],
        ),
      );
    } else {
      body = RefreshIndicator(
        onRefresh: _loadExpenses,
        child: ListView.separated(
          padding: const EdgeInsets.all(16),
          itemCount: _expenses.length,
          separatorBuilder: (_, __) => const SizedBox(height: 12),
          itemBuilder: (context, index) {
            final expense = _expenses[index];
            final date = DateTime.fromMillisecondsSinceEpoch(expense['date'] ?? expense['created_at'] ?? 0);
            final amount = (expense['amount'] as num).toDouble();

            return Card(
              child: ListTile(
                leading: Container(
                  padding: const EdgeInsets.all(8),
                  decoration: BoxDecoration(
                    color: Colors.red.withOpacity(0.1),
                    borderRadius: BorderRadius.circular(8),
                  ),
                  child: const Icon(Icons.receipt, color: Colors.red),
                ),
                title: Text(
                  expense['description'] ?? 'General Expense',
                  style: const TextStyle(fontWeight: FontWeight.bold),
                ),
                subtitle: Text(
                  DateFormat('MMM dd, yyyy').format(date),
                ),
                trailing: Text(
                  NumberFormat.currency(symbol: 'TZS ').format(amount),
                  style: const TextStyle(fontWeight: FontWeight.bold, color: Colors.red),
                ),
              ),
            );
          },
        ),
      );
    }

    return Scaffold(
      body: body,
      floatingActionButton: FloatingActionButton(
        onPressed: () {
          Navigator.push(
            context,
            MaterialPageRoute(builder: (_) => const ExpenseEditScreen()),
          ).then((_) => _loadExpenses());
        },
        child: const Icon(Icons.add),
      ),
    );
  }
}
