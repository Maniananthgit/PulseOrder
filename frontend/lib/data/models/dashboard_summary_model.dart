class ProductSalesStatModel {
  final String productName;
  final int totalQuantity;
  final double totalSales;

  ProductSalesStatModel({
    required this.productName,
    required this.totalQuantity,
    required this.totalSales,
  });

  factory ProductSalesStatModel.fromJson(Map<String, dynamic> json) {
    return ProductSalesStatModel(
      productName: json['product_name'] ?? '',
      totalQuantity: json['total_quantity'] ?? 0,
      totalSales: (json['total_sales'] as num?)?.toDouble() ?? 0.0,
    );
  }
}

class DashboardSummaryModel {
  final double totalSales;
  final int totalOrders;
  final int completedOrders;
  final int preparingOrders;
  final int pendingOrders;
  final int cancelledOrders;
  final List<ProductSalesStatModel> topSellingProducts;

  DashboardSummaryModel({
    required this.totalSales,
    required this.totalOrders,
    required this.completedOrders,
    required this.preparingOrders,
    required this.pendingOrders,
    required this.cancelledOrders,
    required this.topSellingProducts,
  });

  factory DashboardSummaryModel.fromJson(Map<String, dynamic> json) {
    return DashboardSummaryModel(
      totalSales: (json['total_sales'] as num?)?.toDouble() ?? 0.0,
      totalOrders: json['total_orders'] ?? 0,
      completedOrders: json['completed_orders'] ?? 0,
      preparingOrders: json['preparing_orders'] ?? 0,
      pendingOrders: json['pending_orders'] ?? 0,
      cancelledOrders: json['cancelled_orders'] ?? 0,
      topSellingProducts: (json['top_selling_products'] as List<dynamic>?)
              ?.map((p) => ProductSalesStatModel.fromJson(p))
              .toList() ??
          [],
    );
  }
}

