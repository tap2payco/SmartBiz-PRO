import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:intl/intl.dart';
import '../services/database_service.dart';
import '../services/document_service.dart';
import 'scanner_screen.dart';

class RecordPaymentScreen extends StatefulWidget {
  const RecordPaymentScreen({super.key});

  @override
  State<RecordPaymentScreen> createState() => _RecordPaymentScreenState();
}

class _RecordPaymentScreenState extends State<RecordPaymentScreen> {
  final _formKey = GlobalKey<FormState>();
  final _amountController = TextEditingController();
  Map<String, dynamic>? _selectedInvoice;
  String _paymentMethod = 'CASH';
  bool _isSaving = false;

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Record Payment'),
      ),
      body: Form(
        key: _formKey,
        child: ListView(
          padding: const EdgeInsets.all(16),
          children: [
            const Text('Link to Invoice', style: TextStyle(fontWeight: FontWeight.bold)),
            const SizedBox(height: 8),
            Row(
              children: [
                Expanded(child: _buildInvoiceSelector()),
                const SizedBox(width: 8),
                IconButton.filledTonal(
                  onPressed: _scanInvoice,
                  icon: const Icon(Icons.qr_code_scanner),
                  tooltip: 'Scan Invoice QR',
                ),
              ],
            ),
            const SizedBox(height: 16),
            TextFormField(
              controller: _amountController,
              decoration: const InputDecoration(labelText: 'Amount Received (TZS)', border: OutlineInputBorder()),
              keyboardType: TextInputType.number,
              validator: (v) {
                if (v == null || v.isEmpty) return 'Required';
                if (double.tryParse(v) == null) return 'Invalid amount';
                return null;
              },
            ),
            const SizedBox(height: 16),
            const Text('Payment Method', style: TextStyle(fontWeight: FontWeight.bold)),
            DropdownButtonFormField<String>(
              value: _paymentMethod,
              items: ['CASH', 'M-PESA', 'BANK TRANSFER', 'CARD'].map((m) => DropdownMenuItem(value: m, child: Text(m))).toList(),
              onChanged: (v) => setState(() => _paymentMethod = v!),
              decoration: const InputDecoration(border: OutlineInputBorder()),
            ),
            const SizedBox(height: 24),
            ElevatedButton(
              onPressed: _isSaving ? null : _savePayment,
              style: ElevatedButton.styleFrom(minimumSize: const Size.fromHeight(50)),
              child: _isSaving ? const CircularProgressIndicator() : const Text('Record & Share Receipt'),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildInvoiceSelector() {
    return OutlinedButton(
      onPressed: _selectInvoice,
      style: OutlinedButton.styleFrom(
        padding: const EdgeInsets.all(16),
        alignment: Alignment.centerLeft,
      ),
      child: Text(_selectedInvoice == null 
        ? 'Tap to select an invoice' 
        : 'INV-${_selectedInvoice!['id'].toString().substring(0, 8).toUpperCase()} - ${NumberFormat.simpleCurrency(name: 'TZS').format(_selectedInvoice!['total_amount'])}'),
    );
  }

  void _scanInvoice() async {
    final code = await Navigator.push<String>(
      context,
      MaterialPageRoute(builder: (_) => const ScannerScreen()),
    );
    
    if (code != null && mounted) {
      final db = context.read<DatabaseService>();
      final invoices = await db.getInvoices();
      
      // Try to match by ID or full ID string from QR
      final invoice = invoices.firstWhere(
        (inv) => inv['id'].toString() == code || code.contains(inv['id'].toString()),
        orElse: () => {},
      );

      if (invoice.isNotEmpty) {
        setState(() {
          _selectedInvoice = invoice;
          _amountController.text = invoice['total_amount'].toString();
        });
        ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text('Matched Invoice #${invoice['id'].toString().substring(0,8).toUpperCase()}')));
      } else {
        ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Invoice not found in system')));
      }
    }
  }

  void _selectInvoice() async {
    final db = context.read<DatabaseService>();
    final invoices = await db.getInvoices();
    
    if (!mounted) return;

    showModalBottomSheet(
      context: context,
      builder: (ctx) => ListView.builder(
        itemCount: invoices.length,
        itemBuilder: (_, i) => ListTile(
          title: Text('Invoice #INV-${invoices[i]['id'].toString().substring(0, 8).toUpperCase()}'),
          subtitle: Text('Balance: TZS ${invoices[i]['total_amount']}'),
          onTap: () {
            setState(() => _selectedInvoice = invoices[i]);
            _amountController.text = invoices[i]['total_amount'].toString();
            Navigator.pop(ctx);
          },
        ),
      ),
    );
  }

  void _savePayment() async {
    if (!_formKey.currentState!.validate() || _selectedInvoice == null) {
      ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Please select an invoice and enter amount')));
      return;
    }

    setState(() => _isSaving = true);
    final db = context.read<DatabaseService>();
    final docService = DocumentService();
    
    final paymentId = DateTime.now().millisecondsSinceEpoch.toString();
    final amount = double.parse(_amountController.text);
    
    final paymentData = {
      'id': paymentId,
      'invoice_id': _selectedInvoice!['id'],
      'amount': amount,
      'payment_method': _paymentMethod,
      'created_at': DateTime.now().millisecondsSinceEpoch,
    };

    // Save to DB (Assuming insertPayment exists or using a generic one)
    // For now I'll just use a direct query or generic insert
    await db.db.insert('invoice_payments', paymentData);
    
    // Update invoice status if fully paid
    if (amount >= _selectedInvoice!['total_amount']) {
      await db.db.update('sales', {'status': 'PAID'}, where: 'id = ?', whereArgs: [_selectedInvoice!['id']]);
    }

    if (mounted) {
      await docService.generateAndSharePaymentReceipt(paymentData, _selectedInvoice!);
      Navigator.pop(context);
      ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Payment recorded and receipt shared')));
    }
  }
}
