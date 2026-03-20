import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:intl/intl.dart';
import 'package:uuid/uuid.dart';
import '../services/database_service.dart';
import 'scanner_screen.dart';

class CreateReturnScreen extends StatefulWidget {
  const CreateReturnScreen({super.key});

  @override
  State<CreateReturnScreen> createState() => _CreateReturnScreenState();
}

class _CreateReturnScreenState extends State<CreateReturnScreen> {
  final _formKey = GlobalKey<FormState>();
  final _reasonController = TextEditingController();
  final _amountController = TextEditingController();
  
  Map<String, dynamic>? _selectedSale;
  List<Map<String, dynamic>> _saleItems = [];
  final List<Map<String, dynamic>> _returnedItems = [];
  bool _isLoading = false;

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Process Return'),
      ),
      body: Form(
        key: _formKey,
        child: ListView(
          padding: const EdgeInsets.all(16),
          children: [
            _buildSaleSelector(),
            if (_selectedSale != null) ...[
              const SizedBox(height: 24),
              const Text('Select Items to Return', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 16)),
              const SizedBox(height: 8),
              _buildItemsList(),
              const SizedBox(height: 24),
              TextFormField(
                controller: _amountController,
                decoration: const InputDecoration(
                  labelText: 'Refund Amount (TZS)',
                  border: OutlineInputBorder(),
                  prefixIcon: Icon(Icons.money),
                ),
                keyboardType: TextInputType.number,
                validator: (v) => (v == null || v.isEmpty) ? 'Required' : null,
              ),
              const SizedBox(height: 16),
              TextFormField(
                controller: _reasonController,
                decoration: const InputDecoration(
                  labelText: 'Reason for Return',
                  border: OutlineInputBorder(),
                  prefixIcon: Icon(Icons.help_outline),
                ),
                maxLines: 2,
              ),
              const SizedBox(height: 32),
              ElevatedButton(
                onPressed: _isLoading ? null : _saveReturn,
                style: ElevatedButton.styleFrom(
                  minimumSize: const Size.fromHeight(56),
                  backgroundColor: Colors.red,
                  foregroundColor: Colors.white,
                ),
                child: _isLoading 
                  ? const CircularProgressIndicator(color: Colors.white) 
                  : const Text('Confirm Return & Process Refund', style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold)),
              ),
            ],
          ],
        ),
      ),
    );
  }

  Widget _buildSaleSelector() {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        const Text('Original Invoice', style: TextStyle(fontWeight: FontWeight.bold)),
        const SizedBox(height: 8),
        Row(
          children: [
            Expanded(
              child: OutlinedButton.icon(
                onPressed: _selectSale,
                icon: const Icon(Icons.search),
                label: Text(_selectedSale == null 
                  ? 'Identify Sale/Invoice' 
                  : 'Invoice #INV-${_selectedSale!['id'].toString().substring(0, 8).toUpperCase()}'),
                style: OutlinedButton.styleFrom(
                  padding: const EdgeInsets.all(16),
                  alignment: Alignment.centerLeft,
                ),
              ),
            ),
            const SizedBox(width: 8),
            IconButton.filledTonal(
              onPressed: _scanSale,
              icon: const Icon(Icons.qr_code_scanner),
              tooltip: 'Scan QR',
            ),
          ],
        ),
      ],
    );
  }

  Widget _buildItemsList() {
    return Container(
      decoration: BoxDecoration(
        color: Colors.grey.shade50,
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: Colors.grey.shade200),
      ),
      child: Column(
        children: _saleItems.map((item) {
          final isReturned = _returnedItems.any((ri) => ri['item_id'] == item['item_id']);
          return CheckboxListTile(
            title: Text(item['name'] ?? 'Product'),
            subtitle: Text('Qty: ${item['quantity']} • TZS ${item['unit_price']}'),
            value: isReturned,
            onChanged: (val) {
              setState(() {
                if (val == true) {
                  _returnedItems.add(item);
                } else {
                  _returnedItems.removeWhere((ri) => ri['item_id'] == item['item_id']);
                }
                _calculateRefund();
              });
            },
          );
        }).toList(),
      ),
    );
  }

  void _calculateRefund() {
    double total = 0;
    for (var item in _returnedItems) {
      total += (item['total_price'] as num).toDouble();
    }
    _amountController.text = total.toStringAsFixed(0);
  }

  void _selectSale() async {
    final db = context.read<DatabaseService>();
    final sales = await db.getInvoices();
    
    if (!mounted) return;

    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      shape: const RoundedRectangleBorder(borderRadius: BorderRadius.vertical(top: Radius.circular(20))),
      builder: (ctx) => DraggableScrollableSheet(
        initialChildSize: 0.7,
        expand: false,
        builder: (_, controller) => ListView.builder(
          controller: controller,
          itemCount: sales.length,
          itemBuilder: (_, i) => ListTile(
            title: Text('Invoice #INV-${sales[i]['id'].toString().substring(0, 8).toUpperCase()}'),
            subtitle: Text('Date: ${DateFormat('MMM dd').format(DateTime.fromMillisecondsSinceEpoch(sales[i]['created_at']))} • Total: TZS ${sales[i]['total_amount']}'),
            onTap: () {
              _loadSaleDetails(sales[i]);
              Navigator.pop(ctx);
            },
          ),
        ),
      ),
    );
  }

  void _scanSale() async {
    final code = await Navigator.push<String>(context, MaterialPageRoute(builder: (_) => const ScannerScreen()));
    if (code != null && mounted) {
      final db = context.read<DatabaseService>();
      final sale = await db.getSaleById(code);
      if (sale != null) {
        _loadSaleDetails(sale);
      } else {
        ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Sale not found')));
      }
    }
  }

  void _loadSaleDetails(Map<String, dynamic> sale) async {
    final db = context.read<DatabaseService>();
    final items = await db.getSaleItems(sale['id']);
    
    // We need item names, so we might need to join or fetch names manually if not in sale_items
    // For now, I'll assume sale_items table might need names or I fetch them
    final products = await db.getItems();
    
    setState(() {
      _selectedSale = sale;
      _saleItems = items.map((si) {
        final prod = products.firstWhere((p) => p['id'] == si['item_id'], orElse: () => {});
        return {
          ...si,
          'name': prod['name'] ?? 'Unknown Product',
        };
      }).toList();
      _returnedItems.clear();
      _amountController.text = '0';
    });
  }

  void _saveReturn() async {
    if (_selectedSale == null || _returnedItems.isEmpty) {
      ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Please select items to return')));
      return;
    }

    setState(() => _isLoading = true);
    final db = context.read<DatabaseService>();
    final returnId = const Uuid().v4();
    final now = DateTime.now().millisecondsSinceEpoch;

    await db.insertSale({
      'id': returnId,
      'customer_id': _selectedSale!['customer_id'],
      'total_amount': double.parse(_amountController.text).abs() * -1, // Negative total
      'status': 'RETURNED',
      'is_synced': 0,
      'created_at': now,
      'updated_at': now,
    });

    for (var item in _returnedItems) {
      await db.db.insert('sale_items', {
        'id': const Uuid().v4(),
        'sale_id': returnId,
        'item_id': item['item_id'],
        'quantity': (item['quantity'] as num).toInt() * -1, // Negative qty
        'unit_price': (item['unit_price'] as num).toDouble(),
        'total_price': (item['total_price'] as num).toDouble() * -1,
      });
    }

    if (mounted) {
      Navigator.pop(context);
      ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Return processed successfully')));
    }
  }
}
