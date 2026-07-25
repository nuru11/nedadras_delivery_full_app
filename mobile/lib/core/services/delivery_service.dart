import 'package:dio/dio.dart';

import 'api_client.dart';

/// Result of POST /deliveries/estimate.
class EstimatePlan {
  const EstimatePlan({required this.price, required this.eta});
  final double price;
  final String eta;

  factory EstimatePlan.fromJson(Map<String, dynamic> json) {
    return EstimatePlan(
      price: (json['price'] as num?)?.toDouble() ?? 0,
      eta: json['eta'] as String? ?? '',
    );
  }
}

class EstimateResult {
  const EstimateResult({
    required this.distanceKm,
    required this.plans,
  });

  factory EstimateResult.fromJson(Map<String, dynamic> json) {
    final plansJson = json['plans'] as Map<String, dynamic>? ?? {};
    final plans = {
      'express': EstimatePlan.fromJson(
        Map<String, dynamic>.from(plansJson['express'] as Map? ?? {}),
      ),
      'standard': EstimatePlan.fromJson(
        Map<String, dynamic>.from(plansJson['standard'] as Map? ?? {}),
      ),
      'same_day': EstimatePlan.fromJson(
        Map<String, dynamic>.from(plansJson['same_day'] as Map? ?? {}),
      ),
    };
    return EstimateResult(
      distanceKm: (json['distanceKm'] as num?)?.toDouble() ?? 0,
      plans: plans,
    );
  }

  final double distanceKm;
  final Map<String, EstimatePlan> plans;
}

/// Driver current position (from GET driver-location or socket).
class DriverLocation {
  const DriverLocation({required this.lat, required this.lng});
  final double lat;
  final double lng;
}

/// Active (ongoing) delivery from GET /deliveries/active.
class ActiveDelivery {
  const ActiveDelivery({
    required this.id,
    required this.status,
    required this.pickupAddress,
    required this.dropAddress,
    this.pickupName,
    this.dropName,
    this.receiverName,
    this.receiverPhone,
    this.driverName,
    this.driverPhone,
    required this.distanceKm,
    required this.price,
    this.payment = 'unpaid',
    this.driverCommissionAmount,
    this.amountDueToAdmin,
    this.objectType,
    this.description,
  });

  static double _toDouble(dynamic value) {
    if (value == null) return 0;
    if (value is num) return value.toDouble();
    if (value is String) return double.tryParse(value) ?? 0;
    return 0;
  }

  static String? _optionalString(dynamic value) {
    if (value == null) return null;
    final s = (value as String).trim();
    return s.isEmpty ? null : s;
  }

  factory ActiveDelivery.fromJson(Map<String, dynamic> json) {
    return ActiveDelivery(
      id: json['id'] as String? ?? '',
      status: json['status'] as String? ?? 'pending',
      pickupAddress: json['pickup_address'] as String? ?? '',
      dropAddress: json['drop_address'] as String? ?? '',
      pickupName: json['pickup_name'] as String?,
      dropName: json['drop_name'] as String?,
      receiverName: json['receiver_name'] as String?,
      receiverPhone: json['receiver_phone'] as String?,
      driverName: json['driver_name'] as String?,
      driverPhone: json['driver_phone'] as String?,
      distanceKm: _toDouble(json['distance_km']),
      price: _toDouble(json['price']),
      payment: json['payment'] as String? ?? 'unpaid',
      driverCommissionAmount: json['driver_commission_amount'] != null
          ? _toDouble(json['driver_commission_amount'])
          : null,
      amountDueToAdmin: json['amount_due_to_admin'] != null
          ? _toDouble(json['amount_due_to_admin'])
          : null,
      objectType: _optionalString(json['object_type']),
      description: _optionalString(json['description']),
    );
  }

  /// Copy with updated fields (e.g. after marking delivered or paid).
  ActiveDelivery copyWith({
    String? id,
    String? status,
    String? pickupAddress,
    String? dropAddress,
    String? pickupName,
    String? dropName,
    String? receiverName,
    String? receiverPhone,
    String? driverName,
    String? driverPhone,
    double? distanceKm,
    double? price,
    String? payment,
    double? driverCommissionAmount,
    double? amountDueToAdmin,
    String? objectType,
    String? description,
  }) {
    return ActiveDelivery(
      id: id ?? this.id,
      status: status ?? this.status,
      pickupAddress: pickupAddress ?? this.pickupAddress,
      dropAddress: dropAddress ?? this.dropAddress,
      pickupName: pickupName ?? this.pickupName,
      dropName: dropName ?? this.dropName,
      receiverName: receiverName ?? this.receiverName,
      receiverPhone: receiverPhone ?? this.receiverPhone,
      driverName: driverName ?? this.driverName,
      driverPhone: driverPhone ?? this.driverPhone,
      distanceKm: distanceKm ?? this.distanceKm,
      price: price ?? this.price,
      payment: payment ?? this.payment,
      driverCommissionAmount: driverCommissionAmount ?? this.driverCommissionAmount,
      amountDueToAdmin: amountDueToAdmin ?? this.amountDueToAdmin,
      objectType: objectType ?? this.objectType,
      description: description ?? this.description,
    );
  }

  /// Display label: name if available, else address.
  String get pickupDisplay => (pickupName != null && pickupName!.trim().isNotEmpty) ? pickupName! : pickupAddress;
  String get dropDisplay => (dropName != null && dropName!.trim().isNotEmpty) ? dropName! : dropAddress;

  /// Map with snake_case keys for passing as route arguments or API.
  Map<String, dynamic> toJson() => {
        'id': id,
        'status': status,
        'pickup_address': pickupAddress,
        'drop_address': dropAddress,
        'pickup_name': pickupName,
        'drop_name': dropName,
        'receiver_name': receiverName,
        'receiver_phone': receiverPhone,
        'driver_name': driverName,
        'driver_phone': driverPhone,
        'distance_km': distanceKm,
        'price': price,
        'object_type': objectType,
        'description': description,
      };

  final String id;
  final String status;
  final String pickupAddress;
  final String dropAddress;
  final String? pickupName;
  final String? dropName;
  final String? receiverName;
  final String? receiverPhone;
  final String? driverName;
  final String? driverPhone;
  final double distanceKm;
  final double price;
  final String payment;
  final double? driverCommissionAmount;
  final String? objectType;
  final String? description;
  final double? amountDueToAdmin;
}

/// Past delivery for history list (GET /deliveries/history).
class DeliveryHistoryItem {
  const DeliveryHistoryItem({
    required this.id,
    required this.status,
    required this.pickupAddress,
    required this.dropAddress,
    this.pickupName,
    this.dropName,
    required this.distanceKm,
    required this.price,
    required this.payment,
    required this.createdAt,
  });

  static double _toDouble(dynamic value) {
    if (value == null) return 0;
    if (value is num) return value.toDouble();
    if (value is String) return double.tryParse(value) ?? 0;
    return 0;
  }

  factory DeliveryHistoryItem.fromJson(Map<String, dynamic> json) {
    final createdAt = json['created_at'];
    String dateStr = '';
    if (createdAt != null) {
      if (createdAt is String) dateStr = createdAt;
      else if (createdAt is DateTime) dateStr = createdAt.toIso8601String();
    }
    return DeliveryHistoryItem(
      id: json['id'] as String? ?? '',
      status: json['status'] as String? ?? 'delivered',
      pickupAddress: json['pickup_address'] as String? ?? '',
      dropAddress: json['drop_address'] as String? ?? '',
      pickupName: json['pickup_name'] as String?,
      dropName: json['drop_name'] as String?,
      distanceKm: _toDouble(json['distance_km']),
      price: _toDouble(json['price']),
      payment: json['payment'] as String? ?? 'unpaid',
      createdAt: dateStr,
    );
  }

  String get pickupDisplay => (pickupName != null && pickupName!.trim().isNotEmpty) ? pickupName! : pickupAddress;
  String get dropDisplay => (dropName != null && dropName!.trim().isNotEmpty) ? dropName! : dropAddress;

  final String id;
  final String status;
  final String pickupAddress;
  final String dropAddress;
  final String? pickupName;
  final String? dropName;
  final double distanceKm;
  final double price;
  final String payment;
  final String createdAt;
}

/// Driver payment summary (GET /deliveries/me/payment-summary).
class DriverPaymentSummary {
  const DriverPaymentSummary({
    required this.totalDueFromDeliveries,
    required this.totalSettled,
    required this.balance,
    this.totalCommissionFromWalletPaid = 0,
  });

  factory DriverPaymentSummary.fromJson(Map<String, dynamic> json) {
    double toDouble(dynamic v) {
      if (v == null) return 0;
      if (v is num) return v.toDouble();
      if (v is String) return double.tryParse(v) ?? 0;
      return 0;
    }
    return DriverPaymentSummary(
      totalDueFromDeliveries: toDouble(json['totalDueFromDeliveries']),
      totalSettled: toDouble(json['totalSettled']),
      balance: toDouble(json['balance']),
      totalCommissionFromWalletPaid: toDouble(json['totalCommissionFromWalletPaid']),
    );
  }

  final double totalDueFromDeliveries;
  final double totalSettled;
  final double balance;
  final double totalCommissionFromWalletPaid;
}

/// Calls delivery API: estimate and create.
class DeliveryService {
  DeliveryService({required ApiClient apiClient})
      : _client = apiClient.client;

  final Dio _client;

  static const String _base = '/deliveries';

  /// POST /deliveries/estimate — returns distance and price.
  Future<EstimateResult> estimate({
    required double pickupLat,
    required double pickupLng,
    required double dropoffLat,
    required double dropoffLng,
  }) async {
    final response = await _client.post<Map<String, dynamic>>(
      '$_base/estimate',
      data: {
        'pickup': {'lat': pickupLat, 'lng': pickupLng},
        'dropoff': {'lat': dropoffLat, 'lng': dropoffLng},
      },
    );
    final data = response.data;
    if (data == null) throw Exception('No estimate data');
    return EstimateResult.fromJson(data);
  }

  /// POST /deliveries — create delivery and notify nearby drivers.
  Future<Map<String, dynamic>> create({
    required double pickupLat,
    required double pickupLng,
    required String pickupAddress,
    String? pickupName,
    required double dropoffLat,
    required double dropoffLng,
    required String dropoffAddress,
    String? dropoffName,
    required String deliveryPlan,
    required double price,
    String? receiverName,
    String? receiverPhone,
    String? objectType,
    double? weightKg,
    String? description,
  }) async {
    final response = await _client.post<Map<String, dynamic>>(
      _base,
      data: {
        'pickup': {
          'lat': pickupLat,
          'lng': pickupLng,
          'address': pickupAddress,
          if (pickupName != null && pickupName.trim().isNotEmpty) 'name': pickupName,
        },
        'dropoff': {
          'lat': dropoffLat,
          'lng': dropoffLng,
          'address': dropoffAddress,
          if (dropoffName != null && dropoffName.trim().isNotEmpty) 'name': dropoffName,
        },
        'delivery_plan': deliveryPlan,
        'price': price,
        if (receiverName != null && receiverName.trim().isNotEmpty) 'receiver_name': receiverName,
        if (receiverPhone != null && receiverPhone.trim().isNotEmpty) 'receiver_phone': receiverPhone,
        if (objectType != null && objectType.isNotEmpty) 'object_type': objectType,
        if (weightKg != null && weightKg > 0) 'weight_kg': weightKg,
        if (description != null && description.isNotEmpty) 'description': description,
      },
    );
    final data = response.data;
    if (data == null) throw Exception('No create response');
    return data;
  }

  /// POST /deliveries/outside-town — create outside-town delivery with manual addresses and weight-based price.
  Future<Map<String, dynamic>> createOutsideTown({
    required String pickupAddress,
    required String dropoffAddress,
    required double weightKg,
    required double price,
    String? receiverName,
    String? receiverPhone,
    String? objectType,
    String? description,
  }) async {
    final response = await _client.post<Map<String, dynamic>>(
      '$_base/outside-town',
      data: {
        'pickup_address': pickupAddress,
        'dropoff_address': dropoffAddress,
        'weight_kg': weightKg,
        'price': price,
        if (receiverName != null && receiverName.trim().isNotEmpty)
          'receiver_name': receiverName,
        if (receiverPhone != null && receiverPhone.trim().isNotEmpty)
          'receiver_phone': receiverPhone,
        if (objectType != null && objectType.isNotEmpty)
          'object_type': objectType,
        if (description != null && description.trim().isNotEmpty)
          'description': description.trim(),
      },
    );
    final data = response.data;
    if (data == null) throw Exception('No create outside-town response');
    return data;
  }

  /// GET /deliveries/:id/driver-location — current driver lat/lng (user only).
  Future<DriverLocation?> getDriverLocation(String deliveryId) async {
    final response = await _client.get<Map<String, dynamic>>(
      '$_base/$deliveryId/driver-location',
    );
    final data = response.data;
    if (data == null) return null;
    final lat = (data['lat'] as num?)?.toDouble();
    final lng = (data['lng'] as num?)?.toDouble();
    if (lat == null || lng == null) return null;
    return DriverLocation(lat: lat, lng: lng);
  }

  static const String _requestsBase = '/delivery-requests';

  /// GET /delivery-requests/pending — driver only. Fetches requests missed via socket (e.g. after login).
  /// Returns list of payloads compatible with DeliveryRequestItem.fromSocketPayload.
  Future<List<Map<String, dynamic>>> getPendingDeliveryRequests() async {
    final response = await _client.get<Map<String, dynamic>>('$_requestsBase/pending');
    final data = response.data;
    if (data == null) return [];
    final list = data['requests'] as List<dynamic>? ?? [];
    return list.map((e) => Map<String, dynamic>.from(e as Map)).toList();
  }

  /// POST /delivery-requests/:id/accept — driver only.
  Future<Map<String, dynamic>> acceptDeliveryRequest(String requestId) async {
    final response = await _client.post<Map<String, dynamic>>(
      '$_requestsBase/$requestId/accept',
    );
    final data = response.data;
    if (data == null) throw Exception('No accept response');
    return data;
  }

  /// GET /deliveries/history — past deliveries (delivered/cancelled) for user or driver.
  Future<List<DeliveryHistoryItem>> getDeliveryHistory() async {
    final response = await _client.get<Map<String, dynamic>>('$_base/history');
    final data = response.data;
    if (data == null) return [];
    final list = data['deliveries'] as List<dynamic>? ?? [];
    return list
        .map((e) => DeliveryHistoryItem.fromJson(Map<String, dynamic>.from(e as Map)))
        .toList();
  }

  /// GET /deliveries/active — current ongoing delivery for user or driver.
  Future<ActiveDelivery?> getActiveDelivery() async {
    final response = await _client.get<Map<String, dynamic>>('$_base/active');
    final data = response.data;
    if (data == null) return null;
    final deliveryJson = data['delivery'] as Map<String, dynamic>?;
    if (deliveryJson == null) return null;
    return ActiveDelivery.fromJson(deliveryJson);
  }

  /// GET /deliveries/active-list — all ongoing deliveries for user; for driver returns single in array.
  Future<List<ActiveDelivery>> getActiveDeliveries() async {
    final response = await _client.get<Map<String, dynamic>>('$_base/active-list');
    final data = response.data;
    if (data == null) return [];
    final list = data['deliveries'] as List<dynamic>? ?? [];
    return list
        .map((e) => ActiveDelivery.fromJson(Map<String, dynamic>.from(e as Map)))
        .toList();
  }

  /// PATCH /deliveries/:id/status — driver: "picked" and "delivered".
  Future<void> updateDeliveryStatus(String deliveryId, String status) async {
    await _client.patch<Map<String, dynamic>>(
      '$_base/$deliveryId/status',
      data: {'status': status},
    );
  }

  /// GET /deliveries/me/payment-summary — driver only: own balance and amount due to admin.
  Future<DriverPaymentSummary> getMyPaymentSummary() async {
    final response = await _client.get<Map<String, dynamic>>('$_base/me/payment-summary');
    final data = response.data;
    if (data == null) throw Exception('No payment summary response');
    return DriverPaymentSummary.fromJson(data);
  }

  /// PATCH /deliveries/:id/payment — driver only: mark cash received ("paid").
  /// Returns updated delivery with driver_commission_amount and amount_due_to_admin.
  Future<ActiveDelivery> updateDeliveryPayment(String deliveryId, String payment) async {
    final response = await _client.patch<Map<String, dynamic>>(
      '$_base/$deliveryId/payment',
      data: {'payment': payment},
    );
    final data = response.data;
    if (data == null) throw Exception('No payment update response');
    final deliveryJson = data['delivery'] as Map<String, dynamic>?;
    if (deliveryJson == null) throw Exception('No delivery in payment update response');
    return ActiveDelivery.fromJson(deliveryJson);
  }

  /// POST /deliveries/:id/pay-with-wallet — user only: pay delivered unpaid delivery with wallet.
  Future<void> payWithWallet(String deliveryId) async {
    await _client.post<Map<String, dynamic>>('$_base/$deliveryId/pay-with-wallet');
  }

  /// POST /delivery-requests/:id/reject — driver only.
  Future<Map<String, dynamic>> rejectDeliveryRequest(String requestId) async {
    final response = await _client.post<Map<String, dynamic>>(
      '$_requestsBase/$requestId/reject',
    );
    final data = response.data;
    if (data == null) throw Exception('No reject response');
    return data;
  }
}
