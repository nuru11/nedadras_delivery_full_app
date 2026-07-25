class AuthUser {
  AuthUser({
    required this.id,
    required this.name,
    required this.phone,
    required this.role,
    required this.status,
    this.kyc = false,
  });

  factory AuthUser.fromJson(Map<String, dynamic> json) {
    return AuthUser(
      id: json['id'] as String? ?? '',
      name: json['name'] as String? ?? '',
      phone: json['phone'] as String? ?? '',
      role: json['role'] as String? ?? 'user',
      status: json['status'] as String? ?? 'pending',
      kyc: json['kyc'] as bool? ?? false,
    );
  }

  final String id;
  final String name;
  final String phone;
  final String role;
  final String status;
  final bool kyc;
}

class SignupResponse {
  SignupResponse({
    required this.message,
    required this.user,
  });

  factory SignupResponse.fromJson(Map<String, dynamic> json) {
    return SignupResponse(
      message: json['message'] as String? ?? '',
      user: AuthUser.fromJson(json['user'] as Map<String, dynamic>? ?? {}),
    );
  }

  final String message;
  final AuthUser user;
}

class RequestOtpResponse {
  RequestOtpResponse({
    required this.message,
    required this.phone,
    required this.expiresInMinutes,
    this.debugOtp,
  });

  factory RequestOtpResponse.fromJson(Map<String, dynamic> json) {
    return RequestOtpResponse(
      message: json['message'] as String? ?? '',
      phone: json['phone'] as String? ?? '',
      expiresInMinutes: (json['expiresInMinutes'] as num?)?.toInt() ?? 0,
      debugOtp: json['debugOtp'] as String?,
    );
  }

  final String message;
  final String phone;
  final int expiresInMinutes;
  final String? debugOtp;
}

class VerifyOtpResponse {
  VerifyOtpResponse({
    required this.token,
    required this.user,
  });

  factory VerifyOtpResponse.fromJson(Map<String, dynamic> json) {
    return VerifyOtpResponse(
      token: json['token'] as String? ?? '',
      user: AuthUser.fromJson(json['user'] as Map<String, dynamic>? ?? {}),
    );
  }

  final String token;
  final AuthUser user;
}
