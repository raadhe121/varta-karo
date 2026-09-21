import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../models/user.dart';
import '../data/contacts_api.dart';
import 'contacts_provider.dart';

/// The "actions" layer on top of contactsProvider — equivalent of the web
/// app's contacts.api.js calls plus Sidebar.jsx/ContactSearch.jsx/
/// ContactRequests.jsx's imperative bits.
class ContactsActions {
  final Ref _ref;

  ContactsActions(this._ref);

  Future<void> loadContacts() async {
    final contacts = await _ref.read(contactsApiProvider).fetchContacts();
    _ref.read(contactsProvider.notifier).setContacts(contacts);
  }

  Future<void> loadIncomingRequests() async {
    final requests = await _ref.read(contactsApiProvider).fetchIncomingRequests();
    _ref.read(contactsProvider.notifier).setIncomingRequests(requests);
  }

  Future<void> sendContactRequest(String userId) => _ref.read(contactsApiProvider).sendContactRequest(userId);

  /// Accepting locally turns the requester into a contact, matching
  /// ContactRequests.jsx's onAccepted -> refresh-the-contacts-list flow,
  /// without a second round trip.
  Future<void> acceptContactRequest(String requestId, AppUser requester) async {
    await _ref.read(contactsApiProvider).acceptContactRequest(requestId);
    _ref.read(contactsProvider.notifier).removeIncomingRequest(requestId);
    _ref.read(contactsProvider.notifier).addContact(requester);
  }

  Future<List<AppUser>> searchUsers(String query) => _ref.read(contactsApiProvider).searchUsers(query);
}

final contactsActionsProvider = Provider<ContactsActions>((ref) => ContactsActions(ref));
