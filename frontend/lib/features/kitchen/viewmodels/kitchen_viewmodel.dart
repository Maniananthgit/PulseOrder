import 'dart:async';
import 'package:flutter/foundation.dart';
import '../../../data/models/order_model.dart';
import '../../../data/services/api_service.dart';
import '../../../data/services/websocket_service.dart';

class KitchenViewModel extends ChangeNotifier {
  final ApiService _apiService;
  final WebSocketService _wsService;

  String? branchId;
  String? branchName;
  List<OrderModel> tickets = [];
  String filterStatus = 'ALL';
  bool isLoading = false;
  String? errorMessage;

  StreamSubscription? _wsSubscription;
  Timer? _tickerTimer;

  KitchenViewModel({
    required ApiService apiService,
    required WebSocketService wsService,
  })  : _apiService = apiService,
        _wsService = wsService {
    // Tick every 30 seconds to update elapsed time indicators
    _tickerTimer = Timer.periodic(const Duration(seconds: 30), (_) {
      notifyListeners();
    });
  }

  void initializeKitchen(String bId, {String? name}) {
    branchId = bId;
    branchName = name ?? 'Main Kitchen';
    loadTickets();
    _connectWebSocket();
  }

  Future<void> loadTickets() async {
    if (branchId == null) return;
    isLoading = true;
    errorMessage = null;
    notifyListeners();

    try {
      tickets = await _apiService.fetchKitchenTickets(branchId!);
    } catch (e) {
      errorMessage = e.toString();
    } finally {
      isLoading = false;
      notifyListeners();
    }
  }

  void _connectWebSocket() {
    if (branchId == null) return;
    _wsSubscription?.cancel();
    _wsService.connect('kitchen:$branchId');
    _wsSubscription = _wsService.eventStream.listen((event) {
      final evType = event['event'];
      if (evType == 'NEW_ORDER' || evType == 'ORDER_STATUS_CHANGED') {
        loadTickets();
      }
    });
  }

  void setFilterStatus(String status) {
    filterStatus = status;
    notifyListeners();
  }

  List<OrderModel> get filteredTickets {
    if (filterStatus == 'ALL') return tickets;
    return tickets.where((t) => t.status == filterStatus).toList();
  }

  Future<void> advanceTicket(String orderId) async {
    if (branchId == null) return;
    try {
      await _apiService.advanceKitchenTicket(branchId!, orderId);
      await loadTickets();
    } catch (e) {
      errorMessage = e.toString();
      notifyListeners();
    }
  }

  @override
  void dispose() {
    _wsSubscription?.cancel();
    _tickerTimer?.cancel();
    super.dispose();
  }
}

