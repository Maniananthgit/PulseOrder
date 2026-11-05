import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'core/routing/app_router.dart';
import 'core/state/app_navigation_state.dart';
import 'core/theme/app_theme.dart';
import 'data/services/api_service.dart';
import 'data/services/websocket_service.dart';
import 'features/customer_ordering/viewmodels/customer_order_viewmodel.dart';
import 'features/kitchen/viewmodels/kitchen_viewmodel.dart';
import 'features/management/viewmodels/management_viewmodel.dart';

void main() {
  WidgetsFlutterBinding.ensureInitialized();

  final apiService = ApiService();
  final wsService = WebSocketService();

  runApp(
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
}

class PulseOrderApp extends StatelessWidget {
  const PulseOrderApp({super.key});

  @override
  Widget build(BuildContext context) {
    final navState = context.watch<AppNavigationState>();

    return MaterialApp.router(
      title: 'PulseOrder - Smart Table-Side Self-Ordering Platform',
      debugShowCheckedModeBanner: false,
      theme: navState.isDarkMode ? AppTheme.darkKdsTheme : AppTheme.lightTheme,
      routerConfig: appRouter,
    );
  }
}
