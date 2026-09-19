/// Covers both the backend's `publicUser` shape (id, name, username, email,
/// phone, avatarUrl, avatarColor, bio, status, lastSeenAt) and its richer
/// `fullUser` shape (adds coverPhotoUrl, work, education, location, links,
/// profileVisibility) — every field beyond `id`/`name`/`username` is
/// nullable/defaulted so this one class works for both without a subtype.
class AppUser {
  final String id;
  final String name;
  final String username;
  final String? email;
  final String? phone;
  final String? avatarUrl;
  final String avatarColor;
  final String? bio;
  final String status;
  final DateTime? lastSeenAt;
  final String? coverPhotoUrl;
  final String? work;
  final String? education;
  final String? location;
  final List<UserLink> links;
  final String? profileVisibility;

  const AppUser({
    required this.id,
    required this.name,
    required this.username,
    this.email,
    this.phone,
    this.avatarUrl,
    this.avatarColor = '#C77D2E',
    this.bio,
    this.status = 'offline',
    this.lastSeenAt,
    this.coverPhotoUrl,
    this.work,
    this.education,
    this.location,
    this.links = const [],
    this.profileVisibility,
  });

  bool get isOnline => status == 'online';

  factory AppUser.fromJson(Map<String, dynamic> json) => AppUser(
        id: json['id'] as String,
        name: json['name'] as String? ?? '',
        username: json['username'] as String? ?? '',
        email: json['email'] as String?,
        phone: json['phone'] as String?,
        avatarUrl: json['avatarUrl'] as String?,
        avatarColor: json['avatarColor'] as String? ?? '#C77D2E',
        bio: json['bio'] as String?,
        status: json['status'] as String? ?? 'offline',
        lastSeenAt: json['lastSeenAt'] != null ? DateTime.tryParse(json['lastSeenAt'] as String) : null,
        coverPhotoUrl: json['coverPhotoUrl'] as String?,
        work: json['work'] as String?,
        education: json['education'] as String?,
        location: json['location'] as String?,
        links: (json['links'] as List<dynamic>?)
                ?.map((e) => UserLink.fromJson(e as Map<String, dynamic>))
                .toList() ??
            const [],
        profileVisibility: json['profileVisibility'] as String?,
      );

  Map<String, dynamic> toJson() => {
        'id': id,
        'name': name,
        'username': username,
        'email': email,
        'phone': phone,
        'avatarUrl': avatarUrl,
        'avatarColor': avatarColor,
        'bio': bio,
        'status': status,
        'lastSeenAt': lastSeenAt?.toIso8601String(),
        'coverPhotoUrl': coverPhotoUrl,
        'work': work,
        'education': education,
        'location': location,
        'links': links.map((l) => l.toJson()).toList(),
        'profileVisibility': profileVisibility,
      };

  AppUser copyWith({String? status, DateTime? lastSeenAt}) => AppUser(
        id: id,
        name: name,
        username: username,
        email: email,
        phone: phone,
        avatarUrl: avatarUrl,
        avatarColor: avatarColor,
        bio: bio,
        status: status ?? this.status,
        lastSeenAt: lastSeenAt ?? this.lastSeenAt,
        coverPhotoUrl: coverPhotoUrl,
        work: work,
        education: education,
        location: location,
        links: links,
        profileVisibility: profileVisibility,
      );
}

class UserLink {
  final String label;
  final String url;

  const UserLink({required this.label, required this.url});

  factory UserLink.fromJson(Map<String, dynamic> json) =>
      UserLink(label: json['label'] as String? ?? '', url: json['url'] as String? ?? '');

  Map<String, dynamic> toJson() => {'label': label, 'url': url};
}
