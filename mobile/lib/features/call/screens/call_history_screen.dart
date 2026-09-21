import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../common/widgets/avatar.dart';
import '../../../common/widgets/screen.dart';
import '../../../config/theme.dart';
import '../../../models/call_log.dart';
import '../data/calls_api.dart';

/// Ports the web app's `CallHistoryList` (deferred from the chat phase) —
/// GET /calls via calls_api.dart, matching call.controller.js#listCalls.
class CallHistoryScreen extends ConsumerStatefulWidget {
  const CallHistoryScreen({super.key});

  @override
  ConsumerState<CallHistoryScreen> createState() => _CallHistoryScreenState();
}

class _CallHistoryScreenState extends ConsumerState<CallHistoryScreen> {
  late Future<List<CallLogEntry>> _future;

  @override
  void initState() {
    super.initState();
    _future = ref.read(callsApiProvider).fetchCallHistory();
  }

  Future<void> _refresh() async {
    final next = ref.read(callsApiProvider).fetchCallHistory();
    setState(() => _future = next);
    await next;
  }

  IconData _directionIcon(CallLogEntry call) {
    if (call.isMissed) return Icons.call_missed;
    return call.direction == 'outgoing' ? Icons.call_made : Icons.call_received;
  }

  String _subtitle(CallLogEntry call) {
    final kind = call.type == 'video' ? 'Video' : 'Voice';
    if (call.isMissed) return '$kind · Missed';
    if (call.status == 'declined') return '$kind · Declined';
    final minutes = (call.durationSec ~/ 60).toString().padLeft(2, '0');
    final seconds = (call.durationSec % 60).toString().padLeft(2, '0');
    return '$kind · $minutes:$seconds';
  }

  @override
  Widget build(BuildContext context) {
    return Screen(
      child: Scaffold(
        backgroundColor: Colors.transparent,
        appBar: AppBar(title: const Text('Calls')),
        body: RefreshIndicator(
          onRefresh: _refresh,
          child: FutureBuilder<List<CallLogEntry>>(
            future: _future,
            builder: (context, snapshot) {
              if (snapshot.connectionState != ConnectionState.done) {
                return const Center(child: CircularProgressIndicator(color: AppColors.accent));
              }
              if (snapshot.hasError) {
                return ListView(
                  children: const [
                    Padding(
                      padding: EdgeInsets.all(24),
                      child: Center(child: Text('Could not load call history.')),
                    ),
                  ],
                );
              }
              final calls = snapshot.data ?? const [];
              if (calls.isEmpty) {
                return ListView(
                  children: const [
                    Padding(
                      padding: EdgeInsets.all(24),
                      child: Center(child: Text('No calls yet.', style: TextStyle(color: AppColors.inkSoft))),
                    ),
                  ],
                );
              }
              return ListView.separated(
                padding: const EdgeInsets.symmetric(vertical: 8),
                itemCount: calls.length,
                separatorBuilder: (context, index) => const Divider(height: 1, color: AppColors.line),
                itemBuilder: (context, index) {
                  final call = calls[index];
                  return ListTile(
                    leading: Avatar(user: call.otherUser, size: AvatarSize.md),
                    title: Text(call.otherUser?.name ?? 'Unknown', style: const TextStyle(fontWeight: FontWeight.w600)),
                    subtitle: Row(
                      mainAxisSize: MainAxisSize.min,
                      children: [
                        Icon(
                          _directionIcon(call),
                          size: 14,
                          color: call.isMissed ? AppColors.danger : AppColors.inkSoft,
                        ),
                        const SizedBox(width: 4),
                        Text(_subtitle(call), style: const TextStyle(fontSize: 12, color: AppColors.inkSoft)),
                      ],
                    ),
                    trailing: Icon(call.type == 'video' ? Icons.videocam : Icons.call, color: AppColors.inkSoft, size: 18),
                  );
                },
              );
            },
          ),
        ),
      ),
    );
  }
}
