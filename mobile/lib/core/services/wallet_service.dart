import 'api_client.dart';

/// Single wallet transaction from GET /wallet/me.
class WalletTransaction {
  const WalletTransaction({
    required this.id,
    required this.amount,
    required this.type,
    this.deliveryId,
    this.notes,
    required this.createdAt,
  });

  final String id;
  final double amount;
  final String type; // deposit, adjustment, refund, debit_delivery
  final String? deliveryId;
  final String? notes;
  final String createdAt;

  static double _toDouble(dynamic value) {
    if (value == null) return 0;
    if (value is num) return value.toDouble();
    if (value is String) return double.tryParse(value) ?? 0;
    return 0;
  }

  factory WalletTransaction.fromJson(Map<String, dynamic> json) {
    return WalletTransaction(
      id: json['id'] as String? ?? '',
      amount: _toDouble(json['amount']),
      type: json['type'] as String? ?? '',
      deliveryId: json['delivery_id'] as String?,
      notes: json['notes'] as String?,
      createdAt: json['created_at'] as String? ?? '',
    );
  }
}

/// User wallet summary: balance and recent transactions (GET /wallet/me).
class UserWalletSummary {
  const UserWalletSummary({
    required this.balance,
    required this.transactions,
  });

  final double balance;
  final List<WalletTransaction> transactions;

  factory UserWalletSummary.fromJson(Map<String, dynamic> json) {
    final list = json['transactions'] as List<dynamic>? ?? [];
    return UserWalletSummary(
      balance: (json['balance'] as num?)?.toDouble() ?? 0,
      transactions: list
          .map((e) =>
              WalletTransaction.fromJson(Map<String, dynamic>.from(e as Map)))
          .toList(),
    );
  }
}

/// Service for user wallet (GET /wallet/me). User role only.
class WalletService {
  WalletService({required ApiClient apiClient}) : _client = apiClient.client;

  final dynamic _client;
  static const String _base = '/wallet';

  /// GET /wallet/me — balance and recent transactions (user only).
  Future<UserWalletSummary> getMyWallet() async {
    final response =
        await _client.get<Map<String, dynamic>>('$_base/me');
    final data = response.data;
    if (data == null) throw Exception('No wallet response');
    return UserWalletSummary.fromJson(data);
  }
}
