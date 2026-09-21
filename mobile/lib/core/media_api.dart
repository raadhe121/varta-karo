import 'package:dio/dio.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import 'api_client.dart';

/// POST /api/media/upload — shared across features (profile avatar/cover,
/// chat attachments, posts, stories). Field name must be exactly `file`,
/// per the backend's `upload.single('file')` middleware.
class MediaApi {
  final Dio _dio;

  MediaApi(this._dio);

  Future<Map<String, dynamic>> upload({required String path, required String filename, String? mimeType}) async {
    final formData = FormData.fromMap({
      'file': await MultipartFile.fromFile(path, filename: filename, contentType: _parseMime(mimeType)),
    });
    final res = await _dio.post<Map<String, dynamic>>('/media/upload', data: formData);
    return res.data!;
  }

  DioMediaType? _parseMime(String? mimeType) {
    if (mimeType == null || !mimeType.contains('/')) return null;
    final parts = mimeType.split('/');
    return DioMediaType(parts[0], parts[1]);
  }
}

final mediaApiProvider = Provider<MediaApi>((ref) => MediaApi(ref.read(dioProvider)));
