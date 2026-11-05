import 'package:flutter/foundation.dart';
import '../../../data/models/dashboard_summary_model.dart';
import '../../../data/models/product_model.dart';
import '../../../data/services/api_service.dart';

class ManagementViewModel extends ChangeNotifier {
  final ApiService _apiService;

  String? restaurantId;
  String? restaurantName;
  String? token;
  String? userRole;

  bool isAuthenticated = false;
  bool isLoading = false;
  String? errorMessage;

  DashboardSummaryModel? summary;
  List<CategoryModel> categories = [];

  ManagementViewModel({required ApiService apiService}) : _apiService = apiService;

  Future<bool> login(String email, String password) async {
    isLoading = true;
    errorMessage = null;
    notifyListeners();

    try {
      final res = await _apiService.login(email, password);
      token = res['access_token'];
      restaurantId = res['restaurant_id'];
      userRole = res['role'];
      isAuthenticated = true;

      if (restaurantId != null) {
        await loadDashboard();
      }
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

  void setDirectContext(String restId, String restName) {
    restaurantId = restId;
    restaurantName = restName;
    isAuthenticated = true;
    loadDashboard();
  }

  Future<void> loadDashboard() async {
    if (restaurantId == null) return;
    isLoading = true;
    notifyListeners();

    try {
      summary = await _apiService.fetchDashboardSummary(restaurantId!);
      categories = await _apiService.fetchMenu(restaurantId!);
    } catch (e) {
      errorMessage = e.toString();
    } finally {
      isLoading = false;
      notifyListeners();
    }
  }

  Future<void> toggleAvailability(String productId, bool currentVal) async {
    if (restaurantId == null) return;
    try {
      await _apiService.toggleProductAvailability(restaurantId!, productId, !currentVal);
      await loadDashboard();
    } catch (e) {
      errorMessage = e.toString();
      notifyListeners();
    }
  }

  void logout() {
    token = null;
    restaurantId = null;
    restaurantName = null;
    userRole = null;
    isAuthenticated = false;
    summary = null;
    categories = [];
    notifyListeners();
  }
}

