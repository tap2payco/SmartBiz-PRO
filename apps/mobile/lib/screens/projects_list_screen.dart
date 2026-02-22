import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:intl/intl.dart';
import '../services/database_service.dart';

class ProjectsListScreen extends StatefulWidget {
  const ProjectsListScreen({super.key});

  @override
  State<ProjectsListScreen> createState() => _ProjectsListScreenState();
}

class _ProjectsListScreenState extends State<ProjectsListScreen> {
  List<Map<String, dynamic>> _projects = [];
  bool _isLoading = true;

  @override
  void initState() {
    super.initState();
    _loadProjects();
  }

  Future<void> _loadProjects() async {
    setState(() => _isLoading = true);
    final db = Provider.of<DatabaseService>(context, listen: false);
    // Directly query projects table
    final data = await db.db.query('projects', orderBy: 'updated_at DESC');
    setState(() {
      _projects = data;
      _isLoading = false;
    });
  }

  void _showAddProjectDialog() {
    final nameController = TextEditingController();
    final descController = TextEditingController();

    showDialog(
      context: context,
      builder: (ctx) => AlertDialog(
        title: const Text('New Project'),
        content: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            TextField(controller: nameController, decoration: const InputDecoration(labelText: 'Project Name')),
            TextField(controller: descController, decoration: const InputDecoration(labelText: 'Description')),
          ],
        ),
        actions: [
          TextButton(onPressed: () => Navigator.pop(ctx), child: const Text('Cancel')),
          TextButton(
            onPressed: () async {
              if (nameController.text.isEmpty) return;
              final db = Provider.of<DatabaseService>(context, listen: false);
              await db.db.insert('projects', {
                'id': DateTime.now().millisecondsSinceEpoch.toString(),
                'name': nameController.text,
                'description': descController.text,
                'status': 'ACTIVE',
                'updated_at': DateTime.now().millisecondsSinceEpoch,
              });
              Navigator.pop(ctx);
              _loadProjects();
            },
            child: const Text('Create'),
          ),
        ],
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    if (_isLoading) return const Center(child: CircularProgressIndicator());

    return Scaffold(
      body: _projects.isEmpty ? _buildEmptyState() : ListView.builder(
        padding: const EdgeInsets.all(16),
        itemCount: _projects.length,
        itemBuilder: (context, index) {
          final project = _projects[index];
          return Card(
            margin: const EdgeInsets.only(bottom: 12),
            child: ListTile(
              leading: const CircleAvatar(child: Icon(Icons.folder)),
              title: Text(project['name'], style: const TextStyle(fontWeight: FontWeight.bold)),
              subtitle: Text(project['description'] ?? 'No description'),
              trailing: const Icon(Icons.chevron_right),
              onTap: () {
                // Navigate to detail
              },
            ),
          );
        },
      ),
      floatingActionButton: FloatingActionButton.extended(
        onPressed: _showAddProjectDialog,
        label: const Text('New Project'),
        icon: const Icon(Icons.add),
      ),
    );
  }

  Widget _buildEmptyState() {
    return const Center(
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          Icon(Icons.folder_open, size: 64, color: Colors.grey),
          SizedBox(height: 16),
          Text('No projects found.', style: TextStyle(color: Colors.grey)),
        ],
      ),
    );
  }
}
