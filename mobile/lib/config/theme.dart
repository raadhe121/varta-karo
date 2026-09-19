import 'package:flutter/material.dart';

/// Ports the "parchment" palette from the RN app's `src/config/theme.js`
/// (shared with the web client's `client/src/index.css` @theme) exactly —
/// keep these in sync if the web/mobile design tokens ever change together.
class AppColors {
  static const paper = Color(0xFFFFFDF9);
  static const paperSoft = Color(0xFFF3EAD9);
  static const page = Color(0xFFF2ECDF);
  static const ink = Color(0xFF2B241D);
  static const inkSoft = Color(0xFF8A7D6C);
  static const accent = Color(0xFFC1652F);
  static const accentSoft = Color(0xFFF3DECB);
  static const line = Color(0xFFE8DCC6);
  static const white = Color(0xFFFFFFFF);
  static const danger = Color(0xFFDC2626);
  static const success = Color(0xFF059669);
}

class AppRadius {
  static const double sm = 8;
  static const double md = 12;
  static const double lg = 16;
  static const double xl = 20;
  static const double full = 999;
}

/// 4px grid helper, matching theme.js's `spacing(n) => n * 4`.
double spacing(double n) => n * 4;

ThemeData buildAppTheme() {
  final colorScheme = ColorScheme.fromSeed(
    seedColor: AppColors.accent,
    brightness: Brightness.light,
  ).copyWith(
    primary: AppColors.accent,
    onPrimary: AppColors.white,
    surface: AppColors.paper,
    error: AppColors.danger,
  );

  return ThemeData(
    useMaterial3: true,
    colorScheme: colorScheme,
    scaffoldBackgroundColor: AppColors.page,
    canvasColor: AppColors.page,
    dividerColor: AppColors.line,
    appBarTheme: const AppBarTheme(
      backgroundColor: AppColors.paper,
      foregroundColor: AppColors.ink,
      elevation: 0,
      surfaceTintColor: Colors.transparent,
      titleTextStyle: TextStyle(color: AppColors.ink, fontSize: 17, fontWeight: FontWeight.w600),
    ),
    bottomNavigationBarTheme: const BottomNavigationBarThemeData(
      backgroundColor: AppColors.paper,
      selectedItemColor: AppColors.accent,
      unselectedItemColor: AppColors.inkSoft,
    ),
    textTheme: ThemeData.light().textTheme.apply(bodyColor: AppColors.ink, displayColor: AppColors.ink),
    inputDecorationTheme: InputDecorationTheme(
      filled: true,
      fillColor: AppColors.paper,
      contentPadding: const EdgeInsets.symmetric(horizontal: 14, vertical: 11),
      border: OutlineInputBorder(
        borderRadius: BorderRadius.circular(AppRadius.md),
        borderSide: const BorderSide(color: AppColors.line),
      ),
      enabledBorder: OutlineInputBorder(
        borderRadius: BorderRadius.circular(AppRadius.md),
        borderSide: const BorderSide(color: AppColors.line),
      ),
      focusedBorder: OutlineInputBorder(
        borderRadius: BorderRadius.circular(AppRadius.md),
        borderSide: const BorderSide(color: AppColors.accent),
      ),
    ),
  );
}
