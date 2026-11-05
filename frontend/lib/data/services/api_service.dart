import 'dart:convert';
import 'package:http/http.dart' as http;
import '../../core/constants/api_constants.dart';
import '../models/dashboard_summary_model.dart';
import '../models/order_model.dart';
import '../models/product_model.dart';
import '../models/table_session_model.dart';

class ApiService {
  String? _authToken;

  void setAuthToken(String token) {
    _authToken = token;
  }

  Map<String, String> _headers() {
    final headers = {'Content-Type': 'application/json'};
    if (_authToken != null) {
      headers['Authorization'] = 'Bearer $_authToken';
    }
    return headers;
  }

  // 1. Verify Table QR Token
  Future<TableSessionModel> verifyTable(String qrToken) async {
    final response = await http.get(
      Uri.parse('${ApiConstants.baseUrl}/tables/verify/$qrToken'),
      headers: _headers(),
    );
    if (response.statusCode == 200) {
      return TableSessionModel.fromJson(jsonDecode(response.body));
    }
    throw Exception('Invalid table token: ${response.body}');
  }

  // 2. Fetch Menu Categories & Products
  Future<List<CategoryModel>> fetchMenu(String restaurantId) async {
    final response = await http.get(
      Uri.parse('${ApiConstants.baseUrl}/restaurants/$restaurantId/categories'),
      headers: _headers(),
    );
    if (response.statusCode == 200) {
      final List<dynamic> data = jsonDecode(response.body);
      return data.map((c) => CategoryModel.fromJson(c)).toList();
    }
    throw Exception('Failed to load menu: ${response.body}');
  }

  // 3. Place Order
  Future<OrderModel> placeOrder(Map<String, dynamic> payload) async {
    final response = await http.post(
      Uri.parse('${ApiConstants.baseUrl}/orders/'),
      headers: _headers(),
      body: jsonEncode(payload),
    );
    if (response.statusCode == 201) {
      return OrderModel.fromJson(jsonDecode(response.body));
    }
    throw Exception('Order placement failed: ${response.body}');
  }

  // 4. Kitchen Tickets
  Future<List<OrderModel>> fetchKitchenTickets(String branchId) async {
    final response = await http.get(
      Uri.parse('${ApiConstants.baseUrl}/kitchen/$branchId/tickets'),
      headers: _headers(),
    );
    if (response.statusCode == 200) {
      final List<dynamic> data = jsonDecode(response.body);
      return data.map((o) => OrderModel.fromJson(o)).toList();
    }
    throw Exception('Failed to load kitchen tickets: ${response.body}');
  }

  // 5. Kitchen Advance Ticket
  Future<OrderModel> advanceKitchenTicket(String branchId, String orderId) async {
    final response = await http.post(
      Uri.parse('${ApiConstants.baseUrl}/kitchen/$branchId/tickets/$orderId/advance'),
      headers: _headers(),
    );
    if (response.statusCode == 200) {
      return OrderModel.fromJson(jsonDecode(response.body));
    }
    throw Exception('Failed to advance ticket: ${response.body}');
  }

  // 6. Management Login
  Future<Map<String, dynamic>> login(String email, String password) async {
    final response = await http.post(
      Uri.parse('${ApiConstants.baseUrl}/auth/login'),
      headers: {'Content-Type': 'application/json'},
      body: jsonEncode({'email': email, 'password': password}),
    );
    if (response.statusCode == 200) {
      final data = jsonDecode(response.body);
      setAuthToken(data['access_token']);
      return data;
    }
    throw Exception('Login failed: ${response.body}');
  }

  // 7. Dashboard Summary
  Future<DashboardSummaryModel> fetchDashboardSummary(String restaurantId) async {
    final response = await http.get(
      Uri.parse('${ApiConstants.baseUrl}/reports/$restaurantId/summary'),
      headers: _headers(),
    );
    if (response.statusCode == 200) {
      return DashboardSummaryModel.fromJson(jsonDecode(response.body));
    }
    throw Exception('Failed to fetch dashboard summary: ${response.body}');
  }

  // 8. Toggle Product Availability
  Future<void> toggleProductAvailability(String restaurantId, String productId, bool isAvailable) async {
    final response = await http.put(
      Uri.parse('${ApiConstants.baseUrl}/restaurants/$restaurantId/products/$productId'),
      headers: _headers(),
      body: jsonEncode({'is_available': isAvailable}),
    );
    if (response.statusCode != 200) {
      throw Exception('Failed to update product: ${response.body}');
    }
  }
}

