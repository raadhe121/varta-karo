import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../core/auth_session.dart';
import '../../../core/socket_service.dart';
import '../../../core/storage_service.dart';
import '../data/auth_api.dart';

/// The "actions" layer on top of authSessionProvider — equivalent of the RN
/// app's `useAuth.js` hook. Holds no state of its own; every method ends by
/// mutating authSessionProvider (the single source of truth).
class AuthActions {
  final Ref _ref;

  AuthActions(this._ref);

  Future<void> _applyAuth(Map<String, dynamic> data) async {
    final user = data['user'] as Map<String, dynamic>;
    final accessToken = data['accessToken'] as String;
    final refreshToken = data['refreshToken'] as String;

    _ref
        .read(authSessionProvider.notifier)
        .setSession(
          user: user,
          accessToken: accessToken,
          refreshToken: refreshToken,
        );
    await _ref
        .read(storageServiceProvider)
        .saveAuth(
          AuthBlob(
            user: user,
            accessToken: accessToken,
            refreshToken: refreshToken,
          ),
        );
    _ref.read(socketServiceProvider).connect();
  }

  Future<void> register({
    required String username,
    String? name,
    String? password,
    String? email,
    String? phone,
  }) async {
    final data = await _ref
        .read(authApiProvider)
        .register(
          username: username,
          name: name,
          password: password,
          email: email,
          phone: phone,
        );
    await _applyAuth(data);
  }

  Future<bool> checkUsername(String username) =>
      _ref.read(authApiProvider).checkUsername(username);

  Future<void> login({
    required String identifier,
    required String password,
  }) async {
    final data = await _ref
        .read(authApiProvider)
        .login(identifier: identifier, password: password);
    await _applyAuth(data);
  }

  /// Applies an already-fetched `{user, accessToken, refreshToken}` login
  /// response (e.g. from random_chat's inline "log in to accept" form,
  /// which needs the REST call's result before deciding what to do next)
  /// without re-issuing the REST call itself.
  Future<void> applyExternalAuth(Map<String, dynamic> data) => _applyAuth(data);

  Future<void> requestOtp(String phone) =>
      _ref.read(authApiProvider).requestOtp(phone);

  Future<void> verifyOtp({required String phone, required String code}) async {
    final data = await _ref
        .read(authApiProvider)
        .verifyOtp(phone: phone, code: code);
    await _applyAuth(data);
  }

  /// Called by EditProfileScreen after a successful PATCH /users/me.
  Future<void> updateUser(Map<String, dynamic> partial) async {
    _ref.read(authSessionProvider.notifier).updateUser(partial);
    final session = _ref.read(authSessionProvider);
    if (session.user == null ||
        session.accessToken == null ||
        session.refreshToken == null)
      return;
    await _ref
        .read(storageServiceProvider)
        .saveAuth(
          AuthBlob(
            user: session.user,
            accessToken: session.accessToken,
            refreshToken: session.refreshToken,
          ),
        );
  }

  Future<void> logout() async {
    await _ref.read(authApiProvider).logout();
    _ref.read(socketServiceProvider).disconnect();
    await _ref.read(storageServiceProvider).clearAuth();
    _ref.read(authSessionProvider.notifier).clear();
  }
}

final authActionsProvider = Provider<AuthActions>((ref) => AuthActions(ref));
