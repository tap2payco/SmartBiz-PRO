import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:intl/intl.dart';
import '../services/database_service.dart';

class QuoteEditScreen extends StatefulWidget {
  final Map<String, dynamic>? quote;
  const QuoteEditScreen({super.key, this.quote});

  @override
  State<QuoteEditScreen> createState() => _QuoteEditScreenState();
}

class _QuoteEditScreenState extends State<QuoteEditScreen> {
  final _formKey = GlobalKey<FormState>();
  String? _selectedCustomerId;
  List<Map<String, dynamic>> _lineItems = [];
  DateTime _date = DateTime.now();
  final _quoteNumber = 'QUO-${DateTime.now().millisecondsSinceEpoch.toString().substring(7)}';

  @override
  void initState() {
    super.initState();
  }

  double get _subtotal => _lineItems.fold(0, (sum, item) => sum + (item['total_price'] as double));
  double get _tax => _subtotal * 0.0; // Quotes usually show net or handle tax later, let's keep it simple
  double get _total => _subtotal + _tax;

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: Text(widget.quote == null ? 'New Quotation' : 'Edit Quotation'),
        actions: [
          IconButton(icon: const Icon(Icons.check), onPressed: _saveQuote),
        ],
      ),
      body: Form(
        key: _formKey,
        child: ListView(
          padding: const EdgeInsets.all(16),
          children: [
             Card(
              child: Padding(
                padding: const EdgeInsets.all(16),
                child: Column(
                  children: [
                    Text('Quote #: $_quoteNumber', style: const TextStyle(fontWeight: FontWeight.bold)),
                    const Divider(),
                    ListTile(
                      title: const Text('Date'),
                      subtitle: Text(DateFormat('yyyy-MM-dd').format(_date)),
                      trailing: const Icon(Icons.calendar_today),
                      onTap: () async {
                        final picked = await showDatePicker(
                          context: context,
                          initialDate: _date,
                          firstDate: DateTime(2000),
                          lastDate: DateTime(2100),
                        );
                        if (picked != null) setState(() => _date = picked);
                      },
                    ),
                  ],
                ),
              ),
            ),
            const SizedBox(height: 16),
            const Text('Items', style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold)),
            ..._lineItems.map((item) => ListTile(
              title: Text(item['name']),
              subtitle: Text('${item['quantity']} x ${NumberFormat.simpleCurrency(name: 'KES').format(item['unit_price'])}'),
              trailing: Text(NumberFormat.simpleCurrency(name: 'KES').format(item['total_price'])),
              onLongPress: () => setState(() => _lineItems.remove(item)),
            )),
            TextButton.icon(
              onPressed: _addItem,
              icon: const Icon(Icons.add),
              label: const Text('Add Item'),
            ),
            const Divider(),
            _buildSummaryRow('Total Estimate', _total, isBold: true),
          ],
        ),
      ),
    );
  }

  Widget _buildSummaryRow(String label, double value, {bool isBold = false}) {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 4),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.spaceBetween,
        children: [
          Text(label, style: TextStyle(fontWeight: isBold ? FontWeight.bold : FontWeight.normal)),
          Text(
            NumberFormat.simpleCurrency(name: 'KES').format(value),
            style: TextStyle(fontWeight: isBold ? FontWeight.bold : FontWeight.normal),
          ),
        ],
      ),
    );
  }

  void _addItem() async {
    final db = context.read<DatabaseService>();
    final items = await db.getItems();
    if (!mounted) return;

    showDialog(
      context: context,
      builder: (ctx) => AlertDialog(
        title: const Text('Select Item'),
        content: SizedBox(
          width: double.maxFinite,
          child: ListView.builder(
            shrinkWrap: true,
            itemCount: items.length,
            itemBuilder: (_, i) => ListTile(
              title: Text(items[i]['name']),
              subtitle: Text('KES ${items[i]['selling_price']}'),
              onTap: () {
                setState(() {
                  _lineItems.add({
                    'id': items[i]['id'],
                    'name': items[i]['name'],
                    'item_id': items[i]['id'],
                    'quantity': 1,
                    'unit_price': (items[i]['selling_price'] ?? 0.0) as double,
                    'total_price': (items[i]['selling_price'] ?? 0.0) as double,
                  });
                });
                Navigator.pop(ctx);
              },
            ),
          ),
        ),
      ),
    );
  }

  void _saveQuote() async {
    if (_lineItems.isEmpty) {
      ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Please add at least one item')));
      return;
    }

    final db = context.read<DatabaseService>();
    await db.insertSale({
      'id': DateTime.now().millisecondsSinceEpoch.toString(),
      'total_amount': _total,
      'status': 'QUOTATION',
      'payment_type': 'N/A',
      'created_at': _date.millisecondsSinceEpoch,
      'updated_at': DateTime.now().millisecondsSinceEpoch,
    });

    if (mounted) {
      Navigator.pop(context);
      ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Quotation saved locally')));
    }
  }
}
