import 'package:flutter/material.dart';
import 'dashboard_screen.dart';
import 'sales_screen.dart';
import 'inventory_screen.dart';
import 'customers_screen.dart';
import 'settings_screen.dart';
import 'add_product_screen.dart';
import 'invoice_list_screen.dart';
import 'quote_list_screen.dart';
import 'sales_receipt_list_screen.dart';
import 'expense_list_screen.dart';
import 'payments_received_list_screen.dart';
import 'placeholder_screen.dart';
import 'projects_list_screen.dart';
import 'project_tasks_screen.dart';
import 'reports_screen.dart';
import 'analysis_screen.dart';
import '../services/auth_service.dart';
import 'package:provider/provider.dart';

class HomeShell extends StatefulWidget {
  const HomeShell({super.key});

  @override
  State<HomeShell> createState() => _HomeShellState();
}

class _HomeShellState extends State<HomeShell> {
  int _currentIndex = 0;

  final _screens = [
    const DashboardScreen(),
    const CustomersScreen(),
    const InventoryScreen(),
    const QuoteListScreen(),
    const InvoiceListScreen(),
    const SalesReceiptListScreen(),
    const PaymentsReceivedListScreen(),
    const ExpenseListScreen(),
    const ProjectsListScreen(),
    const ProjectTasksScreen(),
    const AnalysisScreen(),
    const ReportsScreen(),
    const SettingsScreen(),
    const SalesScreen(), // POS Terminal at index 13
  ];

  final _titles = [
    'Home',
    'Customers',
    'Items',
    'Quotes',
    'Invoices',
    'Sales Receipts',
    'Payments Received',
    'Expense List',
    'Projects',
    'Project Tasks',
    'Project Details',
    'Reports Center',
    'Settings',
    'POS Terminal',
  ];

  void _onSelect(int index) {
    setState(() => _currentIndex = index);
    Navigator.pop(context); // Close drawer
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: Text(_titles[_currentIndex]),
        backgroundColor: Theme.of(context).colorScheme.surface,
        elevation: 0,
      ),
      drawer: Drawer(
        child: ListView(
          padding: EdgeInsets.zero,
          children: [
            Consumer<AuthService>(
              builder: (context, auth, _) => UserAccountsDrawerHeader(
                currentAccountPicture: CircleAvatar(
                  backgroundColor: Colors.white,
                  child: Text(
                    auth.organizationName.isNotEmpty ? auth.organizationName[0].toUpperCase() : 'S',
                    style: const TextStyle(fontSize: 28, color: Color(0xFF2563EB), fontWeight: FontWeight.bold),
                  ),
                ),
                accountName: Text(auth.organizationName, style: const TextStyle(fontWeight: FontWeight.bold, color: Colors.black87)),
                accountEmail: Text(auth.email, style: const TextStyle(color: Colors.black54)),
                onDetailsPressed: () {},
                decoration: const BoxDecoration(
                  color: Color(0xFFF8FAFC),
                ),
                currentAccountPictureSize: const Size.square(60),
                arrowColor: Colors.black87,
              ),
            ),
            _buildDrawerItem(0, Icons.home, Icons.home, 'Home'),
            _buildDrawerItem(1, Icons.person_outline, Icons.person, 'Customers'),
            _buildDrawerItem(2, Icons.shopping_bag_outlined, Icons.shopping_bag, 'Items'),
            _buildDrawerItem(3, Icons.text_snippet_outlined, Icons.text_snippet, 'Quotes'),
            _buildDrawerItem(4, Icons.description_outlined, Icons.description, 'Invoices'),
            _buildDrawerItem(5, Icons.receipt_long_outlined, Icons.receipt_long, 'Sales Receipts'),
            _buildDrawerItem(6, Icons.vertical_align_bottom_outlined, Icons.vertical_align_bottom, 'Payments Received'),
            _buildDrawerItem(7, Icons.receipt_outlined, Icons.receipt, 'Expenses'),
            
            ExpansionTile(
              leading: Icon(Icons.folder_open_outlined, color: Colors.grey.shade700),
              title: const Text('Projects', style: TextStyle(color: Colors.black87)),
              children: [
                _buildDrawerItem(8, Icons.folder_outlined, Icons.folder, 'All Projects'),
                _buildDrawerItem(9, Icons.check_circle_outline, Icons.check_circle, 'Tasks'),
                _buildDrawerItem(10, Icons.analytics_outlined, Icons.analytics, 'Analysis'),
              ],
            ),
            
            _buildDrawerItem(11, Icons.bar_chart, Icons.bar_chart, 'Reports'),
            _buildDrawerItem(12, Icons.settings_outlined, Icons.settings, 'Settings'),
            const Divider(),
            _buildDrawerItem(13, Icons.point_of_sale_outlined, Icons.point_of_sale, 'POS Terminal'),
          ],
        ),
      ),
      body: IndexedStack(
        index: _currentIndex,
        children: _screens,
      ),
    );
  }

  Widget _buildDrawerSection(String title) {
    return Padding(
      padding: const EdgeInsets.fromLTRB(16, 16, 16, 8),
      child: Text(
        title,
        style: TextStyle(
          fontSize: 12,
          fontWeight: FontWeight.bold,
          color: Colors.grey.shade600,
          letterSpacing: 1.2,
        ),
      ),
    );
  }

  Widget _buildDrawerItem(int index, IconData icon, IconData selectedIcon, String label) {
    final isSelected = _currentIndex == index;
    return ListTile(
      leading: Icon(
        isSelected ? selectedIcon : icon,
        color: isSelected ? Theme.of(context).colorScheme.primary : Colors.grey.shade700,
      ),
      title: Text(
        label,
        style: TextStyle(
          color: isSelected ? Theme.of(context).colorScheme.primary : Colors.grey.shade900,
          fontWeight: isSelected ? FontWeight.bold : FontWeight.normal,
        ),
      ),
      selected: isSelected,
      selectedTileColor: Theme.of(context).colorScheme.primary.withOpacity(0.1),
      onTap: () => _onSelect(index),
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(8)),
      contentPadding: const EdgeInsets.symmetric(horizontal: 16),
    );
  }
}
