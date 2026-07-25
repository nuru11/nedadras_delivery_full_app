import 'package:dio/dio.dart';
import 'package:get/get.dart';

import '../../../../core/services/delivery_service.dart';
import '../../../../core/services/wallet_service.dart';
import '../../../routes/app_routes.dart';
import '../../auth/auth_repository.dart';
import '../../home/controllers/home_controller.dart';

class ProfileController extends GetxController {
  ProfileController({
    required AuthRepository repository,
    required DeliveryService deliveryService,
    required WalletService walletService,
  })  : _repository = repository,
        _deliveryService = deliveryService,
        _walletService = walletService;

  final AuthRepository _repository;
  final DeliveryService _deliveryService;
  final WalletService _walletService;

  final Rxn<DriverPaymentSummary> driverBalance = Rxn<DriverPaymentSummary>();
  final RxBool balanceLoading = false.obs;
  final RxString balanceError = ''.obs;

  final Rxn<UserWalletSummary> userWallet = Rxn<UserWalletSummary>();
  final RxBool walletLoading = false.obs;
  final RxString walletError = ''.obs;

  final RxBool deleteLoading = false.obs;

  String? get phone => _repository.phone;
  String? get role => _repository.role;
  bool get isDriver => (role ?? '').toLowerCase() == 'driver';
  bool get isUser => (role ?? '').toLowerCase() == 'user';

  /// Display name; falls back to phone if name is empty.
  String get displayName {
    final name = _repository.name?.trim();
    if (name != null && name.isNotEmpty) return name;
    return _repository.phone ?? 'Unknown';
  }

  @override
  void onInit() {
    super.onInit();
    if (isDriver) fetchDriverBalance();
    if (isUser) fetchUserWallet();
  }

  Future<void> fetchUserWallet() async {
    if (!isUser) return;
    walletLoading.value = true;
    walletError.value = '';
    try {
      final summary = await _walletService.getMyWallet();
      userWallet.value = summary;
    } catch (e) {
      walletError.value = e.toString().replaceFirst('Exception: ', '');
      userWallet.value = null;
    } finally {
      walletLoading.value = false;
    }
  }

  Future<void> fetchDriverBalance() async {
    if (!isDriver) return;
    balanceLoading.value = true;
    balanceError.value = '';
    try {
      final summary = await _deliveryService.getMyPaymentSummary();
      driverBalance.value = summary;
    } catch (e) {
      balanceError.value = e.toString().replaceFirst('Exception: ', '');
      driverBalance.value = null;
    } finally {
      balanceLoading.value = false;
    }
  }

  Future<void> logout() async {
    if (Get.isRegistered<HomeController>()) {
      await Get.find<HomeController>().logout();
    } else {
      await _repository.logout();
      Get.offAllNamed(Routes.signup);
    }
  }

  Future<void> deleteAccount() async {
    deleteLoading.value = true;
    try {
      await _repository.deleteAccount();
      if (Get.isRegistered<HomeController>()) {
        await Get.find<HomeController>().logout();
      } else {
        Get.offAllNamed(Routes.signup);
      }
    } on DioException catch (e) {
      final data = e.response?.data;
      String msg = 'Request failed';
      if (data is Map) {
        msg = (data['message'] ?? data['error'] ?? msg).toString();
      } else if (e.message != null && e.message!.isNotEmpty) {
        msg = e.message!;
      }
      Get.snackbar('Delete failed', msg);
    } catch (e) {
      Get.snackbar(
        'Delete failed',
        e.toString().replaceFirst('Exception: ', ''),
      );
    } finally {
      deleteLoading.value = false;
    }
  }
}
