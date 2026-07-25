import 'package:dio/dio.dart';
import 'package:flutter/material.dart';
import 'package:get/get.dart';

import '../auth_repository.dart';
import '../models/auth_models.dart';
import '../../../routes/app_routes.dart';

class LoginController extends GetxController {
  LoginController({required AuthRepository repository}) : _repository = repository;

  final AuthRepository _repository;

  final GlobalKey<FormState> formKey = GlobalKey<FormState>();
  final TextEditingController phoneController = TextEditingController();
  final RxBool isLoading = false.obs;
  final Rx<RequestOtpResponse?> lastResponse = Rx<RequestOtpResponse?>(null);

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

  String? validatePhone(String? value) {
    final trimmed = value?.trim() ?? '';
    if (trimmed.isEmpty) {
      return 'Phone number is required';
    }
    
    if (trimmed.length != 10 || !RegExp(r'^09\d{8}$').hasMatch(trimmed)) {
      return 'Enter a valid phone number';
    }
    return null;
  }

  Future<void> submit() async {
    if (!formKey.currentState!.validate()) {
      return;
    }

    final phone = phoneController.text.trim();
    isLoading.value = true;

    try {
      final response = await _repository.login(phone);
      lastResponse.value = response;
      Get.toNamed(
        Routes.otp,
        arguments: {
          'phone': response.phone,
          'flow': 'login',
        },
      );
    } catch (error) {
      Get.snackbar(
        'Login Failed',
        _friendlyErrorMessage(error),
        snackPosition: SnackPosition.BOTTOM,
      );
    } finally {
      isLoading.value = false;
    }
  }

  void goToSignup() {
    Get.offAllNamed(Routes.signup);
  }

  @override
  void onClose() {
    phoneController.dispose();
    super.onClose();
  }
}

