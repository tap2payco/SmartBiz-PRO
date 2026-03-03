import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../services/auth_service.dart';
import '../services/sync_service.dart';
import '../services/database_service.dart';

class SettingsScreen extends StatelessWidget {
  const SettingsScreen({super.key});

  @override
  Widget build(BuildContext context) {
    final auth = context.watch<AuthService>();
    final db = context.read<DatabaseService>();

    return Scaffold(
      body: ListView(
        children: [
          const SizedBox(height: 16),
          _buildSectionHeader('Profile & Business'),
          ListTile(
            leading: const CircleAvatar(child: Icon(Icons.business)),
            title: Text(auth.organizationName),
            subtitle: Text(auth.email),
            trailing: const Icon(Icons.chevron_right),
            onTap: () {
               // Profile details coming soon
            },
          ),
          const Divider(),
          _buildSectionHeader('Synchronisation'),
          ListTile(
            leading: const Icon(Icons.cloud_sync, color: Color(0xFF2563EB)),
            title: const Text('Sync Cloud Data'),
            subtitle: const Text('Pull latest updates from server'),
            onTap: () async {
              final token = auth.accessToken;
              if (token != null) {
                final sync = SyncService(db);
                ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Starting manual sync...')));
                final success = await sync.pullData(token);
                if (context.mounted) {
                  ScaffoldMessenger.of(context).showSnackBar(
                    SnackBar(content: Text(success ? '✅ Sync completed' : '❌ Sync failed')),
                  );
                }
              } else {
                ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Please log in to sync')));
              }
            },
          ),
          const Divider(),
          _buildSectionHeader('App Preferences'),
          SwitchListTile(
            secondary: const Icon(Icons.dark_mode_outlined),
            title: const Text('Dark Mode'),
            subtitle: const Text('Adjust app theme'),
            value: Theme.of(context).brightness == Brightness.dark,
            onChanged: (v) {
               ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Theme settings coming soon')));
            },
          ),
          const Divider(),
          _buildSectionHeader('System'),
          ListTile(
            leading: const Icon(Icons.info_outline),
            title: const Text('About SmartBiz GO'),
            subtitle: const Text('Version 1.0.0 (Tanzania Build)'),
          ),
          const SizedBox(height: 24),
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
              icon: const Icon(Icons.logout, color: Colors.red),
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

  Widget _buildSectionHeader(String title) {
    return Padding(
      padding: const EdgeInsets.fromLTRB(16, 16, 16, 8),
      child: Text(
        title,
        style: const TextStyle(
          fontSize: 12,
          fontWeight: FontWeight.bold,
          color: Color(0xFF2563EB),
          letterSpacing: 1.1,
        ),
      ),
    );
  }
}
