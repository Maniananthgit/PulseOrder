import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../../../core/theme/app_theme.dart';
import '../viewmodels/customer_order_viewmodel.dart';

class OrderTrackingView extends StatefulWidget {
  const OrderTrackingView({super.key});

  @override
  State<OrderTrackingView> createState() => _OrderTrackingViewState();
}

class _OrderTrackingViewState extends State<OrderTrackingView> {
  bool _waiterCalled = false;

  void _callWaiter() {
    setState(() => _waiterCalled = true);
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(
        backgroundColor: AppTheme.primaryDark,
        behavior: SnackBarBehavior.floating,
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
        content: const Row(
          children: [
            Icon(Icons.notifications_active, color: Colors.amber),
            SizedBox(width: 12),
            Expanded(
              child: Text(
                'Waiter alerted! Someone from the staff is heading to your table.',
                style: TextStyle(fontWeight: FontWeight.w600),
              ),
            ),
          ],
        ),
        duration: const Duration(seconds: 4),
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    final vm = context.watch<CustomerOrderViewModel>();
    final order = vm.activeOrder;

    if (order == null) {
      return Scaffold(
        appBar: AppBar(title: const Text('Live Order Status')),
        body: Center(
          child: Column(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              Icon(Icons.receipt_long_outlined, size: 64, color: Colors.grey.shade400),
              const SizedBox(height: 16),
              const Text('No Active Order', style: TextStyle(fontSize: 20, fontWeight: FontWeight.bold)),
              const SizedBox(height: 8),
              Text('Browse the menu and place your order first.', style: TextStyle(color: AppTheme.textMuted)),
              const SizedBox(height: 20),
              ElevatedButton.icon(
                onPressed: () => Navigator.pop(context),
                icon: const Icon(Icons.arrow_back),
                label: const Text('Back to Menu'),
              ),
            ],
          ),
        ),
      );
    }

    final currency = vm.session?.currency ?? 'USD';
    final currentStatus = order.status;

    final steps = [
      {'status': 'PLACED', 'title': 'Received', 'icon': Icons.assignment_turned_in_outlined, 'desc': 'Order transmitted to kitchen'},
      {'status': 'CONFIRMED', 'title': 'Confirmed', 'icon': Icons.check_circle_outline, 'desc': 'Kitchen accepted and queued ticket'},
      {'status': 'PREPARING', 'title': 'Preparing', 'icon': Icons.soup_kitchen_outlined, 'desc': 'Chef is actively cooking fresh on the line'},
      {'status': 'READY', 'title': 'Ready', 'icon': Icons.room_service_outlined, 'desc': 'Plated and ready for server pickup'},
      {'status': 'COMPLETED', 'title': 'Served', 'icon': Icons.done_all, 'desc': 'Delivered to your table. Bon Appétit!'},
    ];

    final statusKeys = steps.map((s) => s['status'] as String).toList();
    final currentStepIndex = statusKeys.indexOf(currentStatus);

    return Scaffold(
      backgroundColor: const Color(0xFFF7F8FA),
      appBar: AppBar(
        title: const Text('Live Kitchen Status'),
        centerTitle: true,
        leading: IconButton(
          icon: const Icon(Icons.arrow_back),
          onPressed: () => Navigator.pop(context),
        ),
        actions: [
          IconButton(
            tooltip: 'Call Waiter',
            icon: Icon(
              _waiterCalled ? Icons.notifications_active : Icons.notifications_none,
              color: _waiterCalled ? AppTheme.primaryAmber : null,
            ),
            onPressed: _callWaiter,
          ),
        ],
      ),
      body: SingleChildScrollView(
        padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 24),
        child: Center(
          child: Container(
            constraints: const BoxConstraints(maxWidth: 680),
            child: Column(
              children: [
                // Live Status Hero Banner
                Container(
                  padding: const EdgeInsets.all(24),
                  decoration: BoxDecoration(
                    color: Colors.white,
                    borderRadius: BorderRadius.circular(24),
                    boxShadow: [
                      BoxShadow(color: Colors.black.withOpacity(0.04), blurRadius: 20, offset: const Offset(0, 4)),
                    ],
                  ),
                  child: Column(
                    children: [
                      Row(
                        mainAxisAlignment: MainAxisAlignment.spaceBetween,
                        children: [
                          Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Text(
                                'Order #${order.orderNumber}',
                                style: const TextStyle(fontSize: 24, fontWeight: FontWeight.bold, color: AppTheme.primaryDark),
                              ),
                              const SizedBox(height: 4),
                              Text(
                                '${vm.session?.branchName ?? "Pulse Bistro"} • Table ${vm.session?.tableNumber ?? "01"}',
                                style: TextStyle(color: AppTheme.textMuted, fontSize: 14),
                              ),
                            ],
                          ),
                          Container(
                            padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 8),
                            decoration: BoxDecoration(
                              color: _getStatusColor(currentStatus).withOpacity(0.12),
                              borderRadius: BorderRadius.circular(20),
                              border: Border.all(color: _getStatusColor(currentStatus).withOpacity(0.3)),
                            ),
                            child: Row(
                              mainAxisSize: MainAxisSize.min,
                              children: [
                                Container(
                                  width: 8,
                                  height: 8,
                                  decoration: BoxDecoration(
                                    shape: BoxShape.circle,
                                    color: _getStatusColor(currentStatus),
                                  ),
                                ),
                                const SizedBox(width: 8),
                                Text(
                                  currentStatus,
                                  style: TextStyle(
                                    fontWeight: FontWeight.bold,
                                    color: _getStatusColor(currentStatus),
                                    fontSize: 14,
                                  ),
                                ),
                              ],
                            ),
                          ),
                        ],
                      ),
                      const SizedBox(height: 24),
                      // Visual Stage Stepper
                      Row(
                        mainAxisAlignment: MainAxisAlignment.spaceBetween,
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: List.generate(steps.length, (index) {
                          final isDone = index < currentStepIndex;
                          final isCurrent = index == currentStepIndex;
                          final item = steps[index];

                          Color stepColor;
                          if (isCurrent) {
                            stepColor = AppTheme.primaryAmber;
                          } else if (isDone) {
                            stepColor = AppTheme.vegGreen;
                          } else {
                            stepColor = Colors.grey.shade300;
                          }

                          return Expanded(
                            child: Column(
                              children: [
                                CircleAvatar(
                                  radius: isCurrent ? 22 : 18,
                                  backgroundColor: stepColor,
                                  child: Icon(
                                    isDone ? Icons.check : item['icon'] as IconData,
                                    size: isCurrent ? 22 : 18,
                                    color: (isDone || isCurrent) ? Colors.white : Colors.grey.shade600,
                                  ),
                                ),
                                const SizedBox(height: 8),
                                Text(
                                  item['title'] as String,
                                  style: TextStyle(
                                    fontSize: 12,
                                    fontWeight: isCurrent ? FontWeight.bold : FontWeight.normal,
                                    color: isCurrent ? AppTheme.primaryAmber : (isDone ? AppTheme.primaryDark : AppTheme.textMuted),
                                  ),
                                  textAlign: TextAlign.center,
                                ),
                              ],
                            ),
                          );
                        }),
                      ),
                      const SizedBox(height: 20),
                      Container(
                        padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
                        decoration: BoxDecoration(
                          color: const Color(0xFFFFF9E6),
                          borderRadius: BorderRadius.circular(14),
                          border: Border.all(color: Colors.amber.shade200),
                        ),
                        child: Row(
                          children: [
                            const Icon(Icons.timer_outlined, color: AppTheme.primaryAmber, size: 20),
                            const SizedBox(width: 10),
                            Expanded(
                              child: Text(
                                currentStepIndex >= 3
                                    ? 'Your meal is plated and on its way to your table!'
                                    : 'Estimated Kitchen Prep Time: 12 – 15 mins (Live Updating)',
                                style: TextStyle(color: Colors.brown.shade800, fontSize: 13, fontWeight: FontWeight.w600),
                              ),
                            ),
                          ],
                        ),
                      ),
                    ],
                  ),
                ),
                const SizedBox(height: 20),
                // Service Assistance Card
                Container(
                  padding: const EdgeInsets.all(18),
                  decoration: BoxDecoration(
                    color: Colors.white,
                    borderRadius: BorderRadius.circular(20),
                  ),
                  child: Row(
                    children: [
                      Container(
                        padding: const EdgeInsets.all(12),
                        decoration: BoxDecoration(color: Colors.blue.shade50, shape: BoxShape.circle),
                        child: const Icon(Icons.support_agent, color: Colors.blue, size: 24),
                      ),
                      const SizedBox(width: 14),
                      Expanded(
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            const Text('Need assistance?', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 15)),
                            Text('Call your dedicated table waiter or request water.', style: TextStyle(color: AppTheme.textMuted, fontSize: 12)),
                          ],
                        ),
                      ),
                      ElevatedButton.icon(
                        style: ElevatedButton.styleFrom(
                          backgroundColor: AppTheme.primaryDark,
                          padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 10),
                          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
                        ),
                        onPressed: _callWaiter,
                        icon: const Icon(Icons.ring_volume, size: 16, color: Colors.white),
                        label: const Text('Call Waiter', style: TextStyle(fontSize: 13, color: Colors.white)),
                      ),
                    ],
                  ),
                ),
                const SizedBox(height: 20),
                // Itemized Receipt Card
                Container(
                  padding: const EdgeInsets.all(22),
                  decoration: BoxDecoration(
                    color: Colors.white,
                    borderRadius: BorderRadius.circular(24),
                    boxShadow: [
                      BoxShadow(color: Colors.black.withOpacity(0.04), blurRadius: 20, offset: const Offset(0, 4)),
                    ],
                  ),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      const Row(
                        children: [
                          Icon(Icons.flatware, size: 20, color: AppTheme.primaryAmber),
                          SizedBox(width: 8),
                          Text('Order Details', style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold, color: AppTheme.primaryDark)),
                        ],
                      ),
                      const Divider(height: 24),
                      ...order.items.map((item) {
                        return Padding(
                          padding: const EdgeInsets.symmetric(vertical: 8),
                          child: Row(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Container(
                                padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                                decoration: BoxDecoration(
                                  color: AppTheme.primaryAmber.withOpacity(0.12),
                                  borderRadius: BorderRadius.circular(6),
                                ),
                                child: Text(
                                  '${item.quantity}x',
                                  style: const TextStyle(color: AppTheme.primaryAmber, fontWeight: FontWeight.bold, fontSize: 13),
                                ),
                              ),
                              const SizedBox(width: 12),
                              Expanded(
                                child: Column(
                                  crossAxisAlignment: CrossAxisAlignment.start,
                                  children: [
                                    Text(item.productName, style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 15)),
                                    if (item.addons.isNotEmpty)
                                      Text(
                                        item.addons.map((a) => '+ ${a.addonName}').join(', '),
                                        style: TextStyle(color: AppTheme.textMuted, fontSize: 12),
                                      ),
                                    if (item.specialInstructions != null)
                                      Text(
                                        'Note: ${item.specialInstructions}',
                                        style: const TextStyle(color: Colors.deepOrange, fontSize: 12, fontStyle: FontStyle.italic),
                                      ),
                                  ],
                                ),
                              ),
                              Text(
                                '$currency ${item.totalPrice.toStringAsFixed(2)}',
                                style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 15),
                              ),
                            ],
                          ),
                        );
                      }),
                      const Divider(height: 24),
                      Row(
                        mainAxisAlignment: MainAxisAlignment.spaceBetween,
                        children: [
                          const Text('Subtotal', style: TextStyle(color: AppTheme.textMuted)),
                          Text('$currency ${order.subtotal.toStringAsFixed(2)}', style: const TextStyle(fontWeight: FontWeight.w600)),
                        ],
                      ),
                      const SizedBox(height: 6),
                      Row(
                        mainAxisAlignment: MainAxisAlignment.spaceBetween,
                        children: [
                          const Text('Tax & Fees', style: TextStyle(color: AppTheme.textMuted)),
                          Text('$currency ${order.taxAmount.toStringAsFixed(2)}', style: const TextStyle(fontWeight: FontWeight.w600)),
                        ],
                      ),
                      const Divider(height: 20),
                      Row(
                        mainAxisAlignment: MainAxisAlignment.spaceBetween,
                        children: [
                          const Text('Grand Total Paid', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 16)),
                          Text(
                            '$currency ${order.totalAmount.toStringAsFixed(2)}',
                            style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 20, color: AppTheme.primaryAmber),
                          ),
                        ],
                      ),
                    ],
                  ),
                ),
                const SizedBox(height: 24),
                // Back to menu to order more
                OutlinedButton.icon(
                  style: OutlinedButton.styleFrom(
                    padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 14),
                    shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                  ),
                  onPressed: () => Navigator.pop(context),
                  icon: const Icon(Icons.add_shopping_cart),
                  label: const Text('Add More Items to Table', style: TextStyle(fontSize: 15, fontWeight: FontWeight.bold)),
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }

  Color _getStatusColor(String status) {
    switch (status) {
      case 'PLACED':
        return Colors.blue;
      case 'CONFIRMED':
        return Colors.indigo;
      case 'PREPARING':
        return Colors.orange;
      case 'READY':
        return Colors.green;
      case 'COMPLETED':
        return Colors.teal;
      default:
        return Colors.grey;
    }
  }
}
