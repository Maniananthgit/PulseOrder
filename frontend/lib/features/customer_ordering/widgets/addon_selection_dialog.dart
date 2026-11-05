import 'package:flutter/material.dart';
import '../../../core/theme/app_theme.dart';
import '../../../data/models/product_model.dart';

class AddonSelectionDialog extends StatefulWidget {
  final ProductModel product;
  final String currency;
  final Function(List<ProductAddonModel> addons, String? instructions, String spiceLevel) onConfirm;

  const AddonSelectionDialog({
    super.key,
    required this.product,
    required this.currency,
    required this.onConfirm,
  });

  @override
  State<AddonSelectionDialog> createState() => _AddonSelectionDialogState();
}

class _AddonSelectionDialogState extends State<AddonSelectionDialog> {
  final List<ProductAddonModel> _selectedAddons = [];
  final TextEditingController _instructionCtrl = TextEditingController();
  String _selectedSpiceLevel = 'Medium 🌶️🌶️';

  final List<String> _spiceLevels = [
    'Mild 🌶️',
    'Medium 🌶️🌶️',
    'Hot 🌶️🌶️🌶️',
    'Extra Hot 🌶️🌶️🌶️🌶️',
  ];

  @override
  void dispose() {
    _instructionCtrl.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    double currentPrice = widget.product.basePrice;
    for (var a in _selectedAddons) {
      currentPrice += a.price;
    }

    return Dialog(
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(24)),
      clipBehavior: Clip.antiAlias,
      child: Container(
        constraints: const BoxConstraints(maxWidth: 500),
        child: SingleChildScrollView(
          child: Column(
            mainAxisSize: MainAxisSize.min,
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              // Header Image Banner
              if (widget.product.imageUrl != null && widget.product.imageUrl!.isNotEmpty)
                Stack(
                  children: [
                    SizedBox(
                      height: 170,
                      width: double.infinity,
                      child: Image.network(
                        widget.product.imageUrl!,
                        fit: BoxFit.cover,
                        errorBuilder: (_, __, ___) => Container(color: Colors.grey.shade900),
                      ),
                    ),
                    Positioned(
                      top: 10,
                      right: 10,
                      child: CircleAvatar(
                        backgroundColor: Colors.black54,
                        child: IconButton(
                          icon: const Icon(Icons.close, color: Colors.white, size: 20),
                          onPressed: () => Navigator.pop(context),
                        ),
                      ),
                    ),
                  ],
                )
              else
                Padding(
                  padding: const EdgeInsets.fromLTRB(20, 16, 12, 0),
                  child: Row(
                    children: [
                      Expanded(
                        child: Text(
                          widget.product.name,
                          style: const TextStyle(fontSize: 20, fontWeight: FontWeight.bold),
                        ),
                      ),
                      IconButton(
                        icon: const Icon(Icons.close),
                        onPressed: () => Navigator.pop(context),
                      ),
                    ],
                  ),
                ),
              // Body Content
              Padding(
                padding: const EdgeInsets.all(20),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      widget.product.name,
                      style: const TextStyle(fontSize: 20, fontWeight: FontWeight.w800, color: AppTheme.primaryDark),
                    ),
                    const SizedBox(height: 4),
                    Text(
                      widget.product.description ?? 'Customize your order with chef-selected toppings & sides.',
                      style: const TextStyle(color: AppTheme.textMuted, fontSize: 13),
                    ),
                    const Divider(height: 24),
                    // Spice Level Customizer (Reverse-Engineered Feature)
                    Row(
                      children: [
                        const Icon(Icons.whatshot, size: 18, color: Colors.deepOrange),
                        const SizedBox(width: 8),
                        const Text(
                          'Choose Spice Level',
                          style: TextStyle(fontWeight: FontWeight.bold, fontSize: 15),
                        ),
                      ],
                    ),
                    const SizedBox(height: 8),
                    Wrap(
                      spacing: 8,
                      runSpacing: 8,
                      children: _spiceLevels.map((spice) {
                        final isSel = _selectedSpiceLevel == spice;
                        return ChoiceChip(
                          label: Text(spice),
                          selected: isSel,
                          selectedColor: Colors.deepOrange.shade100,
                          backgroundColor: Colors.grey.shade100,
                          labelStyle: TextStyle(
                            color: isSel ? Colors.deepOrange.shade900 : Colors.black87,
                            fontWeight: isSel ? FontWeight.bold : FontWeight.w500,
                            fontSize: 12,
                          ),
                          onSelected: (_) => setState(() => _selectedSpiceLevel = spice),
                        );
                      }).toList(),
                    ),
                    const SizedBox(height: 18),
                    // Addons list
                    if (widget.product.addons.isNotEmpty) ...[
                      Row(
                        children: [
                          const Icon(Icons.tune, size: 18, color: AppTheme.primaryAmber),
                          const SizedBox(width: 8),
                          const Text(
                            'Choose Your Add-ons',
                            style: TextStyle(fontWeight: FontWeight.bold, fontSize: 15),
                          ),
                        ],
                      ),
                      const SizedBox(height: 10),
                      ...widget.product.addons.map((addon) {
                        final isSelected = _selectedAddons.contains(addon);
                        return Container(
                          margin: const EdgeInsets.only(bottom: 8),
                          decoration: BoxDecoration(
                            color: isSelected ? AppTheme.primaryAmber.withValues(alpha: 0.06) : Colors.grey.shade50,
                            borderRadius: BorderRadius.circular(12),
                            border: Border.all(
                              color: isSelected ? AppTheme.primaryAmber : Colors.grey.shade200,
                              width: 1.5,
                            ),
                          ),
                          child: CheckboxListTile(
                            contentPadding: const EdgeInsets.symmetric(horizontal: 12, vertical: 0),
                            activeColor: AppTheme.primaryAmber,
                            title: Text(addon.name, style: const TextStyle(fontWeight: FontWeight.w600, fontSize: 14)),
                            subtitle: Text(
                              '+${widget.currency} ${addon.price.toStringAsFixed(2)}',
                              style: const TextStyle(color: AppTheme.primaryAmber, fontWeight: FontWeight.bold),
                            ),
                            value: isSelected,
                            onChanged: (val) {
                              setState(() {
                                if (val == true) {
                                  _selectedAddons.add(addon);
                                } else {
                                  _selectedAddons.remove(addon);
                                }
                              });
                            },
                          ),
                        );
                      }),
                      const SizedBox(height: 14),
                    ],
                    const Text(
                      'Special Kitchen Note',
                      style: TextStyle(fontWeight: FontWeight.bold, fontSize: 14),
                    ),
                    const SizedBox(height: 6),
                    TextField(
                      controller: _instructionCtrl,
                      decoration: InputDecoration(
                        hintText: 'e.g. Extra napkins, sauce on the side...',
                        filled: true,
                        fillColor: Colors.grey.shade50,
                        border: OutlineInputBorder(
                          borderRadius: BorderRadius.circular(12),
                          borderSide: BorderSide(color: Colors.grey.shade300),
                        ),
                        contentPadding: const EdgeInsets.symmetric(horizontal: 14, vertical: 10),
                      ),
                    ),
                    const SizedBox(height: 20),
                    // Bottom Add to Cart Button
                    SizedBox(
                      width: double.infinity,
                      height: 50,
                      child: ElevatedButton(
                        style: ElevatedButton.styleFrom(
                          backgroundColor: AppTheme.primaryAmber,
                          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                        ),
                        onPressed: () {
                          final notes = _instructionCtrl.text.trim().isEmpty ? null : _instructionCtrl.text.trim();
                          widget.onConfirm(_selectedAddons, notes, _selectedSpiceLevel);
                          Navigator.pop(context);
                        },
                        child: Row(
                          mainAxisAlignment: MainAxisAlignment.spaceBetween,
                          children: [
                            Text(
                              'ADD TO ORDER (${_selectedSpiceLevel.split(" ").first})',
                              style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 14),
                            ),
                            Text(
                              '${widget.currency} ${currentPrice.toStringAsFixed(2)}',
                              style: const TextStyle(fontWeight: FontWeight.w900, fontSize: 16),
                            ),
                          ],
                        ),
                      ),
                    ),
                  ],
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}
