import 'package:flutter_riverpod/flutter_riverpod.dart';

import 'storage_service.dart';

/// The shared, low-level session state — equivalent to the RN app's
/// `authStore.js`. Lives in core/ (not features/auth/) because both
/// ApiClient and SocketService need to read the current access token
/// without depending on the higher-level auth feature (which itself depends
/// on core/). Feature-level auth actions (login/register/logout/etc., the
/// equivalent of `useAuth.js`) are built on top of this in
/// features/auth/providers/auth_provider.dart.
class AuthSession {
  final Map<String, dynamic>? user;
  final String? accessToken;
  final String? refreshToken;
  final bool hydrated;

  const AuthSession({this.user, this.accessToken, this.refreshToken, this.hydrated = false});

  bool get isAuthenticated => user != null && accessToken != null;

  String? get userId => user?['id'] as String?;

  AuthSession copyWith({
    Map<String, dynamic>? user,
    String? accessToken,
    String? refreshToken,
    bool? hydrated,
  }) =>
      AuthSession(
        user: user ?? this.user,
        accessToken: accessToken ?? this.accessToken,
        refreshToken: refreshToken ?? this.refreshToken,
        hydrated: hydrated ?? this.hydrated,
      );
}

class AuthSessionNotifier extends Notifier<AuthSession> {
  @override
  AuthSession build() => const AuthSession();

  void restore(AuthSession? restored) {
    state = (restored ?? const AuthSession()).copyWith(hydrated: true);
  }

  void setSession({required Map<String, dynamic> user, required String accessToken, required String refreshToken}) {
    state = AuthSession(user: user, accessToken: accessToken, refreshToken: refreshToken, hydrated: true);
  }

  void setTokens({required String accessToken, required String refreshToken}) {
    state = state.copyWith(accessToken: accessToken, refreshToken: refreshToken);
  }

  void updateUser(Map<String, dynamic> partial) {
    if (state.user == null) return;
    state = state.copyWith(user: {...state.user!, ...partial});
  }

  void clear() {
    state = const AuthSession(hydrated: true);
  }
}

final authSessionProvider = NotifierProvider<AuthSessionNotifier, AuthSession>(AuthSessionNotifier.new);

/// Reads the persisted auth blob once at app startup and seeds
/// authSessionProvider — the equivalent of authStore.js's `hydrate()`,
/// invoked once from RootNavigator on mount.
final authHydrationProvider = FutureProvider<void>((ref) async {
  final blob = await ref.read(storageServiceProvider).readAuth();
  if (blob != null && blob.user != null && blob.accessToken != null && blob.refreshToken != null) {
    ref.read(authSessionProvider.notifier).restore(
          AuthSession(user: blob.user, accessToken: blob.accessToken, refreshToken: blob.refreshToken),
        );
  } else {
    ref.read(authSessionProvider.notifier).restore(null);
  }
});
