import 'package:dio/dio.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../core/api_client.dart';
import '../../../models/profile.dart';
import '../../../models/social_request.dart';
import '../../../models/user.dart';

/// Mirrors the RN app's `src/api/social.api.js`.
class SocialApi {
  final Dio _dio;

  SocialApi(this._dio);

  Future<UserProfile> fetchProfile(String userId) async {
    final res = await _dio.get<Map<String, dynamic>>('/users/$userId/profile');
    return UserProfile.fromJson(res.data!);
  }

  Future<List<ActivityItem>> fetchMyActivity() async {
    final res = await _dio.get<List<dynamic>>('/users/me/activity');
    return res.data!.map((e) => ActivityItem.fromJson(e as Map<String, dynamic>)).toList();
  }

  Future<SocialRequest> sendFriendRequest(String userId) async {
    final res = await _dio.post<Map<String, dynamic>>('/friends/request/$userId');
    return SocialRequest.fromJson(res.data!);
  }

  Future<SocialRequest> acceptFriendRequest(String requestId) async {
    final res = await _dio.post<Map<String, dynamic>>('/friends/$requestId/accept');
    return SocialRequest.fromJson(res.data!);
  }

  Future<SocialRequest> declineFriendRequest(String requestId) async {
    final res = await _dio.post<Map<String, dynamic>>('/friends/$requestId/decline');
    return SocialRequest.fromJson(res.data!);
  }

  Future<List<AppUser>> fetchFriends() async {
    final res = await _dio.get<List<dynamic>>('/friends');
    return res.data!.map((e) => AppUser.fromJson(e as Map<String, dynamic>)).toList();
  }

  Future<List<IncomingRequest>> fetchIncomingFriendRequests() async {
    final res = await _dio.get<List<dynamic>>('/friends/requests/incoming');
    return res.data!.map((e) => IncomingRequest.fromJson(e as Map<String, dynamic>)).toList();
  }

  Future<void> followUser(String userId) => _dio.post<void>('/follow/$userId');

  Future<void> unfollowUser(String userId) => _dio.delete<void>('/follow/$userId');

  /// GET /users/suggestions — "People You May Know": users the caller
  /// doesn't already follow, ranked by mutual-friend count. Mirrors
  /// `client/src/api/social.api.js`'s `fetchSuggestions`.
  Future<List<Suggestion>> fetchSuggestions() async {
    final res = await _dio.get<List<dynamic>>('/users/suggestions');
    return res.data!.map((e) => Suggestion.fromJson(e as Map<String, dynamic>)).toList();
  }
}

final socialApiProvider = Provider<SocialApi>((ref) => SocialApi(ref.read(dioProvider)));
