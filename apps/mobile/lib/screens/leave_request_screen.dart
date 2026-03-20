import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:uuid/uuid.dart';
import '../services/database_service.dart';
import '../services/auth_service.dart';

class LeaveRequestScreen extends StatefulWidget {
  const LeaveRequestScreen({super.key});

  @override
  State<LeaveRequestScreen> createState() => _LeaveRequestScreenState();
}

class _LeaveRequestScreenState extends State<LeaveRequestScreen> {
  final _formKey = GlobalKey<FormState>();
  String _type = 'ANNUAL';
  DateTime _startDate = DateTime.now().add(const Duration(days: 1));
  DateTime _endDate = DateTime.now().add(const Duration(days: 2));
  final _reasonController = TextEditingController();
  bool _isLoading = false;

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('Apply for Leave')),
      body: Form(
        key: _formKey,
        child: ListView(
          padding: const EdgeInsets.all(20),
          children: [
            const Text('Leave Type', style: TextStyle(fontWeight: FontWeight.bold)),
            const SizedBox(height: 8),
            DropdownButtonFormField<String>(
              value: _type,
              decoration: const InputDecoration(border: OutlineInputBorder()),
              items: ['ANNUAL', 'SICK', 'MATERNITY', 'EMERGENCY', 'UNPAID']
                  .map((t) => DropdownMenuItem(value: t, child: Text(t)))
                  .toList(),
              onChanged: (v) => setState(() => _type = v!),
            ),
            const SizedBox(height: 20),
            Row(
              children: [
                Expanded(child: _buildDatePicker('Start Date', _startDate, (d) => setState(() => _startDate = d))),
                const SizedBox(width: 16),
                Expanded(child: _buildDatePicker('End Date', _endDate, (d) => setState(() => _endDate = d))),
              ],
            ),
            const SizedBox(height: 20),
            const Text('Reason', style: TextStyle(fontWeight: FontWeight.bold)),
            const SizedBox(height: 8),
            TextFormField(
              controller: _reasonController,
              maxLines: 4,
              decoration: const InputDecoration(
                hintText: 'Briefly explain why you need time off...',
                border: OutlineInputBorder(),
              ),
              validator: (v) => (v == null || v.isEmpty) ? 'Reason is required' : null,
            ),
            const SizedBox(height: 40),
            ElevatedButton(
              onPressed: _isLoading ? null : _submitRequest,
              style: ElevatedButton.styleFrom(
                minimumSize: const Size.fromHeight(56),
                backgroundColor: const Color(0xFF2563EB),
                foregroundColor: Colors.white,
              ),
              child: _isLoading 
                ? const CircularProgressIndicator(color: Colors.white)
                : const Text('Submit Request', style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold)),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildDatePicker(String label, DateTime current, Function(DateTime) onSelect) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(label, style: const TextStyle(fontWeight: FontWeight.bold)),
        const SizedBox(height: 8),
        InkWell(
          onTap: () async {
            final picked = await showDatePicker(
              context: context,
              initialDate: current,
              firstDate: DateTime.now(),
              lastDate: DateTime.now().add(const Duration(days: 365)),
            );
            if (picked != null) onSelect(picked);
          },
          child: Container(
            padding: const EdgeInsets.all(12),
            decoration: BoxDecoration(
              border: Border.all(color: Colors.grey),
              borderRadius: BorderRadius.circular(4),
            ),
            child: Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                Text(DateFormat('MMM dd, yyyy').format(current)),
                const Icon(Icons.calendar_today, size: 16),
              ],
            ),
          ),
        ),
      ],
    );
  }

  void _submitRequest() async {
    if (!_formKey.currentState!.validate()) return;

    setState(() => _isLoading = true);
    final db = context.read<DatabaseService>();
    final auth = context.read<AuthService>();

    try {
      final id = const Uuid().v4();
      final now = DateTime.now().millisecondsSinceEpoch;

      await db.db.insert('hr_leaves', {
        'id': id,
        'employee_id': auth.employeeId,
        'type': _type,
        'start_date': _startDate.millisecondsSinceEpoch,
        'end_date': _endDate.millisecondsSinceEpoch,
        'reason': _reasonController.text,
        'status': 'PENDING',
        'is_synced': 0,
        'updated_at': now,
      });

      if (mounted) {
        Navigator.pop(context);
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('✅ Leave request submitted!')),
        );
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('❌ Error: $e')),
        );
      }
    } finally {
      if (mounted) setState(() => _isLoading = false);
    }
  }
}
