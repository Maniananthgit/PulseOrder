import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../../../core/theme/app_theme.dart';
import '../viewmodels/customer_order_viewmodel.dart';

class CartSheetView extends StatefulWidget {
  const CartSheetView({super.key});

  @override
  State<CartSheetView> createState() => _CartSheetViewState();
}

class _CartSheetViewState extends State<CartSheetView> {
  final TextEditingController _notesCtrl = TextEditingController();
  int _tipPercentage = 10;
  bool _isSplitBill = false;
  int _guestCount = 2;
  String _paymentMethod = 'UPI'; // 'UPI', 'CARD', 'CASH'

  @override
  void dispose() {
    _notesCtrl.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final vm = context.watch<CustomerOrderViewModel>();
    final currency = vm.session?.currency ?? 'USD';
    final tipAmount = (vm.cartSubtotal * (_tipPercentage / 100.0));
    final grandTotal = vm.cartTotal + tipAmount;
    final perGuestAmount = _isSplitBill ? (grandTotal / _guestCount) : grandTotal;

    return Container(
      height: MediaQuery.of(context).size.height * 0.92,
      decoration: const BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.vertical(top: Radius.circular(28)),
      ),
      child: Column(
        children: [
          // Drag handle
          Center(
            child: Container(
              margin: const EdgeInsets.only(top: 12, bottom: 8),
              width: 48,
              height: 5,
              decoration: BoxDecoration(
                color: Colors.grey.shade300,
                borderRadius: BorderRadius.circular(10),
              ),
            ),
          ),
          // Header Bar
          Padding(
            padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 8),
            child: Row(
              children: [
                Container(
                  padding: const EdgeInsets.all(10),
                  decoration: BoxDecoration(
                    color: AppTheme.primaryAmber.withValues(alpha: 0.12),
                    borderRadius: BorderRadius.circular(12),
                  ),
                  child: const Icon(Icons.receipt_long, color: AppTheme.primaryAmber, size: 24),
                ),
                const SizedBox(width: 12),
                Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    const Text(
                      'Your Table Order',
                      style: TextStyle(fontSize: 20, fontWeight: FontWeight.bold, color: AppTheme.primaryDark),
                    ),
                    Text(
                      '${vm.cartCount} ${vm.cartCount == 1 ? "item" : "items"} selected',
                      style: TextStyle(fontSize: 13, color: AppTheme.textMuted),
                    ),
                  ],
                ),
                const Spacer(),
                IconButton(
                  icon: Container(
                    padding: const EdgeInsets.all(6),
                    decoration: BoxDecoration(color: Colors.grey.shade100, shape: BoxShape.circle),
                    child: const Icon(Icons.close, size: 18),
                  ),
                  onPressed: () => Navigator.pop(context),
                ),
              ],
            ),
          ),
          const Divider(height: 1),
          // Content
          Expanded(
            child: vm.cart.isEmpty
                ? Center(
                    child: Column(
                      mainAxisAlignment: MainAxisAlignment.center,
                      children: [
                        Icon(Icons.shopping_basket_outlined, size: 64, color: Colors.grey.shade300),
                        const SizedBox(height: 16),
                        const Text('Your cart is empty', style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold)),
                        const SizedBox(height: 6),
                        Text('Add some gourmet specialties to begin', style: TextStyle(color: AppTheme.textMuted)),
                      ],
                    ),
                  )
                : SingleChildScrollView(
                    padding: const EdgeInsets.all(20),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        // Order items list
                        ListView.separated(
                          shrinkWrap: true,
                          physics: const NeverScrollableScrollPhysics(),
                          itemCount: vm.cart.length,
                          separatorBuilder: (_, __) => const SizedBox(height: 12),
                          itemBuilder: (context, index) {
                            final item = vm.cart[index];
                            return Container(
                              padding: const EdgeInsets.all(14),
                              decoration: BoxDecoration(
                                color: const Color(0xFFF9FAFB),
                                borderRadius: BorderRadius.circular(16),
                                border: Border.all(color: Colors.grey.shade200),
                              ),
                              child: Row(
                                crossAxisAlignment: CrossAxisAlignment.start,
                                children: [
                                  // Veg indicator badge
                                  Container(
                                    margin: const EdgeInsets.only(top: 3),
                                    padding: const EdgeInsets.all(3),
                                    decoration: BoxDecoration(
                                      border: Border.all(
                                        color: item.product.isVeg ? AppTheme.vegGreen : AppTheme.nonVegRed,
                                        width: 1.5,
                                      ),
                                      borderRadius: BorderRadius.circular(4),
                                    ),
                                    child: Container(
                                      width: 6,
                                      height: 6,
                                      decoration: BoxDecoration(
                                        shape: BoxShape.circle,
                                        color: item.product.isVeg ? AppTheme.vegGreen : AppTheme.nonVegRed,
                                      ),
                                    ),
                                  ),
                                  const SizedBox(width: 12),
                                  // Product Info
                                  Expanded(
                                    child: Column(
                                      crossAxisAlignment: CrossAxisAlignment.start,
                                      children: [
                                        Text(
                                          item.product.name,
                                          style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 15, color: AppTheme.primaryDark),
                                        ),
                                        const SizedBox(height: 4),
                                        // Spice level chip (Reverse-engineered)
                                        Container(
                                          padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 2),
                                          decoration: BoxDecoration(
                                            color: Colors.deepOrange.shade50,
                                            borderRadius: BorderRadius.circular(6),
                                            border: Border.all(color: Colors.deepOrange.shade200),
                                          ),
                                          child: Text(
                                            item.spiceLevel,
                                            style: TextStyle(color: Colors.deepOrange.shade900, fontSize: 11, fontWeight: FontWeight.bold),
                                          ),
                                        ),
                                        if (item.selectedAddons.isNotEmpty) ...[
                                          const SizedBox(height: 6),
                                          Wrap(
                                            spacing: 6,
                                            runSpacing: 4,
                                            children: item.selectedAddons.map((addon) {
                                              return Container(
                                                padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 2),
                                                decoration: BoxDecoration(
                                                  color: Colors.amber.shade50,
                                                  borderRadius: BorderRadius.circular(6),
                                                  border: Border.all(color: Colors.amber.shade200),
                                                ),
                                                child: Text(
                                                  '+ ${addon.name} ($currency ${addon.price.toStringAsFixed(2)})',
                                                  style: TextStyle(color: Colors.amber.shade900, fontSize: 11, fontWeight: FontWeight.w600),
                                                ),
                                              );
                                            }).toList(),
                                          ),
                                        ],
                                        if (item.specialInstructions != null && item.specialInstructions!.isNotEmpty) ...[
                                          const SizedBox(height: 4),
                                          Text(
                                            'Note: "${item.specialInstructions}"',
                                            style: const TextStyle(color: Colors.deepOrange, fontSize: 12, fontStyle: FontStyle.italic),
                                          ),
                                        ],
                                        const SizedBox(height: 6),
                                        Text(
                                          '$currency ${item.totalPrice.toStringAsFixed(2)}',
                                          style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 15, color: AppTheme.primaryDark),
                                        ),
                                      ],
                                    ),
                                  ),
                                  // Stepper controls
                                  Container(
                                    decoration: BoxDecoration(
                                      color: Colors.white,
                                      borderRadius: BorderRadius.circular(10),
                                      border: Border.all(color: Colors.grey.shade300),
                                    ),
                                    child: Row(
                                      mainAxisSize: MainAxisSize.min,
                                      children: [
                                        InkWell(
                                          onTap: () => vm.decrementQuantity(index),
                                          borderRadius: const BorderRadius.horizontal(left: Radius.circular(10)),
                                          child: Padding(
                                            padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 6),
                                            child: Icon(
                                              item.quantity == 1 ? Icons.delete_outline : Icons.remove,
                                              size: 16,
                                              color: item.quantity == 1 ? Colors.red : Colors.grey.shade700,
                                            ),
                                          ),
                                        ),
                                        Container(
                                          padding: const EdgeInsets.symmetric(horizontal: 8),
                                          child: Text(
                                            '${item.quantity}',
                                            style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 14),
                                          ),
                                        ),
                                        InkWell(
                                          onTap: () => vm.incrementQuantity(index),
                                          borderRadius: const BorderRadius.horizontal(right: Radius.circular(10)),
                                          child: Padding(
                                            padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 6),
                                            child: Icon(Icons.add, size: 16, color: Colors.grey.shade700),
                                          ),
                                        ),
                                      ],
                                    ),
                                  ),
                                ],
                              ),
                            );
                          },
                        ),
                        const SizedBox(height: 20),
                        // Split Bill Feature (Reverse-Engineered from smart-kiosk-demo)
                        Container(
                          padding: const EdgeInsets.all(16),
                          decoration: BoxDecoration(
                            color: Colors.blue.shade50.withValues(alpha: 0.5),
                            borderRadius: BorderRadius.circular(16),
                            border: Border.all(color: Colors.blue.shade200),
                          ),
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Row(
                                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                                children: [
                                  const Row(
                                    children: [
                                      Icon(Icons.pie_chart_outline, color: Colors.blue, size: 20),
                                      SizedBox(width: 8),
                                      Text('Split Bill Option', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 14)),
                                    ],
                                  ),
                                  Switch(
                                    value: _isSplitBill,
                                    activeColor: Colors.blue,
                                    onChanged: (val) => setState(() => _isSplitBill = val),
                                  ),
                                ],
                              ),
                              if (_isSplitBill) ...[
                                const Divider(height: 16),
                                Row(
                                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                                  children: [
                                    const Text('Number of Diners / Guests:'),
                                    Row(
                                      children: [2, 3, 4, 5].map((count) {
                                        final isSel = _guestCount == count;
                                        return Padding(
                                          padding: const EdgeInsets.symmetric(horizontal: 3),
                                          child: ChoiceChip(
                                            label: Text('$count'),
                                            selected: isSel,
                                            selectedColor: Colors.blue,
                                            labelStyle: TextStyle(color: isSel ? Colors.white : Colors.black87, fontWeight: FontWeight.bold),
                                            onSelected: (_) => setState(() => _guestCount = count),
                                          ),
                                        );
                                      }).toList(),
                                    ),
                                  ],
                                ),
                                const SizedBox(height: 8),
                                Container(
                                  padding: const EdgeInsets.all(10),
                                  decoration: BoxDecoration(color: Colors.white, borderRadius: BorderRadius.circular(10)),
                                  child: Row(
                                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                                    children: [
                                      Text('Each Guest Pays ($_guestCount ways):', style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 13)),
                                      Text(
                                        '$currency ${perGuestAmount.toStringAsFixed(2)}',
                                        style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 16, color: Colors.blue),
                                      ),
                                    ],
                                  ),
                                ),
                              ],
                            ],
                          ),
                        ),
                        const SizedBox(height: 20),
                        // Payment Method Selection (Reverse-Engineered)
                        const Text(
                          'Select Payment Method',
                          style: TextStyle(fontWeight: FontWeight.bold, fontSize: 14, color: AppTheme.primaryDark),
                        ),
                        const SizedBox(height: 8),
                        Row(
                          children: [
                            {'id': 'UPI', 'label': 'UPI / QR Pay', 'icon': Icons.qr_code_scanner},
                            {'id': 'CARD', 'label': 'Credit / Debit', 'icon': Icons.credit_card},
                            {'id': 'CASH', 'label': 'Pay at Table', 'icon': Icons.payments_outlined},
                          ].map((pm) {
                            final isSel = _paymentMethod == pm['id'];
                            return Expanded(
                              child: Padding(
                                padding: const EdgeInsets.symmetric(horizontal: 4),
                                child: InkWell(
                                  onTap: () => setState(() => _paymentMethod = pm['id'] as String),
                                  borderRadius: BorderRadius.circular(12),
                                  child: Container(
                                    padding: const EdgeInsets.symmetric(vertical: 12),
                                    decoration: BoxDecoration(
                                      color: isSel ? AppTheme.primaryAmber : Colors.grey.shade100,
                                      borderRadius: BorderRadius.circular(12),
                                      border: Border.all(color: isSel ? AppTheme.primaryAmber : Colors.grey.shade300),
                                    ),
                                    child: Column(
                                      children: [
                                        Icon(pm['icon'] as IconData, size: 20, color: isSel ? Colors.white : Colors.black87),
                                        const SizedBox(height: 4),
                                        Text(
                                          pm['label'] as String,
                                          style: TextStyle(
                                            fontSize: 11,
                                            fontWeight: FontWeight.bold,
                                            color: isSel ? Colors.white : Colors.black87,
                                          ),
                                        ),
                                      ],
                                    ),
                                  ),
                                ),
                              ),
                            );
                          }).toList(),
                        ),
                        const SizedBox(height: 20),
                        // Gratuity / Chef Tip Selector
                        const Text(
                          'Compliments to the Kitchen & Waitstaff',
                          style: TextStyle(fontWeight: FontWeight.bold, fontSize: 14, color: AppTheme.primaryDark),
                        ),
                        const SizedBox(height: 8),
                        Row(
                          children: [0, 10, 15, 20].map((tip) {
                            final isSelected = _tipPercentage == tip;
                            return Expanded(
                              child: Padding(
                                padding: const EdgeInsets.symmetric(horizontal: 4),
                                child: InkWell(
                                  onTap: () => setState(() => _tipPercentage = tip),
                                  borderRadius: BorderRadius.circular(10),
                                  child: Container(
                                    padding: const EdgeInsets.symmetric(vertical: 10),
                                    decoration: BoxDecoration(
                                      color: isSelected ? AppTheme.primaryAmber : Colors.grey.shade100,
                                      borderRadius: BorderRadius.circular(10),
                                      border: Border.all(
                                        color: isSelected ? AppTheme.primaryAmber : Colors.grey.shade300,
                                      ),
                                    ),
                                    child: Center(
                                      child: Text(
                                        tip == 0 ? 'No Tip' : '$tip%',
                                        style: TextStyle(
                                          fontWeight: FontWeight.bold,
                                          fontSize: 13,
                                          color: isSelected ? Colors.white : AppTheme.primaryDark,
                                        ),
                                      ),
                                    ),
                                  ),
                                ),
                              ),
                            );
                          }).toList(),
                        ),
                        const SizedBox(height: 24),
                        // Billing Breakdown Card
                        Container(
                          padding: const EdgeInsets.all(16),
                          decoration: BoxDecoration(
                            color: const Color(0xFFF9FAFB),
                            borderRadius: BorderRadius.circular(16),
                            border: Border.all(color: Colors.grey.shade200),
                          ),
                          child: Column(
                            children: [
                              Row(
                                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                                children: [
                                  Text('Subtotal', style: TextStyle(color: AppTheme.textMuted)),
                                  Text('$currency ${vm.cartSubtotal.toStringAsFixed(2)}', style: const TextStyle(fontWeight: FontWeight.w600)),
                                ],
                              ),
                              const SizedBox(height: 8),
                              Row(
                                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                                children: [
                                  Text('Tax & VAT (${vm.session?.taxPercentage ?? 5.0}%)', style: TextStyle(color: AppTheme.textMuted)),
                                  Text('$currency ${vm.cartTax.toStringAsFixed(2)}', style: const TextStyle(fontWeight: FontWeight.w600)),
                                ],
                              ),
                              if (_tipPercentage > 0) ...[
                                const SizedBox(height: 8),
                                Row(
                                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                                  children: [
                                    Text('Staff Gratuity ($_tipPercentage%)', style: TextStyle(color: AppTheme.textMuted)),
                                    Text('$currency ${tipAmount.toStringAsFixed(2)}', style: const TextStyle(fontWeight: FontWeight.w600)),
                                  ],
                                ),
                              ],
                              const Divider(height: 20),
                              Row(
                                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                                children: [
                                  const Text('Total Amount', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 17, color: AppTheme.primaryDark)),
                                  Text(
                                    '$currency ${grandTotal.toStringAsFixed(2)}',
                                    style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 22, color: AppTheme.primaryAmber),
                                  ),
                                ],
                              ),
                            ],
                          ),
                        ),
                      ],
                    ),
                  ),
          ),
          // Bottom Action Button
          if (vm.cart.isNotEmpty)
            Container(
              padding: const EdgeInsets.all(20),
              decoration: BoxDecoration(
                color: Colors.white,
                boxShadow: [
                  BoxShadow(color: Colors.black.withValues(alpha: 0.06), blurRadius: 10, offset: const Offset(0, -4)),
                ],
              ),
              child: SafeArea(
                top: false,
                child: SizedBox(
                  width: double.infinity,
                  height: 54,
                  child: ElevatedButton(
                    style: ElevatedButton.styleFrom(
                      backgroundColor: AppTheme.primaryAmber,
                      elevation: 4,
                      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(14)),
                    ),
                    onPressed: vm.isLoading
                        ? null
                        : () async {
                            final success = await vm.placeOrder(
                              notes: _notesCtrl.text.trim().isEmpty ? null : _notesCtrl.text.trim(),
                            );
                            if (success && context.mounted) {
                              Navigator.pop(context, true);
                            }
                          },
                    child: vm.isLoading
                        ? const SizedBox(
                            width: 24,
                            height: 24,
                            child: CircularProgressIndicator(color: Colors.white, strokeWidth: 2.5),
                          )
                        : Row(
                            mainAxisAlignment: MainAxisAlignment.center,
                            children: [
                              const Icon(Icons.flash_on, color: Colors.white),
                              const SizedBox(width: 8),
                              Text(
                                _isSplitBill
                                    ? 'PAY ($currency ${perGuestAmount.toStringAsFixed(2)}/each via $_paymentMethod)'
                                    : 'ORDER & PAY ($currency ${grandTotal.toStringAsFixed(2)} via $_paymentMethod)',
                                style: const TextStyle(fontSize: 15, fontWeight: FontWeight.bold, letterSpacing: 0.5),
                              ),
                            ],
                          ),
                  ),
                ),
              ),
            ),
        ],
      ),
    );
  }
}
