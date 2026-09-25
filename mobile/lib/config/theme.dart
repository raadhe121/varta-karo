import 'package:flutter/material.dart';

/// Ports the "parchment" palette from the RN app's `src/config/theme.js`
/// (shared with the web client's `client/src/index.css` @theme) exactly —
/// keep these in sync if the web/mobile design tokens ever change together.
///
/// These are the light-mode values (mirrors the CSS `:root` block). Widgets
/// should read colors from `Theme.of(context).extension<AppPalette>()!`
/// rather than these statics directly, so dark mode (see [AppPalette.dark],
/// mirroring `:root.dark`) takes effect; the statics remain for the few
/// always-light/always-dark surfaces (e.g. call/reels overlays).
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

  // Fixed, theme-independent near-black — mirrors CSS `--color-paper-dark(-soft)`,
  // used for always-dark surfaces (video/call overlays) that must look the
  // same in both modes.
  static const paperDark = Color(0xFF241D16);
  static const paperDarkSoft = Color(0xFF332A1F);
}

/// Theme-aware palette, mirroring the CSS custom properties that flip under
/// `:root.dark` in `client/src/index.css`. Access via
/// `Theme.of(context).extension<AppPalette>()!`.
class AppPalette extends ThemeExtension<AppPalette> {
  final Color paper;
  final Color paperSoft;
  final Color page;
  final Color ink;
  final Color inkSoft;
  final Color accent;
  final Color accentSoft;
  final Color line;

  const AppPalette({
    required this.paper,
    required this.paperSoft,
    required this.page,
    required this.ink,
    required this.inkSoft,
    required this.accent,
    required this.accentSoft,
    required this.line,
  });

  static const light = AppPalette(
    paper: AppColors.paper,
    paperSoft: AppColors.paperSoft,
    page: AppColors.page,
    ink: AppColors.ink,
    inkSoft: AppColors.inkSoft,
    accent: AppColors.accent,
    accentSoft: AppColors.accentSoft,
    line: AppColors.line,
  );

  static const dark = AppPalette(
    paper: Color(0xFF241D16),
    paperSoft: Color(0xFF332A1F),
    page: Color(0xFF1C1712),
    ink: Color(0xFFF3EAD9),
    inkSoft: Color(0xFFB8AB95),
    accent: Color(0xFFD97B46),
    accentSoft: Color(0xFF4A3323),
    line: Color(0xFF3A332A),
  );

  @override
  AppPalette copyWith({
    Color? paper,
    Color? paperSoft,
    Color? page,
    Color? ink,
    Color? inkSoft,
    Color? accent,
    Color? accentSoft,
    Color? line,
  }) =>
      AppPalette(
        paper: paper ?? this.paper,
        paperSoft: paperSoft ?? this.paperSoft,
        page: page ?? this.page,
        ink: ink ?? this.ink,
        inkSoft: inkSoft ?? this.inkSoft,
        accent: accent ?? this.accent,
        accentSoft: accentSoft ?? this.accentSoft,
        line: line ?? this.line,
      );

  @override
  AppPalette lerp(ThemeExtension<AppPalette>? other, double t) {
    if (other is! AppPalette) return this;
    return AppPalette(
      paper: Color.lerp(paper, other.paper, t)!,
      paperSoft: Color.lerp(paperSoft, other.paperSoft, t)!,
      page: Color.lerp(page, other.page, t)!,
      ink: Color.lerp(ink, other.ink, t)!,
      inkSoft: Color.lerp(inkSoft, other.inkSoft, t)!,
      accent: Color.lerp(accent, other.accent, t)!,
      accentSoft: Color.lerp(accentSoft, other.accentSoft, t)!,
      line: Color.lerp(line, other.line, t)!,
    );
  }
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

ThemeData buildAppTheme() => _buildTheme(AppPalette.light, Brightness.light);

/// Mirrors `client/src/index.css`'s `:root.dark` override block — same
/// shapes/typography as light, just the palette swapped.
ThemeData buildAppDarkTheme() => _buildTheme(AppPalette.dark, Brightness.dark);

ThemeData _buildTheme(AppPalette palette, Brightness brightness) {
  final colorScheme = ColorScheme.fromSeed(
    seedColor: palette.accent,
    brightness: brightness,
  ).copyWith(
    primary: palette.accent,
    onPrimary: AppColors.white,
    surface: palette.paper,
    error: AppColors.danger,
  );

  return ThemeData(
    useMaterial3: true,
    brightness: brightness,
    colorScheme: colorScheme,
    scaffoldBackgroundColor: palette.page,
    canvasColor: palette.page,
    dividerColor: palette.line,
    extensions: [palette],
    appBarTheme: AppBarTheme(
      backgroundColor: palette.paper,
      foregroundColor: palette.ink,
      elevation: 0,
      surfaceTintColor: Colors.transparent,
      titleTextStyle: TextStyle(color: palette.ink, fontSize: 17, fontWeight: FontWeight.w600),
    ),
    bottomNavigationBarTheme: BottomNavigationBarThemeData(
      backgroundColor: palette.paper,
      selectedItemColor: palette.accent,
      unselectedItemColor: palette.inkSoft,
    ),
    textTheme: (brightness == Brightness.dark ? ThemeData.dark() : ThemeData.light())
        .textTheme
        .apply(bodyColor: palette.ink, displayColor: palette.ink),
    inputDecorationTheme: InputDecorationTheme(
      filled: true,
      fillColor: palette.paper,
      contentPadding: const EdgeInsets.symmetric(horizontal: 14, vertical: 11),
      border: OutlineInputBorder(
        borderRadius: BorderRadius.circular(AppRadius.md),
        borderSide: BorderSide(color: palette.line),
      ),
      enabledBorder: OutlineInputBorder(
        borderRadius: BorderRadius.circular(AppRadius.md),
        borderSide: BorderSide(color: palette.line),
      ),
      focusedBorder: OutlineInputBorder(
        borderRadius: BorderRadius.circular(AppRadius.md),
        borderSide: BorderSide(color: palette.accent),
      ),
    ),
  );
}
