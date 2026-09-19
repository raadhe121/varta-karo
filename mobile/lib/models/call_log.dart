import 'user.dart';

class CallLogEntry {
  final String id;
  final String conversationId;
  final String type; // 'audio' | 'video'
  final String status; // 'answered' | 'missed' | 'declined' | 'no_answer'
  final int durationSec;
  final String direction; // 'outgoing' | 'incoming'
  final AppUser? otherUser;
  final DateTime createdAt;

  const CallLogEntry({
    required this.id,
    required this.conversationId,
    required this.type,
    required this.status,
    this.durationSec = 0,
    required this.direction,
    this.otherUser,
    required this.createdAt,
  });

  bool get isMissed => direction == 'incoming' && (status == 'missed' || status == 'no_answer');

  factory CallLogEntry.fromJson(Map<String, dynamic> json) => CallLogEntry(
        id: json['id'] as String,
        conversationId: json['conversationId'] as String,
        type: json['type'] as String? ?? 'audio',
        status: json['status'] as String? ?? 'missed',
        durationSec: json['durationSec'] as int? ?? 0,
        direction: json['direction'] as String,
        otherUser: json['otherUser'] != null ? AppUser.fromJson(json['otherUser'] as Map<String, dynamic>) : null,
        createdAt: DateTime.parse(json['createdAt'] as String),
      );
}
