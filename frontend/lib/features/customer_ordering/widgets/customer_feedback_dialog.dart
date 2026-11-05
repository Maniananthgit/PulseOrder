import 'package:flutter/material.dart';
import '../../../core/theme/app_theme.dart';

class CustomerFeedbackDialog extends StatefulWidget {
  final String orderNumber;

  const CustomerFeedbackDialog({super.key, required this.orderNumber});

  @override
  State<CustomerFeedbackDialog> createState() => _CustomerFeedbackDialogState();
}

class _CustomerFeedbackDialogState extends State<CustomerFeedbackDialog> {
  int _rating = 5;
  final Set<String> _selectedTags = {'Delicious Food', 'Fast Prep'};
  final TextEditingController _commentCtrl = TextEditingController();

  final List<String> _availableTags = [
    'Delicious Food',
    'Fast Prep',
    'Warm Hospitality',
    'Perfect Spice Level',
    'Great Ambience',
    'Value for Money',
  ];

  @override
  void dispose() {
    _commentCtrl.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return Dialog(
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(24)),
      child: Container(
        constraints: const BoxConstraints(maxWidth: 460),
        padding: const EdgeInsets.all(24),
        child: SingleChildScrollView(
          child: Column(
            mainAxisSize: MainAxisSize.min,
            crossAxisAlignment: CrossAxisAlignment.center,
            children: [
              Container(
                padding: const EdgeInsets.all(12),
                decoration: BoxDecoration(
                  color: Colors.amber.shade100,
                  shape: BoxShape.circle,
                ),
                child: const Icon(Icons.star, color: Colors.amber, size: 36),
              ),
              const SizedBox(height: 14),
              const Text(
                'How was your experience?',
                style: TextStyle(fontSize: 20, fontWeight: FontWeight.bold, color: AppTheme.primaryDark),
              ),
              const SizedBox(height: 4),
              Text(
                'Order #${widget.orderNumber} • Your feedback helps our culinary team.',
                style: TextStyle(color: AppTheme.textMuted, fontSize: 13),
              ),
              const SizedBox(height: 16),
              // Interactive 5 Star Row
              Row(
                mainAxisAlignment: MainAxisAlignment.center,
                children: List.generate(5, (index) {
                  final starIndex = index + 1;
                  return IconButton(
                    iconSize: 34,
                    icon: Icon(
                      starIndex <= _rating ? Icons.star : Icons.star_border,
                      color: Colors.amber,
                    ),
                    onPressed: () => setState(() => _rating = starIndex),
                  );
                }),
              ),
              const SizedBox(height: 16),
              // Tags Selection
              const Align(
                alignment: Alignment.centerLeft,
                child: Text('What did you love most?', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 13)),
              ),
              const SizedBox(height: 8),
              Wrap(
                spacing: 8,
                runSpacing: 8,
                children: _availableTags.map((tag) {
                  final isSelected = _selectedTags.contains(tag);
                  return FilterChip(
                    label: Text(tag),
                    selected: isSelected,
                    selectedColor: AppTheme.primaryAmber.withValues(alpha: 0.15),
                    labelStyle: TextStyle(
                      color: isSelected ? AppTheme.primaryAmber : Colors.grey.shade700,
                      fontWeight: isSelected ? FontWeight.bold : FontWeight.normal,
                      fontSize: 12,
                    ),
                    onSelected: (val) {
                      setState(() {
                        if (val) {
                          _selectedTags.add(tag);
                        } else {
                          _selectedTags.remove(tag);
                        }
                      });
                    },
                  );
                }).toList(),
              ),
              const SizedBox(height: 16),
              TextField(
                controller: _commentCtrl,
                maxLines: 3,
                decoration: InputDecoration(
                  hintText: 'Share more thoughts with the chef...',
                  filled: true,
                  fillColor: Colors.grey.shade50,
                  border: OutlineInputBorder(borderRadius: BorderRadius.circular(12), borderSide: BorderSide(color: Colors.grey.shade300)),
                ),
              ),
              const SizedBox(height: 20),
              SizedBox(
                width: double.infinity,
                height: 48,
                child: ElevatedButton(
                  style: ElevatedButton.styleFrom(
                    backgroundColor: AppTheme.primaryAmber,
                    shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                  ),
                  onPressed: () {
                    Navigator.pop(context, true);
                    ScaffoldMessenger.of(context).showSnackBar(
                      const SnackBar(
                        content: Text('Thank you! Your feedback has been shared with the kitchen & management.'),
                        duration: Duration(seconds: 3),
                      ),
                    );
                  },
                  child: const Text('SUBMIT FEEDBACK', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 14)),
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}

