import 'package:flutter/material.dart';

import '../../../common/widgets/screen.dart';

/// Placeholder — replaced in Phase 5 with the real notifications list.
class NotificationsScreen extends StatelessWidget {
  const NotificationsScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return Screen(
      child: Scaffold(
        backgroundColor: Colors.transparent,
        appBar: AppBar(title: const Text('Notifications')),
        body: const Center(child: Text('Notifications — coming in Phase 5')),
      ),
    );
  }
}
