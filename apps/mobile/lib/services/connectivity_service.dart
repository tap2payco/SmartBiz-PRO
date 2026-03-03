import 'dart:async';
import 'package:flutter/foundation.dart';
import 'package:connectivity_plus/connectivity_plus.dart';
import 'database_service.dart';
import 'sync_service.dart';
import 'auth_service.dart';

class ConnectivityService extends ChangeNotifier {
  final DatabaseService _db;
  final AuthService _auth;
  late final StreamSubscription<List<ConnectivityResult>> _subscription;
  bool _isOnline = false;
  bool _isSyncing = false;

  bool get isOnline => _isOnline;
  bool get isSyncing => _isSyncing;

  ConnectivityService(this._db, this._auth) {
    _subscription = Connectivity().onConnectivityChanged.listen(_onConnectivityChanged);
    _checkInitial();
  }

  Future<void> _checkInitial() async {
    final result = await Connectivity().checkConnectivity();
    _onConnectivityChanged(result);
  }

  void _onConnectivityChanged(List<ConnectivityResult> results) {
    final wasOffline = !_isOnline;
    _isOnline = results.any((r) => r != ConnectivityResult.none);
    notifyListeners();

    // Auto-sync when coming back online
    if (_isOnline && wasOffline) {
      autoSync();
    }
  }

  Future<bool> autoSync() async {
    if (!_isOnline || _isSyncing) return false;
    final token = _auth.accessToken;
    if (token == null) return false;

    _isSyncing = true;
    notifyListeners();

    final sync = SyncService(_db);
    try {
      await sync.pushData(token);
      await sync.pullData(token);
      _isSyncing = false;
      notifyListeners();
      return true;
    } catch (e) {
      debugPrint('[ConnectivityService] Auto-sync error: $e');
      _isSyncing = false;
      notifyListeners();
      return false;
    }
  }

  @override
  void dispose() {
    _subscription.cancel();
    super.dispose();
  }
}
