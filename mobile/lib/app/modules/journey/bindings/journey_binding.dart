import 'package:flutter/widgets.dart';
import 'package:get/get.dart';

import '../../../../core/services/delivery_service.dart';
import '../../../../core/services/socket_service.dart';
import '../../auth/auth_repository.dart';
import '../controllers/journey_controller.dart';

class JourneyBinding extends Bindings {
  @override
  void dependencies() {
    Get.lazyPut<JourneyController>(
      () => JourneyController(
        repository: Get.find<AuthRepository>(),
        deliveryService: Get.find<DeliveryService>(),
        socketService: Get.find<SocketService>(),
      ),
    );
    // When navigating with delivery args or listOnly, apply them in case the
    // controller was reused from the tab and didn't get them in onInit
    final args = Get.arguments;
    if (args is Map<String, dynamic>) {
      final map = Map<String, dynamic>.from(args);
      WidgetsBinding.instance.addPostFrameCallback((_) {
        if (!Get.isRegistered<JourneyController>()) return;
        final ctrl = Get.find<JourneyController>();
        if (map['id'] != null) {
          ctrl.applyRouteArgs(map);
        } else if (map['listOnly'] == true) {
          ctrl.applyListOnlyArgs();
        }
      });
    }
  }
}
