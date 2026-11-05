import 'dart:async';
import 'package:flutter/foundation.dart';
import '../../../data/models/order_model.dart';
import '../../../data/models/product_model.dart';
import '../../../data/models/table_session_model.dart';
import '../../../data/services/api_service.dart';
import '../../../data/services/websocket_service.dart';

class CartItem {
  final ProductModel product;
  final List<ProductAddonModel> selectedAddons;
  int quantity;
  String? specialInstructions;
  String spiceLevel;

  CartItem({
    required this.product,
    required this.selectedAddons,
    this.quantity = 1,
    this.specialInstructions,
    this.spiceLevel = 'Medium 🌶️🌶️',
  });

  double get unitPrice {
    double total = product.basePrice;
    for (var addon in selectedAddons) {
      total += addon.price;
    }
    return total;
  }

  double get totalPrice => unitPrice * quantity;
}

class CustomerOrderViewModel extends ChangeNotifier {
  final ApiService _apiService;
  final WebSocketService _wsService;

  TableSessionModel? session;
  List<CategoryModel> categories = [];
  int selectedCategoryIndex = 0;
  bool isVegOnly = false;
  String searchQuery = '';
  bool isLoading = false;
  String? errorMessage;

  final List<CartItem> cart = [];
  OrderModel? activeOrder;
  StreamSubscription? _wsSubscription;

  CustomerOrderViewModel({
    required ApiService apiService,
    required WebSocketService wsService,
  })  : _apiService = apiService,
        _wsService = wsService;

  // Initialize from table token
  Future<void> initializeTable(String qrToken) async {
    isLoading = true;
    errorMessage = null;
    notifyListeners();

    try {
      session = await _apiService.verifyTable(qrToken);
      await loadMenu();
      _connectWebSocket();
    } catch (e) {
      errorMessage = e.toString();
    } finally {
      isLoading = false;
      notifyListeners();
    }
  }

  Future<void> loadMenu() async {
    if (session == null) return;
    try {
      categories = await _apiService.fetchMenu(session!.restaurantId);
    } catch (e) {
      errorMessage = e.toString();
    }
    notifyListeners();
  }

  void _connectWebSocket() {
    if (session == null) return;
    _wsSubscription?.cancel();
    _wsService.connect('table:${session!.tableId}');
    _wsSubscription = _wsService.eventStream.listen((event) {
      if (event['event'] == 'ORDER_STATUS_CHANGED') {
        if (activeOrder != null && event['order_id'] == activeOrder!.id) {
          activeOrder = OrderModel(
            id: activeOrder!.id,
            restaurantId: activeOrder!.restaurantId,
            branchId: activeOrder!.branchId,
            tableId: activeOrder!.tableId,
            orderNumber: activeOrder!.orderNumber,
            status: event['status'],
            orderType: activeOrder!.orderType,
            subtotal: activeOrder!.subtotal,
            taxAmount: activeOrder!.taxAmount,
            serviceCharge: activeOrder!.serviceCharge,
            totalAmount: activeOrder!.totalAmount,
            notes: activeOrder!.notes,
            placedAt: activeOrder!.placedAt,
            items: activeOrder!.items,
          );
          notifyListeners();
        }
      }
    });
  }

  void selectCategory(int index) {
    selectedCategoryIndex = index;
    notifyListeners();
  }

  void toggleVegOnly(bool val) {
    isVegOnly = val;
    notifyListeners();
  }

  void setSearchQuery(String query) {
    searchQuery = query;
    notifyListeners();
  }

  List<ProductModel> get currentFilteredProducts {
    if (categories.isEmpty || selectedCategoryIndex >= categories.length) return [];
    var list = categories[selectedCategoryIndex].products;
    if (isVegOnly) {
      list = list.where((p) => p.isVeg).toList();
    }
    if (searchQuery.isNotEmpty) {
      list = list.where((p) => p.name.toLowerCase().contains(searchQuery.toLowerCase())).toList();
    }
    return list;
  }

  // Cart operations
  void addToCart(
    ProductModel product,
    List<ProductAddonModel> addons, {
    String? instructions,
    String spiceLevel = 'Medium 🌶️🌶️',
  }) {
    final existingIndex = cart.indexWhere(
      (item) => item.product.id == product.id && _compareAddons(item.selectedAddons, addons) && item.spiceLevel == spiceLevel,
    );

    if (existingIndex >= 0) {
      cart[existingIndex].quantity++;
    } else {
      cart.add(CartItem(
        product: product,
        selectedAddons: addons,
        quantity: 1,
        specialInstructions: instructions,
        spiceLevel: spiceLevel,
      ));
    }
    notifyListeners();
  }

  bool _compareAddons(List<ProductAddonModel> a, List<ProductAddonModel> b) {
    if (a.length != b.length) return false;
    final aIds = a.map((e) => e.id).toSet();
    final bIds = b.map((e) => e.id).toSet();
    return aIds.containsAll(bIds);
  }

  void incrementQuantity(int index) {
    cart[index].quantity++;
    notifyListeners();
  }

  void decrementQuantity(int index) {
    if (cart[index].quantity > 1) {
      cart[index].quantity--;
    } else {
      cart.removeAt(index);
    }
    notifyListeners();
  }

  int get cartCount => cart.fold(0, (sum, item) => sum + item.quantity);

  double get cartSubtotal => cart.fold(0.0, (sum, item) => sum + item.totalPrice);

  double get cartTax => session == null ? 0.0 : cartSubtotal * (session!.taxPercentage / 100.0);

  double get cartTotal => cartSubtotal + cartTax;

  Future<bool> placeOrder({String? notes}) async {
    if (session == null || cart.isEmpty) return false;
    isLoading = true;
    notifyListeners();

    try {
      final payload = {
        'restaurant_id': session!.restaurantId,
        'branch_id': session!.branchId,
        'table_id': session!.tableId,
        'order_type': 'DINE_IN',
        'notes': notes,
        'items': cart.map((item) => {
          'product_id': item.product.id,
          'quantity': item.quantity,
          'special_instructions': item.specialInstructions,
          'addon_ids': item.selectedAddons.map((a) => a.id).toList(),
        }).toList(),
      };

      activeOrder = await _apiService.placeOrder(payload);
      cart.clear();
      isLoading = false;
      notifyListeners();
      return true;
    } catch (e) {
      errorMessage = e.toString();
      isLoading = false;
      notifyListeners();
      return false;
    }
  }

  @override
  void dispose() {
    _wsSubscription?.cancel();
    super.dispose();
  }
}

