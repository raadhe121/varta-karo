import 'package:dio/dio.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../core/api_client.dart';

/// Thin wrapper over the /auth REST surface. Mirrors the RN app's
/// `src/api/auth.api.js` (token refresh itself lives in ApiClient, not here,
/// same split as the RN app where http.js owns refresh).
class AuthApi {
  final Dio _dio;

  AuthApi(this._dio);

  /// Only `username` is required — a quick "just pick a handle" signup with
  /// no password, mirroring the web app's username-only registration. Name
  /// defaults server-side to the username; an account created this way has
  /// no password and stays signed in via the stored refresh token.
  Future<Map<String, dynamic>> register({
    required String username,
    String? name,
    String? password,
    String? email,
    String? phone,
  }) async {
    final res = await _dio.post<Map<String, dynamic>>(
      '/auth/register',
      data: {
        'username': username,
        if (name != null && name.isNotEmpty) 'name': name,
        if (password != null && password.isNotEmpty) 'password': password,
        if (email != null && email.isNotEmpty) 'email': email,
        if (phone != null && phone.isNotEmpty) 'phone': phone,
      },
    );
    return res.data!;
  }

  Future<bool> checkUsername(String username) async {
    final res = await _dio.get<Map<String, dynamic>>(
      '/auth/check-username',
      queryParameters: {'username': username},
    );
    return res.data!['available'] as bool;
  }

  Future<Map<String, dynamic>> login({
    required String identifier,
    required String password,
  }) async {
    final res = await _dio.post<Map<String, dynamic>>(
      '/auth/login',
      data: {'identifier': identifier, 'password': password},
    );
    return res.data!;
  }

  Future<void> requestOtp(String phone) async {
    await _dio.post<Map<String, dynamic>>(
      '/auth/otp/request',
      data: {'phone': phone},
    );
  }

  Future<Map<String, dynamic>> verifyOtp({
    required String phone,
    required String code,
  }) async {
    final res = await _dio.post<Map<String, dynamic>>(
      '/auth/otp/verify',
      data: {'phone': phone, 'code': code},
    );
    return res.data!;
  }

  Future<void> logout() async {
    try {
      await _dio.post<void>('/auth/logout');
    } catch (_) {
      // Stateless JWTs server-side — logout is best-effort, never blocks
      // clearing the local session.
    }
  }
}

final authApiProvider = Provider<AuthApi>(
  (ref) => AuthApi(ref.read(dioProvider)),
);
