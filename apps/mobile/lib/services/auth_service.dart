import 'package:flutter/material.dart';
import 'package:supabase_flutter/supabase_flutter.dart';

class AuthService extends ChangeNotifier {
  User? _user;
  bool _loading = false;

  User? get user => _user;
  bool get isAuthenticated => _user != null;
  bool get loading => _loading;
  String get email => _user?.email ?? '';

  final _supabase = Supabase.instance.client;

  String _organizationName = 'SmartBiz Pro';
  String get organizationName => _organizationName;

  AuthService() {
    _user = _supabase.auth.currentUser;
    _fetchOrgInfo();
    _supabase.auth.onAuthStateChange.listen((data) {
      _user = data.session?.user;
      if (_user != null) _fetchOrgInfo();
      notifyListeners();
    });
  }

  Future<void> _fetchOrgInfo() async {
    if (_user == null) return;
    try {
      final profile = await _supabase
          .from('profiles')
          .select('organization_id')
          .eq('user_id', _user!.id)
          .single();
      
      final org = await _supabase
          .from('organizations')
          .select('name')
          .eq('id', profile['organization_id'])
          .single();
      
      _organizationName = org['name'];
      notifyListeners();
    } catch (e) {
      debugPrint('Error fetching org info: $e');
    }
  }

  Future<String?> signIn(String email, String password) async {
    _loading = true;
    notifyListeners();

    try {
      await _supabase.auth.signInWithPassword(
        email: email,
        password: password,
      );
      _loading = false;
      notifyListeners();
      return null; // success
    } on AuthException catch (e) {
      _loading = false;
      notifyListeners();
      return e.message;
    } catch (e) {
      _loading = false;
      notifyListeners();
      return 'An unexpected error occurred';
    }
  }

  Future<void> signOut() async {
    await _supabase.auth.signOut();
    _user = null;
    notifyListeners();
  }

  String? get accessToken => _supabase.auth.currentSession?.accessToken;
}
