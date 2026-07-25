import 'package:get/get.dart';

import '../../../../core/services/delivery_service.dart';
import '../../../../core/services/socket_service.dart';
import '../../auth/auth_repository.dart';
import '../controllers/home_controller.dart';

class HomeBinding extends Bindings {
  @override
  void dependencies() {
    Get.lazyPut<HomeController>(
      () => HomeController(
        repository: Get.find<AuthRepository>(),
        socketService: Get.find<SocketService>(),
        deliveryService: Get.find<DeliveryService>(),
      ),
    );
  }
}
