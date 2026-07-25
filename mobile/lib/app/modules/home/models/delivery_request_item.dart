/// Incoming delivery request (from socket driver:delivery_request).
class DeliveryRequestItem {
  DeliveryRequestItem({
    required this.deliveryRequestId,
    required this.deliveryId,
    required this.pickupAddress,
    required this.dropAddress,
    this.pickupName,
    this.dropName,
    required this.distanceKm,
    required this.price,
    required this.objectType,
  });

  static double _toDouble(dynamic value) {
    if (value == null) return 0;
    if (value is num) return value.toDouble();
    if (value is String) return double.tryParse(value) ?? 0;
    return 0;
  }

  factory DeliveryRequestItem.fromSocketPayload(Map<String, dynamic> payload) {
    final delivery = payload['delivery'] as Map<String, dynamic>? ?? {};
    return DeliveryRequestItem(
      deliveryRequestId: (payload['deliveryRequestId'] ?? '').toString(),
      deliveryId: (payload['deliveryId'] ?? '').toString(),
      pickupAddress: (delivery['pickup_address'] ?? '').toString(),
      dropAddress: (delivery['drop_address'] ?? '').toString(),
      pickupName: delivery['pickup_name'] as String?,
      dropName: delivery['drop_name'] as String?,
      distanceKm: _toDouble(delivery['distance_km']),
      price: _toDouble(delivery['price']),
      objectType: (delivery['object_type'] ?? '').toString(),
    );
  }

  String get pickupDisplay => (pickupName != null && pickupName!.trim().isNotEmpty) ? pickupName! : pickupAddress;
  String get dropDisplay => (dropName != null && dropName!.trim().isNotEmpty) ? dropName! : dropAddress;

  final String deliveryRequestId;
  final String deliveryId;
  final String pickupAddress;
  final String dropAddress;
  final String? pickupName;
  final String? dropName;
  final double distanceKm;
  final double price;
  final String objectType;
}
