import { View, Text, TextInput, StyleSheet } from 'react-native';
import { colors, radius } from '../../config/theme';

export default function Input({ label, error, style, ...props }) {
  return (
    <View style={style}>
      {label && <Text style={styles.label}>{label}</Text>}
      <TextInput placeholderTextColor={colors.inkSoft} style={styles.input} {...props} />
      {error && <Text style={styles.error}>{error}</Text>}
    </View>
  );
}

const styles = StyleSheet.create({
  label: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.ink,
    marginBottom: 6,
  },
  input: {
    borderWidth: 1,
    borderColor: colors.line,
    backgroundColor: colors.paper,
    borderRadius: radius.md,
    paddingHorizontal: 14,
    paddingVertical: 11,
    fontSize: 15,
    color: colors.ink,
  },
  error: {
    fontSize: 12,
    color: colors.danger,
    marginTop: 4,
  },
});
