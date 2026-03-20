import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:intl/intl.dart';
import '../services/database_service.dart';
import 'record_purchase_screen.dart';

class PurchasesListScreen extends StatefulWidget {
  const PurchasesListScreen({super.key});

  @override
  State<PurchasesListScreen> createState() => _PurchasesListScreenState();
}

class _PurchasesListScreenState extends State<PurchasesListScreen> {
  List<Map<String, dynamic>> _purchases = [];
  bool _isLoading = true;

  @override
  void initState() {
    super.initState();
    _loadPurchases();
  }

  Future<void> _loadPurchases() async {
    final db = context.read<DatabaseService>();
    final data = await db.query(
      'purchases', 
      orderBy: 'created_at DESC'
    );
    
    // Join with suppliers if possible (manually since we are in SQL)
    final List<Map<String, dynamic>> enriched = [];
    for (final p in data) {
      final sup = await db.query('suppliers', where: 'id = ?', whereArgs: [p['supplier_id']]);
      enriched.add({
        ...p,
        'supplier_name': sup.isNotEmpty ? sup.first['full_name'] : 'Unknown Supplier',
      });
    }

    if (mounted) {
      setState(() {
        _purchases = enriched;
        _isLoading = false;
      });
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: _isLoading
          ? const Center(child: CircularProgressIndicator())
          : _purchases.isEmpty
              ? _buildEmptyState()
              : RefreshIndicator(
                  onRefresh: _loadPurchases,
                  child: ListView.builder(
                    padding: const EdgeInsets.all(16),
                    itemCount: _purchases.length,
                    itemBuilder: (context, index) {
                      final pur = _purchases[index];
                      final date = DateTime.fromMillisecondsSinceEpoch(pur['created_at'] as int);
                      
                      return Card(
                        margin: const EdgeInsets.only(bottom: 12),
                        child: ListTile(
                          leading: const CircleAvatar(
                            backgroundColor: Color(0xFFF0FDF4),
                            child: Icon(Icons.shopping_cart_checkout, color: Colors.green),
                          ),
                          title: Text(pur['supplier_name'], style: const TextStyle(fontWeight: FontWeight.bold)),
                          subtitle: Text(DateFormat('MMM dd, yyyy HH:mm').format(date)),
                          trailing: Column(
                            mainAxisAlignment: MainAxisAlignment.center,
                            crossAxisAlignment: CrossAxisAlignment.end,
                            children: [
                              Text(
                                'TZS ${NumberFormat("#,##0").format(pur['total_amount'])}',
                                style: const TextStyle(fontWeight: FontWeight.bold, color: Colors.blue),
                              ),
                              if (pur['is_synced'] == 0)
                                const Text('Pending Sync', style: TextStyle(fontSize: 10, color: Colors.orange)),
                            ],
                          ),
                          onTap: () {
                            // TODO: Purchase details view
                          },
                        ),
                      );
                    },
                  ),
                ),
      floatingActionButton: FloatingActionButton(
        onPressed: () async {
          await Navigator.push(context, MaterialPageRoute(builder: (_) => const RecordPurchaseScreen()));
          _loadPurchases();
        },
        backgroundColor: const Color(0xFF2563EB),
        child: const Icon(Icons.add, color: Colors.white),
      ),
    );
  }

  Widget _buildEmptyState() {
    return Center(
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          Icon(Icons.inventory_2_outlined, size: 64, color: Colors.grey.shade300),
          const SizedBox(height: 16),
          const Text('No purchases recorded.', style: TextStyle(color: Colors.grey)),
        ],
      ),
    );
  }
}
