import 'package:dio/dio.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../core/api_client.dart';
import '../../../models/social_request.dart';
import '../../../models/user.dart';

/// Mirrors the web app's `src/api/contacts.api.js`. Contacts are a system
/// separate from SocialApi's friends/follow endpoints (see
/// server/src/controllers/contact.controller.js) — do not merge them.
/// The backend has no decline/remove endpoints for contacts (only `/`,
/// `/requests/incoming`, `/request/:userId`, `/:requestId/accept` are
/// routed — see contact.routes.js), so there's nothing to mirror for those.
class ContactsApi {
  final Dio _dio;

  ContactsApi(this._dio);

  Future<List<AppUser>> fetchContacts() async {
    final res = await _dio.get<List<dynamic>>('/contacts');
    return res.data!.map((e) => AppUser.fromJson(e as Map<String, dynamic>)).toList();
  }

  Future<List<IncomingRequest>> fetchIncomingRequests() async {
    final res = await _dio.get<List<dynamic>>('/contacts/requests/incoming');
    return res.data!.map((e) => IncomingRequest.fromJson(e as Map<String, dynamic>)).toList();
  }

  Future<SocialRequest> sendContactRequest(String userId) async {
    final res = await _dio.post<Map<String, dynamic>>('/contacts/request/$userId');
    return SocialRequest.fromJson(res.data!);
  }

  Future<SocialRequest> acceptContactRequest(String requestId) async {
    final res = await _dio.post<Map<String, dynamic>>('/contacts/$requestId/accept');
    return SocialRequest.fromJson(res.data!);
  }

  Future<List<AppUser>> searchUsers(String query) async {
    final res = await _dio.get<List<dynamic>>('/users/search', queryParameters: {'q': query});
    return res.data!.map((e) => AppUser.fromJson(e as Map<String, dynamic>)).toList();
  }
}

final contactsApiProvider = Provider<ContactsApi>((ref) => ContactsApi(ref.read(dioProvider)));
