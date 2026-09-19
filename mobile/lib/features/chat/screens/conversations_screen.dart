import 'package:flutter/material.dart';

import '../../../common/widgets/screen.dart';

/// Placeholder — replaced in Phase 2 with Chats/Contacts tabs, filters, etc.
class ConversationsScreen extends StatelessWidget {
  const ConversationsScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return Screen(
      child: Scaffold(
        backgroundColor: Colors.transparent,
        appBar: AppBar(title: const Text('Chat')),
        body: const Center(child: Text('Conversations — coming in Phase 2')),
      ),
    );
  }
}
