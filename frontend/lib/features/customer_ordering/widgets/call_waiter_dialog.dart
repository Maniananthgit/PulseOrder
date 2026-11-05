import 'package:flutter/material.dart';
import '../../../core/theme/app_theme.dart';

class CallWaiterDialog extends StatefulWidget {
  final String tableNumber;

  const CallWaiterDialog({super.key, required this.tableNumber});

  @override
  State<CallWaiterDialog> createState() => _CallWaiterDialogState();
}

class _CallWaiterDialogState extends State<CallWaiterDialog> {
  String _selectedReason = 'Need Water';
  final TextEditingController _noteCtrl = TextEditingController();

  final List<Map<String, dynamic>> _reasons = [
    {'title': 'Need Water', 'icon': Icons.water_drop_outlined, 'desc': 'Fresh drinking water or ice'},
    {'title': 'Need Assistance', 'icon': Icons.support_agent, 'desc': 'Question about the menu or service'},
    {'title': 'Need Cutlery', 'icon': Icons.flatware, 'desc': 'Extra forks, spoons, or napkins'},
    {'title': 'Need Bill', 'icon': Icons.receipt_long, 'desc': 'Request printed checkout bill'},
  ];

  @override
  void dispose() {
    _noteCtrl.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return Dialog(
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(24)),
      child: Container(
        constraints: const BoxConstraints(maxWidth: 440),
        padding: const EdgeInsets.all(24),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              children: [
                Container(
                  padding: const EdgeInsets.all(10),
                  decoration: BoxDecoration(
                    color: Colors.amber.shade100,
                    borderRadius: BorderRadius.circular(12),
                  ),
                  child: const Icon(Icons.notifications_active, color: Colors.orange, size: 24),
                ),
                const SizedBox(width: 14),
                Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    const Text('Call Table Waiter', style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold)),
                    Text('Table ${widget.tableNumber} Dedicated Assistance', style: TextStyle(color: AppTheme.textMuted, fontSize: 12)),
                  ],
                ),
                const Spacer(),
                IconButton(
                  icon: const Icon(Icons.close, size: 20),
                  onPressed: () => Navigator.pop(context),
                ),
              ],
            ),
            const Divider(height: 24),
            const Text('What do you need?', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 14)),
            const SizedBox(height: 12),
            ..._reasons.map((r) {
              final isSel = _selectedReason == r['title'];
              return Container(
                margin: const EdgeInsets.only(bottom: 8),
                child: InkWell(
                  onTap: () => setState(() => _selectedReason = r['title'] as String),
                  borderRadius: BorderRadius.circular(12),
                  child: Container(
                    padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 12),
                    decoration: BoxDecoration(
                      color: isSel ? AppTheme.primaryAmber.withValues(alpha: 0.08) : Colors.grey.shade50,
                      borderRadius: BorderRadius.circular(12),
                      border: Border.all(
                        color: isSel ? AppTheme.primaryAmber : Colors.grey.shade200,
                        width: isSel ? 2 : 1,
                      ),
                    ),
                    child: Row(
                      children: [
                        Icon(r['icon'] as IconData, color: isSel ? AppTheme.primaryAmber : Colors.grey.shade700, size: 22),
                        const SizedBox(width: 12),
                        Expanded(
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Text(r['title'] as String, style: TextStyle(fontWeight: FontWeight.bold, fontSize: 14, color: isSel ? AppTheme.primaryDark : Colors.black87)),
                              Text(r['desc'] as String, style: TextStyle(color: AppTheme.textMuted, fontSize: 11)),
                            ],
                          ),
                        ),
                        if (isSel)
                          const Icon(Icons.check_circle, color: AppTheme.primaryAmber, size: 20),
                      ],
                    ),
                  ),
                ),
              );
            }),
            const SizedBox(height: 12),
            TextField(
              controller: _noteCtrl,
              decoration: InputDecoration(
                hintText: 'Additional note (optional)...',
                filled: true,
                fillColor: Colors.grey.shade50,
                border: OutlineInputBorder(borderRadius: BorderRadius.circular(12), borderSide: BorderSide(color: Colors.grey.shade300)),
                contentPadding: const EdgeInsets.symmetric(horizontal: 14, vertical: 10),
              ),
            ),
            const SizedBox(height: 20),
            SizedBox(
              width: double.infinity,
              height: 48,
              child: ElevatedButton.icon(
                style: ElevatedButton.styleFrom(
                  backgroundColor: AppTheme.primaryAmber,
                  shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                ),
                onPressed: () {
                  Navigator.pop(context, true);
                  ScaffoldMessenger.of(context).showSnackBar(
                    SnackBar(
                      backgroundColor: const Color(0xFF0F172A),
                      behavior: SnackBarBehavior.floating,
                      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                      content: Row(
                        children: [
                          const Icon(Icons.check_circle, color: Colors.greenAccent),
                          const SizedBox(width: 12),
                          Expanded(
                            child: Text(
                              'Table ${widget.tableNumber}: Server notified for "$_selectedReason".',
                              style: const TextStyle(fontWeight: FontWeight.bold),
                            ),
                          ),
                        ],
                      ),
                      duration: const Duration(seconds: 4),
                    ),
                  );
                },
                icon: const Icon(Icons.ring_volume, color: Colors.white, size: 18),
                label: const Text('DISPATCH REQUEST TO STAFF', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 13)),
              ),
            ),
          ],
        ),
      ),
    );
  }
}

