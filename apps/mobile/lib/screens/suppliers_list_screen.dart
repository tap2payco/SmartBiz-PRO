import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:uuid/uuid.dart';
import '../services/database_service.dart';

class SuppliersListScreen extends StatefulWidget {
  const SuppliersListScreen({super.key});

  @override
  State<SuppliersListScreen> createState() => _SuppliersListScreenState();
}

class _SuppliersListScreenState extends State<SuppliersListScreen> {
  List<Map<String, dynamic>> _suppliers = [];
  bool _isLoading = true;

  @override
  void initState() {
    super.initState();
    _loadSuppliers();
  }

  Future<void> _loadSuppliers() async {
    final db = context.read<DatabaseService>();
    final data = await db.query('suppliers', orderBy: 'full_name ASC');
    if (mounted) {
      setState(() {
        _suppliers = data;
        _isLoading = false;
      });
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: _isLoading
          ? const Center(child: CircularProgressIndicator())
          : _suppliers.isEmpty
              ? _buildEmptyState()
              : ListView.builder(
                  padding: const EdgeInsets.all(16),
                  itemCount: _suppliers.length,
                  itemBuilder: (context, index) {
                    final sup = _suppliers[index];
                    return Card(
                      margin: const EdgeInsets.only(bottom: 12),
                      child: ListTile(
                        leading: CircleAvatar(
                          backgroundColor: Colors.blue.shade50,
                          child: Text(sup['full_name'][0].toUpperCase(), style: const TextStyle(color: Colors.blue)),
                        ),
                        title: Text(sup['full_name'], style: const TextStyle(fontWeight: FontWeight.bold)),
                        subtitle: Text(sup['phone'] ?? sup['email'] ?? 'No contact info'),
                        trailing: sup['is_synced'] == 0 
                          ? const Icon(Icons.sync_problem, color: Colors.orange, size: 16) 
                          : const Icon(Icons.check_circle, color: Colors.green, size: 16),
                        onTap: () {
                          // TODO: Supplier details
                        },
                      ),
                    );
                  },
                ),
      floatingActionButton: FloatingActionButton(
        onPressed: _showAddSupplierDialog,
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
          Icon(Icons.handshake_outlined, size: 64, color: Colors.grey.shade300),
          const SizedBox(height: 16),
          const Text('No suppliers found.', style: TextStyle(color: Colors.grey)),
          const SizedBox(height: 24),
          ElevatedButton(onPressed: _showAddSupplierDialog, child: const Text('Add Your First Supplier')),
        ],
      ),
    );
  }

  void _showAddSupplierDialog() {
    final nameController = TextEditingController();
    final phoneController = TextEditingController();
    final emailController = TextEditingController();

    showDialog(
      context: context,
      builder: (context) => AlertDialog(
        title: const Text('Add Supplier'),
        content: SingleChildScrollView(
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              TextField(controller: nameController, decoration: const InputDecoration(labelText: 'Full Name')),
              TextField(controller: phoneController, decoration: const InputDecoration(labelText: 'Phone'), keyboardType: TextInputType.phone),
              TextField(controller: emailController, decoration: const InputDecoration(labelText: 'Email'), keyboardType: TextInputType.emailAddress),
            ],
          ),
        ),
        actions: [
          TextButton(onPressed: () => Navigator.pop(context), child: const Text('Cancel')),
          ElevatedButton(
            onPressed: () async {
              if (nameController.text.isEmpty) return;
              final db = context.read<DatabaseService>();
              await db.db.insert('suppliers', {
                'id': const Uuid().v4(),
                'full_name': nameController.text,
                'phone': phoneController.text,
                'email': emailController.text,
                'is_synced': 0,
                'updated_at': DateTime.now().millisecondsSinceEpoch,
              });
              Navigator.pop(context);
              _loadSuppliers();
            },
            child: const Text('Save'),
          ),
        ],
      ),
    );
  }
}
