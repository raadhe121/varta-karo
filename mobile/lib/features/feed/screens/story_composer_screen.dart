import 'package:dio/dio.dart';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:image_picker/image_picker.dart';

import '../../../common/widgets/app_button.dart';
import '../../../common/widgets/screen.dart';
import '../../../config/env.dart';
import '../../../config/theme.dart';
import '../../../core/media_api.dart';
import '../providers/stories_actions.dart';
import '../widgets/post_video_player.dart';

String _errorMessage(Object err) {
  if (err is DioException) {
    final data = err.response?.data;
    if (data is Map && data['message'] is String) return data['message'] as String;
  }
  return 'Something went wrong. Please try again.';
}

/// Ports `src/components/social/StoryComposerModal.jsx` as its own screen —
/// this also owns the file-pick step that StoriesRow.jsx does upstream of
/// the modal, since there's no equivalent of a hidden `<input type=file>`
/// to trigger from the feed screen.
class StoryComposerScreen extends ConsumerStatefulWidget {
  const StoryComposerScreen({super.key});

  @override
  ConsumerState<StoryComposerScreen> createState() => _StoryComposerScreenState();
}

class _StoryComposerScreenState extends ConsumerState<StoryComposerScreen> {
  final _captionController = TextEditingController();
  String? _mediaUrl;
  String? _mediaType;
  bool _uploading = false;
  bool _posting = false;

  @override
  void dispose() {
    _captionController.dispose();
    super.dispose();
  }

  Future<void> _pickMedia(bool video) async {
    final picker = ImagePicker();
    final picked = video
        ? await picker.pickVideo(source: ImageSource.gallery)
        : await picker.pickImage(source: ImageSource.gallery, imageQuality: 85);
    if (picked == null) return;

    setState(() => _uploading = true);
    try {
      final uploaded = await ref.read(mediaApiProvider).upload(path: picked.path, filename: picked.name, mimeType: picked.mimeType);
      setState(() {
        _mediaUrl = uploaded['url'] as String?;
        _mediaType = video ? 'video' : 'image';
      });
    } catch (err) {
      if (mounted) ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text(_errorMessage(err))));
    } finally {
      if (mounted) setState(() => _uploading = false);
    }
  }

  Future<void> _share() async {
    if (_mediaUrl == null || _posting) return;
    setState(() => _posting = true);
    try {
      await ref.read(storiesActionsProvider).createStory(
            mediaUrl: _mediaUrl!,
            mediaType: _mediaType ?? 'image',
            caption: _captionController.text.trim().isEmpty ? null : _captionController.text.trim(),
          );
      if (mounted) context.pop();
    } catch (err) {
      if (mounted) ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text(_errorMessage(err))));
    } finally {
      if (mounted) setState(() => _posting = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    return Screen(
      child: Scaffold(
        backgroundColor: Colors.transparent,
        appBar: AppBar(title: const Text('Add to your story')),
        body: Padding(
          padding: const EdgeInsets.all(16),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [
              if (_mediaUrl == null)
                Expanded(
                  child: Center(
                    child: _uploading
                        ? const CircularProgressIndicator(color: AppColors.accent)
                        : Column(
                            mainAxisSize: MainAxisSize.min,
                            children: [
                              const Text('Share a photo or video to your story', style: TextStyle(color: AppColors.inkSoft)),
                              const SizedBox(height: 16),
                              Row(
                                mainAxisAlignment: MainAxisAlignment.center,
                                children: [
                                  OutlinedButton.icon(
                                    onPressed: () => _pickMedia(false),
                                    icon: const Icon(Icons.photo_outlined, size: 18),
                                    label: const Text('Photo'),
                                  ),
                                  const SizedBox(width: 12),
                                  OutlinedButton.icon(
                                    onPressed: () => _pickMedia(true),
                                    icon: const Icon(Icons.videocam_outlined, size: 18),
                                    label: const Text('Video'),
                                  ),
                                ],
                              ),
                            ],
                          ),
                  ),
                )
              else ...[
                Expanded(
                  child: ClipRRect(
                    borderRadius: BorderRadius.circular(AppRadius.md),
                    child: _mediaType == 'video'
                        ? PostVideoPlayer(url: Env.resolveMediaUrl(_mediaUrl!))
                        : Image.network(Env.resolveMediaUrl(_mediaUrl!), fit: BoxFit.contain, width: double.infinity),
                  ),
                ),
                const SizedBox(height: 12),
                TextField(
                  controller: _captionController,
                  decoration: const InputDecoration(hintText: 'Add a caption (optional)'),
                ),
                const SizedBox(height: 12),
                Row(
                  children: [
                    Expanded(
                      child: OutlinedButton(
                        onPressed: _posting ? null : () => setState(() {
                          _mediaUrl = null;
                          _mediaType = null;
                        }),
                        child: const Text('Change'),
                      ),
                    ),
                    const SizedBox(width: 12),
                    Expanded(
                      flex: 2,
                      child: AppButton(label: 'Share to Story', onPressed: _posting ? null : _share, loading: _posting),
                    ),
                  ],
                ),
              ],
            ],
          ),
        ),
      ),
    );
  }
}
