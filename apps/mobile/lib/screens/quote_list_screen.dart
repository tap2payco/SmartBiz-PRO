import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:intl/intl.dart';
import '../services/database_service.dart';
import '../services/document_service.dart';
import 'quote_edit_screen.dart';

class QuoteListScreen extends StatefulWidget {
  const QuoteListScreen({super.key});

  @override
  State<QuoteListScreen> createState() => _QuoteListScreenState();
}

class _QuoteListScreenState extends State<QuoteListScreen> {
  List<Map<String, dynamic>> _quotes = [];
  bool _isLoading = true;

  @override
  void initState() {
    super.initState();
    _loadQuotes();
  }

  Future<void> _loadQuotes() async {
    setState(() => _isLoading = true);
    final db = Provider.of<DatabaseService>(context, listen: false);
    final data = await db.getQuotes();
    setState(() {
      _quotes = data;
      _isLoading = false;
    });
  }

  @override
  Widget build(BuildContext context) {
    Widget body;
    if (_isLoading) {
      body = const Center(child: CircularProgressIndicator());
    } else if (_quotes.isEmpty) {
      body = const Center(
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Icon(Icons.request_quote, size: 64, color: Colors.grey),
            SizedBox(height: 16),
            Text('No quotations found.', style: TextStyle(color: Colors.grey, fontSize: 16)),
            SizedBox(height: 8),
            Text('Tap + to create your first quote', style: TextStyle(color: Colors.grey)),
          ],
        ),
      );
    } else {
      body = RefreshIndicator(
        onRefresh: _loadQuotes,
        child: ListView.separated(
          padding: const EdgeInsets.all(16),
          itemCount: _quotes.length,
          separatorBuilder: (_, __) => const SizedBox(height: 12),
          itemBuilder: (context, index) {
            final quote = _quotes[index];
            final date = DateTime.fromMillisecondsSinceEpoch(quote['created_at'] as int);
            final total = (quote['total_amount'] as num).toDouble();

            return Card(
              child: ListTile(
                leading: Container(
                  padding: const EdgeInsets.all(8),
                  decoration: BoxDecoration(
                    color: Colors.orange.withOpacity(0.1),
                    borderRadius: BorderRadius.circular(8),
                  ),
                  child: const Icon(Icons.request_quote, color: Colors.orange),
                ),
                title: Text(
                  'QUO-${quote['id'].toString().substring(0, 8).toUpperCase()}',
                  style: const TextStyle(fontWeight: FontWeight.bold),
                ),
                subtitle: Text(
                  DateFormat('MMM dd, yyyy • HH:mm').format(date),
                ),
                trailing: Row(
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    Column(
                      mainAxisAlignment: MainAxisAlignment.center,
                      crossAxisAlignment: CrossAxisAlignment.end,
                      children: [
                        Text(
                          NumberFormat.currency(symbol: 'TZS ').format(total),
                          style: const TextStyle(
                            fontWeight: FontWeight.bold,
                            color: Colors.orange,
                          ),
                        ),
                        const Text(
                          'Draft',
                          style: TextStyle(color: Colors.grey, fontSize: 12, fontWeight: FontWeight.bold),
                        ),
                      ],
                    ),
                    PopupMenuButton<String>(
                      onSelected: (val) {
                        if (val == 'convert') _convertToInvoice(quote);
                      },
                      itemBuilder: (context) => [
                        const PopupMenuItem(value: 'convert', child: Text('Convert to Invoice')),
                        const PopupMenuItem(value: 'delete', child: Text('Delete')),
                      ],
                    ),
                  ],
                ),
                onTap: () async {
                  final docService = Provider.of<DocumentService>(context, listen: false);
                  ScaffoldMessenger.of(context).showSnackBar(
                    const SnackBar(content: Text('Generating Quotation PDF...')),
                  );
                  await docService.generateAndShareInvoice(quote);
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
            MaterialPageRoute(builder: (_) => const QuoteEditScreen()),
          ).then((_) => _loadQuotes());
        },
        label: const Text('Create Quote'),
        icon: const Icon(Icons.add),
      ),
    );
  }

  void _convertToInvoice(Map<String, dynamic> quote) async {
    final confirmed = await showDialog<bool>(
      context: context,
      builder: (ctx) => AlertDialog(
        title: const Text('Convert to Invoice?'),
        content: const Text('This will convert this quotation into an unpaid invoice.'),
        actions: [
          TextButton(onPressed: () => Navigator.pop(ctx, false), child: const Text('Cancel')),
          TextButton(onPressed: () => Navigator.pop(ctx, true), child: const Text('Convert')),
        ],
      ),
    );

    if (confirmed == true) {
      final db = Provider.of<DatabaseService>(context, listen: false);
      // Status update
      await db.db.update('sales', {
        'status': 'INVOICED',
        'updated_at': DateTime.now().millisecondsSinceEpoch
      }, where: 'id = ?', whereArgs: [quote['id']]);
      
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Successfully converted to Invoice')));
        _loadQuotes();
      }
    }
  }
}
