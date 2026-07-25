import 'package:get/get.dart';

import '../../../../core/services/delivery_service.dart';
import '../../auth/auth_repository.dart';
import '../controllers/unpaid_deliveries_controller.dart';

class UnpaidDeliveriesBinding extends Bindings {
  @override
  void dependencies() {
    Get.lazyPut<UnpaidDeliveriesController>(
      () => UnpaidDeliveriesController(
        repository: Get.find<AuthRepository>(),
        deliveryService: Get.find<DeliveryService>(),
      ),
    );
  }
}

