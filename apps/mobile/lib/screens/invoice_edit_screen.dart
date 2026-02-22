import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:intl/intl.dart';
import '../services/database_service.dart';
import 'scanner_screen.dart';

class InvoiceEditScreen extends StatefulWidget {
  final Map<String, dynamic>? invoice;
  const InvoiceEditScreen({super.key, this.invoice});

  @override
  State<InvoiceEditScreen> createState() => _InvoiceEditScreenState();
}

class _InvoiceEditScreenState extends State<InvoiceEditScreen> {
  final _formKey = GlobalKey<FormState>();
  String? _selectedCustomerId;
  List<Map<String, dynamic>> _lineItems = [];
  DateTime _date = DateTime.now();
  final _invoiceNumber = 'INV-${DateTime.now().millisecondsSinceEpoch.toString().substring(7)}';

  @override
  void initState() {
    super.initState();
    if (widget.invoice != null) {
      // Load existing invoice data if editing
    }
  }

  double get _subtotal => _lineItems.fold(0, (sum, item) => sum + (item['total_price'] as double));
  double get _tax => _subtotal * 0.18; // 18% VAT default
  double get _total => _subtotal + _tax;

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: Text(widget.invoice == null ? 'New Invoice' : 'Edit Invoice'),
        actions: [
          IconButton(
            icon: const Icon(Icons.check),
            onPressed: _saveInvoice,
          ),
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
                    Text('Invoice #: $_invoiceNumber', style: const TextStyle(fontWeight: FontWeight.bold)),
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
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceEvenly,
              children: [
                TextButton.icon(
                  onPressed: _addItem,
                  icon: const Icon(Icons.list),
                  label: const Text('Add from List'),
                ),
                TextButton.icon(
                  onPressed: _scanItem,
                  icon: const Icon(Icons.qr_code_scanner),
                  label: const Text('Scan Item'),
                ),
              ],
            ),
            const Divider(),
            _buildSummaryRow('Subtotal', _subtotal),
            _buildSummaryRow('Tax (18%)', _tax),
            _buildSummaryRow('Total', _total, isBold: true),
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

  void _scanItem() async {
    final code = await Navigator.push<String>(
      context,
      MaterialPageRoute(builder: (_) => const ScannerScreen()),
    );
    
    if (code != null && mounted) {
      final db = context.read<DatabaseService>();
      final items = await db.getItems();
      final item = items.firstWhere(
        (i) => i['sku'] == code,
        orElse: () => items.firstWhere(
          (i) => i['name'].toString().toLowerCase().contains(code.toLowerCase()),
          orElse: () => {},
        ),
      );

      if (item.isNotEmpty) {
        setState(() {
          _lineItems.add({
            'id': item['id'],
            'name': item['name'],
            'item_id': item['id'],
            'quantity': 1,
            'unit_price': item['selling_price'] as double,
            'total_price': item['selling_price'] as double,
          });
        });
        ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text('Added ${item['name']}')));
      } else {
        ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Item not found')));
      }
    }
  }

  void _addItem() async {
    // Show item selector dialog
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
                    'unit_price': items[i]['selling_price'] as double,
                    'total_price': items[i]['selling_price'] as double,
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

  void _saveInvoice() async {
    if (_lineItems.isEmpty) {
      ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Please add at least one item')));
      return;
    }

    final db = context.read<DatabaseService>();
    final invoiceId = DateTime.now().millisecondsSinceEpoch.toString();
    
    await db.insertSale({
      'id': invoiceId,
      'total_amount': _total,
      'status': 'INVOICED',
      'payment_type': 'UNPAID',
      'created_at': _date.millisecondsSinceEpoch,
      'updated_at': DateTime.now().millisecondsSinceEpoch,
    });

    // Save items logic would go here in DatabaseService
    
    if (mounted) {
      Navigator.pop(context);
      ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Invoice saved successfully')));
    }
  }
}
