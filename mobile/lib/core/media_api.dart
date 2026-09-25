import 'package:dio/dio.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../config/env.dart';
import 'api_client.dart';

/// When CLOUDINARY_CLOUD_NAME / CLOUDINARY_UPLOAD_PRESET are passed at
/// build time (staging/prod), uploads go straight from the device to
/// Cloudinary, never through our server -- mirroring
/// `client/src/api/cloudinary.js`. Local dev leaves those unset, so we fall
/// back to our own `/media/upload` endpoint, which stores the file on the
/// server's disk and serves it back at `/uploads/...`.
class MediaApi {
  MediaApi(this._authedDio);

  final Dio _authedDio;
  final Dio _plainDio = Dio();

  Future<Map<String, dynamic>> upload({required String path, required String filename, String? mimeType}) async {
    final cloudName = Env.cloudinaryCloudName;
    final uploadPreset = Env.cloudinaryUploadPreset;
    if (cloudName.isNotEmpty && uploadPreset.isNotEmpty) {
      return _uploadToCloudinary(path, filename, mimeType, cloudName, uploadPreset);
    }
    return _uploadToLocalServer(path, filename, mimeType);
  }

  Future<Map<String, dynamic>> _uploadToCloudinary(
    String path,
    String filename,
    String? mimeType,
    String cloudName,
    String uploadPreset,
  ) async {
    final formData = FormData.fromMap({
      'file': await MultipartFile.fromFile(path, filename: filename, contentType: _parseMime(mimeType)),
      'upload_preset': uploadPreset,
    });
    final res = await _plainDio.post<Map<String, dynamic>>(
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

  Future<Map<String, dynamic>> _uploadToLocalServer(String path, String filename, String? mimeType) async {
    final formData = FormData.fromMap({
      'file': await MultipartFile.fromFile(path, filename: filename, contentType: _parseMime(mimeType)),
    });
    final res = await _authedDio.post<Map<String, dynamic>>('/media/upload', data: formData);
    final data = res.data!;
    return {
      'url': Env.resolveMediaUrl(data['url'] as String?),
      'originalName': data['originalName'],
      'mimeType': data['mimeType'],
      'size': data['size'],
    };
  }

  DioMediaType? _parseMime(String? mimeType) {
    if (mimeType == null || !mimeType.contains('/')) return null;
    final parts = mimeType.split('/');
    return DioMediaType(parts[0], parts[1]);
  }
}

final mediaApiProvider = Provider<MediaApi>((ref) => MediaApi(ref.read(dioProvider)));
