import 'package:cached_network_image/cached_network_image.dart';
import 'package:flutter/material.dart';

import '../../config/env.dart';
import '../../config/theme.dart';
import '../../models/user.dart';

enum AvatarSize { sm, md, lg }

const _avatarSizes = {AvatarSize.sm: 32.0, AvatarSize.md: 40.0, AvatarSize.lg: 80.0};
const _avatarFontSizes = {AvatarSize.sm: 12.0, AvatarSize.md: 15.0, AvatarSize.lg: 28.0};

String _initials(String name) {
  final parts = name.trim().split(RegExp(r'\s+')).where((p) => p.isNotEmpty).toList();
  if (parts.isEmpty) return '?';
  final first = parts[0][0];
  final second = parts.length > 1 ? parts[1][0] : '';
  return (first + second).toUpperCase();
}

Color _hexColor(String hex) {
  final cleaned = hex.replaceAll('#', '');
  final value = int.tryParse(cleaned.length == 6 ? 'FF$cleaned' : cleaned, radix: 16);
  return value != null ? Color(value) : AppColors.accent;
}

/// Ports `src/components/common/Avatar.js` exactly: circular photo when
/// `avatarUrl` is set, otherwise a colored monogram; an optional status dot
/// (cut out of the surrounding paper color) bottom-right.
class Avatar extends StatelessWidget {
  final AppUser? user;
  final AvatarSize size;
  final bool showStatus;
  final bool isOnline;

  const Avatar({super.key, required this.user, this.size = AvatarSize.md, this.showStatus = false, this.isOnline = false});

  @override
  Widget build(BuildContext context) {
    final dimension = _avatarSizes[size]!;
    final fontSize = _avatarFontSizes[size]!;
    final name = user?.name ?? '';
    final avatarUrl = user?.avatarUrl;
    final color = user != null ? _hexColor(user!.avatarColor) : AppColors.accent;

    final circle = ClipOval(
      child: SizedBox(
        width: dimension,
        height: dimension,
        child: avatarUrl != null && avatarUrl.isNotEmpty
            ? CachedNetworkImage(
                imageUrl: Env.resolveMediaUrl(avatarUrl),
                fit: BoxFit.cover,
                errorWidget: (context, url, error) => _monogram(color, name, fontSize),
              )
            : _monogram(color, name, fontSize),
      ),
    );

    if (!showStatus) return SizedBox(width: dimension, height: dimension, child: circle);

    return SizedBox(
      width: dimension,
      height: dimension,
      child: Stack(
        clipBehavior: Clip.none,
        children: [
          circle,
          Positioned(
            bottom: -2,
            right: -2,
            child: Container(
              width: 12,
              height: 12,
              decoration: BoxDecoration(
                shape: BoxShape.circle,
                color: isOnline ? AppColors.success : AppColors.inkSoft,
                border: Border.all(color: AppColors.paper, width: 2),
              ),
            ),
          ),
        ],
      ),
    );
  }

  Widget _monogram(Color color, String name, double fontSize) {
    return Container(
      color: color,
      alignment: Alignment.center,
      child: Text(
        _initials(name),
        style: TextStyle(color: Colors.white, fontSize: fontSize, fontWeight: FontWeight.w700),
      ),
    );
  }
}
