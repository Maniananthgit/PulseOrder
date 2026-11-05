import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../../../core/state/app_navigation_state.dart';
import '../../../core/theme/app_theme.dart';
import '../viewmodels/customer_order_viewmodel.dart';
import '../widgets/addon_selection_dialog.dart';
import '../widgets/call_waiter_dialog.dart';
import '../widgets/customer_feedback_dialog.dart';
import '../widgets/product_card_widget.dart';
import '../widgets/welcome_screen_widget.dart';
import 'cart_sheet_view.dart';
import 'order_tracking_view.dart';

class CustomerMenuView extends StatefulWidget {
  final String qrToken;

  const CustomerMenuView({super.key, required this.qrToken});

  @override
  State<CustomerMenuView> createState() => _CustomerMenuViewState();
}

class _CustomerMenuViewState extends State<CustomerMenuView> {
  final TextEditingController _searchCtrl = TextEditingController();

  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) {
      context.read<CustomerOrderViewModel>().initializeTable(widget.qrToken);
    });
  }

  @override
  void dispose() {
    _searchCtrl.dispose();
    super.dispose();
  }

  String _getCategoryIcon(String name) {
    final lower = name.toLowerCase();
    if (lower.contains('burger')) return '🍔';
    if (lower.contains('pasta')) return '🍝';
    if (lower.contains('drink') || lower.contains('beverage')) return '🍹';
    if (lower.contains('appetizer') || lower.contains('starter')) return '🍟';
    if (lower.contains('dessert')) return '🍰';
    if (lower.contains('pizza')) return '🍕';
    return '🍽️';
  }

  @override
  Widget build(BuildContext context) {
    final navState = context.watch<AppNavigationState>();
    final vm = context.watch<CustomerOrderViewModel>();

    // Step 1: Reverse-Engineered Dining Welcome Splash
    if (navState.showWelcomeScreen) {
      return WelcomeScreenWidget(
        onStart: () => navState.dismissWelcome(),
      );
    }

    if (vm.isLoading && vm.session == null) {
      return const Scaffold(
        body: Center(
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              CircularProgressIndicator(color: AppTheme.primaryAmber),
              SizedBox(height: 16),
              Text(
                'Loading dining menu...',
                style: TextStyle(fontWeight: FontWeight.bold, color: AppTheme.textMuted),
              ),
            ],
          ),
        ),
      );
    }

    if (vm.errorMessage != null && vm.session == null) {
      return Scaffold(
        body: Center(
          child: Padding(
            padding: const EdgeInsets.all(24),
            child: Column(
              mainAxisAlignment: MainAxisAlignment.center,
              children: [
                const Icon(Icons.qr_code_scanner, size: 72, color: Colors.redAccent),
                const SizedBox(height: 16),
                const Text(
                  'Invalid Table Session',
                  style: TextStyle(fontSize: 22, fontWeight: FontWeight.bold),
                ),
                const SizedBox(height: 8),
                Text(
                  vm.errorMessage!,
                  textAlign: TextAlign.center,
                  style: TextStyle(color: AppTheme.textMuted),
                ),
                const SizedBox(height: 24),
                ElevatedButton.icon(
                  onPressed: () => vm.initializeTable(widget.qrToken),
                  icon: const Icon(Icons.refresh),
                  label: const Text('Try Again'),
                ),
              ],
            ),
          ),
        ),
      );
    }

    final session = vm.session!;
    final categories = vm.categories;
    final products = vm.currentFilteredProducts;

    return Scaffold(
      backgroundColor: const Color(0xFFF8F9FA),
      appBar: AppBar(
        titleSpacing: 16,
        elevation: 0,
        backgroundColor: Colors.white,
        title: Row(
          children: [
            Container(
              padding: const EdgeInsets.all(8),
              decoration: BoxDecoration(
                color: AppTheme.primaryAmber.withValues(alpha: 0.12),
                borderRadius: BorderRadius.circular(12),
              ),
              child: const Icon(Icons.restaurant, color: AppTheme.primaryAmber, size: 22),
            ),
            const SizedBox(width: 12),
            Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              mainAxisSize: MainAxisSize.min,
              children: [
                Row(
                  children: [
                    Text(
                      session.branchName,
                      style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 17, color: AppTheme.primaryDark),
                    ),
                    const SizedBox(width: 6),
                    const Icon(Icons.verified, size: 16, color: Colors.blue),
                  ],
                ),
                Text(
                  'Table ${session.tableNumber} • Fine Dining Service',
                  style: TextStyle(fontSize: 12, color: AppTheme.textMuted, fontWeight: FontWeight.w500),
                ),
              ],
            ),
          ],
        ),
        actions: [
          // Call Waiter Button (Reverse-Engineered Feature)
          Padding(
            padding: const EdgeInsets.only(right: 8),
            child: OutlinedButton.icon(
              style: OutlinedButton.styleFrom(
                foregroundColor: AppTheme.primaryAmber,
                side: BorderSide(color: AppTheme.primaryAmber.withValues(alpha: 0.5)),
                shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(20)),
                padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
              ),
              onPressed: () {
                showDialog(
                  context: context,
                  builder: (_) => CallWaiterDialog(tableNumber: session.tableNumber),
                );
              },
              icon: const Icon(Icons.support_agent, size: 16),
              label: const Text('Call Waiter', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 12)),
            ),
          ),
          // Feedback Button if active order exists
          if (vm.activeOrder != null)
            IconButton(
              icon: const Icon(Icons.rate_review_outlined, color: Colors.amber),
              tooltip: 'Leave Feedback',
              onPressed: () {
                showDialog(
                  context: context,
                  builder: (_) => CustomerFeedbackDialog(orderNumber: vm.activeOrder!.orderNumber),
                );
              },
            ),
          // Active order status icon button
          if (vm.activeOrder != null)
            Padding(
              padding: const EdgeInsets.only(right: 12),
              child: Stack(
                alignment: Alignment.center,
                children: [
                  IconButton(
                    icon: const Icon(Icons.soup_kitchen_outlined, color: AppTheme.primaryAmber),
                    tooltip: 'View Active Order Status',
                    onPressed: () {
                      Navigator.push(
                        context,
                        MaterialPageRoute(builder: (_) => const OrderTrackingView()),
                      );
                    },
                  ),
                  Positioned(
                    top: 8,
                    right: 8,
                    child: Container(
                      width: 10,
                      height: 10,
                      decoration: const BoxDecoration(
                        color: Colors.green,
                        shape: BoxShape.circle,
                      ),
                    ),
                  )
                ],
              ),
            ),
        ],
      ),
      body: Column(
        children: [
          // Search & Veg-Filter Row
          Container(
            padding: const EdgeInsets.fromLTRB(16, 12, 16, 12),
            color: Colors.white,
            child: Row(
              children: [
                Expanded(
                  child: TextField(
                    controller: _searchCtrl,
                    onChanged: (val) => vm.setSearchQuery(val),
                    decoration: InputDecoration(
                      hintText: 'Search delicious dishes, ingredients...',
                      hintStyle: TextStyle(color: Colors.grey.shade400, fontSize: 14),
                      prefixIcon: const Icon(Icons.search, size: 20, color: AppTheme.textMuted),
                      suffixIcon: _searchCtrl.text.isNotEmpty
                          ? IconButton(
                              icon: const Icon(Icons.clear, size: 18),
                              onPressed: () {
                                _searchCtrl.clear();
                                vm.setSearchQuery('');
                              },
                            )
                          : null,
                      filled: true,
                      fillColor: const Color(0xFFF4F5F7),
                      contentPadding: const EdgeInsets.symmetric(vertical: 0, horizontal: 16),
                      border: OutlineInputBorder(
                        borderRadius: BorderRadius.circular(14),
                        borderSide: BorderSide.none,
                      ),
                    ),
                  ),
                ),
                const SizedBox(width: 10),
                FilterChip(
                  label: Row(
                    mainAxisSize: MainAxisSize.min,
                    children: [
                      Container(
                        width: 8,
                        height: 8,
                        decoration: BoxDecoration(
                          shape: BoxShape.circle,
                          color: vm.isVegOnly ? AppTheme.vegGreen : Colors.grey,
                        ),
                      ),
                      const SizedBox(width: 6),
                      Text(
                        'Veg Only',
                        style: TextStyle(
                          fontSize: 12,
                          fontWeight: FontWeight.bold,
                          color: vm.isVegOnly ? AppTheme.vegGreen : AppTheme.primaryDark,
                        ),
                      ),
                    ],
                  ),
                  selected: vm.isVegOnly,
                  onSelected: (val) => vm.toggleVegOnly(val),
                  selectedColor: AppTheme.vegGreen.withValues(alpha: 0.15),
                  backgroundColor: const Color(0xFFF4F5F7),
                  shape: RoundedRectangleBorder(
                    borderRadius: BorderRadius.circular(12),
                    side: BorderSide(
                      color: vm.isVegOnly ? AppTheme.vegGreen : Colors.grey.shade300,
                    ),
                  ),
                ),
              ],
            ),
          ),
          // Chef's Combo Recommendation Banner (Reverse-Engineered Feature)
          Container(
            width: double.infinity,
            margin: const EdgeInsets.fromLTRB(16, 8, 16, 8),
            padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 10),
            decoration: BoxDecoration(
              gradient: const LinearGradient(
                colors: [Color(0xFFFFF7ED), Color(0xFFFEF3C7)],
                begin: Alignment.centerLeft,
                end: Alignment.centerRight,
              ),
              borderRadius: BorderRadius.circular(14),
              border: Border.all(color: Colors.amber.shade300),
            ),
            child: Row(
              children: [
                const Icon(Icons.auto_awesome, color: Colors.orange, size: 20),
                const SizedBox(width: 10),
                Expanded(
                  child: RichText(
                    text: const TextSpan(
                      text: 'Chef\'s Pairing Set: ',
                      style: TextStyle(fontWeight: FontWeight.bold, color: Colors.brown, fontSize: 13),
                      children: [
                        TextSpan(
                          text: 'Order any Artisan Main + Truffle Fries to enjoy 15% instant savings!',
                          style: TextStyle(fontWeight: FontWeight.normal, color: Colors.black87),
                        ),
                      ],
                    ),
                  ),
                ),
              ],
            ),
          ),
          // Category Selector Chips
          Container(
            height: 52,
            color: Colors.white,
            child: ListView.separated(
              padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
              scrollDirection: Axis.horizontal,
              itemCount: categories.length,
              separatorBuilder: (_, __) => const SizedBox(width: 8),
              itemBuilder: (context, index) {
                final cat = categories[index];
                final isSelected = vm.selectedCategoryIndex == index;
                final emoji = _getCategoryIcon(cat.name);

                return ChoiceChip(
                  label: Row(
                    mainAxisSize: MainAxisSize.min,
                    children: [
                      Text(emoji, style: const TextStyle(fontSize: 14)),
                      const SizedBox(width: 6),
                      Text(cat.name),
                    ],
                  ),
                  selected: isSelected,
                  selectedColor: AppTheme.primaryAmber,
                  backgroundColor: const Color(0xFFF4F5F7),
                  labelStyle: TextStyle(
                    fontWeight: isSelected ? FontWeight.bold : FontWeight.w600,
                    color: isSelected ? Colors.white : AppTheme.primaryDark,
                    fontSize: 13,
                  ),
                  shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                  onSelected: (_) => vm.selectCategory(index),
                );
              },
            ),
          ),
          const Divider(height: 1),
          // Product Grid
          Expanded(
            child: products.isEmpty
                ? Center(
                    child: Column(
                      mainAxisAlignment: MainAxisAlignment.center,
                      children: [
                        Icon(Icons.no_meals_outlined, size: 64, color: Colors.grey.shade400),
                        const SizedBox(height: 12),
                        const Text(
                          'No dishes match your filter',
                          style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold),
                        ),
                        const SizedBox(height: 4),
                        Text(
                          'Try clearing your search or vegetarian toggle.',
                          style: TextStyle(color: AppTheme.textMuted),
                        ),
                      ],
                    ),
                  )
                : LayoutBuilder(
                    builder: (context, constraints) {
                      final crossAxisCount = (constraints.maxWidth / 280).floor().clamp(1, 4);

                      return GridView.builder(
                        padding: const EdgeInsets.all(16),
                        gridDelegate: SliverGridDelegateWithFixedCrossAxisCount(
                          crossAxisCount: crossAxisCount,
                          childAspectRatio: 0.76,
                          crossAxisSpacing: 16,
                          mainAxisSpacing: 16,
                        ),
                        itemCount: products.length,
                        itemBuilder: (context, index) {
                          final prod = products[index];
                          return ProductCardWidget(
                            product: prod,
                            currency: session.currency,
                            onAdd: () {
                              showDialog(
                                context: context,
                                builder: (_) => AddonSelectionDialog(
                                  product: prod,
                                  currency: session.currency,
                                  onConfirm: (addons, instructions, spiceLevel) {
                                    vm.addToCart(
                                      prod,
                                      addons,
                                      instructions: instructions,
                                      spiceLevel: spiceLevel,
                                    );
                                  },
                                ),
                              );
                            },
                          );
                        },
                      );
                    },
                  ),
          ),
        ],
      ),
      // Floating Bottom Cart Sheet Launcher
      bottomNavigationBar: vm.cart.isNotEmpty
          ? Container(
              padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 12),
              decoration: BoxDecoration(
                color: Colors.white,
                boxShadow: [
                  BoxShadow(
                    color: Colors.black.withValues(alpha: 0.1),
                    blurRadius: 16,
                    offset: const Offset(0, -4),
                  )
                ],
              ),
              child: SafeArea(
                child: Row(
                  children: [
                    Column(
                      mainAxisSize: MainAxisSize.min,
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          '${vm.cartCount} ${vm.cartCount == 1 ? "Item" : "Items"} in Cart',
                          style: TextStyle(color: AppTheme.textMuted, fontSize: 13, fontWeight: FontWeight.w500),
                        ),
                        Text(
                          '${session.currency} ${vm.cartTotal.toStringAsFixed(2)}',
                          style: const TextStyle(fontSize: 20, fontWeight: FontWeight.bold, color: AppTheme.primaryAmber),
                        ),
                      ],
                    ),
                    const Spacer(),
                    ElevatedButton(
                      style: ElevatedButton.styleFrom(
                        backgroundColor: AppTheme.primaryAmber,
                        padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 14),
                        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(14)),
                        elevation: 3,
                      ),
                      onPressed: () {
                        showModalBottomSheet(
                          context: context,
                          isScrollControlled: true,
                          backgroundColor: Colors.transparent,
                          builder: (_) => const CartSheetView(),
                        );
                      },
                      child: const Row(
                        children: [
                          Icon(Icons.shopping_bag_outlined, color: Colors.white, size: 18),
                          SizedBox(width: 8),
                          Text(
                            'VIEW CART & ORDER',
                            style: TextStyle(fontWeight: FontWeight.bold, fontSize: 14, letterSpacing: 0.5),
                          ),
                        ],
                      ),
                    ),
                  ],
                ),
              ),
            )
          : null,
    );
  }
}
