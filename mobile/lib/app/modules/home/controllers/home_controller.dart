import 'dart:async';

import 'package:dio/dio.dart';
import 'package:flutter/material.dart';
import 'package:geolocator/geolocator.dart';
import 'package:get/get.dart';

import '../../../../core/models/place_models.dart';
import '../../../../core/services/delivery_service.dart';
import '../../../../core/services/socket_service.dart';
import '../../auth/auth_repository.dart';
import '../../../routes/app_routes.dart';
import '../models/delivery_request_item.dart';

/// Car type options for delivery.
const List<String> carTypeOptions = ['bike', 'car', 'van', 'truck'];
const List<String> objectTypeOptions = ['documents', 'food', 'electronics', 'clothing', 'other'];

/// Max concurrent trips a driver can accept (must match backend MAX_CONCURRENT_DRIVER_TRIPS).
const int maxDriverTrips = 3;

class HomeController extends GetxController {
  HomeController({
    required AuthRepository repository,
    required SocketService socketService,
    required DeliveryService deliveryService,
  })  : _repository = repository,
        _socketService = socketService,
        _deliveryService = deliveryService;

  final AuthRepository _repository;
  final SocketService _socketService;
  final DeliveryService _deliveryService;

  String? get phone => _repository.phone;

  /// Display name for home screen; falls back to phone if name is empty.
  String get displayName {
    final name = _repository.name?.trim();
    if (name != null && name.isNotEmpty) return name;
    return _repository.phone ?? 'Unknown';
  }
  String? get token => _repository.token;
  String? get role => _repository.role;

  /// True when current user is a driver (for showing driver home UI).
  bool get isDriver => role?.toLowerCase() == 'driver';

  final Rxn<PlaceDetails> pickup = Rxn<PlaceDetails>();
  final Rxn<PlaceDetails> dropoff = Rxn<PlaceDetails>();
  final Rx<String> receiverName = ''.obs;
  final Rx<String> receiverPhone = ''.obs;
  final Rx<String> objectType = ''.obs;
  /// When object type is "other", user types the value here.
  final Rx<String> objectTypeOther = ''.obs;
  final Rx<String> carType = ''.obs;

  /// Estimate result (distance + plans) after calling Get estimate.
  final Rxn<EstimateResult> estimateResult = Rxn<EstimateResult>();
  /// Selected plan: 'express', 'standard', or 'same_day'. Must be set before submit.
  final Rx<String?> selectedPlan = Rx<String?>(null);
  final RxBool isLoadingEstimate = false.obs;
  final RxBool isSubmitting = false.obs;

  /// Incoming delivery requests (driver inbox).
  final RxList<DeliveryRequestItem> deliveryRequests =
      <DeliveryRequestItem>[].obs;

  /// Socket connected (driver). Observable so UI updates when connection state changes.
  final RxBool socketConnected = false.obs;

  /// User: last delivery-accepted payload (driver accepted this user's delivery).
  final Rxn<Map<String, dynamic>> deliveryAccepted = Rxn<Map<String, dynamic>>();

  /// User: current driver location (from REST + socket), for accepted delivery.
  final Rxn<DriverLocation> driverLocation = Rxn<DriverLocation>();

  /// Active (ongoing) delivery for driver (first of list for card/journey). For user use [activeDeliveries].
  final Rxn<ActiveDelivery> activeDelivery = Rxn<ActiveDelivery>();

  /// All ongoing deliveries: for user their deliveries; for driver all accepted trips (up to 3).
  final RxList<ActiveDelivery> activeDeliveries = <ActiveDelivery>[].obs;

  bool get isSocketConnected => socketConnected.value;

  /// Delivery mode: false = in town (default, existing flow), true = outside town.
  final RxBool isOutsideTown = false.obs;

  /// Outside-town manual fields.
  final RxString outsidePickupText = ''.obs;
  final RxString outsideDropoffText = ''.obs;
  final RxString outsideWeightText = ''.obs;

  /// Text controllers so we can clear fields after submit (UI is driven by these).
  final TextEditingController pickupSearchController = TextEditingController();
  final TextEditingController dropoffSearchController = TextEditingController();
  final TextEditingController receiverNameController = TextEditingController();
  final TextEditingController receiverPhoneController = TextEditingController();
  final TextEditingController outsidePickupController = TextEditingController();
  final TextEditingController outsideDropoffController = TextEditingController();
  final TextEditingController outsideWeightController = TextEditingController();
  final TextEditingController objectTypeOtherController = TextEditingController();
  final TextEditingController descriptionController = TextEditingController();

  double? get outsideWeightKg {
    final trimmed = outsideWeightText.value.trim();
    if (trimmed.isEmpty) return null;
    final value = double.tryParse(trimmed);
    if (value == null || value <= 0) return null;
    return value;
  }

  double? get outsidePrice {
    final w = outsideWeightKg;
    if (w == null || w > 20) return null;
    return w != 1 ? 350 + 110 * w - 110 : 350;
  }

  /// Receiver phone: 10 digits starting with 09, or 13 chars starting with +2519.
  bool get isReceiverPhoneValid {
    final s = receiverPhone.value.trim();
    if (s.isEmpty) return false;
    if (s.length == 10) return RegExp(r'^09\d{8}$').hasMatch(s);
    if (s.length == 13) return RegExp(r'^\+2519\d{8}$').hasMatch(s);
    return false;
  }

  bool get canSubmitInTown {
    if (objectType.value.isEmpty) return false;
    if (objectType.value == 'other' && objectTypeOther.value.trim().isEmpty) return false;
    return pickup.value != null &&
        dropoff.value != null &&
        selectedPlan.value != null &&
        selectedPlanPrice != null &&
        receiverName.value.trim().isNotEmpty &&
        isReceiverPhoneValid;
  }

  bool get canSubmitOutsideTown {
    if (objectType.value.isEmpty) return false;
    if (objectType.value == 'other' && objectTypeOther.value.trim().isEmpty) return false;
    final pickupText = outsidePickupText.value.trim();
    final dropoffText = outsideDropoffText.value.trim();
    final w = outsideWeightKg;
    return pickupText.isNotEmpty &&
        dropoffText.isNotEmpty &&
        w != null &&
        w > 0 &&
        w <= 20 &&
        receiverName.value.trim().isNotEmpty &&
        isReceiverPhoneValid;
  }

  /// Clear all delivery request form fields (in-town and outside-town) after successful submit.
  void clearAllFormFields() {
    pickup.value = null;
    dropoff.value = null;
    selectedPlan.value = null;
    estimateResult.value = null;
    receiverName.value = '';
    receiverPhone.value = '';
    objectType.value = '';
    objectTypeOther.value = '';
    outsidePickupText.value = '';
    outsideDropoffText.value = '';
    outsideWeightText.value = '';
    pickupSearchController.clear();
    dropoffSearchController.clear();
    receiverNameController.clear();
    receiverPhoneController.clear();
    objectTypeOtherController.clear();
    descriptionController.clear();
    outsidePickupController.clear();
    outsideDropoffController.clear();
    outsideWeightController.clear();
  }

  StreamSubscription<Map<String, dynamic>>? _deliveryRequestSub;
  StreamSubscription<String>? _deliveryRequestRemovedSub;
  StreamSubscription<Map<String, dynamic>>? _deliveryAcceptedSub;
  StreamSubscription<Map<String, dynamic>>? _driverLocationSub;
  StreamSubscription<Map<String, dynamic>>? _deliveryStatusSub;
  Timer? _locationTimer;
  Timer? _connectionCheckTimer;
  Timer? _pendingFetchTimer;
  final RxBool _acceptRejectLoading = false.obs;
  bool get isAcceptRejectLoading => _acceptRejectLoading.value;
  final RxString _acceptRejectRequestId = ''.obs;
  String? get loadingRequestId => _acceptRejectRequestId.value.isEmpty ? null : _acceptRejectRequestId.value;

  void setOutsidePickup(String value) {
    outsidePickupText.value = value;
  }

  void setOutsideDropoff(String value) {
    outsideDropoffText.value = value;
  }

  void setOutsideWeight(String value) {
    outsideWeightText.value = value;
  }

  void setPickup(PlaceDetails? details) {
    pickup.value = details;
    estimateResult.value = null;
    selectedPlan.value = null;
  }

  void setDropoff(PlaceDetails? details) {
    dropoff.value = details;
    estimateResult.value = null;
    selectedPlan.value = null;
  }

  /// Swap pickup and dropoff (in-town only); clears estimate and selected plan.
  void swapPickupDropoff() {
    final p = pickup.value;
    final d = dropoff.value;
    pickup.value = d;
    dropoff.value = p;
    final pickupText = pickupSearchController.text;
    final dropoffText = dropoffSearchController.text;
    pickupSearchController.text = dropoffText;
    dropoffSearchController.text = pickupText;
    estimateResult.value = null;
    selectedPlan.value = null;
  }

  void setSelectedPlan(String? plan) => selectedPlan.value = plan;

  double? get selectedPlanPrice {
    final plan = selectedPlan.value;
    final est = estimateResult.value;
    if (plan == null || est == null) return null;
    return est.plans[plan]?.price;
  }

  void setReceiverName(String value) => receiverName.value = value;
  void setReceiverPhone(String value) => receiverPhone.value = value;
  void setObjectType(String value) => objectType.value = value;
  void setObjectTypeOther(String value) => objectTypeOther.value = value;
  void setCarType(String? value) => carType.value = value ?? '';

  /// Receiver fields should start empty; user must fill them explicitly.
  void initReceiverDefaults() {
    // Intentionally left blank to avoid pre-filling receiver name/phone.
    // This ensures the user is forced to enter these fields on every request.
  }

  /// Call POST /deliveries/estimate and store result.
  Future<void> fetchEstimate() async {
    final p = pickup.value;
    final d = dropoff.value;
    if (p == null || d == null) {
      Get.snackbar('Missing locations', 'Select pickup and dropoff first.');
      return;
    }
    isLoadingEstimate.value = true;
    estimateResult.value = null;
    selectedPlan.value = null;
    try {
      final result = await _deliveryService.estimate(
        pickupLat: p.lat,
        pickupLng: p.lng,
        dropoffLat: d.lat,
        dropoffLng: d.lng,
      );
      estimateResult.value = result;
    } on DioException catch (e) {
      final msg = e.response?.data is Map ? (e.response!.data as Map)['message'] : null;
      Get.snackbar('Estimate failed', msg?.toString() ?? e.message ?? 'Request failed');
    } on Exception catch (e) {
      Get.snackbar('Estimate failed', e.toString().replaceFirst('Exception: ', ''));
    } finally {
      isLoadingEstimate.value = false;
    }
  }

  /// Call POST /deliveries to create delivery and notify drivers.
  Future<void> submitRequest() async {
    // In-town flow only.
    final p = pickup.value;
    final d = dropoff.value;
    if (p == null || d == null) {
      Get.snackbar('Missing locations', 'Select pickup and dropoff first.');
      return;
    }
    final plan = selectedPlan.value;
    final price = selectedPlanPrice;
    if (plan == null || price == null) {
      Get.snackbar('Select a plan', 'Please select a delivery plan to proceed.');
      return;
    }
    if (receiverName.value.trim().isEmpty ||
        receiverPhone.value.trim().isEmpty ||
        objectType.value.isEmpty) {
      Get.snackbar(
        'Fill required fields',
        'Please enter receiver name, receiver phone, and select object type.',
      );
      return;
    }
    if (!isReceiverPhoneValid) {
      Get.snackbar(
        'Invalid receiver phone',
        'Use 09XXXXXXXX (10 digits) or +2519XXXXXXXX (13 digits).',
      );
      return;
    }
    if (objectType.value == 'other' && objectTypeOther.value.trim().isEmpty) {
      Get.snackbar('Fill required fields', 'Please specify the object type when you select "Other".');
      return;
    }
    final objectTypeValue = objectType.value == 'other' ? objectTypeOther.value.trim() : objectType.value;
    isSubmitting.value = true;
    try {
      await _deliveryService.create(
        pickupLat: p.lat,
        pickupLng: p.lng,
        pickupAddress: p.formattedAddress,
        pickupName: p.name,
        dropoffLat: d.lat,
        dropoffLng: d.lng,
        dropoffAddress: d.formattedAddress,
        dropoffName: d.name,
        deliveryPlan: plan,
        price: price,
        receiverName: receiverName.value.trim().isEmpty ? null : receiverName.value.trim(),
        receiverPhone: receiverPhone.value.trim().isEmpty ? null : receiverPhone.value.trim(),
        objectType: objectTypeValue.isEmpty ? null : objectTypeValue,
        description: descriptionController.text.trim().isEmpty ? null : descriptionController.text.trim(),
      );
      clearAllFormFields();
      if (isDriver) {
        await fetchActiveDelivery();
      } else {
        await fetchActiveDeliveries();
        // After user submits a request, navigate to ongoing journeys list.
        navigateToJourney();
      }
      Get.snackbar('Request sent', 'Nearby drivers have been notified.');
    } on DioException catch (e) {
      String msg = 'Request failed';
      if (e.response?.data != null) {
        final d = e.response!.data;
        if (d is Map) {
          msg = (d['message'] ?? d['error'] ?? msg).toString();
        } else {
          msg = d.toString();
        }
      } else if (e.message != null && e.message!.isNotEmpty) {
        msg = e.message!;
      }
      Get.snackbar('Submit failed', msg);
    } on Exception catch (e) {
      Get.snackbar('Submit failed', e.toString().replaceFirst('Exception: ', ''));
    } finally {
      isSubmitting.value = false;
    }
  }

  /// Call POST /deliveries/outside-town for outside-town requests (manual address + weight-based pricing).
  Future<void> submitOutsideTownRequest() async {
    final pickupText = outsidePickupText.value.trim();
    final dropoffText = outsideDropoffText.value.trim();
    final w = outsideWeightKg;

    if (pickupText.isEmpty || dropoffText.isEmpty) {
      Get.snackbar('Missing locations', 'Enter pickup and dropoff addresses.');
      return;
    }
    if (w == null || w <= 0 || w > 20) {
      Get.snackbar('Invalid weight', 'Weight must be between 0 and 20 kg.');
      return;
    }

    final price = outsidePrice;
    if (price == null) {
      Get.snackbar('Invalid price', 'Unable to compute price for the given weight.');
      return;
    }
    if (receiverName.value.trim().isEmpty ||
        receiverPhone.value.trim().isEmpty ||
        objectType.value.isEmpty) {
      Get.snackbar(
        'Fill required fields',
        'Please enter receiver name, receiver phone, and select object type.',
      );
      return;
    }
    if (!isReceiverPhoneValid) {
      Get.snackbar(
        'Invalid receiver phone',
        'Use 09XXXXXXXX (10 digits) or +2519XXXXXXXX (13 digits).',
      );
      return;
    }
    if (objectType.value == 'other' && objectTypeOther.value.trim().isEmpty) {
      Get.snackbar('Fill required fields', 'Please specify the object type when you select "Other".');
      return;
    }
    final objectTypeValue = objectType.value == 'other' ? objectTypeOther.value.trim() : objectType.value;
    isSubmitting.value = true;
    try {
      await _deliveryService.createOutsideTown(
        pickupAddress: pickupText,
        dropoffAddress: dropoffText,
        weightKg: w,
        price: price,
        receiverName:
            receiverName.value.trim().isEmpty ? null : receiverName.value.trim(),
        receiverPhone:
            receiverPhone.value.trim().isEmpty ? null : receiverPhone.value.trim(),
        objectType: objectTypeValue.isEmpty ? null : objectTypeValue,
        description: descriptionController.text.trim().isEmpty ? null : descriptionController.text.trim(),
      );

      clearAllFormFields();

      if (isDriver) {
        await fetchActiveDelivery();
      } else {
        await fetchActiveDeliveries();
        // After user submits an outside-town request, navigate to ongoing journeys list.
        navigateToJourney();
      }
      Get.snackbar('Request sent', 'Outside town delivery request has been created.');
    } on DioException catch (e) {
      String msg = 'Request failed';
      if (e.response?.data != null) {
        final d = e.response!.data;
        if (d is Map) {
          msg = (d['message'] ?? d['error'] ?? msg).toString();
        } else {
          msg = d.toString();
        }
      } else if (e.message != null && e.message!.isNotEmpty) {
        msg = e.message!;
      }
      Get.snackbar('Submit failed', msg);
    } on Exception catch (e) {
      Get.snackbar('Submit failed', e.toString().replaceFirst('Exception: ', ''));
    } finally {
      isSubmitting.value = false;
    }
  }

  /// Fetch active delivery and update [activeDelivery]. For driver: fetches list and sets first.
  Future<void> fetchActiveDelivery() async {
    if (isDriver) {
      await fetchActiveDeliveries();
      activeDelivery.value = activeDeliveries.isNotEmpty ? activeDeliveries.first : null;
      return;
    }
    try {
      final delivery = await _deliveryService.getActiveDelivery();
      activeDelivery.value = delivery;
    } catch (_) {
      activeDelivery.value = null;
    }
  }

  /// Fetch all active deliveries. For user: their list. For driver: all ongoing trips (up to 3).
  Future<void> fetchActiveDeliveries() async {
    try {
      final list = await _deliveryService.getActiveDeliveries();
      activeDeliveries.assignAll(list);
      activeDeliveries.refresh();
      if (isDriver) {
        activeDelivery.value = list.isNotEmpty ? list.first : null;
      }
    } catch (_) {
      activeDeliveries.clear();
      activeDeliveries.refresh();
      if (isDriver) activeDelivery.value = null;
    }
  }

  /// Driver: fetch pending delivery requests (e.g. after login or missed socket).
  Future<void> fetchPendingRequests() async {
    if (!isDriver) return;
    try {
      final payloads = await _deliveryService.getPendingDeliveryRequests();
      final items = payloads
          .map((p) => DeliveryRequestItem.fromSocketPayload(p))
          .where((r) => r.deliveryRequestId.isNotEmpty)
          .toList();
      deliveryRequests.assignAll(items);
      deliveryRequests.refresh(); // Force Obx to rebuild
    } catch (_) {
      deliveryRequests.clear();
      deliveryRequests.refresh();
    }
  }

  /// Delivery to show on journey screen (driver): from activeDelivery.
  ActiveDelivery? get deliveryForJourney => activeDelivery.value;

  /// Navigate to journey: user can pass [delivery] for detail or null for list; driver uses activeDeliveries.
  void navigateToJourney([ActiveDelivery? delivery]) {
    if (isDriver) {
      final preload = activeDelivery.value?.toJson();
      Get.toNamed(Routes.journey, arguments: preload)?.then((_) => fetchActiveDeliveries());
      return;
    }
    if (delivery != null) {
      Get.toNamed(Routes.journey, arguments: delivery.toJson())?.then((_) => fetchActiveDeliveries());
    } else {
      Get.toNamed(Routes.journey, arguments: <String, dynamic>{'listOnly': true})?.then((_) => fetchActiveDeliveries());
    }
  }

  /// User: navigate to journey with the delivery from deliveryAccepted (driver just accepted).
  void navigateToJourneyWithAccepted() {
    if (isDriver) return;
    final accepted = deliveryAccepted.value;
    if (accepted == null) {
      navigateToJourney();
      return;
    }
    final deliveryJson = accepted['delivery'] as Map<String, dynamic>?;
    if (deliveryJson == null) {
      navigateToJourney();
      return;
    }
    try {
      navigateToJourney(ActiveDelivery.fromJson(deliveryJson));
    } catch (_) {
      navigateToJourney();
    }
  }

  @override
  void onInit() {
    super.onInit();
    if (!isDriver) initReceiverDefaults();
    if (isDriver) {
      fetchActiveDelivery();
    } else {
      fetchActiveDeliveries();
    }
    _deliveryStatusSub = _socketService.deliveryStatusUpdatedStream.listen((data) {
      final status = data['status'] as String?;
      final deliveryId = data['deliveryId'] as String?;
      if (status == 'cancelled' && isDriver && deliveryId != null) {
        activeDeliveries.removeWhere((d) => d.id == deliveryId);
        activeDeliveries.refresh();
        if (activeDelivery.value?.id == deliveryId) {
          activeDelivery.value = activeDeliveries.isNotEmpty ? activeDeliveries.first : null;
        }
        Get.snackbar('Trip cancelled', 'The user has cancelled this trip.');
      }
      if (isDriver) {
        fetchActiveDeliveries();
      } else {
        fetchActiveDeliveries();
      }
    });
    if (isDriver) {
      fetchPendingRequests();
      _connectDriverSocket();
    } else {
      _connectUserSocket();
    }
  }

  @override
  void onClose() {
    _deliveryStatusSub?.cancel();
    pickupSearchController.dispose();
    dropoffSearchController.dispose();
    receiverNameController.dispose();
    receiverPhoneController.dispose();
    objectTypeOtherController.dispose();
    descriptionController.dispose();
    outsidePickupController.dispose();
    outsideDropoffController.dispose();
    outsideWeightController.dispose();
    if (isDriver) {
      _deliveryRequestSub?.cancel();
      _deliveryRequestRemovedSub?.cancel();
      _locationTimer?.cancel();
      _connectionCheckTimer?.cancel();
      _pendingFetchTimer?.cancel();
    } else {
      _deliveryAcceptedSub?.cancel();
      _driverLocationSub?.cancel();
    }
    _socketService.disconnect();
    super.onClose();
  }

  void _connectUserSocket() {
    _socketService.connect();
    _deliveryAcceptedSub = _socketService.deliveryAcceptedStream.listen((data) {
      deliveryAccepted.value = data;
      driverLocation.value = null;
      _fetchInitialDriverLocation();
      fetchActiveDeliveries();
    });
    _driverLocationSub = _socketService.driverLocationStream.listen((data) {
      final currentId = deliveryAccepted.value?['deliveryId'] as String?;
      final eventId = data['deliveryId'] as String?;
      if (currentId != null && eventId == currentId) {
        final lat = (data['lat'] as num?)?.toDouble();
        final lng = (data['lng'] as num?)?.toDouble();
        if (lat != null && lng != null) {
          driverLocation.value = DriverLocation(lat: lat, lng: lng);
        }
      }
    });
  }

  Future<void> _fetchInitialDriverLocation() async {
    final id = deliveryAccepted.value?['deliveryId'] as String?;
    if (id == null) return;
    try {
      final loc = await _deliveryService.getDriverLocation(id);
      if (loc != null) driverLocation.value = loc;
    } catch (_) {}
  }

  void _connectDriverSocket() {
    _socketService.connect();
    _deliveryRequestSub = _socketService.deliveryRequestStream.listen((payload) {
      final item = DeliveryRequestItem.fromSocketPayload(payload);
      if (item.deliveryRequestId.isEmpty) return;
      deliveryRequests.removeWhere((r) => r.deliveryRequestId == item.deliveryRequestId);
      deliveryRequests.insert(0, item);
      deliveryRequests.refresh();
    });
    _deliveryRequestRemovedSub = _socketService.deliveryRequestRemovedStream.listen((deliveryId) {
      deliveryRequests.removeWhere((r) => r.deliveryId == deliveryId);
      deliveryRequests.refresh();
    });
    _connectionCheckTimer = Timer.periodic(const Duration(seconds: 1), (_) {
      final connected = _socketService.isConnected;
      if (socketConnected.value != connected) socketConnected.value = connected;
    });
    _startLocationUpdates();
    _startPendingFetchPoll();
  }

  /// Poll pending requests every 15s as fallback when socket does not deliver in real time.
  void _startPendingFetchPoll() {
    _pendingFetchTimer?.cancel();
    _pendingFetchTimer = Timer.periodic(const Duration(seconds: 15), (_) {
      if (isDriver && activeDeliveries.length >= maxDriverTrips) return;
      fetchPendingRequests();
    });
  }

  void _startLocationUpdates() {
    _locationTimer?.cancel();
    _locationTimer = Timer.periodic(const Duration(seconds: 5), (_) async {
      if (!_socketService.isConnected) return;
      try {
        final serviceEnabled = await Geolocator.isLocationServiceEnabled();
        if (!serviceEnabled) return;
        final permission = await Geolocator.checkPermission();
        if (permission == LocationPermission.denied) {
          final requested = await Geolocator.requestPermission();
          if (requested == LocationPermission.denied ||
              requested == LocationPermission.deniedForever) return;
        }
        final position = await Geolocator.getCurrentPosition(
          locationSettings: const LocationSettings(
            accuracy: LocationAccuracy.medium,
          ),
        );
        _socketService.emitLocation(position.latitude, position.longitude);
      } catch (_) {}
    });
  }

  /// Driver: accept a delivery request (allowed until activeDeliveries.length < maxDriverTrips).
  Future<void> acceptRequest(String deliveryRequestId) async {
    _acceptRejectRequestId.value = deliveryRequestId;
    _acceptRejectLoading.value = true;
    try {
      final data = await _deliveryService.acceptDeliveryRequest(deliveryRequestId);
      deliveryRequests.removeWhere((r) => r.deliveryRequestId == deliveryRequestId);
      final deliveryJson = data['delivery'] as Map<String, dynamic>?;
      if (deliveryJson != null) {
        final accepted = ActiveDelivery.fromJson(deliveryJson);
        activeDeliveries.insert(0, accepted);
        activeDeliveries.refresh();
        activeDelivery.value = accepted;
      } else {
        await fetchActiveDeliveries();
      }
      Get.snackbar('Accepted', 'You accepted this delivery.');
      navigateToJourney();
    } on DioException catch (e) {
      final status = e.response?.statusCode;
      final d = e.response?.data;
      final msg = d is Map ? (d['message'] ?? d['error'])?.toString() : e.message;
      Get.snackbar('Accept failed', msg ?? 'Request failed');
      if (status == 409) await fetchActiveDeliveries();
    } on Exception catch (e) {
      Get.snackbar('Accept failed', e.toString().replaceFirst('Exception: ', ''));
    } finally {
      _acceptRejectLoading.value = false;
      if (_acceptRejectRequestId.value == deliveryRequestId) {
        _acceptRejectRequestId.value = '';
      }
    }
  }

  /// Driver: reject a delivery request.
  Future<void> rejectRequest(String deliveryRequestId) async {
    _acceptRejectRequestId.value = deliveryRequestId;
    _acceptRejectLoading.value = true;
    try {
      await _deliveryService.rejectDeliveryRequest(deliveryRequestId);
      deliveryRequests.removeWhere((r) => r.deliveryRequestId == deliveryRequestId);
      Get.snackbar('Rejected', 'You rejected this delivery.');
    } on DioException catch (e) {
      final d = e.response?.data;
      final msg = d is Map ? (d['message'] ?? d['error'])?.toString() : e.message;
      Get.snackbar('Reject failed', msg ?? 'Request failed');
    } on Exception catch (e) {
      Get.snackbar('Reject failed', e.toString().replaceFirst('Exception: ', ''));
    } finally {
      _acceptRejectLoading.value = false;
      if (_acceptRejectRequestId.value == deliveryRequestId) {
        _acceptRejectRequestId.value = '';
      }
    }
  }

  Future<void> logout() async {
    if (isDriver) {
      _deliveryRequestSub?.cancel();
      _deliveryRequestRemovedSub?.cancel();
      _locationTimer?.cancel();
      _connectionCheckTimer?.cancel();
      _pendingFetchTimer?.cancel();
    } else {
      _deliveryAcceptedSub?.cancel();
      _driverLocationSub?.cancel();
    }
    _socketService.disconnect();
    await _repository.logout();
    Get.offAllNamed(Routes.signup);
  }
}
