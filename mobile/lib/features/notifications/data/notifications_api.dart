import 'package:dio/dio.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../core/api_client.dart';
import '../../../models/notification.dart';

/// Mirrors the web app's `src/api/notifications.api.js`. The backend caps
/// listNotifications at a fixed 50 rows (notification.controller.js) with no
/// before/limit query params, so there's no pagination to mirror here.
class NotificationsApi {
  final Dio _dio;

  NotificationsApi(this._dio);

  Future<List<AppNotification>> fetchNotifications() async {
    final res = await _dio.get<List<dynamic>>('/notifications');
    return res.data!.map((e) => AppNotification.fromJson(e as Map<String, dynamic>)).toList();
  }

  Future<int> fetchUnreadCount() async {
    final res = await _dio.get<Map<String, dynamic>>('/notifications/unread-count');
    return res.data!['count'] as int;
  }

  Future<void> markRead(String id) => _dio.post<void>('/notifications/$id/read');

  Future<void> markAllRead() => _dio.post<void>('/notifications/read-all');
}

final notificationsApiProvider = Provider<NotificationsApi>((ref) => NotificationsApi(ref.read(dioProvider)));
