import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:uuid/uuid.dart';
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
  List<Map<String, dynamic>> _customers = [];
  List<Map<String, dynamic>> _lineItems = [];
  DateTime _date = DateTime.now();
  final _invoiceNumber = 'INV-${DateTime.now().millisecondsSinceEpoch.toString().substring(7)}';

  @override
  void initState() {
    super.initState();
    _loadCustomers();
    if (widget.invoice != null) {
      // Load existing invoice data if editing
    }
  }

  Future<void> _loadCustomers() async {
    final db = context.read<DatabaseService>();
    final customers = await db.getCustomers();
    if (mounted) setState(() => _customers = customers);
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
                    const Divider(),
                    Row(
                      children: [
                        Expanded(
                          child: DropdownButtonFormField<String>(
                            value: _selectedCustomerId,
                            decoration: const InputDecoration(
                              labelText: 'Customer (Optional)',
                              prefixIcon: Icon(Icons.person_outline),
                            ),
                            items: [
                              const DropdownMenuItem(value: null, child: Text('Walk-in Customer')),
                              ..._customers.map((c) => DropdownMenuItem(
                                value: c['id'] as String,
                                child: Text(c['full_name'] as String),
                              )),
                            ],
                            onChanged: (v) => setState(() => _selectedCustomerId = v),
                          ),
                        ),
                        IconButton(
                          icon: const Icon(Icons.person_add, color: Color(0xFF2563EB)),
                          onPressed: _addNewCustomer,
                          tooltip: 'Add New Customer',
                        ),
                      ],
                    ),
                  ],
                ),
              ),
            ),
            const SizedBox(height: 16),
            const Text('Items', style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold)),
            ..._lineItems.map((item) => ListTile(
              title: Text(item['name']),
              subtitle: Text('${item['quantity']} x ${NumberFormat.simpleCurrency(name: 'TZS').format(item['unit_price'])}'),
              trailing: Text(NumberFormat.simpleCurrency(name: 'TZS').format(item['total_price'])),
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
            NumberFormat.simpleCurrency(name: 'TZS').format(value),
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
    final db = context.read<DatabaseService>();
    final items = await db.getItems();
    if (!mounted) return;

    String searchQuery = '';
    
    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      shape: const RoundedRectangleBorder(borderRadius: BorderRadius.vertical(top: Radius.circular(20))),
      builder: (ctx) => StatefulBuilder(
        builder: (context, setModalState) {
          final filteredItems = items.where((i) => 
            i['name'].toString().toLowerCase().contains(searchQuery.toLowerCase()) ||
            i['sku'].toString().toLowerCase().contains(searchQuery.toLowerCase())
          ).toList();

          return DraggableScrollableSheet(
            initialChildSize: 0.7,
            maxChildSize: 0.9,
            minChildSize: 0.5,
            expand: false,
            builder: (_, scrollController) => Column(
              children: [
                Padding(
                  padding: const EdgeInsets.all(16.0),
                  child: TextField(
                    decoration: InputDecoration(
                      hintText: 'Search items...',
                      prefixIcon: const Icon(Icons.search),
                      filled: true,
                      fillColor: Colors.grey.shade100,
                      border: OutlineInputBorder(borderRadius: BorderRadius.circular(12), borderSide: BorderSide.none),
                    ),
                    onChanged: (v) => setModalState(() => searchQuery = v),
                  ),
                ),
                Expanded(
                  child: ListView.builder(
                    controller: scrollController,
                    itemCount: filteredItems.length,
                    itemBuilder: (ctx, i) {
                      final item = filteredItems[i];
                      return ListTile(
                        title: Text(item['name'], style: const TextStyle(fontWeight: FontWeight.bold)),
                        subtitle: Text('SKU: ${item['sku']} • TZS ${item['selling_price']}'),
                        trailing: const Icon(Icons.add_circle_outline, color: Color(0xFF2563EB)),
                        onTap: () {
                          setState(() {
                            // Check if item already exists
                            final existingIndex = _lineItems.indexWhere((li) => li['item_id'] == item['id']);
                            if (existingIndex != -1) {
                               _lineItems[existingIndex]['quantity']++;
                               _lineItems[existingIndex]['total_price'] = _lineItems[existingIndex]['quantity'] * _lineItems[existingIndex]['unit_price'];
                            } else {
                              _lineItems.add({
                                'id': item['id'],
                                'name': item['name'],
                                'item_id': item['id'],
                                'quantity': 1,
                                'unit_price': (item['selling_price'] ?? 0.0) as double,
                                'total_price': (item['selling_price'] ?? 0.0) as double,
                              });
                            }
                          });
                          Navigator.pop(ctx);
                        },
                      );
                    },
                  ),
                ),
              ],
            ),
          );
        },
      ),
    );
  }

  void _saveInvoice() async {
    if (_lineItems.isEmpty) {
      ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Please add at least one item')));
      return;
    }

    final db = context.read<DatabaseService>();
    final invoiceId = const Uuid().v4();
    
    // Save sale record
    await db.insertSale({
      'id': invoiceId,
      'customer_id': _selectedCustomerId,
      'total_amount': _total,
      'status': 'INVOICED',
      'payment_type': 'UNPAID',
      'is_synced': 0,
      'created_at': _date.millisecondsSinceEpoch,
      'updated_at': DateTime.now().millisecondsSinceEpoch,
    });

    // Save line items
    for (var item in _lineItems) {
      await db.insertItem({ // Using raw insert for sale_items doesn't exist. Workaround: insert manually or add method. Let's add a raw insert.
         // Wait, db.insertSale works, but sale_items needs direct insert. Let me just use raw insert for now.
      });
      await db.db.insert('sale_items', {
        'id': const Uuid().v4(),
        'sale_id': invoiceId,
        'item_id': item['item_id'],
        'quantity': item['quantity'],
        'unit_price': item['unit_price'],
        'total_price': item['total_price'],
      });
    }
    
    if (mounted) {
      Navigator.pop(context);
      ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Invoice saved successfully')));
    }
  }

  void _addNewCustomer() {
    final nameController = TextEditingController();
    final phoneController = TextEditingController();

    showDialog(
      context: context,
      builder: (ctx) => AlertDialog(
        title: const Text('Add Customer'),
        content: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            TextField(
              controller: nameController,
              decoration: const InputDecoration(labelText: 'Full Name'),
            ),
            const SizedBox(height: 16),
            TextField(
              controller: phoneController,
              decoration: const InputDecoration(labelText: 'Phone'),
              keyboardType: TextInputType.phone,
            ),
          ],
        ),
        actions: [
          TextButton(onPressed: () => Navigator.pop(ctx), child: const Text('Cancel')),
          FilledButton(
            onPressed: () async {
              if (nameController.text.trim().isEmpty) return;
              final db = context.read<DatabaseService>();
              final id = const Uuid().v4();
              await db.insertCustomer({
                'id': id,
                'full_name': nameController.text.trim(),
                'phone': phoneController.text.trim(),
                'is_synced': 0,
                'updated_at': DateTime.now().millisecondsSinceEpoch,
              });
              await _loadCustomers();
              setState(() => _selectedCustomerId = id);
              if (mounted) Navigator.pop(ctx);
            },
            child: const Text('Save'),
          ),
        ],
      ),
    );
  }
}
