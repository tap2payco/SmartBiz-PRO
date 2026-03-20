import 'package:flutter/material.dart';
import 'package:supabase_flutter/supabase_flutter.dart';

class AuthService extends ChangeNotifier {
  User? _user;
  bool _loading = false;

  User? get user => _user;
  bool get isAuthenticated => _user != null;
  bool get loading => _loading;
  String get email => _user?.email ?? '';

  String _organizationName = 'SmartBiz Pro';
  String get organizationName => _organizationName;

  String? _employeeId;
  String? get employeeId => _employeeId;

  AuthService() {
    try {
      _user = Supabase.instance.client.auth.currentUser;
      _fetchOrgInfo();
      Supabase.instance.client.auth.onAuthStateChange.listen((data) {
        _user = data.session?.user;
        if (_user != null) _fetchOrgInfo();
        notifyListeners();
      });
    } catch (e) {
      debugPrint('AuthService: Supabase not initialized or available: $e');
    }
  }

  SupabaseClient get _supabase {
    try {
      return Supabase.instance.client;
    } catch (e) {
      throw Exception('Supabase is not initialized. Please check your configuration.');
    }
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

      // Fetch Employee info if linked via email
      final employee = await _supabase
          .from('employees')
          .select('id')
          .eq('email', _user!.email!)
          .maybeSingle();
      
      if (employee != null) {
        _employeeId = employee['id'];
      }

      notifyListeners();
    } catch (e) {
      debugPrint('Error fetching org/employee info: $e');
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
