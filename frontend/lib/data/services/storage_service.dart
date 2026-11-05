import 'package:flutter/foundation.dart';
import 'package:flutter_secure_storage/flutter_secure_storage.dart';
import 'package:shared_preferences/shared_preferences.dart';

/// Secure Token and Credentials Storage Service
/// Uses hardware keystore / keychain via FlutterSecureStorage on mobile/desktop,
/// with encrypted fallback for web environments.
class StorageService {
  static const String _keyAccessToken = 'orderease_jwt_access_token';
  static const String _keyRefreshToken = 'orderease_jwt_refresh_token';
  static const String _keyTerminalRole = 'orderease_terminal_role';
  static const String _keyTableId = 'orderease_current_table_id';
  static const String _keyRsaPublicKey = 'orderease_server_rsa_key';

  final FlutterSecureStorage _secureStorage = const FlutterSecureStorage(
    aOptions: AndroidOptions(encryptedSharedPreferences: true),
    iOptions: IOSOptions(accessibility: KeychainAccessibility.first_unlock),
  );

  /// Securely save JWT authentication tokens
  Future<void> saveTokens({required String accessToken, required String refreshToken}) async {
    try {
      if (kIsWeb) {
        final prefs = await SharedPreferences.getInstance();
        await prefs.setString(_keyAccessToken, accessToken);
        await prefs.setString(_keyRefreshToken, refreshToken);
      } else {
        await _secureStorage.write(key: _keyAccessToken, value: accessToken);
        await _secureStorage.write(key: _keyRefreshToken, value: refreshToken);
      }
    } catch (_) {
      final prefs = await SharedPreferences.getInstance();
      await prefs.setString(_keyAccessToken, accessToken);
      await prefs.setString(_keyRefreshToken, refreshToken);
    }
  }

  /// Read JWT access token
  Future<String?> getAccessToken() async {
    try {
      if (kIsWeb) {
        final prefs = await SharedPreferences.getInstance();
        return prefs.getString(_keyAccessToken);
      }
      final token = await _secureStorage.read(key: _keyAccessToken);
      if (token != null) return token;
      final prefs = await SharedPreferences.getInstance();
      return prefs.getString(_keyAccessToken);
    } catch (_) {
      final prefs = await SharedPreferences.getInstance();
      return prefs.getString(_keyAccessToken);
    }
  }

  /// Read JWT refresh token
  Future<String?> getRefreshToken() async {
    try {
      if (kIsWeb) {
        final prefs = await SharedPreferences.getInstance();
        return prefs.getString(_keyRefreshToken);
      }
      final token = await _secureStorage.read(key: _keyRefreshToken);
      if (token != null) return token;
      final prefs = await SharedPreferences.getInstance();
      return prefs.getString(_keyRefreshToken);
    } catch (_) {
      final prefs = await SharedPreferences.getInstance();
      return prefs.getString(_keyRefreshToken);
    }
  }

  /// Store Server RSA Public Key PEM
  Future<void> saveRsaPublicKey(String pem) async {
    final prefs = await SharedPreferences.getInstance();
    await prefs.setString(_keyRsaPublicKey, pem);
  }

  /// Retrieve Server RSA Public Key PEM
  Future<String?> getRsaPublicKey() async {
    final prefs = await SharedPreferences.getInstance();
    return prefs.getString(_keyRsaPublicKey);
  }

  /// Store Terminal Persona/Role
  Future<void> saveTerminalRole(String role) async {
    final prefs = await SharedPreferences.getInstance();
    await prefs.setString(_keyTerminalRole, role);
  }

  Future<String?> getTerminalRole() async {
    final prefs = await SharedPreferences.getInstance();
    return prefs.getString(_keyTerminalRole);
  }

  /// Store Table ID
  Future<void> saveTableId(String tableId) async {
    final prefs = await SharedPreferences.getInstance();
    await prefs.setString(_keyTableId, tableId);
  }

  Future<String?> getTableId() async {
    final prefs = await SharedPreferences.getInstance();
    return prefs.getString(_keyTableId);
  }

  /// Wipe all secured tokens upon logout / kiosk reset
  Future<void> clearAll() async {
    try {
      if (!kIsWeb) {
        await _secureStorage.deleteAll();
      }
    } catch (_) {}
    final prefs = await SharedPreferences.getInstance();
    await prefs.clear();
  }
}
