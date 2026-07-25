import 'package:dio/dio.dart';

import '../constants/google_config.dart';
import '../models/place_models.dart';

/// Calls Google Places API (Legacy): Autocomplete + Place Details.
/// Restricted to Addis Ababa (Ethiopia) via country + location bias + filter.
class PlacesService {
  PlacesService({String? apiKey}) : _apiKey = apiKey ?? GoogleConfig.apiKey {
    _dio = Dio(
      BaseOptions(
        baseUrl: 'https://maps.googleapis.com/maps/api/place',
        connectTimeout: const Duration(seconds: 10),
        receiveTimeout: const Duration(seconds: 10),
        responseType: ResponseType.json,
      ),
    );
  }

  late final Dio _dio;
  final String _apiKey;

  /// Fetch autocomplete predictions for [input], restricted to Addis Ababa.
  /// [sessionToken] should be a new UUID per user session for billing.
  Future<List<PlacePrediction>> fetchPredictions({
    required String input,
    required String sessionToken,
  }) async {
    if (_apiKey.isEmpty) {
      throw StateError('GOOGLE_MAPS_API_KEY is not set');
    }
    final trimmed = input.trim();
    if (trimmed.isEmpty || trimmed.length < 2) return [];

    // Legacy Places Autocomplete uses location + radius (not locationbias/locationrestriction).
    final query = <String, dynamic>{
      'input': trimmed,
      'key': _apiKey,
      'sessiontoken': sessionToken,
      'components': 'country:${GoogleConfig.countryCode}',
      'language': 'en',
      'location': '${GoogleConfig.addisLat},${GoogleConfig.addisLng}',
      'radius': GoogleConfig.addisBiasRadiusMeters,
    };

    final response = await _dio.get<Map<String, dynamic>>(
      '/autocomplete/json',
      queryParameters: query,
    );

    final data = response.data;
    if (data == null) return [];
    final status = data['status'] as String?;
    if (status != 'OK' && status != 'ZERO_RESULTS') {
      throw PlacesException(
        data['error_message'] as String? ?? 'Places autocomplete failed: $status',
      );
    }

    final list = data['predictions'] as List<dynamic>? ?? [];
    return list
        .map((e) => PlacePrediction.fromJson(e as Map<String, dynamic>))
        .where((p) => p.placeId.isNotEmpty)
        .toList();
  }

  /// Resolve [placeId] to lat/lng and formatted address.
  /// Pass the same [sessionToken] used for the autocomplete session for billing.
  Future<PlaceDetails> getPlaceDetails({
    required String placeId,
    String? sessionToken,
  }) async {
    if (_apiKey.isEmpty) {
      throw StateError('GOOGLE_MAPS_API_KEY is not set');
    }

    final query = <String, dynamic>{
      'place_id': placeId,
      'key': _apiKey,
      'fields': 'formatted_address,geometry,name',
    };
    if (sessionToken != null && sessionToken.isNotEmpty) {
      query['sessiontoken'] = sessionToken;
    }

    final response = await _dio.get<Map<String, dynamic>>(
      '/details/json',
      queryParameters: query,
    );

    final data = response.data;
    if (data == null) {
      throw PlacesException('Place details: no response');
    }
    final status = data['status'] as String?;
    if (status != 'OK') {
      throw PlacesException(
        data['error_message'] as String? ?? 'Place details failed: $status',
      );
    }

    final result = data['result'] as Map<String, dynamic>?;
    if (result == null) {
      throw PlacesException('Place details: missing result');
    }

    final geometry = result['geometry'] as Map<String, dynamic>?;
    final location = geometry?['location'] as Map<String, dynamic>?;
    final lat = (location?['lat'] as num?)?.toDouble();
    final lng = (location?['lng'] as num?)?.toDouble();
    if (lat == null || lng == null) {
      throw PlacesException('Place details: missing geometry');
    }

    final formattedAddress = result['formatted_address'] as String? ?? '';
    final name = result['name'] as String?;

    return PlaceDetails(
      placeId: placeId,
      lat: lat,
      lng: lng,
      formattedAddress: formattedAddress,
      name: name,
    );
  }
}

class PlacesException implements Exception {
  PlacesException(this.message);
  final String message;
  @override
  String toString() => 'PlacesException: $message';
}
