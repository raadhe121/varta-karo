import { Pressable, Text, StyleSheet, ActivityIndicator } from 'react-native';
import { colors, radius } from '../../config/theme';

const VARIANTS = {
  primary: { bg: colors.accent, text: colors.white, border: 'transparent' },
  outline: { bg: 'transparent', text: colors.ink, border: colors.line },
  ghost: { bg: 'transparent', text: colors.ink, border: 'transparent' },
};

export default function Button({ title, onPress, variant = 'primary', disabled, loading, style }) {
  const v = VARIANTS[variant];
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled || loading}
      style={({ pressed }) => [
        styles.base,
        { backgroundColor: v.bg, borderColor: v.border, opacity: disabled || loading ? 0.5 : pressed ? 0.85 : 1 },
        style,
      ]}
    >
      {loading ? <ActivityIndicator color={v.text} /> : <Text style={[styles.text, { color: v.text }]}>{title}</Text>}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    paddingVertical: 12,
    paddingHorizontal: 18,
    borderRadius: radius.md,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  text: {
    fontWeight: '600',
    fontSize: 15,
  },
});
