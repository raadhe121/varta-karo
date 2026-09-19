import { View, Text, Image, StyleSheet } from 'react-native';
import { colors } from '../../config/theme';

const SIZES = { sm: 32, md: 40, lg: 80 };
const FONT_SIZES = { sm: 12, md: 15, lg: 28 };

function initials(name = '') {
  const parts = name.trim().split(/\s+/);
  if (parts.length === 0 || !parts[0]) return '?';
  return (parts[0][0] + (parts[1]?.[0] || '')).toUpperCase();
}

export default function Avatar({ user, size = 'md', showStatus = false, isOnline = false }) {
  const dim = SIZES[size] || SIZES.md;

  return (
    <View style={{ width: dim, height: dim }}>
      {user?.avatarUrl ? (
        <Image source={{ uri: user.avatarUrl }} style={[styles.circle, { width: dim, height: dim }]} />
      ) : (
        <View style={[styles.circle, styles.monogram, { width: dim, height: dim }]}>
          <Text style={{ color: colors.white, fontWeight: '700', fontSize: FONT_SIZES[size] || FONT_SIZES.md }}>
            {initials(user?.name)}
          </Text>
        </View>
      )}
      {showStatus && (
        <View
          style={[
            styles.statusDot,
            { backgroundColor: isOnline ? colors.success : colors.inkSoft, right: 0, bottom: 0 },
          ]}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  circle: {
    borderRadius: 999,
  },
  monogram: {
    backgroundColor: colors.accent,
    alignItems: 'center',
    justifyContent: 'center',
  },
  statusDot: {
    position: 'absolute',
    width: 12,
    height: 12,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: colors.paper,
  },
});
