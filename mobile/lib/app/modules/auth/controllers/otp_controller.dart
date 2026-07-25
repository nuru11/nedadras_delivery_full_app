import 'dart:async';

import 'package:flutter/material.dart';
import 'package:get/get.dart';
import 'package:dio/dio.dart';

import '../auth_repository.dart';
import '../models/auth_models.dart';
import '../../../routes/app_routes.dart';

class OtpController extends GetxController {
  OtpController({
    required AuthRepository repository,
    required String phone,
    required String flow,
  })  : _repository = repository,
        phoneNumber = phone,
        flow = flow;

  final AuthRepository _repository;
  final String phoneNumber;
  final String flow;

  final GlobalKey<FormState> formKey = GlobalKey<FormState>();
  final TextEditingController otpController = TextEditingController();
  final RxBool isLoading = false.obs;
  final RxInt secondsRemaining = 0.obs;

  Timer? _timer;

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

  @override
  void onInit() {
    super.onInit();
    _startTimer();
  }

  void _startTimer() {
    secondsRemaining.value = 5 * 60; // 5 minutes
    _timer?.cancel();
    _timer = Timer.periodic(const Duration(seconds: 1), (timer) {
      if (secondsRemaining.value == 0) {
        timer.cancel();
      } else {
        secondsRemaining.value--;
      }
    });
  }

  String formatRemaining() {
    final minutes = secondsRemaining.value ~/ 60;
    final seconds = secondsRemaining.value % 60;
    return '${minutes.toString().padLeft(2, '0')}:${seconds.toString().padLeft(2, '0')}';
  }

  String? validateOtp(String? value) {
    final trimmed = value?.trim() ?? '';
    if (trimmed.isEmpty) {
      return 'OTP is required';
    }
    if (trimmed.length != 4) {
      return 'OTP must be 4 digits';
    }
    return null;
  }

  Future<void> verify() async {
    if (!formKey.currentState!.validate()) {
      return;
    }

    final otp = otpController.text.trim();
    isLoading.value = true;

    try {
      final VerifyOtpResponse response;
      if (flow == 'login') {
        response = await _repository.verifyLogin(phone: phoneNumber, otp: otp);
      } else {
        response = await _repository.verifyOtp(phone: phoneNumber, otp: otp);
      }
      final isDriver = response.user.role.toLowerCase() == 'driver';
      final needsKyc = isDriver && !response.user.kyc;
      final isPending =
          isDriver && (response.user.status.toLowerCase() == 'pending');

      if (needsKyc) {
        Get.offAllNamed(Routes.driverKyc);
      } else if (isPending) {
        Get.offAllNamed(Routes.driverReview);
      } else {
        Get.offAllNamed(Routes.main);
      }
    } catch (error) {
      Get.snackbar(
        'Verification Failed',
        _friendlyErrorMessage(error),
        snackPosition: SnackPosition.BOTTOM,
      );
    } finally {
      isLoading.value = false;
    }
  }

  Future<void> resend() async {
    try {
      if (flow == 'login') {
        await _repository.login(phoneNumber);
      } else {
        await _repository.requestOtp(phoneNumber);
      }
      _startTimer();
      Get.snackbar(
        'OTP Resent',
        'A new OTP has been sent to $phoneNumber',
        snackPosition: SnackPosition.BOTTOM,
      );
    } catch (error) {
      Get.snackbar(
        'Resend Failed',
        _friendlyErrorMessage(error),
        snackPosition: SnackPosition.BOTTOM,
      );
    }
  }

  @override
  void onClose() {
    _timer?.cancel();
    otpController.dispose();
    super.onClose();
  }
}
