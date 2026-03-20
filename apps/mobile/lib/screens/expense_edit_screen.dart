import 'dart:io';
import 'package:flutter/material.dart';
import 'package:image_picker/image_picker.dart';
import 'package:image/image.dart' as img;
import 'package:path_provider/path_provider.dart';
import 'package:path/path.dart' as p;
import 'package:provider/provider.dart';
import 'package:intl/intl.dart';
import '../services/database_service.dart';

class ExpenseEditScreen extends StatefulWidget {
  final Map<String, dynamic>? expense;
  const ExpenseEditScreen({super.key, this.expense});

  @override
  State<ExpenseEditScreen> createState() => _ExpenseEditScreenState();
}

class _ExpenseEditScreenState extends State<ExpenseEditScreen> {
  final _formKey = GlobalKey<FormState>();
  final _descriptionController = TextEditingController();
  final _amountController = TextEditingController();
  DateTime _date = DateTime.now();
  File? _image;
  String? _compressedPath;
  String? _selectedCategoryId;
  bool _isCompressing = false;

  @override
  void initState() {
    super.initState();
    if (widget.expense != null) {
      _descriptionController.text = widget.expense!['description'] ?? '';
      _amountController.text = widget.expense!['amount']?.toString() ?? '';
      _date = DateTime.fromMillisecondsSinceEpoch(widget.expense!['date']);
      _selectedCategoryId = widget.expense!['category_id'];
      if (widget.expense!['receipt_path'] != null) {
        _compressedPath = widget.expense!['receipt_path'];
      }
    }
  }

  Future<void> _takePhoto() async {
    final picker = ImagePicker();
    final pickedFile = await picker.pickImage(source: ImageSource.camera);

    if (pickedFile != null) {
      setState(() {
        _image = File(pickedFile.path);
        _isCompressing = true;
      });
      await _compressImage(pickedFile.path);
    }
  }

  Future<void> _compressImage(String filePath) async {
    try {
      final bytes = await File(filePath).readAsBytes();
      final image = img.decodeImage(bytes);
      
      if (image == null) {
        setState(() => _isCompressing = false);
        return;
      }

      // Resize and compress
      final resized = img.copyResize(image, width: 800);
      final compressedBytes = img.encodeJpg(resized, quality: 30);

      final appDir = await getApplicationDocumentsDirectory();
      final finalPath = p.join(appDir.path, "receipt_${DateTime.now().millisecondsSinceEpoch}.jpg");
      await File(finalPath).writeAsBytes(compressedBytes);
      
      setState(() {
        _compressedPath = finalPath;
        _isCompressing = false;
      });
      
      debugPrint('Compressed file size: ${compressedBytes.length / 1024} KB');
    } catch (e) {
      debugPrint('Compression error: $e');
      setState(() => _isCompressing = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: Text(widget.expense == null ? 'Record Expense' : 'Edit Expense'),
        actions: [
          IconButton(icon: const Icon(Icons.check), onPressed: _saveExpense),
        ],
      ),
      body: Form(
        key: _formKey,
        child: ListView(
          padding: const EdgeInsets.all(16),
          children: [
            TextFormField(
              controller: _descriptionController,
              decoration: const InputDecoration(labelText: 'Description', border: OutlineInputBorder()),
              validator: (v) => v == null || v.isEmpty ? 'Required' : null,
            ),
            const SizedBox(height: 16),
            TextFormField(
              controller: _amountController,
              decoration: const InputDecoration(labelText: 'Amount (TZS)', border: OutlineInputBorder()),
              keyboardType: TextInputType.number,
              validator: (v) => v == null || v.isEmpty ? 'Required' : null,
            ),
            const SizedBox(height: 16),
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
            const Text('Receipt Image (Compressed)', style: TextStyle(fontWeight: FontWeight.bold)),
            const SizedBox(height: 8),
            _buildImageWidget(),
            const SizedBox(height: 8),
            ElevatedButton.icon(
              onPressed: _isCompressing ? null : _takePhoto,
              icon: const Icon(Icons.camera_alt),
              label: const Text('Capture Receipt'),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildImageWidget() {
    if (_isCompressing) return const Center(child: CircularProgressIndicator());
    
    if (_compressedPath != null) {
      return Stack(
        alignment: Alignment.topRight,
        children: [
          Image.file(File(_compressedPath!), height: 200, width: double.infinity, fit: BoxFit.contain),
          IconButton(
            icon: const Icon(Icons.delete, color: Colors.red),
            onPressed: () => setState(() => _compressedPath = null),
          ),
        ],
      );
    }
    
    return Container(
      height: 150,
      decoration: BoxDecoration(color: Colors.grey.shade200, borderRadius: BorderRadius.circular(8)),
      child: const Center(child: Icon(Icons.image, size: 50, color: Colors.grey)),
    );
  }

  void _saveExpense() async {
    if (!_formKey.currentState!.validate()) return;

    final db = context.read<DatabaseService>();
    await db.insertExpense({
      'id': widget.expense?['id'] ?? DateTime.now().millisecondsSinceEpoch.toString(),
      'description': _descriptionController.text,
      'amount': double.parse(_amountController.text),
      'date': _date.millisecondsSinceEpoch,
      'category_id': _selectedCategoryId,
      'receipt_path': _compressedPath,
      'updated_at': DateTime.now().millisecondsSinceEpoch,
    });

    if (mounted) {
      Navigator.pop(context);
      ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Expense recorded successfully')));
    }
  }
}
