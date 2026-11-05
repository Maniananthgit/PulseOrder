import 'dart:async';
import 'dart:convert';
import 'package:flutter/foundation.dart';
import 'package:web_socket_channel/web_socket_channel.dart';
import '../../core/constants/api_constants.dart';

class WebSocketService {
  WebSocketChannel? _channel;
  final _eventController = StreamController<Map<String, dynamic>>.broadcast();
  Timer? _reconnectTimer;
  Timer? _pingTimer;
  String? _currentRoom;
  bool _isDisposed = false;

  Stream<Map<String, dynamic>> get eventStream => _eventController.stream;

  void connect(String room) {
    _currentRoom = room;
    _isDisposed = false;
    _establishConnection();
  }

  void _establishConnection() {
    if (_currentRoom == null || _isDisposed) return;

    try {
      final uri = Uri.parse('${ApiConstants.wsUrl}/$_currentRoom');
      _channel = WebSocketChannel.connect(uri);

      _channel!.stream.listen(
        (message) {
          try {
            final data = jsonDecode(message);
            if (data is Map<String, dynamic>) {
              _eventController.add(data);
            }
          } catch (e) {
            debugPrint('WS decode error: $e');
          }
        },
        onError: (error) {
          debugPrint('WS connection error: $error');
          _scheduleReconnect();
        },
        onDone: () {
          debugPrint('WS closed');
          _scheduleReconnect();
        },
      );

      _startPing();
    } catch (e) {
      debugPrint('WS connect exception: $e');
      _scheduleReconnect();
    }
  }

  void _startPing() {
    _pingTimer?.cancel();
    _pingTimer = Timer.periodic(const Duration(seconds: 25), (_) {
      if (_channel != null) {
        try {
          _channel!.sink.add(jsonEncode({'type': 'ping'}));
        } catch (_) {}
      }
    });
  }

  void _scheduleReconnect() {
    if (_isDisposed) return;
    _pingTimer?.cancel();
    _reconnectTimer?.cancel();
    _reconnectTimer = Timer(const Duration(seconds: 4), () {
      if (!_isDisposed) {
        _establishConnection();
      }
    });
  }

  void disconnect() {
    _isDisposed = true;
    _reconnectTimer?.cancel();
    _pingTimer?.cancel();
    _channel?.sink.close();
    _channel = null;
  }
}

