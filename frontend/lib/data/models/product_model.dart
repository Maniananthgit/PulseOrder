class ProductAddonModel {
  final String id;
  final String name;
  final double price;
  final bool isAvailable;

  ProductAddonModel({
    required this.id,
    required this.name,
    required this.price,
    required this.isAvailable,
  });

  factory ProductAddonModel.fromJson(Map<String, dynamic> json) {
    return ProductAddonModel(
      id: json['id'] ?? '',
      name: json['name'] ?? '',
      price: (json['price'] as num?)?.toDouble() ?? 0.0,
      isAvailable: json['is_available'] ?? true,
    );
  }
}

class ProductModel {
  final String id;
  final String restaurantId;
  final String categoryId;
  final String name;
  final String? description;
  final double basePrice;
  final bool isVeg;
  final bool isAvailable;
  final String? imageUrl;
  final List<ProductAddonModel> addons;

  ProductModel({
    required this.id,
    required this.restaurantId,
    required this.categoryId,
    required this.name,
    this.description,
    required this.basePrice,
    required this.isVeg,
    required this.isAvailable,
    this.imageUrl,
    required this.addons,
  });

  factory ProductModel.fromJson(Map<String, dynamic> json) {
    return ProductModel(
      id: json['id'] ?? '',
      restaurantId: json['restaurant_id'] ?? '',
      categoryId: json['category_id'] ?? '',
      name: json['name'] ?? '',
      description: json['description'],
      basePrice: (json['base_price'] as num?)?.toDouble() ?? 0.0,
      isVeg: json['is_veg'] ?? true,
      isAvailable: json['is_available'] ?? true,
      imageUrl: json['image_url'],
      addons: (json['addons'] as List<dynamic>?)
              ?.map((a) => ProductAddonModel.fromJson(a))
              .toList() ??
          [],
    );
  }
}

class CategoryModel {
  final String id;
  final String restaurantId;
  final String name;
  final String? description;
  final int sortOrder;
  final List<ProductModel> products;

  CategoryModel({
    required this.id,
    required this.restaurantId,
    required this.name,
    this.description,
    required this.sortOrder,
    required this.products,
  });

  factory CategoryModel.fromJson(Map<String, dynamic> json) {
    return CategoryModel(
      id: json['id'] ?? '',
      restaurantId: json['restaurant_id'] ?? '',
      name: json['name'] ?? '',
      description: json['description'],
      sortOrder: json['sort_order'] ?? 0,
      products: (json['products'] as List<dynamic>?)
              ?.map((p) => ProductModel.fromJson(p))
              .toList() ??
          [],
    );
  }
}

