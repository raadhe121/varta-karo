import { View, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors } from '../../config/theme';

export default function Screen({ children, style, edges }) {
  return (
    <SafeAreaView edges={edges} style={[styles.root, style]}>
      <View style={styles.flex}>{children}</View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.page },
  flex: { flex: 1 },
});
