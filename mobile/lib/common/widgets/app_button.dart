import 'package:flutter/material.dart';

import '../../config/theme.dart';

enum AppButtonVariant { primary, outline, ghost }

/// Ports `src/components/common/Button.js`: three variants, a loading
/// spinner in place of the label, opacity-based disabled/pressed states.
class AppButton extends StatelessWidget {
  final String label;
  final VoidCallback? onPressed;
  final AppButtonVariant variant;
  final bool loading;

  const AppButton({
    super.key,
    required this.label,
    required this.onPressed,
    this.variant = AppButtonVariant.primary,
    this.loading = false,
  });

  @override
  Widget build(BuildContext context) {
    final disabled = onPressed == null || loading;

    Color background;
    Color foreground;
    Color borderColor;
    switch (variant) {
      case AppButtonVariant.primary:
        background = AppColors.accent;
        foreground = AppColors.white;
        borderColor = Colors.transparent;
      case AppButtonVariant.outline:
        background = Colors.transparent;
        foreground = AppColors.ink;
        borderColor = AppColors.line;
      case AppButtonVariant.ghost:
        background = Colors.transparent;
        foreground = AppColors.ink;
        borderColor = AppColors.line;
    }

    return Opacity(
      opacity: disabled ? 0.5 : 1,
      child: Material(
        color: background,
        borderRadius: BorderRadius.circular(AppRadius.md),
        child: InkWell(
          onTap: disabled ? null : onPressed,
          borderRadius: BorderRadius.circular(AppRadius.md),
          child: Container(
            padding: const EdgeInsets.symmetric(horizontal: 18, vertical: 12),
            decoration: BoxDecoration(
              borderRadius: BorderRadius.circular(AppRadius.md),
              border: Border.all(color: borderColor),
            ),
            alignment: Alignment.center,
            child: loading
                ? SizedBox(
                    width: 18,
                    height: 18,
                    child: CircularProgressIndicator(strokeWidth: 2, color: foreground),
                  )
                : Text(label, style: TextStyle(color: foreground, fontWeight: FontWeight.w600, fontSize: 15)),
          ),
        ),
      ),
    );
  }
}
