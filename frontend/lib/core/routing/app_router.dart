import 'package:go_router/go_router.dart';
import '../widgets/station_navigator_bar.dart';
import '../../features/customer_ordering/views/customer_menu_view.dart';
import '../../features/kitchen/views/kitchen_display_view.dart';
import '../../features/landing/views/landing_selection_view.dart';
import '../../features/management/views/management_dashboard_view.dart';

final GoRouter appRouter = GoRouter(
  initialLocation: '/',
  routes: [
    ShellRoute(
      builder: (context, state, child) {
        return StationNavigatorBar(child: child);
      },
      routes: [
        GoRoute(
          path: '/',
          builder: (context, state) => const LandingSelectionView(),
        ),
        GoRoute(
          path: '/kiosk',
          builder: (context, state) {
            final token = state.uri.queryParameters['token'] ?? 'demo_table_token';
            return CustomerMenuView(qrToken: token);
          },
        ),
        GoRoute(
          path: '/kds',
          builder: (context, state) {
            final branchId = state.uri.queryParameters['branch_id'] ?? '8ce2f68c-698a-4943-8dc6-3442c8d39d58';
            final branchName = state.uri.queryParameters['branch_name'] ?? 'Downtown Kitchen';
            return KitchenDisplayView(branchId: branchId, branchName: branchName);
          },
        ),
        GoRoute(
          path: '/management',
          builder: (context, state) {
            final restId = state.uri.queryParameters['restaurant_id'] ?? '09d59bfd-efeb-4ecc-a267-dd2dede487a4';
            return ManagementDashboardView(initialRestaurantId: restId);
          },
        ),
      ],
    ),
  ],
);
