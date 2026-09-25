import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../data/random_chat_socket.dart';

enum RandomChatPhase { idle, waiting, chatting, ended }

enum RandomChatRequestState { none, pending, sent }

/// Own, ephemeral message class — deliberately not models/message.dart's
/// ChatMessage, which is the persisted-conversation shape; nothing here is
/// ever written to the server's DB (see random.js's comment on `queue`).
class RandomChatMessage {
  final bool fromSelf;
  final String text;
  final String at;

  const RandomChatMessage({
    required this.fromSelf,
    required this.text,
    required this.at,
  });
}

/// Who ended the chat — shown on both sides of a `RandomChatPhase.ended`
/// screen, mirroring the web app's shared "chat ended" state.
enum RandomChatEndedBy { self, partner }

class RandomChatState {
  final RandomChatPhase phase;
  final RandomChatPartner? partner;
  final List<RandomChatMessage> messages;
  final RandomChatRequestState requestState;
  final bool hasPendingRequest;
  final String? friendAddedConversationId;
  final String? error;
  final RandomChatEndedBy? endedBy;

  const RandomChatState({
    this.phase = RandomChatPhase.idle,
    this.partner,
    this.messages = const [],
    this.requestState = RandomChatRequestState.none,
    this.hasPendingRequest = false,
    this.friendAddedConversationId,
    this.error,
    this.endedBy,
  });

  RandomChatState copyWith({
    RandomChatPhase? phase,
    RandomChatPartner? partner,
    bool clearPartner = false,
    List<RandomChatMessage>? messages,
    RandomChatRequestState? requestState,
    bool? hasPendingRequest,
    String? friendAddedConversationId,
    String? error,
    bool clearError = false,
    RandomChatEndedBy? endedBy,
    bool clearEndedBy = false,
  }) => RandomChatState(
    phase: phase ?? this.phase,
    partner: clearPartner ? null : (partner ?? this.partner),
    messages: messages ?? this.messages,
    requestState: requestState ?? this.requestState,
    hasPendingRequest: hasPendingRequest ?? this.hasPendingRequest,
    friendAddedConversationId:
        friendAddedConversationId ?? this.friendAddedConversationId,
    error: clearError ? null : (error ?? this.error),
    endedBy: clearEndedBy ? null : (endedBy ?? this.endedBy),
  );
}

class RandomChatNotifier extends Notifier<RandomChatState> {
  @override
  RandomChatState build() => const RandomChatState();

  void setWaiting() => state = state.copyWith(phase: RandomChatPhase.waiting);

  void setMatched(RandomChatPartner partner) {
    state = state.copyWith(
      phase: RandomChatPhase.chatting,
      partner: partner,
      messages: const [],
      requestState: RandomChatRequestState.none,
      hasPendingRequest: false,
      clearEndedBy: true,
    );
  }

  void addIncomingMessage(String text, String at) {
    state = state.copyWith(
      messages: [
        ...state.messages,
        RandomChatMessage(fromSelf: false, text: text, at: at),
      ],
    );
  }

  void addOwnMessage(String text) {
    state = state.copyWith(
      messages: [
        ...state.messages,
        RandomChatMessage(
          fromSelf: true,
          text: text,
          at: DateTime.now().toIso8601String(),
        ),
      ],
    );
  }

  /// Chat ended for either party — both sides land here (phase `ended`)
  /// instead of silently reverting to idle, so the UI can show a shared
  /// "chat ended" state with New Chat / Close actions.
  void chatEnded(RandomChatEndedBy by) {
    state = state.copyWith(
      phase: RandomChatPhase.ended,
      endedBy: by,
      hasPendingRequest: false,
    );
  }

  void reset() {
    state = state.copyWith(
      phase: RandomChatPhase.idle,
      clearPartner: true,
      messages: const [],
      requestState: RandomChatRequestState.none,
      hasPendingRequest: false,
      clearEndedBy: true,
    );
  }

  void backToWaiting() {
    state = state.copyWith(
      phase: RandomChatPhase.waiting,
      clearPartner: true,
      messages: const [],
      requestState: RandomChatRequestState.none,
      hasPendingRequest: false,
      clearEndedBy: true,
    );
  }

  void setRequestState(bool pending) {
    state = state.copyWith(
      requestState: pending
          ? RandomChatRequestState.pending
          : RandomChatRequestState.sent,
    );
  }

  void setPendingRequest() => state = state.copyWith(hasPendingRequest: true);

  void setFriendAdded(String? conversationId) =>
      state = state.copyWith(friendAddedConversationId: conversationId);

  void setError(String message) => state = state.copyWith(error: message);

  void clearError() => state = state.copyWith(clearError: true);
}

final randomChatProvider =
    NotifierProvider<RandomChatNotifier, RandomChatState>(
      RandomChatNotifier.new,
    );
