import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../../../core/state/app_navigation_state.dart';
import '../../../core/theme/app_theme.dart';

class WelcomeScreenWidget extends StatelessWidget {
  final VoidCallback onStart;

  const WelcomeScreenWidget({super.key, required this.onStart});

  @override
  Widget build(BuildContext context) {
    final navState = context.watch<AppNavigationState>();
    final currentLang = navState.languages[navState.selectedLanguageIndex];

    return Scaffold(
      backgroundColor: const Color(0xFF0F172A),
      body: Center(
        child: SingleChildScrollView(
          padding: const EdgeInsets.all(24),
          child: Container(
            constraints: const BoxConstraints(maxWidth: 600),
            child: Column(
              mainAxisAlignment: MainAxisAlignment.center,
              children: [
                // Top Language Switcher Pill
                Container(
                  padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 6),
                  decoration: BoxDecoration(
                    color: Colors.white.withValues(alpha: 0.1),
                    borderRadius: BorderRadius.circular(30),
                  ),
                  child: Row(
                    mainAxisSize: MainAxisSize.min,
                    children: [
                      const Icon(Icons.language, color: AppTheme.accentGold, size: 16),
                      const SizedBox(width: 8),
                      Text(
                        'Language: ${currentLang["native"]}',
                        style: const TextStyle(color: Colors.white, fontSize: 13, fontWeight: FontWeight.bold),
                      ),
                      const SizedBox(width: 8),
                      PopupMenuButton<int>(
                        icon: const Icon(Icons.arrow_drop_down, color: Colors.white, size: 20),
                        onSelected: (idx) => navState.setLanguage(idx),
                        itemBuilder: (context) {
                          return List.generate(navState.languages.length, (idx) {
                            final lang = navState.languages[idx];
                            return PopupMenuItem(
                              value: idx,
                              child: Text('${lang["name"]} (${lang["native"]})'),
                            );
                          });
                        },
                      ),
                    ],
                  ),
                ),
                const SizedBox(height: 36),
                // Logo & Emblem
                Container(
                  padding: const EdgeInsets.all(20),
                  decoration: BoxDecoration(
                    shape: BoxShape.circle,
                    gradient: const LinearGradient(
                      colors: [Color(0xFFFF5400), Color(0xFFFF8A00)],
                      begin: Alignment.topLeft,
                      end: Alignment.bottomRight,
                    ),
                    boxShadow: [
                      BoxShadow(
                        color: const Color(0xFFFF5400).withValues(alpha: 0.4),
                        blurRadius: 24,
                        offset: const Offset(0, 8),
                      ),
                    ],
                  ),
                  child: const Icon(Icons.restaurant_menu, size: 60, color: Colors.white),
                ),
                const SizedBox(height: 24),
                const Text(
                  'WELCOME TO',
                  style: TextStyle(
                    color: Color(0xFF94A3B8),
                    fontSize: 14,
                    letterSpacing: 3,
                    fontWeight: FontWeight.bold,
                  ),
                ),
                const SizedBox(height: 8),
                const Text(
                  'Pulse Bistro',
                  style: TextStyle(
                    color: Colors.white,
                    fontSize: 42,
                    fontWeight: FontWeight.w900,
                    letterSpacing: -0.5,
                  ),
                ),
                const Text(
                  'RESTAURANT & GRAND BANQUET',
                  style: TextStyle(
                    color: Color(0xFFFBBF24),
                    fontSize: 12,
                    letterSpacing: 2,
                    fontWeight: FontWeight.bold,
                  ),
                ),
                const SizedBox(height: 16),
                const Text(
                  'Exceptional Food, Delivered Fresh',
                  style: TextStyle(
                    color: Colors.white,
                    fontSize: 18,
                    fontWeight: FontWeight.w600,
                  ),
                ),
                const SizedBox(height: 8),
                const Text(
                  'Experience gourmet-quality culinary meals prepared with care and delivered faster than ever — straight to your table.',
                  textAlign: TextAlign.center,
                  style: TextStyle(
                    color: Color(0xFF94A3B8),
                    fontSize: 14,
                    height: 1.5,
                  ),
                ),
                const SizedBox(height: 32),
                // Feature Highlights
                Row(
                  mainAxisAlignment: MainAxisAlignment.center,
                  children: [
                    _highlightChip(Icons.auto_awesome, "Chef's Artisanal Menu"),
                    const SizedBox(width: 12),
                    _highlightChip(Icons.bolt, "Fast Table-Side Service"),
                    const SizedBox(width: 12),
                    _highlightChip(Icons.star, "Fine Dining"),
                  ],
                ),
                const SizedBox(height: 36),
                // Big Start Ordering Button
                SizedBox(
                  width: double.infinity,
                  height: 56,
                  child: ElevatedButton(
                    style: ElevatedButton.styleFrom(
                      backgroundColor: const Color(0xFFFF5400),
                      elevation: 6,
                      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
                    ),
                    onPressed: onStart,
                    child: const Row(
                      mainAxisAlignment: MainAxisAlignment.center,
                      children: [
                        Icon(Icons.touch_app, color: Colors.white, size: 22),
                        SizedBox(width: 10),
                        Text(
                          'START ORDERING',
                          style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold, letterSpacing: 1),
                        ),
                      ],
                    ),
                  ),
                ),
                const SizedBox(height: 14),
                const Text(
                  'Tap Start Ordering to browse our digital menu',
                  style: TextStyle(color: Color(0xFF64748B), fontSize: 12),
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }

  Widget _highlightChip(IconData icon, String text) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 6),
      decoration: BoxDecoration(
        color: Colors.white.withValues(alpha: 0.06),
        borderRadius: BorderRadius.circular(8),
        border: Border.all(color: Colors.white.withValues(alpha: 0.12)),
      ),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          Icon(icon, size: 14, color: const Color(0xFFFBBF24)),
          const SizedBox(width: 6),
          Text(text, style: const TextStyle(color: Colors.white70, fontSize: 11, fontWeight: FontWeight.bold)),
        ],
      ),
    );
  }
}

