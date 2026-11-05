import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';

class LandingSelectionView extends StatelessWidget {
  const LandingSelectionView({super.key});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: const Color(0xFF0F172A), // Luxury Dark Navy Slate
      body: SingleChildScrollView(
        child: Column(
          children: [
            // Hero Header Section
            Container(
              width: double.infinity,
              padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 48),
              decoration: const BoxDecoration(
                gradient: LinearGradient(
                  colors: [Color(0xFF0F172A), Color(0xFF1E293B)],
                  begin: Alignment.topCenter,
                  end: Alignment.bottomCenter,
                ),
              ),
              child: Center(
                child: Container(
                  constraints: const BoxConstraints(maxWidth: 960),
                  child: Column(
                    children: [
                      // Status Pill
                      Container(
                        padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 6),
                        decoration: BoxDecoration(
                          color: const Color(0xFF10B981).withOpacity(0.15),
                          borderRadius: BorderRadius.circular(30),
                          border: Border.all(color: const Color(0xFF10B981).withOpacity(0.4)),
                        ),
                        child: const Row(
                          mainAxisSize: MainAxisSize.min,
                          children: [
                            CircleAvatar(radius: 4, backgroundColor: Color(0xFF10B981)),
                            SizedBox(width: 8),
                            Text(
                              'LIVE GLOBAL CLUSTER ONLINE • FASTAPI + POSTGRESQL + FLUTTER',
                              style: TextStyle(
                                color: Color(0xFF34D399),
                                fontSize: 11,
                                fontWeight: FontWeight.bold,
                                letterSpacing: 0.5,
                              ),
                            ),
                          ],
                        ),
                      ),
                      const SizedBox(height: 24),
                      // Brand Logo & Title
                      Row(
                        mainAxisAlignment: MainAxisAlignment.center,
                        children: [
                          Container(
                            padding: const EdgeInsets.all(12),
                            decoration: BoxDecoration(
                              gradient: const LinearGradient(
                                colors: [Color(0xFFFF5400), Color(0xFFFF8A00)],
                                begin: Alignment.topLeft,
                                end: Alignment.bottomRight,
                              ),
                              borderRadius: BorderRadius.circular(16),
                              boxShadow: [
                                BoxShadow(
                                  color: const Color(0xFFFF5400).withOpacity(0.35),
                                  blurRadius: 16,
                                  offset: const Offset(0, 4),
                                ),
                              ],
                            ),
                            child: const Icon(Icons.restaurant_menu, size: 36, color: Colors.white),
                          ),
                          const SizedBox(width: 16),
                          const Text(
                            'PulseOrder',
                            style: TextStyle(
                              fontSize: 38,
                              fontWeight: FontWeight.w900,
                              color: Colors.white,
                              letterSpacing: -0.5,
                            ),
                          ),
                        ],
                      ),
                      const SizedBox(height: 12),
                      const Text(
                        'Next-Generation Real-Time Restaurant Management & Kitchen Ops Platform',
                        textAlign: TextAlign.center,
                        style: TextStyle(
                          fontSize: 18,
                          fontWeight: FontWeight.w400,
                          color: Color(0xFF94A3B8),
                        ),
                      ),
                    ],
                  ),
                ),
              ),
            ),
            // Three Persona Cards
            Center(
              child: Container(
                constraints: const BoxConstraints(maxWidth: 1040),
                padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 8),
                child: LayoutBuilder(
                  builder: (context, constraints) {
                    final isWide = constraints.maxWidth > 750;
                    return Wrap(
                      spacing: 24,
                      runSpacing: 24,
                      alignment: WrapAlignment.center,
                      children: [
                        _buildPersonaCard(
                          width: isWide ? 310 : double.infinity,
                          title: 'Customer Kiosk',
                          subtitle: 'Interactive table-side self ordering with culinary photography, modifier add-ons, and live order status.',
                          badge: 'TABLE SELF-ORDER',
                          badgeColor: const Color(0xFFFF5400),
                          icon: Icons.tablet_android,
                          accentColor: const Color(0xFFFF5400),
                          features: const [
                            'Interactive Food Menus & Photo Gallery',
                            'Modifier Add-ons & Chef Notes',
                            'Real-Time Preparation Stepper',
                            'Waiter Calling Assistance',
                          ],
                          buttonText: 'LAUNCH TABLE KIOSK',
                          onTap: () => context.go('/kiosk'),
                        ),
                        _buildPersonaCard(
                          width: isWide ? 310 : double.infinity,
                          title: 'Kitchen Display (KDS)',
                          subtitle: 'Line cook and expediter terminal with real-time WebSocket order tickets, delay alerts, and tactile bumps.',
                          badge: 'KITCHEN EXPEDITER',
                          badgeColor: const Color(0xFF38BDF8),
                          icon: Icons.soup_kitchen_outlined,
                          accentColor: const Color(0xFF38BDF8),
                          features: const [
                            'Real-time WebSocket Live Stream',
                            'Delay Highlights for Orders > 15m',
                            'One-Tap Bump Prep Workflows',
                            'Audible & Visual Incoming Alerts',
                          ],
                          buttonText: 'OPEN KITCHEN DISPLAY',
                          onTap: () => context.go('/kds'),
                        ),
                        _buildPersonaCard(
                          width: isWide ? 310 : double.infinity,
                          title: 'Manager Dashboard',
                          subtitle: 'Executive operations suite for sales KPIs, menu 86-inventory controls, staff RBAC, and revenue reports.',
                          badge: 'EXECUTIVE SUITE',
                          badgeColor: const Color(0xFFA855F7),
                          icon: Icons.analytics_outlined,
                          accentColor: const Color(0xFFA855F7),
                          features: const [
                            'Real-time Sales & Revenue KPIs',
                            'Menu & 86 Item Availability Toggle',
                            'Multi-Branch & Table Provisioning',
                            'Role-Based Access Control (RBAC)',
                          ],
                          buttonText: 'ENTER MANAGER PORTAL',
                          onTap: () => context.go('/management'),
                        ),
                      ],
                    );
                  },
                ),
              ),
            ),
            const SizedBox(height: 32),
            // Demo credentials reminder
            Center(
              child: Container(
                constraints: const BoxConstraints(maxWidth: 720),
                margin: const EdgeInsets.symmetric(horizontal: 24),
                padding: const EdgeInsets.all(16),
                decoration: BoxDecoration(
                  color: const Color(0xFF1E293B),
                  borderRadius: BorderRadius.circular(16),
                  border: Border.all(color: const Color(0xFF334155)),
                ),
                child: Row(
                  children: [
                    const Icon(Icons.key, color: Color(0xFFFBBF24), size: 24),
                    const SizedBox(width: 14),
                    const Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(
                            'Demo Pre-Seeded Credentials',
                            style: TextStyle(color: Colors.white, fontWeight: FontWeight.bold, fontSize: 13),
                          ),
                          SizedBox(height: 2),
                          Text(
                            'Manager Sign In: owner@pulseorder.io  |  Password: SecurePassword123!',
                            style: TextStyle(color: Color(0xFF94A3B8), fontSize: 12),
                          ),
                        ],
                      ),
                    ),
                  ],
                ),
              ),
            ),
            const SizedBox(height: 48),
            // Tech stack footer
            Container(
              padding: const EdgeInsets.symmetric(vertical: 24),
              child: const Text(
                'Built with FastAPI 3.12+ • SQLAlchemy 2.0 • PostgreSQL • Celery & Redis • Flutter Web • WebSockets',
                style: TextStyle(color: Color(0xFF64748B), fontSize: 12),
                textAlign: TextAlign.center,
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildPersonaCard({
    required double width,
    required String title,
    required String subtitle,
    required String badge,
    required Color badgeColor,
    required IconData icon,
    required Color accentColor,
    required List<String> features,
    required String buttonText,
    required VoidCallback onTap,
  }) {
    return Container(
      width: width,
      decoration: BoxDecoration(
        color: const Color(0xFF1E293B),
        borderRadius: BorderRadius.circular(24),
        border: Border.all(color: const Color(0xFF334155)),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withOpacity(0.3),
            blurRadius: 20,
            offset: const Offset(0, 8),
          ),
        ],
      ),
      child: Padding(
        padding: const EdgeInsets.all(24),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                Container(
                  padding: const EdgeInsets.all(12),
                  decoration: BoxDecoration(
                    color: accentColor.withOpacity(0.15),
                    borderRadius: BorderRadius.circular(14),
                  ),
                  child: Icon(icon, color: accentColor, size: 28),
                ),
                Container(
                  padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                  decoration: BoxDecoration(
                    color: badgeColor.withOpacity(0.15),
                    borderRadius: BorderRadius.circular(20),
                    border: Border.all(color: badgeColor.withOpacity(0.4)),
                  ),
                  child: Text(
                    badge,
                    style: TextStyle(color: badgeColor, fontSize: 10, fontWeight: FontWeight.bold, letterSpacing: 0.5),
                  ),
                ),
              ],
            ),
            const SizedBox(height: 20),
            Text(
              title,
              style: const TextStyle(color: Colors.white, fontSize: 20, fontWeight: FontWeight.bold),
            ),
            const SizedBox(height: 8),
            Text(
              subtitle,
              style: const TextStyle(color: Color(0xFF94A3B8), fontSize: 13, height: 1.4),
            ),
            const SizedBox(height: 20),
            const Divider(color: Color(0xFF334155), height: 1),
            const SizedBox(height: 16),
            ...features.map((f) => Padding(
                  padding: const EdgeInsets.only(bottom: 8),
                  child: Row(
                    children: [
                      Icon(Icons.check_circle, size: 16, color: accentColor),
                      const SizedBox(width: 8),
                      Expanded(
                        child: Text(
                          f,
                          style: const TextStyle(color: Color(0xFFCBD5E1), fontSize: 12),
                        ),
                      ),
                    ],
                  ),
                )),
            const SizedBox(height: 20),
            SizedBox(
              width: double.infinity,
              height: 46,
              child: ElevatedButton(
                style: ElevatedButton.styleFrom(
                  backgroundColor: accentColor,
                  foregroundColor: Colors.white,
                  elevation: 0,
                  shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                ),
                onPressed: onTap,
                child: Text(
                  buttonText,
                  style: const TextStyle(fontSize: 13, fontWeight: FontWeight.bold, letterSpacing: 0.5),
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }
}
