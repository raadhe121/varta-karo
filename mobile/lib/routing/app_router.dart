import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../common/widgets/screen.dart';
import '../config/theme.dart';
import '../core/auth_session.dart';
import '../features/auth/screens/login_screen.dart';
import '../features/auth/screens/register_screen.dart';
import '../features/chat/screens/conversations_screen.dart';
import '../features/feed/screens/feed_screen.dart';
import '../features/notifications/screens/notifications_screen.dart';
import '../features/profile/screens/profile_screen.dart';

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

  if (!session.isAuthenticated) {
    return onAuthStack ? null : '/login';
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
      StatefulShellRoute.indexedStack(
        builder: (context, state, navigationShell) => _MainShell(navigationShell: navigationShell),
        branches: [
          StatefulShellBranch(
            navigatorKey: _feedTabKey,
            routes: [
              GoRoute(path: '/feed', builder: (context, state) => const FeedScreen()),
            ],
          ),
          StatefulShellBranch(
            navigatorKey: _chatTabKey,
            routes: [
              GoRoute(path: '/chat', builder: (context, state) => const ConversationsScreen()),
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
              GoRoute(path: '/profile', builder: (context, state) => const ProfileScreen()),
            ],
          ),
        ],
      ),
    ],
  );
});

/// Bottom tab shell — equivalent of MainTabs.js. Phase 2/3 will mount the
/// global socket listeners + call overlays here (this is the one place that
/// stays alive regardless of which tab is focused, matching MainTabs.js's
/// role as the single socket-owning component).
class _MainShell extends StatelessWidget {
  final StatefulNavigationShell navigationShell;

  const _MainShell({required this.navigationShell});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: navigationShell,
      bottomNavigationBar: BottomNavigationBar(
        currentIndex: navigationShell.currentIndex,
        onTap: (index) => navigationShell.goBranch(index, initialLocation: index == navigationShell.currentIndex),
        items: const [
          BottomNavigationBarItem(icon: Text('📰', style: TextStyle(fontSize: 18)), label: 'Feed'),
          BottomNavigationBarItem(icon: Text('💬', style: TextStyle(fontSize: 18)), label: 'Chat'),
          BottomNavigationBarItem(icon: Text('🔔', style: TextStyle(fontSize: 18)), label: 'Notifications'),
          BottomNavigationBarItem(icon: Text('👤', style: TextStyle(fontSize: 18)), label: 'Profile'),
        ],
      ),
    );
  }
}
