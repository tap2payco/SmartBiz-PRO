import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:intl/intl.dart';
import '../services/database_service.dart';
import '../services/document_service.dart';
import 'invoice_edit_screen.dart';

class InvoiceListScreen extends StatefulWidget {
  const InvoiceListScreen({super.key});

  @override
  State<InvoiceListScreen> createState() => _InvoiceListScreenState();
}

class _InvoiceListScreenState extends State<InvoiceListScreen> {
  List<Map<String, dynamic>> _invoices = [];
  bool _isLoading = true;

  @override
  void initState() {
    super.initState();
    _loadInvoices();
  }

  Future<void> _loadInvoices() async {
    setState(() => _isLoading = true);
    final db = Provider.of<DatabaseService>(context, listen: false);
    final data = await db.getInvoices();
    setState(() {
      _invoices = data;
      _isLoading = false;
    });
  }

  @override
  Widget build(BuildContext context) {
    Widget body;
    if (_isLoading) {
      body = const Center(child: CircularProgressIndicator());
    } else if (_invoices.isEmpty) {
      body = const Center(
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Icon(Icons.receipt_long, size: 64, color: Colors.grey),
            SizedBox(height: 16),
            Text('No invoices found.', style: TextStyle(color: Colors.grey, fontSize: 16)),
            SizedBox(height: 8),
            Text('Tap + to create your first invoice', style: TextStyle(color: Colors.grey)),
          ],
        ),
      );
    } else {
      body = RefreshIndicator(
        onRefresh: _loadInvoices,
        child: ListView.separated(
          padding: const EdgeInsets.all(16),
          itemCount: _invoices.length,
          separatorBuilder: (_, __) => const SizedBox(height: 12),
          itemBuilder: (context, index) {
            final invoice = _invoices[index];
            final date = DateTime.fromMillisecondsSinceEpoch(invoice['created_at']);
            final total = (invoice['total_amount'] as num).toDouble();

            return Card(
              child: ListTile(
                leading: Container(
                  padding: const EdgeInsets.all(8),
                  decoration: BoxDecoration(
                    color: Theme.of(context).colorScheme.primary.withOpacity(0.1),
                    borderRadius: BorderRadius.circular(8),
                  ),
                  child: Icon(Icons.description, color: Theme.of(context).colorScheme.primary),
                ),
                title: Text(
                  'INV-${invoice['id'].toString().substring(0, 8).toUpperCase()}',
                  style: const TextStyle(fontWeight: FontWeight.bold),
                ),
                subtitle: Text(
                  '${DateFormat('MMM dd, yyyy • HH:mm').format(date)} • ${invoice['payment_type']}',
                ),
                trailing: Column(
                  mainAxisAlignment: MainAxisAlignment.center,
                  crossAxisAlignment: CrossAxisAlignment.end,
                  children: [
                    Text(
                      NumberFormat.currency(symbol: 'TZS ').format(total),
                      style: TextStyle(
                        fontWeight: FontWeight.bold,
                        color: Theme.of(context).colorScheme.primary,
                      ),
                    ),
                    Text(
                      invoice['status'] == 'PAID' ? 'Paid' : 'Unpaid',
                      style: TextStyle(
                        color: invoice['status'] == 'PAID' ? Colors.green : Colors.orange,
                        fontSize: 12,
                        fontWeight: FontWeight.bold,
                      ),
                    ),
                  ],
                ),
                onTap: () async {
                  final docService = Provider.of<DocumentService>(context, listen: false);
                  ScaffoldMessenger.of(context).showSnackBar(
                    const SnackBar(content: Text('Generating Invoice PDF...')),
                  );
                  await docService.generateAndShareInvoice(invoice);
                },
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
            MaterialPageRoute(builder: (_) => const InvoiceEditScreen()),
          ).then((_) => _loadInvoices());
        },
        label: const Text('Create Invoice'),
        icon: const Icon(Icons.add),
      ),
    );
  }
}
