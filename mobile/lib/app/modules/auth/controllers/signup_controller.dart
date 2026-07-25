import 'package:dio/dio.dart';
import 'package:flutter/material.dart';
import 'package:get/get.dart';

import '../auth_repository.dart';
import '../models/auth_models.dart';
import '../../../routes/app_routes.dart';

class SignupController extends GetxController {
  SignupController({required AuthRepository repository})
      : _repository = repository;

  final AuthRepository _repository;

  final GlobalKey<FormState> formKey = GlobalKey<FormState>();
  final TextEditingController nameController = TextEditingController();
  final TextEditingController phoneController = TextEditingController();
  final RxString selectedRole = 'user'.obs;
  final RxBool isLoading = false.obs;
  final Rx<RequestOtpResponse?> lastResponse = Rx<RequestOtpResponse?>(null);

  static const _roles = ['user', 'driver'];

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

  void onRoleChanged(String? value) {
    if (value != null) {
      selectedRole.value = value;
    }
  }

  String? validateName(String? value) {
    final trimmed = value?.trim() ?? '';
    if (trimmed.isEmpty) {
      return 'Name is required';
    }
    if (trimmed.length < 2) {
      return 'Name must be at least 2 characters';
    }
    return null;
  }

  String? validatePhone(String? value) {
    final trimmed = value?.trim() ?? '';
    if (trimmed.isEmpty) {
      return 'Phone number is required';
    }
    if (trimmed.length < 9) {
      return 'Enter a valid phone number';
    }
    return null;
  }

  Future<void> submit() async {
    if (!formKey.currentState!.validate()) {
      return;
    }

    final name = nameController.text.trim();
    final phone = phoneController.text.trim();
    final role = selectedRole.value;

    isLoading.value = true;

    try {
      await _repository.signup(name: name, phone: phone, role: role);

      Get.snackbar(
        'Signup successful',
        'We have sent you an OTP to verify your phone.',
        snackPosition: SnackPosition.BOTTOM,
      );

      final response = await _repository.requestOtp(phone);
      lastResponse.value = response;
      Get.toNamed(
        Routes.otp,
        arguments: {
          'phone': response.phone,
          'flow': 'signup',
        },
      );
    } on DioException catch (e) {
      if (e.response?.statusCode == 409) {
        Get.snackbar(
          'Already registered',
          "This phone number is already registered. Please use a different phone number.",
          snackPosition: SnackPosition.BOTTOM,
          duration: const Duration(seconds: 4),
        );
        return;
      }
      rethrow;
    } catch (error) {
      Get.snackbar(
        'Request Failed',
        _friendlyErrorMessage(error),
        snackPosition: SnackPosition.BOTTOM,
      );
    } finally {
      isLoading.value = false;
    }
  }

  List<DropdownMenuItem<String>> get roleItems => _roles
      .map(
        (role) => DropdownMenuItem(
          value: role,
          child: Text(role[0].toUpperCase() + role.substring(1)),
        ),
      )
      .toList();

  @override
  void onClose() {
    nameController.dispose();
    phoneController.dispose();
    super.onClose();
  }
}
