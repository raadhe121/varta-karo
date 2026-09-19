import 'package:flutter/material.dart';

import '../../../common/widgets/screen.dart';

/// Placeholder — replaced in Phase 4 with feed, stories, composer, etc.
class FeedScreen extends StatelessWidget {
  const FeedScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return Screen(
      child: Scaffold(
        backgroundColor: Colors.transparent,
        appBar: AppBar(title: const Text('Feed')),
        body: const Center(child: Text('Feed — coming in Phase 4')),
      ),
    );
  }
}
