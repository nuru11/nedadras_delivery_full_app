import 'package:get/get.dart';

import '../../../../core/services/delivery_service.dart';
import '../../auth/auth_repository.dart';

class DeliveriesController extends GetxController {
  DeliveriesController({
    required AuthRepository repository,
    required DeliveryService deliveryService,
  })  : _repository = repository,
        _deliveryService = deliveryService;

  final AuthRepository _repository;
  final DeliveryService _deliveryService;

  final RxList<DeliveryHistoryItem> history = <DeliveryHistoryItem>[].obs;
  final RxBool isLoading = false.obs;
  final RxString error = ''.obs;

  bool get isDriver => (_repository.role ?? '').toLowerCase() == 'driver';

  @override
  void onInit() {
    super.onInit();
    fetchHistory();
  }

  Future<void> fetchHistory() async {
    isLoading.value = true;
    error.value = '';
    try {
      final list = await _deliveryService.getDeliveryHistory();
      history.assignAll(list);
    } catch (e) {
      error.value = e.toString().replaceFirst('Exception: ', '');
    } finally {
      isLoading.value = false;
    }
  }
}
