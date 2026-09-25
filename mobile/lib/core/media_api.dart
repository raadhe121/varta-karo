import 'package:dio/dio.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../config/env.dart';

/// Uploads go straight from the device to Cloudinary, never through our
/// server -- keeps large image/video payloads off the backend and its
/// ephemeral disk, mirroring `client/src/api/cloudinary.js`. Uses a plain
/// Dio instance (not the authed `dioProvider`'s) since Cloudinary needs no
/// app auth header.
class MediaApi {
  final Dio _dio = Dio();

  Future<Map<String, dynamic>> upload({required String path, required String filename, String? mimeType}) async {
    final cloudName = Env.cloudinaryCloudName;
    final uploadPreset = Env.cloudinaryUploadPreset;
    if (cloudName.isEmpty || uploadPreset.isEmpty) {
      throw StateError('Cloudinary is not configured (CLOUDINARY_CLOUD_NAME / CLOUDINARY_UPLOAD_PRESET missing)');
    }

    final formData = FormData.fromMap({
      'file': await MultipartFile.fromFile(path, filename: filename, contentType: _parseMime(mimeType)),
      'upload_preset': uploadPreset,
    });
    final res = await _dio.post<Map<String, dynamic>>(
      'https://api.cloudinary.com/v1_1/$cloudName/auto/upload',
      data: formData,
    );
    final data = res.data!;
    return {
      'url': data['secure_url'],
      'originalName': filename,
      'mimeType': mimeType,
      'size': data['bytes'],
    };
  }

  DioMediaType? _parseMime(String? mimeType) {
    if (mimeType == null || !mimeType.contains('/')) return null;
    final parts = mimeType.split('/');
    return DioMediaType(parts[0], parts[1]);
  }
}

final mediaApiProvider = Provider<MediaApi>((ref) => MediaApi());
