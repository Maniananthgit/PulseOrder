class OrderItemAddonModel {
  final String id;
  final String addonName;
  final double price;

  OrderItemAddonModel({
    required this.id,
    required this.addonName,
    required this.price,
  });

  factory OrderItemAddonModel.fromJson(Map<String, dynamic> json) {
    return OrderItemAddonModel(
      id: json['id'] ?? '',
      addonName: json['addon_name'] ?? '',
      price: (json['price'] as num?)?.toDouble() ?? 0.0,
    );
  }
}

class OrderItemModel {
  final String id;
  final String? productId;
  final String productName;
  final int quantity;
  final double unitPrice;
  final double totalPrice;
  final String? specialInstructions;
  final List<OrderItemAddonModel> addons;

  OrderItemModel({
    required this.id,
    this.productId,
    required this.productName,
    required this.quantity,
    required this.unitPrice,
    required this.totalPrice,
    this.specialInstructions,
    required this.addons,
  });

  factory OrderItemModel.fromJson(Map<String, dynamic> json) {
    return OrderItemModel(
      id: json['id'] ?? '',
      productId: json['product_id'],
      productName: json['product_name'] ?? '',
      quantity: json['quantity'] ?? 1,
      unitPrice: (json['unit_price'] as num?)?.toDouble() ?? 0.0,
      totalPrice: (json['total_price'] as num?)?.toDouble() ?? 0.0,
      specialInstructions: json['special_instructions'],
      addons: (json['addons'] as List<dynamic>?)
              ?.map((a) => OrderItemAddonModel.fromJson(a))
              .toList() ??
          [],
    );
  }
}

class OrderModel {
  final String id;
  final String restaurantId;
  final String branchId;
  final String? tableId;
  final String orderNumber;
  final String status;
  final String orderType;
  final double subtotal;
  final double taxAmount;
  final double serviceCharge;
  final double totalAmount;
  final String? notes;
  final DateTime placedAt;
  final List<OrderItemModel> items;

  OrderModel({
    required this.id,
    required this.restaurantId,
    required this.branchId,
    this.tableId,
    required this.orderNumber,
    required this.status,
    required this.orderType,
    required this.subtotal,
    required this.taxAmount,
    required this.serviceCharge,
    required this.totalAmount,
    this.notes,
    required this.placedAt,
    required this.items,
  });

  factory OrderModel.fromJson(Map<String, dynamic> json) {
    return OrderModel(
      id: json['id'] ?? '',
      restaurantId: json['restaurant_id'] ?? '',
      branchId: json['branch_id'] ?? '',
      tableId: json['table_id'],
      orderNumber: json['order_number'] ?? '',
      status: json['status'] ?? 'PLACED',
      orderType: json['order_type'] ?? 'DINE_IN',
      subtotal: (json['subtotal'] as num?)?.toDouble() ?? 0.0,
      taxAmount: (json['tax_amount'] as num?)?.toDouble() ?? 0.0,
      serviceCharge: (json['service_charge'] as num?)?.toDouble() ?? 0.0,
      totalAmount: (json['total_amount'] as num?)?.toDouble() ?? 0.0,
      notes: json['notes'],
      placedAt: DateTime.tryParse(json['placed_at'] ?? '') ?? DateTime.now(),
      items: (json['items'] as List<dynamic>?)
              ?.map((i) => OrderItemModel.fromJson(i))
              .toList() ??
          [],
    );
  }
}

