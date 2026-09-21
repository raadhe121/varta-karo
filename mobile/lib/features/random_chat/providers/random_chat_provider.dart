import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../data/random_chat_socket.dart';

enum RandomChatPhase { idle, waiting, chatting }

enum RandomChatRequestState { none, pending, sent }

/// Own, ephemeral message class — deliberately not models/message.dart's
/// ChatMessage, which is the persisted-conversation shape; nothing here is
/// ever written to the server's DB (see random.js's comment on `queue`).
class RandomChatMessage {
  final bool fromSelf;
  final String text;
  final String at;

  const RandomChatMessage({required this.fromSelf, required this.text, required this.at});
}

class RandomChatState {
  final RandomChatPhase phase;
  final RandomChatPartner? partner;
  final List<RandomChatMessage> messages;
  final RandomChatRequestState requestState;
  final bool hasPendingRequest;
  final String? friendAddedConversationId;
  final String? error;

  const RandomChatState({
    this.phase = RandomChatPhase.idle,
    this.partner,
    this.messages = const [],
    this.requestState = RandomChatRequestState.none,
    this.hasPendingRequest = false,
    this.friendAddedConversationId,
    this.error,
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
  }) =>
      RandomChatState(
        phase: phase ?? this.phase,
        partner: clearPartner ? null : (partner ?? this.partner),
        messages: messages ?? this.messages,
        requestState: requestState ?? this.requestState,
        hasPendingRequest: hasPendingRequest ?? this.hasPendingRequest,
        friendAddedConversationId: friendAddedConversationId ?? this.friendAddedConversationId,
        error: clearError ? null : (error ?? this.error),
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
    );
  }

  void addIncomingMessage(String text, String at) {
    state = state.copyWith(messages: [...state.messages, RandomChatMessage(fromSelf: false, text: text, at: at)]);
  }

  void addOwnMessage(String text) {
    state = state.copyWith(
      messages: [
        ...state.messages,
        RandomChatMessage(fromSelf: true, text: text, at: DateTime.now().toIso8601String()),
      ],
    );
  }

  void partnerLeft() {
    state = state.copyWith(phase: RandomChatPhase.idle, clearPartner: true, hasPendingRequest: false, messages: const []);
  }

  void reset() {
    state = state.copyWith(
      phase: RandomChatPhase.idle,
      clearPartner: true,
      messages: const [],
      requestState: RandomChatRequestState.none,
      hasPendingRequest: false,
    );
  }

  void backToWaiting() {
    state = state.copyWith(
      phase: RandomChatPhase.waiting,
      clearPartner: true,
      messages: const [],
      requestState: RandomChatRequestState.none,
      hasPendingRequest: false,
    );
  }

  void setRequestState(bool pending) {
    state = state.copyWith(requestState: pending ? RandomChatRequestState.pending : RandomChatRequestState.sent);
  }

  void setPendingRequest() => state = state.copyWith(hasPendingRequest: true);

  void setFriendAdded(String? conversationId) => state = state.copyWith(friendAddedConversationId: conversationId);

  void setError(String message) => state = state.copyWith(error: message);

  void clearError() => state = state.copyWith(clearError: true);
}

final randomChatProvider = NotifierProvider<RandomChatNotifier, RandomChatState>(RandomChatNotifier.new);
