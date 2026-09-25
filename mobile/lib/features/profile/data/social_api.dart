import 'package:dio/dio.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../core/api_client.dart';
import '../../../models/profile.dart';
import '../../../models/user.dart';

/// Mirrors the web app's `src/api/social.api.js`. The old separate
/// friend-request system is gone — "friends" is now just a mutual follow
/// (see UserProfile.isMutual), so chat eligibility and "people you may know"
/// both key off Follow rows only.
class SocialApi {
  final Dio _dio;

  SocialApi(this._dio);

  Future<List<AppUser>> searchUsers(String query) async {
    final res = await _dio.get<List<dynamic>>(
      '/users/search',
      queryParameters: {'q': query},
    );
    return res.data!
        .map((e) => AppUser.fromJson(e as Map<String, dynamic>))
        .toList();
  }

  Future<UserProfile> fetchProfile(String userId) async {
    final res = await _dio.get<Map<String, dynamic>>('/users/$userId/profile');
    return UserProfile.fromJson(res.data!);
  }

  Future<List<ActivityItem>> fetchMyActivity() async {
    final res = await _dio.get<List<dynamic>>('/users/me/activity');
    return res.data!
        .map((e) => ActivityItem.fromJson(e as Map<String, dynamic>))
        .toList();
  }

  Future<void> followUser(String userId) => _dio.post<void>('/follow/$userId');

  Future<void> unfollowUser(String userId) =>
      _dio.delete<void>('/follow/$userId');

  /// Users who follow the caller back and are followed by the caller — the
  /// only people the caller can start a direct chat with (server enforces
  /// the same rule in conversation.controller.createConversation).
  Future<List<AppUser>> fetchMutualFollows() async {
    final res = await _dio.get<List<dynamic>>('/follow/mutual');
    return res.data!
        .map((e) => AppUser.fromJson(e as Map<String, dynamic>))
        .toList();
  }

  Future<List<AppUser>> fetchFollowers(String userId) async {
    final res = await _dio.get<List<dynamic>>('/follow/$userId/followers');
    return res.data!
        .map((e) => AppUser.fromJson(e as Map<String, dynamic>))
        .toList();
  }

  Future<List<AppUser>> fetchFollowing(String userId) async {
    final res = await _dio.get<List<dynamic>>('/follow/$userId/following');
    return res.data!
        .map((e) => AppUser.fromJson(e as Map<String, dynamic>))
        .toList();
  }

  /// GET /users/suggestions — "People You May Know": users the caller
  /// doesn't already follow, ranked by how many people they already follow
  /// also follow the candidate. Mirrors `client/src/api/social.api.js`.
  Future<List<Suggestion>> fetchSuggestions() async {
    final res = await _dio.get<List<dynamic>>('/users/suggestions');
    return res.data!
        .map((e) => Suggestion.fromJson(e as Map<String, dynamic>))
        .toList();
  }
}

final socialApiProvider = Provider<SocialApi>(
  (ref) => SocialApi(ref.read(dioProvider)),
);
