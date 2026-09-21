import 'package:chewie/chewie.dart';
import 'package:flutter/material.dart';
import 'package:video_player/video_player.dart';

import '../../../config/theme.dart';

/// Standard-controls video playback for a post card / story composer
/// preview — the story viewer uses its own bare VideoPlayerController
/// instead, since it needs custom tap zones and a progress bar rather than
/// Chewie's native overlay.
class PostVideoPlayer extends StatefulWidget {
  final String url;

  const PostVideoPlayer({super.key, required this.url});

  @override
  State<PostVideoPlayer> createState() => _PostVideoPlayerState();
}

class _PostVideoPlayerState extends State<PostVideoPlayer> {
  late final VideoPlayerController _videoController;
  ChewieController? _chewieController;

  @override
  void initState() {
    super.initState();
    _videoController = VideoPlayerController.networkUrl(Uri.parse(widget.url));
    _videoController.initialize().then((_) {
      if (!mounted) return;
      setState(() {
        _chewieController = ChewieController(
          videoPlayerController: _videoController,
          aspectRatio: _videoController.value.aspectRatio,
          autoInitialize: true,
          looping: false,
          materialProgressColors: ChewieProgressColors(playedColor: AppColors.accent, handleColor: AppColors.accent),
        );
      });
    });
  }

  @override
  void dispose() {
    _chewieController?.dispose();
    _videoController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final chewie = _chewieController;
    if (chewie == null) {
      return const AspectRatio(
        aspectRatio: 16 / 9,
        child: ColoredBox(color: Colors.black12, child: Center(child: CircularProgressIndicator(color: AppColors.accent))),
      );
    }
    return AspectRatio(aspectRatio: _videoController.value.aspectRatio, child: Chewie(controller: chewie));
  }
}
