import 'package:get/get.dart';

import '../../../../core/services/api_client.dart';
import '../../../../core/storage/storage_service.dart';
import '../driver_kyc_provider.dart';
import '../controllers/driver_kyc_controller.dart';

class DriverKycBinding extends Bindings {
  @override
  void dependencies() {
    Get.lazyPut<DriverKycProvider>(
      () => DriverKycProvider(apiClient: Get.find<ApiClient>()),
    );
    Get.lazyPut<DriverKycController>(
      () => DriverKycController(
        provider: Get.find<DriverKycProvider>(),
        storageService: Get.find<StorageService>(),
      ),
    );
  }
}

