import 'package:flutter/material.dart';

import '../../config/theme.dart';

/// Ports `src/components/common/Screen.js`: a SafeArea wrapper over a
/// page-colored background, used by almost every screen except the
/// full-bleed story viewer/composer.
class Screen extends StatelessWidget {
  final Widget child;
  final bool top;
  final bool bottom;

  const Screen({super.key, required this.child, this.top = true, this.bottom = true});

  @override
  Widget build(BuildContext context) {
    return Container(
      color: AppColors.page,
      child: SafeArea(top: top, bottom: bottom, child: child),
    );
  }
}
