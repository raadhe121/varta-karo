import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../models/social_request.dart';
import '../../../models/user.dart';

class ContactsState {
  final List<AppUser> contacts;
  final List<IncomingRequest> incomingRequests;
  final bool loaded;

  const ContactsState({this.contacts = const [], this.incomingRequests = const [], this.loaded = false});

  ContactsState copyWith({List<AppUser>? contacts, List<IncomingRequest>? incomingRequests, bool? loaded}) =>
      ContactsState(
        contacts: contacts ?? this.contacts,
        incomingRequests: incomingRequests ?? this.incomingRequests,
        loaded: loaded ?? this.loaded,
      );
}

/// Pure contacts state — fed by ContactsActions (REST). Same split as
/// feedProvider/FeedActions.
class ContactsNotifier extends Notifier<ContactsState> {
  @override
  ContactsState build() => const ContactsState();

  void setContacts(List<AppUser> contacts) {
    state = state.copyWith(contacts: contacts, loaded: true);
  }

  void setIncomingRequests(List<IncomingRequest> requests) {
    state = state.copyWith(incomingRequests: requests);
  }

  void removeIncomingRequest(String requestId) {
    state = state.copyWith(incomingRequests: state.incomingRequests.where((r) => r.id != requestId).toList());
  }

  void addContact(AppUser user) {
    if (state.contacts.any((c) => c.id == user.id)) return;
    state = state.copyWith(contacts: [...state.contacts, user]);
  }
}

final contactsProvider = NotifierProvider<ContactsNotifier, ContactsState>(ContactsNotifier.new);
