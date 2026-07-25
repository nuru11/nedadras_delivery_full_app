import 'dart:math';

import 'package:dio/dio.dart';
import 'package:flutter/material.dart';
import 'package:flutter_typeahead/flutter_typeahead.dart';

import '../constants/google_config.dart';
import '../models/place_models.dart';
import '../services/places_service.dart';

/// Reusable Places autocomplete field restricted to Addis Ababa (Ethiopia).
/// Resolves selected place to [PlaceDetails] (lat/lng, formatted address).
/// Requires GOOGLE_MAPS_API_KEY (--dart-define or --dart-define-from-file). See RELEASE_BUILD.md.
class PlacesAutocompleteField extends StatefulWidget {
  const PlacesAutocompleteField({
    super.key,
    required this.placesService,
    required this.onPlaceSelected,
    this.hintText = 'Search address in Addis Ababa...',
    this.decoration,
    this.controller,
    this.enabled = true,
  });

  final PlacesService placesService;
  final void Function(PlaceDetails details) onPlaceSelected;
  final String hintText;
  final InputDecoration? decoration;
  final TextEditingController? controller;
  final bool enabled;

  @override
  State<PlacesAutocompleteField> createState() => _PlacesAutocompleteFieldState();
}

class _PlacesAutocompleteFieldState extends State<PlacesAutocompleteField> {
  late TextEditingController _controller;
  String _sessionToken = '';
  final Random _random = Random();

  String _nextSessionToken() {
    return '${DateTime.now().millisecondsSinceEpoch}_${_random.nextInt(0x7FFFFFFF)}';
  }

  @override
  void initState() {
    super.initState();
    _controller = widget.controller ?? TextEditingController();
  }

  @override
  void didUpdateWidget(covariant PlacesAutocompleteField oldWidget) {
    super.didUpdateWidget(oldWidget);
    if (widget.controller != null && widget.controller != _controller) {
      _controller = widget.controller!;
    }
  }

  @override
  void dispose() {
    if (widget.controller == null) {
      _controller.dispose();
    }
    super.dispose();
  }

  Future<List<PlacePrediction>> _fetchSuggestions(String pattern) async {
    final trimmed = pattern.trim();
    if (trimmed.length < 2) return [];
    if (_sessionToken.isEmpty) _sessionToken = _nextSessionToken();
    try {
      return await widget.placesService.fetchPredictions(
        input: trimmed,
        sessionToken: _sessionToken,
      );
    } catch (e) {
      if (mounted) {
        String msg = e is PlacesException
            ? e.message
            : (e is DioException && e.response?.data is Map
                ? (e.response!.data as Map)['error_message']?.toString() ?? e.message ?? e.toString()
                : e.toString());
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text(msg), duration: const Duration(seconds: 5)),
        );
      }
      return [];
    }
  }

  void _onSelected(PlacePrediction prediction) async {
    try {
      final details = await widget.placesService.getPlaceDetails(
        placeId: prediction.placeId,
        sessionToken: _sessionToken.isNotEmpty ? _sessionToken : null,
      );
      _sessionToken = '';
      if (mounted) {
        _controller.text = (details.name != null && details.name!.trim().isNotEmpty)
            ? details.name!
            : details.formattedAddress;
        widget.onPlaceSelected(details);
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Could not get place details: $e')),
        );
      }
    }
  }

  String get _effectiveHintText {
    if (GoogleConfig.apiKey.isEmpty) {
      return 'Set GOOGLE_MAPS_API_KEY (see RELEASE_BUILD.md for release builds)';
    }
    return widget.hintText;
  }

  @override
  Widget build(BuildContext context) {
    return TypeAheadField<PlacePrediction>(
      controller: _controller,
      constraints: const BoxConstraints(maxHeight: 280),
      builder: (context, controller, focusNode) {
        return TextField(
          controller: controller,
          focusNode: focusNode,
          enabled: widget.enabled,
          decoration: widget.decoration?.copyWith(hintText: _effectiveHintText) ??
              InputDecoration(
                hintText: _effectiveHintText,
                border: const OutlineInputBorder(),
                prefixIcon: const Icon(Icons.location_on_outlined),
                errorText: GoogleConfig.apiKey.isEmpty ? 'API key not set' : null,
              ),
        );
      },
      suggestionsCallback: _fetchSuggestions,
      itemBuilder: (context, suggestion) {
        return ListTile(
          leading: const Icon(Icons.place_outlined, color: Colors.grey),
          title: Text(
            suggestion.mainText ?? suggestion.description,
            maxLines: 1,
            overflow: TextOverflow.ellipsis,
          ),
          subtitle: (suggestion.secondaryText ?? '').isEmpty
              ? null
              : Text(
                  suggestion.secondaryText!,
                  maxLines: 1,
                  overflow: TextOverflow.ellipsis,
                ),
        );
      },
      onSelected: _onSelected,
      debounceDuration: const Duration(milliseconds: 300),
      emptyBuilder: (context) => const Padding(
        padding: EdgeInsets.symmetric(vertical: 16),
        child: Center(child: Text('No places found in Addis Ababa')),
      ),
      loadingBuilder: (context) => const Padding(
        padding: EdgeInsets.symmetric(vertical: 16),
        child: Center(child: CircularProgressIndicator()),
      ),
      errorBuilder: (context, error) => const Padding(
        padding: EdgeInsets.symmetric(vertical: 16),
        child: Center(child: Text('Search unavailable')),
      ),
    );
  }
}
