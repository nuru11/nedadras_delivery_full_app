import 'dart:async';

import 'package:flutter/foundation.dart';
import 'package:socket_io_client_new/socket_io_client_new.dart' as io;

import '../storage/storage_service.dart';

/// Socket server URL (same host as API, no /api path). Use https for production.
const String socketServerUrl = 'https://deliveryappapi.negadrasexpress.net';
// const String socketServerUrl = 'http://192.168.1.10:4000';

/// Manages Socket.IO connection with JWT auth.
/// Drivers: emit driver:location_update every 5s; listen for driver:delivery_request.
class SocketService {
  SocketService({required StorageService storageService})
      : _storageService = storageService;

  final StorageService _storageService;
  io.Socket? _socket;
  final StreamController<Map<String, dynamic>> _deliveryRequestController =
      StreamController<Map<String, dynamic>>.broadcast();
  final StreamController<Map<String, dynamic>> _deliveryAcceptedController =
      StreamController<Map<String, dynamic>>.broadcast();
  final StreamController<Map<String, dynamic>> _driverLocationController =
      StreamController<Map<String, dynamic>>.broadcast();
  final StreamController<Map<String, dynamic>> _deliveryStatusUpdatedController =
      StreamController<Map<String, dynamic>>.broadcast();
  final StreamController<String> _deliveryRequestRemovedController =
      StreamController<String>.broadcast();

  /// Stream of incoming delivery requests (for drivers).
  Stream<Map<String, dynamic>> get deliveryRequestStream =>
      _deliveryRequestController.stream;

  /// Stream of delivery-accepted events (for users): driver accepted this user's delivery.
  Stream<Map<String, dynamic>> get deliveryAcceptedStream =>
      _deliveryAcceptedController.stream;

  /// Stream of driver location updates (for users): { deliveryId, lat, lng }.
  Stream<Map<String, dynamic>> get driverLocationStream =>
      _driverLocationController.stream;

  /// Stream of delivery status updates (user + driver): { deliveryId, status, delivery }.
  Stream<Map<String, dynamic>> get deliveryStatusUpdatedStream =>
      _deliveryStatusUpdatedController.stream;

  /// Stream of delivery IDs to remove (drivers): when another driver accepted.
  Stream<String> get deliveryRequestRemovedStream =>
      _deliveryRequestRemovedController.stream;

  bool get isConnected => _socket?.connected ?? false;

  /// Connect with JWT from storage. Call when driver or user opens app.
  void connect() {
    if (_socket?.connected == true) return;
    final token = _storageService.readToken();
    if (token == null || token.isEmpty) return;

    final opts = io.OptionBuilder()
        // Polling first: cPanel/shared hosting often blocks WebSocket
        .setTransports(['polling', 'websocket'])
        .enableAutoConnect()
        .enableForceNew()
        .setAuth({'token': token})
        .setExtraHeaders({'Authorization': 'Bearer $token'})
        .build();
    opts['query'] = {'token': token};
    if (socketServerUrl.startsWith('https')) {
      opts['port'] = 443;
      opts['secure'] = true;
    }

    _socket = io.io(socketServerUrl, opts);

    _socket!.onConnect((_) {
      debugPrint('[Socket] Connected');
    });
    _socket!.onDisconnect((reason) {
      debugPrint('[Socket] Disconnected: $reason');
    });
    _socket!.onConnectError((err) {
      debugPrint('[Socket] ConnectError: $err');
    });
    _socket!.onError((err) {
      debugPrint('[Socket] Error: $err');
    });

    _socket!.on('driver:delivery_request', (data) {
      if (data is Map<String, dynamic>) {
        _deliveryRequestController.add(Map<String, dynamic>.from(data));
      }
    });

    _socket!.on('user:delivery_accepted', (data) {
      if (data is Map<String, dynamic>) {
        _deliveryAcceptedController.add(Map<String, dynamic>.from(data));
      }
    });

    _socket!.on('user:driver_location', (data) {
      if (data is Map<String, dynamic>) {
        _driverLocationController.add(Map<String, dynamic>.from(data));
      }
    });

    _socket!.on('user:delivery_status_updated', (data) {
      if (data is Map<String, dynamic>) {
        _deliveryStatusUpdatedController.add(Map<String, dynamic>.from(data));
      }
    });
    _socket!.on('driver:delivery_status_updated', (data) {
      if (data is Map<String, dynamic>) {
        _deliveryStatusUpdatedController.add(Map<String, dynamic>.from(data));
      }
    });
    _socket!.on('driver:delivery_request_removed', (data) {
      if (data is Map && data['deliveryId'] != null) {
        _deliveryRequestRemovedController.add(data['deliveryId'].toString());
      }
    });
  }

  /// Disconnect and clear. Call when driver goes offline / logs out.
  void disconnect() {
    _socket?.disconnect();
    _socket?.dispose();
    _socket = null;
  }

  /// Emit driver location (call every ~5s from driver app).
  void emitLocation(double lat, double lng) {
    if (_socket?.connected != true) return;
    _socket!.emit('driver:location_update', {'lat': lat, 'lng': lng});
  }

  void dispose() {
    disconnect();
    _deliveryRequestController.close();
    _deliveryAcceptedController.close();
    _driverLocationController.close();
    _deliveryStatusUpdatedController.close();
    _deliveryRequestRemovedController.close();
  }
}
