import 'package:flutter/material.dart';

class AppNavigationState extends ChangeNotifier {
  bool isDarkMode = true;
  String currentTable = 'T12';
  int selectedLanguageIndex = 0; // 0: English, 1: Tamil, 2: Hindi, 3: Telugu, 4: Spanish
  bool showWelcomeScreen = true;

  final List<Map<String, String>> languages = [
    {'code': 'en', 'name': 'English', 'native': 'English'},
    {'code': 'ta', 'name': 'Tamil', 'native': 'தமிழ்'},
    {'code': 'hi', 'name': 'Hindi', 'native': 'हिंदी'},
    {'code': 'te', 'name': 'Telugu', 'native': 'తెలుగు'},
    {'code': 'es', 'name': 'Spanish', 'native': 'Español'},
  ];

  void toggleTheme() {
    isDarkMode = !isDarkMode;
    notifyListeners();
  }

  void setTable(String table) {
    currentTable = table;
    notifyListeners();
  }

  void setLanguage(int index) {
    selectedLanguageIndex = index;
    notifyListeners();
  }

  void dismissWelcome() {
    showWelcomeScreen = false;
    notifyListeners();
  }

  void resetWelcome() {
    showWelcomeScreen = true;
    notifyListeners();
  }
}

