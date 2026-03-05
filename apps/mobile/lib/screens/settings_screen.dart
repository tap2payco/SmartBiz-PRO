import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../services/auth_service.dart';
import '../services/sync_service.dart';
import '../services/database_service.dart';
import '../services/theme_manager.dart';
import '../services/app_lock_service.dart';
import 'pin_lock_screen.dart';

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
          _buildSectionHeader('App Appearance'),
          Consumer<ThemeManager>(
            builder: (context, theme, _) => SwitchListTile(
              secondary: const Icon(Icons.dark_mode_outlined),
              title: const Text('Dark Mode'),
              subtitle: const Text('Adjust app theme'),
              value: theme.isDarkMode,
              onChanged: (v) => theme.toggleTheme(),
            ),
          ),
          const Divider(),
          _buildSectionHeader('Security'),
          Consumer<AppLockService>(
            builder: (context, lock, _) => Column(
              children: [
                SwitchListTile(
                  secondary: const Icon(Icons.lock_outline),
                  title: const Text('Enable PIN Lock'),
                  subtitle: const Text('Require PIN to open app'),
                  value: lock.isEnabled,
                  onChanged: (v) async {
                    if (v && !lock.hasPin) {
                      // Must set PIN first
                      Navigator.push(context, MaterialPageRoute(builder: (_) => const PinLockScreen(setupMode: true)));
                    } else {
                      await lock.toggleLock(v);
                    }
                  },
                ),
                if (lock.isEnabled)
                  ListTile(
                    leading: const SizedBox(width: 40),
                    title: const Text('Change PIN'),
                    onTap: () => Navigator.push(context, MaterialPageRoute(builder: (_) => const PinLockScreen(setupMode: true))),
                  ),
              ],
            ),
          ),
          const Divider(),
          _buildSectionHeader('Business Settings'),
          ListTile(
            leading: const Icon(Icons.receipt_long_outlined),
            title: const Text('Tax Options'),
            subtitle: const Text('Current Rate: 18% (TZS VAT)'),
            onTap: () {
              showDialog(
                context: context,
                builder: (ctx) => AlertDialog(
                  title: const Text('Configure General Tax'),
                  content: Column(
                    mainAxisSize: MainAxisSize.min,
                    children: [
                      const Text('Set the default tax rate for all sales and reports.'),
                      const SizedBox(height: 16),
                      TextFormField(
                        initialValue: '18',
                        keyboardType: TextInputType.number,
                        decoration: const InputDecoration(suffixText: '%', labelText: 'VAT Rate'),
                      ),
                    ],
                  ),
                  actions: [
                    TextButton(onPressed: () => Navigator.pop(ctx), child: const Text('Cancel')),
                    FilledButton(onPressed: () => Navigator.pop(ctx), child: const Text('Save')),
                  ],
                ),
              );
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
