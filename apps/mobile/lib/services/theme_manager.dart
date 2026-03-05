import 'package:flutter/material.dart';
import 'package:shared_preferences/shared_preferences.dart';

class ThemeManager extends ChangeNotifier {
  static const String _key = 'theme_brightness';
  late SharedPreferences _prefs;
  Brightness _brightness = Brightness.light;

  Brightness get brightness => _brightness;
  bool get isDarkMode => _brightness == Brightness.dark;

  ThemeManager() {
    _loadTheme();
  }

  Future<void> _loadTheme() async {
    _prefs = await SharedPreferences.getInstance();
    final isDark = _prefs.getBool(_key) ?? false;
    _brightness = isDark ? Brightness.dark : Brightness.light;
    notifyListeners();
  }

  Future<void> toggleTheme() async {
    _brightness = _brightness == Brightness.light ? Brightness.dark : Brightness.light;
    await _prefs.setBool(_key, _brightness == Brightness.dark);
    notifyListeners();
  }
}
