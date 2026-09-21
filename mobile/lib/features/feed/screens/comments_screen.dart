import 'package:dio/dio.dart';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../common/widgets/avatar.dart';
import '../../../common/widgets/screen.dart';
import '../../../config/theme.dart';
import '../../../models/post.dart';
import '../providers/feed_actions.dart';

String _errorMessage(Object err) {
  if (err is DioException) {
    final data = err.response?.data;
    if (data is Map && data['message'] is String) return data['message'] as String;
  }
  return 'Something went wrong. Please try again.';
}

/// Ports the comments panel inline in `src/components/social/PostCard.jsx`
/// as its own screen.
class CommentsScreen extends ConsumerStatefulWidget {
  final String postId;

  const CommentsScreen({super.key, required this.postId});

  @override
  ConsumerState<CommentsScreen> createState() => _CommentsScreenState();
}

class _CommentsScreenState extends ConsumerState<CommentsScreen> {
  final _textController = TextEditingController();
  List<PostComment>? _comments;
  bool _sending = false;

  @override
  void initState() {
    super.initState();
    _load();
  }

  Future<void> _load() async {
    final comments = await ref.read(feedActionsProvider).loadComments(widget.postId);
    if (mounted) setState(() => _comments = comments);
  }

  Future<void> _submit() async {
    final text = _textController.text.trim();
    if (text.isEmpty || _sending) return;
    setState(() => _sending = true);
    try {
      final comment = await ref.read(feedActionsProvider).addComment(widget.postId, text);
      if (mounted) {
        setState(() {
          _comments = [...(_comments ?? []), comment];
          _textController.clear();
        });
      }
    } catch (err) {
      if (mounted) ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text(_errorMessage(err))));
    } finally {
      if (mounted) setState(() => _sending = false);
    }
  }

  @override
  void dispose() {
    _textController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final comments = _comments;
    return Screen(
      child: Scaffold(
        backgroundColor: Colors.transparent,
        appBar: AppBar(title: const Text('Comments')),
        body: Column(
          children: [
            Expanded(
              child: comments == null
                  ? const Center(child: CircularProgressIndicator(color: AppColors.accent))
                  : comments.isEmpty
                      ? const Center(child: Text('No comments yet.', style: TextStyle(color: AppColors.inkSoft)))
                      : ListView.builder(
                          padding: const EdgeInsets.all(12),
                          itemCount: comments.length,
                          itemBuilder: (context, index) {
                            final comment = comments[index];
                            return Padding(
                              padding: const EdgeInsets.only(bottom: 12),
                              child: Row(
                                crossAxisAlignment: CrossAxisAlignment.start,
                                children: [
                                  Avatar(user: comment.author, size: AvatarSize.sm),
                                  const SizedBox(width: 8),
                                  Expanded(
                                    child: Container(
                                      padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
                                      decoration: BoxDecoration(
                                        color: AppColors.paperSoft,
                                        borderRadius: BorderRadius.circular(AppRadius.md),
                                      ),
                                      child: RichText(
                                        text: TextSpan(
                                          style: const TextStyle(fontSize: 14, color: AppColors.ink),
                                          children: [
                                            TextSpan(text: '${comment.author.name}  ', style: const TextStyle(fontWeight: FontWeight.w700)),
                                            TextSpan(text: comment.content),
                                          ],
                                        ),
                                      ),
                                    ),
                                  ),
                                ],
                              ),
                            );
                          },
                        ),
            ),
            SafeArea(
              top: false,
              child: Container(
                padding: const EdgeInsets.all(8),
                decoration: const BoxDecoration(color: AppColors.paper, border: Border(top: BorderSide(color: AppColors.line))),
                child: Row(
                  children: [
                    Expanded(
                      child: TextField(
                        controller: _textController,
                        minLines: 1,
                        maxLines: 4,
                        textCapitalization: TextCapitalization.sentences,
                        decoration: const InputDecoration(hintText: 'Write a comment...'),
                      ),
                    ),
                    const SizedBox(width: 4),
                    IconButton(
                      onPressed: _sending ? null : _submit,
                      icon: _sending
                          ? const SizedBox(width: 18, height: 18, child: CircularProgressIndicator(strokeWidth: 2))
                          : const Icon(Icons.send, color: AppColors.accent),
                    ),
                  ],
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }
}
