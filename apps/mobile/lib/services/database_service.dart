import 'package:sqflite/sqflite.dart';
import 'package:path/path.dart';

class DatabaseService {
  static Database? _db;

  Database get db {
    if (_db == null) throw Exception('Database not initialized');
    return _db!;
  }

  Future<void> init() async {
    final dbPath = await getDatabasesPath();
    final path = join(dbPath, 'smartbiz.db');

    _db = await openDatabase(
      path,
      version: 8,
      onCreate: (db, version) async {
        await db.execute('''
          CREATE TABLE IF NOT EXISTS items (
            id TEXT PRIMARY KEY,
            name TEXT NOT NULL,
            sku TEXT,
            barcode TEXT,
            cost_price REAL DEFAULT 0,
            selling_price REAL DEFAULT 0,
            description TEXT,
            category_id TEXT,
            is_active INTEGER DEFAULT 1,
            stock_level INTEGER DEFAULT 0,
            is_synced INTEGER DEFAULT 0,
            updated_at INTEGER DEFAULT 0
          )
        ''');

        // ... existing tables ...
        await db.execute('''
          CREATE TABLE IF NOT EXISTS categories (
            id TEXT PRIMARY KEY,
            name TEXT NOT NULL,
            description TEXT,
            updated_at INTEGER DEFAULT 0
          )
        ''');

        await db.execute('''
          CREATE TABLE IF NOT EXISTS customers (
            id TEXT PRIMARY KEY,
            full_name TEXT NOT NULL,
            email TEXT,
            phone TEXT,
            address TEXT,
            loyalty_points INTEGER DEFAULT 0,
            is_synced INTEGER DEFAULT 0,
            updated_at INTEGER DEFAULT 0
          )
        ''');

        await db.execute('''
          CREATE TABLE IF NOT EXISTS sales (
            id TEXT PRIMARY KEY,
            customer_id TEXT,
            total_amount REAL DEFAULT 0,
            status TEXT DEFAULT 'COMPLETED',
            payment_type TEXT DEFAULT 'CASH',
            is_synced INTEGER DEFAULT 0,
            created_at INTEGER DEFAULT 0,
            updated_at INTEGER DEFAULT 0
          )
        ''');

        await db.execute('''
          CREATE TABLE IF NOT EXISTS sale_items (
            id TEXT PRIMARY KEY,
            sale_id TEXT NOT NULL,
            item_id TEXT NOT NULL,
            quantity INTEGER DEFAULT 0,
            unit_price REAL DEFAULT 0,
            total_price REAL DEFAULT 0,
            FOREIGN KEY (sale_id) REFERENCES sales (id) ON DELETE CASCADE
          )
        ''');

        await db.execute('''
          CREATE TABLE IF NOT EXISTS invoice_payments (
            id TEXT PRIMARY KEY,
            invoice_id TEXT NOT NULL,
            amount REAL DEFAULT 0,
            payment_method TEXT,
            receipt_url TEXT,
            created_at INTEGER DEFAULT 0,
            is_synced INTEGER DEFAULT 0,
            FOREIGN KEY (invoice_id) REFERENCES sales (id) ON DELETE CASCADE
          )
        ''');

        await db.execute('''
          CREATE TABLE IF NOT EXISTS projects (
            id TEXT PRIMARY KEY,
            name TEXT NOT NULL,
            description TEXT,
            status TEXT DEFAULT 'ACTIVE',
            updated_at INTEGER DEFAULT 0
          )
        ''');

        await db.execute('''
          CREATE TABLE IF NOT EXISTS expense_categories (
            id TEXT PRIMARY KEY,
            name TEXT NOT NULL,
            updated_at INTEGER DEFAULT 0
          )
        ''');

        await db.execute('''
          CREATE TABLE IF NOT EXISTS expenses (
            id TEXT PRIMARY KEY,
            description TEXT NOT NULL,
            amount REAL DEFAULT 0,
            date INTEGER NOT NULL,
            category_id TEXT,
            receipt_path TEXT,
            is_synced INTEGER DEFAULT 0,
            updated_at INTEGER DEFAULT 0,
            FOREIGN KEY (category_id) REFERENCES expense_categories (id)
          )
        ''');

        await db.execute('''
          CREATE TABLE IF NOT EXISTS hr_leaves (
            id TEXT PRIMARY KEY,
            employee_id TEXT NOT NULL,
            type TEXT NOT NULL,
            start_date INTEGER NOT NULL,
            end_date INTEGER NOT NULL,
            reason TEXT,
            status TEXT DEFAULT 'PENDING',
            is_synced INTEGER DEFAULT 0,
            updated_at INTEGER DEFAULT 0
          )
        ''');

        await db.execute('''
          CREATE TABLE IF NOT EXISTS payroll_payslips (
            id TEXT PRIMARY KEY,
            employee_id TEXT NOT NULL,
            period_start INTEGER NOT NULL,
            period_end INTEGER NOT NULL,
            net_pay REAL DEFAULT 0,
            pdf_url TEXT,
            status TEXT DEFAULT 'PAID',
            is_synced INTEGER DEFAULT 1,
            updated_at INTEGER DEFAULT 0
          )
        ''');

        await db.execute('''
          CREATE TABLE IF NOT EXISTS suppliers (
            id TEXT PRIMARY KEY,
            full_name TEXT NOT NULL,
            email TEXT,
            phone TEXT,
            address TEXT,
            is_synced INTEGER DEFAULT 0,
            updated_at INTEGER DEFAULT 0
          )
        ''');

        await db.execute('''
          CREATE TABLE IF NOT EXISTS purchases (
            id TEXT PRIMARY KEY,
            supplier_id TEXT,
            total_amount REAL DEFAULT 0,
            status TEXT DEFAULT 'COMPLETED',
            payment_type TEXT DEFAULT 'CASH',
            is_synced INTEGER DEFAULT 0,
            created_at INTEGER DEFAULT 0,
            updated_at INTEGER DEFAULT 0
          )
        ''');

        await db.execute('''
          CREATE TABLE IF NOT EXISTS purchase_items (
            id TEXT PRIMARY KEY,
            purchase_id TEXT NOT NULL,
            item_id TEXT NOT NULL,
            quantity INTEGER DEFAULT 0,
            unit_price REAL DEFAULT 0,
            total_price REAL DEFAULT 0,
            FOREIGN KEY (purchase_id) REFERENCES purchases (id) ON DELETE CASCADE
          )
        ''');

        await db.execute('''
          CREATE TABLE IF NOT EXISTS sync_meta (
            key TEXT PRIMARY KEY,
            value TEXT
          )
        ''');
      },
      onUpgrade: (db, oldVersion, newVersion) async {
        if (oldVersion < 2) {
          await db.execute('CREATE TABLE IF NOT EXISTS sale_items (id TEXT PRIMARY KEY, sale_id TEXT, item_id TEXT, quantity INTEGER, unit_price REAL, total_price REAL)');
          await db.execute('CREATE TABLE IF NOT EXISTS invoice_payments (id TEXT PRIMARY KEY, invoice_id TEXT, amount REAL, payment_method TEXT, receipt_url TEXT, created_at INTEGER)');
          await db.execute('CREATE TABLE IF NOT EXISTS projects (id TEXT PRIMARY KEY, name TEXT, description TEXT, status TEXT, updated_at INTEGER)');
        }
        if (oldVersion < 3) {
          await db.execute('CREATE TABLE IF NOT EXISTS expense_categories (id TEXT PRIMARY KEY, name TEXT, updated_at INTEGER)');
          await db.execute('CREATE TABLE IF NOT EXISTS expenses (id TEXT PRIMARY KEY, description TEXT, amount REAL, date INTEGER, category_id TEXT, receipt_path TEXT, updated_at INTEGER)');
        }
        if (oldVersion < 4) {
          try {
            await db.execute('ALTER TABLE sales ADD COLUMN is_synced INTEGER DEFAULT 0');
            await db.execute('ALTER TABLE expenses ADD COLUMN is_synced INTEGER DEFAULT 0');
            await db.execute('ALTER TABLE customers ADD COLUMN is_synced INTEGER DEFAULT 0');
          } catch (e) {
            // Column may already exist
          }
        }
        if (oldVersion < 5) {
          try {
            await db.execute('ALTER TABLE items ADD COLUMN is_synced INTEGER DEFAULT 0');
          } catch (e) {
            // Column may already exist
          }
        }
      },
    );
  }

  // ... (preserving other methods)

  Future<List<Map<String, dynamic>>> getExpenses() async {
    return await db.query('expenses', orderBy: 'date DESC');
  }

  Future<void> insertExpense(Map<String, dynamic> expense) async {
    await db.insert('expenses', expense, conflictAlgorithm: ConflictAlgorithm.replace);
  }

  // Items
  Future<List<Map<String, dynamic>>> getItems() async {
    return await db.query('items', where: 'is_active = 1', orderBy: 'name ASC');
  }

  Future<List<Map<String, dynamic>>> searchItems(String query) async {
    return await db.query(
      'items',
      where: 'is_active = 1 AND (name LIKE ? OR sku LIKE ?)',
      whereArgs: ['%$query%', '%$query%'],
      orderBy: 'name ASC',
    );
  }

  Future<Map<String, dynamic>?> getItemByBarcode(String barcode) async {
    final results = await db.query(
      'items',
      where: 'barcode = ? OR sku = ?',
      whereArgs: [barcode, barcode],
      limit: 1,
    );
    return results.isNotEmpty ? results.first : null;
  }

  // Customers
  Future<List<Map<String, dynamic>>> getCustomers() async {
    return await db.query('customers', orderBy: 'full_name ASC');
  }

  Future<void> insertCustomer(Map<String, dynamic> customer) async {
    await db.insert('customers', customer, conflictAlgorithm: ConflictAlgorithm.replace);
  }

  // Sales & Items
  Future<List<Map<String, dynamic>>> getSales() async {
    return await db.query('sales', where: "status = 'COMPLETED'", orderBy: 'created_at DESC');
  }

  Future<List<Map<String, dynamic>>> getQuotes() async {
    return await db.query('sales', where: "status = 'QUOTATION'", orderBy: 'created_at DESC');
  }

  Future<List<Map<String, dynamic>>> getInvoices() async {
    return await db.query('sales', where: "status = 'INVOICED' OR status = 'PARTIAL' OR status = 'PAID'", orderBy: 'created_at DESC');
  }

  Future<List<Map<String, dynamic>>> getReturns() async {
    return await db.query('sales', where: "status = 'RETURNED'", orderBy: 'created_at DESC');
  }

  Future<Map<String, dynamic>?> getSaleById(String id) async {
    final results = await db.query('sales', where: 'id = ?', whereArgs: [id], limit: 1);
    return results.isNotEmpty ? results.first : null;
  }

  Future<List<Map<String, dynamic>>> getSaleItems(String saleId) async {
    return await db.query('sale_items', where: 'sale_id = ?', whereArgs: [saleId]);
  }

  Future<List<Map<String, dynamic>>> getInvoicePayments(String invoiceId) async {
    return await db.query('invoice_payments', where: 'invoice_id = ?', whereArgs: [invoiceId]);
  }

  // Sync Meta
  Future<String?> getSyncMeta(String key) async {
    final results = await db.query('sync_meta', where: 'key = ?', whereArgs: [key]);
    return results.isNotEmpty ? results.first['value'] as String? : null;
  }

  Future<void> setSyncMeta(String key, String value) async {
    await db.insert('sync_meta', {'key': key, 'value': value},
        conflictAlgorithm: ConflictAlgorithm.replace);
  }

  // Batch upsert for sync
  Future<void> upsertItems(List<Map<String, dynamic>> items) async {
    final batch = db.batch();
    for (final item in items) {
      batch.insert('items', item, conflictAlgorithm: ConflictAlgorithm.replace);
    }
    await batch.commit(noResult: true);
  }

  Future<void> upsertCategories(List<Map<String, dynamic>> categories) async {
    final batch = db.batch();
    for (final cat in categories) {
      batch.insert('categories', cat, conflictAlgorithm: ConflictAlgorithm.replace);
    }
    await batch.commit(noResult: true);
  }

  Future<void> upsertCustomers(List<Map<String, dynamic>> customers) async {
    final batch = db.batch();
    for (final cust in customers) {
      batch.insert('customers', cust, conflictAlgorithm: ConflictAlgorithm.replace);
    }
    await batch.commit(noResult: true);
  }

  Future<void> upsertSaleItems(List<Map<String, dynamic>> items) async {
    final batch = db.batch();
    for (var item in items) {
      batch.insert('sale_items', item, conflictAlgorithm: ConflictAlgorithm.replace);
    }
    await batch.commit(noResult: true);
  }

  Future<void> upsertPayments(List<Map<String, dynamic>> payments) async {
    final batch = db.batch();
    for (var payment in payments) {
      batch.insert('invoice_payments', payment, conflictAlgorithm: ConflictAlgorithm.replace);
    }
    await batch.commit(noResult: true);
  }

  Future<void> upsertLeaves(List<Map<String, dynamic>> leaves) async {
    final batch = db.batch();
    for (var leave in leaves) {
      batch.insert('hr_leaves', leave, conflictAlgorithm: ConflictAlgorithm.replace);
    }
    await batch.commit(noResult: true);
  }

  Future<void> upsertPayslips(List<Map<String, dynamic>> slips) async {
    final batch = db.batch();
    for (var slip in slips) {
      batch.insert('payroll_payslips', slip, conflictAlgorithm: ConflictAlgorithm.replace);
    }
    await batch.commit(noResult: true);
  }

  Future<void> upsertSuppliers(List<Map<String, dynamic>> suppliers) async {
    final batch = db.batch();
    for (var sup in suppliers) {
      batch.insert('suppliers', sup, conflictAlgorithm: ConflictAlgorithm.replace);
    }
    await batch.commit(noResult: true);
  }

  Future<void> upsertPurchases(List<Map<String, dynamic>> purchases) async {
    final batch = db.batch();
    for (var pur in purchases) {
      batch.insert('purchases', pur, conflictAlgorithm: ConflictAlgorithm.replace);
    }
    await batch.commit(noResult: true);
  }

  Future<void> upsertPurchaseItems(List<Map<String, dynamic>> items) async {
    final batch = db.batch();
    for (var item in items) {
      batch.insert('purchase_items', item, conflictAlgorithm: ConflictAlgorithm.replace);
    }
    await batch.commit(noResult: true);
  }

  // Generic Insert
  Future<bool> insertItem(Map<String, dynamic> item) async {
    try {
      await db.insert('items', item, conflictAlgorithm: ConflictAlgorithm.replace);
      return true;
    } catch (e) {
      return false;
    }
  }

  Future<bool> insertSale(Map<String, dynamic> sale) async {
    try {
      await db.insert('sales', sale, conflictAlgorithm: ConflictAlgorithm.replace);
      return true;
    } catch (e) {
      return false;
    }
  }

  Future<Map<String, dynamic>> getAnalysisData() async {
    final now = DateTime.now();
    final startOfMonth = DateTime(now.year, now.month, 1).millisecondsSinceEpoch;

    final revenue = await db.rawQuery(
      'SELECT SUM(total_amount) as total FROM sales WHERE created_at >= ? AND status != "QUOTATION"',
      [startOfMonth],
    );

    final expenses = await db.rawQuery(
      'SELECT SUM(amount) as total FROM expenses WHERE date >= ?',
      [startOfMonth],
    );

    return {
      'revenue': revenue.first['total'] ?? 0.0,
      'expenses': expenses.first['total'] ?? 0.0,
      'profit': (revenue.first['total'] as double? ?? 0.0) - (expenses.first['total'] as double? ?? 0.0),
    };
  }

  Future<List<Map<String, dynamic>>> query(String table, {String? where, List<Object?>? whereArgs, String? orderBy}) async {
    return await db.query(table, where: where, whereArgs: whereArgs, orderBy: orderBy);
  }

  Future<void> clearAllData() async {
    final batch = db.batch();
    batch.delete('items');
    batch.delete('categories');
    batch.delete('customers');
    batch.delete('sales');
    batch.delete('sale_items');
    batch.delete('invoice_payments');
    batch.delete('expenses');
    batch.delete('expense_categories');
    batch.delete('sync_meta');
    await batch.commit(noResult: true);
  }
}
