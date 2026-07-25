import 'dart:async';

import 'package:delivery_app/app/routes/app_routes.dart';
import 'package:dio/dio.dart';
import 'package:get/get.dart';
import 'package:url_launcher/url_launcher.dart';

import '../../../../core/services/delivery_service.dart';
import '../../../../core/services/socket_service.dart';
import '../../auth/auth_repository.dart';
import '../../main/controllers/main_controller.dart';

/// Ongoing journey screen for user and driver.
/// Driver: mark as "picked" to start journey and "delivered" to finish.
/// User: see driver location and journey status.
class JourneyController extends GetxController {
  JourneyController({
    required AuthRepository repository,
    required DeliveryService deliveryService,
    required SocketService socketService,
  })  : _repository = repository,
        _deliveryService = deliveryService,
        _socketService = socketService;

  final AuthRepository _repository;
  final DeliveryService _deliveryService;
  final SocketService _socketService;

  String? get role => _repository.role;
  bool get isDriver => role?.toLowerCase() == 'driver';

  final Rxn<ActiveDelivery> activeDelivery = Rxn<ActiveDelivery>();
  final RxList<ActiveDelivery> activeDeliveries = <ActiveDelivery>[].obs;
  final RxBool isLoading = true.obs;
  final Rxn<DriverLocation> driverLocation = Rxn<DriverLocation>();

  /// True when user opened journey in "list all ongoing" mode (no specific delivery).
  bool isListMode = false;

  StreamSubscription<Map<String, dynamic>>? _statusSub;
  StreamSubscription<Map<String, dynamic>>? _driverLocationSub;
  StreamSubscription<Map<String, dynamic>>? _acceptedSub;

  @override
  void onInit() {
    super.onInit();
    _setupTabRefresh();
    final args = Get.arguments;
    if (args is Map<String, dynamic>) {
      final map = Map<String, dynamic>.from(args);
      if (map['id'] != null) {
        activeDelivery.value = ActiveDelivery.fromJson(map);
        if (isDriver) {
          isListMode = true; // So driver can tap back to see trip list
          _loadActiveList().then((_) {
            final id = map['id'] as String?;
            if (id != null) {
              final found = activeDeliveries.where((d) => d.id == id).toList();
              if (found.isNotEmpty) activeDelivery.value = found.first;
            }
          });
        } else {
          isListMode = false;
          _loadActive(preserveOnNull: true);
        }
      } else if (!isDriver && map['listOnly'] == true) {
        isListMode = true;
        _loadActiveList();
      } else {
        _loadActive();
      }
    } else {
      // Opened from tab: both user and driver see list of trips first (tap to open detail)
      isListMode = true;
      _loadActiveList();
    }
    _statusSub = _socketService.deliveryStatusUpdatedStream.listen(_onStatusUpdated);
    if (!isDriver) {
      _driverLocationSub = _socketService.driverLocationStream.listen((data) {
        final curId = activeDelivery.value?.id;
        final eventId = data['deliveryId'] as String?;
        if (curId != null && eventId == curId) {
          final lat = (data['lat'] as num?)?.toDouble();
          final lng = (data['lng'] as num?)?.toDouble();
          if (lat != null && lng != null) {
            driverLocation.value = DriverLocation(lat: lat, lng: lng);
          }
        }
      });
      _acceptedSub = _socketService.deliveryAcceptedStream.listen(_onDeliveryAccepted);
    }
  }

  void _onDeliveryAccepted(Map<String, dynamic> data) {
    final deliveryId = data['deliveryId'] as String?;
    final deliveryJson = data['delivery'] as Map<String, dynamic>?;
    final cur = activeDelivery.value;
    if (cur != null && deliveryId == cur.id && deliveryJson != null) {
      activeDelivery.value = ActiveDelivery.fromJson(deliveryJson);
    } else if (isListMode) {
      _loadActiveList();
    }
  }

  @override
  void onClose() {
    _statusSub?.cancel();
    _driverLocationSub?.cancel();
    _acceptedSub?.cancel();
    super.onClose();
  }

  // void _onStatusUpdated(Map<String, dynamic> data) {
  //   final deliveryId = data['deliveryId'] as String?;
  //   final status = data['status'] as String?;
  //   final deliveryJson = data['delivery'] as Map<String, dynamic>?;
  //   final cur = activeDelivery.value;
  //   if (cur == null || deliveryId != cur.id) return;
  //   if (status == 'delivered') {
  //     Get.back();
  //     Get.snackbar('Journey completed', 'Delivery has been completed.');
  //     return;
  //   }
  //   if (deliveryJson != null) {
  //     activeDelivery.value = ActiveDelivery.fromJson(deliveryJson);
  //   }
  // }

  Future<void> _onStatusUpdated(Map<String, dynamic> data) async {
    final deliveryId = data['deliveryId'] as String?;
    final status = data['status'] as String?;
    final deliveryJson = data['delivery'] as Map<String, dynamic>?;
    final cur = activeDelivery.value;
    final isCurrentDelivery = cur != null && deliveryId == cur.id;
    if (isListMode && !isCurrentDelivery) {
      await _loadActiveList();
      return;
    }
    if (!isCurrentDelivery) return;
    if (status == 'delivered') {
      if (isDriver) {
        // Driver: stay on journey so they can mark cash received; refresh list (delivered drops off).
        await _loadActiveList();
        if (deliveryJson != null) {
          activeDelivery.value = ActiveDelivery.fromJson(deliveryJson);
        } else {
          activeDelivery.value = cur.copyWith(status: 'delivered', payment: 'unpaid');
        }
        Get.snackbar('Delivery completed', 'Record cash received from customer, then tap "Mark as paid".');
        return;
      }
      if (isListMode) {
        await _loadActiveList();
        activeDelivery.value = null;
      } else {
        await _loadActive();
      }
      Get.offNamed(Routes.deliveries);
      Get.snackbar('Journey completed', 'Delivery has been completed.');
      return;
    }
    if (status == 'cancelled') {
      if (isListMode) {
        await _loadActiveList();
        activeDelivery.value = null;
      } else {
        await _loadActive();
      }
      Get.offNamed(Routes.deliveries);
      Get.snackbar('Trip cancelled', 'The driver has cancelled this trip.');
      return;
    }
    if (deliveryJson != null) {
      activeDelivery.value = ActiveDelivery.fromJson(deliveryJson);
    }
  }

  /// [preserveOnNull] When true, keep existing activeDelivery if API returns null (e.g. after accept, API may lag).
  /// When false, clear activeDelivery when API returns null (e.g. after mark delivered).
  Future<void> _loadActive({bool preserveOnNull = false}) async {
    isLoading.value = true;
    try {
      final delivery = await _deliveryService.getActiveDelivery();
      if (delivery != null) {
        activeDelivery.value = delivery;
      } else if (!preserveOnNull) {
        activeDelivery.value = null;
      }
      if (delivery != null && !isDriver) {
        final loc = await _deliveryService.getDriverLocation(delivery.id);
        driverLocation.value = loc;
      }
    } catch (_) {
      if (!preserveOnNull) {
        // On user actions, still clear on error so we don't show stale data
      }
      // On initial load (preserveOnNull), keep existing from arguments if API failed
    } finally {
      isLoading.value = false;
    }
  }

  /// User list mode: load all ongoing deliveries.
  Future<void> _loadActiveList() async {
    isLoading.value = true;
    try {
      final list = await _deliveryService.getActiveDeliveries();
      activeDeliveries.assignAll(list);
      activeDeliveries.refresh();
    } catch (_) {
      activeDeliveries.clear();
      activeDeliveries.refresh();
    } finally {
      isLoading.value = false;
    }
  }

  /// User or driver: select a delivery from the list to show detail.
  void selectDelivery(ActiveDelivery delivery) {
    activeDelivery.value = delivery;
    driverLocation.value = null;
    if (!isDriver) {
      _deliveryService.getDriverLocation(delivery.id).then((loc) {
        driverLocation.value = loc;
      });
    }
  }

  /// User or driver list mode: go back to list from detail.
  void backToList() {
    activeDelivery.value = null;
    driverLocation.value = null;
  }

  /// Apply route args when navigated with preloaded delivery (e.g. after driver accept).
  /// Used when controller is reused (e.g. from tab) and Get.arguments in onInit was stale.
  void applyRouteArgs(Map<String, dynamic> args) {
    if (args['id'] == null) return;
    activeDelivery.value = ActiveDelivery.fromJson(Map<String, dynamic>.from(args));
    isListMode = false;
    _loadActive(preserveOnNull: true);
  }

  /// Switch to list mode (e.g. "See all" button). Clears detail and loads list.
  void applyListOnlyArgs() {
    if (!isDriver) {
      activeDelivery.value = null;
      driverLocation.value = null;
      isListMode = true;
      _loadActiveList();
    }
  }

  /// When driver switches to journey tab (index 1), always show trip list first.
  void _setupTabRefresh() {
    if (!Get.isRegistered<MainController>()) return;
    final mainController = Get.find<MainController>();
    ever(mainController.currentIndex, (_) {
      if (mainController.currentIndex.value == 1) {
        if (isDriver) {
          isListMode = true;
          activeDelivery.value = null;
          driverLocation.value = null;
          _loadActiveList();
        } else {
          refresh();
        }
      }
    });
  }

  /// Refresh: in list mode reload list; in detail mode reload single (or list for driver and sync).
  Future<void> refresh() async {
    if (isListMode && activeDelivery.value == null) {
      await _loadActiveList();
    } else if (isDriver) {
      await _loadActiveList();
      final curId = activeDelivery.value?.id;
      if (curId != null) {
        final found = activeDeliveries.where((d) => d.id == curId).toList();
        activeDelivery.value = found.isNotEmpty ? found.first : (activeDeliveries.isNotEmpty ? activeDeliveries.first : null);
      } else {
        activeDelivery.value = activeDeliveries.isNotEmpty ? activeDeliveries.first : null;
      }
    } else {
      await _loadActive();
    }
  }

  /// Driver: can set status to "picked" when current is "accepted".
  bool get canDriverMarkPicked {
    final d = activeDelivery.value;
    return d != null && isDriver && (d.status == 'accepted');
  }

  /// Driver: can set status to "delivered" when current is "picked" or "on_way".
  bool get canDriverMarkDelivered {
    final d = activeDelivery.value;
    return d != null && isDriver && (d.status == 'picked' || d.status == 'on_way');
  }

  /// Driver: can mark cash received when status is delivered and payment is unpaid.
  bool get canDriverMarkPaid {
    final d = activeDelivery.value;
    return d != null && isDriver && d.status == 'delivered' && d.payment != 'paid';
  }

  /// User: can cancel trip when status is not picked yet (accepted or pending).
  bool get canUserCancel {
    final d = activeDelivery.value;
    return d != null &&
        !isDriver &&
        (d.status == 'pending' || d.status == 'accepted');
  }

  /// Driver: can cancel trip when status is accepted, picked, or on_way.
  bool get canDriverCancel {
    final d = activeDelivery.value;
    return d != null &&
        isDriver &&
        (d.status == 'accepted' || d.status == 'picked' || d.status == 'on_way');
  }

  final RxBool _updatingStatus = false.obs;
  bool get isUpdatingStatus => _updatingStatus.value;

  Future<void> markPicked() async {
    final d = activeDelivery.value;
    if (d == null || !canDriverMarkPicked) return;
    _updatingStatus.value = true;
    try {
      await _deliveryService.updateDeliveryStatus(d.id, 'picked');
      await _loadActive();
      Get.snackbar('Journey started', 'Driver is on the way.');
    } on DioException catch (e) {
      final msg = e.response?.data is Map ? (e.response!.data as Map)['message'] : null;
      Get.snackbar('Update failed', msg?.toString() ?? e.message ?? 'Request failed');
    } catch (e) {
      Get.snackbar('Update failed', e.toString());
    } finally {
      _updatingStatus.value = false;
    }
  }

  Future<void> markDelivered() async {
    final d = activeDelivery.value;
    if (d == null || !canDriverMarkDelivered) return;
    _updatingStatus.value = true;
    try {
      await _deliveryService.updateDeliveryStatus(d.id, 'delivered');
      // Stay on journey screen so driver can mark cash received; refresh list (delivered drops off).
      await _loadActiveList();
      activeDelivery.value = d.copyWith(status: 'delivered', payment: 'unpaid');
      Get.snackbar('Delivery completed', 'Record cash received from customer, then tap "Mark as paid".');
    } on DioException catch (e) {
      final msg = e.response?.data is Map ? (e.response!.data as Map)['message'] : null;
      Get.snackbar('Update failed', msg?.toString() ?? e.message ?? 'Request failed');
    } catch (e) {
      Get.snackbar('Update failed', e.toString());
    } finally {
      _updatingStatus.value = false;
    }
  }

  final RxBool _updatingPayment = false.obs;
  bool get isUpdatingPayment => _updatingPayment.value;

  Future<void> markPaid() async {
    final d = activeDelivery.value;
    if (d == null || !canDriverMarkPaid) return;
    _updatingPayment.value = true;
    try {
      final updated = await _deliveryService.updateDeliveryPayment(d.id, 'paid');
      activeDelivery.value = updated;
      final commission = updated.driverCommissionAmount ?? 0;
      final handover = updated.amountDueToAdmin ?? 0;
      Get.snackbar(
        'Recorded',
        'Your commission: ${commission.toStringAsFixed(0)} ETB; amount to hand over: ${handover.toStringAsFixed(0)} ETB',
        duration: const Duration(seconds: 5),
      );
      Get.offNamed(Routes.deliveries);
    } on DioException catch (e) {
      final msg = e.response?.data is Map ? (e.response!.data as Map)['message'] : null;
      Get.snackbar('Update failed', msg?.toString() ?? e.message ?? 'Request failed');
    } catch (e) {
      Get.snackbar('Update failed', e.toString());
    } finally {
      _updatingPayment.value = false;
    }
  }

  Future<void> cancelTrip() async {
    final d = activeDelivery.value;
    if (d == null || (!canDriverCancel && !canUserCancel)) return;
    _updatingStatus.value = true;
    try {
      await _deliveryService.updateDeliveryStatus(d.id, 'cancelled');
      Get.offNamed(Routes.deliveries);
      Get.snackbar('Trip cancelled', 'The trip has been cancelled.');
    } on DioException catch (e) {
      final msg = e.response?.data is Map ? (e.response!.data as Map)['message'] : null;
      Get.snackbar('Cancel failed', msg?.toString() ?? e.message ?? 'Request failed');
    } catch (e) {
      Get.snackbar('Cancel failed', e.toString());
    } finally {
      _updatingStatus.value = false;
    }
  }

  Future<void> openDriverInMaps() async {
    final loc = driverLocation.value;
    if (loc == null) return;
    final uri = Uri.parse('https://www.google.com/maps?q=${loc.lat},${loc.lng}');
    try {
      await launchUrl(uri, mode: LaunchMode.externalApplication);
    } catch (_) {}
  }

  /// Launch phone dialer to call driver (user only).
  Future<void> callDriver(String phone) async {
    final trimmed = phone.trim();
    if (trimmed.isEmpty) return;
    final uri = Uri.parse('tel:$trimmed');
    try {
      await launchUrl(uri, mode: LaunchMode.externalApplication);
    } catch (_) {}
  }

  /// Launch phone dialer to call receiver.
  Future<void> callReceiver(String phone) async {
    final trimmed = phone.trim();
    if (trimmed.isEmpty) return;
    final uri = Uri.parse('tel:$trimmed');
    try {
      await launchUrl(uri, mode: LaunchMode.externalApplication);
    } catch (_) {}
  }

}
