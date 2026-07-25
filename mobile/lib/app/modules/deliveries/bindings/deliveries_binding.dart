import 'package:get/get.dart';

import '../../../../core/services/delivery_service.dart';
import '../../auth/auth_repository.dart';
import '../controllers/deliveries_controller.dart';

class DeliveriesBinding extends Bindings {
  @override
  void dependencies() {
    Get.lazyPut<DeliveriesController>(
      () => DeliveriesController(
        repository: Get.find<AuthRepository>(),
        deliveryService: Get.find<DeliveryService>(),
      ),
    );
  }
}
