/// Google Maps / Places API configuration.
/// Set GOOGLE_MAPS_API_KEY when building, e.g.:
///   flutter run --dart-define=GOOGLE_MAPS_API_KEY=your_key
///   flutter build appbundle --release --dart-define-from-file=dart_defines.json
/// See RELEASE_BUILD.md for Play Store release steps.
class GoogleConfig {
  GoogleConfig._();

  static const String apiKey = String.fromEnvironment(
    'GOOGLE_MAPS_API_KEY',
    defaultValue: '',
  );

  static const String countryCode = 'et';

  // Addis Ababa center (lat, lng)
  static const double addisLat = 9.0320;
  static const double addisLng = 38.7469;

  // Bias radius in meters
  static const int addisBiasRadiusMeters = 50000;

  // Rectangle restriction (south, west, north, east)
  static const double addisSouth = 8.92;
  static const double addisWest = 38.65;
  static const double addisNorth = 9.15;
  static const double addisEast = 38.92;
}
