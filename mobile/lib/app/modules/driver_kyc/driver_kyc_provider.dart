import 'package:dio/dio.dart';

import '../../../core/services/api_client.dart';

class DriverKycProvider {
  DriverKycProvider({required ApiClient apiClient}) : _client = apiClient.client;

  final Dio _client;

  /// POST /drivers/kyc with multipart: plate_number, vehicle_type,
  /// driver_license, fyda_image_front, fyda_image_back, additional_document
  Future<Map<String, dynamic>> submitKyc({
    required String plateNumber,
    required String vehicleType,
    required String driverLicensePath,
    required String fydaFrontPath,
    required String fydaBackPath,
    required String additionalDocumentPath,
  }) async {
    final formData = FormData.fromMap({
      'plate_number': plateNumber,
      'vehicle_type': vehicleType,
      'driver_license': await MultipartFile.fromFile(driverLicensePath),
      'fyda_image_front': await MultipartFile.fromFile(fydaFrontPath),
      'fyda_image_back': await MultipartFile.fromFile(fydaBackPath),
      'additional_document': await MultipartFile.fromFile(additionalDocumentPath),
    });

    final response = await _client.post<Map<String, dynamic>>(
      '/drivers/kyc',
      data: formData,
      options: Options(
        contentType: 'multipart/form-data',
      ),
    );

    return response.data ?? <String, dynamic>{};
  }
}
