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
import '../providers/feed_actions.dart';
import '../widgets/post_video_player.dart';

String _errorMessage(Object err) {
  if (err is DioException) {
    final data = err.response?.data;
    if (data is Map && data['message'] is String) return data['message'] as String;
  }
  return 'Something went wrong. Please try again.';
}

const _visibilityOptions = {'public': 'Public', 'friends': 'Friends', 'only_me': 'Only me'};

/// Ports `src/components/social/PostComposer.jsx` as its own screen.
/// Deviation: the backend's Post model only stores a single `imageUrl` +
/// `mediaType` (see server/src/models/Post.js), so this attaches one
/// image/video rather than the multi-image gallery the task brief
/// mentioned — matches web behavior, which is also single-attachment.
class CreatePostScreen extends ConsumerStatefulWidget {
  const CreatePostScreen({super.key});

  @override
  ConsumerState<CreatePostScreen> createState() => _CreatePostScreenState();
}

class _CreatePostScreenState extends ConsumerState<CreatePostScreen> {
  final _textController = TextEditingController();
  String _visibility = 'public';
  String? _mediaUrl;
  String? _mediaType;
  bool _uploading = false;
  bool _posting = false;

  bool get _canSubmit => !_posting && (_textController.text.trim().isNotEmpty || _mediaUrl != null);

  @override
  void dispose() {
    _textController.dispose();
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

  Future<void> _submit() async {
    if (!_canSubmit) return;
    setState(() => _posting = true);
    try {
      await ref.read(feedActionsProvider).createPost(
            content: _textController.text.trim().isEmpty ? null : _textController.text.trim(),
            imageUrl: _mediaUrl,
            mediaType: _mediaType,
            visibility: _visibility,
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
        appBar: AppBar(
          title: const Text('Create post'),
          actions: [
            Padding(
              padding: const EdgeInsets.symmetric(horizontal: 8),
              child: Center(
                child: TextButton(
                  onPressed: _canSubmit ? _submit : null,
                  child: _posting
                      ? const SizedBox(width: 16, height: 16, child: CircularProgressIndicator(strokeWidth: 2))
                      : const Text('Post'),
                ),
              ),
            ),
          ],
        ),
        body: SingleChildScrollView(
          padding: const EdgeInsets.all(16),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              TextField(
                controller: _textController,
                onChanged: (_) => setState(() {}),
                minLines: 4,
                maxLines: 10,
                textCapitalization: TextCapitalization.sentences,
                decoration: const InputDecoration(hintText: "What's on your mind?"),
              ),
              const SizedBox(height: 12),
              if (_mediaUrl != null)
                Stack(
                  children: [
                    ClipRRect(
                      borderRadius: BorderRadius.circular(AppRadius.md),
                      child: _mediaType == 'video'
                          ? PostVideoPlayer(url: Env.resolveMediaUrl(_mediaUrl!))
                          : Image.network(Env.resolveMediaUrl(_mediaUrl!), height: 220, width: double.infinity, fit: BoxFit.cover),
                    ),
                    Positioned(
                      top: 6,
                      right: 6,
                      child: GestureDetector(
                        onTap: () => setState(() {
                          _mediaUrl = null;
                          _mediaType = null;
                        }),
                        child: const CircleAvatar(
                          radius: 14,
                          backgroundColor: Colors.black54,
                          child: Icon(Icons.close, size: 16, color: Colors.white),
                        ),
                      ),
                    ),
                  ],
                ),
              const SizedBox(height: 12),
              Row(
                children: [
                  OutlinedButton.icon(
                    onPressed: _uploading ? null : () => _pickMedia(false),
                    icon: const Icon(Icons.photo_outlined, size: 18),
                    label: const Text('Photo'),
                  ),
                  const SizedBox(width: 8),
                  OutlinedButton.icon(
                    onPressed: _uploading ? null : () => _pickMedia(true),
                    icon: const Icon(Icons.videocam_outlined, size: 18),
                    label: const Text('Video'),
                  ),
                  if (_uploading) ...[
                    const SizedBox(width: 12),
                    const SizedBox(width: 16, height: 16, child: CircularProgressIndicator(strokeWidth: 2)),
                  ],
                ],
              ),
              const SizedBox(height: 16),
              Row(
                children: [
                  const Text('Visibility', style: TextStyle(fontSize: 13, color: AppColors.inkSoft)),
                  const SizedBox(width: 12),
                  DropdownButton<String>(
                    value: _visibility,
                    items: _visibilityOptions.entries
                        .map((e) => DropdownMenuItem(value: e.key, child: Text(e.value)))
                        .toList(),
                    onChanged: (v) => setState(() => _visibility = v ?? _visibility),
                  ),
                ],
              ),
              const SizedBox(height: 24),
              AppButton(label: 'Post', onPressed: _canSubmit ? _submit : null, loading: _posting),
            ],
          ),
        ),
      ),
    );
  }
}
