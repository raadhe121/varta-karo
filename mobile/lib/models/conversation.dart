import 'user.dart';

class LastMessage {
  final String id;
  final String? content;
  final String type;
  final String senderId;
  final String? senderName;
  final DateTime createdAt;

  const LastMessage({
    required this.id,
    this.content,
    required this.type,
    required this.senderId,
    this.senderName,
    required this.createdAt,
  });

  factory LastMessage.fromJson(Map<String, dynamic> json) => LastMessage(
        id: json['id'] as String,
        content: json['content'] as String?,
        type: json['type'] as String? ?? 'text',
        senderId: json['senderId'] as String,
        senderName: json['senderName'] as String?,
        createdAt: DateTime.parse(json['createdAt'] as String),
      );
}

class Conversation {
  final String id;
  final String type; // 'direct' | 'group'
  final String? name;
  final String? avatarUrl;
  final List<AppUser> participants;
  final LastMessage? lastMessage;
  final DateTime updatedAt;

  const Conversation({
    required this.id,
    required this.type,
    this.name,
    this.avatarUrl,
    required this.participants,
    this.lastMessage,
    required this.updatedAt,
  });

  bool get isGroup => type == 'group';

  AppUser? otherParticipant(String myId) {
    if (isGroup) return null;
    for (final p in participants) {
      if (p.id != myId) return p;
    }
    return null;
  }

  String displayTitle(String myId) {
    if (isGroup) return name ?? 'Group';
    return otherParticipant(myId)?.name ?? 'Conversation';
  }

  factory Conversation.fromJson(Map<String, dynamic> json) => Conversation(
        id: json['id'] as String,
        type: json['type'] as String? ?? 'direct',
        name: json['name'] as String?,
        avatarUrl: json['avatarUrl'] as String?,
        participants: (json['participants'] as List<dynamic>? ?? [])
            .map((e) => AppUser.fromJson(e as Map<String, dynamic>))
            .toList(),
        lastMessage:
            json['lastMessage'] != null ? LastMessage.fromJson(json['lastMessage'] as Map<String, dynamic>) : null,
        updatedAt: DateTime.parse(json['updatedAt'] as String),
      );

  Conversation copyWith({LastMessage? lastMessage, DateTime? updatedAt}) => Conversation(
        id: id,
        type: type,
        name: name,
        avatarUrl: avatarUrl,
        participants: participants,
        lastMessage: lastMessage ?? this.lastMessage,
        updatedAt: updatedAt ?? this.updatedAt,
      );
}
