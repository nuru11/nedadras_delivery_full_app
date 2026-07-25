import 'package:flutter/material.dart';
import 'package:get/get.dart';

import 'app/modules/auth/auth_provider.dart';
import 'app/modules/auth/auth_repository.dart';
import 'app/routes/app_pages.dart';
import 'app/routes/app_routes.dart';
import 'core/services/api_client.dart';
import 'core/services/delivery_service.dart';
import 'core/services/places_service.dart';
import 'core/services/socket_service.dart';
import 'core/services/wallet_service.dart';
import 'core/storage/storage_service.dart';

Future<void> main() async {
  WidgetsFlutterBinding.ensureInitialized();

  final storageService = await StorageService().init();
  Get.put<StorageService>(storageService, permanent: true);
  Get.put<ApiClient>(
    ApiClient(storageService: Get.find<StorageService>()),
    permanent: true,
  );
  Get.put<AuthProvider>(
    AuthProvider(apiClient: Get.find<ApiClient>()),
    permanent: true,
  );
  Get.put<AuthRepository>(
    AuthRepository(
      provider: Get.find<AuthProvider>(),
      storageService: Get.find<StorageService>(),
    ),
    permanent: true,
  );
  Get.put<PlacesService>(PlacesService(), permanent: true);
  Get.put<DeliveryService>(
    DeliveryService(apiClient: Get.find<ApiClient>()),
    permanent: true,
  );
  Get.put<WalletService>(
    WalletService(apiClient: Get.find<ApiClient>()),
    permanent: true,
  );
  Get.put<SocketService>(
    SocketService(storageService: Get.find<StorageService>()),
    permanent: true,
  );

  final token = storageService.readToken();

  // Refresh user info (status, kyc, etc.) from backend when a token exists,
  // so we don't rely on stale cached values after admin updates.
  if (token != null && token.isNotEmpty) {
    await Get.find<AuthRepository>().refreshCurrentUser();
  }

  final role = storageService.readRole();
  final kyc = storageService.readKyc();
  final status = storageService.readStatus();
  final isDriver = (role ?? '').toLowerCase() == 'driver';
  final needsKyc = token != null && isDriver && !kyc;
  final isPending =
      token != null && isDriver && (status ?? '').toLowerCase() == 'pending';
  final initialRoute = token == null
      ? Routes.login
      : needsKyc
          ? Routes.driverKyc
          : isPending
              ? Routes.driverReview
              : Routes.main;

  runApp(MyApp(initialRoute: initialRoute));
}

class MyApp extends StatelessWidget {
  const MyApp({super.key, required this.initialRoute});

  final String initialRoute;

  @override
  Widget build(BuildContext context) {
    return GetMaterialApp(
      title: 'Delivery App',
      debugShowCheckedModeBanner: false,
      initialRoute: initialRoute,
      getPages: AppPages.routes,
      theme: ThemeData(
        colorScheme: ColorScheme.fromSeed(seedColor: const Color(0xFFF26522)),
        useMaterial3: true,
      ),
    );
  }
}
