import 'package:dio/dio.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../config/env.dart';
import 'auth_session.dart';
import 'socket_service.dart';
import 'storage_service.dart';

/// Mirrors the RN app's `src/api/http.js`: injects the bearer token on every
/// request, and on a 401 does a single deduplicated refresh-and-retry-once
/// (concurrent 401s share one in-flight refresh call). Deliberately drops
/// http.js's other policy of force-logging-out on ANY 404/500 response —
/// that was a blunt "kill the session" behavior worth dropping in the
/// rewrite (see the "Deliberate fixes" section of the rewrite plan); a 404
/// or 500 from one endpoint should just surface as a normal error here.
class ApiClient {
  final Ref _ref;
  late final Dio dio;
  Future<Map<String, dynamic>>? _refreshFuture;

  ApiClient(this._ref) {
    dio = Dio(BaseOptions(
      baseUrl: Env.apiUrl,
      connectTimeout: const Duration(seconds: 15),
      receiveTimeout: const Duration(seconds: 20),
    ));

    dio.interceptors.add(InterceptorsWrapper(
      onRequest: (options, handler) {
        final token = _ref.read(authSessionProvider).accessToken;
        if (token != null) {
          options.headers['Authorization'] = 'Bearer $token';
        }
        handler.next(options);
      },
      onError: (error, handler) async {
        final requestOptions = error.requestOptions;
        final alreadyRetried = requestOptions.extra['retried'] == true;
        final refreshToken = _ref.read(authSessionProvider).refreshToken;

        if (error.response?.statusCode == 401 && !alreadyRetried && refreshToken != null) {
          try {
            final tokens = await _refreshTokens(refreshToken);
            requestOptions.extra['retried'] = true;
            requestOptions.headers['Authorization'] = 'Bearer ${tokens['accessToken']}';
            final retried = await dio.fetch<dynamic>(requestOptions);
            return handler.resolve(retried);
          } catch (_) {
            await _ref.read(storageServiceProvider).clearAuth();
            _ref.read(authSessionProvider.notifier).clear();
            _ref.read(socketServiceProvider).disconnect();
          }
        }
        handler.next(error);
      },
    ));
  }

  Future<Map<String, dynamic>> _refreshTokens(String refreshToken) {
    _refreshFuture ??= _doRefresh(refreshToken).whenComplete(() => _refreshFuture = null);
    return _refreshFuture!;
  }

  Future<Map<String, dynamic>> _doRefresh(String refreshToken) async {
    final plain = Dio(BaseOptions(baseUrl: Env.apiUrl));
    final res = await plain.post<Map<String, dynamic>>('/auth/refresh', data: {'refreshToken': refreshToken});
    final data = res.data!;
    final accessToken = data['accessToken'] as String;
    final newRefreshToken = data['refreshToken'] as String;

    _ref.read(authSessionProvider.notifier).setTokens(accessToken: accessToken, refreshToken: newRefreshToken);

    final session = _ref.read(authSessionProvider);
    await _ref.read(storageServiceProvider).saveAuth(AuthBlob(
          user: session.user,
          accessToken: accessToken,
          refreshToken: newRefreshToken,
        ));

    return data;
  }
}

final apiClientProvider = Provider<ApiClient>((ref) => ApiClient(ref));

/// Convenience for feature api files: `ref.read(dioProvider)`.
final dioProvider = Provider<Dio>((ref) => ref.read(apiClientProvider).dio);
