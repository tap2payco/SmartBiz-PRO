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
            'is_synced': 1, // Pulled from server
            'updated_at': int.tryParse(timestamp) ?? 0,
          }).toList();
          await _db.upsertCustomers(customers);
        }

        // Sales (Invoices/Quotes)
        if (changes['sales']?['updated'] != null) {
            for (final sale in (changes['sales']['updated'] as List)) {
                await _db.insertSale({
                    'id': sale['id'],
                    'customer_id': sale['customerId'],
                    'total_amount': double.tryParse(sale['totalAmount'] ?? '0') ?? 0.0,
                    'status': sale['paymentStatus'] == 'PAID' ? 'COMPLETED' : 'INVOICED',
                    'is_synced': 1,
                    'created_at': DateTime.parse(sale['createdAt']).millisecondsSinceEpoch,
                    'updated_at': DateTime.parse(sale['updatedAt']).millisecondsSinceEpoch,
                });
            }
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
      // 1. Fetch local unsynced data
      final unsyncedSales = await _db.query('sales', where: 'is_synced = 0');
      final unsyncedExpenses = await _db.query('expenses', where: 'is_synced = 0');
      final unsyncedCustomers = await _db.query('customers', where: 'is_synced = 0');
      final unsyncedItems = await _db.query('items', where: 'is_synced = 0');

      if (unsyncedSales.isEmpty && unsyncedExpenses.isEmpty && 
          unsyncedCustomers.isEmpty && unsyncedItems.isEmpty) {
        return true; 
      }

      final payload = {
        'changes': {
          'items': {
            'created': unsyncedItems.map((i) => {
              'id': i['id'],
              'name': i['name'],
              'sku': i['sku'] ?? '',
              'barcode': i['barcode'] ?? '',
              'description': i['description'] ?? '',
              'categoryId': i['category_id'] ?? 'default',
              'costPrice': i['cost_price'] ?? 0,
              'sellingPrice': i['selling_price'] ?? 0,
              'stockLevel': i['stock_level'] ?? 0,
              'updatedAt': i['updated_at'],
            }).toList(),
          },
          'sales': {
            'created': unsyncedSales.map((s) => {
              'id': s['id'],
              'customerId': s['customer_id'],
              'totalAmount': s['total_amount'],
              'createdAt': DateTime.fromMillisecondsSinceEpoch(s['created_at']).toIso8601String(),
              'updatedAt': DateTime.fromMillisecondsSinceEpoch(s['updated_at']).toIso8601String(),
            }).toList(),
          },
          'expenses': {
            'created': unsyncedExpenses.map((e) => {
              'id': e['id'],
              'description': e['description'],
              'amount': e['amount'],
              'categoryId': e['category_id'],
              'date': DateTime.fromMillisecondsSinceEpoch(e['date']).toIso8601String(),
            }).toList(),
          },
          'customers': {
            'created': unsyncedCustomers.map((c) => {
              'id': c['id'],
              'fullName': c['full_name'],
              'email': c['email'],
              'phone': c['phone'],
              'address': c['address'],
            }).toList(),
          }
        }
      };

      final response = await http.post(
        Uri.parse('$_apiUrl/sync/push'),
        headers: {
          'Authorization': 'Bearer $token',
          'Content-Type': 'application/json',
        },
        body: jsonEncode(payload),
      );

      if (response.statusCode != 200) {
        throw Exception('Sync push failed: ${response.statusCode} ${response.body}');
      }

      // Mark as synced
      for (final s in unsyncedSales) {
        await _db.db.update('sales', {'is_synced': 1}, where: 'id = ?', whereArgs: [s['id']]);
      }
      for (final e in unsyncedExpenses) {
        await _db.db.update('expenses', {'is_synced': 1}, where: 'id = ?', whereArgs: [e['id']]);
      }
      for (final c in unsyncedCustomers) {
        await _db.db.update('customers', {'is_synced': 1}, where: 'id = ?', whereArgs: [c['id']]);
      }
      for (final i in unsyncedItems) {
        await _db.db.update('items', {'is_synced': 1}, where: 'id = ?', whereArgs: [i['id']]);
      }

      return true;
    } catch (e) {
      print('[Sync] Push error: $e');
      return false;
    }
  }
}
