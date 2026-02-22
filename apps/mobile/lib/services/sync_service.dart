import 'dart:convert';
import 'package:http/http.dart' as http;
import 'package:flutter_dotenv/flutter_dotenv.dart';
import 'database_service.dart';

class SyncService {
  final DatabaseService _db;
  final String _apiUrl;

  SyncService(this._db) : _apiUrl = dotenv.env['API_URL'] ?? 'http://localhost:3001';

  Future<bool> pullData(String token) async {
    try {
      final lastPulledAt = await _db.getSyncMeta('last_pulled_at') ?? '0';

      final response = await http.get(
        Uri.parse('$_apiUrl/sync/pull?lastPulledAt=$lastPulledAt'),
        headers: {'Authorization': 'Bearer $token'},
      );

      if (response.statusCode != 200) {
        throw Exception('Sync pull failed: ${response.statusCode}');
      }

      final data = jsonDecode(response.body);
      final changes = data['changes'] as Map<String, dynamic>?;
      final timestamp = data['timestamp']?.toString() ?? DateTime.now().millisecondsSinceEpoch.toString();

      if (changes != null) {
        // Items
        if (changes['items']?['updated'] != null) {
          final items = (changes['items']['updated'] as List).map((item) => {
            'id': item['id'],
            'name': item['name'],
            'sku': item['sku'] ?? '',
            'barcode': item['barcode'] ?? '',
            'cost_price': (item['costPrice'] ?? 0).toDouble(),
            'selling_price': (item['sellingPrice'] ?? 0).toDouble(),
            'description': item['description'] ?? '',
            'category_id': item['categoryId'] ?? '',
            'is_active': (item['isActive'] ?? true) ? 1 : 0,
            'stock_level': item['stockLevel'] ?? 0,
            'updated_at': int.tryParse(timestamp) ?? 0,
          }).toList();
          await _db.upsertItems(items);
        }

        // Categories
        if (changes['categories']?['updated'] != null) {
          final categories = (changes['categories']['updated'] as List).map((cat) => {
            'id': cat['id'],
            'name': cat['name'],
            'description': cat['description'] ?? '',
            'updated_at': int.tryParse(timestamp) ?? 0,
          }).toList();
          await _db.upsertCategories(categories);
        }

        // Customers
        if (changes['customers']?['updated'] != null) {
          final customers = (changes['customers']['updated'] as List).map((cust) => {
            'id': cust['id'],
            'full_name': cust['fullName'] ?? '',
            'email': cust['email'] ?? '',
            'phone': cust['phone'] ?? '',
            'address': cust['address'] ?? '',
            'loyalty_points': cust['loyaltyPoints'] ?? 0,
            'updated_at': int.tryParse(timestamp) ?? 0,
          }).toList();
          await _db.upsertCustomers(customers);
        }
      }

      await _db.setSyncMeta('last_pulled_at', timestamp);
      return true;
    } catch (e) {
      print('[Sync] Pull error: $e');
      return false;
    }
  }

  Future<bool> pushData(String token) async {
    try {
      print('[Sync] Push: placeholder for local changes upload');
      return true;
    } catch (e) {
      print('[Sync] Push error: $e');
      return false;
    }
  }
}
