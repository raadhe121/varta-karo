import { useEffect, useState } from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import Avatar from '../common/Avatar';
import { fetchIncomingRequests, acceptContactRequest } from '../../api/contacts.api';
import { colors, radius } from '../../config/theme';

export default function ContactRequests({ onAccepted }) {
  const [requests, setRequests] = useState([]);

  const load = () => fetchIncomingRequests().then(setRequests);

  useEffect(() => {
    load();
  }, []);

  const accept = async (request) => {
    await acceptContactRequest(request.id);
    setRequests((prev) => prev.filter((r) => r.id !== request.id));
    onAccepted?.(request.requester);
  };

  if (requests.length === 0) return null;

  return (
    <View style={{ marginBottom: 12 }}>
      <Text style={styles.sectionLabel}>Requests</Text>
      {requests.map((r) => (
        <View key={r.id} style={styles.row}>
          <Avatar user={r.requester} size="sm" />
          <View style={styles.textCol}>
            <Text style={styles.name}>{r.requester.name}</Text>
            <Text style={styles.username}>@{r.requester.username}</Text>
          </View>
          <Pressable style={styles.acceptButton} onPress={() => accept(r)}>
            <Text style={styles.acceptButtonText}>Accept</Text>
          </Pressable>
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  sectionLabel: { fontSize: 11, fontWeight: '700', color: colors.inkSoft, textTransform: 'uppercase', marginBottom: 6 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 8 },
  textCol: { flex: 1 },
  name: { fontSize: 14, fontWeight: '600', color: colors.ink },
  username: { fontSize: 12, color: colors.inkSoft },
  acceptButton: { backgroundColor: colors.accent, borderRadius: radius.md, paddingHorizontal: 12, paddingVertical: 6 },
  acceptButtonText: { fontSize: 12, fontWeight: '700', color: colors.white },
});
