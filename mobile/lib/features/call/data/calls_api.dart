import 'package:dio/dio.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../core/api_client.dart';
import '../../../models/call_log.dart';

/// Mirrors the web app's `src/api/calls.api.js` — GET/POST /calls, matching
/// server/src/controllers/call.controller.js's `listCalls`/`logCall`.
class CallsApi {
  final Dio _dio;

  CallsApi(this._dio);

  Future<List<CallLogEntry>> fetchCallHistory() async {
    final res = await _dio.get<List<dynamic>>('/calls');
    return res.data!.map((e) => CallLogEntry.fromJson(e as Map<String, dynamic>)).toList();
  }

  /// Records a finished call for history — the caller's side only (see
  /// call_actions.dart), matching webrtc.js's `finalizeAndLog`.
  Future<CallLogEntry> logCall({
    required String conversationId,
    required String calleeId,
    required String type,
    required String status,
    int durationSec = 0,
  }) async {
    final res = await _dio.post<Map<String, dynamic>>('/calls', data: {
      'conversationId': conversationId,
      'calleeId': calleeId,
      'type': type,
      'status': status,
      'durationSec': durationSec,
    });
    return CallLogEntry.fromJson(res.data!);
  }
}

final callsApiProvider = Provider<CallsApi>((ref) => CallsApi(ref.read(dioProvider)));
