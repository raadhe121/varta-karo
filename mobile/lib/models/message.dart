class MessageStatusEntry {
  final String userId;
  final String status; // 'delivered' | 'read'

  const MessageStatusEntry({required this.userId, required this.status});

  factory MessageStatusEntry.fromJson(Map<String, dynamic> json) =>
      MessageStatusEntry(userId: json['userId'] as String, status: json['status'] as String);
}

class ChatMessage {
  final String id;
  final String conversationId;
  final String senderId;
  final String? senderName;
  final String type; // 'text' | 'image' | 'file'
  final String? content;
  final String? mediaUrl;
  final Map<String, dynamic>? mediaMeta;
  final String? replyToId;
  final List<MessageStatusEntry> statuses;
  final DateTime createdAt;

  const ChatMessage({
    required this.id,
    required this.conversationId,
    required this.senderId,
    this.senderName,
    this.type = 'text',
    this.content,
    this.mediaUrl,
    this.mediaMeta,
    this.replyToId,
    this.statuses = const [],
    required this.createdAt,
  });

  /// Mirrors MessageBubble.js's statusSummary(): 'sent' when there are no
  /// per-recipient rows yet, 'read' only when every recipient has read it,
  /// otherwise 'delivered' (the default for any non-fully-read state).
  String statusSummary() {
    if (statuses.isEmpty) return 'sent';
    if (statuses.every((s) => s.status == 'read')) return 'read';
    return 'delivered';
  }

  factory ChatMessage.fromJson(Map<String, dynamic> json) => ChatMessage(
        id: json['id'] as String,
        conversationId: json['conversationId'] as String,
        senderId: json['senderId'] as String,
        senderName: json['senderName'] as String?,
        type: json['type'] as String? ?? 'text',
        content: json['content'] as String?,
        mediaUrl: json['mediaUrl'] as String?,
        mediaMeta: json['mediaMeta'] as Map<String, dynamic>?,
        replyToId: json['replyToId'] as String?,
        statuses: (json['statuses'] as List<dynamic>? ?? [])
            .map((e) => MessageStatusEntry.fromJson(e as Map<String, dynamic>))
            .toList(),
        createdAt: DateTime.parse(json['createdAt'] as String),
      );

  ChatMessage withStatus(String userId, String status) {
    final next = statuses.where((s) => s.userId != userId).toList()
      ..add(MessageStatusEntry(userId: userId, status: status));
    return ChatMessage(
      id: id,
      conversationId: conversationId,
      senderId: senderId,
      senderName: senderName,
      type: type,
      content: content,
      mediaUrl: mediaUrl,
      mediaMeta: mediaMeta,
      replyToId: replyToId,
      statuses: next,
      createdAt: createdAt,
    );
  }
}
