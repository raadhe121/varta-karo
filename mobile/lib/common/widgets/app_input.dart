import 'package:flutter/material.dart';

import '../../config/theme.dart';

/// Ports `src/components/common/Input.js`: optional label above, optional
/// error text below, everything else passed straight through to the
/// underlying TextField (multiline, obscureText, keyboardType, etc.).
class AppInput extends StatelessWidget {
  final String? label;
  final String? error;
  final TextEditingController? controller;
  final String? hintText;
  final bool obscureText;
  final TextInputType? keyboardType;
  final int? maxLines;
  final ValueChanged<String>? onChanged;
  final Widget? suffixIcon;
  final Widget? prefixIcon;
  final bool autofocus;
  final TextCapitalization textCapitalization;

  const AppInput({
    super.key,
    this.label,
    this.error,
    this.controller,
    this.hintText,
    this.obscureText = false,
    this.keyboardType,
    this.maxLines = 1,
    this.onChanged,
    this.suffixIcon,
    this.prefixIcon,
    this.autofocus = false,
    this.textCapitalization = TextCapitalization.none,
  });

  @override
  Widget build(BuildContext context) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        if (label != null) ...[
          Text(label!, style: const TextStyle(fontSize: 13, fontWeight: FontWeight.w600, color: AppColors.ink)),
          const SizedBox(height: 6),
        ],
        TextField(
          controller: controller,
          obscureText: obscureText,
          keyboardType: keyboardType,
          maxLines: maxLines,
          onChanged: onChanged,
          autofocus: autofocus,
          textCapitalization: textCapitalization,
          style: const TextStyle(fontSize: 15, color: AppColors.ink),
          decoration: InputDecoration(
            hintText: hintText,
            hintStyle: const TextStyle(color: AppColors.inkSoft),
            suffixIcon: suffixIcon,
            prefixIcon: prefixIcon,
          ),
        ),
        if (error != null) ...[
          const SizedBox(height: 4),
          Text(error!, style: const TextStyle(fontSize: 12, color: AppColors.danger)),
        ],
      ],
    );
  }
}
