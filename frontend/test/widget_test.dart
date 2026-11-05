import 'package:flutter_test/flutter_test.dart';
import 'package:provider/provider.dart';
import 'package:pulseorder/core/state/app_navigation_state.dart';
import 'package:pulseorder/data/services/api_service.dart';
import 'package:pulseorder/data/services/websocket_service.dart';
import 'package:pulseorder/features/customer_ordering/viewmodels/customer_order_viewmodel.dart';
import 'package:pulseorder/features/kitchen/viewmodels/kitchen_viewmodel.dart';
import 'package:pulseorder/features/management/viewmodels/management_viewmodel.dart';
import 'package:pulseorder/main.dart';

void main() {
  testWidgets('PulseOrder app launches and renders landing page', (WidgetTester tester) async {
    final apiService = ApiService();
    final wsService = WebSocketService();

    await tester.pumpWidget(
      MultiProvider(
        providers: [
          ChangeNotifierProvider(create: (_) => AppNavigationState()),
          Provider<ApiService>.value(value: apiService),
          Provider<WebSocketService>.value(value: wsService),
          ChangeNotifierProvider(
            create: (_) => CustomerOrderViewModel(
              apiService: apiService,
              wsService: wsService,
            ),
          ),
          ChangeNotifierProvider(
            create: (_) => KitchenViewModel(
              apiService: apiService,
              wsService: wsService,
            ),
          ),
          ChangeNotifierProvider(
            create: (_) => ManagementViewModel(
              apiService: apiService,
            ),
          ),
        ],
        child: const PulseOrderApp(),
      ),
    );
    await tester.pumpAndSettle();

    expect(find.text('PulseOrder'), findsOneWidget);
    expect(find.text('Customer Kiosk'), findsAtLeastNWidgets(1));
    expect(find.text('Kitchen KDS'), findsAtLeastNWidgets(1));
    expect(find.text('Management'), findsAtLeastNWidgets(1));
  });
}
