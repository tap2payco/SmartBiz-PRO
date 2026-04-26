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
        'is_synced': 0,
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
      backgroundColor: const Color(0xFFF8FAFC),
      appBar: AppBar(
        title: const Text('Point of Sale', style: TextStyle(fontWeight: FontWeight.w900, letterSpacing: -1)),
        centerTitle: false,
        backgroundColor: Colors.white,
        elevation: 0,
        foregroundColor: const Color(0xFF1E293B),
        actions: [
          if (_selectedCustomer != null)
            Padding(
              padding: const EdgeInsets.symmetric(vertical: 12),
              child: ActionChip(
                label: Text(_selectedCustomer!['full_name'] as String, style: const TextStyle(fontSize: 12, fontWeight: FontWeight.bold)),
                onPressed: _showCustomerSelector,
                backgroundColor: const Color(0xFF2563EB).withOpacity(0.08),
                side: BorderSide.none,
                shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(20)),
              ),
            ),
          IconButton(
            icon: Icon(_selectedCustomer != null ? Icons.person : Icons.person_add_outlined, color: const Color(0xFF2563EB)),
            onPressed: _showCustomerSelector,
          ),
          const SizedBox(width: 8),
        ],
      ),
      body: Column(
        children: [
          // Premium Search Bar
          Container(
            color: Colors.white,
            padding: const EdgeInsets.fromLTRB(20, 4, 20, 16),
            child: TextField(
              onChanged: (v) => setState(() => _search = v),
              decoration: InputDecoration(
                hintText: 'Search products by name or SKU...',
                hintStyle: TextStyle(color: Colors.grey.shade400, fontSize: 14),
                prefixIcon: const Icon(Icons.search, color: Colors.grey),
                filled: true,
                fillColor: const Color(0xFFF1F5F9),
                border: OutlineInputBorder(borderRadius: BorderRadius.circular(16), borderSide: BorderSide.none),
                contentPadding: const EdgeInsets.symmetric(vertical: 0),
                suffixIcon: Container(
                  margin: const EdgeInsets.all(6),
                  decoration: BoxDecoration(color: const Color(0xFF2563EB), borderRadius: BorderRadius.circular(12)),
                  child: IconButton(
                    icon: const Icon(Icons.qr_code_scanner, color: Colors.white, size: 20),
                    onPressed: _handleScan,
                    padding: EdgeInsets.zero,
                    constraints: const BoxConstraints(),
                  ),
                ),
              ),
            ),
          ),

          // Product list
          Expanded(
            child: _filteredItems.isEmpty
                ? Center(
                    child: Column(
                      mainAxisAlignment: MainAxisAlignment.center,
                      children: [
                        Icon(Icons.inventory_2_outlined, size: 64, color: Colors.grey.shade300),
                        const SizedBox(height: 16),
                        Text('No products available', style: TextStyle(color: Colors.grey.shade500, fontWeight: FontWeight.w500)),
                      ],
                    ),
                  )
                : ListView.builder(
                    padding: const EdgeInsets.fromLTRB(20, 16, 20, 100),
                    itemCount: _filteredItems.length,
                    itemBuilder: (_, i) {
                      final item = _filteredItems[i];
                      return Container(
                        margin: const EdgeInsets.only(bottom: 12),
                        decoration: BoxDecoration(
                          color: Colors.white,
                          borderRadius: BorderRadius.circular(20),
                          boxShadow: [BoxShadow(color: Colors.black.withOpacity(0.03), blurRadius: 10, offset: const Offset(0, 4))],
                        ),
                        child: ListTile(
                          contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
                          leading: Container(
                            width: 52,
                            height: 52,
                            decoration: BoxDecoration(color: const Color(0xFFF1F5F9), borderRadius: BorderRadius.circular(12)),
                            child: const Icon(Icons.shopping_bag_outlined, color: Color(0xFF64748B)),
                          ),
                          title: Text(item['name'] as String, style: const TextStyle(fontWeight: FontWeight.w700, color: Color(0xFF1E293B))),
                          subtitle: Padding(
                            padding: const EdgeInsets.only(top: 4),
                            child: Text('TZS ${_currencyFormat.format(item['selling_price'])}', style: const TextStyle(color: Color(0xFF2563EB), fontWeight: FontWeight.w800, fontSize: 15)),
                          ),
                          trailing: Container(
                            decoration: BoxDecoration(color: const Color(0xFF2563EB).withOpacity(0.1), borderRadius: BorderRadius.circular(12)),
                            child: IconButton(
                              icon: const Icon(Icons.add, color: Color(0xFF2563EB)),
                              onPressed: () => _addToCart(item),
                            ),
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
      padding: const EdgeInsets.fromLTRB(24, 16, 24, 32),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: const BorderRadius.vertical(top: Radius.circular(32)),
        boxShadow: [BoxShadow(color: Colors.black.withOpacity(0.12), blurRadius: 30, offset: const Offset(0, -8))],
      ),
      child: Column(
        children: [
          // Quotation toggle + Clear
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 4),
                decoration: BoxDecoration(color: const Color(0xFFF1F5F9), borderRadius: BorderRadius.circular(12)),
                child: Row(children: [
                  const Text('Quotation', style: TextStyle(color: Color(0xFF475569), fontSize: 13, fontWeight: FontWeight.w600)),
                  const SizedBox(width: 8),
                  SizedBox(
                    height: 24,
                    child: Switch.adaptive(
                      value: _isQuotation,
                      activeColor: const Color(0xFF2563EB),
                      onChanged: (v) => setState(() => _isQuotation = v),
                    ),
                  ),
                ]),
              ),
              TextButton.icon(
                onPressed: () => setState(() => _cart.clear()),
                icon: const Icon(Icons.delete_outline, size: 18),
                label: const Text('Clear Cart'),
                style: TextButton.styleFrom(foregroundColor: Colors.red.shade600),
              ),
            ],
          ),
          const SizedBox(height: 16),

          // Total + Checkout
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
                Text('PAYABLE TOTAL', style: TextStyle(color: Colors.grey.shade500, fontSize: 11, fontWeight: FontWeight.w900, letterSpacing: 1)),
                Text('TZS ${_currencyFormat.format(_total)}', style: const TextStyle(fontSize: 26, fontWeight: FontWeight.w900, color: Color(0xFF1E293B))),
              ]),
              const SizedBox(width: 16),
              Expanded(
                child: SizedBox(
                  height: 58,
                  child: ElevatedButton(
                    onPressed: _handleCheckout,
                    style: ElevatedButton.styleFrom(
                      backgroundColor: const Color(0xFF2563EB),
                      foregroundColor: Colors.white,
                      elevation: 0,
                      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(18)),
                      shadowColor: const Color(0xFF2563EB).withOpacity(0.4),
                    ),
                    child: Row(
                      mainAxisAlignment: MainAxisAlignment.center,
                      children: [
                        Text(_isQuotation ? 'CREATE QUOTE' : 'CHECKOUT', style: const TextStyle(fontWeight: FontWeight.w900, letterSpacing: 0.5)),
                        const SizedBox(width: 8),
                        const Icon(Icons.arrow_forward_rounded, size: 18),
                      ],
                    ),
                  ),
                ),
              ),
            ],
          ),
        ],
      ),
    );
  }
}
