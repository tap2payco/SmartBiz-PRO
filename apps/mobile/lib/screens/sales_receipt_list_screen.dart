import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:intl/intl.dart';
import '../services/database_service.dart';
import '../services/document_service.dart';

class SalesReceiptListScreen extends StatefulWidget {
  const SalesReceiptListScreen({super.key});

  @override
  State<SalesReceiptListScreen> createState() => _SalesReceiptListScreenState();
}

class _SalesReceiptListScreenState extends State<SalesReceiptListScreen> {
  List<Map<String, dynamic>> _receipts = [];
  bool _isLoading = true;

  @override
  void initState() {
    super.initState();
    _loadReceipts();
  }

  Future<void> _loadReceipts() async {
    setState(() => _isLoading = true);
    final db = Provider.of<DatabaseService>(context, listen: false);
    final data = await db.getSales(); // Reusing sales as receipts
    setState(() {
      _receipts = data;
      _isLoading = false;
    });
  }

  @override
  Widget build(BuildContext context) {
    Widget body;
    if (_isLoading) {
      body = const Center(child: CircularProgressIndicator());
    } else if (_receipts.isEmpty) {
      body = const Center(
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Icon(Icons.receipt_long, size: 64, color: Colors.grey),
            SizedBox(height: 16),
            Text('No receipts found.', style: TextStyle(color: Colors.grey, fontSize: 16)),
            SizedBox(height: 8),
            Text('Complete a sale in POS to generate a receipt', style: TextStyle(color: Colors.grey)),
          ],
        ),
      );
    } else {
      body = RefreshIndicator(
        onRefresh: _loadReceipts,
        child: ListView.separated(
          padding: const EdgeInsets.all(16),
          itemCount: _receipts.length,
          separatorBuilder: (_, __) => const SizedBox(height: 12),
          itemBuilder: (context, index) {
            final receipt = _receipts[index];
            final date = DateTime.fromMillisecondsSinceEpoch(receipt['created_at']);
            final total = (receipt['total_amount'] as num).toDouble();

            return Card(
              child: ListTile(
                leading: Container(
                  padding: const EdgeInsets.all(8),
                  decoration: BoxDecoration(
                    color: Colors.green.withOpacity(0.1),
                    borderRadius: BorderRadius.circular(8),
                  ),
                  child: const Icon(Icons.receipt_long, color: Colors.green),
                ),
                title: Text(
                  'REC-${receipt['id'].toString().substring(0, 8).toUpperCase()}',
                  style: const TextStyle(fontWeight: FontWeight.bold),
                ),
                subtitle: Text(
                  '${DateFormat('MMM dd, yyyy').format(date)} • ${receipt['payment_type']}',
                ),
                trailing: Text(
                  NumberFormat.currency(symbol: 'TZS ').format(total),
                  style: const TextStyle(fontWeight: FontWeight.bold, color: Colors.green),
                ),
                onTap: () async {
                  final docService = Provider.of<DocumentService>(context, listen: false);
                  ScaffoldMessenger.of(context).showSnackBar(
                    const SnackBar(content: Text('Generating Receipt PDF...')),
                  );
                  await docService.generateAndShareInvoice(receipt);
                },
              ),
            );
          },
        ),
      );
    }

    return Scaffold(
      body: body,
    );
  }
}
