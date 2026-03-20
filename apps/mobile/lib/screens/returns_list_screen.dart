import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:intl/intl.dart';
import '../services/database_service.dart';
import 'create_return_screen.dart';

class ReturnsListScreen extends StatefulWidget {
  const ReturnsListScreen({super.key});

  @override
  State<ReturnsListScreen> createState() => _ReturnsListScreenState();
}

class _ReturnsListScreenState extends State<ReturnsListScreen> {
  List<Map<String, dynamic>> _returns = [];
  bool _isLoading = true;

  @override
  void initState() {
    super.initState();
    _loadReturns();
  }

  Future<void> _loadReturns() async {
    setState(() => _isLoading = true);
    final db = Provider.of<DatabaseService>(context, listen: false);
    final data = await db.getReturns();
    setState(() {
      _returns = data;
      _isLoading = false;
    });
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      floatingActionButton: FloatingActionButton.extended(
        onPressed: () async {
          await Navigator.push(
            context,
            MaterialPageRoute(builder: (_) => const CreateReturnScreen()),
          );
          _loadReturns();
        },
        icon: const Icon(Icons.add),
        label: const Text('New Return'),
        backgroundColor: const Color(0xFF2563EB),
      ),
      body: _isLoading
          ? const Center(child: CircularProgressIndicator())
          : _returns.isEmpty
              ? _buildEmptyState()
              : RefreshIndicator(
                  onRefresh: _loadReturns,
                  child: ListView.separated(
                    padding: const EdgeInsets.all(16),
                    itemCount: _returns.length,
                    separatorBuilder: (_, __) => const SizedBox(height: 12),
                    itemBuilder: (context, index) {
                      final ret = _returns[index];
                      final date = DateTime.fromMillisecondsSinceEpoch(ret['created_at']);
                      final total = (ret['total_amount'] as num).toDouble();

                      return Card(
                        child: ListTile(
                          leading: Container(
                            padding: const EdgeInsets.all(8),
                            decoration: BoxDecoration(
                              color: Colors.red.shade50,
                              borderRadius: BorderRadius.circular(8),
                            ),
                            child: const Icon(Icons.assignment_return, color: Colors.red),
                          ),
                          title: Text(
                            'RET-${ret['id'].toString().substring(0, 8).toUpperCase()}',
                            style: const TextStyle(fontWeight: FontWeight.bold),
                          ),
                          subtitle: Text(
                            '${DateFormat('MMM dd, yyyy').format(date)}',
                          ),
                          trailing: Column(
                            mainAxisAlignment: MainAxisAlignment.center,
                            crossAxisAlignment: CrossAxisAlignment.end,
                            children: [
                              Text(
                                '- TZS ${NumberFormat("#,##0").format(total)}',
                                style: const TextStyle(fontWeight: FontWeight.bold, color: Colors.red),
                              ),
                              if (ret['is_synced'] == 0)
                                const Icon(Icons.sync_disabled, size: 14, color: Colors.orange),
                            ],
                          ),
                        ),
                      );
                    },
                  ),
                ),
    );
  }

  Widget _buildEmptyState() {
    return Center(
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          Icon(Icons.assignment_return_outlined, size: 80, color: Colors.grey.shade300),
          const SizedBox(height: 16),
          Text(
            'No returns recorded',
            style: TextStyle(fontSize: 18, color: Colors.grey.shade600, fontWeight: FontWeight.bold),
          ),
          const SizedBox(height: 8),
          const Text(
            'Keep track of customer refunds here',
            style: TextStyle(color: Colors.grey),
          ),
        ],
      ),
    );
  }
}
