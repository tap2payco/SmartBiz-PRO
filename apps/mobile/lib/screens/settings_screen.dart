import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../services/auth_service.dart';

class SettingsScreen extends StatelessWidget {
  const SettingsScreen({super.key});

  @override
  Widget build(BuildContext context) {
    final auth = context.watch<AuthService>();

    return Scaffold(
      appBar: AppBar(
        title: const Text('Settings'),
        centerTitle: false,
      ),
      body: ListView(
        children: [
          _buildSettingsTile(Icons.business, 'Organization Profile'),
          _buildSettingsTile(Icons.sync, 'Switch Organization'),
          _buildSettingsTile(Icons.pie_chart_outline, 'Usage Stats'),
          _buildSettingsTile(Icons.people_outline, 'Users'),
          _buildSettingsTile(Icons.tune, 'Preferences'),
          
          const Divider(indent: 16, endIndent: 16),
          
          _buildSettingsTile(Icons.percent, 'Taxes'),
          _buildSettingsTile(Icons.dashboard_customize_outlined, 'PDF Template Customization'),
          _buildSettingsTile(Icons.payment, 'Online Payment Gateways'),
          _buildSettingsTile(Icons.mail_outline, 'Sender Email Preferences'),
          
          const Divider(indent: 16, endIndent: 16),
          
          _buildSettingsTile(Icons.smartphone, 'Opening Screen - Default'),
          _buildSettingsTile(Icons.image_outlined, 'Image upload resolution'),
          _buildSettingsTile(Icons.security, 'Privacy & Security'),
          
          const SizedBox(height: 32),
          Padding(
            padding: const EdgeInsets.symmetric(horizontal: 16),
            child: OutlinedButton.icon(
              onPressed: () async {
                final confirmed = await showDialog<bool>(
                  context: context,
                  builder: (ctx) => AlertDialog(
                    title: const Text('Sign Out?'),
                    content: const Text('You will need to log in again to use the app.'),
                    actions: [
                      TextButton(onPressed: () => Navigator.pop(ctx, false), child: const Text('Cancel')),
                      FilledButton(onPressed: () => Navigator.pop(ctx, true), child: const Text('Sign Out')),
                    ],
                  ),
                );
                if (confirmed == true) {
                  await auth.signOut();
                }
              },
              icon: const Icon(Icons.power_settings_new, color: Colors.red),
              label: const Text('Sign Out', style: TextStyle(color: Colors.red)),
              style: OutlinedButton.styleFrom(
                side: BorderSide(color: Colors.red.shade100),
                padding: const EdgeInsets.symmetric(vertical: 12),
              ),
            ),
          ),
          const SizedBox(height: 32),
        ],
      ),
    );
  }

  Widget _buildSettingsTile(IconData icon, String title) {
    return _SettingsTile(
      icon: icon,
      title: title,
      onTap: () {
        // For now, just show a message or do nothing
      },
    );
  }

  void _showInfo(BuildContext context, String title, String message) {
    showDialog(
      context: context,
      builder: (ctx) => AlertDialog(
        title: Text(title),
        content: Text(message),
        actions: [
          FilledButton(onPressed: () => Navigator.pop(ctx), child: const Text('OK')),
        ],
      ),
    );
  }
}

class _SettingsTile extends StatelessWidget {
  final IconData icon;
  final String title;
  final VoidCallback onTap;

  const _SettingsTile({
    required this.icon,
    required this.title,
    required this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    return ListTile(
      leading: Icon(icon, color: Colors.grey.shade600),
      title: Text(title, style: const TextStyle(fontWeight: FontWeight.w500)),
      trailing: Icon(Icons.chevron_right, color: Colors.grey.shade400),
      onTap: onTap,
    );
  }
}
