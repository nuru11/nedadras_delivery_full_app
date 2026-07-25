import '../../../core/storage/storage_service.dart';
import 'auth_provider.dart';
import 'models/auth_models.dart';

class AuthRepository {
  AuthRepository({
    required AuthProvider provider,
    required StorageService storageService,
  })  : _provider = provider,
        _storageService = storageService;

  final AuthProvider _provider;
  final StorageService _storageService;

  Future<SignupResponse> signup({
    required String name,
    required String phone,
    required String role,
  }) {
    return _provider.signup(name: name, phone: phone, role: role);
  }

  Future<RequestOtpResponse> requestOtp(String phone) {
    return _provider.requestOtp(phone);
  }

  Future<RequestOtpResponse> login(String phone) {
    return _provider.login(phone);
  }

  Future<VerifyOtpResponse> verifyOtp({
    required String phone,
    required String otp,
  }) async {
    final response = await _provider.verifyOtp(phone: phone, otp: otp);
    await _storageService.writeToken(response.token);
    await _storageService.writePhone(phone);
    await _storageService.writeName(response.user.name);
    await _storageService.writeRole(response.user.role);
    await _storageService.writeStatus(response.user.status);
    await _storageService.writeKyc(response.user.kyc);
    return response;
  }

  Future<VerifyOtpResponse> verifyLogin({
    required String phone,
    required String otp,
  }) async {
    final response = await _provider.verifyLogin(phone: phone, otp: otp);
    await _storageService.writeToken(response.token);
    await _storageService.writePhone(phone);
    await _storageService.writeName(response.user.name);
    await _storageService.writeRole(response.user.role);
    await _storageService.writeStatus(response.user.status);
    await _storageService.writeKyc(response.user.kyc);
    return response;
  }

  Future<void> logout() async {
    await _storageService.clear();
  }

  /// Calls DELETE /auth/me then clears local session.
  Future<void> deleteAccount() async {
    await _provider.deleteAccount();
    await _storageService.clear();
  }

  /// Refresh user info (status, kyc, etc.) from backend using /auth/me.
  /// Returns the updated AuthUser, or null if the request fails (e.g. invalid token).
  Future<AuthUser?> refreshCurrentUser() async {
    try {
      final user = await _provider.me();
      await _storageService.writeName(user.name);
      await _storageService.writePhone(user.phone);
      await _storageService.writeRole(user.role);
      await _storageService.writeStatus(user.status);
      await _storageService.writeKyc(user.kyc);
      return user;
    } catch (_) {
      // Optionally handle token expiry here (e.g. clear storage).
      return null;
    }
  }

  String? get token => _storageService.readToken();
  String? get phone => _storageService.readPhone();
  String? get name => _storageService.readName();
  String? get role => _storageService.readRole();
  bool get kyc => _storageService.readKyc();
  String? get status => _storageService.readStatus();
}
