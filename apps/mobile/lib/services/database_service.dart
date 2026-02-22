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
      version: 3,
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
            updated_at INTEGER DEFAULT 0
          )
        ''');

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
            updated_at INTEGER DEFAULT 0,
            FOREIGN KEY (category_id) REFERENCES expense_categories (id)
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

  Future<List<Map<String, dynamic>>> query(String table, {String? where, List<Object?>? whereArgs, String? orderBy}) async {
    return await db.query(table, where: where, whereArgs: whereArgs, orderBy: orderBy);
  }
}
