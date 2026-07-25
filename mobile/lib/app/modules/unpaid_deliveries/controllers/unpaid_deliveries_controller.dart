import 'package:dio/dio.dart';
import 'package:get/get.dart';

import '../../../../core/services/delivery_service.dart';
import '../../auth/auth_repository.dart';

class UnpaidDeliveriesController extends GetxController {
  UnpaidDeliveriesController({
    required AuthRepository repository,
    required DeliveryService deliveryService,
  })  : _repository = repository,
        _deliveryService = deliveryService;

  final AuthRepository _repository;
  final DeliveryService _deliveryService;

  final RxList<DeliveryHistoryItem> unpaidTrips = <DeliveryHistoryItem>[].obs;
  final RxBool isLoading = false.obs;
  final RxString error = ''.obs;
  final RxString _updatingId = ''.obs;

  bool get isDriver => (_repository.role ?? '').toLowerCase() == 'driver';
  bool get isUser => (_repository.role ?? '').toLowerCase() == 'user';
  String get updatingId => _updatingId.value;

  @override
  void onInit() {
    super.onInit();
    fetchUnpaidTrips();
  }

  Future<void> fetchUnpaidTrips() async {
    isLoading.value = true;
    error.value = '';
    try {
      final list = await _deliveryService.getDeliveryHistory();
      // Only delivered & unpaid trips for drivers.
      final filtered = list.where((d) =>
          d.status == 'delivered' &&
          d.payment != 'paid');
      unpaidTrips.assignAll(filtered);
    } catch (e) {
      error.value = e.toString().replaceFirst('Exception: ', '');
    } finally {
      isLoading.value = false;
    }
  }

  Future<void> markTripPaid(DeliveryHistoryItem item) async {
    if (!isDriver) return;
    _updatingId.value = item.id;
    try {
      final updated =
          await _deliveryService.updateDeliveryPayment(item.id, 'paid');
      // Remove from unpaid list now that it's marked as paid.
      unpaidTrips.removeWhere((t) => t.id == item.id);
      final commission = updated.driverCommissionAmount ?? 0;
      final handover = updated.amountDueToAdmin ?? 0;
      Get.snackbar(
        'Payment recorded',
        'Your commission: ${commission.toStringAsFixed(0)} ETB; '
        'amount to hand over: ${handover.toStringAsFixed(0)} ETB',
        duration: const Duration(seconds: 5),
      );
    } catch (e) {
      Get.snackbar('Update failed', e.toString());
    } finally {
      _updatingId.value = '';
    }
  }

  Future<void> payWithWallet(DeliveryHistoryItem item) async {
    if (!isUser) return;
    _updatingId.value = item.id;
    try {
      await _deliveryService.payWithWallet(item.id);
      unpaidTrips.removeWhere((t) => t.id == item.id);
      Get.snackbar(
        'Paid',
        '${item.price.toStringAsFixed(0)} ETB deducted from your wallet.',
        duration: const Duration(seconds: 3),
      );
    } catch (e) {
      String msg = e.toString().replaceFirst('Exception: ', '');
      if (e is DioException && e.response?.data is Map) {
        final data = e.response!.data as Map<String, dynamic>;
        final backendMsg = data['message'] as String?;
        if (backendMsg != null && backendMsg.isNotEmpty) msg = backendMsg;
      }
      Get.snackbar('Payment failed', msg);
    } finally {
      _updatingId.value = '';
    }
  }
}

