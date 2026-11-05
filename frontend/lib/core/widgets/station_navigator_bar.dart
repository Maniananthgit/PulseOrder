import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:provider/provider.dart';
import '../state/app_navigation_state.dart';
import '../../features/kitchen/viewmodels/kitchen_viewmodel.dart';

class StationNavigatorBar extends StatelessWidget {
  final Widget child;

  const StationNavigatorBar({super.key, required this.child});

  @override
  Widget build(BuildContext context) {
    final navState = context.watch<AppNavigationState>();
    final kitchenVm = context.watch<KitchenViewModel>();
    final currentPath = GoRouterState.of(context).uri.path;

    final isDark = navState.isDarkMode;
    final navBg = isDark ? const Color(0xFF0F172A) : const Color(0xFF1E293B);

    return Scaffold(
      backgroundColor: isDark ? const Color(0xFF020617) : const Color(0xFFF8FAFC),
      body: Column(
        children: [
          // Sticky Station Navigator Bar
          Container(
            padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 10),
            decoration: BoxDecoration(
              color: navBg,
              border: Border(bottom: BorderSide(color: Colors.white.withOpacity(0.08))),
              boxShadow: [
                BoxShadow(color: Colors.black.withOpacity(0.35), blurRadius: 10, offset: const Offset(0, 2)),
              ],
            ),
            child: SafeArea(
              bottom: false,
              child: SingleChildScrollView(
                scrollDirection: Axis.horizontal,
                child: Row(
                  children: [
                    // Brand / Station Hub
                    InkWell(
                      onTap: () => context.go('/'),
                      borderRadius: BorderRadius.circular(10),
                      child: Container(
                        padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
                        decoration: BoxDecoration(
                          color: currentPath == '/' ? const Color(0xFFFF5400) : Colors.white.withOpacity(0.08),
                          borderRadius: BorderRadius.circular(10),
                        ),
                        child: const Row(
                          mainAxisSize: MainAxisSize.min,
                          children: [
                            Icon(Icons.hub_outlined, color: Colors.white, size: 18),
                            SizedBox(width: 8),
                            Text(
                              'Station Hub',
                              style: TextStyle(color: Colors.white, fontWeight: FontWeight.bold, fontSize: 13),
                            ),
                          ],
                        ),
                      ),
                    ),
                    const SizedBox(width: 10),
                    // Table Kiosk button
                    InkWell(
                      onTap: () => context.go('/kiosk'),
                      borderRadius: BorderRadius.circular(10),
                      child: Container(
                        padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
                        decoration: BoxDecoration(
                          color: currentPath == '/kiosk' ? const Color(0xFFFF5400) : Colors.white.withOpacity(0.08),
                          borderRadius: BorderRadius.circular(10),
                        ),
                        child: Row(
                          mainAxisSize: MainAxisSize.min,
                          children: [
                            const Icon(Icons.tablet_mac, color: Colors.white, size: 18),
                            const SizedBox(width: 8),
                            const Text(
                              'Table Kiosk',
                              style: TextStyle(color: Colors.white, fontWeight: FontWeight.bold, fontSize: 13),
                            ),
                            const SizedBox(width: 6),
                            Container(
                              padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
                              decoration: BoxDecoration(
                                color: Colors.black38,
                                borderRadius: BorderRadius.circular(6),
                              ),
                              child: Text(
                                navState.currentTable,
                                style: const TextStyle(color: Color(0xFFFBBF24), fontWeight: FontWeight.bold, fontSize: 11),
                              ),
                            ),
                          ],
                        ),
                      ),
                    ),
                    const SizedBox(width: 10),
                    // Quick Table Switcher Pills (#4, #8, #12, #16)
                    Row(
                      children: ['#4', '#8', '#12', '#16'].map((t) {
                        final isSel = navState.currentTable == t.replaceAll('#', 'T');
                        return Padding(
                          padding: const EdgeInsets.only(right: 6),
                          child: InkWell(
                            onTap: () {
                              navState.setTable(t.replaceAll('#', 'T'));
                              if (currentPath != '/kiosk') {
                                context.go('/kiosk');
                              }
                            },
                            borderRadius: BorderRadius.circular(6),
                            child: Container(
                              padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                              decoration: BoxDecoration(
                                color: isSel ? const Color(0xFFF59E0B) : Colors.white.withOpacity(0.05),
                                borderRadius: BorderRadius.circular(6),
                                border: Border.all(
                                  color: isSel ? const Color(0xFFF59E0B) : Colors.white24,
                                ),
                              ),
                              child: Text(
                                t,
                                style: TextStyle(
                                  color: isSel ? Colors.black : Colors.white70,
                                  fontWeight: FontWeight.bold,
                                  fontSize: 11,
                                ),
                              ),
                            ),
                          ),
                        );
                      }).toList(),
                    ),
                    const SizedBox(width: 10),
                    // Kitchen KDS button
                    InkWell(
                      onTap: () => context.go('/kds'),
                      borderRadius: BorderRadius.circular(10),
                      child: Container(
                        padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
                        decoration: BoxDecoration(
                          color: currentPath == '/kds' ? const Color(0xFF38BDF8) : Colors.white.withOpacity(0.08),
                          borderRadius: BorderRadius.circular(10),
                        ),
                        child: Row(
                          mainAxisSize: MainAxisSize.min,
                          children: [
                            const Icon(Icons.soup_kitchen, color: Colors.white, size: 18),
                            const SizedBox(width: 8),
                            const Text(
                              'Kitchen KDS',
                              style: TextStyle(color: Colors.white, fontWeight: FontWeight.bold, fontSize: 13),
                            ),
                            const SizedBox(width: 6),
                            Container(
                              padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
                              decoration: BoxDecoration(
                                color: kitchenVm.tickets.isNotEmpty ? Colors.redAccent : Colors.black38,
                                borderRadius: BorderRadius.circular(10),
                              ),
                              child: Text(
                                '${kitchenVm.tickets.length}',
                                style: const TextStyle(color: Colors.white, fontWeight: FontWeight.bold, fontSize: 11),
                              ),
                            ),
                          ],
                        ),
                      ),
                    ),
                    const SizedBox(width: 10),
                    // Management Dashboard button
                    InkWell(
                      onTap: () => context.go('/management'),
                      borderRadius: BorderRadius.circular(10),
                      child: Container(
                        padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
                        decoration: BoxDecoration(
                          color: currentPath == '/management' ? const Color(0xFFA855F7) : Colors.white.withOpacity(0.08),
                          borderRadius: BorderRadius.circular(10),
                        ),
                        child: const Row(
                          mainAxisSize: MainAxisSize.min,
                          children: [
                            Icon(Icons.analytics_outlined, color: Colors.white, size: 18),
                            SizedBox(width: 8),
                            Text(
                              'Management',
                              style: TextStyle(color: Colors.white, fontWeight: FontWeight.bold, fontSize: 13),
                            ),
                          ],
                        ),
                      ),
                    ),
                    const SizedBox(width: 16),
                    // Dark / Light toggle
                    InkWell(
                      onTap: navState.toggleTheme,
                      borderRadius: BorderRadius.circular(8),
                      child: Container(
                        padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 6),
                        decoration: BoxDecoration(
                          color: Colors.white.withOpacity(0.08),
                          borderRadius: BorderRadius.circular(8),
                        ),
                        child: Row(
                          children: [
                            Icon(
                              navState.isDarkMode ? Icons.dark_mode : Icons.light_mode,
                              size: 16,
                              color: navState.isDarkMode ? const Color(0xFFFBBF24) : Colors.orangeAccent,
                            ),
                            const SizedBox(width: 6),
                            Text(
                              navState.isDarkMode ? 'Dark' : 'Light',
                              style: const TextStyle(color: Colors.white, fontSize: 12, fontWeight: FontWeight.w600),
                            ),
                          ],
                        ),
                      ),
                    ),
                    const SizedBox(width: 8),
                    // Reset Demo Welcome
                    InkWell(
                      onTap: () {
                        navState.resetWelcome();
                        context.go('/kiosk');
                      },
                      borderRadius: BorderRadius.circular(8),
                      child: Container(
                        padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 6),
                        decoration: BoxDecoration(
                          color: Colors.white.withOpacity(0.08),
                          borderRadius: BorderRadius.circular(8),
                        ),
                        child: const Row(
                          children: [
                            Icon(Icons.refresh, size: 16, color: Colors.white70),
                            SizedBox(width: 6),
                            Text(
                              'Reset Kiosk',
                              style: TextStyle(color: Colors.white70, fontSize: 12),
                            ),
                          ],
                        ),
                      ),
                    ),
                  ],
                ),
              ),
            ),
          ),
          // Screen Content
          Expanded(child: child),
        ],
      ),
    );
  }
}

