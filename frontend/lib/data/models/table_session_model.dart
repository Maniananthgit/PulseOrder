class TableSessionModel {
  final bool valid;
  final String tableId;
  final String tableNumber;
  final String branchId;
  final String branchName;
  final String restaurantId;
  final String restaurantName;
  final String currency;
  final double taxPercentage;
  final double serviceChargePercentage;

  TableSessionModel({
    required this.valid,
    required this.tableId,
    required this.tableNumber,
    required this.branchId,
    required this.branchName,
    required this.restaurantId,
    required this.restaurantName,
    required this.currency,
    required this.taxPercentage,
    required this.serviceChargePercentage,
  });

  factory TableSessionModel.fromJson(Map<String, dynamic> json) {
    return TableSessionModel(
      valid: json['valid'] ?? false,
      tableId: json['table_id'] ?? '',
      tableNumber: json['table_number'] ?? '',
      branchId: json['branch_id'] ?? '',
      branchName: json['branch_name'] ?? '',
      restaurantId: json['restaurant_id'] ?? '',
      restaurantName: json['restaurant_name'] ?? '',
      currency: json['currency'] ?? 'USD',
      taxPercentage: (json['tax_percentage'] as num?)?.toDouble() ?? 5.0,
      serviceChargePercentage: (json['service_charge_percentage'] as num?)?.toDouble() ?? 0.0,
    );
  }
}

