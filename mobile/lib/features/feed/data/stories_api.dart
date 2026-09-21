import 'package:dio/dio.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../core/api_client.dart';
import '../../../models/story.dart';

/// Mirrors the RN app's `src/api/stories.api.js`.
class StoriesApi {
  final Dio _dio;

  StoriesApi(this._dio);

  Future<List<StoryGroup>> fetchStoriesFeed() async {
    final res = await _dio.get<List<dynamic>>('/stories/feed');
    return res.data!.map((e) => StoryGroup.fromJson(e as Map<String, dynamic>)).toList();
  }

  Future<List<Story>> fetchUserStories(String userId) async {
    final res = await _dio.get<List<dynamic>>('/stories/user/$userId');
    return res.data!.map((e) => Story.fromJson(e as Map<String, dynamic>)).toList();
  }

  Future<void> viewStory(String storyId) => _dio.post('/stories/$storyId/view');

  Future<List<StoryViewerEntry>> fetchStoryViewers(String storyId) async {
    final res = await _dio.get<List<dynamic>>('/stories/$storyId/viewers');
    return res.data!.map((e) => StoryViewerEntry.fromJson(e as Map<String, dynamic>)).toList();
  }

  /// `mediaUrl` comes from a prior `MediaApi.upload` call.
  Future<Story> createStory({required String mediaUrl, String mediaType = 'image', String? caption}) async {
    final res = await _dio.post<Map<String, dynamic>>('/stories', data: {
      'mediaUrl': mediaUrl,
      'mediaType': mediaType,
      'caption': ?(caption != null && caption.isNotEmpty ? caption : null),
    });
    return Story.fromJson(res.data!);
  }

  Future<void> deleteStory(String storyId) => _dio.delete('/stories/$storyId');
}

final storiesApiProvider = Provider<StoriesApi>((ref) => StoriesApi(ref.read(dioProvider)));
