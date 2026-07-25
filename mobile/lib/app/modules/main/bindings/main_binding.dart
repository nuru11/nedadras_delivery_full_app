import 'package:get/get.dart';

import '../../auth/auth_repository.dart';
import '../../deliveries/bindings/deliveries_binding.dart';
import '../../home/bindings/home_binding.dart';
import '../../journey/bindings/journey_binding.dart';
import '../../profile/bindings/profile_binding.dart';
import '../controllers/main_controller.dart';

class MainBinding extends Bindings {
  @override
  void dependencies() {
    Get.lazyPut<MainController>(
      () => MainController(repository: Get.find<AuthRepository>()),
    );
    HomeBinding().dependencies();
    DeliveriesBinding().dependencies();
    JourneyBinding().dependencies();
    ProfileBinding().dependencies();
  }
}
