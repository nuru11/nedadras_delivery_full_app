import 'package:delivery_app/app/modules/auth/auth_repository.dart';
import 'package:get/get.dart';

import '../controllers/otp_controller.dart';

class OtpBinding extends Bindings {
  @override
  void dependencies() {
    final args = Get.arguments as Map<String, dynamic>? ?? {};
    final phone = args['phone'] as String? ?? '';
    final flow = args['flow'] as String? ?? 'signup';

    Get.lazyPut<OtpController>(
      () => OtpController(
        repository: Get.find<AuthRepository>(),
        phone: phone,
        flow: flow,
      ),
    );
  }
}
