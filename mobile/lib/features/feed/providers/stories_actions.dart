import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../models/story.dart';
import '../data/stories_api.dart';
import 'stories_provider.dart';

/// The "actions" layer on top of storiesProvider — equivalent of the web
/// app's stories.api.js calls plus StoriesRow.jsx/StoryViewer.jsx's
/// imperative bits.
class StoriesActions {
  final Ref _ref;

  StoriesActions(this._ref);

  Future<void> loadFeed() async {
    final groups = await _ref.read(storiesApiProvider).fetchStoriesFeed();
    _ref.read(storiesProvider.notifier).setGroups(groups);
  }

  Future<List<Story>> loadUserStories(String userId) => _ref.read(storiesApiProvider).fetchUserStories(userId);

  /// Marks the story viewed locally first (so the UI updates immediately)
  /// then fires the API call; failures are swallowed like the web app does
  /// (`viewStory(story.id).catch(() => {})`) since a missed view isn't
  /// worth surfacing an error over.
  Future<void> viewStory(String storyId) async {
    _ref.read(storiesProvider.notifier).markViewed(storyId);
    try {
      await _ref.read(storiesApiProvider).viewStory(storyId);
    } catch (_) {
      // best-effort, matches web behavior
    }
  }

  Future<List<StoryViewerEntry>> fetchViewers(String storyId) => _ref.read(storiesApiProvider).fetchStoryViewers(storyId);

  Future<Story> createStory({required String mediaUrl, String mediaType = 'image', String? caption}) async {
    final story = await _ref.read(storiesApiProvider).createStory(mediaUrl: mediaUrl, mediaType: mediaType, caption: caption);
    _ref.read(storiesProvider.notifier).addOwnStory(story);
    return story;
  }

  Future<void> deleteStory(String storyId) async {
    await _ref.read(storiesApiProvider).deleteStory(storyId);
    _ref.read(storiesProvider.notifier).removeStory(storyId);
  }
}

final storiesActionsProvider = Provider<StoriesActions>((ref) => StoriesActions(ref));
