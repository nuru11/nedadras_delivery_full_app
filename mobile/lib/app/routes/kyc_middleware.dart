import 'package:flutter/widgets.dart';
import 'package:get/get.dart';

import '../modules/auth/auth_repository.dart';
import 'app_routes.dart';

/// Ensures drivers without completed KYC only see the KYC screen.
class KycMiddleware extends GetMiddleware {
  @override
  RouteSettings? redirect(String? route) {
    final authRepo = Get.isRegistered<AuthRepository>()
        ? Get.find<AuthRepository>()
        : null;

    if (authRepo == null) return null;

    final role = (authRepo.role ?? '').toLowerCase();
    final kyc = authRepo.kyc;
     final status = (authRepo.status ?? '').toLowerCase();

    final isDriver = role == 'driver';
    final needsKyc = isDriver && !kyc;
    final isPending = isDriver && status == 'pending';

    if (needsKyc && route != Routes.driverKyc) {
      return const RouteSettings(name: Routes.driverKyc);
    }

    if (isPending &&
        route != Routes.driverReview &&
        route != Routes.driverKyc) {
      return const RouteSettings(name: Routes.driverReview);
    }

    return null;
  }
}


