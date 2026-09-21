import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:intl/intl.dart';

import '../../../config/theme.dart';
import '../../../models/profile.dart';
import '../data/social_api.dart';

const _typeLabel = {'post': 'You posted', 'like': 'You liked', 'comment': 'You commented'};

/// Ports `src/components/social/ActivityLog.js`.
class ActivityLog extends ConsumerStatefulWidget {
  const ActivityLog({super.key});

  @override
  ConsumerState<ActivityLog> createState() => _ActivityLogState();
}

class _ActivityLogState extends ConsumerState<ActivityLog> {
  List<ActivityItem>? _items;

  @override
  void initState() {
    super.initState();
    ref.read(socialApiProvider).fetchMyActivity().then((items) {
      if (mounted) setState(() => _items = items);
    });
  }

  @override
  Widget build(BuildContext context) {
    final items = _items;
    if (items == null) {
      return const Padding(padding: EdgeInsets.all(24), child: Center(child: CircularProgressIndicator()));
    }
    if (items.isEmpty) {
      return const Padding(
        padding: EdgeInsets.all(24),
        child: Center(child: Text('No activity yet.', style: TextStyle(color: AppColors.inkSoft))),
      );
    }

    final formatter = DateFormat('MMM d, h:mm a');
    return Column(
      children: items
          .map((item) => ListTile(
                title: Text(_typeLabel[item.type] ?? item.type),
                subtitle: Text(item.summary),
                trailing: Text(formatter.format(item.createdAt), style: const TextStyle(fontSize: 11, color: AppColors.inkSoft)),
              ))
          .toList(),
    );
  }
}
