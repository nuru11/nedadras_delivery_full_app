import 'package:dio/dio.dart';

import '../../../core/services/api_client.dart';
import 'models/auth_models.dart';

class AuthProvider {
  AuthProvider({required ApiClient apiClient}) : _client = apiClient.client;

  final Dio _client;

  Future<SignupResponse> signup({
    required String name,
    required String phone,
    required String role,
  }) async {
    final response = await _client.post(
      '/auth/signup',
      data: {
        'name': name,
        'phone': phone,
        'role': role,
      },
    );

    return SignupResponse.fromJson(response.data as Map<String, dynamic>);
  }

  Future<RequestOtpResponse> requestOtp(String phone) async {
    final response = await _client.post(
      '/auth/request-otp',
      data: {'phone': phone},
    );

    return RequestOtpResponse.fromJson(response.data as Map<String, dynamic>);
  }

  Future<RequestOtpResponse> login(String phone) async {
    final response = await _client.post(
      '/auth/login',
      data: {'phone': phone},
    );

    return RequestOtpResponse.fromJson(response.data as Map<String, dynamic>);
  }

  Future<VerifyOtpResponse> verifyOtp({
    required String phone,
    required String otp,
  }) async {
    final response = await _client.post(
      '/auth/verify-otp',
      data: {
        'phone': phone,
        'otp': otp,
      },
    );

    return VerifyOtpResponse.fromJson(response.data as Map<String, dynamic>);
  }

  Future<VerifyOtpResponse> verifyLogin({
    required String phone,
    required String otp,
  }) async {
    final response = await _client.post(
      '/auth/login/verify',
      data: {
        'phone': phone,
        'otp': otp,
      },
    );

    return VerifyOtpResponse.fromJson(response.data as Map<String, dynamic>);
  }

  /// Fetch the current authenticated user (requires JWT in headers).
  Future<AuthUser> me() async {
    final response = await _client.get<Map<String, dynamic>>('/auth/me');
    final data = response.data ?? <String, dynamic>{};
    return AuthUser.fromJson(data['user'] as Map<String, dynamic>? ?? {});
  }

  /// Soft-delete the current account (requires JWT). Backend sets status to `deleted`.
  Future<void> deleteAccount() async {
    await _client.delete<void>('/auth/me');
  }
}
