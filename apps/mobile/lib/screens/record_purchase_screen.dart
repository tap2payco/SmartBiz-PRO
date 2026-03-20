import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:uuid/uuid.dart';
import 'package:intl/intl.dart';
import '../services/database_service.dart';

class RecordPurchaseScreen extends StatefulWidget {
  const RecordPurchaseScreen({super.key});

  @override
  State<RecordPurchaseScreen> createState() => _RecordPurchaseScreenState();
}

class _RecordPurchaseScreenState extends State<RecordPurchaseScreen> {
  final _formKey = GlobalKey<FormState>();
  String? _selectedSupplierId;
  List<Map<String, dynamic>> _suppliers = [];
  List<Map<String, dynamic>> _items = [];
  final List<Map<String, dynamic>> _cart = [];
  bool _isLoading = true;

  @override
  void initState() {
    super.initState();
    _loadInitialData();
  }

  Future<void> _loadInitialData() async {
    final db = context.read<DatabaseService>();
    final sups = await db.query('suppliers', orderBy: 'full_name ASC');
    final prods = await db.query('items', where: 'is_active = 1', orderBy: 'name ASC');
    
    if (mounted) {
      setState(() {
        _suppliers = sups;
        _items = prods;
        _isLoading = false;
      });
    }
  }

  double get _totalAmount => _cart.fold(0, (sum, item) => sum + (item['total_price'] as double));

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('Record Purchase')),
      body: _isLoading 
        ? const Center(child: CircularProgressIndicator())
        : Form(
            key: _formKey,
            child: Column(
              children: [
                Expanded(
                  child: ListView(
                    padding: const EdgeInsets.all(20),
                    children: [
                      _buildSupplierDropdown(),
                      const SizedBox(height: 24),
                      const Text('Purchase Items', style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold)),
                      const SizedBox(height: 16),
                      ..._buildCartList(),
                      const SizedBox(height: 16),
                      _buildAddItemButton(),
                    ],
                  ),
                ),
                _buildSummaryBar(),
              ],
            ),
          ),
    );
  }

  Widget _buildSupplierDropdown() {
    return DropdownButtonFormField<String>(
      value: _selectedSupplierId,
      decoration: const InputDecoration(labelText: 'Select Supplier', border: OutlineInputBorder()),
      items: _suppliers.map((s) => DropdownMenuItem(value: s['id'] as String, child: Text(s['full_name']))).toList(),
      onChanged: (v) => setState(() => _selectedSupplierId = v),
      validator: (v) => v == null ? 'Please select a supplier' : null,
    );
  }

  List<Widget> _buildCartList() {
    if (_cart.isEmpty) {
      return [const Center(child: Text('No items added yet.', style: TextStyle(color: Colors.grey)))];
    }
    return _cart.asMap().entries.map((entry) {
      final index = entry.key;
      final item = entry.value;
      return Card(
        margin: const EdgeInsets.only(bottom: 8),
        child: ListTile(
          title: Text(item['name']),
          subtitle: Text('${item['quantity']} x ${NumberFormat("#,##0").format(item['unit_price'])}'),
          trailing: Row(
            mainAxisSize: MainAxisSize.min,
            children: [
              Text('TZS ${NumberFormat("#,##0").format(item['total_price'])}', style: const TextStyle(fontWeight: FontWeight.bold)),
              IconButton(icon: const Icon(Icons.remove_circle_outline, color: Colors.red), onPressed: () => setState(() => _cart.removeAt(index))),
            ],
          ),
        ),
      );
    }).toList();
  }

  Widget _buildAddItemButton() {
    return OutlinedButton.icon(
      onPressed: _showAddItemDialog,
      icon: const Icon(Icons.add_shopping_cart),
      label: const Text('Add Item to Purchase'),
      style: OutlinedButton.styleFrom(minimumSize: const Size.fromHeight(50)),
    );
  }

  void _showAddItemDialog() {
    String? selectedItemId;
    final qtyController = TextEditingController(text: '1');
    final costController = TextEditingController();

    showDialog(
      context: context,
      builder: (context) => StatefulBuilder(
        builder: (context, setDialogState) => AlertDialog(
          title: const Text('Add Product'),
          content: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              DropdownButtonFormField<String>(
                value: selectedItemId,
                decoration: const InputDecoration(labelText: 'Product'),
                items: _items.map((i) => DropdownMenuItem(value: i['id'] as String, child: Text(i['name']))).toList(),
                onChanged: (v) {
                  final item = _items.firstWhere((it) => it['id'] == v);
                  setDialogState(() {
                    selectedItemId = v;
                    costController.text = item['cost_price'].toString();
                  });
                },
              ),
              TextField(controller: qtyController, decoration: const InputDecoration(labelText: 'Quantity'), keyboardType: TextInputType.number),
              TextField(controller: costController, decoration: const InputDecoration(labelText: 'Unit Cost'), keyboardType: TextInputType.number),
            ],
          ),
          actions: [
            TextButton(onPressed: () => Navigator.pop(context), child: const Text('Cancel')),
            ElevatedButton(
              onPressed: () {
                if (selectedItemId == null) return;
                final item = _items.firstWhere((i) => i['id'] == selectedItemId);
                final qty = int.tryParse(qtyController.text) ?? 1;
                final cost = double.tryParse(costController.text) ?? 0.0;
                
                setState(() {
                  _cart.add({
                    'item_id': item['id'],
                    'name': item['name'],
                    'quantity': qty,
                    'unit_price': cost,
                    'total_price': qty * cost,
                  });
                });
                Navigator.pop(context);
              },
              child: const Text('Add'),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildSummaryBar() {
    return Container(
      padding: const EdgeInsets.all(20),
      decoration: BoxDecoration(
        color: Colors.white,
        boxShadow: [BoxShadow(color: Colors.black.withOpacity(0.05), blurRadius: 10, offset: const Offset(0, -4))],
      ),
      child: SafeArea(
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                const Text('Total Purchase:', style: TextStyle(fontSize: 16, color: Colors.grey)),
                Text('TZS ${NumberFormat("#,##0").format(_totalAmount)}', style: const TextStyle(fontSize: 20, fontWeight: FontWeight.bold, color: Colors.blue)),
              ],
            ),
            const SizedBox(height: 16),
            ElevatedButton(
              onPressed: (_cart.isEmpty || _selectedSupplierId == null) ? null : _savePurchase,
              style: ElevatedButton.styleFrom(
                minimumSize: const Size.fromHeight(56),
                backgroundColor: const Color(0xFF2563EB),
                foregroundColor: Colors.white,
              ),
              child: const Text('Complete Purchase', style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold)),
            ),
          ],
        ),
      ),
    );
  }

  void _savePurchase() async {
    final db = context.read<DatabaseService>();
    final purchaseId = const Uuid().v4();
    final now = DateTime.now().millisecondsSinceEpoch;

    try {
      await db.db.transaction((txn) async {
        // Save Purchase Head
        await txn.insert('purchases', {
          'id': purchaseId,
          'supplier_id': _selectedSupplierId,
          'total_amount': _totalAmount,
          'status': 'COMPLETED',
          'is_synced': 0,
          'created_at': now,
          'updated_at': now,
        });

        // Save Items
        for (final item in _cart) {
          await txn.insert('purchase_items', {
            'id': const Uuid().v4(),
            'purchase_id': purchaseId,
            'item_id': item['item_id'],
            'quantity': item['quantity'],
            'unit_price': item['unit_price'],
            'total_price': item['total_price'],
          });
          
          // Note: In a real app, we'd also trigger a local inventory update here
          // but we'll let sync handle it for consistency with current architecture
        }
      });

      if (mounted) {
        Navigator.pop(context);
        ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('✅ Purchase recorded successfully!')));
      }
    } catch (e) {
      if (mounted) ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text('❌ Error: $e')));
    }
  }
}
