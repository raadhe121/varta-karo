import 'package:dio/dio.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../core/api_client.dart';
import '../../../models/user.dart';

/// Mirrors the web app's `src/api/block.api.js`. Blocking severs any follow
/// relationship server-side and disables messaging/calling both ways — see
/// server/src/controllers/block.controller.js.
class BlockApi {
  final Dio _dio;

  BlockApi(this._dio);

  Future<void> blockUser(String userId) => _dio.post<void>('/blocks/$userId');

  Future<void> unblockUser(String userId) =>
      _dio.delete<void>('/blocks/$userId');

  Future<List<AppUser>> fetchBlockedUsers() async {
    final res = await _dio.get<List<dynamic>>('/blocks');
    return res.data!
        .map((e) => AppUser.fromJson(e as Map<String, dynamic>))
        .toList();
  }
}

final blockApiProvider = Provider<BlockApi>(
  (ref) => BlockApi(ref.read(dioProvider)),
);
