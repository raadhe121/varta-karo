import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../../common/widgets/app_button.dart';
import '../../../common/widgets/app_input.dart';
import '../../../common/widgets/avatar.dart';
import '../../../common/widgets/screen.dart';
import '../../../config/theme.dart';
import '../../../core/auth_session.dart';
import '../../../models/user.dart';
import '../providers/random_chat_actions.dart';
import '../providers/random_chat_provider.dart';

/// Ports `client/src/pages/RandomChatPage.jsx` to a single-column mobile
/// screen. Reachable both logged out (a top-level route the router's
/// redirect explicitly allows) and logged in.
class RandomChatScreen extends ConsumerStatefulWidget {
  const RandomChatScreen({super.key});

  @override
  ConsumerState<RandomChatScreen> createState() => _RandomChatScreenState();
}

class _RandomChatScreenState extends ConsumerState<RandomChatScreen> {
  bool _connecting = true;

  @override
  void initState() {
    super.initState();
    ref.read(randomChatActionsProvider).connect().then((_) {
      if (mounted) setState(() => _connecting = false);
    });
  }

  @override
  void dispose() {
    ref.read(randomChatActionsProvider).dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final user = ref.watch(authSessionProvider).user;
    final phase = ref.watch(randomChatProvider.select((s) => s.phase));

    return Screen(
      child: Scaffold(
        backgroundColor: Colors.transparent,
        appBar: AppBar(
          title: const Text('Talk to a Stranger'),
          leading: BackButton(
            onPressed: () => context.go(user != null ? '/feed' : '/login'),
          ),
        ),
        body: _connecting
            ? const Center(
                child: CircularProgressIndicator(color: AppColors.accent),
              )
            : Column(
                children: [
                  Padding(
                    padding: const EdgeInsets.fromLTRB(20, 16, 20, 0),
                    child: Text(
                      user != null
                          ? 'Chatting as ${user['name']}'
                          : 'Chatting anonymously — no account needed',
                      style: const TextStyle(
                        color: AppColors.inkSoft,
                        fontSize: 13,
                      ),
                    ),
                  ),
                  Expanded(
                    child: switch (phase) {
                      RandomChatPhase.idle => const _IdleView(),
                      RandomChatPhase.waiting => const _WaitingView(),
                      RandomChatPhase.chatting => const _ChattingView(),
                      RandomChatPhase.ended => const _EndedView(),
                    },
                  ),
                ],
              ),
      ),
    );
  }
}

class _IdleView extends ConsumerWidget {
  const _IdleView();

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    return Center(
      child: Padding(
        padding: const EdgeInsets.all(24),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            const Text(
              'Tap below to get matched with a random person online right now.',
              textAlign: TextAlign.center,
              style: TextStyle(color: AppColors.inkSoft),
            ),
            const SizedBox(height: 20),
            AppButton(
              label: 'Find a stranger',
              onPressed: () =>
                  ref.read(randomChatActionsProvider).findStranger(),
            ),
          ],
        ),
      ),
    );
  }
}

class _WaitingView extends ConsumerWidget {
  const _WaitingView();

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    return Center(
      child: Column(
        mainAxisSize: MainAxisSize.min,
        children: [
          const CircularProgressIndicator(color: AppColors.accent),
          const SizedBox(height: 16),
          const Text(
            'Looking for someone to match you with...',
            style: TextStyle(color: AppColors.inkSoft),
          ),
          const SizedBox(height: 12),
          TextButton(
            onPressed: () => ref.read(randomChatActionsProvider).close(),
            child: const Text(
              'Cancel',
              style: TextStyle(color: AppColors.inkSoft),
            ),
          ),
        ],
      ),
    );
  }
}

class _ChattingView extends ConsumerStatefulWidget {
  const _ChattingView();

  @override
  ConsumerState<_ChattingView> createState() => _ChattingViewState();
}

class _ChattingViewState extends ConsumerState<_ChattingView> {
  final _textController = TextEditingController();
  final _scrollController = ScrollController();

  @override
  void dispose() {
    _textController.dispose();
    _scrollController.dispose();
    super.dispose();
  }

  void _send() {
    final text = _textController.text;
    if (text.trim().isEmpty) return;
    ref.read(randomChatActionsProvider).sendMessage(text);
    _textController.clear();
    WidgetsBinding.instance.addPostFrameCallback((_) {
      if (!_scrollController.hasClients) return;
      _scrollController.animateTo(
        _scrollController.position.maxScrollExtent,
        duration: const Duration(milliseconds: 200),
        curve: Curves.easeOut,
      );
    });
  }

  @override
  Widget build(BuildContext context) {
    final isLoggedIn = ref.watch(authSessionProvider).isAuthenticated;
    final partner = ref.watch(randomChatProvider.select((s) => s.partner));
    final messages = ref.watch(randomChatProvider.select((s) => s.messages));
    final requestState = ref.watch(
      randomChatProvider.select((s) => s.requestState),
    );
    final hasPendingRequest = ref.watch(
      randomChatProvider.select((s) => s.hasPendingRequest),
    );
    final friendAddedConversationId = ref.watch(
      randomChatProvider.select((s) => s.friendAddedConversationId),
    );
    final actions = ref.read(randomChatActionsProvider);

    return Column(
      children: [
        Padding(
          padding: const EdgeInsets.fromLTRB(16, 8, 16, 8),
          child: Row(
            children: [
              Avatar(
                user: AppUser(
                  id: partner?.userId ?? '',
                  name: partner?.name ?? 'Stranger',
                  username: '',
                ),
              ),
              const SizedBox(width: 10),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      partner?.name ?? 'Stranger',
                      style: const TextStyle(fontWeight: FontWeight.w600),
                    ),
                    Text(
                      partner?.isGuest == true ? 'Anonymous' : 'Has an account',
                      style: const TextStyle(
                        color: AppColors.inkSoft,
                        fontSize: 12,
                      ),
                    ),
                  ],
                ),
              ),
              if (isLoggedIn && requestState == RandomChatRequestState.none)
                TextButton(
                  onPressed: actions.sendFriendRequest,
                  child: const Text(
                    'Add Friend',
                    style: TextStyle(
                      color: AppColors.accent,
                      fontWeight: FontWeight.w600,
                    ),
                  ),
                ),
              if (requestState == RandomChatRequestState.sent)
                const Text(
                  'Request sent',
                  style: TextStyle(color: AppColors.inkSoft, fontSize: 12),
                ),
              if (requestState == RandomChatRequestState.pending)
                const Text(
                  'Waiting for sign-up',
                  style: TextStyle(color: AppColors.inkSoft, fontSize: 12),
                ),
            ],
          ),
        ),
        const Divider(height: 1, color: AppColors.line),
        if (hasPendingRequest) const _PendingRequestBanner(),
        if (friendAddedConversationId != null)
          _FriendAddedBanner(conversationId: friendAddedConversationId),
        Expanded(
          child: messages.isEmpty
              ? const Center(
                  child: Text(
                    "Say hi \u{1F44B} — you're now connected.",
                    style: TextStyle(color: AppColors.inkSoft, fontSize: 12),
                  ),
                )
              : ListView.builder(
                  controller: _scrollController,
                  padding: const EdgeInsets.symmetric(
                    horizontal: 16,
                    vertical: 8,
                  ),
                  itemCount: messages.length,
                  itemBuilder: (context, index) {
                    final m = messages[index];
                    return Align(
                      alignment: m.fromSelf
                          ? Alignment.centerRight
                          : Alignment.centerLeft,
                      child: Container(
                        margin: const EdgeInsets.symmetric(vertical: 3),
                        padding: const EdgeInsets.symmetric(
                          horizontal: 14,
                          vertical: 8,
                        ),
                        constraints: BoxConstraints(
                          maxWidth: MediaQuery.of(context).size.width * 0.75,
                        ),
                        decoration: BoxDecoration(
                          color: m.fromSelf
                              ? AppColors.accent
                              : AppColors.paperSoft,
                          borderRadius: BorderRadius.circular(AppRadius.lg),
                        ),
                        child: Text(
                          m.text,
                          style: TextStyle(
                            color: m.fromSelf ? AppColors.white : AppColors.ink,
                          ),
                        ),
                      ),
                    );
                  },
                ),
        ),
        const Divider(height: 1, color: AppColors.line),
        Padding(
          padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
          child: Row(
            children: [
              Expanded(
                child: AppInput(
                  controller: _textController,
                  hintText: 'Type a message...',
                  onChanged: (_) {},
                ),
              ),
              const SizedBox(width: 8),
              AppButton(label: 'Send', onPressed: _send),
            ],
          ),
        ),
        Padding(
          padding: const EdgeInsets.only(bottom: 8),
          child: Row(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              TextButton(
                onPressed: actions.next,
                child: const Text(
                  'Next stranger',
                  style: TextStyle(
                    color: AppColors.accent,
                    fontWeight: FontWeight.w600,
                  ),
                ),
              ),
              const SizedBox(width: 16),
              TextButton(
                onPressed: actions.leave,
                child: const Text(
                  'Stop',
                  style: TextStyle(color: AppColors.inkSoft),
                ),
              ),
            ],
          ),
        ),
      ],
    );
  }
}

class _PendingRequestBanner extends ConsumerStatefulWidget {
  const _PendingRequestBanner();

  @override
  ConsumerState<_PendingRequestBanner> createState() =>
      _PendingRequestBannerState();
}

class _PendingRequestBannerState extends ConsumerState<_PendingRequestBanner> {
  final _identifier = TextEditingController();
  final _password = TextEditingController();
  bool _loading = false;
  String? _error;

  @override
  void dispose() {
    _identifier.dispose();
    _password.dispose();
    super.dispose();
  }

  Future<void> _submit() async {
    setState(() {
      _loading = true;
      _error = null;
    });
    try {
      await ref
          .read(randomChatActionsProvider)
          .authenticateAsGuest(
            identifier: _identifier.text.trim(),
            password: _password.text,
          );
    } catch (_) {
      setState(() => _error = 'Login failed');
    } finally {
      if (mounted) setState(() => _loading = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    return Container(
      margin: const EdgeInsets.fromLTRB(16, 12, 16, 0),
      padding: const EdgeInsets.all(12),
      decoration: BoxDecoration(
        color: AppColors.accentSoft,
        borderRadius: BorderRadius.circular(AppRadius.lg),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          const Text(
            'Your chat partner wants to add you as a friend',
            style: TextStyle(fontWeight: FontWeight.w600, fontSize: 13),
          ),
          const SizedBox(height: 2),
          const Text(
            "Log in to accept — you'll both be able to keep chatting after.",
            style: TextStyle(color: AppColors.inkSoft, fontSize: 12),
          ),
          const SizedBox(height: 8),
          AppInput(controller: _identifier, hintText: 'Username or email'),
          const SizedBox(height: 8),
          AppInput(
            controller: _password,
            hintText: 'Password',
            obscureText: true,
          ),
          if (_error != null) ...[
            const SizedBox(height: 4),
            Text(
              _error!,
              style: const TextStyle(color: AppColors.danger, fontSize: 12),
            ),
          ],
          const SizedBox(height: 8),
          Row(
            children: [
              AppButton(
                label: _loading ? 'Logging in...' : 'Log in & accept',
                onPressed: _loading ? null : _submit,
              ),
              const SizedBox(width: 12),
              TextButton(
                onPressed: () => context.push('/register'),
                child: const Text(
                  'Create an account instead',
                  style: TextStyle(color: AppColors.accent, fontSize: 12),
                ),
              ),
            ],
          ),
        ],
      ),
    );
  }
}

class _EndedView extends ConsumerWidget {
  const _EndedView();

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final endedBy = ref.watch(randomChatProvider.select((s) => s.endedBy));
    final actions = ref.read(randomChatActionsProvider);
    final message = endedBy == RandomChatEndedBy.self
        ? 'You ended the chat'
        : 'Your chat partner ended the chat';

    return Center(
      child: Padding(
        padding: const EdgeInsets.all(24),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            Container(
              padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 8),
              decoration: BoxDecoration(
                color: AppColors.paperSoft,
                borderRadius: BorderRadius.circular(AppRadius.full),
              ),
              child: Text(
                message,
                style: const TextStyle(
                  color: AppColors.inkSoft,
                  fontSize: 13,
                  fontWeight: FontWeight.w600,
                ),
              ),
            ),
            const SizedBox(height: 20),
            Row(
              mainAxisSize: MainAxisSize.min,
              children: [
                TextButton(
                  onPressed: actions.next,
                  child: const Text(
                    'New Chat',
                    style: TextStyle(
                      color: AppColors.accent,
                      fontWeight: FontWeight.w600,
                    ),
                  ),
                ),
                const SizedBox(width: 16),
                TextButton(
                  onPressed: actions.close,
                  child: const Text(
                    'Close',
                    style: TextStyle(color: AppColors.inkSoft),
                  ),
                ),
              ],
            ),
          ],
        ),
      ),
    );
  }
}

class _FriendAddedBanner extends StatelessWidget {
  final String conversationId;

  const _FriendAddedBanner({required this.conversationId});

  @override
  Widget build(BuildContext context) {
    return Container(
      margin: const EdgeInsets.fromLTRB(16, 12, 16, 0),
      padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 10),
      decoration: BoxDecoration(
        color: const Color(0xFFECFDF5),
        border: Border.all(color: const Color(0xFFA7F3D0)),
        borderRadius: BorderRadius.circular(AppRadius.lg),
      ),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.spaceBetween,
        children: [
          const Text(
            "You're friends now!",
            style: TextStyle(
              color: AppColors.success,
              fontWeight: FontWeight.w600,
            ),
          ),
          TextButton(
            onPressed: () => context.push('/chat/$conversationId'),
            child: const Text(
              'Open chat',
              style: TextStyle(
                color: AppColors.success,
                fontWeight: FontWeight.w600,
              ),
            ),
          ),
        ],
      ),
    );
  }
}
