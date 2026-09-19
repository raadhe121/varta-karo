import 'package:flutter/material.dart';

import '../../../common/widgets/screen.dart';

/// Placeholder — replaced in Phase 1 with the real profile screen
/// (posts/media/activity tabs, about card, friend/follow actions, etc).
class ProfileScreen extends StatelessWidget {
  final String? userId;

  const ProfileScreen({super.key, this.userId});

  @override
  Widget build(BuildContext context) {
    return Screen(
      child: Scaffold(
        backgroundColor: Colors.transparent,
        appBar: AppBar(title: const Text('Profile')),
        body: Center(child: Text('Profile${userId != null ? ' ($userId)' : ''} — coming in Phase 1')),
      ),
    );
  }
}
