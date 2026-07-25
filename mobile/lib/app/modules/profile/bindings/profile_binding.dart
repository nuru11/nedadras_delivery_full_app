import 'package:get/get.dart';

import '../../../../core/services/delivery_service.dart';
import '../../../../core/services/wallet_service.dart';
import '../../auth/auth_repository.dart';
import '../controllers/profile_controller.dart';

class ProfileBinding extends Bindings {
  @override
  void dependencies() {
    Get.lazyPut<ProfileController>(
      () => ProfileController(
        repository: Get.find<AuthRepository>(),
        deliveryService: Get.find<DeliveryService>(),
        walletService: Get.find<WalletService>(),
      ),
    );
  }
}
