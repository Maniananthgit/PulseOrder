import 'package:flutter_test/flutter_test.dart';
import 'package:shared_preferences/shared_preferences.dart';
import 'package:pulseorder/data/services/storage_service.dart';

void main() {
  TestWidgetsFlutterBinding.ensureInitialized();

  group('StorageService & Secure Token Storage Tests', () {
    late StorageService storageService;

    setUp(() {
      SharedPreferences.setMockInitialValues({});
      storageService = StorageService();
    });

    test('Securely save and retrieve JWT access and refresh tokens', () async {
      const accessToken = 'header.eyJzdWIiOiIxMjM0NTY3ODkwIiwicm9sZSI6ImFkbWluIn0.signature';
      const refreshToken = 'header.eyJzdWIiOiIxMjM0NTY3ODkwIiwidHlwZSI6InJlZnJlc2gifQ.signature';

      await storageService.saveTokens(
        accessToken: accessToken,
        refreshToken: refreshToken,
      );

      final storedAccess = await storageService.getAccessToken();
      final storedRefresh = await storageService.getRefreshToken();

      expect(storedAccess, equals(accessToken));
      expect(storedRefresh, equals(refreshToken));
    });

    test('Store and retrieve Server RSA Public Key PEM', () async {
      const rsaPem = '-----BEGIN PUBLIC KEY-----\nMIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8A...\n-----END PUBLIC KEY-----';
      await storageService.saveRsaPublicKey(rsaPem);

      final retrievedPem = await storageService.getRsaPublicKey();
      expect(retrievedPem, equals(rsaPem));
    });

    test('Clear all tokens and reset secure credentials', () async {
      await storageService.saveTokens(
        accessToken: 'temp_access',
        refreshToken: 'temp_refresh',
      );
      await storageService.saveTerminalRole('kiosk');

      await storageService.clearAll();

      final access = await storageService.getAccessToken();
      final refresh = await storageService.getRefreshToken();
      final role = await storageService.getTerminalRole();

      expect(access, isNull);
      expect(refresh, isNull);
      expect(role, isNull);
    });
  });
}

