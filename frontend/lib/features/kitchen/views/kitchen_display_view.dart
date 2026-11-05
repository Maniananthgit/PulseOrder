import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:provider/provider.dart';
import '../../../core/theme/app_theme.dart';
import '../viewmodels/kitchen_viewmodel.dart';
import '../widgets/kitchen_ticket_card.dart';

class KitchenDisplayView extends StatefulWidget {
  final String branchId;
  final String branchName;

  const KitchenDisplayView({
    super.key,
    required this.branchId,
    required this.branchName,
  });

  @override
  State<KitchenDisplayView> createState() => _KitchenDisplayViewState();
}

class _KitchenDisplayViewState extends State<KitchenDisplayView> {
  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) {
      context.read<KitchenViewModel>().initializeKitchen(widget.branchId, name: widget.branchName);
    });
  }

  @override
  Widget build(BuildContext context) {
    final vm = context.watch<KitchenViewModel>();
    final tickets = vm.filteredTickets;

    return Theme(
      data: AppTheme.darkKdsTheme,
      child: Scaffold(
        backgroundColor: const Color(0xFF0F172A), // Dark Navy Slate
        appBar: AppBar(
          backgroundColor: const Color(0xFF1E293B),
          leading: IconButton(
            icon: const Icon(Icons.arrow_back, color: Colors.white),
            onPressed: () {
              if (Navigator.canPop(context)) {
                Navigator.pop(context);
              } else {
                context.go('/');
              }
            },
          ),
          title: Row(
            children: [
              Container(
                padding: const EdgeInsets.all(6),
                decoration: BoxDecoration(
                  color: AppTheme.primaryAmber.withOpacity(0.2),
                  borderRadius: BorderRadius.circular(8),
                ),
                child: const Icon(Icons.soup_kitchen, color: AppTheme.primaryAmber, size: 22),
              ),
              const SizedBox(width: 12),
              Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    'KDS: ${widget.branchName}',
                    style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 18, color: Colors.white),
                  ),
                  const Text(
                    'Live Kitchen Line & Expediter Display',
                    style: TextStyle(color: Colors.white60, fontSize: 11),
                  ),
                ],
              ),
              const SizedBox(width: 16),
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                decoration: BoxDecoration(
                  color: AppTheme.primaryAmber,
                  borderRadius: BorderRadius.circular(12),
                ),
                child: Text(
                  '${vm.tickets.length} ACTIVE',
                  style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 12, color: Colors.white),
                ),
              ),
            ],
          ),
          actions: [
            IconButton(
              icon: const Icon(Icons.refresh, color: Colors.white),
              onPressed: vm.loadTickets,
              tooltip: 'Refresh tickets',
            ),
          ],
        ),
        body: Column(
          children: [
            // Status Filter Bar
            Container(
              padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 10),
              color: const Color(0xFF1E293B).withOpacity(0.6),
              child: SingleChildScrollView(
                scrollDirection: Axis.horizontal,
                child: Row(
                  children: [
                    _filterPill('ALL', 'ALL (${vm.tickets.length})', vm),
                    _filterPill('PLACED', 'NEW PLACED', vm),
                    _filterPill('CONFIRMED', 'CONFIRMED', vm),
                    _filterPill('PREPARING', 'IN PREPARATION', vm),
                    _filterPill('READY', 'READY FOR RUNNER', vm),
                  ],
                ),
              ),
            ),
            Expanded(
              child: vm.isLoading && vm.tickets.isEmpty
                  ? const Center(child: CircularProgressIndicator(color: AppTheme.primaryAmber))
                  : tickets.isEmpty
                      ? Center(
                          child: Column(
                            mainAxisAlignment: MainAxisAlignment.center,
                            children: [
                              Icon(Icons.check_circle_outline, size: 64, color: Colors.grey.shade600),
                              const SizedBox(height: 16),
                              const Text(
                                'Kitchen Line Clear!',
                                style: TextStyle(color: Colors.white, fontSize: 20, fontWeight: FontWeight.bold),
                              ),
                              const SizedBox(height: 6),
                              Text(
                                'All customer tickets have been prepared and completed.',
                                style: TextStyle(color: Colors.grey.shade400, fontSize: 14),
                              ),
                            ],
                          ),
                        )
                      : LayoutBuilder(
                          builder: (context, constraints) {
                            final count = (constraints.maxWidth / 320).floor().clamp(1, 5);
                            return GridView.builder(
                              padding: const EdgeInsets.all(16),
                              gridDelegate: SliverGridDelegateWithFixedCrossAxisCount(
                                crossAxisCount: count,
                                childAspectRatio: 0.8,
                                crossAxisSpacing: 16,
                                mainAxisSpacing: 16,
                              ),
                              itemCount: tickets.length,
                              itemBuilder: (context, index) {
                                final ticket = tickets[index];
                                return KitchenTicketCard(
                                  order: ticket,
                                  onAdvance: () => vm.advanceTicket(ticket.id),
                                );
                              },
                            );
                          },
                        ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _filterPill(String status, String label, KitchenViewModel vm) {
    final isSelected = vm.filterStatus == status;
    return Padding(
      padding: const EdgeInsets.only(right: 8),
      child: ChoiceChip(
        label: Text(label),
        selected: isSelected,
        selectedColor: AppTheme.primaryAmber,
        backgroundColor: const Color(0xFF334155),
        labelStyle: TextStyle(
          color: isSelected ? Colors.white : Colors.white70,
          fontWeight: isSelected ? FontWeight.bold : FontWeight.normal,
          fontSize: 12,
        ),
        onSelected: (_) => vm.setFilterStatus(status),
      ),
    );
  }
}
