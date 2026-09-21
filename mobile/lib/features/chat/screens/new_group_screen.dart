import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../../common/widgets/app_button.dart';
import '../../../common/widgets/app_input.dart';
import '../../../common/widgets/avatar.dart';
import '../../../common/widgets/screen.dart';
import '../../../config/theme.dart';
import '../../../models/user.dart';
import '../../contacts/data/contacts_api.dart';
import '../providers/chat_actions.dart';

/// Ports `src/components/chat/NewGroupModal.jsx` as a full screen — mobile
/// has no room for a centered modal over the conversation list. Sources its
/// picker from ContactsApi.fetchContacts(), matching NewGroupModal.jsx's own
/// use of fetchContacts() (not the friends list — a separate system).
class NewGroupScreen extends ConsumerStatefulWidget {
  const NewGroupScreen({super.key});

  @override
  ConsumerState<NewGroupScreen> createState() => _NewGroupScreenState();
}

class _NewGroupScreenState extends ConsumerState<NewGroupScreen> {
  final _nameController = TextEditingController();
  List<AppUser>? _contacts;
  final Set<String> _selected = {};
  bool _creating = false;

  @override
  void initState() {
    super.initState();
    ref.read(contactsApiProvider).fetchContacts().then((contacts) {
      if (mounted) setState(() => _contacts = contacts);
    });
  }

  @override
  void dispose() {
    _nameController.dispose();
    super.dispose();
  }

  void _toggle(String id) {
    setState(() {
      if (_selected.contains(id)) {
        _selected.remove(id);
      } else {
        _selected.add(id);
      }
    });
  }

  Future<void> _create() async {
    setState(() => _creating = true);
    try {
      final conversation = await ref.read(chatActionsProvider).createGroup(
            name: _nameController.text.trim(),
            participantIds: _selected.toList(),
          );
      if (mounted) context.pushReplacement('/chat/${conversation.id}');
    } catch (_) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('Could not create the group. Please try again.')),
        );
      }
    } finally {
      if (mounted) setState(() => _creating = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    final canCreate = !_creating && _selected.length >= 2 && _nameController.text.trim().isNotEmpty;

    return Screen(
      child: Scaffold(
        backgroundColor: Colors.transparent,
        appBar: AppBar(title: const Text('New group')),
        body: Padding(
          padding: const EdgeInsets.all(16),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [
              AppInput(label: 'Group name', controller: _nameController, onChanged: (_) => setState(() {})),
              const SizedBox(height: 8),
              const Text('Pick at least 2 contacts', style: TextStyle(color: AppColors.inkSoft, fontSize: 12)),
              const SizedBox(height: 8),
              Expanded(
                child: _contacts == null
                    ? const Center(child: CircularProgressIndicator(color: AppColors.accent))
                    : _contacts!.isEmpty
                        ? const Center(child: Text('No contacts yet.', style: TextStyle(color: AppColors.inkSoft)))
                        : ListView.builder(
                            itemCount: _contacts!.length,
                            itemBuilder: (context, index) {
                              final contact = _contacts![index];
                              return CheckboxListTile(
                                value: _selected.contains(contact.id),
                                onChanged: (_) => _toggle(contact.id),
                                controlAffinity: ListTileControlAffinity.leading,
                                activeColor: AppColors.accent,
                                secondary: Avatar(user: contact, size: AvatarSize.sm),
                                title: Text(contact.name),
                              );
                            },
                          ),
              ),
              const SizedBox(height: 12),
              AppButton(
                label: _creating ? 'Creating...' : 'Create group',
                loading: _creating,
                onPressed: canCreate ? _create : null,
              ),
            ],
          ),
        ),
      ),
    );
  }
}
