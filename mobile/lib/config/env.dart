import 'dart:io';

/// Mirrors the RN app's `src/config/env.js`: Android emulators reach the host
/// machine via the special alias 10.0.2.2, iOS simulator can hit localhost
/// directly, and a real physical device needs the host's LAN IP passed in at
/// build/run time (`--dart-define=API_HOST=192.168.x.x`).
class Env {
  static const String _definedHost = String.fromEnvironment('API_HOST', defaultValue: '');

  static String get host {
    if (_definedHost.isNotEmpty) return _definedHost;
    if (Platform.isAndroid) return '10.0.2.2';
    return 'localhost';
  }

  static String get apiOrigin => 'http://$host:5000';
  static String get apiUrl => '$apiOrigin/api';

  /// Mirrors the web client's VITE_CLOUDINARY_CLOUD_NAME / _UPLOAD_PRESET —
  /// uploads go straight from the device to Cloudinary, never through our
  /// server. Pass at build/run time, e.g.
  /// `--dart-define=CLOUDINARY_CLOUD_NAME=xxx --dart-define=CLOUDINARY_UPLOAD_PRESET=yyy`.
  static const String cloudinaryCloudName = String.fromEnvironment('CLOUDINARY_CLOUD_NAME', defaultValue: '');
  static const String cloudinaryUploadPreset = String.fromEnvironment('CLOUDINARY_UPLOAD_PRESET', defaultValue: '');

  /// The API returns media fields (avatarUrl, mediaUrl, imageUrl, ...) as
  /// relative `/uploads/...` paths — this resolves them to a loadable URL.
  static String resolveMediaUrl(String? path) {
    if (path == null || path.isEmpty) return '';
    if (path.startsWith('http://') || path.startsWith('https://')) return path;
    return '$apiOrigin$path';
  }
}
