import { useEffect, useState } from 'react';
import { View, Text, ActivityIndicator, StyleSheet } from 'react-native';
import { fetchMyActivity } from '../../api/social.api';
import { colors, radius } from '../../config/theme';

const TYPE_LABEL = { post: 'You posted', like: 'You liked', comment: 'You commented' };

function formatDate(dateStr) {
  return new Date(dateStr).toLocaleString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
}

export default function ActivityLog() {
  const [entries, setEntries] = useState(null);

  useEffect(() => {
    fetchMyActivity().then(setEntries);
  }, []);

  if (!entries) return <ActivityIndicator style={{ marginTop: 20 }} color={colors.accent} />;
  if (entries.length === 0) return <Text style={styles.empty}>Nothing here yet.</Text>;

  return (
    <View style={{ gap: 8 }}>
      {entries.map((entry, i) => (
        <View key={i} style={styles.row}>
          <View style={{ flex: 1 }}>
            <Text style={styles.type}>{TYPE_LABEL[entry.type]}</Text>
            <Text style={styles.summary} numberOfLines={1}>
              {entry.summary}
            </Text>
          </View>
          <Text style={styles.date}>{formatDate(entry.createdAt)}</Text>
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', justifyContent: 'space-between', backgroundColor: colors.paper, borderRadius: radius.lg, padding: 12, gap: 8 },
  type: { fontSize: 13, fontWeight: '700', color: colors.ink },
  summary: { fontSize: 12, color: colors.inkSoft, marginTop: 2 },
  date: { fontSize: 11, color: colors.inkSoft },
  empty: { fontSize: 13, color: colors.inkSoft, textAlign: 'center', marginTop: 20 },
});
