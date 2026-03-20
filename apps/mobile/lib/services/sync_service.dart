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

        // Sales (Invoices/Quotes/Returns)
        if (changes['sales']?['updated'] != null) {
            for (final sale in (changes['sales']['updated'] as List)) {
                await _db.insertSale({
                    'id': sale['id'],
                    'customer_id': sale['customerId'],
                    'total_amount': double.tryParse(sale['totalAmount']?.toString() ?? '0') ?? 0.0,
                    'status': sale['status'] ?? (sale['paymentStatus'] == 'PAID' ? 'COMPLETED' : 'INVOICED'),
                    'is_synced': 1,
                    'created_at': DateTime.parse(sale['createdAt']).millisecondsSinceEpoch,
                    'updated_at': DateTime.parse(sale['updatedAt']).millisecondsSinceEpoch,
                });
            }
        }

        // Quotations
        if (changes['quotations']?['updated'] != null) {
            for (final quote in (changes['quotations']['updated'] as List)) {
                await _db.insertSale({
                    'id': quote['id'],
                    'customer_id': quote['customerId'],
                    'total_amount': double.tryParse(quote['totalAmount']?.toString() ?? '0') ?? 0.0,
                    'status': 'QUOTATION',
                    'is_synced': 1,
                    'created_at': DateTime.parse(quote['createdAt']).millisecondsSinceEpoch,
                    'updated_at': DateTime.parse(quote['updatedAt']).millisecondsSinceEpoch,
                });
            }
        }

        if (changes['quotationItems']?['updated'] != null) {
            final qi = (changes['quotationItems']['updated'] as List).map((i) => {
                'id': i['id'],
                'sale_id': i['quotationId'],
                'item_id': i['itemId'],
                'quantity': double.tryParse(i['quantity']?.toString() ?? '1') ?? 1.0,
                'unit_price': double.tryParse(i['unitPrice']?.toString() ?? '0') ?? 0.0,
                'total_price': double.tryParse(i['total']?.toString() ?? '0') ?? 0.0,
            }).toList();
            await _db.upsertSaleItems(qi);
        }

        // Returns
        if (changes['returns']?['updated'] != null) {
            for (final ret in (changes['returns']['updated'] as List)) {
                await _db.insertSale({
                    'id': ret['id'],
                    'customer_id': ret['customerId'],
                    'total_amount': double.tryParse(ret['totalAmount']?.toString() ?? '0') ?? 0.0,
                    'status': 'RETURNED',
                    'is_synced': 1,
                    'created_at': DateTime.parse(ret['createdAt']).millisecondsSinceEpoch,
                    'updated_at': DateTime.parse(ret['updatedAt']).millisecondsSinceEpoch,
                });
            }
        }

        if (changes['returnItems']?['updated'] != null) {
            final ri = (changes['returnItems']['updated'] as List).map((i) => {
                'id': i['id'],
                'sale_id': i['returnId'],
                'item_id': i['itemId'],
                'quantity': double.tryParse(i['quantity']?.toString() ?? '1') ?? 1.0,
                'unit_price': double.tryParse(i['unitPrice']?.toString() ?? '0') ?? 0.0,
                'total_price': double.tryParse(i['total']?.toString() ?? '0') ?? 0.0,
            }).toList();
            await _db.upsertSaleItems(ri);
        }

        // Payments
        if (changes['payments']?['updated'] != null) {
            final pmts = (changes['payments']['updated'] as List).map((p) => {
                'id': p['id'],
                'invoice_id': p['saleId'],
                'amount': double.tryParse(p['amount']?.toString() ?? '0') ?? 0.0,
                'payment_method': p['method'] ?? 'CASH',
                'created_at': DateTime.parse(p['createdAt']).millisecondsSinceEpoch,
                'is_synced': 1,
            }).toList();
            await _db.upsertPayments(pmts);
        }

        // Sale Items
        if (changes['saleItems']?['updated'] != null) {
            final saleItems = (changes['saleItems']['updated'] as List).map((si) => {
                'id': si['id'],
                'sale_id': si['saleId'],
                'item_id': si['itemId'],
                'quantity': double.tryParse(si['quantity']?.toString() ?? '1') ?? 1.0,
                'unit_price': double.tryParse(si['unitPrice']?.toString() ?? '0') ?? 0.0,
                'total_price': double.tryParse(si['total']?.toString() ?? '0') ?? 0.0,
            }).toList();
            await _db.upsertSaleItems(saleItems);
        }

        // Leaves
        if (changes['leaves']?['updated'] != null) {
            final leaves = (changes['leaves']['updated'] as List).map((l) => {
                'id': l['id'],
                'employee_id': l['employeeId'],
                'type': l['type'],
                'start_date': DateTime.parse(l['startDate']).millisecondsSinceEpoch,
                'end_date': DateTime.parse(l['endDate']).millisecondsSinceEpoch,
                'reason': l['reason'] ?? '',
                'status': l['status'] ?? 'PENDING',
                'is_synced': 1,
                'updated_at': DateTime.parse(l['updatedAt']).millisecondsSinceEpoch,
            }).toList();
            await _db.upsertLeaves(leaves);
        }

        // Payslips
        if (changes['payslips']?['updated'] != null) {
            final slips = (changes['payslips']['updated'] as List).map((s) => {
                'id': s['id'],
                'employee_id': s['employeeId'],
                'period_start': s['periodStart'] ? DateTime.parse(s['periodStart']).millisecondsSinceEpoch : 0,
                'period_end': s['periodEnd'] ? DateTime.parse(s['periodEnd']).millisecondsSinceEpoch : 0,
                'net_pay': double.tryParse(s['netPay']?.toString() ?? '0') ?? 0.0,
                'pdf_url': s['pdfUrl'] ?? '',
                'status': s['status'] ?? 'PAID',
                'is_synced': 1,
                'updated_at': DateTime.parse(s['updatedAt'] ?? DateTime.now().toIso8601String()).millisecondsSinceEpoch,
            }).toList();
            await _db.upsertPayslips(slips);
        }

        // Suppliers
        if (changes['suppliers']?['updated'] != null) {
            final suppliers = (changes['suppliers']['updated'] as List).map((s) => {
                'id': s['id'],
                'full_name': s['fullName'],
                'email': s['email'] ?? '',
                'phone': s['phone'] ?? '',
                'address': s['address'] ?? '',
                'is_synced': 1,
                'updated_at': DateTime.parse(s['updatedAt']).millisecondsSinceEpoch,
            }).toList();
            await _db.upsertSuppliers(suppliers);
        }

        // Purchases
        if (changes['purchases']?['updated'] != null) {
            final purchases = (changes['purchases']['updated'] as List).map((p) => {
                'id': p['id'],
                'supplier_id': p['supplierId'],
                'total_amount': double.tryParse(p['totalAmount']?.toString() ?? '0') ?? 0.0,
                'status': p['status'] ?? 'COMPLETED',
                'is_synced': 1,
                'created_at': DateTime.parse(p['createdAt']).millisecondsSinceEpoch,
                'updated_at': DateTime.parse(p['updatedAt']).millisecondsSinceEpoch,
            }).toList();
            await _db.upsertPurchases(purchases);
        }

        if (changes['purchaseItems']?['updated'] != null) {
            final pi = (changes['purchaseItems']['updated'] as List).map((i) => {
                'id': i['id'],
                'purchase_id': i['purchaseOrderId'],
                'item_id': i['itemId'],
                'quantity': i['quantity'],
                'unit_price': double.tryParse(i['unitCost']?.toString() ?? '0') ?? 0.0,
                'total_price': double.tryParse(i['totalCost']?.toString() ?? '0') ?? 0.0,
            }).toList();
            await _db.upsertPurchaseItems(pi);
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
      final unsyncedSales = await _db.db.query('sales', where: 'is_synced = 0');
      final unsyncedExpenses = await _db.db.query('expenses', where: 'is_synced = 0');
      final unsyncedCustomers = await _db.db.query('customers', where: 'is_synced = 0');
      final unsyncedItems = await _db.db.query('items', where: 'is_synced = 0');
      final unsyncedPayments = await _db.db.query('invoice_payments', where: 'is_synced = 0');
      final unsyncedLeaves = await _db.db.query('hr_leaves', where: 'is_synced = 0');
      final unsyncedSuppliers = await _db.db.query('suppliers', where: 'is_synced = 0');
      final unsyncedPurchases = await _db.db.query('purchases', where: 'is_synced = 0');

      if (unsyncedSales.isEmpty && unsyncedExpenses.isEmpty && 
          unsyncedCustomers.isEmpty && unsyncedItems.isEmpty && 
          unsyncedPayments.isEmpty && unsyncedLeaves.isEmpty &&
          unsyncedSuppliers.isEmpty && unsyncedPurchases.isEmpty) {
        return true; 
      }

      final List<Map<String, dynamic>> salesWithItems = [];
      final List<Map<String, dynamic>> quotesWithItems = [];
      final List<Map<String, dynamic>> returnsWithItems = [];

      for (final s in unsyncedSales) {
          final items = await _db.db.query('sale_items', where: 'sale_id = ?', whereArgs: [s['id']]);
          final fullObj = {
              ...s,
              'lineItems': items.map((i) => {
                  'id': i['id'],
                  'itemId': i['item_id'],
                  'quantity': i['quantity'],
                  'unitPrice': i['unit_price'],
                  'totalPrice': i['total_price'],
              }).toList(),
          };
          if (s['status'] == 'QUOTATION') {
            quotesWithItems.add(fullObj);
          } else if (s['status'] == 'RETURNED') {
            returnsWithItems.add(fullObj);
          } else {
            salesWithItems.add(fullObj);
          }
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
            'created': salesWithItems.map((s) => {
              'id': s['id'],
              'status': s['status'] ?? 'COMPLETED',
              'customerId': s['customer_id'],
              'totalAmount': s['total_amount'],
              'createdAt': DateTime.fromMillisecondsSinceEpoch(s['created_at'] as int).toIso8601String(),
              'updatedAt': DateTime.fromMillisecondsSinceEpoch(s['updated_at'] as int).toIso8601String(),
              'lineItems': s['lineItems'],
            }).toList(),
          },
          'quotations': {
            'created': quotesWithItems.map((s) => {
              'id': s['id'],
              'customerId': s['customer_id'],
              'totalAmount': s['total_amount'],
              'createdAt': DateTime.fromMillisecondsSinceEpoch(s['created_at'] as int).toIso8601String(),
              'updatedAt': DateTime.fromMillisecondsSinceEpoch(s['updated_at'] as int).toIso8601String(),
              'lineItems': s['lineItems'],
            }).toList(),
          },
          'returns': {
            'created': returnsWithItems.map((s) => {
              'id': s['id'],
              'customerId': s['customer_id'],
              'saleId': s['id'],
              'totalAmount': s['total_amount'],
              'createdAt': DateTime.fromMillisecondsSinceEpoch(s['created_at'] as int).toIso8601String(),
              'updatedAt': DateTime.fromMillisecondsSinceEpoch(s['updated_at'] as int).toIso8601String(),
              'lineItems': s['lineItems'],
            }).toList(),
          },
          'payments': {
            'created': unsyncedPayments.map((p) => {
              'id': p['id'],
              'invoiceId': p['invoice_id'],
              'amount': p['amount'],
              'paymentMethod': p['payment_method'],
              'createdAt': DateTime.fromMillisecondsSinceEpoch(p['created_at'] as int).toIso8601String(),
            }).toList(),
          },
          'expenses': {
            'created': unsyncedExpenses.map((e) => {
              'id': e['id'],
              'description': e['description'],
              'amount': e['amount'],
              'categoryId': e['category_id'],
              'date': DateTime.fromMillisecondsSinceEpoch(e['date'] as int).toIso8601String(),
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
          },
          'leaves': {
            'created': unsyncedLeaves.map((l) => {
              'id': l['id'],
              'employeeId': l['employee_id'],
              'type': l['type'],
              'startDate': DateTime.fromMillisecondsSinceEpoch(l['start_date'] as int).toIso8601String(),
              'endDate': DateTime.fromMillisecondsSinceEpoch(l['end_date'] as int).toIso8601String(),
              'reason': l['reason'],
            }).toList(),
          },
          'suppliers': {
            'created': unsyncedSuppliers.map((s) => {
              'id': s['id'],
              'fullName': s['full_name'],
              'email': s['email'],
              'phone': s['phone'],
              'address': s['address'],
            }).toList(),
          },
          'purchases': {
            'created': await Future.wait(unsyncedPurchases.map((p) async {
              final items = await _db.db.query('purchase_items', where: 'purchase_id = ?', whereArgs: [p['id']]);
              return {
                'id': p['id'],
                'supplierId': p['supplier_id'],
                'totalAmount': p['total_amount'],
                'status': p['status'],
                'createdAt': DateTime.fromMillisecondsSinceEpoch(p['created_at'] as int).toIso8601String(),
                'updatedAt': DateTime.fromMillisecondsSinceEpoch(p['updated_at'] as int).toIso8601String(),
                'lineItems': items.map((i) => {
                  'id': i['id'],
                  'itemId': i['item_id'],
                  'quantity': i['quantity'],
                  'unitPrice': i['unit_price'],
                  'totalPrice': i['total_price'],
                }).toList(),
              };
            })),
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
      for (final p in unsyncedPayments) {
        await _db.db.update('invoice_payments', {'is_synced': 1}, where: 'id = ?', whereArgs: [p['id']]);
      }
      for (final l in unsyncedLeaves) {
        await _db.db.update('hr_leaves', {'is_synced': 1}, where: 'id = ?', whereArgs: [l['id']]);
      }
      for (final s in unsyncedSuppliers) {
        await _db.db.update('suppliers', {'is_synced': 1}, where: 'id = ?', whereArgs: [s['id']]);
      }
      for (final p in unsyncedPurchases) {
        await _db.db.update('purchases', {'is_synced': 1}, where: 'id = ?', whereArgs: [p['id']]);
      }

      return true;
    } catch (e) {
      print('[Sync] Push error: $e');
      return false;
    }
  }
}
