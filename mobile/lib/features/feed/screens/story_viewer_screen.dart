import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:video_player/video_player.dart';

import '../../../common/widgets/avatar.dart';
import '../../../config/env.dart';
import '../../../core/auth_session.dart';
import '../../../models/story.dart';
import '../providers/stories_actions.dart';
import '../providers/stories_provider.dart';

const _imageDuration = Duration(seconds: 5);

String _timeAgo(DateTime date) {
  final diffMin = DateTime.now().difference(date).inMinutes;
  if (diffMin < 1) return 'just now';
  if (diffMin < 60) return '${diffMin}m';
  return '${diffMin ~/ 60}h';
}

/// Ports `src/components/social/StoryViewer.jsx` as a fullscreen route:
/// per-story progress bars, auto-advance (image: fixed timer; video: driven
/// by playback position), tap left/right thirds for prev/next, and a
/// long-press to pause — the last one has no web equivalent (no hover
/// analog on touch) but is standard native story-viewer behavior.
class StoryViewerScreen extends ConsumerStatefulWidget {
  final String userId;

  const StoryViewerScreen({super.key, required this.userId});

  @override
  ConsumerState<StoryViewerScreen> createState() => _StoryViewerScreenState();
}

class _StoryViewerScreenState extends ConsumerState<StoryViewerScreen> with SingleTickerProviderStateMixin {
  AnimationController? _controller;
  VideoPlayerController? _videoController;
  int? _groupIndex;
  int _storyIndex = 0;
  bool _ready = false;
  bool _showViewers = false;
  List<StoryViewerEntry>? _viewers;
  String? _lastViewedStoryId;

  @override
  void initState() {
    super.initState();
    _bootstrap();
  }

  Future<void> _bootstrap() async {
    if (ref.read(storiesProvider).groups.isEmpty) {
      await ref.read(storiesActionsProvider).loadFeed();
    }
    if (!mounted) return;
    final groups = ref.read(storiesProvider).groups;
    final idx = groups.indexWhere((g) => g.author.id == widget.userId);
    setState(() {
      _groupIndex = idx >= 0 ? idx : (groups.isEmpty ? null : 0);
      _ready = true;
    });
    if (_groupIndex != null) _startStory();
  }

  List<StoryGroup> get _groups => ref.read(storiesProvider).groups;

  void _startStory() {
    _controller?.dispose();
    _controller = null;
    _videoController?.removeListener(_onVideoTick);
    _videoController?.dispose();
    _videoController = null;
    _showViewers = false;
    _viewers = null;

    final groups = _groups;
    final groupIndex = _groupIndex;
    if (groupIndex == null || groupIndex >= groups.length) return;
    final story = groups[groupIndex].stories[_storyIndex];

    _maybeMarkViewed(story);

    if (story.isVideo) {
      final controller = VideoPlayerController.networkUrl(Uri.parse(Env.resolveMediaUrl(story.mediaUrl)));
      _videoController = controller;
      controller.initialize().then((_) {
        if (!mounted || _videoController != controller) return;
        controller.play();
        setState(() {});
      });
      controller.addListener(_onVideoTick);
    } else {
      final controller = AnimationController(vsync: this, duration: _imageDuration);
      _controller = controller;
      controller.addStatusListener((status) {
        if (status == AnimationStatus.completed) _goNext();
      });
      controller.forward();
    }
  }

  void _onVideoTick() {
    final controller = _videoController;
    if (controller == null || !controller.value.isInitialized) return;
    final duration = controller.value.duration;
    if (duration.inMilliseconds <= 0) return;
    if (controller.value.position >= duration) {
      _goNext();
      return;
    }
    setState(() {});
  }

  void _maybeMarkViewed(Story story) {
    if (_lastViewedStoryId == story.id) return;
    _lastViewedStoryId = story.id;
    final myId = ref.read(authSessionProvider).userId;
    if (story.authorId == myId || story.viewedByMe) return;
    ref.read(storiesActionsProvider).viewStory(story.id);
  }

  double get _currentProgress {
    if (_videoController != null && _videoController!.value.isInitialized) {
      final duration = _videoController!.value.duration.inMilliseconds;
      if (duration <= 0) return 0;
      return (_videoController!.value.position.inMilliseconds / duration).clamp(0.0, 1.0);
    }
    return _controller?.value ?? 0.0;
  }

  void _goNext() {
    final groups = _groups;
    final groupIndex = _groupIndex;
    if (groupIndex == null) return;
    final group = groups[groupIndex];
    if (_storyIndex < group.stories.length - 1) {
      setState(() => _storyIndex++);
    } else if (groupIndex < groups.length - 1) {
      setState(() {
        _groupIndex = groupIndex + 1;
        _storyIndex = 0;
      });
    } else {
      Navigator.of(context).pop();
      return;
    }
    _startStory();
  }

  void _goPrev() {
    final groups = _groups;
    final groupIndex = _groupIndex;
    if (groupIndex == null) return;
    if (_storyIndex > 0) {
      setState(() => _storyIndex--);
    } else if (groupIndex > 0) {
      final prevGroup = groups[groupIndex - 1];
      setState(() {
        _groupIndex = groupIndex - 1;
        _storyIndex = prevGroup.stories.length - 1;
      });
    } else {
      Navigator.of(context).pop();
      return;
    }
    _startStory();
  }

  void _pause() {
    _controller?.stop();
    _videoController?.pause();
  }

  void _resume() {
    _controller?.forward();
    _videoController?.play();
  }

  Future<void> _confirmDelete(Story story) async {
    _pause();
    final confirmed = await showDialog<bool>(
      context: context,
      builder: (context) => AlertDialog(
        title: const Text('Delete story?'),
        content: const Text('This can\'t be undone.'),
        actions: [
          TextButton(onPressed: () => Navigator.of(context).pop(false), child: const Text('Cancel')),
          TextButton(onPressed: () => Navigator.of(context).pop(true), child: const Text('Delete')),
        ],
      ),
    );
    if (!mounted) return;
    if (confirmed != true) {
      _resume();
      return;
    }
    await ref.read(storiesActionsProvider).deleteStory(story.id);
    if (mounted) _afterDeletion();
  }

  /// After a story is removed from state, re-derives a valid position
  /// (the deleted story's group may have shrunk or disappeared entirely)
  /// and either resumes playback there or closes the viewer.
  void _afterDeletion() {
    final groups = _groups;
    if (groups.isEmpty) {
      Navigator.of(context).pop();
      return;
    }
    var groupIndex = (_groupIndex ?? 0).clamp(0, groups.length - 1);
    final storyCount = groups[groupIndex].stories.length;
    if (storyCount == 0) {
      Navigator.of(context).pop();
      return;
    }
    setState(() {
      _groupIndex = groupIndex;
      _storyIndex = _storyIndex.clamp(0, storyCount - 1);
    });
    _startStory();
  }

  Future<void> _openViewers(String storyId) async {
    setState(() => _showViewers = !_showViewers);
    if (_showViewers && _viewers == null) {
      final viewers = await ref.read(storiesActionsProvider).fetchViewers(storyId);
      if (mounted) setState(() => _viewers = viewers);
    }
  }

  @override
  void dispose() {
    _controller?.dispose();
    _videoController?.removeListener(_onVideoTick);
    _videoController?.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final groups = ref.watch(storiesProvider.select((s) => s.groups));
    final myId = ref.watch(authSessionProvider).userId;

    if (!_ready) {
      return const Scaffold(backgroundColor: Colors.black, body: Center(child: CircularProgressIndicator(color: Colors.white)));
    }
    final groupIndex = _groupIndex;
    if (groupIndex == null || groupIndex >= groups.length) {
      return const Scaffold(backgroundColor: Colors.black, body: Center(child: Text('No stories', style: TextStyle(color: Colors.white))));
    }

    final group = groups[groupIndex];
    final story = group.stories[_storyIndex];
    final isMine = story.authorId == myId;

    return Scaffold(
      backgroundColor: Colors.black,
      body: Stack(
        children: [
          Positioned.fill(
            child: story.isVideo
                ? (_videoController != null && _videoController!.value.isInitialized
                    ? FittedBox(
                        fit: BoxFit.contain,
                        child: SizedBox(
                          width: _videoController!.value.size.width,
                          height: _videoController!.value.size.height,
                          child: VideoPlayer(_videoController!),
                        ),
                      )
                    : const Center(child: CircularProgressIndicator(color: Colors.white)))
                : Image.network(Env.resolveMediaUrl(story.mediaUrl), fit: BoxFit.contain),
          ),
          Positioned(
            left: 0,
            right: 0,
            top: 0,
            bottom: 0,
            child: GestureDetector(
              behavior: HitTestBehavior.translucent,
              onTapUp: (details) {
                final width = MediaQuery.of(context).size.width;
                if (details.localPosition.dx < width / 2) {
                  _goPrev();
                } else {
                  _goNext();
                }
              },
              onLongPressStart: (_) => _pause(),
              onLongPressEnd: (_) => _resume(),
            ),
          ),
          Positioned(
            top: 8,
            left: 8,
            right: 8,
            child: Row(
              children: [
                for (var i = 0; i < group.stories.length; i++)
                  Expanded(
                    child: Container(
                      height: 2.5,
                      margin: const EdgeInsets.symmetric(horizontal: 2),
                      decoration: BoxDecoration(color: Colors.white30, borderRadius: BorderRadius.circular(2)),
                      child: FractionallySizedBox(
                        alignment: Alignment.centerLeft,
                        widthFactor: i < _storyIndex ? 1 : (i == _storyIndex ? _currentProgress : 0),
                        child: Container(decoration: BoxDecoration(color: Colors.white, borderRadius: BorderRadius.circular(2))),
                      ),
                    ),
                  ),
              ],
            ),
          ),
          Positioned(
            top: 20,
            left: 12,
            right: 12,
            child: Row(
              children: [
                Avatar(user: group.author, size: AvatarSize.sm),
                const SizedBox(width: 8),
                Text(group.author.name, style: const TextStyle(color: Colors.white, fontSize: 14, fontWeight: FontWeight.w600)),
                const SizedBox(width: 8),
                Text(_timeAgo(story.createdAt), style: const TextStyle(color: Colors.white70, fontSize: 12)),
                const Spacer(),
                if (isMine)
                  IconButton(
                    icon: const Icon(Icons.delete_outline, color: Colors.white),
                    onPressed: () => _confirmDelete(story),
                  ),
                IconButton(
                  icon: const Icon(Icons.close, color: Colors.white),
                  onPressed: () => Navigator.of(context).pop(),
                ),
              ],
            ),
          ),
          if (story.caption != null && story.caption!.isNotEmpty)
            Positioned(
              bottom: 24,
              left: 12,
              right: 12,
              child: Container(
                padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
                decoration: BoxDecoration(color: Colors.black38, borderRadius: BorderRadius.circular(10)),
                child: Text(story.caption!, style: const TextStyle(color: Colors.white, fontSize: 14)),
              ),
            ),
          if (isMine)
            Positioned(
              bottom: 12,
              left: 12,
              child: TextButton.icon(
                onPressed: () => _openViewers(story.id),
                icon: const Icon(Icons.visibility_outlined, size: 16, color: Colors.white),
                label: Text(
                  _viewers != null ? 'Viewers (${_viewers!.length})' : 'Viewers',
                  style: const TextStyle(color: Colors.white, fontSize: 12),
                ),
              ),
            ),
          if (_showViewers)
            Positioned(
              left: 0,
              right: 0,
              bottom: 0,
              child: Container(
                constraints: const BoxConstraints(maxHeight: 260),
                decoration: const BoxDecoration(
                  color: Colors.black87,
                  borderRadius: BorderRadius.vertical(top: Radius.circular(16)),
                ),
                padding: const EdgeInsets.all(16),
                child: _viewers == null
                    ? const Center(child: CircularProgressIndicator(color: Colors.white))
                    : _viewers!.isEmpty
                        ? const Center(child: Text('No views yet.', style: TextStyle(color: Colors.white60)))
                        : ListView.builder(
                            shrinkWrap: true,
                            itemCount: _viewers!.length,
                            itemBuilder: (context, i) {
                              final viewer = _viewers![i];
                              return Padding(
                                padding: const EdgeInsets.symmetric(vertical: 6),
                                child: Row(
                                  children: [
                                    Avatar(user: viewer.user, size: AvatarSize.sm),
                                    const SizedBox(width: 8),
                                    Text(viewer.user.name, style: const TextStyle(color: Colors.white)),
                                  ],
                                ),
                              );
                            },
                          ),
              ),
            ),
        ],
      ),
    );
  }
}
