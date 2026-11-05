import 'package:flutter_test/flutter_test.dart';
import 'package:pulseorder/data/models/product_model.dart';
import 'package:pulseorder/data/models/table_session_model.dart';
import 'package:pulseorder/data/services/api_service.dart';
import 'package:pulseorder/data/services/websocket_service.dart';
import 'package:pulseorder/features/customer_ordering/viewmodels/customer_order_viewmodel.dart';

void main() {
  group('CustomerOrderViewModel Tests', () {
    late CustomerOrderViewModel viewModel;

    setUp(() {
      viewModel = CustomerOrderViewModel(
        apiService: ApiService(),
        wsService: WebSocketService(),
      );

      viewModel.session = TableSessionModel(
        valid: true,
        tableId: 'tbl-1',
        tableNumber: 'T-01',
        branchId: 'br-1',
        branchName: 'Main Branch',
        restaurantId: 'rest-1',
        restaurantName: 'Gourmet Bistro',
        currency: 'USD',
        taxPercentage: 10.0,
        serviceChargePercentage: 0.0,
      );
    });

    test('Add item with add-ons computes correct unit and total price', () {
      final addon = ProductAddonModel(id: 'add-1', name: 'Extra Truffle', price: 3.0, isAvailable: true);
      final product = ProductModel(
        id: 'prod-1',
        restaurantId: 'rest-1',
        categoryId: 'cat-1',
        name: 'Burger',
        basePrice: 12.0,
        isVeg: false,
        isAvailable: true,
        addons: [addon],
      );

      viewModel.addToCart(product, [addon]);

      expect(viewModel.cartCount, 1);
      // Unit total = 12 + 3 = 15.0
      expect(viewModel.cartSubtotal, 15.0);
      // Tax 10% = 1.50
      expect(viewModel.cartTax, 1.50);
      expect(viewModel.cartTotal, 16.50);

      // Increment quantity
      viewModel.incrementQuantity(0);
      expect(viewModel.cartCount, 2);
      expect(viewModel.cartSubtotal, 30.0);
      expect(viewModel.cartTotal, 33.0);
    });

    test('Dietary veg filtering filters non-veg items', () {
      final vegProduct = ProductModel(
        id: 'p-1',
        restaurantId: 'rest-1',
        categoryId: 'c-1',
        name: 'Veg Salad',
        basePrice: 8.0,
        isVeg: true,
        isAvailable: true,
        addons: [],
      );

      final nonVegProduct = ProductModel(
        id: 'p-2',
        restaurantId: 'rest-1',
        categoryId: 'c-1',
        name: 'Chicken Wings',
        basePrice: 14.0,
        isVeg: false,
        isAvailable: true,
        addons: [],
      );

      viewModel.categories = [
        CategoryModel(
          id: 'c-1',
          restaurantId: 'rest-1',
          name: 'Appetizers',
          sortOrder: 1,
          products: [vegProduct, nonVegProduct],
        )
      ];

      viewModel.selectCategory(0);
      expect(viewModel.currentFilteredProducts.length, 2);

      viewModel.toggleVegOnly(true);
      expect(viewModel.currentFilteredProducts.length, 1);
      expect(viewModel.currentFilteredProducts.first.name, 'Veg Salad');
    });
  });
}

