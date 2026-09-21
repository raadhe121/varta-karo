import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../models/story.dart';

class StoriesState {
  final List<StoryGroup> groups;
  final bool loaded;

  const StoriesState({this.groups = const [], this.loaded = false});

  StoriesState copyWith({List<StoryGroup>? groups, bool? loaded}) =>
      StoriesState(groups: groups ?? this.groups, loaded: loaded ?? this.loaded);
}

/// Pure stories state — groups fed by StoriesActions, same
/// state-notifier/actions split as feedProvider/FeedActions.
class StoriesNotifier extends Notifier<StoriesState> {
  @override
  StoriesState build() => const StoriesState();

  void setGroups(List<StoryGroup> groups) {
    state = state.copyWith(groups: groups, loaded: true);
  }

  /// Marks a single story viewed locally (called right after the API call
  /// succeeds, or optimistically as the viewer screen displays it) so the
  /// stories row's seen/unseen ring updates without a full refetch.
  void markViewed(String storyId) {
    state = state.copyWith(
      groups: state.groups
          .map((g) => StoryGroup(
                author: g.author,
                stories: g.stories.map((s) => s.id == storyId ? _withViewed(s) : s).toList(),
              ))
          .toList(),
    );
  }

  /// Prepends a freshly-created story to the author's group (creating the
  /// group if this was their first active story).
  void addOwnStory(Story story) {
    final existingIndex = state.groups.indexWhere((g) => g.author.id == story.authorId);
    if (existingIndex == -1) {
      final author = story.author;
      if (author == null) return;
      state = state.copyWith(groups: [StoryGroup(author: author, stories: [story]), ...state.groups]);
      return;
    }
    final groups = [...state.groups];
    final group = groups[existingIndex];
    groups[existingIndex] = StoryGroup(author: group.author, stories: [...group.stories, story]);
    state = state.copyWith(groups: groups);
  }

  /// Removes a single story, dropping its group entirely once it has no
  /// stories left — matches `addOwnStory`'s inverse.
  void removeStory(String storyId) {
    final groups = state.groups
        .map((g) => StoryGroup(author: g.author, stories: g.stories.where((s) => s.id != storyId).toList()))
        .where((g) => g.stories.isNotEmpty)
        .toList();
    state = state.copyWith(groups: groups);
  }

  Story _withViewed(Story s) => Story(
        id: s.id,
        authorId: s.authorId,
        mediaUrl: s.mediaUrl,
        mediaType: s.mediaType,
        caption: s.caption,
        createdAt: s.createdAt,
        expiresAt: s.expiresAt,
        viewedByMe: true,
        author: s.author,
      );
}

final storiesProvider = NotifierProvider<StoriesNotifier, StoriesState>(StoriesNotifier.new);
