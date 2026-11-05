import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:provider/provider.dart';
import '../../../core/theme/app_theme.dart';
import '../viewmodels/management_viewmodel.dart';

class ManagementDashboardView extends StatefulWidget {
  final String? initialRestaurantId;

  const ManagementDashboardView({super.key, this.initialRestaurantId});

  @override
  State<ManagementDashboardView> createState() => _ManagementDashboardViewState();
}

class _ManagementDashboardViewState extends State<ManagementDashboardView> {
  final TextEditingController _emailCtrl = TextEditingController(text: 'owner@pulseorder.io');
  final TextEditingController _passCtrl = TextEditingController(text: 'SecurePassword123!');
  final TextEditingController _searchCtrl = TextEditingController();

  @override
  void initState() {
    super.initState();
    if (widget.initialRestaurantId != null) {
      WidgetsBinding.instance.addPostFrameCallback((_) {
        context.read<ManagementViewModel>().setDirectContext(widget.initialRestaurantId!, 'Pulse Bistro');
      });
    }
  }

  @override
  void dispose() {
    _emailCtrl.dispose();
    _passCtrl.dispose();
    _searchCtrl.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final vm = context.watch<ManagementViewModel>();

    if (!vm.isAuthenticated) {
      return Scaffold(
        backgroundColor: const Color(0xFFF4F6F9),
        appBar: AppBar(
          leading: IconButton(
            icon: const Icon(Icons.arrow_back),
            onPressed: () {
              if (Navigator.canPop(context)) {
                Navigator.pop(context);
              } else {
                context.go('/');
              }
            },
          ),
          title: const Text('Executive Management Portal'),
          centerTitle: true,
        ),
        body: Center(
          child: SingleChildScrollView(
            padding: const EdgeInsets.all(24),
            child: Container(
              constraints: const BoxConstraints(maxWidth: 440),
              padding: const EdgeInsets.all(32),
              decoration: BoxDecoration(
                color: Colors.white,
                borderRadius: BorderRadius.circular(24),
                boxShadow: [
                  BoxShadow(color: Colors.black.withOpacity(0.06), blurRadius: 24, offset: const Offset(0, 8)),
                ],
              ),
              child: Column(
                mainAxisSize: MainAxisSize.min,
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Container(
                    padding: const EdgeInsets.all(12),
                    decoration: BoxDecoration(
                      color: AppTheme.primaryAmber.withOpacity(0.12),
                      borderRadius: BorderRadius.circular(16),
                    ),
                    child: const Icon(Icons.admin_panel_settings_outlined, color: AppTheme.primaryAmber, size: 32),
                  ),
                  const SizedBox(height: 20),
                  const Text('Manager Access', style: TextStyle(fontSize: 24, fontWeight: FontWeight.bold, color: AppTheme.primaryDark)),
                  const SizedBox(height: 6),
                  Text('Enter your credentials to monitor kitchen performance, live sales, and manage menu availability.',
                      style: TextStyle(color: AppTheme.textMuted, fontSize: 13, height: 1.4)),
                  const SizedBox(height: 24),
                  TextField(
                    controller: _emailCtrl,
                    decoration: InputDecoration(
                      labelText: 'Corporate Email',
                      prefixIcon: const Icon(Icons.email_outlined),
                      filled: true,
                      fillColor: const Color(0xFFF9FAFB),
                      border: OutlineInputBorder(borderRadius: BorderRadius.circular(12)),
                    ),
                  ),
                  const SizedBox(height: 16),
                  TextField(
                    controller: _passCtrl,
                    obscureText: true,
                    decoration: InputDecoration(
                      labelText: 'Password',
                      prefixIcon: const Icon(Icons.lock_outline),
                      filled: true,
                      fillColor: const Color(0xFFF9FAFB),
                      border: OutlineInputBorder(borderRadius: BorderRadius.circular(12)),
                    ),
                  ),
                  if (vm.errorMessage != null) ...[
                    const SizedBox(height: 16),
                    Container(
                      padding: const EdgeInsets.all(12),
                      decoration: BoxDecoration(
                        color: Colors.red.shade50,
                        borderRadius: BorderRadius.circular(10),
                        border: Border.all(color: Colors.red.shade200),
                      ),
                      child: Row(
                        children: [
                          const Icon(Icons.error_outline, color: Colors.red, size: 18),
                          const SizedBox(width: 8),
                          Expanded(child: Text(vm.errorMessage!, style: const TextStyle(color: Colors.red, fontSize: 12))),
                        ],
                      ),
                    ),
                  ],
                  const SizedBox(height: 24),
                  SizedBox(
                    width: double.infinity,
                    height: 50,
                    child: ElevatedButton(
                      style: ElevatedButton.styleFrom(
                        backgroundColor: AppTheme.primaryAmber,
                        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                      ),
                      onPressed: vm.isLoading ? null : () => vm.login(_emailCtrl.text.trim(), _passCtrl.text.trim()),
                      child: vm.isLoading
                          ? const CircularProgressIndicator(color: Colors.white)
                          : const Text('AUTHENTICATE & ENTER', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 14)),
                    ),
                  ),
                ],
              ),
            ),
          ),
        ),
      );
    }

    final summary = vm.summary;
    final allProducts = vm.categories.expand((c) => c.products).toList();
    final filteredProducts = allProducts.where((p) {
      final matchesSearch = p.name.toLowerCase().contains(_searchCtrl.text.toLowerCase());
      return matchesSearch;
    }).toList();

    return Scaffold(
      backgroundColor: const Color(0xFFF8FAFC),
      appBar: AppBar(
        leading: IconButton(
          icon: const Icon(Icons.arrow_back),
          onPressed: () {
            if (Navigator.canPop(context)) {
              Navigator.pop(context);
            } else {
              context.go('/');
            }
          },
        ),
        title: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(
              vm.restaurantName ?? 'Pulse Bistro Operations',
              style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 18),
            ),
            const Text(
              'Real-Time Restaurant & Menu Telemetry',
              style: TextStyle(color: AppTheme.textMuted, fontSize: 11),
            ),
          ],
        ),
        actions: [
          IconButton(
            icon: const Icon(Icons.refresh),
            onPressed: vm.loadDashboard,
            tooltip: 'Refresh analytics',
          ),
          IconButton(
            icon: const Icon(Icons.logout),
            onPressed: vm.logout,
            tooltip: 'Sign Out',
          ),
        ],
      ),
      body: vm.isLoading && summary == null
          ? const Center(child: CircularProgressIndicator(color: AppTheme.primaryAmber))
          : SingleChildScrollView(
              padding: const EdgeInsets.all(24),
              child: Center(
                child: Container(
                  constraints: const BoxConstraints(maxWidth: 1100),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      // Executive KPI Header
                      LayoutBuilder(
                        builder: (context, constraints) {
                          final isWide = constraints.maxWidth > 780;
                          return Wrap(
                            spacing: 16,
                            runSpacing: 16,
                            children: [
                              _buildKpiCard(
                                title: 'Today\'s Gross Revenue',
                                value: '\$${summary?.totalSales.toStringAsFixed(2) ?? "0.00"}',
                                trend: '+14.8% vs last week',
                                icon: Icons.attach_money,
                                color: const Color(0xFF10B981),
                                isWide: isWide,
                              ),
                              _buildKpiCard(
                                title: 'Total Guest Orders',
                                value: '${summary?.totalOrders ?? 0}',
                                trend: 'Active Dine-in & Takeaway',
                                icon: Icons.receipt_long,
                                color: const Color(0xFF3B82F6),
                                isWide: isWide,
                              ),
                              _buildKpiCard(
                                title: 'Live In Kitchen',
                                value: '${summary?.preparingOrders ?? 0}',
                                trend: 'Tickets firing on line',
                                icon: Icons.soup_kitchen,
                                color: const Color(0xFFF59E0B),
                                isWide: isWide,
                              ),
                              _buildKpiCard(
                                title: 'Completed & Served',
                                value: '${summary?.completedOrders ?? 0}',
                                trend: 'Fully fulfilled',
                                icon: Icons.check_circle_outline,
                                color: const Color(0xFF8B5CF6),
                                isWide: isWide,
                              ),
                            ],
                          );
                        },
                      ),
                      const SizedBox(height: 32),
                      // Menu & 86 Item Availability Management Section
                      Container(
                        padding: const EdgeInsets.all(24),
                        decoration: BoxDecoration(
                          color: Colors.white,
                          borderRadius: BorderRadius.circular(20),
                          boxShadow: [
                            BoxShadow(color: Colors.black.withOpacity(0.04), blurRadius: 16, offset: const Offset(0, 4)),
                          ],
                        ),
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Row(
                              mainAxisAlignment: MainAxisAlignment.spaceBetween,
                              children: [
                                Column(
                                  crossAxisAlignment: CrossAxisAlignment.start,
                                  children: [
                                    const Text(
                                      'Menu Inventory & 86 Out-Of-Stock Control',
                                      style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold, color: AppTheme.primaryDark),
                                    ),
                                    const SizedBox(height: 2),
                                    Text(
                                      'Toggling an item off immediately hides/disables it on all live customer tablets.',
                                      style: TextStyle(color: AppTheme.textMuted, fontSize: 13),
                                    ),
                                  ],
                                ),
                                Container(
                                  padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
                                  decoration: BoxDecoration(
                                    color: Colors.blue.shade50,
                                    borderRadius: BorderRadius.circular(10),
                                  ),
                                  child: Text(
                                    '${filteredProducts.length} Items Listed',
                                    style: TextStyle(color: Colors.blue.shade800, fontWeight: FontWeight.bold, fontSize: 12),
                                  ),
                                ),
                              ],
                            ),
                            const SizedBox(height: 20),
                            // Search Bar
                            TextField(
                              controller: _searchCtrl,
                              onChanged: (_) => setState(() {}),
                              decoration: InputDecoration(
                                hintText: 'Search product name (e.g. Truffle, Salmon, Wagyu)...',
                                prefixIcon: const Icon(Icons.search),
                                filled: true,
                                fillColor: const Color(0xFFF9FAFB),
                                border: OutlineInputBorder(borderRadius: BorderRadius.circular(12), borderSide: BorderSide.none),
                              ),
                            ),
                            const SizedBox(height: 20),
                            // Product List
                            ListView.separated(
                              shrinkWrap: true,
                              physics: const NeverScrollableScrollPhysics(),
                              itemCount: filteredProducts.length,
                              separatorBuilder: (_, __) => const Divider(height: 1),
                              itemBuilder: (context, index) {
                                final prod = filteredProducts[index];
                                return Padding(
                                  padding: const EdgeInsets.symmetric(vertical: 10),
                                  child: Row(
                                    children: [
                                      // Veg tag
                                      Container(
                                        padding: const EdgeInsets.all(3),
                                        decoration: BoxDecoration(
                                          border: Border.all(
                                            color: prod.isVeg ? AppTheme.vegGreen : AppTheme.nonVegRed,
                                            width: 1.5,
                                          ),
                                          borderRadius: BorderRadius.circular(4),
                                        ),
                                        child: Container(
                                          width: 6,
                                          height: 6,
                                          decoration: BoxDecoration(
                                            shape: BoxShape.circle,
                                            color: prod.isVeg ? AppTheme.vegGreen : AppTheme.nonVegRed,
                                          ),
                                        ),
                                      ),
                                      const SizedBox(width: 14),
                                      Expanded(
                                        child: Column(
                                          crossAxisAlignment: CrossAxisAlignment.start,
                                          children: [
                                            Text(
                                              prod.name,
                                              style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 15, color: AppTheme.primaryDark),
                                            ),
                                            const SizedBox(height: 2),
                                            Text(
                                              '\$${prod.basePrice.toStringAsFixed(2)} • ${prod.isVeg ? "Vegetarian" : "Non-Vegetarian"}',
                                              style: TextStyle(color: AppTheme.textMuted, fontSize: 13),
                                            ),
                                          ],
                                        ),
                                      ),
                                      // Availability pill
                                      Container(
                                        padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                                        decoration: BoxDecoration(
                                          color: prod.isAvailable ? Colors.green.shade50 : Colors.red.shade50,
                                          borderRadius: BorderRadius.circular(20),
                                          border: Border.all(
                                            color: prod.isAvailable ? Colors.green.shade200 : Colors.red.shade200,
                                          ),
                                        ),
                                        child: Text(
                                          prod.isAvailable ? 'AVAILABLE' : '86\'D OUT OF STOCK',
                                          style: TextStyle(
                                            fontSize: 11,
                                            fontWeight: FontWeight.bold,
                                            color: prod.isAvailable ? Colors.green.shade800 : Colors.red.shade800,
                                          ),
                                        ),
                                      ),
                                      const SizedBox(width: 12),
                                      Switch(
                                        value: prod.isAvailable,
                                        activeColor: AppTheme.primaryAmber,
                                        onChanged: (_) {
                                          vm.toggleAvailability(prod.id, prod.isAvailable);
                                          ScaffoldMessenger.of(context).showSnackBar(
                                            SnackBar(
                                              content: Text(
                                                '${prod.name} marked as ${!prod.isAvailable ? "Available" : "86d Unavailable"}',
                                              ),
                                              duration: const Duration(seconds: 2),
                                            ),
                                          );
                                        },
                                      ),
                                    ],
                                  ),
                                );
                              },
                            ),
                          ],
                        ),
                      ),
                    ],
                  ),
                ),
              ),
            ),
    );
  }

  Widget _buildKpiCard({
    required String title,
    required String value,
    required String trend,
    required IconData icon,
    required Color color,
    required bool isWide,
  }) {
    return Container(
      width: isWide ? 250 : double.infinity,
      padding: const EdgeInsets.all(20),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(18),
        boxShadow: [
          BoxShadow(color: Colors.black.withOpacity(0.04), blurRadius: 14, offset: const Offset(0, 4)),
        ],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Text(title, style: TextStyle(color: AppTheme.textMuted, fontSize: 13, fontWeight: FontWeight.w600)),
              Container(
                padding: const EdgeInsets.all(8),
                decoration: BoxDecoration(color: color.withOpacity(0.12), borderRadius: BorderRadius.circular(10)),
                child: Icon(icon, color: color, size: 20),
              ),
            ],
          ),
          const SizedBox(height: 12),
          Text(value, style: const TextStyle(fontSize: 24, fontWeight: FontWeight.w900, color: AppTheme.primaryDark)),
          const SizedBox(height: 6),
          Text(trend, style: TextStyle(color: color, fontSize: 11, fontWeight: FontWeight.bold)),
        ],
      ),
    );
  }
}
