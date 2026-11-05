import 'package:flutter/material.dart';
import '../../../data/models/order_model.dart';

class KitchenTicketCard extends StatelessWidget {
  final OrderModel order;
  final VoidCallback onAdvance;

  const KitchenTicketCard({
    super.key,
    required this.order,
    required this.onAdvance,
  });

  @override
  Widget build(BuildContext context) {
    final elapsedMinutes = DateTime.now().difference(order.placedAt).inMinutes;
    final isDelayed = elapsedMinutes >= 15;

    Color headerColor;
    String actionLabel;
    IconData actionIcon;

    switch (order.status) {
      case 'PLACED':
        headerColor = const Color(0xFF2563EB); // Royal Blue
        actionLabel = 'ACCEPT & QUEUE';
        actionIcon = Icons.thumb_up_alt_outlined;
        break;
      case 'CONFIRMED':
        headerColor = const Color(0xFFD97706); // Amber Fire
        actionLabel = 'START COOKING';
        actionIcon = Icons.soup_kitchen_outlined;
        break;
      case 'PREPARING':
        headerColor = const Color(0xFFE11D48); // Rose / Active Fire
        actionLabel = 'MARK AS READY';
        actionIcon = Icons.notifications_active;
        break;
      case 'READY':
        headerColor = const Color(0xFF059669); // Emerald
        actionLabel = 'SERVE & COMPLETE';
        actionIcon = Icons.done_all;
        break;
      default:
        headerColor = Colors.grey.shade700;
        actionLabel = 'NEXT STAGE';
        actionIcon = Icons.arrow_forward;
    }

    if (isDelayed) {
      headerColor = const Color(0xFFDC2626); // Bright Crimson
    }

    return Container(
      decoration: BoxDecoration(
        color: const Color(0xFF1E293B), // Dark Slate
        borderRadius: BorderRadius.circular(18),
        border: Border.all(
          color: isDelayed ? Colors.redAccent : const Color(0xFF334155),
          width: isDelayed ? 2.5 : 1.5,
        ),
        boxShadow: [
          BoxShadow(
            color: isDelayed ? Colors.red.withOpacity(0.25) : Colors.black.withOpacity(0.35),
            blurRadius: 12,
            offset: const Offset(0, 4),
          ),
        ],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          // Header Bar
          Container(
            padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
            decoration: BoxDecoration(
              color: headerColor,
              borderRadius: const BorderRadius.vertical(top: Radius.circular(16)),
            ),
            child: Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Row(
                      children: [
                        Text(
                          '#${order.orderNumber}',
                          style: const TextStyle(fontWeight: FontWeight.w900, fontSize: 18, color: Colors.white, letterSpacing: 0.5),
                        ),
                        if (isDelayed) ...[
                          const SizedBox(width: 8),
                          Container(
                            padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
                            decoration: BoxDecoration(
                              color: Colors.white,
                              borderRadius: BorderRadius.circular(4),
                            ),
                            child: const Text(
                              'DELAYED',
                              style: TextStyle(color: Colors.red, fontWeight: FontWeight.bold, fontSize: 10),
                            ),
                          ),
                        ],
                      ],
                    ),
                    const SizedBox(height: 2),
                    Text(
                      order.tableId != null ? 'TABLE DINE-IN' : 'TAKEAWAY / COUNTER',
                      style: const TextStyle(color: Colors.white70, fontSize: 11, fontWeight: FontWeight.bold, letterSpacing: 0.5),
                    ),
                  ],
                ),
                Container(
                  padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 5),
                  decoration: BoxDecoration(
                    color: Colors.black.withOpacity(0.35),
                    borderRadius: BorderRadius.circular(16),
                  ),
                  child: Row(
                    children: [
                      Icon(Icons.schedule, size: 14, color: isDelayed ? Colors.yellowAccent : Colors.white),
                      const SizedBox(width: 4),
                      Text(
                        '${elapsedMinutes}m',
                        style: TextStyle(
                          fontSize: 13,
                          fontWeight: FontWeight.bold,
                          color: isDelayed ? Colors.yellowAccent : Colors.white,
                        ),
                      ),
                    ],
                  ),
                ),
              ],
            ),
          ),
          // Food items list
          Expanded(
            child: ListView.separated(
              padding: const EdgeInsets.all(14),
              itemCount: order.items.length,
              separatorBuilder: (_, __) => const Divider(color: Color(0xFF334155), height: 16),
              itemBuilder: (context, index) {
                final item = order.items[index];
                return Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Row(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Container(
                          padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
                          decoration: BoxDecoration(
                            color: const Color(0xFF0F172A),
                            borderRadius: BorderRadius.circular(6),
                            border: Border.all(color: const Color(0xFF475569)),
                          ),
                          child: Text(
                            '${item.quantity}x',
                            style: const TextStyle(color: Color(0xFF38BDF8), fontWeight: FontWeight.w900, fontSize: 15),
                          ),
                        ),
                        const SizedBox(width: 10),
                        Expanded(
                          child: Text(
                            item.productName,
                            style: const TextStyle(
                              color: Colors.white,
                              fontSize: 15,
                              fontWeight: FontWeight.w700,
                              height: 1.25,
                            ),
                          ),
                        ),
                      ],
                    ),
                    if (item.addons.isNotEmpty)
                      Padding(
                        padding: const EdgeInsets.only(left: 38, top: 4),
                        child: Wrap(
                          spacing: 4,
                          children: item.addons.map((addon) {
                            return Container(
                              padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
                              decoration: BoxDecoration(
                                color: Colors.amber.withOpacity(0.15),
                                borderRadius: BorderRadius.circular(4),
                              ),
                              child: Text(
                                '+ ${addon.addonName}',
                                style: const TextStyle(color: Color(0xFFFBBF24), fontSize: 11, fontWeight: FontWeight.bold),
                              ),
                            );
                          }).toList(),
                        ),
                      ),
                    if (item.specialInstructions != null && item.specialInstructions!.isNotEmpty)
                      Padding(
                        padding: const EdgeInsets.only(left: 38, top: 4),
                        child: Container(
                          padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
                          decoration: BoxDecoration(
                            color: Colors.redAccent.withOpacity(0.2),
                            borderRadius: BorderRadius.circular(6),
                            border: Border.all(color: Colors.redAccent.withOpacity(0.4)),
                          ),
                          child: Row(
                            mainAxisSize: MainAxisSize.min,
                            children: [
                              const Icon(Icons.priority_high, size: 12, color: Colors.redAccent),
                              const SizedBox(width: 4),
                              Flexible(
                                child: Text(
                                  'REQ: ${item.specialInstructions}',
                                  style: const TextStyle(color: Color(0xFFFCA5A5), fontSize: 11, fontWeight: FontWeight.bold),
                                ),
                              ),
                            ],
                          ),
                        ),
                      ),
                  ],
                );
              },
            ),
          ),
          // Large Bump Action Button
          Padding(
            padding: const EdgeInsets.all(12),
            child: SizedBox(
              width: double.infinity,
              height: 48,
              child: ElevatedButton.icon(
                style: ElevatedButton.styleFrom(
                  backgroundColor: headerColor,
                  foregroundColor: Colors.white,
                  elevation: 4,
                  shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                ),
                onPressed: onAdvance,
                icon: Icon(actionIcon, size: 18),
                label: Text(
                  actionLabel,
                  style: const TextStyle(fontSize: 14, fontWeight: FontWeight.bold, letterSpacing: 0.5),
                ),
              ),
            ),
          ),
        ],
      ),
    );
  }
}
