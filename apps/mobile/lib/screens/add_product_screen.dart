import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:uuid/uuid.dart';
import 'dart:math' as math;
import '../services/database_service.dart';

class AddProductScreen extends StatefulWidget {
  const AddProductScreen({super.key});

  @override
  State<AddProductScreen> createState() => _AddProductScreenState();
}

class _AddProductScreenState extends State<AddProductScreen> {
  final _formKey = GlobalKey<FormState>();
  final _nameController = TextEditingController();
  final _skuController = TextEditingController();
  final _priceController = TextEditingController();
  final _costController = TextEditingController();
  final _stockController = TextEditingController();
  String _selectedCategory = 'General';
  bool _isLoading = false;

  final List<String> _categories = ['General', 'Electronics', 'Groceries', 'Clothing', 'Services'];

  Future<void> _handleSave() async {
    if (!_formKey.currentState!.validate()) return;

    setState(() => _isLoading = true);
    final db = Provider.of<DatabaseService>(context, listen: false);

    try {
      final String id = const Uuid().v4();
      final success = await db.insertItem({
        'id': id,
        'name': _nameController.text,
        'sku': _skuController.text,
        'barcode': _skuController.text, // Using SKU as barcode if provided
        'category_id': 'default', 
        'selling_price': double.tryParse(_priceController.text) ?? 0.0,
        'cost_price': double.tryParse(_costController.text) ?? 0.0,
        'stock_level': int.tryParse(_stockController.text) ?? 0,
        'is_synced': 0,
        'updated_at': DateTime.now().millisecondsSinceEpoch,
      });

      if (mounted) {
        if (success) {
          ScaffoldMessenger.of(context).showSnackBar(
            const SnackBar(content: Text('Product added successfully!')),
          );
          Navigator.pop(context, true); // Pop out when added successfully
        } else {
          ScaffoldMessenger.of(context).showSnackBar(
            const SnackBar(content: Text('Failed to add product.')),
          );
        }
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Error: $e')),
        );
      }
    } finally {
      if (mounted) setState(() => _isLoading = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Add New Product'),
      ),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(16),
        child: Form(
          key: _formKey,
          child: Column(
            children: [
              Card(
                child: Padding(
                  padding: const EdgeInsets.all(16),
                  child: Column(
                    children: [
                      TextFormField(
                        controller: _nameController,
                        decoration: const InputDecoration(
                          labelText: 'Product Name',
                          prefixIcon: Icon(Icons.shopping_bag_outlined),
                        ),
                        validator: (v) => v!.isEmpty ? 'Required' : null,
                      ),
                      const SizedBox(height: 16),
                      TextFormField(
                        controller: _skuController,
                        decoration: InputDecoration(
                          labelText: 'SKU / Barcode',
                          prefixIcon: const Icon(Icons.qr_code_scanner),
                          suffixIcon: IconButton(
                            icon: const Icon(Icons.auto_fix_high, color: Color(0xFF2563EB)),
                            tooltip: 'Generate Barcode',
                            onPressed: () {
                              final random = math.Random();
                              final code = List.generate(12, (_) => random.nextInt(10)).join();
                              _skuController.text = code;
                            },
                          ),
                        ),
                      ),
                      const SizedBox(height: 16),
                      DropdownButtonFormField<String>(
                        value: _selectedCategory,
                        decoration: const InputDecoration(
                          labelText: 'Category',
                          prefixIcon: Icon(Icons.category_outlined),
                        ),
                        items: _categories.map((c) => DropdownMenuItem(value: c, child: Text(c))).toList(),
                        onChanged: (v) => setState(() => _selectedCategory = v!),
                      ),
                    ],
                  ),
                ),
              ),
              const SizedBox(height: 16),
              Card(
                child: Padding(
                  padding: const EdgeInsets.all(16),
                  child: Column(
                    children: [
                      Row(
                        children: [
                          Expanded(
                            child: TextFormField(
                              controller: _priceController,
                              decoration: const InputDecoration(
                                labelText: 'Selling Price',
                                prefixIcon: Icon(Icons.sell_outlined),
                              ),
                              keyboardType: TextInputType.number,
                              validator: (v) => v!.isEmpty ? 'Required' : null,
                            ),
                          ),
                          const SizedBox(width: 16),
                          Expanded(
                            child: TextFormField(
                              controller: _costController,
                              decoration: const InputDecoration(
                                labelText: 'Cost Price',
                                prefixIcon: Icon(Icons.payments_outlined),
                              ),
                              keyboardType: TextInputType.number,
                            ),
                          ),
                        ],
                      ),
                      const SizedBox(height: 16),
                      TextFormField(
                        controller: _stockController,
                        decoration: const InputDecoration(
                          labelText: 'Initial Stock Level',
                          prefixIcon: Icon(Icons.inventory_outlined),
                        ),
                        keyboardType: TextInputType.number,
                        validator: (v) => v!.isEmpty ? 'Required' : null,
                      ),
                    ],
                  ),
                ),
              ),
              const SizedBox(height: 24),
              SizedBox(
                width: double.infinity,
                height: 54,
                child: ElevatedButton(
                  onPressed: _isLoading ? null : () async {
                    await _handleSave();
                    // Custom success logic is handled in _handleSave, so we don't pop here unless we want to always exit the screen.
                    // The user reported "does not add if we click add". If we pop *while* loading, that's bad. 
                    // Let's remove this `Navigator.pop` here since _handleSave shows a snackbar and clears the form. 
                    // If they want to pop on success, we should do it inside _handleSave.
                    // Let's move the pop to _handleSave on success.
                  },
                  child: _isLoading 
                    ? const CircularProgressIndicator(color: Colors.white)
                    : const Text('Add Product to Inventory'),
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}
