import 'package:cached_network_image/cached_network_image.dart';
import 'package:flutter/material.dart';
import 'package:intl/intl.dart';

import '../../../config/env.dart';
import '../../../config/theme.dart';
import '../../../models/message.dart';

/// Ports `src/components/chat/MessageBubble.jsx`: own vs. other styling,
/// image/file attachments, a reply-to preview strip, and read/delivered
/// ticks on the sender's own messages.
class MessageBubble extends StatelessWidget {
  final ChatMessage message;
  final bool isMine;
  final bool showSender;
  final ChatMessage? replyTo;
  final VoidCallback? onReply;

  const MessageBubble({
    super.key,
    required this.message,
    required this.isMine,
    this.showSender = false,
    this.replyTo,
    this.onReply,
  });

  @override
  Widget build(BuildContext context) {
    final status = message.statusSummary();
    final bubbleColor = isMine ? AppColors.accent : AppColors.paperSoft;
    final textColor = isMine ? AppColors.white : AppColors.ink;

    return Align(
      alignment: isMine ? Alignment.centerRight : Alignment.centerLeft,
      child: GestureDetector(
        onLongPress: onReply,
        child: ConstrainedBox(
          constraints: BoxConstraints(maxWidth: MediaQuery.of(context).size.width * 0.72),
          child: Container(
            margin: const EdgeInsets.symmetric(vertical: 2),
            padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
            decoration: BoxDecoration(
              color: bubbleColor,
              borderRadius: BorderRadius.only(
                topLeft: const Radius.circular(AppRadius.md),
                topRight: const Radius.circular(AppRadius.md),
                bottomLeft: Radius.circular(isMine ? AppRadius.md : 4),
                bottomRight: Radius.circular(isMine ? 4 : AppRadius.md),
              ),
            ),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              mainAxisSize: MainAxisSize.min,
              children: [
                if (showSender && !isMine && message.senderName != null)
                  Padding(
                    padding: const EdgeInsets.only(bottom: 2),
                    child: Text(
                      message.senderName!,
                      style: const TextStyle(color: AppColors.accent, fontWeight: FontWeight.w700, fontSize: 12),
                    ),
                  ),
                if (replyTo != null) _ReplyStrip(message: replyTo!, tint: textColor),
                if (message.type == 'image' && message.mediaUrl != null)
                  ClipRRect(
                    borderRadius: BorderRadius.circular(AppRadius.sm),
                    child: CachedNetworkImage(
                      imageUrl: Env.resolveMediaUrl(message.mediaUrl),
                      fit: BoxFit.cover,
                      height: 180,
                      placeholder: (context, url) =>
                          const SizedBox(height: 180, child: Center(child: CircularProgressIndicator())),
                      errorWidget: (context, url, error) =>
                          const SizedBox(height: 60, child: Icon(Icons.broken_image_outlined)),
                    ),
                  )
                else if (message.type == 'file' && message.mediaUrl != null)
                  Text(
                    '📎 ${message.mediaMeta?['originalName'] ?? 'Attachment'}',
                    style: TextStyle(color: textColor, decoration: TextDecoration.underline),
                  ),
                if (message.content != null && message.content!.isNotEmpty)
                  Padding(
                    padding: const EdgeInsets.only(top: 4),
                    child: Text(message.content!, style: TextStyle(color: textColor, fontSize: 14.5)),
                  ),
                const SizedBox(height: 4),
                Row(
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    Text(
                      DateFormat('h:mm a').format(message.createdAt.toLocal()),
                      style: TextStyle(fontSize: 10, color: textColor.withValues(alpha: 0.7)),
                    ),
                    if (isMine) ...[
                      const SizedBox(width: 4),
                      _Ticks(status: status, color: status == 'read' ? Colors.lightBlueAccent : textColor.withValues(alpha: 0.7)),
                    ],
                  ],
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }
}

class _Ticks extends StatelessWidget {
  final String status;
  final Color color;

  const _Ticks({required this.status, required this.color});

  @override
  Widget build(BuildContext context) {
    final label = status == 'sent' ? '✓' : '✓✓';
    return Text(label, style: TextStyle(fontSize: 10, color: color));
  }
}

class _ReplyStrip extends StatelessWidget {
  final ChatMessage message;
  final Color tint;

  const _ReplyStrip({required this.message, required this.tint});

  @override
  Widget build(BuildContext context) {
    final preview = message.type == 'text' ? (message.content ?? '') : '📎 Attachment';
    return Container(
      margin: const EdgeInsets.only(bottom: 4),
      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
      decoration: BoxDecoration(
        color: tint.withValues(alpha: 0.12),
        borderRadius: BorderRadius.circular(AppRadius.sm),
        border: Border(left: BorderSide(color: tint.withValues(alpha: 0.6), width: 2)),
      ),
      child: Text(
        preview,
        maxLines: 1,
        overflow: TextOverflow.ellipsis,
        style: TextStyle(fontSize: 12, color: tint.withValues(alpha: 0.85)),
      ),
    );
  }
}
