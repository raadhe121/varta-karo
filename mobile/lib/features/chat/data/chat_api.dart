import 'package:dio/dio.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../core/api_client.dart';
import '../../../models/conversation.dart';
import '../../../models/message.dart';

/// Mirrors the web app's `src/api/chat.api.js` REST surface. Sending a
/// message, marking one read, and typing indicators are socket-only on the
/// backend (see server/src/socket/handlers/message.handler.js and
/// typing.handler.js) — those live on SocketService, not here.
class ChatApi {
  final Dio _dio;

  ChatApi(this._dio);

  Future<List<Conversation>> fetchConversations() async {
    final res = await _dio.get<List<dynamic>>('/conversations');
    return res.data!.map((e) => Conversation.fromJson(e as Map<String, dynamic>)).toList();
  }

  Future<Conversation> createDirectConversation(String userId) async {
    final res = await _dio.post<Map<String, dynamic>>('/conversations', data: {
      'type': 'direct',
      'participantIds': [userId],
    });
    return Conversation.fromJson(res.data!);
  }

  Future<Conversation> createGroupConversation({required String name, required List<String> participantIds}) async {
    final res = await _dio.post<Map<String, dynamic>>('/conversations', data: {
      'type': 'group',
      'name': name,
      'participantIds': participantIds,
    });
    return Conversation.fromJson(res.data!);
  }

  Future<Conversation> updateConversation(String id, {String? name, String? avatarUrl}) async {
    final res = await _dio.patch<Map<String, dynamic>>('/conversations/$id', data: {
      'name': ?name,
      'avatarUrl': ?avatarUrl,
    });
    return Conversation.fromJson(res.data!);
  }

  Future<Conversation> addParticipants(String id, List<String> userIds) async {
    final res = await _dio.post<Map<String, dynamic>>('/conversations/$id/participants', data: {'userIds': userIds});
    return Conversation.fromJson(res.data!);
  }

  /// `before` mirrors fetchMessages(id, before) — pass the createdAt of the
  /// oldest already-loaded message to page further back.
  Future<List<ChatMessage>> fetchMessages(String conversationId, {DateTime? before}) async {
    final res = await _dio.get<List<dynamic>>(
      '/conversations/$conversationId/messages',
      queryParameters: before != null ? {'before': before.toIso8601String()} : null,
    );
    return res.data!.map((e) => ChatMessage.fromJson(e as Map<String, dynamic>)).toList();
  }
}

final chatApiProvider = Provider<ChatApi>((ref) => ChatApi(ref.read(dioProvider)));
