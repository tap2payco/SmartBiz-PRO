import 'package:flutter/material.dart';

class ProjectTasksScreen extends StatefulWidget {
  const ProjectTasksScreen({super.key});

  @override
  State<ProjectTasksScreen> createState() => _ProjectTasksScreenState();
}

class _ProjectTasksScreenState extends State<ProjectTasksScreen> {
  final List<Map<String, dynamic>> _tasks = [
    {'title': 'Initial Consultation', 'status': 'Completed', 'date': '2023-10-01'},
    {'title': 'System Design', 'status': 'In Progress', 'date': '2023-10-05'},
    {'title': 'Frontend Development', 'status': 'Pending', 'date': '2023-10-15'},
  ];

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: ListView.builder(
        padding: const EdgeInsets.all(16),
        itemCount: _tasks.length,
        itemBuilder: (context, index) {
          final task = _tasks[index];
          return Card(
            child: ListTile(
              leading: Icon(
                task['status'] == 'Completed' ? Icons.check_circle : 
                task['status'] == 'In Progress' ? Icons.pending : Icons.circle_outlined,
                color: task['status'] == 'Completed' ? Colors.green : 
                task['status'] == 'In Progress' ? Colors.blue : Colors.grey,
              ),
              title: Text(task['title'], style: const TextStyle(fontWeight: FontWeight.bold)),
              subtitle: Text('Due: ${task['date']}'),
              trailing: Chip(
                label: Text(task['status'], style: const TextStyle(fontSize: 10)),
                backgroundColor: Colors.grey.shade100,
              ),
            ),
          );
        },
      ),
      floatingActionButton: FloatingActionButton(
        onPressed: () {
          ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Task creation coming soon')));
        },
        child: const Icon(Icons.add_task),
      ),
    );
  }
}
