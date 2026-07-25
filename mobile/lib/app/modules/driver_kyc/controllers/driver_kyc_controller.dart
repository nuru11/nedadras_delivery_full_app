import 'package:dio/dio.dart';
import 'package:flutter/material.dart';
import 'package:get/get.dart';
import 'package:image_picker/image_picker.dart';

import '../../../../core/storage/storage_service.dart';
import '../../../../core/constants/colors.dart';
import '../../../routes/app_routes.dart';
import '../driver_kyc_provider.dart';

class DriverKycController extends GetxController {
  DriverKycController({
    required DriverKycProvider provider,
    required StorageService storageService,
  })  : _provider = provider,
        _storageService = storageService;

  final DriverKycProvider _provider;
  final StorageService _storageService;
  final ImagePicker _picker = ImagePicker();

  final GlobalKey<FormState> formKey = GlobalKey<FormState>();
  final TextEditingController plateNumberController = TextEditingController();
  final TextEditingController addressController = TextEditingController();
  final RxString selectedVehicleType = 'car'.obs;
  final RxBool isLoading = false.obs;

  final Rx<String?> driverLicensePath = Rx<String?>(null);
  final Rx<String?> fydaFrontPath = Rx<String?>(null);
  final Rx<String?> fydaBackPath = Rx<String?>(null);
  final Rx<String?> additionalDocumentPath = Rx<String?>(null);

  static const vehicleTypes = ['bike', 'car', 'van', 'truck'];

  String _friendlyErrorMessage(Object error) {
    if (error is DioException) {
      final data = error.response?.data;
      if (data is Map && data['message'] != null) {
        return data['message'].toString();
      }
      return error.message ?? 'Request failed';
    }
    return error.toString();
  }

  void onVehicleTypeChanged(String? value) {
    if (value != null) selectedVehicleType.value = value;
  }

  String? validatePlateNumber(String? value) {
    final trimmed = value?.trim() ?? '';
    if (trimmed.isEmpty) return 'Plate number is required';
    return null;
  }

  Future<void> pickImage(Rx<String?> target) async {
    final XFile? file = await _picker.pickImage(
      source: ImageSource.gallery,
      imageQuality: 85,
    );
    if (file != null) target.value = file.path;
  }

  Future<void> submit() async {
    if (!formKey.currentState!.validate()) return;
    if (driverLicensePath.value == null ||
        fydaFrontPath.value == null ||
        fydaBackPath.value == null ||
        additionalDocumentPath.value == null) {
      Get.snackbar(
        'Missing documents',
        'Please upload all required documents: car license, fyda front, fyda back, and additional document.',
        snackPosition: SnackPosition.BOTTOM,
        backgroundColor: AppColors.surface,
      );
      return;
    }

    isLoading.value = true;
    try {
      await _provider.submitKyc(
        plateNumber: plateNumberController.text.trim(),
        vehicleType: selectedVehicleType.value,
        driverLicensePath: driverLicensePath.value!,
        fydaFrontPath: fydaFrontPath.value!,
        fydaBackPath: fydaBackPath.value!,
        additionalDocumentPath: additionalDocumentPath.value!,
      );
      await _storageService.writeKyc(true);
      Get.offAllNamed(Routes.driverReview);
      Get.snackbar(
        'KYC submitted',
        'Your documents have been submitted.',
        snackPosition: SnackPosition.BOTTOM,
        backgroundColor: AppColors.surface,
      );
    } catch (error) {
      Get.snackbar(
        'Submission failed',
        _friendlyErrorMessage(error),
        snackPosition: SnackPosition.BOTTOM,
        backgroundColor: AppColors.surface,
      );
    } finally {
      isLoading.value = false;
    }
  }

  List<DropdownMenuItem<String>> get vehicleTypeItems => vehicleTypes
      .map(
        (t) => DropdownMenuItem(
          value: t,
          child: Text(t[0].toUpperCase() + t.substring(1)),
        ),
      )
      .toList();

  @override
  void onClose() {
    plateNumberController.dispose();
    addressController.dispose();
    super.onClose();
  }
}
