import 'package:dio/dio.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../core/api_client.dart';

class UserApi {
  final Dio _dio;

  UserApi(this._dio);

  Future<Map<String, dynamic>> fetchMe() async {
    final res = await _dio.get<Map<String, dynamic>>('/users/me');
    return res.data!;
  }

  Future<Map<String, dynamic>> updateMe(Map<String, dynamic> partial) async {
    final res = await _dio.patch<Map<String, dynamic>>('/users/me', data: partial);
    return res.data!;
  }
}

final userApiProvider = Provider<UserApi>((ref) => UserApi(ref.read(dioProvider)));
