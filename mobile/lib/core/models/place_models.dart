/// A single autocomplete prediction (suggestion).
class PlacePrediction {
  const PlacePrediction({
    required this.placeId,
    required this.description,
    this.mainText,
    this.secondaryText,
  });

  factory PlacePrediction.fromJson(Map<String, dynamic> json) {
    final structured = json['structured_formatting'] as Map<String, dynamic>?;
    return PlacePrediction(
      placeId: json['place_id'] as String? ?? '',
      description: json['description'] as String? ?? '',
      mainText: structured?['main_text'] as String?,
      secondaryText: structured?['secondary_text'] as String?,
    );
  }

  final String placeId;
  final String description;
  final String? mainText;
  final String? secondaryText;
}

/// Resolved place details (after selecting a prediction).
class PlaceDetails {
  const PlaceDetails({
    required this.placeId,
    required this.lat,
    required this.lng,
    required this.formattedAddress,
    this.name,
  });

  final String placeId;
  final double lat;
  final double lng;
  final String formattedAddress;
  final String? name;
}
