import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../services/app_lock_service.dart';

class PinLockScreen extends StatefulWidget {
  final bool setupMode;
  const PinLockScreen({super.key, this.setupMode = false});

  @override
  State<PinLockScreen> createState() => _PinLockScreenState();
}

class _PinLockScreenState extends State<PinLockScreen> {
  String _pin = '';
  String? _firstPin; // For confirm mode

  void _onDigitPress(String digit) {
    if (_pin.length < 6) {
      setState(() => _pin += digit);
    }

    if (_pin.length >= 4) {
      if (widget.setupMode) {
        if (_pin.length == 6 || _pin.length == 4) {
           // Wait logic or user confirm? Let's just auto-proceed on 4 or 6 if it's the target.
           // Actually, standard PIN is usually fixed length. Let's assume 4 for simplicity unless user types 6.
        }
      } else {
        // Unlock mode: Check if correct
        final lockService = context.read<AppLockService>();
        if (lockService.unlock(_pin)) {
          // Success handled by state change and main.dart listener
        } else if (_pin.length == 6) {
          // Reset if 6 reached and wrong
          setState(() => _pin = '');
          ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Incorrect PIN')));
        }
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: SafeArea(
        child: Column(
          children: [
            const SizedBox(height: 64),
            Icon(Icons.lock_person_outlined, size: 64, color: Theme.of(context).colorScheme.primary),
            const SizedBox(height: 24),
            Text(
              widget.setupMode ? 'Set your PIN' : 'Enter PIN to Unlock',
              style: const TextStyle(fontSize: 20, fontWeight: FontWeight.bold),
            ),
            const SizedBox(height: 8),
            Text(
              widget.setupMode ? 'Choose a 4-6 digit PIN' : 'Access Restricted',
              style: TextStyle(color: Colors.grey.shade600),
            ),
            const SizedBox(height: 48),
            Row(
              mainAxisAlignment: MainAxisAlignment.center,
              children: List.generate(6, (index) {
                bool isActive = index < _pin.length;
                return Container(
                  margin: const EdgeInsets.symmetric(horizontal: 8),
                  width: 16,
                  height: 16,
                  decoration: BoxDecoration(
                    shape: BoxShape.circle,
                    color: isActive 
                      ? Theme.of(context).colorScheme.primary 
                      : Theme.of(context).colorScheme.primary.withOpacity(0.1),
                    border: Border.all(color: Theme.of(context).colorScheme.primary.withOpacity(0.2)),
                  ),
                );
              }),
            ),
            const Spacer(),
            _buildKeypad(),
            const SizedBox(height: 48),
          ],
        ),
      ),
    );
  }

  Widget _buildKeypad() {
    return Column(
      children: [
        for (var row in [['1', '2', '3'], ['4', '5', '6'], ['7', '8', '9'], [null, '0', 'back']])
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceEvenly,
            children: row.map((key) {
              if (key == null) return const SizedBox(width: 80, height: 80);
              if (key == 'back') {
                return _buildKey(
                  IconButton(
                    icon: const Icon(Icons.backspace_outlined),
                    onPressed: _pin.isEmpty ? null : () => setState(() => _pin = _pin.substring(0, _pin.length - 1)),
                  ),
                );
              }
              return _buildKey(
                TextButton(
                  onPressed: () => _onDigitPress(key),
                  child: Text(key, style: const TextStyle(fontSize: 24, fontWeight: FontWeight.bold)),
                ),
              );
            }).toList(),
          ),
        if (widget.setupMode)
          Padding(
            padding: const EdgeInsets.only(top: 24),
            child: ElevatedButton(
              onPressed: _pin.length >= 4 ? () async {
                final lockService = context.read<AppLockService>();
                await lockService.setPin(_pin);
                await lockService.toggleLock(true);
                if (mounted) Navigator.pop(context);
              } : null,
              child: const Text('Save PIN'),
            ),
          )
      ],
    );
  }

  Widget _buildKey(Widget child) {
    return SizedBox(
      width: 80,
      height: 80,
      child: Center(child: child),
    );
  }
}
