import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../common/widgets/screen.dart';
import '../config/theme.dart';
import '../core/auth_session.dart';
import '../features/auth/screens/login_screen.dart';
import '../features/auth/screens/register_screen.dart';
import '../features/call/providers/call_provider.dart';
import '../features/call/providers/call_socket_bridge.dart';
import '../features/call/screens/active_call_screen.dart';
import '../features/call/screens/call_history_screen.dart';
import '../features/chat/providers/chat_socket_bridge.dart';
import '../features/chat/screens/chat_screen.dart';
import '../features/chat/screens/conversations_screen.dart';
import '../features/chat/screens/new_group_screen.dart';
import '../features/contacts/screens/contacts_screen.dart';
import '../features/feed/screens/comments_screen.dart';
import '../features/feed/screens/create_post_screen.dart';
import '../features/feed/screens/feed_screen.dart';
import '../features/feed/screens/search_screen.dart';
import '../features/feed/screens/story_composer_screen.dart';
import '../features/feed/screens/story_viewer_screen.dart';
import '../features/notifications/providers/notifications_provider.dart';
import '../features/notifications/providers/notifications_socket_bridge.dart';
import '../features/notifications/screens/notifications_screen.dart';
import '../features/profile/screens/edit_profile_screen.dart';
import '../features/profile/screens/profile_screen.dart';
import '../features/random_chat/screens/random_chat_screen.dart';

/// Bridges Riverpod's authSessionProvider to go_router's Listenable-based
/// refresh mechanism, so route redirects re-evaluate whenever auth state
/// changes (login, logout, hydration completing).
class _AuthRefreshNotifier extends ChangeNotifier {
  _AuthRefreshNotifier(Ref ref) {
    ref.listen(authSessionProvider, (previous, next) => notifyListeners());
  }
}

/// Mirrors RootNavigator.js: while auth hasn't hydrated from storage yet,
/// show a spinner; once hydrated, gate between the auth stack and the
/// authenticated tab shell based on whether a user is present.
String? _redirect(Ref ref, GoRouterState state) {
  final session = ref.read(authSessionProvider);
  final path = state.matchedLocation;

  if (!session.hydrated) {
    return path == '/splash' ? null : '/splash';
  }

  final atSplash = path == '/splash';
  final onAuthStack = path == '/login' || path == '/register';
  // Reachable logged-out (like /login, /register) but also stays reachable
  // once logged in — unlike the auth stack, it must NOT bounce a logged-in
  // user back to /feed.
  final atRandomChat = path == '/random-chat';

  if (!session.isAuthenticated) {
    return (onAuthStack || atRandomChat) ? null : '/login';
  }

  if (onAuthStack || atSplash) return '/feed';
  return null;
}

final _feedTabKey = GlobalKey<NavigatorState>();
final _chatTabKey = GlobalKey<NavigatorState>();
final _notificationsTabKey = GlobalKey<NavigatorState>();
final _profileTabKey = GlobalKey<NavigatorState>();

final goRouterProvider = Provider<GoRouter>((ref) {
  final refreshNotifier = _AuthRefreshNotifier(ref);
  ref.onDispose(refreshNotifier.dispose);

  return GoRouter(
    initialLocation: '/splash',
    refreshListenable: refreshNotifier,
    redirect: (context, state) => _redirect(ref, state),
    routes: [
      GoRoute(
        path: '/splash',
        builder: (context, state) => const Screen(
          child: Center(child: CircularProgressIndicator(color: AppColors.accent)),
        ),
      ),
      GoRoute(path: '/login', builder: (context, state) => const LoginScreen()),
      GoRoute(path: '/register', builder: (context, state) => const RegisterScreen()),
      // Top-level and unauthenticated-reachable (see _redirect) — random
      // chat must work with no session at all.
      GoRoute(path: '/random-chat', builder: (context, state) => const RandomChatScreen()),
      // Top-level (outside the tab shell) so it overlays full-screen no
      // matter which tab is active when a call starts — pushed/popped
      // imperatively by CallActions rather than navigated to normally.
      GoRoute(path: '/call', builder: (context, state) => const CallScreen()),
      StatefulShellRoute.indexedStack(
        builder: (context, state, navigationShell) => _MainShell(navigationShell: navigationShell),
        branches: [
          StatefulShellBranch(
            navigatorKey: _feedTabKey,
            routes: [
              GoRoute(
                path: '/feed',
                builder: (context, state) => const FeedScreen(),
                routes: [
                  // Nested-leaf-under-tab-root convention from Phase 1 (see
                  // the /profile branch below) — story/new before
                  // story/:userId so the literal segment isn't shadowed.
                  GoRoute(path: 'create-post', builder: (context, state) => const CreatePostScreen()),
                  GoRoute(path: 'search', builder: (context, state) => const SearchScreen()),
                  GoRoute(path: 'story/new', builder: (context, state) => const StoryComposerScreen()),
                  GoRoute(
                    path: 'story/:userId',
                    builder: (context, state) => StoryViewerScreen(userId: state.pathParameters['userId']!),
                  ),
                  GoRoute(
                    path: 'post/:id/comments',
                    builder: (context, state) => CommentsScreen(postId: state.pathParameters['id']!),
                  ),
                ],
              ),
            ],
          ),
          StatefulShellBranch(
            navigatorKey: _chatTabKey,
            routes: [
              GoRoute(
                path: '/chat',
                builder: (context, state) => const ConversationsScreen(),
                routes: [
                  GoRoute(path: 'new-group', builder: (context, state) => const NewGroupScreen()),
                  // Reached via ConversationsScreen's app bar — mirrors the
                  // web app's Sidebar.jsx Contacts tab (a separate system
                  // from the friends list) as a pushed screen instead of an
                  // inline tab.
                  GoRoute(path: 'contacts', builder: (context, state) => const ContactsScreen()),
                  // Not yet linked from any nav affordance (see the call
                  // phase's constraints — chat_screen.dart's app bar is the
                  // only allowed chat-feature touch); reachable by path for
                  // now, e.g. a future entry point in ConversationsScreen.
                  GoRoute(path: 'calls', builder: (context, state) => const CallHistoryScreen()),
                  GoRoute(
                    path: ':conversationId',
                    builder: (context, state) =>
                        ChatScreen(conversationId: state.pathParameters['conversationId']!),
                  ),
                ],
              ),
            ],
          ),
          StatefulShellBranch(
            navigatorKey: _notificationsTabKey,
            routes: [
              GoRoute(path: '/notifications', builder: (context, state) => const NotificationsScreen()),
            ],
          ),
          StatefulShellBranch(
            navigatorKey: _profileTabKey,
            routes: [
              GoRoute(
                path: '/profile',
                builder: (context, state) => const ProfileScreen(),
                routes: [
                  // Nested-leaf-under-tab-root convention established here for
                  // Phase 1 — later phases add their own tab-scoped leaves the
                  // same way (e.g. a `/chat` branch getting its own nested
                  // `profile/:userId` route) rather than sharing one global
                  // top-level route, so each tab keeps its own back-stack.
                  GoRoute(path: 'edit', builder: (context, state) => const EditProfileScreen()),
                  GoRoute(
                    path: ':userId',
                    builder: (context, state) => ProfileScreen(userId: state.pathParameters['userId']),
                  ),
                ],
              ),
            ],
          ),
        ],
      ),
    ],
  );
});

/// Bottom tab shell — equivalent of MainTabs.js. Mounts the global chat and
/// call socket listeners here (via chatSocketBridgeProvider/
/// callSocketBridgeProvider) since this is the one place that stays alive
/// regardless of which tab is focused, matching MainTabs.js's role as the
/// single socket-owning component. callSocketBridgeProvider is what makes
/// an incoming call surface (as a pushed `/call` route) no matter which tab
/// is active when `call:incoming` arrives.
class _MainShell extends ConsumerWidget {
  final StatefulNavigationShell navigationShell;

  const _MainShell({required this.navigationShell});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    ref.watch(chatSocketBridgeProvider);
    ref.watch(callSocketBridgeProvider);
    ref.watch(notificationsSocketBridgeProvider);
    final unreadNotifications = ref.watch(notificationsProvider.select((s) => s.unreadCount));

    // Surfaces a call-ending error (permission denied, "user is
    // unavailable") after the `/call` route has already popped back here —
    // callProvider.reset() deliberately keeps `error` across that pop for
    // exactly this (see call_provider.dart).
    ref.listen<String?>(callProvider.select((s) => s.error), (previous, next) {
      if (next == null) return;
      ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text(next)));
      ref.read(callProvider.notifier).clearError();
    });

    return Scaffold(
      body: navigationShell,
      bottomNavigationBar: BottomNavigationBar(
        currentIndex: navigationShell.currentIndex,
        onTap: (index) => navigationShell.goBranch(index, initialLocation: index == navigationShell.currentIndex),
        items: [
          const BottomNavigationBarItem(icon: Text('📰', style: TextStyle(fontSize: 18)), label: 'Feed'),
          const BottomNavigationBarItem(icon: Text('💬', style: TextStyle(fontSize: 18)), label: 'Chat'),
          BottomNavigationBarItem(
            icon: Badge(
              label: Text('$unreadNotifications'),
              isLabelVisible: unreadNotifications > 0,
              child: const Text('🔔', style: TextStyle(fontSize: 18)),
            ),
            label: 'Notifications',
          ),
          const BottomNavigationBarItem(icon: Text('👤', style: TextStyle(fontSize: 18)), label: 'Profile'),
        ],
      ),
    );
  }
}
