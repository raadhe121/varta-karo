import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:image_picker/image_picker.dart';

import '../../../common/widgets/app_button.dart';
import '../../../common/widgets/app_input.dart';
import '../../../common/widgets/avatar.dart';
import '../../../common/widgets/screen.dart';
import '../../../config/theme.dart';
import '../../../core/auth_session.dart';
import '../../../core/media_api.dart';
import '../../../models/user.dart';
import '../../auth/providers/auth_provider.dart';
import '../data/user_api.dart';

List<UserLink> _textToLinks(String text) {
  return text
      .split('\n')
      .map((line) => line.trim())
      .where((line) => line.isNotEmpty)
      .map((url) {
        var domain = url.replaceFirst(RegExp(r'^https?://'), '');
        domain = domain.split('/').first;
        return UserLink(label: domain, url: url);
      })
      .toList();
}

String _linksToText(List<UserLink> links) => links.map((l) => l.url).join('\n');

/// Ports `src/screens/profile/EditProfileScreen.js`.
class EditProfileScreen extends ConsumerStatefulWidget {
  const EditProfileScreen({super.key});

  @override
  ConsumerState<EditProfileScreen> createState() => _EditProfileScreenState();
}

class _EditProfileScreenState extends ConsumerState<EditProfileScreen> {
  late final TextEditingController _name;
  late final TextEditingController _bio;
  late final TextEditingController _work;
  late final TextEditingController _education;
  late final TextEditingController _location;
  late final TextEditingController _links;
  String _visibility = 'public';
  bool _saving = false;
  bool _uploadingAvatar = false;
  bool _uploadingCover = false;

  @override
  void initState() {
    super.initState();
    final user = ref.read(authSessionProvider).user ?? {};
    _name = TextEditingController(text: user['name'] as String? ?? '');
    _bio = TextEditingController(text: user['bio'] as String? ?? '');
    _work = TextEditingController(text: user['work'] as String? ?? '');
    _education = TextEditingController(text: user['education'] as String? ?? '');
    _location = TextEditingController(text: user['location'] as String? ?? '');
    final links = (user['links'] as List<dynamic>? ?? [])
        .map((e) => UserLink.fromJson(e as Map<String, dynamic>))
        .toList();
    _links = TextEditingController(text: _linksToText(links));
    _visibility = user['profileVisibility'] as String? ?? 'public';
  }

  @override
  void dispose() {
    _name.dispose();
    _bio.dispose();
    _work.dispose();
    _education.dispose();
    _location.dispose();
    _links.dispose();
    super.dispose();
  }

  Future<void> _pickAndUpload({required bool isCover}) async {
    final picker = ImagePicker();
    final picked = await picker.pickImage(source: ImageSource.gallery, imageQuality: 80);
    if (picked == null) return;

    setState(() => isCover ? _uploadingCover = true : _uploadingAvatar = true);
    try {
      final uploaded = await ref.read(mediaApiProvider).upload(
            path: picked.path,
            filename: picked.name,
            mimeType: picked.mimeType,
          );
      final field = isCover ? 'coverPhotoUrl' : 'avatarUrl';
      final updated = await ref.read(userApiProvider).updateMe({field: uploaded['url']});
      await ref.read(authActionsProvider).updateUser(updated);
    } finally {
      if (mounted) setState(() => isCover ? _uploadingCover = false : _uploadingAvatar = false);
    }
  }

  Future<void> _save() async {
    setState(() => _saving = true);
    try {
      final updated = await ref.read(userApiProvider).updateMe({
        'name': _name.text.trim(),
        'bio': _bio.text.trim(),
        'work': _work.text.trim(),
        'education': _education.text.trim(),
        'location': _location.text.trim(),
        'links': _textToLinks(_links.text).map((l) => l.toJson()).toList(),
        'profileVisibility': _visibility,
      });
      await ref.read(authActionsProvider).updateUser(updated);
      if (mounted) Navigator.of(context).pop();
    } finally {
      if (mounted) setState(() => _saving = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    final user = ref.watch(authSessionProvider).user;
    final appUser = user != null ? AppUser.fromJson(user) : null;
    final coverUrl = user?['coverPhotoUrl'] as String?;

    return Screen(
      child: Scaffold(
        backgroundColor: Colors.transparent,
        appBar: AppBar(title: const Text('Edit profile')),
        body: SingleChildScrollView(
          padding: const EdgeInsets.all(20),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [
              Center(
                child: Stack(
                  alignment: Alignment.bottomRight,
                  children: [
                    Avatar(user: appUser, size: AvatarSize.lg),
                    _PhotoEditButton(loading: _uploadingAvatar, onTap: () => _pickAndUpload(isCover: false)),
                  ],
                ),
              ),
              const SizedBox(height: 8),
              Center(
                child: TextButton(
                  onPressed: _uploadingCover ? null : () => _pickAndUpload(isCover: true),
                  child: Text(
                    coverUrl != null ? 'Change cover photo' : 'Add cover photo',
                    style: const TextStyle(color: AppColors.accent),
                  ),
                ),
              ),
              const SizedBox(height: 16),
              AppInput(label: 'Name', controller: _name),
              const SizedBox(height: 16),
              AppInput(label: 'Bio', controller: _bio, maxLines: 3),
              const SizedBox(height: 16),
              AppInput(label: 'Work', controller: _work),
              const SizedBox(height: 16),
              AppInput(label: 'Education', controller: _education),
              const SizedBox(height: 16),
              AppInput(label: 'Location', controller: _location),
              const SizedBox(height: 16),
              AppInput(label: 'Links (one per line)', controller: _links, maxLines: 4),
              const SizedBox(height: 16),
              const Text('Who can see your About info', style: TextStyle(fontWeight: FontWeight.w600, fontSize: 13)),
              const SizedBox(height: 8),
              Wrap(
                spacing: 8,
                children: [
                  for (final option in const ['public', 'friends', 'only_me'])
                    ChoiceChip(
                      label: Text(option),
                      selected: _visibility == option,
                      onSelected: (_) => setState(() => _visibility = option),
                      selectedColor: AppColors.accentSoft,
                    ),
                ],
              ),
              const SizedBox(height: 24),
              AppButton(label: 'Save', onPressed: _saving ? null : _save, loading: _saving),
            ],
          ),
        ),
      ),
    );
  }
}

class _PhotoEditButton extends StatelessWidget {
  final bool loading;
  final VoidCallback onTap;

  const _PhotoEditButton({required this.loading, required this.onTap});

  @override
  Widget build(BuildContext context) {
    return InkWell(
      onTap: loading ? null : onTap,
      borderRadius: BorderRadius.circular(AppRadius.full),
      child: Container(
        width: 28,
        height: 28,
        decoration: const BoxDecoration(color: AppColors.accent, shape: BoxShape.circle),
        alignment: Alignment.center,
        child: loading
            ? const SizedBox(
                width: 14,
                height: 14,
                child: CircularProgressIndicator(strokeWidth: 2, color: AppColors.white),
              )
            : const Icon(Icons.camera_alt, size: 14, color: AppColors.white),
      ),
    );
  }
}
