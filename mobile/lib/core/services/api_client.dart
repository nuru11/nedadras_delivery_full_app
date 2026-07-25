import 'package:dio/dio.dart';
import 'package:get/get.dart';

import '../storage/storage_service.dart';

class ApiClient extends GetxService {
  ApiClient({required StorageService storageService})
      : _storageService = storageService {
    _dio = Dio(
      BaseOptions(
        baseUrl: _resolveBaseUrl(),
        connectTimeout: const Duration(seconds: 20),
        receiveTimeout: const Duration(seconds: 20),
        responseType: ResponseType.json,
        headers: {'Content-Type': 'application/json'},
      ),
    );

    _dio.interceptors.add(
      InterceptorsWrapper(
        onRequest: (options, handler) {
          final token = _storageService.readToken();
          if (token != null && token.isNotEmpty) {
            options.headers['Authorization'] = 'Bearer $token';
          }
          return handler.next(options);
        },
        onError: (error, handler) {
          // Add common error logging or handling here if needed.
          return handler.next(error);
        },
      ),
    );
  }

  late final Dio _dio;
  final StorageService _storageService;

  Dio get client => _dio;

  static String _resolveBaseUrl() {
    // const envUrl = String.fromEnvironment('http://192.168.1.10:4000/api', defaultValue: '');
    const envUrl = String.fromEnvironment('https://deliveryappapi.negadrasexpress.net/api', defaultValue: '');
    if (envUrl.isNotEmpty) {
      return envUrl;
    }
    // Must match socket_server_url host (same backend for real-time)
    // return 'https://deliveryappapi.negadrasexpress.net/api';
    return 'http://192.168.1.5:4000/api';
  }
}