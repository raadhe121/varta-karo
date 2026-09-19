import { useState } from 'react';
import { View, Text, Pressable, ScrollView, StyleSheet } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import Screen from '../../components/common/Screen';
import Input from '../../components/common/Input';
import Button from '../../components/common/Button';
import { useAuthStore } from '../../store/authStore';
import { updateMe } from '../../api/contacts.api';
import { uploadMedia } from '../../api/chat.api';
import { colors, radius } from '../../config/theme';

function linksToText(links) {
  return (links || []).map((l) => l.url).join('\n');
}
function textToLinks(text) {
  return text
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean)
    .map((url) => ({ label: url.replace(/^https?:\/\//, '').split('/')[0], url }));
}

const VISIBILITY_OPTIONS = [
  { id: 'public', label: 'Public' },
  { id: 'friends', label: 'Friends' },
  { id: 'only_me', label: 'Only me' },
];

export default function EditProfileScreen({ navigation }) {
  const user = useAuthStore((s) => s.user);
  const updateUser = useAuthStore((s) => s.updateUser);

  const [form, setForm] = useState({
    name: user?.name || '',
    bio: user?.bio || '',
    work: user?.work || '',
    education: user?.education || '',
    location: user?.location || '',
    links: linksToText(user?.links),
    profileVisibility: user?.profileVisibility || 'public',
  });
  const [saving, setSaving] = useState(false);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [uploadingCover, setUploadingCover] = useState(false);

  const set = (key) => (value) => setForm((f) => ({ ...f, [key]: value }));

  const pickAndUpload = async (field, setBusy) => {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) return;
    const result = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ['images'], quality: 0.8 });
    if (result.canceled) return;
    const asset = result.assets[0];
    setBusy(true);
    try {
      const uploaded = await uploadMedia({ uri: asset.uri, name: asset.fileName || 'photo.jpg', type: asset.mimeType || 'image/jpeg' });
      const updated = await updateMe({ [field]: uploaded.url });
      updateUser(updated);
    } finally {
      setBusy(false);
    }
  };

  const save = async () => {
    setSaving(true);
    try {
      const updated = await updateMe({
        name: form.name,
        bio: form.bio,
        work: form.work,
        education: form.education,
        location: form.location,
        links: textToLinks(form.links),
        profileVisibility: form.profileVisibility,
      });
      updateUser(updated);
      navigation.goBack();
    } finally {
      setSaving(false);
    }
  };

  return (
    <Screen>
      <View style={styles.header}>
        <Text style={styles.title}>Edit profile</Text>
        <Pressable onPress={() => navigation.goBack()}>
          <Text style={styles.close}>Cancel</Text>
        </Pressable>
      </View>
      <ScrollView contentContainerStyle={styles.body}>
        <View style={styles.photoRow}>
          <Button title={uploadingAvatar ? 'Uploading...' : 'Change photo'} variant="outline" onPress={() => pickAndUpload('avatarUrl', setUploadingAvatar)} loading={uploadingAvatar} />
          <Button title={uploadingCover ? 'Uploading...' : 'Change cover'} variant="outline" onPress={() => pickAndUpload('coverPhotoUrl', setUploadingCover)} loading={uploadingCover} />
        </View>

        <Input label="Name" placeholder="Your name" value={form.name} onChangeText={set('name')} style={styles.field} />
        <Input label="Bio" placeholder="A short bio" value={form.bio} onChangeText={set('bio')} multiline style={styles.field} />

        <Text style={styles.sectionLabel}>About</Text>
        <Input label="Work" placeholder="e.g. Product Designer at Acme" value={form.work} onChangeText={set('work')} style={styles.field} />
        <Input label="Education" placeholder="e.g. NID Ahmedabad" value={form.education} onChangeText={set('education')} style={styles.field} />
        <Input label="Location" placeholder="e.g. Bengaluru, India" value={form.location} onChangeText={set('location')} style={styles.field} />
        <Input label="Links (one per line)" placeholder="https://example.com" value={form.links} onChangeText={set('links')} multiline style={styles.field} />

        <Text style={styles.sectionLabel}>Who can see your About info</Text>
        <View style={styles.visibilityRow}>
          {VISIBILITY_OPTIONS.map((opt) => (
            <Pressable
              key={opt.id}
              style={[styles.visibilityOption, form.profileVisibility === opt.id && styles.visibilityOptionActive]}
              onPress={() => set('profileVisibility')(opt.id)}
            >
              <Text style={[styles.visibilityOptionText, form.profileVisibility === opt.id && styles.visibilityOptionTextActive]}>{opt.label}</Text>
            </Pressable>
          ))}
        </View>

        <Button title={saving ? 'Saving...' : 'Save'} onPress={save} loading={saving} style={{ marginTop: 20 }} />
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 16, borderBottomWidth: 1, borderBottomColor: colors.line },
  title: { fontSize: 18, fontWeight: '800', color: colors.ink },
  close: { color: colors.accent, fontWeight: '600' },
  body: { padding: 16, paddingBottom: 60 },
  photoRow: { flexDirection: 'row', gap: 10, marginBottom: 16 },
  field: { marginBottom: 14 },
  sectionLabel: { fontSize: 11, fontWeight: '700', color: colors.inkSoft, textTransform: 'uppercase', marginBottom: 10, marginTop: 4 },
  visibilityRow: { flexDirection: 'row', gap: 8 },
  visibilityOption: { flex: 1, paddingVertical: 10, borderRadius: radius.md, borderWidth: 1, borderColor: colors.line, alignItems: 'center' },
  visibilityOptionActive: { backgroundColor: colors.accent, borderColor: colors.accent },
  visibilityOptionText: { fontSize: 13, color: colors.ink, fontWeight: '600' },
  visibilityOptionTextActive: { color: colors.white },
});
