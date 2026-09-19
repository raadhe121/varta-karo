import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import 'config/theme.dart';
import 'core/auth_session.dart';
import 'routing/app_router.dart';

class App extends ConsumerWidget {
  const App({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    // Fires the storage read once at startup (equivalent of authStore.js's
    // hydrate() being called once from RootNavigator on mount); the router
    // holds everything on /splash until authSessionProvider.hydrated flips.
    ref.watch(authHydrationProvider);

    final router = ref.watch(goRouterProvider);

    return MaterialApp.router(
      title: 'Vartakaro',
      debugShowCheckedModeBanner: false,
      theme: buildAppTheme(),
      routerConfig: router,
    );
  }
}
