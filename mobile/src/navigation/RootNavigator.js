import { useEffect } from 'react';
import { View, ActivityIndicator } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import AuthNavigator from './AuthNavigator';
import MainTabs from './MainTabs';
import { useAuthStore } from '../store/authStore';
import { colors } from '../config/theme';

export default function RootNavigator() {
  const user = useAuthStore((s) => s.user);
  const hydrated = useAuthStore((s) => s.hydrated);
  const hydrate = useAuthStore((s) => s.hydrate);

  useEffect(() => {
    hydrate();
  }, [hydrate]);

  if (!hydrated) {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.page }}>
        <ActivityIndicator size="large" color={colors.accent} />
      </View>
    );
  }

  return <NavigationContainer>{user ? <MainTabs /> : <AuthNavigator />}</NavigationContainer>;
}
