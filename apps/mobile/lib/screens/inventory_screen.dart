import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:intl/intl.dart';
import '../services/database_service.dart';
import 'scanner_screen.dart';
import 'add_product_screen.dart';

class InventoryScreen extends StatefulWidget {
  const InventoryScreen({super.key});

  @override
  State<InventoryScreen> createState() => _InventoryScreenState();
}

class _InventoryScreenState extends State<InventoryScreen> {
  List<Map<String, dynamic>> _items = [];
  String _search = '';
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

  List<Map<String, dynamic>> get _filteredItems {
    if (_search.isEmpty) return _items;
    final q = _search.toLowerCase();
    return _items.where((i) =>
        (i['name'] as String).toLowerCase().contains(q) ||
        (i['sku'] as String? ?? '').toLowerCase().contains(q)).toList();
  }

  Future<void> _handleScan() async {
    final code = await Navigator.push<String>(
      context,
      MaterialPageRoute(builder: (_) => const ScannerScreen()),
    );
    if (code != null && mounted) {
      setState(() => _search = code);
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Inventory'),
        centerTitle: false,
        actions: [
          Padding(
            padding: const EdgeInsets.only(right: 16),
            child: Center(
              child: Text('${_items.length} items',
                  style: TextStyle(color: Colors.grey.shade500, fontSize: 13)),
            ),
          ),
        ],
      ),
      body: Column(
        children: [
          // Search
          Padding(
            padding: const EdgeInsets.fromLTRB(16, 8, 16, 8),
            child: TextField(
              onChanged: (v) => setState(() => _search = v),
              decoration: InputDecoration(
                hintText: 'Search inventory...',
                prefixIcon: const Icon(Icons.search),
                suffixIcon: IconButton(
                  icon: const Icon(Icons.qr_code_scanner, color: Color(0xFF2563EB)),
                  onPressed: _handleScan,
                  tooltip: 'Scan Barcode',
                ),
              ),
            ),
          ),

          // List
          Expanded(
            child: _filteredItems.isEmpty
                ? Center(child: Text('No items found', style: TextStyle(color: Colors.grey.shade400)))
                : RefreshIndicator(
                    onRefresh: _loadItems,
                    child: ListView.builder(
                      padding: const EdgeInsets.symmetric(horizontal: 16),
                      itemCount: _filteredItems.length,
                      itemBuilder: (_, i) {
                        final item = _filteredItems[i];
                        final stockLevel = item['stock_level'] as int? ?? 0;
                        final isLowStock = stockLevel <= 5 && stockLevel > 0;
                        final isOutOfStock = stockLevel <= 0;

                        return Card(
                          margin: const EdgeInsets.only(bottom: 8),
                          child: Padding(
                            padding: const EdgeInsets.all(16),
                            child: Row(
                              children: [
                                // Item info
                                Expanded(
                                  child: Column(
                                    crossAxisAlignment: CrossAxisAlignment.start,
                                    children: [
                                      Text(item['name'] as String,
                                          style: const TextStyle(fontWeight: FontWeight.w600, fontSize: 16)),
                                      const SizedBox(height: 4),
                                      Text('SKU: ${item['sku'] ?? 'N/A'}',
                                          style: TextStyle(color: Colors.grey.shade500, fontSize: 13)),
                                    ],
                                  ),
                                ),

                                // Price + Stock
                                Column(
                                  crossAxisAlignment: CrossAxisAlignment.end,
                                  children: [
                                    Text('KES ${_currencyFormat.format(item['selling_price'])}',
                                        style: const TextStyle(
                                            color: Color(0xFF2563EB), fontWeight: FontWeight.w600)),
                                    const SizedBox(height: 4),
                                    Container(
                                      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 2),
                                      decoration: BoxDecoration(
                                        color: isOutOfStock
                                            ? Colors.red.shade50
                                            : isLowStock
                                                ? Colors.orange.shade50
                                                : Colors.green.shade50,
                                        borderRadius: BorderRadius.circular(8),
                                      ),
                                      child: Text(
                                        'Qty: $stockLevel',
                                        style: TextStyle(
                                          fontWeight: FontWeight.w600,
                                          fontSize: 12,
                                          color: isOutOfStock
                                              ? Colors.red.shade700
                                              : isLowStock
                                                  ? Colors.orange.shade700
                                                  : Colors.green.shade700,
                                        ),
                                      ),
                                    ),
                                  ],
                                ),
                              ],
                            ),
                          ),
                        );
                      },
                    ),
                  ),
          ),
        ],
      ),
      floatingActionButton: FloatingActionButton.extended(
        onPressed: () {
          Navigator.push(
            context,
            MaterialPageRoute(builder: (_) => const AddProductScreen()),
          ).then((_) => _loadItems());
        },
        label: const Text('Add Item'),
        icon: const Icon(Icons.add),
      ),
    );
  }
}
