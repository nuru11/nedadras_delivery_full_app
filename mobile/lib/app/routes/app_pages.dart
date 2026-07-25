import 'package:get/get.dart';

import '../modules/auth/bindings/login_binding.dart';
import '../modules/auth/bindings/otp_binding.dart';
import '../modules/auth/bindings/signup_binding.dart';
import '../modules/auth/views/login_view.dart';
import '../modules/auth/views/otp_view.dart';
import '../modules/auth/views/signup_view.dart';
import '../modules/deliveries/bindings/deliveries_binding.dart';
import '../modules/deliveries/views/deliveries_view.dart';
import '../modules/home/bindings/home_binding.dart';
import '../modules/home/views/home_view.dart';
import '../modules/journey/bindings/journey_binding.dart';
import '../modules/journey/views/journey_view.dart';
import '../modules/main/bindings/main_binding.dart';
import '../modules/main/views/main_view.dart';
import '../modules/driver_kyc/bindings/driver_kyc_binding.dart';
import '../modules/driver_kyc/views/driver_kyc_view.dart';
import '../modules/driver_review/views/driver_review_view.dart';
import '../modules/unpaid_deliveries/bindings/unpaid_deliveries_binding.dart';
import '../modules/unpaid_deliveries/views/unpaid_deliveries_view.dart';
import 'app_routes.dart';
import 'kyc_middleware.dart';

class AppPages {
  AppPages._();

  static final routes = <GetPage>[
    GetPage(
      name: Routes.login,
      page: () => const LoginView(),
      binding: LoginBinding(),
    ),
    GetPage(
      name: Routes.signup,
      page: () => const SignupView(),
      binding: SignupBinding(),
    ),
    GetPage(
      name: Routes.otp,
      page: () => const OtpView(),
      binding: OtpBinding(),
    ),
    GetPage(
      name: Routes.main,
      page: () => const MainView(),
      binding: MainBinding(),
      middlewares: [
        KycMiddleware(),
      ],
    ),
    GetPage(
      name: Routes.driverKyc,
      page: () => const DriverKycView(),
      binding: DriverKycBinding(),
    ),
    GetPage(
      name: Routes.driverReview,
      page: () => const DriverReviewView(),
    ),
    GetPage(
      name: Routes.home,
      page: () => const HomeView(),
      binding: HomeBinding(),
    ),
    GetPage(
      name: Routes.userHome,
      page: () => const HomeView(),
      binding: HomeBinding(),
    ),
    GetPage(
      name: Routes.driverHome,
      page: () => const HomeView(),
      binding: HomeBinding(),
    ),
    GetPage(
      name: Routes.journey,
      page: () => const JourneyView(),
      binding: JourneyBinding(),
    ),
    GetPage(
      name: Routes.deliveries,
      page: () => const DeliveriesView(),
      binding: DeliveriesBinding(),
    ),
    GetPage(
      name: Routes.unpaidDeliveries,
      page: () => const UnpaidDeliveriesView(),
      binding: UnpaidDeliveriesBinding(),
    ),
  ];
}
