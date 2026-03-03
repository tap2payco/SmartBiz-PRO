import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:intl/intl.dart';
import '../services/database_service.dart';
import '../services/document_service.dart';
import 'scanner_screen.dart';

class SalesScreen extends StatefulWidget {
  const SalesScreen({super.key});

  @override
  State<SalesScreen> createState() => _SalesScreenState();
}

class _SalesScreenState extends State<SalesScreen> {
  List<Map<String, dynamic>> _items = [];
  final List<Map<String, dynamic>> _cart = [];
  String _search = '';
  bool _isQuotation = false;
  String _paymentMethod = 'CASH';
  Map<String, dynamic>? _selectedCustomer;
  final _currencyFormat = NumberFormat('#,##0', 'en');

  @override
  void initState() {
    super.initState();
    _loadItems();
  }

  Future<void> _loadItems() async {
    final db = context.read<DatabaseService>();
    final items = await db.getItems();
    if (mounted) setState(() => _items = items);
  }

  void _addToCart(Map<String, dynamic> item) {
    setState(() {
      final idx = _cart.indexWhere((c) => c['id'] == item['id']);
      if (idx >= 0) {
        _cart[idx] = {..._cart[idx], 'quantity': (_cart[idx]['quantity'] as int) + 1};
      } else {
        _cart.add({...item, 'quantity': 1});
      }
    });
  }

  Future<void> _handleScan() async {
    final code = await Navigator.push<String>(
      context,
      MaterialPageRoute(builder: (_) => const ScannerScreen()),
    );
    if (code != null && mounted) {
      final db = context.read<DatabaseService>();
      final item = await db.getItemByBarcode(code);
      if (item != null) {
        _addToCart(item);
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('✅ Added: ${item['name']}'), backgroundColor: Colors.green.shade600),
        );
      } else {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('❌ No product found for barcode: $code'), backgroundColor: Colors.red.shade600),
        );
      }
    }
  }

  double get _total => _cart.fold(
      0.0, (sum, item) => sum + (item['selling_price'] as num) * (item['quantity'] as int));

  List<Map<String, dynamic>> get _filteredItems {
    if (_search.isEmpty) return _items;
    final q = _search.toLowerCase();
    return _items.where((i) =>
        (i['name'] as String).toLowerCase().contains(q) ||
        (i['sku'] as String? ?? '').toLowerCase().contains(q)).toList();
  }

  Future<void> _handleCheckout() async {
    if (_cart.isEmpty) return;
    final type = _isQuotation ? 'QUOTATION' : 'INVOICE';
    final customerName = _selectedCustomer?['full_name'] ?? 'Cash Customer';

    final confirmed = await showDialog<bool>(
      context: context,
      builder: (ctx) => AlertDialog(
        title: Text('Confirm $type?'),
        content: Text('Customer: $customerName\nTotal: TZS ${_currencyFormat.format(_total)}'),
        actions: [
          TextButton(onPressed: () => Navigator.pop(ctx, false), child: const Text('Cancel')),
          FilledButton(onPressed: () => Navigator.pop(ctx, true), child: const Text('Confirm')),
        ],
      ),
    );

    if (confirmed == true && mounted) {
      final db = context.read<DatabaseService>();
      final docService = context.read<DocumentService>();
      final saleId = DateTime.now().millisecondsSinceEpoch.toString();
      
      final saleData = {
        'id': saleId,
        'customer_id': _selectedCustomer?['id'],
        'customer_name': customerName,
        'total_amount': _total,
        'status': _isQuotation ? 'QUOTATION' : 'COMPLETED',
        'payment_type': _isQuotation ? 'N/A' : _paymentMethod,
        'created_at': DateTime.now().millisecondsSinceEpoch,
        'updated_at': DateTime.now().millisecondsSinceEpoch,
      };

      final success = await db.insertSale(saleData);

      if (success && mounted) {
        setState(() {
          _cart.clear();
          _isQuotation = false;
          _paymentMethod = 'CASH';
          _selectedCustomer = null;
        });

        showDialog(
          context: context,
          builder: (ctx) => AlertDialog(
            title: const Text('✅ Success'),
            content: Text('$type has been saved and recorded.'),
            actions: [
              TextButton(onPressed: () => Navigator.pop(ctx), child: const Text('Done')),
              FilledButton.icon(
                onPressed: () {
                  Navigator.pop(ctx);
                  docService.generateAndShareInvoice(saleData);
                },
                icon: const Icon(Icons.share),
                label: Text('Share $type'),
              ),
            ],
          ),
        );
      } else if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('❌ Failed to save transaction')),
        );
      }
    }
  }

  void _showCustomerSelector() async {
    final db = context.read<DatabaseService>();
    final customers = await db.getCustomers();

    if (!mounted) return;

    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(20)),
      ),
      builder: (ctx) => DraggableScrollableSheet(
        initialChildSize: 0.6,
        expand: false,
        builder: (_, scrollController) => Column(
          children: [
            const SizedBox(height: 12),
            Container(width: 40, height: 4, decoration: BoxDecoration(
                color: Colors.grey.shade300, borderRadius: BorderRadius.circular(2))),
            Padding(
              padding: const EdgeInsets.all(16),
              child: Text('Select Customer',
                  style: Theme.of(ctx).textTheme.titleLarge?.copyWith(fontWeight: FontWeight.bold)),
            ),
            Expanded(
              child: ListView.builder(
                controller: scrollController,
                itemCount: customers.length,
                itemBuilder: (_, i) => ListTile(
                  leading: CircleAvatar(
                    backgroundColor: const Color(0xFF2563EB).withOpacity(0.1),
                    child: Text((customers[i]['full_name'] as String)[0].toUpperCase(),
                        style: const TextStyle(color: Color(0xFF2563EB), fontWeight: FontWeight.bold)),
                  ),
                  title: Text(customers[i]['full_name'] as String),
                  subtitle: Text(customers[i]['phone'] as String? ?? 'No phone'),
                  onTap: () {
                    setState(() => _selectedCustomer = customers[i]);
                    Navigator.pop(ctx);
                  },
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Sales / POS'),
        centerTitle: false,
        actions: [
          if (_selectedCustomer != null)
            Chip(
              label: Text(_selectedCustomer!['full_name'] as String),
              onDeleted: () => setState(() => _selectedCustomer = null),
              deleteIconColor: Colors.red,
            ),
          IconButton(
            icon: Icon(_selectedCustomer != null ? Icons.person : Icons.person_add_outlined),
            onPressed: _showCustomerSelector,
          ),
        ],
      ),
      body: Column(
        children: [
          // Search bar
          Padding(
            padding: const EdgeInsets.fromLTRB(16, 8, 16, 8),
            child: TextField(
              onChanged: (v) => setState(() => _search = v),
              decoration: InputDecoration(
                hintText: 'Search products...',
                prefixIcon: const Icon(Icons.search),
                suffixIcon: IconButton(
                  icon: const Icon(Icons.qr_code_scanner, color: Color(0xFF2563EB)),
                  onPressed: _handleScan,
                  tooltip: 'Scan Barcode',
                ),
              ),
            ),
          ),

          // Product list
          Expanded(
            child: _filteredItems.isEmpty
                ? Center(child: Text('No products found', style: TextStyle(color: Colors.grey.shade400)))
                : ListView.builder(
                    padding: const EdgeInsets.symmetric(horizontal: 16),
                    itemCount: _filteredItems.length,
                    itemBuilder: (_, i) {
                      final item = _filteredItems[i];
                      return Card(
                        margin: const EdgeInsets.only(bottom: 8),
                        child: ListTile(
                          title: Text(item['name'] as String,
                              style: const TextStyle(fontWeight: FontWeight.w600)),
                          subtitle: Text('TZS ${_currencyFormat.format(item['selling_price'])}',
                              style: const TextStyle(color: Color(0xFF2563EB), fontWeight: FontWeight.w600)),
                          trailing: IconButton(
                            icon: const Icon(Icons.add_circle, color: Color(0xFF2563EB), size: 32),
                            onPressed: () => _addToCart(item),
                          ),
                        ),
                      );
                    },
                  ),
          ),

          // Cart Summary
          if (_cart.isNotEmpty) _buildCartSummary(),
        ],
      ),
    );
  }

  Widget _buildCartSummary() {
    return Container(
      padding: const EdgeInsets.fromLTRB(20, 16, 20, 24),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: const BorderRadius.vertical(top: Radius.circular(24)),
        boxShadow: [BoxShadow(color: Colors.black.withOpacity(0.08), blurRadius: 20, offset: const Offset(0, -4))],
      ),
      child: Column(
        children: [
          // Quotation toggle + Clear
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Row(children: [
                Text('Quotation', style: TextStyle(color: Colors.grey.shade700)),
                const SizedBox(width: 8),
                Switch.adaptive(
                  value: _isQuotation,
                  onChanged: (v) => setState(() => _isQuotation = v),
                ),
              ]),
              TextButton(
                onPressed: () => setState(() => _cart.clear()),
                child: const Text('Clear', style: TextStyle(color: Colors.red)),
              ),
            ],
          ),
          const SizedBox(height: 8),

          // Payment method selector (hidden for quotations)
          if (!_isQuotation)
            Row(
              children: [
                Text('Pay via:', style: TextStyle(color: Colors.grey.shade700, fontSize: 13)),
                const SizedBox(width: 8),
                Expanded(
                  child: SegmentedButton<String>(
                    segments: const [
                      ButtonSegment(value: 'CASH', label: Text('Cash', style: TextStyle(fontSize: 11))),
                      ButtonSegment(value: 'M-PESA', label: Text('M-Pesa', style: TextStyle(fontSize: 11))),
                      ButtonSegment(value: 'BANK', label: Text('Bank', style: TextStyle(fontSize: 11))),
                      ButtonSegment(value: 'CARD', label: Text('Card', style: TextStyle(fontSize: 11))),
                    ],
                    selected: {_paymentMethod},
                    onSelectionChanged: (v) => setState(() => _paymentMethod = v.first),
                    style: ButtonStyle(
                      visualDensity: VisualDensity.compact,
                      tapTargetSize: MaterialTapTargetSize.shrinkWrap,
                    ),
                  ),
                ),
              ],
            ),
          const SizedBox(height: 8),

          // Total + Checkout
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
                Text('Total (${_cart.length} items)',
                    style: TextStyle(color: Colors.grey.shade500, fontSize: 13)),
                Text('TZS ${_currencyFormat.format(_total)}',
                    style: const TextStyle(fontSize: 24, fontWeight: FontWeight.bold)),
              ]),
              SizedBox(
                height: 52,
                child: ElevatedButton(
                  onPressed: _handleCheckout,
                  child: Text(_isQuotation ? 'Create Quote' : 'Checkout'),
                ),
              ),
            ],
          ),
        ],
      ),
    );
  }
}
