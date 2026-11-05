import 'dart:convert';
import 'package:http/http.dart' as http;
import '../../core/constants/api_constants.dart';
import 'storage_service.dart';

/// Cryptographic Security Service for OrderEase Table Kiosk
/// Handles RSA public key synchronization and payload security handshakes
class SecurityService {
  final StorageService _storageService;

  SecurityService({StorageService? storageService})
      : _storageService = storageService ?? StorageService();

  /// Fetches and caches server's RSA-2048 public key
  Future<String?> fetchServerRsaPublicKey() async {
    try {
      final uri = Uri.parse('${ApiConstants.baseUrl}/api/v1/auth/public-key');
      final response = await http.get(uri).timeout(const Duration(seconds: 5));
      if (response.statusCode == 200) {
        final data = jsonDecode(response.body);
        final pem = data['public_key'] as String?;
        if (pem != null) {
          await _storageService.saveRsaPublicKey(pem);
          return pem;
        }
      }
    } catch (_) {
      // Offline fallback or cached key
    }
    return await _storageService.getRsaPublicKey();
  }

  /// Sends test encrypted payload to verify backend decryption
  Future<bool> verifyBackendRsaHandshake(String testSecret) async {
    try {
      final uri = Uri.parse('${ApiConstants.baseUrl}/api/v1/auth/decrypt-test');
      // For testing endpoint
      final response = await http.post(
        uri,
        headers: {'Content-Type': 'application/json'},
        body: jsonEncode({'encrypted_payload': testSecret}),
      ).timeout(const Duration(seconds: 5));
      return response.statusCode == 200;
    } catch (_) {
      return false;
    }
  }
}

