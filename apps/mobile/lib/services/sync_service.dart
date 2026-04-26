import 'dart:convert';
import 'package:http/http.dart' as http;
import 'package:flutter_dotenv/flutter_dotenv.dart';
import 'package:sqflite/sqflite.dart';
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

      final responseData = jsonDecode(response.body);
      if (responseData['success'] != true) {
        throw Exception('Sync pull failed: ${responseData['error'] ?? 'Unknown error'}');
      }

      final data = responseData['data'];
      final changes = data['changes'] as Map<String, dynamic>?;
      final timestamp = data['timestamp']?.toString() ?? DateTime.now().millisecondsSinceEpoch.toString();

      if (changes != null) {
        await _db.db.transaction((txn) async {
          // 1. Process Deletions First
          final entitiesToDelete = [
            {'key': 'items', 'table': 'items'},
            {'key': 'customers', 'table': 'customers'},
            {'key': 'sales', 'table': 'sales'},
            {'key': 'expenses', 'table': 'expenses'},
            {'key': 'bankTransactions', 'table': 'bank_transactions'},
            {'key': 'stockMovements', 'table': 'stock_movements'},
            {'key': 'suppliers', 'table': 'suppliers'},
            {'key': 'purchases', 'table': 'purchases'},
          ];

          for (final entity in entitiesToDelete) {
            final deletedIds = changes[entity['key']]?['deleted'] as List?;
            if (deletedIds != null && deletedIds.isNotEmpty) {
              for (final id in deletedIds) {
                await txn.delete(entity['table']!, where: 'id = ?', whereArgs: [id]);
              }
            }
          }

          // 2. Items
          if (changes['items']?['updated'] != null) {
            for (final item in (changes['items']['updated'] as List)) {
              await txn.insert('items', {
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
                'is_synced': 1,
                'updated_at': int.tryParse(timestamp) ?? 0,
              }, conflictAlgorithm: ConflictAlgorithm.replace);
            }
          }

          // 3. Customers
          if (changes['customers']?['updated'] != null) {
            for (final cust in (changes['customers']['updated'] as List)) {
              await txn.insert('customers', {
                'id': cust['id'],
                'full_name': cust['fullName'] ?? '',
                'email': cust['email'] ?? '',
                'phone': cust['phone'] ?? '',
                'address': cust['address'] ?? '',
                'loyalty_points': cust['loyaltyPoints'] ?? 0,
                'is_synced': 1,
                'updated_at': int.tryParse(timestamp) ?? 0,
              }, conflictAlgorithm: ConflictAlgorithm.replace);
            }
          }

          // 4. Sales, Quotations, Returns (all stored in 'sales' locally)
          if (changes['sales']?['updated'] != null) {
            for (final sale in (changes['sales']['updated'] as List)) {
              await txn.insert('sales', {
                'id': sale['id'],
                'customer_id': sale['customerId'],
                'total_amount': double.tryParse(sale['totalAmount']?.toString() ?? '0') ?? 0.0,
                'status': sale['status'] ?? 'COMPLETED',
                'is_synced': 1,
                'created_at': DateTime.parse(sale['createdAt']).millisecondsSinceEpoch,
                'updated_at': DateTime.parse(sale['updatedAt']).millisecondsSinceEpoch,
              }, conflictAlgorithm: ConflictAlgorithm.replace);
            }
          }

          if (changes['quotations']?['updated'] != null) {
            for (final q in (changes['quotations']['updated'] as List)) {
              await txn.insert('sales', {
                'id': q['id'],
                'customer_id': q['customerId'],
                'total_amount': double.tryParse(q['totalAmount']?.toString() ?? '0') ?? 0.0,
                'status': 'QUOTATION',
                'is_synced': 1,
                'created_at': DateTime.parse(q['createdAt']).millisecondsSinceEpoch,
                'updated_at': DateTime.parse(q['updatedAt']).millisecondsSinceEpoch,
              }, conflictAlgorithm: ConflictAlgorithm.replace);
            }
          }

          if (changes['returns']?['updated'] != null) {
            for (final r in (changes['returns']['updated'] as List)) {
              await txn.insert('sales', {
                'id': r['id'],
                'customer_id': r['customerId'],
                'total_amount': double.tryParse(r['totalAmount']?.toString() ?? '0') ?? 0.0,
                'status': 'RETURNED',
                'is_synced': 1,
                'created_at': DateTime.parse(r['createdAt']).millisecondsSinceEpoch,
                'updated_at': DateTime.parse(r['updatedAt']).millisecondsSinceEpoch,
              }, conflictAlgorithm: ConflictAlgorithm.replace);
            }
          }

          if (changes['saleItems']?['updated'] != null) {
            for (final si in (changes['saleItems']['updated'] as List)) {
              await txn.insert('sale_items', {
                'id': si['id'],
                'sale_id': si['saleId'] ?? si['quotationId'] ?? si['returnId'],
                'item_id': si['itemId'],
                'quantity': double.tryParse(si['quantity']?.toString() ?? '1') ?? 1.0,
                'unit_price': double.tryParse(si['unitPrice']?.toString() ?? '0') ?? 0.0,
                'total_price': double.tryParse(si['total']?.toString() ?? '0') ?? 0.0,
              }, conflictAlgorithm: ConflictAlgorithm.replace);
            }
          }

          if (changes['quotationItems']?['updated'] != null) {
            for (final qi in (changes['quotationItems']['updated'] as List)) {
              await txn.insert('sale_items', {
                'id': qi['id'],
                'sale_id': qi['quotationId'],
                'item_id': qi['itemId'],
                'quantity': double.tryParse(qi['quantity']?.toString() ?? '1') ?? 1.0,
                'unit_price': double.tryParse(qi['unitPrice']?.toString() ?? '0') ?? 0.0,
                'total_price': double.tryParse(qi['total']?.toString() ?? '0') ?? 0.0,
              }, conflictAlgorithm: ConflictAlgorithm.replace);
            }
          }

          // 5. Banking
          if (changes['bankAccounts']?['updated'] != null) {
            for (final acc in (changes['bankAccounts']['updated'] as List)) {
              await txn.insert('bank_accounts', {
                'id': acc['id'],
                'name': acc['name'],
                'type': acc['type'],
                'currency': acc['currency'] ?? 'TZS',
                'balance': double.tryParse(acc['currentBalance']?.toString() ?? '0') ?? 0.0,
                'is_active': (acc['isActive'] ?? true) ? 1 : 0,
                'is_synced': 1,
                'updated_at': DateTime.parse(acc['updatedAt']).millisecondsSinceEpoch,
              }, conflictAlgorithm: ConflictAlgorithm.replace);
            }
          }

          if (changes['bankTransactions']?['updated'] != null) {
            for (final tx in (changes['bankTransactions']['updated'] as List)) {
              await txn.insert('bank_transactions', {
                'id': tx['id'],
                'account_id': tx['accountId'],
                'type': tx['type'],
                'amount': double.tryParse(tx['amount']?.toString() ?? '0') ?? 0.0,
                'date': DateTime.parse(tx['transactionDate']).millisecondsSinceEpoch,
                'description': tx['description'] ?? '',
                'reference_type': tx['referenceType'],
                'reference_id': tx['referenceId'],
                'is_synced': 1,
              }, conflictAlgorithm: ConflictAlgorithm.replace);
            }
          }

          // 6. Inventory
          if (changes['stockMovements']?['updated'] != null) {
            for (final sm in (changes['stockMovements']['updated'] as List)) {
              await txn.insert('stock_movements', {
                'id': sm['id'],
                'item_id': sm['itemId'],
                'type': sm['type'],
                'quantity': double.tryParse(sm['quantity']?.toString() ?? '0') ?? 0.0,
                'reference_type': sm['referenceType'],
                'reference_id': sm['referenceId'],
                'notes': sm['notes'] ?? '',
                'is_synced': 1,
                'created_at': DateTime.parse(sm['createdAt']).millisecondsSinceEpoch,
              }, conflictAlgorithm: ConflictAlgorithm.replace);
            }
          }

          // 7. Expenses
          if (changes['expenses']?['updated'] != null) {
            for (final exp in (changes['expenses']['updated'] as List)) {
              await txn.insert('expenses', {
                'id': exp['id'],
                'description': exp['description'],
                'amount': double.tryParse(exp['amount']?.toString() ?? '0') ?? 0.0,
                'date': DateTime.parse(exp['expenseDate']).millisecondsSinceEpoch,
                'category_id': exp['categoryId'],
                'is_synced': 1,
                'updated_at': DateTime.parse(exp['updatedAt']).millisecondsSinceEpoch,
              }, conflictAlgorithm: ConflictAlgorithm.replace);
            }
          }

          // 8. Suppliers & Purchases
          if (changes['suppliers']?['updated'] != null) {
            for (final s in (changes['suppliers']['updated'] as List)) {
              await txn.insert('suppliers', {
                'id': s['id'],
                'full_name': s['fullName'],
                'email': s['email'] ?? '',
                'phone': s['phone'] ?? '',
                'address': s['address'] ?? '',
                'is_synced': 1,
                'updated_at': DateTime.parse(s['updatedAt']).millisecondsSinceEpoch,
              }, conflictAlgorithm: ConflictAlgorithm.replace);
            }
          }

          if (changes['purchases']?['updated'] != null) {
            for (final p in (changes['purchases']['updated'] as List)) {
              await txn.insert('purchases', {
                'id': p['id'],
                'supplier_id': p['supplierId'],
                'total_amount': double.tryParse(p['totalAmount']?.toString() ?? '0') ?? 0.0,
                'status': p['status'] ?? 'COMPLETED',
                'is_synced': 1,
                'created_at': DateTime.parse(p['createdAt']).millisecondsSinceEpoch,
                'updated_at': DateTime.parse(p['updatedAt']).millisecondsSinceEpoch,
              }, conflictAlgorithm: ConflictAlgorithm.replace);
            }
          }

          if (changes['purchaseItems']?['updated'] != null) {
            for (final pi in (changes['purchaseItems']['updated'] as List)) {
              await txn.insert('purchase_items', {
                'id': pi['id'],
                'purchase_id': pi['purchaseOrderId'],
                'item_id': pi['itemId'],
                'quantity': pi['quantity'],
                'unit_price': double.tryParse(pi['unitCost']?.toString() ?? '0') ?? 0.0,
                'total_price': double.tryParse(pi['totalCost']?.toString() ?? '0') ?? 0.0,
              }, conflictAlgorithm: ConflictAlgorithm.replace);
            }
          }

          if (changes['payments']?['updated'] != null) {
            for (final p in (changes['payments']['updated'] as List)) {
              await txn.insert('invoice_payments', {
                'id': p['id'],
                'invoice_id': p['saleId'],
                'amount': double.tryParse(p['amount']?.toString() ?? '0') ?? 0.0,
                'payment_method': p['method'] ?? 'CASH',
                'created_at': DateTime.parse(p['createdAt']).millisecondsSinceEpoch,
                'is_synced': 1,
              }, conflictAlgorithm: ConflictAlgorithm.replace);
            }
          }

          // ... (Process other modules as needed: Purchases, Suppliers, Leaves, etc.)
        });
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
      final List<String> syncableTables = [
        'items', 'customers', 'sales', 'expenses', 'bank_transactions', 
        'stock_movements', 'invoice_payments', 'hr_leaves', 'suppliers', 'purchases'
      ];

      Map<String, dynamic> changes = {};

      for (final table in syncableTables) {
        final unsynced = await _db.db.query(table, where: 'is_synced = 0');
        final deleted = await _db.db.query(table, where: 'is_deleted = 1');

        if (unsynced.isEmpty && deleted.isEmpty) continue;

        String key = _getApiKeyForTable(table);
        changes[key] = {
          'created': await _preparePushData(table, unsynced),
          'deleted': deleted.map((d) => d['id'].toString()).toList(),
        };
      }

      if (changes.isEmpty) return true;

      final response = await http.post(
        Uri.parse('$_apiUrl/sync/push'),
        headers: {
          'Authorization': 'Bearer $token',
          'Content-Type': 'application/json',
        },
        body: jsonEncode({'changes': changes}),
      );

      if (response.statusCode != 200) {
        throw Exception('Sync push failed: ${response.statusCode} ${response.body}');
      }

      // Cleanup after successful push
      await _db.db.transaction((txn) async {
        for (final table in syncableTables) {
          // Mark as synced
          await txn.update(table, {'is_synced': 1}, where: 'is_synced = 0');
          // Actually delete records marked for deletion
          await txn.delete(table, where: 'is_deleted = 1');
        }
      });

      return true;
    } catch (e) {
      print('[Sync] Push error: $e');
      return false;
    }
  }

  String _getApiKeyForTable(String table) {
    switch (table) {
      case 'bank_transactions': return 'bankTransactions';
      case 'stock_movements': return 'stockMovements';
      case 'invoice_payments': return 'payments';
      case 'hr_leaves': return 'leaves';
      default: return table;
    }
  }

  Future<List<Map<String, dynamic>>> _preparePushData(String table, List<Map<String, dynamic>> data) async {
    List<Map<String, dynamic>> result = [];
    for (final row in data) {
      Map<String, dynamic> item = Map<String, dynamic>.from(row);
      
      // Entity-specific formatting
      if (table == 'sales' || table == 'purchases') {
        final lineItemsTable = table == 'sales' ? 'sale_items' : 'purchase_items';
        final lineItems = await _db.db.query(lineItemsTable, where: '${table.substring(0, table.length-1)}_id = ?', whereArgs: [row['id']]);
        item['lineItems'] = lineItems.map((li) => {
          'id': li['id'],
          'itemId': li['item_id'],
          'quantity': li['quantity'],
          'unitPrice': li['unit_price'],
          'totalPrice': li['total_price'],
        }).toList();
        
        item['createdAt'] = DateTime.fromMillisecondsSinceEpoch(row['created_at'] as int).toIso8601String();
        item['updatedAt'] = DateTime.fromMillisecondsSinceEpoch(row['updated_at'] as int).toIso8601String();
      } else if (table == 'expenses') {
        item['date'] = DateTime.fromMillisecondsSinceEpoch(row['date'] as int).toIso8601String();
      } else if (table == 'bank_transactions') {
        item['date'] = DateTime.fromMillisecondsSinceEpoch(row['date'] as int).toIso8601String();
      } else if (table == 'stock_movements') {
        item['createdAt'] = DateTime.fromMillisecondsSinceEpoch(row['created_at'] as int).toIso8601String();
      } else if (table == 'invoice_payments') {
        item['createdAt'] = DateTime.fromMillisecondsSinceEpoch(row['created_at'] as int).toIso8601String();
        item['invoiceId'] = row['invoice_id'];
        item['paymentMethod'] = row['payment_method'];
      }

      result.add(item);
    }
    return result;
  }
}
