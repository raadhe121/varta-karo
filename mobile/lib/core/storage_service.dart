import 'dart:convert';

import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_secure_storage/flutter_secure_storage.dart';

/// Mirrors the RN app's authStore persistence: one JSON blob under a single
/// key, holding the current user plus both tokens. Secure storage here is a
/// behavior-preserving upgrade over RN's plain AsyncStorage.
class AuthBlob {
  final Map<String, dynamic>? user;
  final String? accessToken;
  final String? refreshToken;

  const AuthBlob({this.user, this.accessToken, this.refreshToken});

  Map<String, dynamic> toJson() => {'user': user, 'accessToken': accessToken, 'refreshToken': refreshToken};

  factory AuthBlob.fromJson(Map<String, dynamic> json) => AuthBlob(
        user: json['user'] as Map<String, dynamic>?,
        accessToken: json['accessToken'] as String?,
        refreshToken: json['refreshToken'] as String?,
      );
}

class StorageService {
  static const _key = 'vartakaro.auth';
  final FlutterSecureStorage _storage;

  StorageService({FlutterSecureStorage? storage}) : _storage = storage ?? const FlutterSecureStorage();

  Future<void> saveAuth(AuthBlob blob) => _storage.write(key: _key, value: jsonEncode(blob.toJson()));

  Future<AuthBlob?> readAuth() async {
    final raw = await _storage.read(key: _key);
    if (raw == null) return null;
    try {
      return AuthBlob.fromJson(jsonDecode(raw) as Map<String, dynamic>);
    } catch (_) {
      // Corrupt/unreadable storage just means starting logged out.
      return null;
    }
  }

  Future<void> clearAuth() => _storage.delete(key: _key);
}

final storageServiceProvider = Provider<StorageService>((ref) => StorageService());
