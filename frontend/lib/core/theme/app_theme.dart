import 'package:flutter/material.dart';

class AppTheme {
  // Brand colors
  static const Color primaryAmber = Color(0xFFFF5400); // Electric appetizing flame
  static const Color primaryAmberDark = Color(0xFFD64400);
  static const Color accentGold = Color(0xFFFFB800);
  static const Color primaryDark = Color(0xFF0F141C); // Deep Obsidian
  static const Color surfaceLight = Color(0xFFF7F8FA);
  static const Color cardLight = Colors.white;
  static const Color textMain = Color(0xFF131924);
  static const Color textMuted = Color(0xFF6B7280);
  static const Color vegGreen = Color(0xFF10B981);
  static const Color nonVegRed = Color(0xFFEF4444);

  // KDS Dark colors
  static const Color kdsBackground = Color(0xFF0B0E14);
  static const Color kdsCard = Color(0xFF141923);
  static const Color kdsCardBorder = Color(0xFF222938);
  static const Color kdsPlaced = Color(0xFF2563EB); // Vibrant Blue
  static const Color kdsConfirmed = Color(0xFF6366F1); // Indigo
  static const Color kdsPreparing = Color(0xFFF59E0B); // Amber
  static const Color kdsReady = Color(0xFF10B981); // Emerald Green
  static const Color kdsDelayed = Color(0xFFEF4444); // Crimson Alert

  static ThemeData lightTheme = ThemeData(
    useMaterial3: true,
    brightness: Brightness.light,
    colorScheme: ColorScheme.fromSeed(
      seedColor: primaryAmber,
      primary: primaryAmber,
      surface: surfaceLight,
    ),
    scaffoldBackgroundColor: surfaceLight,
    appBarTheme: const AppBarTheme(
      backgroundColor: Colors.white,
      elevation: 0,
      scrolledUnderElevation: 1,
      iconTheme: IconThemeData(color: primaryDark),
      titleTextStyle: TextStyle(
        color: primaryDark,
        fontSize: 20,
        fontWeight: FontWeight.w800,
        letterSpacing: -0.5,
      ),
    ),
    cardTheme: CardThemeData(
      color: cardLight,
      elevation: 0,
      shape: RoundedRectangleBorder(
        borderRadius: BorderRadius.circular(20),
        side: BorderSide(color: Colors.grey.shade200, width: 1),
      ),
    ),
    elevatedButtonTheme: ElevatedButtonThemeData(
      style: ElevatedButton.styleFrom(
        backgroundColor: primaryAmber,
        foregroundColor: Colors.white,
        elevation: 0,
        padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 15),
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(14)),
        textStyle: const TextStyle(fontWeight: FontWeight.bold, fontSize: 16),
      ),
    ),
  );

  static ThemeData darkKdsTheme = ThemeData(
    useMaterial3: true,
    brightness: Brightness.dark,
    colorScheme: ColorScheme.fromSeed(
      seedColor: primaryAmber,
      brightness: Brightness.dark,
      surface: kdsBackground,
    ),
    scaffoldBackgroundColor: kdsBackground,
    cardTheme: CardThemeData(
      color: kdsCard,
      elevation: 0,
      shape: RoundedRectangleBorder(
        borderRadius: BorderRadius.circular(16),
        side: const BorderSide(color: kdsCardBorder, width: 1),
      ),
    ),
  );
}
