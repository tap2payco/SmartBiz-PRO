import 'package:flutter/material.dart';
import 'package:shared_preferences/shared_preferences.dart';

class AppLockService extends ChangeNotifier {
  static const String _pinKey = 'app_lock_pin';
  static const String _enabledKey = 'app_lock_enabled';
  
  late SharedPreferences _prefs;
  bool _isEnabled = false;
  String? _pin;
  bool _isLocked = false;

  bool get isEnabled => _isEnabled;
  bool get isLocked => _isLocked;
  bool get hasPin => _pin != null && _pin!.isNotEmpty;

  AppLockService() {
    _init();
  }

  Future<void> _init() async {
    _prefs = await SharedPreferences.getInstance();
    _isEnabled = _prefs.getBool(_enabledKey) ?? false;
    _pin = _prefs.getString(_pinKey);
    // Initially lock if enabled
    if (_isEnabled && hasPin) {
      _isLocked = true;
    }
    notifyListeners();
  }

  Future<void> setPin(String pin) async {
    _pin = pin;
    await _prefs.setString(_pinKey, pin);
    notifyListeners();
  }

  Future<void> toggleLock(bool value) async {
    _isEnabled = value;
    await _prefs.setBool(_enabledKey, value);
    if (!_isEnabled) {
      _isLocked = false;
    } else if (hasPin) {
      _isLocked = true;
    }
    notifyListeners();
  }

  void lock() {
    if (_isEnabled && hasPin) {
      _isLocked = true;
      notifyListeners();
    }
  }

  bool unlock(String pin) {
    if (pin == _pin) {
      _isLocked = false;
      notifyListeners();
      return true;
    }
    return false;
  }
}
